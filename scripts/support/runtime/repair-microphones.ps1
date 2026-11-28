param(
  [switch]$SkipInstall,
  [switch]$PreferPackaged,
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$launcherPath = Join-Path $PSScriptRoot "run-workstation.ps1"

$arguments = @(
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $launcherPath,
  "-SkipDoctor",
  "-OpenSetupWizard",
  "-WizardSection",
  "stations"
)

if ($SkipInstall) {
  $arguments += "-SkipInstall"
}

if ($PreferPackaged) {
  $arguments += "-PreferPackaged"
}

Write-Host ("[repair-microphones] powershell.exe " + ($arguments -join " "))

if ($DryRun) {
  exit 0
}

Push-Location $repoRoot
try {
  & powershell.exe @arguments
  exit $LASTEXITCODE
} finally {
  Pop-Location
}

