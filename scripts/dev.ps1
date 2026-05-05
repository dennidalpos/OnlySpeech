param(
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "support\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
Invoke-OnlySpeechStep -Label "dev" -FilePath "npm" -Arguments @("run", "dev:workspace") -WorkingDirectory $repoRoot -DryRun:$DryRun

