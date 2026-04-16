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
;   customInstall   - removes legacy HKLM startup registry entry + configures power settings
;   customUnInstall - removes legacy HKLM startup registry entry on uninstall

!include "LogicLib.nsh"

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
