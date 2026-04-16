param(
  [string]$LocalAppDataPath,
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\internal\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$cleanScript = Join-Path $repoRoot "scripts\internal\runtime\clear-local-workstation-data.ps1"
$arguments = @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $cleanScript
)

if (-not [string]::IsNullOrWhiteSpace($LocalAppDataPath)) {
  $arguments += "-LocalAppDataPath"
  $arguments += $LocalAppDataPath
}

if ($DryRun) {
  $arguments += "-DryRun"
}

Invoke-OnlySpeechStep -Label "clean-workstation" -FilePath "powershell.exe" -Arguments $arguments -WorkingDirectory $repoRoot -DryRun:$DryRun
