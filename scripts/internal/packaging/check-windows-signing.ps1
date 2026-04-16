function Get-FirstConfiguredValue {
  param(
    [hashtable]$Values,
    [string[]]$Keys
  )

  foreach ($key in $Keys) {
    if ($Values.ContainsKey($key)) {
      $value = [string]$Values[$key]
      if (-not [string]::IsNullOrWhiteSpace($value)) {
        return $value.Trim()
      }
    }
  }

  return ""
}

function Get-WindowsSigningStatus {
  param(
    [hashtable]$Values = @{}
  )

  if ($Values.Count -eq 0) {
    foreach ($entry in [System.Environment]::GetEnvironmentVariables().GetEnumerator()) {
      $Values[[string]$entry.Key] = [string]$entry.Value
    }
  }

  $certificate = Get-FirstConfiguredValue -Values $Values -Keys @("WIN_CSC_LINK", "CSC_LINK")
  $password = Get-FirstConfiguredValue -Values $Values -Keys @("WIN_CSC_KEY_PASSWORD", "CSC_KEY_PASSWORD")
  $requireSigning = [string]::Equals(
    (Get-FirstConfiguredValue -Values $Values -Keys @("ONLYSPEECH_REQUIRE_WINDOWS_SIGNING")),
    "true",
    [System.StringComparison]::OrdinalIgnoreCase
  )

  $missing = @()
  if ([string]::IsNullOrWhiteSpace($certificate)) {
    $missing += "WIN_CSC_LINK or CSC_LINK"
  }

  if ([string]::IsNullOrWhiteSpace($password)) {
    $missing += "WIN_CSC_KEY_PASSWORD or CSC_KEY_PASSWORD"
  }

  return [ordered]@{
    configured = ($missing.Count -eq 0)
    requireSigning = $requireSigning
    missing = @($missing)
  }
}

function Test-WindowsSigning {
  param(
    [hashtable]$Values = @{}
  )

  $status = Get-WindowsSigningStatus -Values $Values
  if ($status.configured) {
    return [ordered]@{
      ok = $true
      message = "Windows code-signing inputs detected for electron-builder."
    }
  }

  if ($status.requireSigning) {
    return [ordered]@{
      ok = $false
      message = "Windows code-signing inputs are missing: $($status.missing -join ', ')."
    }
  }

  return [ordered]@{
    ok = $true
    message = "Windows code signing is optional for this run; missing $($status.missing -join ', ')."
  }
}

function Invoke-WindowsSigningCheck {
  $result = Test-WindowsSigning
  if (-not $result.ok) {
    [Console]::Error.WriteLine($result.message)
    exit 1
  }

  [Console]::Out.WriteLine($result.message)
  exit 0
}

if ($MyInvocation.InvocationName -ne ".") {
  Invoke-WindowsSigningCheck
}
