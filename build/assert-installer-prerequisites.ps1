#Requires -Version 5.1
param(
  [Version]$WindowsVersion = [System.Environment]::OSVersion.Version,
  [bool]$Is64BitOperatingSystem = [System.Environment]::Is64BitOperatingSystem,
  [string]$SystemRoot = $env:SystemRoot,
  [string]$PowerShellVersion = $PSVersionTable.PSVersion.ToString(),
  [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function New-PrerequisiteResult {
  param(
    [string]$Name,
    [bool]$Ok,
    [string]$MinimumVersion,
    [string]$Reason,
    [string]$Install,
    [string]$Verify
  )

  return [pscustomobject]@{
    name = $Name
    ok = $Ok
    minimum_version = $MinimumVersion
    reason = $Reason
    install = $Install
    verify = $Verify
  }
}

function Test-CommandAvailable {
  param([string]$Name)
  return $null -ne (Get-Command -Name $Name -ErrorAction SilentlyContinue)
}

function Test-MediaFoundationFiles {
  param([string]$Root)

  if ([string]::IsNullOrWhiteSpace($Root)) {
    return $false
  }

  $system32 = Join-Path $Root "System32"
  foreach ($fileName in @("mfplat.dll", "mfreadwrite.dll")) {
    if (-not (Test-Path -LiteralPath (Join-Path $system32 $fileName))) {
      return $false
    }
  }

  return $true
}

function Get-OnlySpeechInstallerPrerequisiteResults {
  param(
    [Version]$WindowsVersion = [System.Environment]::OSVersion.Version,
    [bool]$Is64BitOperatingSystem = [System.Environment]::Is64BitOperatingSystem,
    [string]$SystemRoot = $env:SystemRoot,
    [string]$PowerShellVersion = $PSVersionTable.PSVersion.ToString()
  )

  $parsedPowerShellVersion = [Version]"0.0"
  [void][Version]::TryParse($PowerShellVersion, [ref]$parsedPowerShellVersion)

  return @(
    New-PrerequisiteResult `
      -Name "Windows 10/11 x64" `
      -Ok ($WindowsVersion -ge [Version]"10.0" -and $Is64BitOperatingSystem) `
      -MinimumVersion "Windows 10 x64, build 10240 or newer" `
      -Reason "OnlySpeech ships as a Windows x64 Electron workstation app." `
      -Install "Use an updated Windows 10 or Windows 11 x64 workstation." `
      -Verify "winver; [Environment]::Is64BitOperatingSystem"
    New-PrerequisiteResult `
      -Name "Windows PowerShell" `
      -Ok ($parsedPowerShellVersion -ge [Version]"5.1") `
      -MinimumVersion "Windows PowerShell 5.1" `
      -Reason "The installer uses a packaged PowerShell post-install script for kiosk power settings." `
      -Install "Enable the built-in Windows PowerShell feature or repair Windows system components." `
      -Verify '$PSVersionTable.PSVersion'
    New-PrerequisiteResult `
      -Name "Windows powercfg" `
      -Ok (Test-CommandAvailable -Name "powercfg.exe") `
      -MinimumVersion "Built-in Windows 10/11 powercfg.exe" `
      -Reason "OnlySpeech configures kiosk power and display timeout settings during installation." `
      -Install "Use a standard Windows 10/11 client image with System32 tools available in PATH." `
      -Verify "powercfg /?"
    New-PrerequisiteResult `
      -Name "Windows Media Foundation" `
      -Ok (Test-MediaFoundationFiles -Root $SystemRoot) `
      -MinimumVersion "Windows 10/11 Media Feature Pack components" `
      -Reason "Electron microphone capture and live speech validation require Windows media components." `
      -Install "On Windows N editions, install the official Microsoft Media Feature Pack, then reboot." `
      -Verify 'Test-Path "$env:SystemRoot\System32\mfplat.dll"; Test-Path "$env:SystemRoot\System32\mfreadwrite.dll"'
  )
}

function Format-OnlySpeechPrerequisiteFailureMessage {
  param([object[]]$Results)

  $failedResults = @($Results | Where-Object { -not $_.ok })
  if ($failedResults.Count -eq 0) {
    return ""
  }

  $lines = @(
    "OnlySpeech setup cannot continue because this workstation is missing required software.",
    ""
  )

  foreach ($result in $failedResults) {
    $lines += "- $($result.name)"
    $lines += "  Required: $($result.minimum_version)"
    $lines += "  Why: $($result.reason)"
    $lines += "  Install: $($result.install)"
    $lines += "  Verify: $($result.verify)"
  }

  return $lines -join [Environment]::NewLine
}

if ($MyInvocation.InvocationName -ne ".") {
  $results = @(Get-OnlySpeechInstallerPrerequisiteResults `
      -WindowsVersion $WindowsVersion `
      -Is64BitOperatingSystem $Is64BitOperatingSystem `
      -SystemRoot $SystemRoot `
      -PowerShellVersion $PowerShellVersion)
  $message = Format-OnlySpeechPrerequisiteFailureMessage -Results $results

  if ($Json) {
    [pscustomobject]@{
      ok = [string]::IsNullOrWhiteSpace($message)
      results = $results
      message = $message
    } | ConvertTo-Json -Depth 6
  } elseif (-not [string]::IsNullOrWhiteSpace($message)) {
    [Console]::Error.WriteLine($message)
  }

  if ([string]::IsNullOrWhiteSpace($message)) {
    exit 0
  }

  exit 1
}
