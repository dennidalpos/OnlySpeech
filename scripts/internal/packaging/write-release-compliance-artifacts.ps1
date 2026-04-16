param(
  [string]$PackagesRoot = "",
  [string]$NoticesOutputPath = "",
  [string]$SbomOutputPath = ""
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

function Get-SortedFiles {
  param([string]$RootPath)

  return @(Get-ChildItem -LiteralPath $RootPath -Recurse -File | Sort-Object FullName)
}

function Get-PackageMetadata {
  param([string]$RepoRoot)

  $packageJson = Get-Content -LiteralPath (Join-Path $RepoRoot "package.json") -Raw | ConvertFrom-Json
  return [ordered]@{
    name = [string]$packageJson.name
    version = [string]$packageJson.version
    productName = if ([string]::IsNullOrWhiteSpace([string]$packageJson.build.productName)) {
      [string]$packageJson.name
    } else {
      [string]$packageJson.build.productName
    }
  }
}

function Encode-PurlName {
  param([string]$Name)

  if ($Name.StartsWith("@")) {
    $parts = $Name.Split("/")
    return "$([System.Uri]::EscapeDataString($parts[0]))/$([System.Uri]::EscapeDataString($parts[1]))"
  }

  return [System.Uri]::EscapeDataString($Name)
}

function New-CycloneDxLicense {
  param([string]$License)

  if ($License -match "^[A-Za-z0-9-.+]+$") {
    return [ordered]@{ license = [ordered]@{ id = $License } }
  }

  return [ordered]@{ license = [ordered]@{ name = $License } }
}

function Get-LockfilePackages {
  param([string]$LockfilePath)

  $nodeScript = @'
const fs = require("fs");

function resolvePackageName(packagePath, metadata) {
  const explicitName = typeof metadata.name === "string" ? metadata.name.trim() : "";
  if (explicitName) {
    return explicitName;
  }

  const normalizedPath = packagePath.replace(/\\/g, "/");
  const segments = normalizedPath.split("node_modules/").filter(Boolean);
  const lastSegment = segments.length > 0 ? segments[segments.length - 1] : normalizedPath;
  const parts = lastSegment.split("/");
  if (parts.length >= 2 && parts[0].startsWith("@")) {
    return `${parts[0]}/${parts[1]}`;
  }

  return parts[0];
}

function encodePurlName(name) {
  if (name.startsWith("@")) {
    const [scope, pkg] = name.split("/");
    return `${encodeURIComponent(scope)}/${encodeURIComponent(pkg)}`;
  }

  return encodeURIComponent(name);
}

const lockfile = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const packages = lockfile.packages || {};
const rootPackage = packages[""] || {};
const directDependencyNames = new Set([
  ...Object.keys(rootPackage.dependencies || {}),
  ...Object.keys(rootPackage.devDependencies || {})
]);

const entries = Object.keys(packages)
  .filter((packagePath) => packagePath !== "")
  .sort()
  .map((packagePath) => {
    const metadata = packages[packagePath] || {};
    const normalizedPath = packagePath.replace(/\\/g, "/");
    const name = resolvePackageName(packagePath, metadata);
    const version = typeof metadata.version === "string" && metadata.version ? metadata.version : "0.0.0";

    return {
      name,
      version,
      path: normalizedPath,
      license: typeof metadata.license === "string" && metadata.license ? metadata.license : "UNKNOWN",
      dev: Boolean(metadata.dev),
      direct: directDependencyNames.has(name),
      resolved: metadata.resolved ?? null,
      integrity: metadata.integrity ?? null,
      purl: `pkg:npm/${encodePurlName(name)}@${encodeURIComponent(version)}`
    };
  });

process.stdout.write(JSON.stringify(entries));
'@

  $temporaryScriptPath = Join-Path ([System.IO.Path]::GetTempPath()) ("onlyspeech-lockfile-parser-" + [System.Guid]::NewGuid().ToString("N") + ".cjs")
  try {
    Write-OnlySpeechUtf8File -Path $temporaryScriptPath -Content $nodeScript
    $rawJson = & node $temporaryScriptPath $LockfilePath
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to parse package-lock.json through Node.js."
    }
  } finally {
    Remove-Item -LiteralPath $temporaryScriptPath -Force -ErrorAction SilentlyContinue
  }

  return @($rawJson | ConvertFrom-Json)
}

function New-ThirdPartyNotices {
  param(
    $PackageMetadata,
    [object[]]$Packages
  )

  $licenseCounts = @{}
  foreach ($package in $Packages) {
    $licenseCounts[$package.license] = ([int]($licenseCounts[$package.license])) + 1
  }

  return [ordered]@{
    schema_version = 1
    application = $PackageMetadata
    summary = [ordered]@{
      package_count = $Packages.Count
      direct_dependencies = @($Packages | Where-Object { $_.direct }).Count
      transitive_dependencies = @($Packages | Where-Object { -not $_.direct }).Count
      licenses = @(
        $licenseCounts.Keys |
          Sort-Object |
          ForEach-Object {
            [ordered]@{
              license = $_
              count = [int]$licenseCounts[$_]
            }
          }
      )
    }
    packages = @(
      $Packages | ForEach-Object {
        [ordered]@{
          name = $_.name
          version = $_.version
          path = $_.path
          license = $_.license
          dependency_type = if ($_.dev) { "development" } else { "production" }
          direct = $_.direct
          resolved = $_.resolved
          integrity = $_.integrity
        }
      }
    )
  }
}

function New-CycloneDxSbom {
  param(
    $PackageMetadata,
    [object[]]$Packages,
    [object[]]$ArtifactFiles
  )

  $metadataProperties = @(
    [ordered]@{
      name = "onlyspeech:source"
      value = "package-lock.json"
    }
  )

  for ($index = 0; $index -lt $ArtifactFiles.Count; $index += 1) {
    $file = $ArtifactFiles[$index]
    $metadataProperties += @(
      [ordered]@{ name = "onlyspeech:artifact:${index}:path"; value = $file.path },
      [ordered]@{ name = "onlyspeech:artifact:${index}:sha256"; value = $file.sha256 },
      [ordered]@{ name = "onlyspeech:artifact:${index}:size_bytes"; value = [string]$file.size_bytes }
    )
  }

  return [ordered]@{
    bomFormat = "CycloneDX"
    specVersion = "1.6"
    version = 1
    metadata = [ordered]@{
      component = [ordered]@{
        type = "application"
        name = $PackageMetadata.productName
        version = $PackageMetadata.version
        purl = "pkg:npm/$(Encode-PurlName -Name $PackageMetadata.name)@$([System.Uri]::EscapeDataString($PackageMetadata.version))"
      }
      properties = @($metadataProperties)
    }
    components = @(
      $Packages | ForEach-Object {
        $properties = @(
          [ordered]@{ name = "onlyspeech:path"; value = $_.path },
          [ordered]@{ name = "onlyspeech:direct"; value = [string]$_.direct }
        )

        if ($_.resolved) {
          $properties += [ordered]@{ name = "onlyspeech:resolved"; value = $_.resolved }
        }

        if ($_.integrity) {
          $properties += [ordered]@{ name = "onlyspeech:integrity"; value = $_.integrity }
        }

        [ordered]@{
          type = "library"
          name = $_.name
          version = $_.version
          "bom-ref" = "$($_.purl)?path=$([System.Uri]::EscapeDataString($_.path))"
          purl = $_.purl
          scope = if ($_.dev) { "excluded" } else { "required" }
          licenses = @((New-CycloneDxLicense -License $_.license))
          properties = @($properties)
        }
      }
    )
  }
}

function New-ReleaseComplianceArtifacts {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot),
    [string]$PackagesRoot = "",
    [string]$NoticesOutputPath = "",
    [string]$SbomOutputPath = ""
  )

  $resolvedPackagesRoot = if ([string]::IsNullOrWhiteSpace($PackagesRoot)) { Join-Path $RepoRoot "artifacts\packages" } else { $PackagesRoot }
  $resolvedNoticesOutputPath = if ([string]::IsNullOrWhiteSpace($NoticesOutputPath)) { Join-Path $RepoRoot "artifacts\logs\third-party-notices.json" } else { $NoticesOutputPath }
  $resolvedSbomOutputPath = if ([string]::IsNullOrWhiteSpace($SbomOutputPath)) { Join-Path $RepoRoot "artifacts\logs\sbom.cdx.json" } else { $SbomOutputPath }

  $packageMetadata = Get-PackageMetadata -RepoRoot $RepoRoot
  $packages = Get-LockfilePackages -LockfilePath (Join-Path $RepoRoot "package-lock.json")
  $artifactFiles = @(
    Get-SortedFiles -RootPath $resolvedPackagesRoot | ForEach-Object {
      [ordered]@{
        path = Get-OnlySpeechRepoRelativePath -RepoRoot $RepoRoot -AbsolutePath $_.FullName
        size_bytes = $_.Length
        sha256 = Get-OnlySpeechFileSha256 -Path $_.FullName
      }
    }
  )

  if ($artifactFiles.Count -eq 0) {
    throw "No packaged artifacts were found under $resolvedPackagesRoot."
  }

  $notices = New-ThirdPartyNotices -PackageMetadata $packageMetadata -Packages $packages
  $sbom = New-CycloneDxSbom -PackageMetadata $packageMetadata -Packages $packages -ArtifactFiles $artifactFiles

  New-Item -ItemType Directory -Path (Split-Path -Parent $resolvedNoticesOutputPath) -Force | Out-Null
  New-Item -ItemType Directory -Path (Split-Path -Parent $resolvedSbomOutputPath) -Force | Out-Null
  Write-OnlySpeechUtf8File -Path $resolvedNoticesOutputPath -Content ($notices | ConvertTo-Json -Depth 10)
  Write-OnlySpeechUtf8File -Path $resolvedSbomOutputPath -Content ($sbom | ConvertTo-Json -Depth 12)

  return [ordered]@{
    noticesOutputPath = $resolvedNoticesOutputPath
    sbomOutputPath = $resolvedSbomOutputPath
    notices = $notices
    sbom = $sbom
  }
}

function Invoke-ReleaseComplianceArtifactsWrite {
  param(
    [string]$PackagesRoot,
    [string]$NoticesOutputPath,
    [string]$SbomOutputPath
  )

  $repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
  $resolvedPackagesRoot = if ([string]::IsNullOrWhiteSpace($PackagesRoot)) { Join-Path $repoRoot "artifacts\packages" } else { (Resolve-Path -LiteralPath $PackagesRoot).Path }
  $resolvedNoticesOutputPath = if ([string]::IsNullOrWhiteSpace($NoticesOutputPath)) { Join-Path $repoRoot "artifacts\logs\third-party-notices.json" } else { $NoticesOutputPath }
  $resolvedSbomOutputPath = if ([string]::IsNullOrWhiteSpace($SbomOutputPath)) { Join-Path $repoRoot "artifacts\logs\sbom.cdx.json" } else { $SbomOutputPath }

  $result = New-ReleaseComplianceArtifacts `
    -RepoRoot $repoRoot `
    -PackagesRoot $resolvedPackagesRoot `
    -NoticesOutputPath $resolvedNoticesOutputPath `
    -SbomOutputPath $resolvedSbomOutputPath

  [Console]::Out.WriteLine(
    "Release compliance artifacts written to $(Get-OnlySpeechRepoRelativePath -RepoRoot $repoRoot -AbsolutePath $result.noticesOutputPath) and $(Get-OnlySpeechRepoRelativePath -RepoRoot $repoRoot -AbsolutePath $result.sbomOutputPath)."
  )
  exit 0
}

if ($MyInvocation.InvocationName -ne ".") {
  Invoke-ReleaseComplianceArtifactsWrite -PackagesRoot $PackagesRoot -NoticesOutputPath $NoticesOutputPath -SbomOutputPath $SbomOutputPath
}

