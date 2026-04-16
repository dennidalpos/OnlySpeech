param(
  [string]$TaskName = "OnlySpeech Kiosk",
  [switch]$PreferPackaged,
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\..\lib\repo.ps1"
$helpersPath = Join-Path $PSScriptRoot "..\..\lib\plans.ps1"
. $repoHelpersPath
. $helpersPath
$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$launcherScript = Join-Path $repoRoot "scripts\internal\runtime\run-workstation.ps1"

if (-not (Test-Path $launcherScript)) {
  Write-Error "Launcher script not found: $launcherScript"
  exit 1
}

$plan = Get-OnlySpeechAutostartTaskPlan `
  -TaskName $TaskName `
  -PreferPackaged:$PreferPackaged `
  -LauncherScript $launcherScript `
  -RepoRoot $repoRoot `
  -Username $env:USERNAME

Write-Host "[install-autostart-task] TaskName=$($plan.TaskName) Command=$($plan.Execute) $($plan.Arguments) WorkingDirectory=$($plan.WorkingDirectory)"

if ($DryRun) {
  exit 0
}

$action = New-ScheduledTaskAction -Execute $plan.Execute -Argument $plan.Arguments -WorkingDirectory $plan.WorkingDirectory
$trigger = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal -UserId $plan.PrincipalUserId -LogonType Interactive -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $plan.TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description $plan.Description -Force | Out-Null

$null = & schtasks.exe /Query /TN $plan.TaskName 2>$null
if ($LASTEXITCODE -ne 0) {
  throw "Scheduled Task was not registered correctly: $($plan.TaskName)"
}

Write-Host "Scheduled Task created: $($plan.TaskName)"



