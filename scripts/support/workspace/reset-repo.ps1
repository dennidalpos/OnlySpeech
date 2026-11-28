param(
  [switch]$KeepDependencies,
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$cleanScript = Join-Path $repoRoot "scripts\support\workspace\clean-repo.ps1"
$arguments = @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $cleanScript,
  "-KeepEnvFile",
  "-KeepWorkstationData",
  "-KeepAutostart"
)

if ($KeepDependencies) {
  $arguments += "-KeepDependencies"
}

if ($DryRun) {
  $arguments += "-DryRun"
}

Push-Location $repoRoot
try {
  & powershell.exe @arguments
  exit $LASTEXITCODE
} finally {
  Pop-Location
}

