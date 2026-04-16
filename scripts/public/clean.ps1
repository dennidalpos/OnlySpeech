param(
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\internal\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$cleanScript = Join-Path $repoRoot "scripts\internal\workspace\clean-repo.ps1"
$arguments = @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $cleanScript,
  "-KeepDependencies",
  "-KeepEnvFile",
  "-KeepWorkstationData",
  "-KeepAutostart"
)

if ($DryRun) {
  $arguments += "-DryRun"
}

Invoke-OnlySpeechStep -Label "clean" -FilePath "powershell.exe" -Arguments $arguments -WorkingDirectory $repoRoot -DryRun:$DryRun


