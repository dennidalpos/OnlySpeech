param(
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "support\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
Invoke-OnlySpeechStep -Label "compile" -FilePath "npm" -Arguments @("run", "compile") -WorkingDirectory $repoRoot -DryRun:$DryRun

