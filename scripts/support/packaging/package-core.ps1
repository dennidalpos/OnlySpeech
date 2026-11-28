param(
  [string]$RepoRoot = "",
  [ValidateSet("Public", "Internal")]
  [string]$Profile = "Public",
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

function Copy-PackagingResourceScripts {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot),
    [switch]$DryRun
  )

  $sourcePath = Join-Path $RepoRoot "scripts\support\packaging\configure-power-settings.ps1"
  $targetPath = Join-Path $RepoRoot "build\configure-power-settings.ps1"
  $prerequisiteSourcePath = Join-Path $RepoRoot "scripts\support\packaging\assert-installer-prerequisites.ps1"
  $prerequisiteTargetPath = Join-Path $RepoRoot "build\assert-installer-prerequisites.ps1"

  if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "Installer power settings script not found at $sourcePath"
  }
  if (-not (Test-Path -LiteralPath $prerequisiteSourcePath)) {
    throw "Installer prerequisite script not found at $prerequisiteSourcePath"
  }

  if ($DryRun) {
    [Console]::Out.WriteLine("[packaging-resource] copy $sourcePath -> $targetPath")
    [Console]::Out.WriteLine("[packaging-resource] copy $prerequisiteSourcePath -> $prerequisiteTargetPath")
    return
  }

  Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force -ErrorAction Stop
  Copy-Item -LiteralPath $prerequisiteSourcePath -Destination $prerequisiteTargetPath -Force -ErrorAction Stop
}

function Get-WindowsPackTargets {
  param(
    [ValidateSet("Public", "Internal")]
    [string]$Profile = "Public"
  )

  if ($Profile -eq "Internal") {
    return @("nsis", "portable", "dir")
  }

  return @("nsis", "portable")
}

function Get-PackagingLineClassification {
  param(
    [string]$Line
  )

  if ($Line -match "(?i)\bwarning\b" -or $Line -match "(?i)deprecationwarning") {
    return [ordered]@{ type = "unexpected-warning" }
  }

  return [ordered]@{ type = "normal" }
}

function Get-PackCommandArgs {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot),
    [ValidateSet("Public", "Internal")]
    [string]$Profile = "Public"
  )

  return @(
    (Join-Path $RepoRoot "node_modules\electron-builder\cli.js"),
    "--publish",
    "never",
    "--win"
  ) + (Get-WindowsPackTargets -Profile $Profile)
}

function Get-PublicPackageCleanupPlan {
  param(
    [string]$PackagesRoot,
    [object[]]$Entries = @()
  )

  $normalizedEntries = if ($Entries.Count -gt 0) {
    @($Entries)
  } elseif (Test-Path -LiteralPath $PackagesRoot) {
    @(Get-ChildItem -LiteralPath $PackagesRoot -Force)
  } else {
    @()
  }

  $removals = @(
    $normalizedEntries | Where-Object {
      $_.PSIsContainer -or (
        $_.Name -notmatch "-setup\.exe$" -and
        $_.Name -notmatch "-portable\.exe$" -and
        $_.Name -notmatch "-unpacked\.zip$"
      )
    } | ForEach-Object {
      [pscustomobject]@{
        Name = $_.Name
        FullName = $_.FullName
        IsContainer = [bool]$_.PSIsContainer
      }
    }
  )

  return [pscustomobject]@{
    PackagesRoot = $PackagesRoot
    Removals = $removals
  }
}

function Get-PublicPackageArchiveName {
  param(
    [string]$PackagesRoot,
    [object[]]$Entries = @()
  )

  $normalizedEntries = if ($Entries.Count -gt 0) {
    @($Entries)
  } elseif (Test-Path -LiteralPath $PackagesRoot) {
    @(Get-ChildItem -LiteralPath $PackagesRoot -Force)
  } else {
    @()
  }

  $setupArtifact = @($normalizedEntries | Where-Object { -not $_.PSIsContainer -and $_.Name -match "-setup\.exe$" } | Sort-Object Name | Select-Object -First 1)
  if ($setupArtifact.Count -gt 0) {
    return ($setupArtifact[0].Name -replace "-setup\.exe$", "-unpacked.zip")
  }

  $portableArtifact = @($normalizedEntries | Where-Object { -not $_.PSIsContainer -and $_.Name -match "-portable\.exe$" } | Sort-Object Name | Select-Object -First 1)
  if ($portableArtifact.Count -gt 0) {
    return ($portableArtifact[0].Name -replace "-portable\.exe$", "-unpacked.zip")
  }

  return "OnlySpeech-unpacked.zip"
}

function Write-PublicPackageArchive {
  param(
    [string]$PackagesRoot,
    [switch]$DryRun
  )

  $unpackedRoot = Join-Path $PackagesRoot "win-unpacked"
  if (-not (Test-Path -LiteralPath $unpackedRoot)) {
    return $null
  }

  $entries = @(Get-ChildItem -LiteralPath $PackagesRoot -Force)
  $archiveName = Get-PublicPackageArchiveName -PackagesRoot $PackagesRoot -Entries $entries
  $archivePath = Join-Path $PackagesRoot $archiveName

  [Console]::Out.WriteLine("[package-cleanup] archive $archivePath")
  if (-not $DryRun) {
    if (Test-Path -LiteralPath $archivePath) {
      Remove-Item -LiteralPath $archivePath -Force -ErrorAction Stop
    }

    Compress-Archive -Path (Join-Path $unpackedRoot "*") -DestinationPath $archivePath -Force
  }

  return $archivePath
}

function Invoke-PublicPackageCleanup {
  param(
    [string]$PackagesRoot,
    [switch]$DryRun
  )

  Write-PublicPackageArchive -PackagesRoot $PackagesRoot -DryRun:$DryRun | Out-Null
  $plan = Get-PublicPackageCleanupPlan -PackagesRoot $PackagesRoot
  foreach ($entry in $plan.Removals) {
    [Console]::Out.WriteLine("[package-cleanup] remove $($entry.FullName)")
    if (-not $DryRun) {
      Remove-Item -LiteralPath $entry.FullName -Recurse -Force -ErrorAction Stop
    }
  }
}

function Invoke-RunPack {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot),
    [ValidateSet("Public", "Internal")]
    [string]$Profile = "Public",
    [switch]$DryRun
  )

  $resolvedRepoRoot = if ([string]::IsNullOrWhiteSpace($RepoRoot)) { Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot } else { $RepoRoot }
  $packagesRoot = Join-Path $resolvedRepoRoot "artifacts\packages"
  $packCommandArgs = @(Get-PackCommandArgs -RepoRoot $resolvedRepoRoot -Profile $Profile)
  $unexpectedWarnings = @()

  if ($DryRun) {
    [Console]::Out.WriteLine("[pack] profile=$Profile")
    [Console]::Out.WriteLine("[pack] node $($packCommandArgs -join ' ')")
    Copy-PackagingResourceScripts -RepoRoot $resolvedRepoRoot -DryRun
    return 0
  }

  Copy-PackagingResourceScripts -RepoRoot $resolvedRepoRoot
  & node $packCommandArgs 2>&1 | ForEach-Object {
    $line = "$_"
    $classification = Get-PackagingLineClassification -Line $line
    if ($classification.type -eq "unexpected-warning") {
      $unexpectedWarnings += $line
    }

    if ($_ -is [System.Management.Automation.ErrorRecord]) {
      [Console]::Error.WriteLine($line)
    } else {
      [Console]::Out.WriteLine($line)
    }
  }
  $exitCode = $LASTEXITCODE

  if ($unexpectedWarnings.Count -gt 0) {
    [Console]::Error.WriteLine("Unexpected packaging warning(s) detected:")
    foreach ($warning in $unexpectedWarnings) {
      [Console]::Error.WriteLine("- $warning")
    }

    return 1
  }

  if ($exitCode -eq 0 -and $Profile -eq "Public") {
    Invoke-PublicPackageCleanup -PackagesRoot $packagesRoot -DryRun:$DryRun
  }

  return $exitCode
}

if ($MyInvocation.InvocationName -ne ".") {
  $resolvedRepoRoot = if ([string]::IsNullOrWhiteSpace($RepoRoot)) { Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot } else { $RepoRoot }
  exit (Invoke-RunPack -RepoRoot $resolvedRepoRoot -Profile $Profile -DryRun:$DryRun)
}

