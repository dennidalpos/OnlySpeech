param(
  [switch]$CleanWorkstationData,
  [switch]$RefreshDependencies,
  [switch]$KeepOutputs,
  [switch]$SkipPack,
  [switch]$SkipPackagedLifecycle,
  [switch]$EnablePackagedAutomation,
  [switch]$SkipSmokeStart,
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\internal\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$verifyScript = Join-Path $repoRoot "scripts\internal\workspace\verify-repo.ps1"
$arguments = @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $verifyScript
)

if ($CleanWorkstationData) {
  $arguments += "-CleanWorkstationData"
}

if ($RefreshDependencies) {
  $arguments += "-ForceRefreshDependencies"
}

if ($KeepOutputs) {
  $arguments += "-KeepOutputs"
}

if ($SkipPack) {
  $arguments += "-SkipPack"
}

if ($SkipPackagedLifecycle) {
  $arguments += "-SkipPackagedLifecycle"
}

if ($EnablePackagedAutomation) {
  $arguments += "-EnablePackagedAutomation"
}

if ($SkipSmokeStart) {
  $arguments += "-SkipSmokeStart"
}

if ($DryRun) {
  $arguments += "-DryRun"
}

Invoke-OnlySpeechStep -Label "gate" -FilePath "powershell.exe" -Arguments $arguments -WorkingDirectory $repoRoot -DryRun:$DryRun
