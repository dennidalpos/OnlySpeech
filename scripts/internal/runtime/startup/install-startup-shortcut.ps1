param(
  [string]$ShortcutName = "OnlySpeech.lnk",
  [string]$AppDataPath = "",
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\..\lib\repo.ps1"
$helpersPath = Join-Path $PSScriptRoot "..\..\lib\plans.ps1"
. $repoHelpersPath
. $helpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$launcherPath = Join-Path $repoRoot "scripts\internal\runtime\startup\startup-launcher.ps1"
$iconPath = Join-Path $repoRoot "build\icon.ico"

if (-not (Test-Path $launcherPath)) {
  Write-Error "Launcher script not found: $launcherPath"
  exit 1
}

if (-not (Test-Path $iconPath)) {
  Write-Error "OnlySpeech icon not found: $iconPath"
  exit 1
}

$plan = Get-OnlySpeechStartupShortcutPlan `
  -ShortcutName $ShortcutName `
  -AppData $(if ([string]::IsNullOrWhiteSpace($AppDataPath)) { $env:APPDATA } else { $AppDataPath }) `
  -LauncherPath $launcherPath `
  -RepoRoot $repoRoot `
  -IconPath $iconPath

Write-Host "[install-startup-shortcut] $($plan.ShortcutPath) -> $($plan.TargetPath) $($plan.Arguments)"

if ($DryRun) {
  exit 0
}

New-Item -ItemType Directory -Path $plan.StartupDirectory -Force | Out-Null
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($plan.ShortcutPath)
$shortcut.TargetPath = $plan.TargetPath
$shortcut.Arguments = $plan.Arguments
$shortcut.WorkingDirectory = $plan.WorkingDirectory
$shortcut.IconLocation = $plan.IconLocation
$shortcut.Save()

Write-Host "Startup shortcut created at $($plan.ShortcutPath)"



