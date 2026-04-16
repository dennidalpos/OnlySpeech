#Requires -Version 5.1
<#
.SYNOPSIS
  Configura le impostazioni di risparmio energetico di Windows per il kiosk OnlySpeech.

.DESCRIPTION
  Wrapper che invoca lo script canonico in build/configure-power-settings.ps1.
  Imposta il piano High Performance, disattiva screensaver, timeout monitor,
  standby, ibernazione, blocco schermo e logout automatico.

.NOTES
  Eseguire come operatore dalla root del repository o dalla workstation target.
  Lo stesso script e' eseguito automaticamente dal programma di installazione NSIS.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot   = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$canonical  = Join-Path $repoRoot "build\configure-power-settings.ps1"

if (-not (Test-Path $canonical)) {
  Write-Error "Script canonico non trovato: $canonical"
  exit 1
}

& $canonical
