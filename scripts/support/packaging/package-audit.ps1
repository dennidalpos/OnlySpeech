function Get-ObjectPropertyNames {
  param($Object)

  if ($null -eq $Object) {
    return @()
  }

  if ($Object -is [System.Collections.IDictionary]) {
    return @($Object.Keys)
  }

  return @($Object.PSObject.Properties | ForEach-Object { $_.Name })
}

function Get-ObjectPropertyValue {
  param(
    $Object,
    [string]$Name,
    $DefaultValue = $null
  )

  if ($null -eq $Object) {
    return $DefaultValue
  }

  if ($Object -is [System.Collections.IDictionary]) {
    return $(if ($Object.Contains($Name)) { $Object[$Name] } else { $DefaultValue })
  }

  $property = $Object.PSObject.Properties[$Name]
  if ($null -eq $property) {
    return $DefaultValue
  }

  return $property.Value
}

function New-PackagingAuditMismatch {
  param([string]$Message)

  return [ordered]@{
    ok = $false
    message = $Message
  }
}

function Get-ExpectedPackagingAuditState {
  return [ordered]@{
    expectedFix = [ordered]@{
      name = "microsoft-cognitiveservices-speech-sdk"
      isSemVerMajor = $true
    }
    expectedVulnerabilities = @(
      "microsoft-cognitiveservices-speech-sdk",
      "uuid"
    )
    expectedCounts = [ordered]@{
      info = 0
      low = 0
      moderate = 2
      high = 0
      critical = 0
      total = 2
    }
  }
}

function Validate-PackagingAuditReport {
  param(
    $Report,
    $ExpectedState = (Get-ExpectedPackagingAuditState)
  )

  $actualCounts = Get-ObjectPropertyValue (Get-ObjectPropertyValue $Report "metadata") "vulnerabilities"
  foreach ($countName in @("info", "low", "moderate", "high", "critical", "total")) {
    $expectedValue = [int](Get-ObjectPropertyValue (Get-ObjectPropertyValue $ExpectedState "expectedCounts") $countName 0)
    $actualValue = [int](Get-ObjectPropertyValue $actualCounts $countName 0)
    if ($actualValue -ne $expectedValue) {
      return New-PackagingAuditMismatch -Message "Unexpected $countName count: expected $expectedValue, found $actualValue."
    }
  }

  $vulnerabilities = Get-ObjectPropertyValue $Report "vulnerabilities"
  $actualNames = @(Get-ObjectPropertyNames $vulnerabilities | Sort-Object)
  $expectedNames = @((Get-ObjectPropertyValue $ExpectedState "expectedVulnerabilities" @()) | Sort-Object)

  if ($actualNames.Count -ne $expectedNames.Count) {
    return New-PackagingAuditMismatch -Message "Unexpected vulnerability list length: expected $($expectedNames.Count), found $($actualNames.Count)."
  }

  for ($index = 0; $index -lt $expectedNames.Count; $index += 1) {
    if ($actualNames[$index] -ne $expectedNames[$index]) {
      return New-PackagingAuditMismatch -Message "Unexpected vulnerability list. Expected $($expectedNames -join ', '). Found $($actualNames -join ', ')."
    }
  }

  $expectedFix = Get-ObjectPropertyValue $ExpectedState "expectedFix"
  foreach ($name in $actualNames) {
    $details = Get-ObjectPropertyValue $vulnerabilities $name
    $fixAvailable = Get-ObjectPropertyValue $details "fixAvailable"
    if ($fixAvailable -eq $true) {
      continue
    }

    $fixName = [string](Get-ObjectPropertyValue $fixAvailable "name")
    $isSemVerMajor = [bool](Get-ObjectPropertyValue $fixAvailable "isSemVerMajor" $false)
    if ($fixName -ne [string](Get-ObjectPropertyValue $expectedFix "name") -or $isSemVerMajor -ne [bool](Get-ObjectPropertyValue $expectedFix "isSemVerMajor")) {
      return New-PackagingAuditMismatch -Message "Unexpected fixAvailable for ${name}: expected a semver-major microsoft-cognitiveservices-speech-sdk downgrade."
    }
  }

  return [ordered]@{
    ok = $true
    message = "Packaging audit matches the current known packaging dependency state ($([int](Get-ObjectPropertyValue $actualCounts 'total' 0)) findings)."
  }
}

function Invoke-PackagingAudit {
  $rawJson = & npm audit --json 2>$null | Out-String
  if ($LASTEXITCODE -ne 0 -and [string]::IsNullOrWhiteSpace($rawJson)) {
    throw "npm audit did not return JSON output."
  }

  if ([string]::IsNullOrWhiteSpace($rawJson)) {
    throw "npm audit did not return JSON output."
  }

  return $rawJson | ConvertFrom-Json
}

function Invoke-PackagingAuditCheck {
  $report = Invoke-PackagingAudit
  $result = Validate-PackagingAuditReport -Report $report
  if (-not $result.ok) {
    [Console]::Error.WriteLine($result.message)
    exit 1
  }

  [Console]::Out.WriteLine($result.message)
  exit 0
}

if ($MyInvocation.InvocationName -ne ".") {
  Invoke-PackagingAuditCheck
}
