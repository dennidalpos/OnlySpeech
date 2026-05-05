#Requires -Version 5.1
<#
.SYNOPSIS
  Configures Windows power settings for always-on kiosk operation.

.DESCRIPTION
  Sets the active power plan to High Performance (or creates a clone if unavailable),
  disables screensaver, monitor timeout, standby, hibernate, and auto-lock.
  Targets Windows 10 and Windows 11.

.NOTES
  Intended to be run as a post-install step by the OnlySpeech NSIS installer,
  or standalone by an operator via scripts/support/packaging/configure-power-settings.ps1.
  No parameters required. Applies to the current user's session and machine scope.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

function Write-Step {
  param([string]$Message)
  Write-Host "[configure-power-settings] $Message"
}

# ---------------------------------------------------------------------------
# 1. Power plan: enable High Performance
# ---------------------------------------------------------------------------
Write-Step "Configurazione piano di risparmio energetico..."

$highPerfGuid = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"

$existingPlan = powercfg /list 2>$null | Where-Object { $_ -match $highPerfGuid }
if (-not $existingPlan) {
  Write-Step "Piano High Performance non trovato, creazione da Balanced..."
  $balancedGuid = "381b4222-f694-41f0-9685-ff5bb260df2e"
  $output = powercfg /duplicatescheme $balancedGuid 2>&1
  $newGuid = ($output | Select-String -Pattern "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}").Matches[0].Value
  if ($newGuid) {
    powercfg /changename $newGuid "OnlySpeech High Performance" | Out-Null
    powercfg /setactive $newGuid | Out-Null
    Write-Step "Piano creato e attivato: $newGuid"
  } else {
    Write-Step "ATTENZIONE: impossibile creare piano High Performance."
  }
} else {
  powercfg /setactive $highPerfGuid | Out-Null
  Write-Step "Piano High Performance attivato ($highPerfGuid)."
}

# ---------------------------------------------------------------------------
# 2. Monitor, standby, hibernate: impostare a 0 (mai)
# ---------------------------------------------------------------------------
Write-Step "Disattivazione timeout monitor, standby e ibernazione..."

# Timeout monitor (AC e batteria)
powercfg /change monitor-timeout-ac 0
powercfg /change monitor-timeout-dc 0

# Standby / sleep (AC e batteria)
powercfg /change standby-timeout-ac 0
powercfg /change standby-timeout-dc 0

# Hibernate timeout (AC e batteria)
powercfg /change hibernate-timeout-ac 0
powercfg /change hibernate-timeout-dc 0

# Disattiva ibernazione completamente
powercfg /hibernate off 2>$null

Write-Step "Timeout monitor, standby e ibernazione disattivati."

# ---------------------------------------------------------------------------
# 3. Screensaver: disattivare tramite registro
# ---------------------------------------------------------------------------
Write-Step "Disattivazione screensaver..."

$desktopKey = "HKCU:\Control Panel\Desktop"

Set-ItemProperty -Path $desktopKey -Name "ScreenSaveActive"    -Value "0"    -Type String -Force
Set-ItemProperty -Path $desktopKey -Name "ScreenSaverIsSecure" -Value "0"    -Type String -Force
Set-ItemProperty -Path $desktopKey -Name "ScreenSaveTimeOut"   -Value "0"    -Type String -Force
Set-ItemProperty -Path $desktopKey -Name "SCRNSAVE.EXE"        -Value ""     -Type String -Force

Write-Step "Screensaver disattivato."

# ---------------------------------------------------------------------------
# 4. Lock automatico: disattivare tramite registro
# ---------------------------------------------------------------------------
Write-Step "Disattivazione blocco schermo automatico..."

# Disattiva richiesta password dopo screensaver / standby
Set-ItemProperty -Path $desktopKey -Name "ScreenSaverIsSecure" -Value "0" -Type String -Force

# Criteri gruppo locali: disattiva blocco automatico
$personalizationKey = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Personalization"
if (-not (Test-Path $personalizationKey)) {
  New-Item -Path $personalizationKey -Force | Out-Null
}
Set-ItemProperty -Path $personalizationKey -Name "NoLockScreen" -Value 1 -Type DWord -Force

Write-Step "Blocco schermo automatico disattivato."

# ---------------------------------------------------------------------------
# 5. Logout automatico / disconnessione sessione: disattivare
# ---------------------------------------------------------------------------
Write-Step "Disattivazione disconnessione sessione automatica..."

$winlogonKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\System"
if (-not (Test-Path $winlogonKey)) {
  New-Item -Path $winlogonKey -Force | Out-Null
}
Set-ItemProperty -Path $winlogonKey -Name "DisableLockWorkstation" -Value 1 -Type DWord -Force

# Inattivita sessione interattiva (Group Policy locale)
$systemKey = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System"
if (-not (Test-Path $systemKey)) {
  New-Item -Path $systemKey -Force | Out-Null
}
Set-ItemProperty -Path $systemKey -Name "InactivityTimeoutSecs" -Value 0 -Type DWord -Force

Write-Step "Disconnessione sessione automatica disattivata."

# ---------------------------------------------------------------------------
# Fine
# ---------------------------------------------------------------------------
Write-Step "Configurazione risparmio energetico completata."
