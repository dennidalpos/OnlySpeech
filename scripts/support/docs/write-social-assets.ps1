param(
  [string]$OutputRoot = "",
  [switch]$SkipCompile,
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$captureScriptPath = Join-Path $repoRoot "scripts\support\docs\capture-social-assets.mjs"
$resolvedOutputRoot = if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
  Join-Path $repoRoot "social_assets"
} elseif ([System.IO.Path]::IsPathRooted($OutputRoot)) {
  [System.IO.Path]::GetFullPath($OutputRoot)
} else {
  [System.IO.Path]::GetFullPath((Join-Path $repoRoot $OutputRoot))
}

if (-not (Test-Path -LiteralPath $captureScriptPath)) {
  throw "Capture script not found at $captureScriptPath"
}

if (-not $DryRun) {
  Wait-OnlySpeechRepoProcessRelease -RepoRoot $repoRoot -Operation "generate social assets"
}

if (-not $SkipCompile) {
  Invoke-OnlySpeechStep -Label "compile" -FilePath "npm" -Arguments @("run", "compile") -WorkingDirectory $repoRoot -DryRun:$DryRun
}

Invoke-OnlySpeechStep `
  -Label "social-assets" `
  -FilePath "node" `
  -Arguments @($captureScriptPath, "--output-root", $resolvedOutputRoot) `
  -WorkingDirectory $repoRoot `
  -DryRun:$DryRun
