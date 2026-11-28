param(
  [string]$PackagesRoot = "",
  [string]$LogsRoot = "",
  [string]$OutputRoot = "",
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

function Get-CustomerBundleApplicationMetadata {
  param([string]$RepoRoot)

  $packageJson = Get-Content -LiteralPath (Join-Path $RepoRoot "package.json") -Raw | ConvertFrom-Json
  $productName = if ([string]::IsNullOrWhiteSpace([string]$packageJson.build.productName)) {
    [string]$packageJson.name
  } else {
    [string]$packageJson.build.productName
  }

  return [ordered]@{
    name = [string]$packageJson.name
    version = [string]$packageJson.version
    productName = $productName
    author = [string]$packageJson.author
  }
}

function Get-RequiredPackagePaths {
  param(
    [string]$PackagesRoot,
    [string]$ProductName,
    [string]$Version
  )

  return [ordered]@{
    installer = Join-Path $PackagesRoot "$ProductName-$Version-x64-setup.exe"
    portable = Join-Path $PackagesRoot "$ProductName-$Version-x64-portable.exe"
    unpackedDirectory = Join-Path $PackagesRoot "win-unpacked"
    unpackedArchive = Join-Path $PackagesRoot "$ProductName-$Version-x64-unpacked.zip"
  }
}

function Get-BuyerFacingDocuments {
  param([string]$RepoRoot)

  return @(
    [ordered]@{
      SourcePath = Join-Path $RepoRoot "docs\customer-bundle\Customer_Quick_Start.md"
      RelativePath = "customer-docs\customer-quick-start.md"
    },
    [ordered]@{
      SourcePath = Join-Path $RepoRoot "docs\customer-bundle\Support_and_Fulfillment_Policy.md"
      RelativePath = "customer-docs\support-and-fulfillment-policy.md"
    },
    [ordered]@{
      SourcePath = Join-Path $RepoRoot "docs\customer-bundle\Terms_And_License_Baseline.md"
      RelativePath = "customer-docs\terms-and-license-baseline.md"
    },
    [ordered]@{
      SourcePath = Join-Path $RepoRoot "docs\customer-bundle\Privacy_Policy_Baseline.md"
      RelativePath = "customer-docs\privacy-policy-baseline.md"
    },
    [ordered]@{
      SourcePath = Join-Path $RepoRoot "docs\customer-bundle\AI_Disclosure_Copy.md"
      RelativePath = "customer-docs\ai-disclosure-copy.md"
    },
    [ordered]@{
      SourcePath = Join-Path $RepoRoot "docs\customer-bundle\B2B_DPA_Baseline.md"
      RelativePath = "customer-docs\b2b-dpa-baseline.md"
    },
    [ordered]@{
      SourcePath = Join-Path $RepoRoot "docs\customer-bundle\Operator_Privacy_Deployment_Guidance.md"
      RelativePath = "customer-docs\operator-privacy-deployment-guidance.md"
    }
  )
}

function Get-InternalEvidenceDocuments {
  param([string]$LogsRoot)

  return @(
    [ordered]@{
      SourcePath = Join-Path $LogsRoot "release-evidence.json"
      RelativePath = "internal-evidence\release-evidence.json"
    },
    [ordered]@{
      SourcePath = Join-Path $LogsRoot "third-party-notices.json"
      RelativePath = "internal-evidence\third-party-notices.json"
    },
    [ordered]@{
      SourcePath = Join-Path $LogsRoot "sbom.cdx.json"
      RelativePath = "internal-evidence\sbom.cdx.json"
    }
  )
}

function Get-RelativeBundlePath {
  param(
    [string]$BundleRoot,
    [string]$AbsolutePath
  )

  $bundleRootWithSeparator = [System.IO.Path]::GetFullPath($BundleRoot)
  if (-not $bundleRootWithSeparator.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
    $bundleRootWithSeparator += [System.IO.Path]::DirectorySeparatorChar
  }

  $bundleUri = New-Object System.Uri($bundleRootWithSeparator)
  $fileUri = New-Object System.Uri([System.IO.Path]::GetFullPath($AbsolutePath))
  return [System.Uri]::UnescapeDataString($bundleUri.MakeRelativeUri($fileUri).ToString())
}

function Test-OnlySpeechPathWithinRoot {
  param(
    [string]$RootPath,
    [string]$CandidatePath
  )

  $resolvedRoot = [System.IO.Path]::GetFullPath($RootPath)
  if (-not $resolvedRoot.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
    $resolvedRoot += [System.IO.Path]::DirectorySeparatorChar
  }

  $resolvedCandidate = [System.IO.Path]::GetFullPath($CandidatePath)
  return $resolvedCandidate.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)
}

function Copy-BundleFile {
  param(
    [string]$SourcePath,
    [string]$DestinationPath,
    [switch]$DryRun
  )

  if ($DryRun) {
    return
  }

  New-Item -ItemType Directory -Path (Split-Path -Parent $DestinationPath) -Force | Out-Null
  Copy-Item -LiteralPath $SourcePath -Destination $DestinationPath -Force
}

function Write-BundleUnpackedArchive {
  param(
    [hashtable]$PackageTargets,
    [string]$DestinationPath,
    [switch]$DryRun
  )

  if ($DryRun) {
    return
  }

  New-Item -ItemType Directory -Path (Split-Path -Parent $DestinationPath) -Force | Out-Null

  if (Test-Path -LiteralPath $DestinationPath) {
    Remove-Item -LiteralPath $DestinationPath -Force
  }

  if (Test-Path -LiteralPath $PackageTargets.unpackedArchive) {
    Copy-Item -LiteralPath $PackageTargets.unpackedArchive -Destination $DestinationPath -Force
    return
  }

  Compress-Archive -Path (Join-Path $PackageTargets.unpackedDirectory "*") -DestinationPath $DestinationPath -Force
}

function Write-BundleChecklist {
  param(
    [string]$ChecklistPath,
    [hashtable]$Application,
    [string]$BundleRoot,
    [hashtable]$PackageTargets,
    [object[]]$BuyerDocuments,
    [object[]]$InternalEvidence,
    [switch]$DryRun
  )

  $installerName = Split-Path -Leaf $PackageTargets.installer
  $portableName = Split-Path -Leaf $PackageTargets.portable
  $unpackedName = "$($Application.productName)-$($Application.version)-x64-unpacked.zip"
  $includedEvidence = @($InternalEvidence | Where-Object { $_.Included })

  $checklist = @"
# Publish Checklist

Bundle: $($Application.productName)-$($Application.version)-customer-release

1. Confirm the bundle contains `packages\$installerName`, `packages\$portableName`, and `packages\$unpackedName`.
2. Confirm the buyer quick-start is sourced from `customer-docs\customer-quick-start.md` and matches the packaged delivery flow.
3. Confirm buyer-facing legal material includes `customer-docs\terms-and-license-baseline.md`, `customer-docs\privacy-policy-baseline.md`, and `customer-docs\support-and-fulfillment-policy.md`.
4. Confirm the AI notice and deployment guidance used in the handover pack match `customer-docs\ai-disclosure-copy.md` and `customer-docs\operator-privacy-deployment-guidance.md`.
5. Confirm the release is still within the documented desktop/B2B, customer-provided-credentials baseline.
6. Confirm buyer-facing material stays within the provider-owned Azure/OpenAI playback baseline and does not market workstation-managed local TTS fallback.
7. Confirm seller-facing marketplace collateral remains outside this buyer bundle, and any retained internal release evidence stays under `internal-evidence/`.
8. Deliver the installer and portable executable to the customer channel, and keep the unpacked archive for controlled handover or technical support.

Internal evidence retained in this bundle:
"@

  if ($includedEvidence.Count -eq 0) {
    $checklist += "`r`n- none"
  } else {
    foreach ($item in $includedEvidence) {
      $checklist += "`r`n- $($item.RelativePath)"
    }
  }

  if (-not $DryRun) {
    Write-OnlySpeechUtf8File -Path $ChecklistPath -Content $checklist.TrimStart()
  }
}

function New-CustomerReleaseBundle {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot),
    [string]$PackagesRoot = "",
    [string]$LogsRoot = "",
    [string]$OutputRoot = "",
    [switch]$DryRun
  )

  $application = Get-CustomerBundleApplicationMetadata -RepoRoot $RepoRoot
  $resolvedPackagesRoot = if ([string]::IsNullOrWhiteSpace($PackagesRoot)) { Join-Path $RepoRoot "artifacts\packages" } else { (Resolve-Path -LiteralPath $PackagesRoot).Path }
  $resolvedLogsRoot = if ([string]::IsNullOrWhiteSpace($LogsRoot)) { Join-Path $RepoRoot "artifacts\logs" } else { (Resolve-Path -LiteralPath $LogsRoot).Path }
  $resolvedOutputRoot = if ([string]::IsNullOrWhiteSpace($OutputRoot)) { Join-Path $RepoRoot "artifacts\customer-release" } else { $OutputRoot }
  $bundleName = "$($application.productName)-$($application.version)-customer-release"
  $bundleRoot = Join-Path $resolvedOutputRoot $bundleName
  $packageTargets = Get-RequiredPackagePaths -PackagesRoot $resolvedPackagesRoot -ProductName $application.productName -Version $application.version

  foreach ($requiredPath in @($packageTargets.installer, $packageTargets.portable)) {
    if (-not $DryRun -and -not (Test-Path -LiteralPath $requiredPath)) {
      throw "Required packaged artifact not found: $requiredPath"
    }
  }

  $hasUnpackedDirectory = if ($DryRun) { $true } else { Test-Path -LiteralPath $packageTargets.unpackedDirectory }
  $hasUnpackedArchive = if ($DryRun) { $true } else { Test-Path -LiteralPath $packageTargets.unpackedArchive }
  if (-not $DryRun -and -not $hasUnpackedDirectory -and -not $hasUnpackedArchive) {
    throw "Required packaged artifact not found: $($packageTargets.unpackedDirectory) or $($packageTargets.unpackedArchive)"
  }

  $buyerDocuments = @(
    Get-BuyerFacingDocuments -RepoRoot $RepoRoot | ForEach-Object {
      if (-not (Test-Path -LiteralPath $_.SourcePath)) {
        throw "Required buyer-facing document not found: $($_.SourcePath)"
      }

      $_
    }
  )

  $internalEvidence = @(
    Get-InternalEvidenceDocuments -LogsRoot $resolvedLogsRoot | ForEach-Object {
      [ordered]@{
        SourcePath = $_.SourcePath
        RelativePath = $_.RelativePath
        Included = (Test-Path -LiteralPath $_.SourcePath)
      }
    }
  )

  $packageCopies = @(
    [ordered]@{
      SourcePath = $packageTargets.installer
      RelativePath = "packages\$(Split-Path -Leaf $packageTargets.installer)"
    },
    [ordered]@{
      SourcePath = $packageTargets.portable
      RelativePath = "packages\$(Split-Path -Leaf $packageTargets.portable)"
    }
  )

  $unpackedArchivePath = Join-Path $bundleRoot "packages\$($application.productName)-$($application.version)-x64-unpacked.zip"
  $manifestPath = Join-Path $bundleRoot "bundle-manifest.json"
  $checklistPath = Join-Path $bundleRoot "publish-checklist.md"

  if (-not $DryRun) {
    if (Test-Path -LiteralPath $bundleRoot) {
      if (-not (Test-OnlySpeechPathWithinRoot -RootPath $resolvedOutputRoot -CandidatePath $bundleRoot)) {
        throw "Bundle root '$bundleRoot' resolved outside the requested output root '$resolvedOutputRoot'."
      }

      Remove-Item -LiteralPath $bundleRoot -Recurse -Force
    }

    New-Item -ItemType Directory -Path (Join-Path $bundleRoot "packages") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $bundleRoot "customer-docs") -Force | Out-Null
    if (@($internalEvidence | Where-Object { $_.Included }).Count -gt 0) {
      New-Item -ItemType Directory -Path (Join-Path $bundleRoot "internal-evidence") -Force | Out-Null
    }
  }

  foreach ($item in $packageCopies) {
    Copy-BundleFile -SourcePath $item.SourcePath -DestinationPath (Join-Path $bundleRoot $item.RelativePath) -DryRun:$DryRun
  }

  foreach ($item in $buyerDocuments) {
    Copy-BundleFile -SourcePath $item.SourcePath -DestinationPath (Join-Path $bundleRoot $item.RelativePath) -DryRun:$DryRun
  }

  foreach ($item in $internalEvidence | Where-Object { $_.Included }) {
    Copy-BundleFile -SourcePath $item.SourcePath -DestinationPath (Join-Path $bundleRoot $item.RelativePath) -DryRun:$DryRun
  }

  Write-BundleUnpackedArchive -PackageTargets $packageTargets -DestinationPath $unpackedArchivePath -DryRun:$DryRun

  Write-BundleChecklist `
    -ChecklistPath $checklistPath `
    -Application $application `
    -BundleRoot $bundleRoot `
    -PackageTargets $packageTargets `
    -BuyerDocuments $buyerDocuments `
    -InternalEvidence $internalEvidence `
    -DryRun:$DryRun

  $manifest = [ordered]@{
    schema_version = 1
    generated_at = (Get-Date).ToString("s")
    bundle_name = $bundleName
    bundle_root = $bundleRoot
    application = $application
    packages_root = $resolvedPackagesRoot
    logs_root = $resolvedLogsRoot
    buyer_documents = @(
      $buyerDocuments | ForEach-Object {
        [ordered]@{
          source = Get-OnlySpeechRepoRelativePath -RepoRoot $RepoRoot -AbsolutePath $_.SourcePath
          bundled_as = $_.RelativePath
        }
      }
    )
    included_packages = @(
      $packageCopies | ForEach-Object {
        [ordered]@{
          source = Get-OnlySpeechRepoRelativePath -RepoRoot $RepoRoot -AbsolutePath $_.SourcePath
          bundled_as = $_.RelativePath
        }
      }
    ) + @(
      [ordered]@{
        source = Get-OnlySpeechRepoRelativePath -RepoRoot $RepoRoot -AbsolutePath $(if (-not $DryRun -and (Test-Path -LiteralPath $packageTargets.unpackedArchive)) { $packageTargets.unpackedArchive } else { $packageTargets.unpackedDirectory })
        bundled_as = "packages\$(Split-Path -Leaf $unpackedArchivePath)"
      }
    )
    internal_evidence = @(
      $internalEvidence | ForEach-Object {
        [ordered]@{
          source = if ($_.Included) { Get-OnlySpeechRepoRelativePath -RepoRoot $RepoRoot -AbsolutePath $_.SourcePath } else { $null }
          bundled_as = $_.RelativePath
          included = [bool]$_.Included
        }
      }
    )
  }

  if (-not $DryRun) {
    Write-OnlySpeechUtf8File -Path $manifestPath -Content ($manifest | ConvertTo-Json -Depth 8)
  }

  return [ordered]@{
    bundleRoot = $bundleRoot
    bundleName = $bundleName
    manifestPath = $manifestPath
    checklistPath = $checklistPath
    unpackedArchivePath = $unpackedArchivePath
    dryRun = [bool]$DryRun
    internalEvidenceIncluded = @($internalEvidence | Where-Object { $_.Included } | ForEach-Object { $_.RelativePath })
  }
}

function Invoke-CustomerReleaseBundleWrite {
  param(
    [string]$PackagesRoot,
    [string]$LogsRoot,
    [string]$OutputRoot,
    [switch]$DryRun
  )

  $repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
  $result = New-CustomerReleaseBundle -RepoRoot $repoRoot -PackagesRoot $PackagesRoot -LogsRoot $LogsRoot -OutputRoot $OutputRoot -DryRun:$DryRun
  [Console]::Out.WriteLine(($result | ConvertTo-Json -Depth 6))
  exit 0
}

if ($MyInvocation.InvocationName -ne ".") {
  Invoke-CustomerReleaseBundleWrite -PackagesRoot $PackagesRoot -LogsRoot $LogsRoot -OutputRoot $OutputRoot -DryRun:$DryRun
}

