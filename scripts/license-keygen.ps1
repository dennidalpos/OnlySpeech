param(
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "support\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$generatorScript = Join-Path $repoRoot ".local\activation-generator\launch-generator.ps1"

if (-not (Test-Path -LiteralPath $generatorScript)) {
  throw "License key generator not found at $generatorScript. Restore the repo-local activation generator under .local/activation-generator before running npm run license:keygen."
}

$arguments = @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $generatorScript
)

Invoke-OnlySpeechStep -Label "license-keygen" -FilePath "powershell.exe" -Arguments $arguments -WorkingDirectory $repoRoot -DryRun:$DryRun

