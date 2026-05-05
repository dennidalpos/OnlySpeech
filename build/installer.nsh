; OnlySpeech custom NSIS installer include
; Configures power settings after elevated installation and removes legacy
; installer-owned startup registry entries.
;
; The installer runs with elevation (perMachine: true in electron-builder), so
; it can clean up the old HKLM autostart entry. Current autostart is owned by
; the setup wizard through the current user's HKCU Run key, where it can be
; enabled or disabled without admin rights.
;
; Hooks used:
;   customInit      - blocks unsupported Windows client images before install
;   customInstall   - removes legacy HKLM startup registry entry + configures power settings
;   customUnInstall - removes legacy HKLM startup registry entry on uninstall

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
  ; --- Rimuove il vecchio avvio automatico per-machine gestito dall'installer ---
  DeleteRegValue HKLM \
    "Software\Microsoft\Windows\CurrentVersion\Run" \
    "OnlySpeech"

  ; --- Impostazioni risparmio energetico (High Performance, no standby, no screensaver) ---
  SetOutPath "$PLUGINSDIR"
  File /oname=configure-power-settings.ps1 "${BUILD_RESOURCES_DIR}\configure-power-settings.ps1"
  nsExec::ExecToLog \
    'powershell.exe -ExecutionPolicy Bypass -NonInteractive -WindowStyle Hidden \
     -File "$PLUGINSDIR\configure-power-settings.ps1"'
  Pop $0
!macroend

; ---------------------------------------------------------------------------
; Uninstall cleanup
; ---------------------------------------------------------------------------
!macro customUnInstall
  DeleteRegValue HKLM \
    "Software\Microsoft\Windows\CurrentVersion\Run" \
    "OnlySpeech"
!macroend
