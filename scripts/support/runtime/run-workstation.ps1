param(
  [switch]$SkipInstall,
  [switch]$SkipDoctor,
  [switch]$PreferPackaged,
  [switch]$SkipBuild,
  [switch]$OpenSetupWizard,
  [ValidateSet("stations", "provider", "languages", "diagnostics", "license")]
  [string]$WizardSection = "stations",
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$packagedExe = Join-Path $repoRoot "artifacts\packages\win-unpacked\OnlySpeech.exe"
$compiledEntryPoint = Join-Path $repoRoot "dist\main\bootstrap.js"
$doctorScript = Join-Path $repoRoot "scripts\support\workspace\doctor.ps1"
$sourceLauncherScript = Join-Path $repoRoot "scripts\support\runtime\start-local.ps1"

if (-not $SkipInstall) {
  Wait-OnlySpeechRepoProcessRelease -RepoRoot $repoRoot -Operation "run bootstrap"
  Invoke-OnlySpeechStep -Label "bootstrap" -FilePath "npm" -Arguments @("run", "bootstrap") -WorkingDirectory $repoRoot -DryRun:$DryRun
}

if (-not $SkipDoctor) {
  Invoke-OnlySpeechStep -Label "doctor" -FilePath "powershell.exe" -Arguments @(
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $doctorScript
  ) -WorkingDirectory $repoRoot -DryRun:$DryRun
}

if ($PreferPackaged -and (Test-Path $packagedExe)) {
  $packagedArguments = @()
  if ($OpenSetupWizard) {
    $packagedArguments += "--setup-wizard"
    $packagedArguments += "--wizard-section"
    $packagedArguments += $WizardSection
  }

  $argumentText = if ($packagedArguments.Count -gt 0) { " " + ($packagedArguments -join " ") } else { "" }
  Write-Host "[start] $packagedExe$argumentText"
  if (-not $DryRun) {
    if ($packagedArguments.Count -gt 0) {
      Start-Process -FilePath $packagedExe -ArgumentList $packagedArguments -WorkingDirectory $repoRoot
    } else {
      Start-Process -FilePath $packagedExe -WorkingDirectory $repoRoot
    }
  }
  exit 0
}

if ($PreferPackaged -and -not (Test-Path $packagedExe)) {
  Write-Warning "Packaged executable not found at $packagedExe. Falling back to local app startup."
}

if (-not $PreferPackaged -and -not $SkipBuild -and -not (Test-Path $compiledEntryPoint)) {
  Invoke-OnlySpeechStep -Label "build" -FilePath "npm" -Arguments @("run", "compile") -WorkingDirectory $repoRoot -DryRun:$DryRun
}

$startArguments = @(
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $sourceLauncherScript
)
if ($OpenSetupWizard) {
  $startArguments += "-SetupWizard"
  $startArguments += "-WizardSection"
  $startArguments += $WizardSection
}

Invoke-OnlySpeechStep -Label "start" -FilePath "powershell.exe" -Arguments $startArguments -WorkingDirectory $repoRoot -DryRun:$DryRun

