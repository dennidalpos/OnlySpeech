param(
  [string]$OutputPath = "",
  [string]$PosterPath = "",
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$renderScriptPath = Join-Path $repoRoot "scripts\support\docs\render-marketplace-demo-video.mjs"
$resolvedOutputPath = if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  Join-Path $repoRoot "media\marketplace-demo\onlyspeech-marketplace-demo.mp4"
} elseif ([System.IO.Path]::IsPathRooted($OutputPath)) {
  [System.IO.Path]::GetFullPath($OutputPath)
} else {
  [System.IO.Path]::GetFullPath((Join-Path $repoRoot $OutputPath))
}

$resolvedPosterPath = if ([string]::IsNullOrWhiteSpace($PosterPath)) {
  Join-Path $repoRoot "media\marketplace-demo\onlyspeech-marketplace-demo-poster.png"
} elseif ([System.IO.Path]::IsPathRooted($PosterPath)) {
  [System.IO.Path]::GetFullPath($PosterPath)
} else {
  [System.IO.Path]::GetFullPath((Join-Path $repoRoot $PosterPath))
}

if (-not (Test-Path -LiteralPath $renderScriptPath)) {
  throw "Marketplace demo renderer not found at $renderScriptPath"
}

Invoke-OnlySpeechStep `
  -Label "marketplace-demo-video" `
  -FilePath "node" `
  -Arguments @(
    $renderScriptPath,
    "--output",
    $resolvedOutputPath,
    "--poster",
    $resolvedPosterPath
  ) `
  -WorkingDirectory $repoRoot `
  -DryRun:$DryRun
