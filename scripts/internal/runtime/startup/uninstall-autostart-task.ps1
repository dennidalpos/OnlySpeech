param(
  [string]$TaskName = "OnlySpeech Kiosk",
  [switch]$DryRun
)

$helpersPath = Join-Path $PSScriptRoot "..\..\lib\plans.ps1"
. $helpersPath
$plan = Get-OnlySpeechAutostartTaskRemovalPlan -TaskName $TaskName

Write-Host "[uninstall-autostart-task] TaskName=$($plan.TaskName)"

if ($DryRun) {
  exit 0
}

$null = & schtasks.exe /Query /TN $plan.TaskName 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Scheduled Task not present: $($plan.TaskName)"
  exit 0
}

Unregister-ScheduledTask -TaskName $plan.TaskName -Confirm:$false
$null = & schtasks.exe /Query /TN $plan.TaskName 2>$null
if ($LASTEXITCODE -eq 0) {
  throw "Scheduled Task still present after removal: $($plan.TaskName)"
}

Write-Host "Scheduled Task removed: $($plan.TaskName)"
exit 0

