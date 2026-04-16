param(
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\internal\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$packScript = Join-Path $repoRoot "scripts\internal\packaging\package-core.ps1"
$packArguments = @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $packScript,
  "-Profile",
  "Public"
)

if ($DryRun) {
  $packArguments += "-DryRun"
}

Invoke-OnlySpeechStep -Label "build" -FilePath "npm" -Arguments @("run", "build") -WorkingDirectory $repoRoot -DryRun:$DryRun
Invoke-OnlySpeechStep -Label "package" -FilePath "powershell.exe" -Arguments $packArguments -WorkingDirectory $repoRoot -DryRun:$DryRun

