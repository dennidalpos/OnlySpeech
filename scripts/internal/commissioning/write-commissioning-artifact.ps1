param(
  [string]$OutputPath,
  [switch]$SkipDoctor,
  [switch]$SkipRuntimeLogExport,
  [string]$TargetStationValidationPath,
  [string]$WriteTargetStationValidationTemplatePath
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$helpersPath = Join-Path $repoRoot "scripts\internal\lib\plans.ps1"
. $helpersPath

function Get-LogFiles {
  param(
    [string]$LogDirectory
  )

  if (-not (Test-Path -LiteralPath $LogDirectory)) {
    return @()
  }

  return @(Get-ChildItem -LiteralPath $LogDirectory -Filter "*.jsonl" -File | Sort-Object Name)
}

function Invoke-CapturedPowerShellScript {
  param(
    [string]$ScriptPath,
    [string[]]$Arguments = @()
  )

  $output = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ScriptPath @Arguments 2>&1
  return @{
    ExitCode = $LASTEXITCODE
    Output = @($output | ForEach-Object { "$_" })
  }
}

function Get-DefaultTargetStationChecks {
  return @(
    [ordered]@{ id = "fullscreen-displays"; description = "Confirm both displays open in fullscreen on the target station." },
    [ordered]@{ id = "display-side-mapping"; description = "Confirm side A and side B are mapped to the intended monitors." },
    [ordered]@{ id = "microphone-side-mapping"; description = "Confirm Mic A and Mic B react on the intended side." },
    [ordered]@{ id = "provider-exchange-side-a"; description = "Confirm one successful live provider exchange from side A." },
    [ordered]@{ id = "provider-exchange-side-b"; description = "Confirm one successful live provider exchange from side B." },
    [ordered]@{ id = "visitor-language-catalog-validation"; description = "Confirm Station B updates its selected-language chip, macro-area grouping, localized labels, and RTL or glyph rendering for at least one non-Latin visitor language." },
    [ordered]@{ id = "idle-clear"; description = "Confirm idle clear behaves as expected on the commissioned station." },
    [ordered]@{ id = "hard-reset"; description = "Confirm hard reset behaves as expected on the commissioned station." },
    [ordered]@{ id = "runtime-log-review"; description = "Confirm runtime JSONL output exists for the active station profile and review or export the expected files." },
    [ordered]@{ id = "touch-input"; description = "Confirm touch input on the target hardware." }
  )
}

function New-TargetStationValidationTemplate {
  return [ordered]@{
    schema_version = 1
    station_id = $null
    validated_by = $null
    notes = $null
    checks = @(
      Get-DefaultTargetStationChecks | ForEach-Object {
        [ordered]@{
          id = $_.id
          status = "pending"
          description = $_.description
          checked_at = $null
          notes = $null
        }
      }
    )
  }
}

function Get-CanonicalTargetStationValidationPath {
  param(
    [string]$ArtifactsLogsRoot
  )

  return Join-Path $ArtifactsLogsRoot "target-station-validation.json"
}

function Write-TargetStationValidationTemplate {
  param(
    [string]$TemplatePath
  )

  if ([string]::IsNullOrWhiteSpace($TemplatePath)) {
    return $null
  }

  $templateDirectory = Split-Path -Parent $TemplatePath
  if (-not [string]::IsNullOrWhiteSpace($templateDirectory)) {
    New-Item -ItemType Directory -Path $templateDirectory -Force | Out-Null
  }

  New-TargetStationValidationTemplate | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $TemplatePath -Encoding UTF8
  return $TemplatePath
}

function ConvertTo-NormalizedCheckStatus {
  param(
    [string]$Status
  )

  if ([string]::IsNullOrWhiteSpace($Status)) {
    return "pending"
  }

  switch ($Status.Trim().ToLowerInvariant()) {
    "pending" { return "pending" }
    "passed" { return "passed" }
    "failed" { return "failed" }
    "not_applicable" { return "not_applicable" }
    "not-applicable" { return "not_applicable" }
    "n/a" { return "not_applicable" }
    default {
      throw "Unsupported target-station validation status '$Status'. Expected pending, passed, failed, or not_applicable."
    }
  }
}

function Get-TargetStationValidationOverrides {
  param(
    [string]$ValidationPath
  )

  if ([string]::IsNullOrWhiteSpace($ValidationPath)) {
    return $null
  }

  if (-not (Test-Path -LiteralPath $ValidationPath)) {
    throw "Target-station validation file not found: $ValidationPath"
  }

  $rawContent = Get-Content -LiteralPath $ValidationPath -Raw
  $parsedContent = $rawContent | ConvertFrom-Json
  $checks = @($parsedContent.checks)
  $defaultCheckIds = @(Get-DefaultTargetStationChecks | ForEach-Object { $_.id })
  $normalizedChecks = @()

  foreach ($check in $checks) {
    if ($null -eq $check) {
      continue
    }

    if ([string]::IsNullOrWhiteSpace($check.id)) {
      throw "Each target-station validation check override must include a non-empty id."
    }

    if ($defaultCheckIds -notcontains $check.id) {
      throw "Unknown target-station validation check id '$($check.id)'."
    }

    $normalizedCheck = [ordered]@{
      id = $check.id
      status = ConvertTo-NormalizedCheckStatus -Status $check.status
    }

    if ($null -ne $check.notes -and -not [string]::IsNullOrWhiteSpace([string]$check.notes)) {
      $normalizedCheck.notes = [string]$check.notes
    }

    if ($null -ne $check.checked_at -and -not [string]::IsNullOrWhiteSpace([string]$check.checked_at)) {
      $normalizedCheck.checked_at = [string]$check.checked_at
    }

    if ($null -ne $check.validated_by -and -not [string]::IsNullOrWhiteSpace([string]$check.validated_by)) {
      $normalizedCheck.validated_by = [string]$check.validated_by
    }

    $normalizedChecks += $normalizedCheck
  }

  $metadata = [ordered]@{}
  if ($null -ne $parsedContent.station_id -and -not [string]::IsNullOrWhiteSpace([string]$parsedContent.station_id)) {
    $metadata.station_id = [string]$parsedContent.station_id
  }
  if ($null -ne $parsedContent.validated_by -and -not [string]::IsNullOrWhiteSpace([string]$parsedContent.validated_by)) {
    $metadata.validated_by = [string]$parsedContent.validated_by
  }
  if ($null -ne $parsedContent.notes -and -not [string]::IsNullOrWhiteSpace([string]$parsedContent.notes)) {
    $metadata.notes = [string]$parsedContent.notes
  }

  return [ordered]@{
    path = $ValidationPath
    metadata = $metadata
    checks = $normalizedChecks
  }
}

function Merge-TargetStationChecks {
  param(
    [object[]]$DefaultChecks,
    $ValidationOverrides
  )

  $overridesById = @{}
  if ($null -ne $ValidationOverrides) {
    foreach ($override in @($ValidationOverrides.checks)) {
      $overridesById[$override.id] = $override
    }
  }

  $mergedChecks = @()
  foreach ($check in $DefaultChecks) {
    $mergedCheck = [ordered]@{
      id = $check.id
      status = "pending"
      description = $check.description
    }

    $override = $overridesById[$check.id]
    if ($null -ne $override) {
      $mergedCheck.status = $override.status

      if ($override.Contains("notes")) {
        $mergedCheck.notes = $override.notes
      }

      if ($override.Contains("checked_at")) {
        $mergedCheck.checked_at = $override.checked_at
      }

      if ($override.Contains("validated_by")) {
        $mergedCheck.validated_by = $override.validated_by
      }
    }

    $mergedChecks += $mergedCheck
  }

  return $mergedChecks
}

$artifactsLogsRoot = Join-Path $repoRoot "artifacts\logs"
New-Item -ItemType Directory -Path $artifactsLogsRoot -Force | Out-Null
$canonicalTargetStationValidationPath = Get-CanonicalTargetStationValidationPath -ArtifactsLogsRoot $artifactsLogsRoot

$resolvedOutputPath = if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  Join-Path $artifactsLogsRoot "commissioning-evidence.json"
} else {
  $OutputPath
}

$resolvedTargetStationValidationPath = if ([string]::IsNullOrWhiteSpace($TargetStationValidationPath)) {
  if (Test-Path -LiteralPath $canonicalTargetStationValidationPath) {
    $canonicalTargetStationValidationPath
  } else {
    ""
  }
} else {
  $TargetStationValidationPath
}

$writtenTemplatePath = Write-TargetStationValidationTemplate -TemplatePath $WriteTargetStationValidationTemplatePath
$validationOverrides = Get-TargetStationValidationOverrides -ValidationPath $resolvedTargetStationValidationPath

$doctorResult = if ($SkipDoctor) {
  @{
    ExitCode = $null
    Output = @("Skipped at caller request.")
  }
} else {
  Invoke-CapturedPowerShellScript -ScriptPath (Join-Path $repoRoot "scripts\internal\workspace\doctor.ps1")
}

$existingLogPaths = @(Get-OnlySpeechRuntimeLogCandidates -LocalAppData $env:LOCALAPPDATA |
    Where-Object { Test-Path -LiteralPath $_ })
$resolvedSourcePath = Resolve-OnlySpeechRuntimeLogSourcePath `
  -RequestedPath $null `
  -ExistingPaths $existingLogPaths `
  -LocalAppData $env:LOCALAPPDATA
$logFiles = Get-LogFiles -LogDirectory $resolvedSourcePath
$reportPlan = Get-OnlySpeechRuntimeLogPlan `
  -Mode "report" `
  -RequestedPath $null `
  -RepoRoot $repoRoot `
  -LocalAppData $env:LOCALAPPDATA `
  -Files $logFiles `
  -ExistingPaths $existingLogPaths

$exportPlan = $null
$exportedFiles = @()
if (-not $SkipRuntimeLogExport) {
  $exportPlan = Get-OnlySpeechRuntimeLogPlan `
    -Mode "export" `
    -RequestedPath $null `
    -RepoRoot $repoRoot `
    -LocalAppData $env:LOCALAPPDATA `
    -Files $logFiles `
    -ExistingPaths $existingLogPaths

  New-Item -ItemType Directory -Path $exportPlan.ExportDirectory -Force | Out-Null
  foreach ($operation in $exportPlan.Operations) {
    Copy-Item -LiteralPath $operation.SourcePath -Destination $operation.DestinationPath -Force
    $exportedFiles += [ordered]@{
      name = $operation.Name
      destination_path = $operation.DestinationPath
    }
  }
}

$targetStationChecks = @(Merge-TargetStationChecks `
  -DefaultChecks (Get-DefaultTargetStationChecks) `
  -ValidationOverrides $validationOverrides)
$remainingTargetStationChecks = @(
  $targetStationChecks | Where-Object {
    $_.status -eq "pending" -or $_.status -eq "failed"
  }
)
$targetStationValidationSummary = [ordered]@{
  total = $targetStationChecks.Count
  pending = @($targetStationChecks | Where-Object { $_.status -eq "pending" }).Count
  passed = @($targetStationChecks | Where-Object { $_.status -eq "passed" }).Count
  failed = @($targetStationChecks | Where-Object { $_.status -eq "failed" }).Count
  not_applicable = @($targetStationChecks | Where-Object { $_.status -eq "not_applicable" }).Count
}

$artifact = [ordered]@{
  schema_version = 1
  generated_at = (Get-Date).ToString("s")
  repository_root = $repoRoot
  doctor = [ordered]@{
    skipped = [bool]$SkipDoctor
    exit_code = $doctorResult.ExitCode
    output = @($doctorResult.Output)
  }
  runtime_logs = [ordered]@{
    source_path = $reportPlan.SourcePath
    file_count = $reportPlan.Files.Count
    files = @($reportPlan.Files | ForEach-Object {
        [ordered]@{
          name = $_.Name
          size = $_.Length
          last_write_time = $_.LastWriteTime.ToString("s")
        }
      })
    export_skipped = [bool]$SkipRuntimeLogExport
    export_directory = if ($null -ne $exportPlan) { $exportPlan.ExportDirectory } else { $null }
    exported_files = @($exportedFiles)
  }
  target_station_validation = [ordered]@{
    template_path = $writtenTemplatePath
    source_path = if ($null -ne $validationOverrides) { $validationOverrides.path } else { $null }
    metadata = if ($null -ne $validationOverrides) { $validationOverrides.metadata } else { [ordered]@{} }
    summary = $targetStationValidationSummary
    checks = @($targetStationChecks)
  }
  remaining_target_station_checks = @($remainingTargetStationChecks)
}

$artifactDirectory = Split-Path -Parent $resolvedOutputPath
if (-not [string]::IsNullOrWhiteSpace($artifactDirectory)) {
  New-Item -ItemType Directory -Path $artifactDirectory -Force | Out-Null
}

$artifact | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $resolvedOutputPath -Encoding UTF8
if ($null -ne $writtenTemplatePath) {
  Write-Host "[target-station-validation-template] $writtenTemplatePath"
}
Write-Host "[commissioning-artifact] $resolvedOutputPath"

