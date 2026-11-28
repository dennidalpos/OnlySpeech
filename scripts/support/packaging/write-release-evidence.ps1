param(
  [string]$PackagesRoot = "",
  [string]$OutputPath = ""
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

function Get-PackageMetadata {
  param([string]$RepoRoot)

  $packageJson = Get-Content -LiteralPath (Join-Path $RepoRoot "package.json") -Raw | ConvertFrom-Json
  return [ordered]@{
    name = [string]$packageJson.name
    version = [string]$packageJson.version
    productName = if ([string]::IsNullOrWhiteSpace([string]$packageJson.build.productName)) { [string]$packageJson.name } else { [string]$packageJson.build.productName }
    packagingTargets = @($packageJson.build.win.target)
  }
}

function Get-GitValue {
  param(
    [string[]]$Arguments,
    $Fallback = $null
  )

  try {
    return ((& git @Arguments 2>$null) | Out-String).Trim()
  } catch {
    return $Fallback
  }
}

function Get-SortedFiles {
  param([string]$RootPath)

  return @(Get-ChildItem -LiteralPath $RootPath -Recurse -File | Sort-Object FullName)
}

function New-ReleaseEvidence {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot),
    [string]$PackagesRoot = "",
    [string]$OutputPath = ""
  )

  $resolvedPackagesRoot = if ([string]::IsNullOrWhiteSpace($PackagesRoot)) { Join-Path $RepoRoot "artifacts\packages" } else { $PackagesRoot }
  $resolvedOutputPath = if ([string]::IsNullOrWhiteSpace($OutputPath)) { Join-Path $RepoRoot "artifacts\logs\release-evidence.json" } else { $OutputPath }

  $artifactFiles = @(Get-SortedFiles -RootPath $resolvedPackagesRoot)
  if ($artifactFiles.Count -eq 0) {
    throw "No packaged artifacts were found under $resolvedPackagesRoot."
  }

  $evidence = [ordered]@{
    schema_version = 1
    application = Get-PackageMetadata -RepoRoot $RepoRoot
    source = [ordered]@{
      git_sha = if (-not [string]::IsNullOrWhiteSpace($env:GITHUB_SHA)) { $env:GITHUB_SHA } else { Get-GitValue -Arguments @("rev-parse", "HEAD") }
      git_ref = if (-not [string]::IsNullOrWhiteSpace($env:GITHUB_REF_NAME)) { $env:GITHUB_REF_NAME } else { Get-GitValue -Arguments @("rev-parse", "--abbrev-ref", "HEAD") }
      git_tag = if ([string]::Equals($env:GITHUB_REF_TYPE, "tag", [System.StringComparison]::OrdinalIgnoreCase)) {
        if (-not [string]::IsNullOrWhiteSpace($env:GITHUB_REF_NAME)) { $env:GITHUB_REF_NAME } else { Get-GitValue -Arguments @("describe", "--tags", "--exact-match") }
      } else {
        Get-GitValue -Arguments @("describe", "--tags", "--exact-match")
      }
    }
    workflow = [ordered]@{
      repository = if ($env:GITHUB_REPOSITORY) { $env:GITHUB_REPOSITORY } else { $null }
      workflow = if ($env:GITHUB_WORKFLOW) { $env:GITHUB_WORKFLOW } else { $null }
      run_id = if ($env:GITHUB_RUN_ID) { $env:GITHUB_RUN_ID } else { $null }
      run_attempt = if ($env:GITHUB_RUN_ATTEMPT) { $env:GITHUB_RUN_ATTEMPT } else { $null }
    }
    artifacts = @(
      $artifactFiles | ForEach-Object {
        [ordered]@{
          path = Get-OnlySpeechRepoRelativePath -RepoRoot $RepoRoot -AbsolutePath $_.FullName
          size_bytes = $_.Length
          sha256 = Get-OnlySpeechFileSha256 -Path $_.FullName
        }
      }
    )
  }

  $outputDirectory = Split-Path -Parent $resolvedOutputPath
  if (-not [string]::IsNullOrWhiteSpace($outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
  }

  Write-OnlySpeechUtf8File -Path $resolvedOutputPath -Content ($evidence | ConvertTo-Json -Depth 8)

  return [ordered]@{
    outputPath = $resolvedOutputPath
    evidence = $evidence
  }
}

function Invoke-ReleaseEvidenceWrite {
  param(
    [string]$PackagesRoot,
    [string]$OutputPath
  )

  $repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
  $resolvedPackagesRoot = if ([string]::IsNullOrWhiteSpace($PackagesRoot)) { Join-Path $repoRoot "artifacts\packages" } else { (Resolve-Path -LiteralPath $PackagesRoot).Path }
  $resolvedOutputPath = if ([string]::IsNullOrWhiteSpace($OutputPath)) { Join-Path $repoRoot "artifacts\logs\release-evidence.json" } else { $OutputPath }

  $result = New-ReleaseEvidence -RepoRoot $repoRoot -PackagesRoot $resolvedPackagesRoot -OutputPath $resolvedOutputPath
  [Console]::Out.WriteLine("Release evidence written to $(Get-OnlySpeechRepoRelativePath -RepoRoot $repoRoot -AbsolutePath $result.outputPath).")
  exit 0
}

if ($MyInvocation.InvocationName -ne ".") {
  Invoke-ReleaseEvidenceWrite -PackagesRoot $PackagesRoot -OutputPath $OutputPath
}

