; OnlySpeech custom NSIS installer include
; Configures power settings after elevated installation. Autostart is owned by
; the setup wizard through the current user's HKCU Run key.
;
; Hooks used:
;   customInit      - blocks unsupported Windows client images before install
;   customInstall   - configures power settings

!include "LogicLib.nsh"

; ---------------------------------------------------------------------------
; Pre-install prerequisite checks
; ---------------------------------------------------------------------------
!macro customInit
  IfFileExists "$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" powershell_present powershell_missing

  powershell_missing:
    IfSilent powershell_missing_silent
    MessageBox MB_ICONSTOP|MB_OK "OnlySpeech setup cannot continue because Windows PowerShell 5.1 is missing. Required: built-in Windows PowerShell 5.1. Why: setup uses a packaged PowerShell script for kiosk power settings. Install: enable or repair Windows PowerShell on Windows 10/11. Verify: $$PSVersionTable.PSVersion."
  powershell_missing_silent:
    Abort

  powershell_present:
    SetOutPath "$PLUGINSDIR"
    File /oname=assert-installer-prerequisites.ps1 "${BUILD_RESOURCES_DIR}\assert-installer-prerequisites.ps1"
    nsExec::ExecToStack \
      '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -ExecutionPolicy Bypass -NonInteractive -WindowStyle Hidden -File "$PLUGINSDIR\assert-installer-prerequisites.ps1"'
    Pop $0
    Pop $1
    ${If} $0 != 0
      DetailPrint "$1"
      IfSilent prerequisite_failed_silent
      MessageBox MB_ICONSTOP|MB_OK "$1"
    prerequisite_failed_silent:
      Abort
    ${EndIf}
!macroend

; ---------------------------------------------------------------------------
; Post-install actions
; ---------------------------------------------------------------------------
!macro customInstall
  ; --- Impostazioni risparmio energetico (High Performance, no standby, no screensaver) ---
  SetOutPath "$PLUGINSDIR"
  File /oname=configure-power-settings.ps1 "${BUILD_RESOURCES_DIR}\configure-power-settings.ps1"
  nsExec::ExecToLog \
    'powershell.exe -ExecutionPolicy Bypass -NonInteractive -WindowStyle Hidden \
     -File "$PLUGINSDIR\configure-power-settings.ps1"'
  Pop $0
!macroend
