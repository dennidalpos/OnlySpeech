param(
  [string]$PackageRoot = "",
  [string]$InstallRoot = "",
  [string]$LiveValidationAppDataPath = "",
  [switch]$SkipLaunches,
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$resolvedPackageRoot = if ([string]::IsNullOrWhiteSpace($PackageRoot)) { Join-Path $repoRoot "artifacts\packages" } else { $PackageRoot }
$defaultInstallRoot = Join-Path $repoRoot "artifacts\build\install-lifecycle"
$resolvedInstallRoot = if ([string]::IsNullOrWhiteSpace($InstallRoot)) { $defaultInstallRoot } else { $InstallRoot }

function Write-Step {
  param([string]$Label, [string]$Message)
  Write-Host "[$Label] $Message"
}

function Assert-PathExists {
  param([string]$LiteralPath, [string]$Label)

  if (-not (Test-Path -LiteralPath $LiteralPath)) {
    throw "$Label not found: $LiteralPath"
  }
}

function Invoke-ProcessStep {
  param(
    [string]$Label,
    [string]$FilePath,
    [string[]]$Arguments = @(),
    [string]$WorkingDirectory = $repoRoot
  )

  Write-Step -Label $Label -Message "$FilePath $($Arguments -join ' ')".Trim()

  if ($DryRun) {
    return
  }

  $process = Start-Process -FilePath $FilePath -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -Wait -PassThru
  if ($process.ExitCode -ne 0) {
    throw "$Label failed with exit code $($process.ExitCode)"
  }
}

function Get-OnlySpeechProcesses {
  param([string]$ExpectedPath)

  if (-not (Test-Path -LiteralPath $ExpectedPath)) {
    return @()
  }

  return @(
    Get-CimInstance Win32_Process -Filter "Name = 'OnlySpeech.exe'" -ErrorAction SilentlyContinue |
      Where-Object { $_.ExecutablePath -eq $ExpectedPath }
  )
}

function Stop-OnlySpeechProcesses {
  param([string]$ExpectedPath)

  $processes = @(Get-OnlySpeechProcesses -ExpectedPath $ExpectedPath | Sort-Object ProcessId -Descending)
  foreach ($process in $processes) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }

  if ($processes.Count -gt 0) {
    Start-Sleep -Seconds 2
  }
}

function Get-OnlySpeechProcessesUnderDirectory {
  param([string]$InstallDirectory)

  $resolvedInstallDirectory = [System.IO.Path]::GetFullPath($InstallDirectory).TrimEnd('\')
  return @(
    Get-CimInstance Win32_Process -Filter "Name = 'OnlySpeech.exe'" -ErrorAction SilentlyContinue |
      Where-Object {
        -not [string]::IsNullOrWhiteSpace($_.ExecutablePath) -and
        $_.ExecutablePath.StartsWith("$resolvedInstallDirectory\", [System.StringComparison]::OrdinalIgnoreCase)
      }
  )
}

function Stop-OnlySpeechProcessesUnderDirectory {
  param([string]$InstallDirectory)

  $processes = @(Get-OnlySpeechProcessesUnderDirectory -InstallDirectory $InstallDirectory | Sort-Object ProcessId -Descending)
  foreach ($process in $processes) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }

  if ($processes.Count -gt 0) {
    Start-Sleep -Seconds 2
  }
}

function Assert-InstallDirectoryScope {
  param([string]$InstallDirectory)

  $resolvedLifecycleRoot = [System.IO.Path]::GetFullPath($resolvedInstallRoot).TrimEnd('\')
  $resolvedInstallDirectory = [System.IO.Path]::GetFullPath($InstallDirectory).TrimEnd('\')
  $expectedPrefix = "$resolvedLifecycleRoot\"

  if ($resolvedInstallDirectory -ne $resolvedLifecycleRoot -and -not $resolvedInstallDirectory.StartsWith($expectedPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Install directory '$resolvedInstallDirectory' is outside the allowed lifecycle root '$resolvedLifecycleRoot'."
  }
}

function Get-InstallDirectorySnapshot {
  param([string]$InstallDirectory)

  if (-not (Test-Path -LiteralPath $InstallDirectory)) {
    return "missing"
  }

  $items = @(
    Get-ChildItem -LiteralPath $InstallDirectory -Force -ErrorAction SilentlyContinue |
      Sort-Object FullName |
      Select-Object -First 8
  )

  if ($items.Count -eq 0) {
    return "present-empty"
  }

  return ($items | ForEach-Object {
    $kind = if ($_.PSIsContainer) { "dir" } else { "file" }
    "${kind}:$($_.Name)"
  }) -join ", "
}

function Write-LifecycleDiagnostics {
  param(
    [string]$LabelPrefix,
    [string]$InstallerPath,
    [string]$InstallDirectory,
    [string]$Reason
  )

  $snapshot = Get-InstallDirectorySnapshot -InstallDirectory $InstallDirectory
  $installedExe = Join-Path $InstallDirectory "OnlySpeech.exe"
  $uninstallerPath = Resolve-UninstallerPath -InstallDirectory $InstallDirectory
  $processSummary = @(
    Get-OnlySpeechProcessesUnderDirectory -InstallDirectory $InstallDirectory |
      ForEach-Object { "pid=$($_.ProcessId) path=$($_.ExecutablePath)" }
  )

  if ($processSummary.Count -eq 0) {
    $processSummary = @("none")
  }

  Write-Step -Label "$LabelPrefix-diagnostics" -Message (
    "reason=$Reason installer=$InstallerPath installDir=$InstallDirectory contents=$snapshot installedExeExists=" +
    (Test-Path -LiteralPath $installedExe) +
    " uninstaller=" + ($(if ([string]::IsNullOrWhiteSpace($uninstallerPath)) { "missing" } else { $uninstallerPath })) +
    " processes=" + ($processSummary -join "; ")
  )
}

function Reset-InstallDirectory {
  param(
    [string]$LabelPrefix,
    [string]$InstallDirectory
  )

  Assert-InstallDirectoryScope -InstallDirectory $InstallDirectory
  Write-Step -Label "$LabelPrefix-reset" -Message $InstallDirectory

  if ($DryRun) {
    return
  }

  $maxAttempts = 3
  for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    Stop-OnlySpeechProcessesUnderDirectory -InstallDirectory $InstallDirectory

    if (Test-Path -LiteralPath $InstallDirectory) {
      Remove-Item -LiteralPath $InstallDirectory -Recurse -Force -ErrorAction SilentlyContinue
    }

    $remainingSnapshot = Get-InstallDirectorySnapshot -InstallDirectory $InstallDirectory
    if ($remainingSnapshot -eq "missing" -or $remainingSnapshot -eq "present-empty") {
      New-Item -ItemType Directory -Path $InstallDirectory -Force | Out-Null
      return
    }

    if ($attempt -lt $maxAttempts) {
      Start-Sleep -Seconds 2
      continue
    }

    Write-LifecycleDiagnostics -LabelPrefix $LabelPrefix -InstallerPath "<reset>" -InstallDirectory $InstallDirectory -Reason "install-root not cleared after reset"
    throw "$LabelPrefix-reset failed because install directory '$InstallDirectory' still contains residual items after $maxAttempts attempts."
  }
}

function Invoke-InstallerStep {
  param(
    [string]$LabelPrefix,
    [string]$InstallerPath,
    [string]$InstallDirectory
  )

  $installLabel = "$LabelPrefix-install"
  $installArguments = @("/S", "/D=$InstallDirectory")
  $installedExe = Join-Path $InstallDirectory "OnlySpeech.exe"
  $workingDirectory = Split-Path -Parent $InstallerPath

  if ($DryRun) {
    Invoke-ProcessStep -Label $installLabel -FilePath $InstallerPath -Arguments $installArguments -WorkingDirectory $workingDirectory
    return
  }

  Write-Step -Label $installLabel -Message "$InstallerPath $($installArguments -join ' ')".Trim()

  $maxAttempts = 2
  for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    $process = Start-Process -FilePath $InstallerPath -ArgumentList $installArguments -WorkingDirectory $workingDirectory -Wait -PassThru
    if ($process.ExitCode -eq 0 -and (Test-Path -LiteralPath $installedExe)) {
      return
    }

    $reason = if ($process.ExitCode -ne 0) {
      "installer exited with code $($process.ExitCode) on attempt $attempt of $maxAttempts"
    } else {
      "installer exited successfully but '$installedExe' was not created on attempt $attempt of $maxAttempts"
    }

    Write-LifecycleDiagnostics -LabelPrefix $LabelPrefix -InstallerPath $InstallerPath -InstallDirectory $InstallDirectory -Reason $reason
    if ($attempt -ge $maxAttempts) {
      throw "$installLabel failed: $reason"
    }

    Write-Step -Label "$LabelPrefix-install-retry" -Message "retrying after verified cleanup"
    Reset-InstallDirectory -LabelPrefix $LabelPrefix -InstallDirectory $InstallDirectory
  }
}

function Invoke-LaunchValidation {
  param(
    [string]$Label,
    [string]$ExecutablePath,
    [string]$WorkingDirectory
  )

  Write-Step -Label $Label -Message $ExecutablePath

  if ($SkipLaunches -or $DryRun) {
    return
  }

  Assert-PathExists -LiteralPath $ExecutablePath -Label $Label

  $process = Start-Process -FilePath $ExecutablePath -WorkingDirectory $WorkingDirectory -PassThru
  Start-Sleep -Seconds 8

  try {
    $process.Refresh()
    $resolved = @(Get-OnlySpeechProcesses -ExpectedPath $ExecutablePath)
    if ($process.HasExited -and $process.ExitCode -ne 0) {
      throw "$Label app exited with code $($process.ExitCode)"
    }
    if ($resolved.Count -eq 0) {
      throw "$Label app process was not detected at $ExecutablePath"
    }
  } finally {
    Stop-OnlySpeechProcesses -ExpectedPath $ExecutablePath
  }
}

function Resolve-UninstallerPath {
  param([string]$InstallDirectory)

  $match = Get-ChildItem -LiteralPath $InstallDirectory -Filter "Uninstall*.exe" -File -Recurse -ErrorAction SilentlyContinue |
    Sort-Object FullName |
    Select-Object -First 1

  if ($null -eq $match) {
    return ""
  }

  return $match.FullName
}

function Invoke-InstallerLifecycle {
  param(
    [string]$LabelPrefix,
    [string]$InstallerPath,
    [string]$InstallDirectory
  )

  if (-not $DryRun) {
    Assert-PathExists -LiteralPath $InstallerPath -Label "$LabelPrefix installer"
  }
  Assert-InstallDirectoryScope -InstallDirectory $InstallDirectory
  Reset-InstallDirectory -LabelPrefix $LabelPrefix -InstallDirectory $InstallDirectory

  Invoke-InstallerStep -LabelPrefix $LabelPrefix -InstallerPath $InstallerPath -InstallDirectory $InstallDirectory

  $installedExe = Join-Path $InstallDirectory "OnlySpeech.exe"
  if (-not $DryRun) {
    Assert-PathExists -LiteralPath $installedExe -Label "$LabelPrefix installed executable"
  }

  Invoke-LaunchValidation -Label "$LabelPrefix-launch" -ExecutablePath $installedExe -WorkingDirectory $InstallDirectory

  $uninstallerPath = if ($DryRun) { Join-Path $InstallDirectory "Uninstall OnlySpeech.exe" } else { Resolve-UninstallerPath -InstallDirectory $InstallDirectory }
  if (-not $DryRun) {
    Assert-PathExists -LiteralPath $uninstallerPath -Label "$LabelPrefix uninstaller"
  }

  Invoke-ProcessStep -Label "$LabelPrefix-uninstall" -FilePath $uninstallerPath -Arguments @("/S") -WorkingDirectory $InstallDirectory

  if (-not $DryRun) {
    Start-Sleep -Seconds 2
  }
}

$packageMetadata = Get-Content -LiteralPath (Join-Path $repoRoot "package.json") -Raw | ConvertFrom-Json
$packageVersion = [string]$packageMetadata.version
$unpackedExe = Join-Path $resolvedPackageRoot "win-unpacked\OnlySpeech.exe"
$portableExe = $null
$currentInstaller = $null

if (Test-Path -LiteralPath $resolvedPackageRoot) {
  $portableExe = Get-ChildItem -LiteralPath $resolvedPackageRoot -Filter "*portable*.exe" -File -ErrorAction SilentlyContinue |
    Sort-Object Name |
    Select-Object -First 1
  $currentInstaller = Get-ChildItem -LiteralPath $resolvedPackageRoot -Filter "*.exe" -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notmatch "portable" } |
    Sort-Object Name |
    Select-Object -First 1
}

if ($DryRun) {
  if ($null -eq $portableExe) {
    $portableExe = [pscustomobject]@{
      FullName = (Join-Path $resolvedPackageRoot "OnlySpeech-$packageVersion-x64-portable.exe")
    }
  }

  if ($null -eq $currentInstaller) {
    $currentInstaller = [pscustomobject]@{
      FullName = (Join-Path $resolvedPackageRoot "OnlySpeech-$packageVersion-x64-setup.exe")
    }
  }
} else {
  Assert-PathExists -LiteralPath $resolvedPackageRoot -Label "Package root"
  Assert-PathExists -LiteralPath $unpackedExe -Label "win-unpacked executable"
  if ($null -eq $portableExe) {
    throw "Portable package not found under $resolvedPackageRoot"
  }
  if ($null -eq $currentInstaller) {
    throw "Installer package not found under $resolvedPackageRoot"
  }
}

Write-Step -Label "layout" -Message "installer=$($currentInstaller.FullName) portable=$($portableExe.FullName) unpacked=$unpackedExe"
Invoke-LaunchValidation -Label "unpacked-launch" -ExecutablePath $unpackedExe -WorkingDirectory (Split-Path -Parent $unpackedExe)
Invoke-InstallerLifecycle -LabelPrefix "current" -InstallerPath $currentInstaller.FullName -InstallDirectory (Join-Path $resolvedInstallRoot "current")
