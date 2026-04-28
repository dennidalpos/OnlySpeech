param(
  [switch]$SkipInstall,
  [switch]$SkipPack,
  [switch]$SkipPackagedLifecycle,
  [switch]$EnablePackagedAutomation,
  [switch]$SkipSmokeStart,
  [switch]$KeepOutputs,
  [switch]$CleanWorkstationData,
  [switch]$ForceRefreshDependencies,
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$packagedExe = Join-Path $repoRoot "artifacts\packages\win-unpacked\OnlySpeech.exe"
$packagesRoot = Join-Path $repoRoot "artifacts\packages"
$doctorScript = Join-Path $repoRoot "scripts\internal\workspace\doctor.ps1"
$sourceLauncherScript = Join-Path $repoRoot "scripts\internal\runtime\start-local.ps1"
$packageCoreScript = Join-Path $repoRoot "scripts\internal\packaging\package-core.ps1"
$packagedLifecycleScript = Join-Path $repoRoot "scripts\internal\commissioning\test-packaged-install-lifecycle.ps1"
$packagedAutomationScript = Join-Path $repoRoot "scripts\internal\commissioning\test-packaged-runtime-automation.ps1"
$cleanWorkstationScript = Join-Path $repoRoot "scripts\public\clean-workstation.ps1"

function Get-PackagedAppProcesses {
  if (-not (Test-Path -LiteralPath $packagedExe)) {
    return @()
  }

  return @(Get-CimInstance Win32_Process -Filter "Name = 'OnlySpeech.exe'" |
      Where-Object { $_.ExecutablePath -eq $packagedExe })
}

function Stop-PackagedAppProcesses {
  $processes = @(Get-PackagedAppProcesses | Sort-Object ProcessId -Descending)
  foreach ($process in $processes) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }

  if ($processes.Count -gt 0) {
    Start-Sleep -Seconds 2
  }
}

function Invoke-PackagedSmokeStart {
  if ($DryRun) {
    Write-Host "[smoke-start] $packagedExe"
    return
  }

  if (-not (Test-Path -LiteralPath $packagedExe)) {
    throw "Packaged executable not found at $packagedExe"
  }

  $appProcess = Start-Process -FilePath $packagedExe `
    -WorkingDirectory $repoRoot `
    -PassThru

  Start-Sleep -Seconds 8

  try {
    $appProcess.Refresh()
    $runningProcesses = @(Get-PackagedAppProcesses)
    if ($appProcess.HasExited -and $appProcess.ExitCode -ne 0) {
      throw "Packaged smoke app exited with code $($appProcess.ExitCode)"
    }
    $resolvedAppProcess = $runningProcesses | Select-Object -First 1
    if ($null -eq $resolvedAppProcess) {
      throw "OnlySpeech packaged process did not start."
    }

    Write-Host "[smoke-start] OK pid=$($resolvedAppProcess.ProcessId)"
  } finally {
    Stop-PackagedAppProcesses
  }
}

function Get-UnpackedArchivePath {
  param(
    [string]$RepoRoot,
    [string]$PackagesRoot
  )

  $packageJson = Get-Content -LiteralPath (Join-Path $RepoRoot "package.json") -Raw | ConvertFrom-Json
  $productName = if ([string]::IsNullOrWhiteSpace([string]$packageJson.build.productName)) {
    [string]$packageJson.name
  } else {
    [string]$packageJson.build.productName
  }

  return Join-Path $PackagesRoot "$productName-$($packageJson.version)-x64-unpacked.zip"
}

function Invoke-UnpackedArchiveRetention {
  param(
    [string]$RepoRoot,
    [string]$PackagesRoot,
    [switch]$DryRun
  )

  $unpackedPath = Join-Path $PackagesRoot "win-unpacked"
  $archivePath = Get-UnpackedArchivePath -RepoRoot $RepoRoot -PackagesRoot $PackagesRoot

  Write-Host "[archive-unpacked] $archivePath"
  if ($DryRun) {
    return
  }

  if (-not (Test-Path -LiteralPath $unpackedPath)) {
    throw "Unpacked package directory not found at $unpackedPath"
  }

  if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force -ErrorAction Stop
  }

  Compress-Archive -Path (Join-Path $unpackedPath "*") -DestinationPath $archivePath -Force
  Remove-Item -LiteralPath $unpackedPath -Recurse -Force -ErrorAction Stop
}

try {
  Stop-PackagedAppProcesses
  Invoke-OnlySpeechStep -Label "clean" -FilePath "npm" -Arguments @("run", "clean:repo") -WorkingDirectory $repoRoot -DryRun:$DryRun

  if ($CleanWorkstationData) {
    Invoke-OnlySpeechStep -Label "clean-workstation" -FilePath "powershell.exe" -Arguments @(
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      $cleanWorkstationScript
    ) -WorkingDirectory $repoRoot -DryRun:$DryRun
  }

  if (-not $SkipInstall) {
    if (-not $DryRun) {
      Wait-OnlySpeechRepoProcessRelease -RepoRoot $repoRoot -Operation "run bootstrap"
    }

    $bootstrapArguments = @("run", "bootstrap")
    if ($ForceRefreshDependencies) {
      $bootstrapArguments += "--"
      $bootstrapArguments += "-ForceRefresh"
    }

    Invoke-OnlySpeechStep -Label "bootstrap" -FilePath "npm" -Arguments $bootstrapArguments -WorkingDirectory $repoRoot -DryRun:$DryRun
  }

  Invoke-OnlySpeechStep -Label "doctor" -FilePath "powershell.exe" -Arguments @(
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $doctorScript
  ) -WorkingDirectory $repoRoot -DryRun:$DryRun
  Invoke-OnlySpeechStep -Label "test" -FilePath "npm" -Arguments @("test") -WorkingDirectory $repoRoot -DryRun:$DryRun
  if (-not $SkipSmokeStart) {
    Invoke-OnlySpeechStep -Label "smoke-start-source" -FilePath "powershell.exe" -Arguments @(
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      $sourceLauncherScript,
      "-Smoke",
      "-SmokeTimeoutMs",
      "8000"
    ) -WorkingDirectory $repoRoot -DryRun:$DryRun
  }
  Invoke-OnlySpeechStep -Label "build" -FilePath "npm" -Arguments @("run", "build") -WorkingDirectory $repoRoot -DryRun:$DryRun
  Invoke-OnlySpeechStep -Label "test-e2e" -FilePath "npm" -Arguments @("run", "test:e2e") -WorkingDirectory $repoRoot -DryRun:$DryRun
  Invoke-OnlySpeechStep -Label "audit-packaging" -FilePath "npm" -Arguments @("run", "audit:packaging") -WorkingDirectory $repoRoot -DryRun:$DryRun

  if (-not $SkipPack) {
    Invoke-OnlySpeechStep -Label "package-internal" -FilePath "powershell.exe" -Arguments @(
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      $packageCoreScript,
      "-Profile",
      "Internal"
    ) -WorkingDirectory $repoRoot -DryRun:$DryRun

    if (-not $SkipPackagedLifecycle) {
      $packagedLifecycleArguments = @(
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        $packagedLifecycleScript
      )
      if ($SkipSmokeStart) {
        $packagedLifecycleArguments += "-SkipLaunches"
      }

      Invoke-OnlySpeechStep -Label "packaged-lifecycle" -FilePath "powershell" -Arguments $packagedLifecycleArguments -WorkingDirectory $repoRoot -DryRun:$DryRun
    } elseif (-not $SkipSmokeStart) {
      Invoke-PackagedSmokeStart
    }

    if ($EnablePackagedAutomation) {
      $packagedAutomationArguments = @(
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        $packagedAutomationScript
      )

      Invoke-OnlySpeechStep -Label "packaged-runtime-automation" -FilePath "powershell" -Arguments $packagedAutomationArguments -WorkingDirectory $repoRoot -DryRun:$DryRun
    }

    Invoke-UnpackedArchiveRetention -RepoRoot $repoRoot -PackagesRoot $packagesRoot -DryRun:$DryRun
    Invoke-OnlySpeechStep -Label "release-evidence" -FilePath "npm" -Arguments @("run", "release:evidence") -WorkingDirectory $repoRoot -DryRun:$DryRun
    Invoke-OnlySpeechStep -Label "release-compliance" -FilePath "npm" -Arguments @("run", "release:compliance") -WorkingDirectory $repoRoot -DryRun:$DryRun
  }

  if (-not $DryRun) {
    Write-Host "[handover] Run npm run commission:template to refresh artifacts/logs/target-station-validation.json, then run npm run commission:handover after target-station provisioning to capture doctor output, runtime-log inventory/export details, and the remaining commissioning checklist in artifacts/logs/commissioning-evidence.json."
  }
} finally {
  Stop-PackagedAppProcesses
  if ($KeepOutputs) {
    Write-Host "[clean-final] skipped because -KeepOutputs was requested"
  } else {
    Invoke-OnlySpeechStep -Label "clean-final" -FilePath "npm" -Arguments @("run", "clean:repo") -WorkingDirectory $repoRoot -DryRun:$DryRun
  }
}

