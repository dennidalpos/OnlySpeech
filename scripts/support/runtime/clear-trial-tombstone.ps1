[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$registryPath = "HKCU:\Software\OnlySpeech\Activation"
$valueName = "TrialUsedAt"

if (-not (Test-Path -LiteralPath $registryPath)) {
    Write-Host "No trial tombstone registry key was found."
    return
}

$currentValue = $null
try {
    $currentValue = (Get-ItemProperty -LiteralPath $registryPath -Name $valueName -ErrorAction Stop).$valueName
} catch {
    Write-Host "No trial tombstone value was found."
    return
}

Remove-ItemProperty -LiteralPath $registryPath -Name $valueName -ErrorAction Stop
Write-Host ("Removed OnlySpeech trial tombstone: {0}" -f $currentValue)
