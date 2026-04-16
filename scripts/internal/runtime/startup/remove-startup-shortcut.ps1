param(
  [string]$ShortcutName = "OnlySpeech.lnk",
  [string]$AppDataPath = "",
  [switch]$DryRun
)

$helpersPath = Join-Path $PSScriptRoot "..\..\lib\plans.ps1"
. $helpersPath
$plan = Get-OnlySpeechStartupShortcutRemovalPlan `
  -ShortcutName $ShortcutName `
  -AppData $(if ([string]::IsNullOrWhiteSpace($AppDataPath)) { $env:APPDATA } else { $AppDataPath })

Write-Host "[remove-startup-shortcut] $($plan.ShortcutPath)"

if ($DryRun) {
  exit 0
}

if (Test-Path $plan.ShortcutPath) {
  Remove-Item $plan.ShortcutPath -Force
  Write-Host "Startup shortcut removed from $($plan.ShortcutPath)"
  exit 0
}

Write-Host "Startup shortcut not present: $($plan.ShortcutPath)"
exit 0

