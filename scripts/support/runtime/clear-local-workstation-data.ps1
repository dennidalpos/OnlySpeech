[CmdletBinding()]
param(
  [string]$LocalAppDataPath = $env:LOCALAPPDATA,
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

$registryPath = "HKCU:\Software\OnlySpeech\Activation"
$trialValueName = "TrialUsedAt"

function Test-PathWithinRoot {
  param(
    [string]$RootPath,
    [string]$CandidatePath
  )

  $resolvedRoot = [System.IO.Path]::GetFullPath($RootPath)
  if (-not $resolvedRoot.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
    $resolvedRoot += [System.IO.Path]::DirectorySeparatorChar
  }

  $resolvedCandidate = [System.IO.Path]::GetFullPath($CandidatePath)
  return $resolvedCandidate.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)
}

function Clear-PackagedRuntimeRoot {
  param(
    [string]$ResolvedLocalAppDataPath
  )

  $runtimeRoot = Get-OnlySpeechPackagedRuntimeRoot -LocalAppData $ResolvedLocalAppDataPath
  if ([string]::IsNullOrWhiteSpace($runtimeRoot)) {
    throw "Unable to resolve the packaged OnlySpeech workstation data root."
  }

  $resolvedRuntimeRoot = [System.IO.Path]::GetFullPath($runtimeRoot)
  if (-not (Test-PathWithinRoot -RootPath $ResolvedLocalAppDataPath -CandidatePath $resolvedRuntimeRoot)) {
    throw "Refusing to remove workstation data outside the requested LocalAppData root: $resolvedRuntimeRoot"
  }

  if (-not (Test-Path -LiteralPath $resolvedRuntimeRoot)) {
    Write-Host "[workstation-data] not-present $resolvedRuntimeRoot"
    return
  }

  if ($DryRun) {
    Write-Host "[workstation-data] would-remove $resolvedRuntimeRoot"
    return
  }

  Remove-Item -LiteralPath $resolvedRuntimeRoot -Recurse -Force -ErrorAction Stop
  Write-Host "[workstation-data] removed $resolvedRuntimeRoot"
}

function Clear-TrialTombstone {
  if (-not (Test-Path -LiteralPath $registryPath)) {
    Write-Host "[workstation-data] no-trial-tombstone-key"
    return
  }

  $currentValue = $null
  try {
    $currentValue = (Get-ItemProperty -LiteralPath $registryPath -Name $trialValueName -ErrorAction Stop).$trialValueName
  } catch {
    Write-Host "[workstation-data] no-trial-tombstone-value"
    return
  }

  if ($DryRun) {
    Write-Host ("[workstation-data] would-remove-trial-tombstone {0}" -f $currentValue)
    return
  }

  Remove-ItemProperty -LiteralPath $registryPath -Name $trialValueName -ErrorAction Stop
  Write-Host ("[workstation-data] removed-trial-tombstone {0}" -f $currentValue)
}

$resolvedLocalAppDataPath = Get-OnlySpeechCanonicalLocalAppDataPath -LocalAppData $LocalAppDataPath
if ([string]::IsNullOrWhiteSpace($resolvedLocalAppDataPath)) {
  throw "Unable to resolve the OnlySpeech LocalAppData root."
}

Clear-PackagedRuntimeRoot -ResolvedLocalAppDataPath $resolvedLocalAppDataPath
Clear-TrialTombstone
