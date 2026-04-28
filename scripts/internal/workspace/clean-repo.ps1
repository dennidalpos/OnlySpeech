param(
  [switch]$KeepDependencies,
  [switch]$KeepEnvFile,
  [switch]$KeepWorkstationData,
  [switch]$KeepAutostart,
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$helpersPath = Join-Path $repoRoot "scripts\internal\lib\plans.ps1"

if (Test-Path -LiteralPath $helpersPath) {
  . $helpersPath
}

function Remove-PathIfPresent {
  param(
    [string]$TargetPath
  )

  if (-not (Test-Path -LiteralPath $TargetPath)) {
    Write-Host "[clean] not-present $TargetPath"
    return
  }

  Write-Host "[clean] remove $TargetPath"
  if (-not $DryRun) {
    Remove-Item -LiteralPath $TargetPath -Recurse -Force -ErrorAction Stop
  }
}

function Remove-OnlySpeechServiceRegistrations {
  $serviceMatches = @(
    Get-CimInstance Win32_Service -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -like "OnlySpeech*" -or $_.DisplayName -like "OnlySpeech*" }
  )

  foreach ($service in $serviceMatches) {
    Write-Host "[clean] service $($service.Name)"
    if ($DryRun) {
      continue
    }

    if ($service.State -ne "Stopped") {
      Stop-Service -Name $service.Name -Force -ErrorAction SilentlyContinue
      Start-Sleep -Milliseconds 500
    }

    & sc.exe delete $service.Name | Out-Null
  }
}

function Remove-OnlySpeechAutostartRunValue {
  $runKeyPath = "HKCU\Software\Microsoft\Windows\CurrentVersion\Run"
  $runValueName = "OnlySpeech"

  Write-Host "[clean] autostart-run-key $runValueName"
  if ($DryRun) {
    return
  }

  try {
    & reg.exe delete $runKeyPath /v $runValueName /f | Out-Null
  } catch {
    # Already absent is an acceptable clean state.
  }
}

$repoTargets = @(
  "dist",
  "artifacts",
  "coverage",
  "logs",
  "media",
  "screenshots",
  "test-results",
  "playwright-report",
  "blob-report",
  "agent-artifacts",
  "agent-analysis",
  ".local\logs",
  ".vite",
  ".npm-cache"
)

$tsbuildInfoFiles = @(Get-ChildItem -Path $repoRoot -Filter "*.tsbuildinfo" -File -ErrorAction SilentlyContinue)
foreach ($file in $tsbuildInfoFiles) {
  Write-Host "[clean] remove $($file.FullName)"
  if (-not $DryRun) {
    Remove-Item -LiteralPath $file.FullName -Force -ErrorAction Stop
  }
}

if (-not $KeepDependencies) {
  $repoTargets += "node_modules"
}

foreach ($relativePath in $repoTargets) {
  Remove-PathIfPresent -TargetPath (Join-Path $repoRoot $relativePath)
}

if (-not $KeepEnvFile) {
  Remove-PathIfPresent -TargetPath (Join-Path $repoRoot ".env")
}

if (-not $KeepAutostart) {
  Remove-OnlySpeechAutostartRunValue
  Remove-OnlySpeechServiceRegistrations
}

if (-not $KeepWorkstationData) {
  $resolvedLocalAppData = if (Get-Command Resolve-OnlySpeechCanonicalLocalAppDataPath -ErrorAction SilentlyContinue) {
    Resolve-OnlySpeechCanonicalLocalAppDataPath -LocalAppData $env:LOCALAPPDATA
  } else {
    $env:LOCALAPPDATA
  }

  $appDataPaths = @(
    if (-not [string]::IsNullOrWhiteSpace($resolvedLocalAppData)) {
      Join-Path $resolvedLocalAppData "OnlySpeech"
    }
  ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

  foreach ($targetPath in $appDataPaths) {
    Remove-PathIfPresent -TargetPath $targetPath
  }
}

