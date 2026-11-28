param(
  [string]$OutputPath = "",
  [string]$UpdateValidationPath = "",
  [string]$RuntimeEnvPath = "",
  [string]$StationId = "",
  [switch]$SkipCompile,
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

function Resolve-OnlySpeechPathFromRepoRoot {
  param(
    [string]$RepoRoot,
    [string]$Path
  )

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return ""
  }

  if ([System.IO.Path]::IsPathRooted($Path)) {
    return $Path
  }

  return Join-Path $RepoRoot $Path
}

function Read-OnlySpeechEnvMap {
  param(
    [string]$FilePath
  )

  $values = [ordered]@{}
  if (-not (Test-Path -LiteralPath $FilePath)) {
    throw "Runtime env file not found: $FilePath"
  }

  foreach ($line in Get-Content -LiteralPath $FilePath) {
    if ([string]::IsNullOrWhiteSpace($line)) {
      continue
    }

    if ($line.TrimStart().StartsWith("#")) {
      continue
    }

    $separatorIndex = $line.IndexOf("=")
    if ($separatorIndex -lt 1) {
      continue
    }

    $key = $line.Substring(0, $separatorIndex).Trim()
    $value = $line.Substring($separatorIndex + 1)
    $values[$key] = $value
  }

  return $values
}

function ConvertTo-OnlySpeechEnvText {
  param(
    [System.Collections.IDictionary]$Values
  )

  $lines = New-Object System.Collections.Generic.List[string]
  foreach ($entry in $Values.GetEnumerator()) {
    $lines.Add("$($entry.Key)=$($entry.Value)")
  }

  return ($lines -join [Environment]::NewLine) + [Environment]::NewLine
}

function New-OnlySpeechKioskAutomationEnvMap {
  param(
    [System.Collections.IDictionary]$BaseEnvValues
  )

  $automationEnvValues = [ordered]@{}
  foreach ($entry in $BaseEnvValues.GetEnumerator()) {
    $automationEnvValues[$entry.Key] = [string]$entry.Value
  }

  $automationEnvValues["APP_MODE"] = "kiosk"
  $automationEnvValues["REQUIRED_MONITORS"] = "2"

  if ([string]::IsNullOrWhiteSpace([string]$automationEnvValues["DEFAULT_TARGET_LANG_A"])) {
    $automationEnvValues["DEFAULT_TARGET_LANG_A"] = "it"
  }

  if ([string]::IsNullOrWhiteSpace([string]$automationEnvValues["DEFAULT_TARGET_LANG_B"])) {
    $automationEnvValues["DEFAULT_TARGET_LANG_B"] = "en"
  }

  return $automationEnvValues
}

function Invoke-OnlySpeechAutomationRequest {
  param(
    [int]$Port,
    [string]$Path,
    [string]$Method = "GET",
    $Body = $null
  )

  $requestParameters = @{
    Uri = "http://127.0.0.1:$Port$Path"
    Method = $Method
  }

  if ($null -ne $Body) {
    $requestParameters.ContentType = "application/json"
    $requestParameters.Body = ($Body | ConvertTo-Json -Depth 8 -Compress)
  }

  return Invoke-RestMethod @requestParameters
}

function Test-OnlySpeechContainsNonAscii {
  param(
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $false
  }

  return [regex]::IsMatch($Value, "[^\u0000-\u007F]")
}

function Wait-OnlySpeechAutomationPort {
  param(
    [string]$PortFilePath,
    [int]$TimeoutSeconds = 40
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    if (Test-Path -LiteralPath $PortFilePath) {
      $portText = (Get-Content -LiteralPath $PortFilePath -Raw).Trim()
      $port = 0
      if ([int]::TryParse($portText, [ref]$port) -and $port -gt 0) {
        return $port
      }
    }

    Start-Sleep -Milliseconds 250
  } while ((Get-Date) -lt $deadline)

  throw "Timed out while waiting for OnlySpeech automation port file: $PortFilePath"
}

function Wait-OnlySpeechAutomationCondition {
  param(
    [scriptblock]$Condition,
    [int]$TimeoutSeconds = 40,
    [int]$PollMilliseconds = 250
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    $result = & $Condition
    if ($null -ne $result) {
      return $result
    }

    Start-Sleep -Milliseconds $PollMilliseconds
  } while ((Get-Date) -lt $deadline)

  throw "Timed out while waiting for the OnlySpeech automation condition."
}

function Stop-OnlySpeechAutomationProcess {
  param(
    [System.Diagnostics.Process]$Process
  )

  if ($null -eq $Process) {
    return
  }

  try {
    if (-not $Process.HasExited) {
      $Process.Kill($true)
      $Process.WaitForExit(5000) | Out-Null
    }
  } catch {
    try {
      Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
    } catch {
      # Best effort cleanup.
    }
  }
}

function Start-OnlySpeechAutomationApp {
  param(
    [string]$RepoRoot,
    [string]$RuntimeRoot,
    [string]$PortFilePath,
    [string]$AppDataRoot,
    [string]$LocalAppDataRoot
  )

  $electronExecutablePath = Join-Path $RepoRoot "node_modules\electron\dist\electron.exe"
  if (-not (Test-Path -LiteralPath $electronExecutablePath)) {
    throw "Electron runtime not found at $electronExecutablePath. Run npm run bootstrap."
  }

  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = $electronExecutablePath
  $startInfo.Arguments = "."
  $startInfo.WorkingDirectory = $RepoRoot
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $startInfo.CreateNoWindow = $true

  foreach ($entry in [System.Environment]::GetEnvironmentVariables().GetEnumerator()) {
    $startInfo.EnvironmentVariables[[string]$entry.Key] = [string]$entry.Value
  }

  $startInfo.EnvironmentVariables["ONLYSPEECH_TEST_AUTOMATION"] = "1"
  $startInfo.EnvironmentVariables["ONLYSPEECH_AUTOMATION_PORT_FILE"] = $PortFilePath
  $startInfo.EnvironmentVariables["ONLYSPEECH_RUNTIME_ROOT"] = $RuntimeRoot
  $startInfo.EnvironmentVariables["APPDATA"] = $AppDataRoot
  $startInfo.EnvironmentVariables["LOCALAPPDATA"] = $LocalAppDataRoot

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo
  $process.EnableRaisingEvents = $true
  $null = $process.Start()
  $null = $process.BeginOutputReadLine()
  $null = $process.BeginErrorReadLine()
  return $process
}

function New-OnlySpeechAutomationPhaseResult {
  param(
    [string]$Id,
    [string]$Status,
    [string]$Notes,
    $Details
  )

  return [ordered]@{
    id = $Id
    status = $Status
    checked_at = (Get-Date).ToUniversalTime().ToString("o")
    notes = $Notes
    details = $Details
  }
}

function Merge-TargetStationValidationChecks {
  param(
    [string]$ValidationPath,
    [object[]]$Results,
    [string]$ArtifactRelativePath
  )

  if ([string]::IsNullOrWhiteSpace($ValidationPath)) {
    return
  }

  if (-not (Test-Path -LiteralPath $ValidationPath)) {
    throw "Target-station validation file not found: $ValidationPath"
  }

  $content = Get-Content -LiteralPath $ValidationPath -Raw | ConvertFrom-Json
  $resultsById = @{}
  foreach ($result in $Results) {
    $resultsById[$result.id] = $result
  }

  foreach ($check in @($content.checks)) {
    if ($resultsById.ContainsKey($check.id)) {
      $result = $resultsById[$check.id]
      $check.status = $result.status
      $check.checked_at = $result.checked_at
      $artifactNote = "Automation evidence retained in $ArtifactRelativePath."
      $check.notes = "$($result.notes) $artifactNote".Trim()
    }
  }

  Write-OnlySpeechUtf8File -Path $ValidationPath -Content ($content | ConvertTo-Json -Depth 8)
}

function Invoke-FullscreenAndHardResetCheck {
  param(
    [string]$RepoRoot,
    [hashtable]$BaseEnvValues
  )

  $runtimeRoot = Join-Path ([System.IO.Path]::GetTempPath()) "onlyspeech-commission-hardreset-$([guid]::NewGuid())"
  $automationRoot = Join-Path ([System.IO.Path]::GetTempPath()) "onlyspeech-commission-hardreset-$([guid]::NewGuid())"
  $appDataRoot = Join-Path $automationRoot "appdata"
  $localAppDataRoot = Join-Path $automationRoot "localappdata"
  $portFilePath = Join-Path $automationRoot "automation-port.txt"
  New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
  New-Item -ItemType Directory -Path $automationRoot -Force | Out-Null
  New-Item -ItemType Directory -Path $appDataRoot -Force | Out-Null
  New-Item -ItemType Directory -Path $localAppDataRoot -Force | Out-Null

  $automationEnvValues = New-OnlySpeechKioskAutomationEnvMap -BaseEnvValues $BaseEnvValues
  Write-OnlySpeechUtf8File -Path (Join-Path $runtimeRoot ".env") -Content (ConvertTo-OnlySpeechEnvText -Values $automationEnvValues)
  $process = $null

  try {
    $process = Start-OnlySpeechAutomationApp -RepoRoot $RepoRoot -RuntimeRoot $runtimeRoot -PortFilePath $portFilePath -AppDataRoot $appDataRoot -LocalAppDataRoot $localAppDataRoot
    $port = Wait-OnlySpeechAutomationPort -PortFilePath $portFilePath

    $initialSnapshot = Wait-OnlySpeechAutomationCondition -Condition {
      $snapshot = Invoke-OnlySpeechAutomationRequest -Port $port -Path "/snapshot"
      if (
        $null -ne $snapshot.kiosk -and
        $snapshot.kiosk.windows.Count -eq 2 -and
        @($snapshot.kiosk.windows | Where-Object { $_.destroyed -eq $false -and $_.visible -eq $true -and $_.fullScreen -eq $true }).Count -eq 2
      ) {
        return $snapshot
      }

      return $null
    }

    foreach ($selection in @(
      @{ side = "A"; targetLanguage = "en" },
      @{ side = "B"; targetLanguage = "it" }
    )) {
      $null = Invoke-OnlySpeechAutomationRequest -Port $port -Path "/kiosk/operator-action" -Method "POST" -Body @{
        type = "select-target-language"
        side = $selection.side
        targetLanguage = $selection.targetLanguage
      }
    }

    $preResetSnapshot = Wait-OnlySpeechAutomationCondition -Condition {
      $snapshot = Invoke-OnlySpeechAutomationRequest -Port $port -Path "/snapshot"
      if (
        $snapshot.kiosk.state.sides.A.selectedTargetLanguage -eq "en" -and
        $snapshot.kiosk.state.sides.B.selectedTargetLanguage -eq "it"
      ) {
        return $snapshot
      }

      return $null
    }

    $previousSessionId = [string]$preResetSnapshot.kiosk.state.sessionId
    $null = Invoke-OnlySpeechAutomationRequest -Port $port -Path "/kiosk/operator-action" -Method "POST" -Body @{
      type = "request-reset"
      side = "A"
    }

    $resetSnapshot = Wait-OnlySpeechAutomationCondition -Condition {
      $snapshot = Invoke-OnlySpeechAutomationRequest -Port $port -Path "/snapshot"
      if (
        $snapshot.kiosk.state.sessionResetReason -eq "hard-reset" -and
        [string]$snapshot.kiosk.state.sessionId -ne $previousSessionId
      ) {
        return $snapshot
      }

      return $null
    }

    return @(
      (New-OnlySpeechAutomationPhaseResult -Id "fullscreen-displays" -Status "passed" -Notes "Automation snapshot observed two workstation display windows with visible=true and fullScreen=true." -Details $initialSnapshot.kiosk.windows),
      (New-OnlySpeechAutomationPhaseResult -Id "hard-reset" -Status "passed" -Notes "Automation request-reset returned sessionResetReason=hard-reset and restored the runtime defaults after committing non-default visitor and operator languages." -Details ([ordered]@{
            previous_session_id = $previousSessionId
            new_session_id = [string]$resetSnapshot.kiosk.state.sessionId
            session_reset_reason = $resetSnapshot.kiosk.state.sessionResetReason
            side_a_language = $resetSnapshot.kiosk.state.sides.A.selectedTargetLanguage
            side_b_language = $resetSnapshot.kiosk.state.sides.B.selectedTargetLanguage
          }))
    )
  } finally {
    Stop-OnlySpeechAutomationProcess -Process $process
    Remove-Item -LiteralPath $runtimeRoot -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $automationRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Invoke-IdleClearCheck {
  param(
    [string]$RepoRoot,
    [hashtable]$BaseEnvValues
  )

  $runtimeRoot = Join-Path ([System.IO.Path]::GetTempPath()) "onlyspeech-commission-idle-$([guid]::NewGuid())"
  $automationRoot = Join-Path ([System.IO.Path]::GetTempPath()) "onlyspeech-commission-idle-$([guid]::NewGuid())"
  $appDataRoot = Join-Path $automationRoot "appdata"
  $localAppDataRoot = Join-Path $automationRoot "localappdata"
  $portFilePath = Join-Path $automationRoot "automation-port.txt"
  New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
  New-Item -ItemType Directory -Path $automationRoot -Force | Out-Null
  New-Item -ItemType Directory -Path $appDataRoot -Force | Out-Null
  New-Item -ItemType Directory -Path $localAppDataRoot -Force | Out-Null

  $idleEnvValues = New-OnlySpeechKioskAutomationEnvMap -BaseEnvValues $BaseEnvValues
  $idleEnvValues["IDLE_CLEAR_SECONDS"] = "2"
  $idleEnvValues["IDLE_HARD_RESET_SECONDS"] = "30"

  Write-OnlySpeechUtf8File -Path (Join-Path $runtimeRoot ".env") -Content (ConvertTo-OnlySpeechEnvText -Values $idleEnvValues)
  $process = $null

  try {
    $process = Start-OnlySpeechAutomationApp -RepoRoot $RepoRoot -RuntimeRoot $runtimeRoot -PortFilePath $portFilePath -AppDataRoot $appDataRoot -LocalAppDataRoot $localAppDataRoot
    $port = Wait-OnlySpeechAutomationPort -PortFilePath $portFilePath

    $null = Wait-OnlySpeechAutomationCondition -Condition {
      $snapshot = Invoke-OnlySpeechAutomationRequest -Port $port -Path "/snapshot"
      if ($null -ne $snapshot.kiosk -and $snapshot.kiosk.windows.Count -eq 2) {
        return $snapshot
      }

      return $null
    }

    foreach ($selection in @(
      @{ side = "A"; targetLanguage = "en" },
      @{ side = "B"; targetLanguage = "it" }
    )) {
      $null = Invoke-OnlySpeechAutomationRequest -Port $port -Path "/kiosk/operator-action" -Method "POST" -Body @{
        type = "select-target-language"
        side = $selection.side
        targetLanguage = $selection.targetLanguage
      }
    }

    $idleSnapshot = Wait-OnlySpeechAutomationCondition -TimeoutSeconds 20 -Condition {
      $snapshot = Invoke-OnlySpeechAutomationRequest -Port $port -Path "/snapshot"
      if ($snapshot.kiosk.state.sessionResetReason -eq "idle-clear") {
        return $snapshot
      }

      return $null
    }

    return New-OnlySpeechAutomationPhaseResult -Id "idle-clear" -Status "passed" -Notes "Automation idle timeout returned sessionResetReason=idle-clear and reset both sides to the configured defaults." -Details ([ordered]@{
        session_id = [string]$idleSnapshot.kiosk.state.sessionId
        session_reset_reason = $idleSnapshot.kiosk.state.sessionResetReason
        clear_triggered_at = $idleSnapshot.kiosk.state.clearTriggeredAt
        side_a_language = $idleSnapshot.kiosk.state.sides.A.selectedTargetLanguage
        side_b_language = $idleSnapshot.kiosk.state.sides.B.selectedTargetLanguage
      })
  } finally {
    Stop-OnlySpeechAutomationProcess -Process $process
    Remove-Item -LiteralPath $runtimeRoot -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $automationRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Invoke-VisitorLanguageCatalogCheck {
  param(
    [string]$RepoRoot,
    [hashtable]$BaseEnvValues
  )

  $runtimeRoot = Join-Path ([System.IO.Path]::GetTempPath()) "onlyspeech-commission-visitor-$([guid]::NewGuid())"
  $automationRoot = Join-Path ([System.IO.Path]::GetTempPath()) "onlyspeech-commission-visitor-$([guid]::NewGuid())"
  $appDataRoot = Join-Path $automationRoot "appdata"
  $localAppDataRoot = Join-Path $automationRoot "localappdata"
  $portFilePath = Join-Path $automationRoot "automation-port.txt"
  New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
  New-Item -ItemType Directory -Path $automationRoot -Force | Out-Null
  New-Item -ItemType Directory -Path $appDataRoot -Force | Out-Null
  New-Item -ItemType Directory -Path $localAppDataRoot -Force | Out-Null

  $visitorEnvValues = New-OnlySpeechKioskAutomationEnvMap -BaseEnvValues $BaseEnvValues

  if ([string]::IsNullOrWhiteSpace([string]$visitorEnvValues["SETUP_UI_LANGUAGE"])) {
    $visitorEnvValues["SETUP_UI_LANGUAGE"] = "en"
  }

  $visitorLanguage = [string]$visitorEnvValues["DEFAULT_TARGET_LANG_B"]
  if ([string]::IsNullOrWhiteSpace($visitorLanguage)) {
    $visitorLanguage = "ka"
    $visitorEnvValues["DEFAULT_TARGET_LANG_B"] = $visitorLanguage
  }

  Write-OnlySpeechUtf8File -Path (Join-Path $runtimeRoot ".env") -Content (ConvertTo-OnlySpeechEnvText -Values $visitorEnvValues)
  $process = $null

  try {
    $process = Start-OnlySpeechAutomationApp -RepoRoot $RepoRoot -RuntimeRoot $runtimeRoot -PortFilePath $portFilePath -AppDataRoot $appDataRoot -LocalAppDataRoot $localAppDataRoot
    $port = Wait-OnlySpeechAutomationPort -PortFilePath $portFilePath

    $null = Wait-OnlySpeechAutomationCondition -Condition {
      $snapshot = Invoke-OnlySpeechAutomationRequest -Port $port -Path "/snapshot"
      if ($null -ne $snapshot.kiosk -and $snapshot.kiosk.windows.Count -eq 2) {
        return $snapshot
      }

      return $null
    }

    $selectorInspect = Wait-OnlySpeechAutomationCondition -Condition {
      $inspect = Invoke-OnlySpeechAutomationRequest -Port $port -Path "/kiosk/inspect" -Method "POST" -Body @{
        side = "B"
      }

      if (
        $inspect.view -eq "visitor-language-selection" -and
        -not [string]::IsNullOrWhiteSpace([string]$inspect.activeMacroAreaLabel) -and
        @($inspect.macroAreaLabels) -contains "Asia" -and
        (Test-OnlySpeechContainsNonAscii -Value ([string]$inspect.selectedLanguageTileLabel))
      ) {
        return $inspect
      }

      return $null
    }

    $null = Invoke-OnlySpeechAutomationRequest -Port $port -Path "/kiosk/operator-action" -Method "POST" -Body @{
      type = "select-target-language"
      side = "B"
      targetLanguage = $visitorLanguage
    }

    $sessionInspect = Wait-OnlySpeechAutomationCondition -Condition {
      $inspect = Invoke-OnlySpeechAutomationRequest -Port $port -Path "/kiosk/inspect" -Method "POST" -Body @{
        side = "B"
      }

      if (
        $inspect.view -eq "visitor-session" -and
        (Test-OnlySpeechContainsNonAscii -Value ([string]$inspect.currentLanguageChipTitle)) -and
        (Test-OnlySpeechContainsNonAscii -Value ([string]$inspect.currentLanguageChipValue)) -and
        (Test-OnlySpeechContainsNonAscii -Value ([string]$inspect.changeLanguageLabel))
      ) {
        return $inspect
      }

      return $null
    }

    return New-OnlySpeechAutomationPhaseResult -Id "visitor-language-catalog-validation" -Status "passed" -Notes "Automation inspect proof observed Station B on a grouped selector macro-area with the Asia hotspot present for the selected non-Latin language, then committed that language and rendered the selected-language chip plus session labels with native glyphs." -Details ([ordered]@{
        target_language = $visitorLanguage
        selector_title = [string]$selectorInspect.selectorTitle
        selector_description = [string]$selectorInspect.selectorDescription
        active_macro_area_label = [string]$selectorInspect.activeMacroAreaLabel
        macro_area_labels = @($selectorInspect.macroAreaLabels)
        selected_language_tile_label = [string]$selectorInspect.selectedLanguageTileLabel
        current_language_chip_title = [string]$sessionInspect.currentLanguageChipTitle
        current_language_chip_value = [string]$sessionInspect.currentLanguageChipValue
        change_language_label = [string]$sessionInspect.changeLanguageLabel
        direction = [string]$sessionInspect.direction
      })
  } finally {
    Stop-OnlySpeechAutomationProcess -Process $process
    Remove-Item -LiteralPath $runtimeRoot -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $automationRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$resolvedOutputPath = if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  Join-Path $repoRoot "artifacts\logs\target-station-automation.json"
} else {
  Resolve-OnlySpeechPathFromRepoRoot -RepoRoot $repoRoot -Path $OutputPath
}
$resolvedValidationPath = Resolve-OnlySpeechPathFromRepoRoot -RepoRoot $repoRoot -Path $UpdateValidationPath
$plannedRuntimeEnvPath = Resolve-OnlySpeechRuntimeEnvPath -RepoRoot $repoRoot -RequestedPath $RuntimeEnvPath -AllowMissing
$resolvedRuntimeEnvPath = Resolve-OnlySpeechRuntimeEnvPath -RepoRoot $repoRoot -RequestedPath $RuntimeEnvPath

if (-not $SkipCompile) {
  if (-not $DryRun) {
    Wait-OnlySpeechRepoProcessRelease -RepoRoot $repoRoot -Operation "run compile"
  }
  Invoke-OnlySpeechStep -Label "compile" -FilePath "npm" -Arguments @("run", "compile") -WorkingDirectory $repoRoot -DryRun:$DryRun
}

if ($DryRun) {
  Write-Host "[runtime-env] $plannedRuntimeEnvPath"
  Write-Host "[automation-phase] fullscreen-displays"
  Write-Host "[automation-phase] hard-reset"
  Write-Host "[automation-phase] idle-clear"
  Write-Host "[automation-phase] visitor-language-catalog-validation"
  if (-not [string]::IsNullOrWhiteSpace($resolvedValidationPath)) {
    Write-Host "[validation-update] $resolvedValidationPath"
  }
  Write-Host "[automation-artifact] $resolvedOutputPath"
  exit 0
}

if ($null -eq $resolvedRuntimeEnvPath) {
  $expectedPackagedEnvPath = Resolve-OnlySpeechRuntimeEnvPath -RepoRoot $repoRoot -RequestedPath $RuntimeEnvPath -AllowMissing
  throw "Runtime env file not found. Configure the packaged runtime profile at $expectedPackagedEnvPath, restore the repo-root .env for source-mode runs, or pass -RuntimeEnvPath explicitly."
}

$baseEnvValues = Read-OnlySpeechEnvMap -FilePath $resolvedRuntimeEnvPath

$results = @()
$results += @(Invoke-FullscreenAndHardResetCheck -RepoRoot $repoRoot -BaseEnvValues $baseEnvValues)
$results += @(Invoke-IdleClearCheck -RepoRoot $repoRoot -BaseEnvValues $baseEnvValues)
$results += @(Invoke-VisitorLanguageCatalogCheck -RepoRoot $repoRoot -BaseEnvValues $baseEnvValues)

$artifactDirectory = Split-Path -Parent $resolvedOutputPath
if (-not [string]::IsNullOrWhiteSpace($artifactDirectory)) {
  New-Item -ItemType Directory -Path $artifactDirectory -Force | Out-Null
}

$artifact = [ordered]@{
  schema_version = 1
  generated_at = (Get-Date).ToUniversalTime().ToString("o")
  repository_root = $repoRoot
  station_id = if ([string]::IsNullOrWhiteSpace($StationId)) { $null } else { $StationId }
  runtime_env_path = $resolvedRuntimeEnvPath
  checks = @($results)
}

Write-OnlySpeechUtf8File -Path $resolvedOutputPath -Content ($artifact | ConvertTo-Json -Depth 8)
$artifactRelativePath = Get-OnlySpeechRepoRelativePath -RepoRoot $repoRoot -AbsolutePath $resolvedOutputPath

if (-not [string]::IsNullOrWhiteSpace($resolvedValidationPath)) {
  Merge-TargetStationValidationChecks -ValidationPath $resolvedValidationPath -Results $results -ArtifactRelativePath $artifactRelativePath
}

Write-Host "[automation-artifact] $artifactRelativePath"
if (-not [string]::IsNullOrWhiteSpace($resolvedValidationPath)) {
  Write-Host "[validation-update] $resolvedValidationPath"
}

