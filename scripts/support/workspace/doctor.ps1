param()

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot

function Write-Check {
  param(
    [string]$Status,
    [string]$Message,
    [string]$Details = ""
  )

  $suffix = if ($Details) { ": $Details" } else { "" }
  Write-Host "[$Status] $Message$suffix"
}

function Read-EnvFile {
  param(
    [string]$FilePath
  )

  if (-not (Test-Path $FilePath)) {
    return $null
  }

  $values = @{}
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
    $value = $line.Substring($separatorIndex + 1).Trim()
    $values[$key] = $value
  }

  return $values
}

function Get-MatchesFromFile {
  param(
    [string]$FilePath,
    [string]$Pattern
  )

  if (-not (Test-Path $FilePath)) {
    return @()
  }

  $content = Get-Content -LiteralPath $FilePath -Raw
  return [regex]::Matches($content, $Pattern) | ForEach-Object { $_.Groups[1].Value }
}

function Get-CanonicalInteractionLanguageEntries {
  param(
    [string]$FilePath
  )

  if (-not (Test-Path $FilePath)) {
    return @()
  }

  $content = Get-Content -LiteralPath $FilePath -Raw
  $pattern = 'code:\s*"(?<code>[^"]+)".*?providers:\s*\{\s*azure:\s*\{\s*enabled:\s*(?<azure>true|false).*?\}\s*,\s*chatgpt:\s*\{\s*enabled:\s*(?<chatgpt>true|false).*?\}'
  $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)

  return $matches | ForEach-Object {
    [pscustomobject]@{
      Code = $_.Groups["code"].Value
      AzureEnabled = $_.Groups["azure"].Value -eq "true"
      ChatGptEnabled = $_.Groups["chatgpt"].Value -eq "true"
    }
  }
}

function Get-SupportedInteractionLanguageCodes {
  param(
    [object[]]$Entries,
    [string]$Provider
  )

  if ($null -eq $Entries -or $Entries.Count -eq 0) {
    return @()
  }

  $filteredEntries = switch ($Provider) {
    "azure" { $Entries | Where-Object { $_.AzureEnabled } }
    "chatgpt" { $Entries | Where-Object { $_.ChatGptEnabled } }
    default { $Entries }
  }

  return @($filteredEntries | ForEach-Object { $_.Code })
}

function Get-IntegerEnvValue {
  param(
    [hashtable]$Values,
    [string]$Key,
    [int]$DefaultValue
  )

  if ($null -eq $Values -or -not $Values.ContainsKey($Key)) {
    return $DefaultValue
  }

  $parsedValue = 0
  if ([int]::TryParse($Values[$Key], [ref]$parsedValue) -and $parsedValue -gt 0) {
    return $parsedValue
  }

  return $DefaultValue
}

function Get-NormalizedEnvValue {
  param(
    [hashtable]$Values,
    [string]$Key
  )

  if ($null -eq $Values -or -not $Values.ContainsKey($Key)) {
    return ""
  }

  return $Values[$Key].Trim().ToLowerInvariant()
}

function Get-NormalizedMicrophonePttMode {
  param(
    [hashtable]$Values
  )

  $mode = Get-NormalizedEnvValue -Values $Values -Key "MICROPHONE_PTT_MODE"
  if ($mode -eq "single-shared") {
    return "single-shared"
  }

  return "dual-dedicated"
}

function Get-MicrophoneProfileMessage {
  param(
    [string]$MicrophonePttMode,
    [int]$RequiredMicrophones,
    [bool]$HasEnvFile
  )

  if ($MicrophonePttMode -eq "single-shared") {
    if ($RequiredMicrophones -ne 1) {
      return "single-shared profile selected; one shared microphone is supported, but REQUIRED_MICROPHONES=$RequiredMicrophones should normally be 1. Re-save the setup wizard or set REQUIRED_MICROPHONES=1."
    }

    return "single-shared profile active; one assignable microphone can satisfy both sides."
  }

  if ($HasEnvFile) {
    return "dual-dedicated profile active; two assignable microphones are expected."
  }

  return "No .env found; doctor is checking the default dual-dedicated profile (2 microphones). If this workstation is intended for the supported single-shared profile, save MICROPHONE_PTT_MODE=single-shared and REQUIRED_MICROPHONES=1 through the setup wizard or .env."
}

function Get-CompactOutputText {
  param(
    [object[]]$OutputLines,
    [int]$MaxLines = 4
  )

  $normalizedLines = @(
    $OutputLines |
      ForEach-Object { "$_".Trim() } |
      Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
  )

  if ($normalizedLines.Count -eq 0) {
    return ""
  }

  $selectedLines = @($normalizedLines | Select-Object -First $MaxLines)
  if ($normalizedLines.Count -gt $MaxLines) {
    $selectedLines += "..."
  }

  return $selectedLines -join " | "
}

function Test-DependencyInstallState {
  param(
    [string]$RepoRoot
  )

  $output = @()
  $exitCode = 0

  Push-Location $RepoRoot
  try {
    $output = @(& npm @("ls", "--all", "--omit=optional") 2>&1 | ForEach-Object { "$_" })
    $exitCode = $LASTEXITCODE
  } finally {
    Pop-Location
  }

  return [pscustomobject]@{
    ExitCode = $exitCode
    Output = $output
  }
}

function Get-FirstExistingPath {
  param(
    [string]$RootPath,
    [string[]]$RelativePaths
  )

  foreach ($relativePath in $RelativePaths) {
    $candidatePath = Join-Path $RootPath $relativePath
    if (Test-Path -LiteralPath $candidatePath) {
      return $candidatePath
    }
  }

  return $null
}

function Get-LastJsonPayload {
  param(
    [object[]]$OutputLines = @()
  )

  $normalizedLines = @(
    $OutputLines |
      ForEach-Object { "$_".Trim() } |
      Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
  )

  for ($index = $normalizedLines.Count - 1; $index -ge 0; $index -= 1) {
    $candidate = $normalizedLines[$index]
    if ($candidate.StartsWith("{") -or $candidate.StartsWith("[")) {
      return $candidate
    }
  }

  return ""
}

function Get-MicrophoneRepairCommand {
  param(
    [string]$RepoRoot
  )

  return "powershell -ExecutionPolicy Bypass -File .\\scripts\\support\\runtime\\repair-microphones.ps1"
}

$failed = $false
$languageOptionsPath = Join-Path $repoRoot "src\shared\language-options.ts"
$languageRegistryDataPath = Join-Path $repoRoot "src\shared\language-registry-data.ts"
$supportedSourceLanguages = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$supportedTargetLanguages = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$canonicalInteractionLanguageEntries = @(Get-CanonicalInteractionLanguageEntries -FilePath $languageRegistryDataPath)

foreach ($value in (Get-MatchesFromFile -FilePath $languageOptionsPath -Pattern 'value:\s*"([^"]+)"\s*,\s*locale:')) {
  [void]$supportedSourceLanguages.Add($value)
}

foreach ($value in (Get-MatchesFromFile -FilePath $languageOptionsPath -Pattern 'value:\s*"([^"]+)"\s*,\s*label:')) {
  [void]$supportedTargetLanguages.Add($value)
}

$nodeVersionInfo = $null
try {
  $nodeVersionInfo = Get-OnlySpeechNodeVersionInfo
} catch {
  Write-Check "FAIL" "Node.js version" $_.Exception.Message
}

if ($null -eq $nodeVersionInfo) {
  $failed = $true
} elseif ([int]$nodeVersionInfo.Major -ge [int]$nodeVersionInfo.MinimumSupportedMajor) {
  Write-Check "PASS" "Node.js version" $nodeVersionInfo.Version
} else {
  Write-Check "FAIL" "Node.js version" "$($nodeVersionInfo.Version) detected, Node.js $($nodeVersionInfo.MinimumSupportedMajor)+ required"
  $failed = $true
}

if ($env:OS -eq "Windows_NT" -or [System.Environment]::OSVersion.Platform -eq "Win32NT") {
  Write-Check "PASS" "Platform" "Windows detected"
} else {
  Write-Check "WARN" "Platform" "OnlySpeech is Windows-first, current platform is $([System.Environment]::OSVersion.Platform)"
}

$packageLockPath = Join-Path $repoRoot "package-lock.json"
$nodeModulesPath = Join-Path $repoRoot "node_modules"
if (Test-Path -LiteralPath $packageLockPath) {
  Write-Check "PASS" "Dependency lockfile" "package-lock.json found"
} else {
  Write-Check "FAIL" "Dependency lockfile" "package-lock.json missing"
  $failed = $true
}

if (Test-Path -LiteralPath $nodeModulesPath) {
  Write-Check "PASS" "Installed dependencies root" "node_modules present"

  $dependencyInstallState = Test-DependencyInstallState -RepoRoot $repoRoot
  if ($dependencyInstallState.ExitCode -eq 0) {
    Write-Check "PASS" "Dependency installation state" "npm ls --all --omit=optional"
  } else {
    $dependencyDetails = Get-CompactOutputText -OutputLines $dependencyInstallState.Output -MaxLines 4
    $dependencyMessage = "npm ls --all --omit=optional failed. Run npm run bootstrap to restore a deterministic install tree."
    if (-not [string]::IsNullOrWhiteSpace($dependencyDetails)) {
      $dependencyMessage += " $dependencyDetails"
    }

    Write-Check "FAIL" "Dependency installation state" $dependencyMessage
    $failed = $true
  }
} else {
  Write-Check "FAIL" "Installed dependencies root" "node_modules missing; run npm run bootstrap"
  $failed = $true
}

$localToolChecks = @(
  @{
    Label = "Test toolchain"
    RelativePaths = @(
      "node_modules\.bin\vitest.cmd",
      "node_modules\.bin\vitest",
      "node_modules\vitest\vitest.mjs"
    )
    Guidance = "npm test is unavailable until Vitest is installed. Run npm run bootstrap."
  },
  @{
    Label = "Compile toolchain"
    RelativePaths = @(
      "node_modules\.bin\vite.cmd",
      "node_modules\.bin\vite",
      "node_modules\vite\bin\vite.js"
    )
    Guidance = "npm run compile is unavailable until Vite is installed. Run npm run bootstrap."
  },
  @{
    Label = "TypeScript compiler"
    RelativePaths = @(
      "node_modules\.bin\tsc.cmd",
      "node_modules\.bin\tsc",
      "node_modules\typescript\bin\tsc"
    )
    Guidance = "npm run compile is unavailable until TypeScript is installed. Run npm run bootstrap."
  },
  @{
    Label = "Packaging toolchain"
    RelativePaths = @(
      "node_modules\.bin\electron-builder.cmd",
      "node_modules\.bin\electron-builder",
      "node_modules\electron-builder\cli.js"
    )
          Guidance = "npm run package is unavailable until electron-builder is installed. Run npm run bootstrap."
  },
  @{
    Label = "Electron runtime"
    RelativePaths = @(
      "node_modules\electron\cli.js"
    )
    Guidance = "Electron runtime files are missing. Run npm run bootstrap."
  }
)

foreach ($toolCheck in $localToolChecks) {
  $resolvedToolPath = Get-FirstExistingPath -RootPath $repoRoot -RelativePaths $toolCheck.RelativePaths
  if ($null -ne $resolvedToolPath) {
    $relativeToolPath = Resolve-Path -LiteralPath $resolvedToolPath -Relative
    Write-Check "PASS" $toolCheck.Label $relativeToolPath
  } else {
    Write-Check "FAIL" $toolCheck.Label $toolCheck.Guidance
    $failed = $true
  }
}

$envExamplePath = Join-Path $repoRoot ".env.example"
if (Test-Path $envExamplePath) {
  Write-Check "PASS" "Template configuration" ".env.example found"
} else {
  Write-Check "FAIL" "Template configuration" ".env.example missing"
  $failed = $true
}

$envPath = Join-Path $repoRoot ".env"
$envValues = Read-EnvFile -FilePath $envPath
$microphonePttMode = Get-NormalizedMicrophonePttMode -Values $envValues
$requiredMicrophones = Get-IntegerEnvValue -Values $envValues -Key "REQUIRED_MICROPHONES" -DefaultValue 2
if ($null -eq $envValues) {
  Write-Check "WARN" "Runtime configuration" "No .env found. The app will open the integrated setup wizard on first start, or you can create .env from .env.example manually."
} else {
  $provider = "chatgpt"
  if ($envValues.ContainsKey("TRANSLATION_PROVIDER") -and -not [string]::IsNullOrWhiteSpace($envValues["TRANSLATION_PROVIDER"])) {
    $provider = $envValues["TRANSLATION_PROVIDER"].Trim().ToLowerInvariant()
  }

  if ($provider -in @("azure", "chatgpt")) {
    Write-Check "PASS" "Provider selection" $provider
  } else {
    Write-Check "WARN" "Provider selection" "Unsupported TRANSLATION_PROVIDER '$provider'; runtime falls back to chatgpt"
  }

  $speechRequiredKeys = switch ($provider) {
    "azure" { @("AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION") }
    "chatgpt" { @("CHATGPT_API_KEY", "CHATGPT_TRANSCRIBE_MODEL") }
    default { @() }
  }

  if ($speechRequiredKeys.Count -eq 0) {
    Write-Check "WARN" "Speech provider" "Provider '$provider' is not supported yet for end-to-end speech recognition"
  } else {
    $speechMissingKeys = @()
    foreach ($key in $speechRequiredKeys) {
      if (-not $envValues.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($envValues[$key])) {
        $speechMissingKeys += $key
      }
    }

    if ($speechMissingKeys.Count -eq 0) {
      Write-Check "PASS" "Speech provider" "$provider configured for speech recognition"
    } else {
      Write-Check "WARN" "Speech provider" ("Provider '$provider' missing " + ($speechMissingKeys -join ", "))
    }
  }

  $providerRequiredKeys = switch ($provider) {
    "azure" { @("AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION") }
    default { @("CHATGPT_API_KEY", "CHATGPT_MODEL", "CHATGPT_TRANSCRIBE_MODEL") }
  }

  $providerMissingKeys = @()
  foreach ($key in $providerRequiredKeys) {
    if (-not $envValues.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($envValues[$key])) {
      $providerMissingKeys += $key
    }
  }

  if ($providerMissingKeys.Count -eq 0) {
    Write-Check "PASS" "Translation provider" "$provider configured"
  } else {
    Write-Check "WARN" "Translation provider" ("Provider '$provider' missing " + ($providerMissingKeys -join ", "))
  }

  $timeoutValue = if ($envValues.ContainsKey("PROVIDER_REQUEST_TIMEOUT_MS")) {
    $envValues["PROVIDER_REQUEST_TIMEOUT_MS"]
  } else {
    ""
  }

  if ([string]::IsNullOrWhiteSpace($timeoutValue)) {
    Write-Check "PASS" "Provider timeout" "Default 45000ms will be used"
  } else {
    $timeoutNumber = 0
    if ([int]::TryParse($timeoutValue, [ref]$timeoutNumber) -and $timeoutNumber -gt 0) {
      Write-Check "PASS" "Provider timeout" "${timeoutNumber}ms"
    } else {
      Write-Check "WARN" "Provider timeout" "Invalid PROVIDER_REQUEST_TIMEOUT_MS '$timeoutValue'; runtime falls back to 45000"
    }
  }

  $supportedInteractionLanguages = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
  foreach ($code in (Get-SupportedInteractionLanguageCodes -Entries $canonicalInteractionLanguageEntries -Provider $provider)) {
    [void]$supportedInteractionLanguages.Add($code)
  }

  foreach ($key in @("DEFAULT_TARGET_LANG_A", "DEFAULT_TARGET_LANG_B")) {
    if (-not $envValues.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($envValues[$key])) {
      continue
    }

    $value = $envValues[$key].Trim()
    if ($supportedInteractionLanguages.Count -gt 0) {
      if ($supportedInteractionLanguages.Contains($value)) {
        Write-Check "PASS" $key $value
      } else {
        Write-Check "WARN" $key "Unsupported interaction language '$value' for provider '$provider'; runtime falls back to English"
      }
      continue
    }

    if ($supportedTargetLanguages.Contains($value)) {
      Write-Check "PASS" $key $value
    } else {
      Write-Check "WARN" $key "Unsupported target language '$value'; runtime falls back to English"
    }
  }

  Write-Check "INFO" "Speech source language" "Derived automatically from the selected interaction language for each side"
}

Write-Check "INFO" "Microphone profile" (
  Get-MicrophoneProfileMessage `
    -MicrophonePttMode $microphonePttMode `
    -RequiredMicrophones $requiredMicrophones `
    -HasEnvFile ($null -ne $envValues)
)

$launcherPath = Join-Path $repoRoot "scripts\start.ps1"
if (Test-Path $launcherPath) {
$relativeLauncher = "scripts\start.ps1"
  Write-Check "PASS" "Windows launcher" $relativeLauncher
} else {
  Write-Check "WARN" "Windows launcher" "Launcher script not found"
}

if ($env:OS -eq "Windows_NT" -or [System.Environment]::OSVersion.Platform -eq "Win32NT") {
  $electronCliPath = Join-Path $repoRoot "node_modules\electron\cli.js"
  $runtimeDoctorPath = Join-Path $repoRoot "scripts\support\runtime\workstation-runtime-doctor.ps1"

  if ((Test-Path $electronCliPath) -and (Test-Path $runtimeDoctorPath)) {
    $requiredMonitors = Get-IntegerEnvValue -Values $envValues -Key "REQUIRED_MONITORS" -DefaultValue 2
    $runtimeDoctorArgs = @(
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      $runtimeDoctorPath,
      "--json",
      "--required-monitors",
      $requiredMonitors,
      "--required-microphones",
      $requiredMicrophones,
      "--microphone-ptt-mode",
      $microphonePttMode
    )
    $previousDisplayAId = $env:ONLYSPEECH_RUNTIME_DOCTOR_DISPLAY_A_ID
    $previousDisplayBId = $env:ONLYSPEECH_RUNTIME_DOCTOR_DISPLAY_B_ID
    $previousMicAId = $env:ONLYSPEECH_RUNTIME_DOCTOR_MIC_A_ID
    $previousMicBId = $env:ONLYSPEECH_RUNTIME_DOCTOR_MIC_B_ID

    if ($null -ne $envValues) {
      if ($envValues.ContainsKey("DISPLAY_A_ID") -and -not [string]::IsNullOrWhiteSpace($envValues["DISPLAY_A_ID"])) {
        $env:ONLYSPEECH_RUNTIME_DOCTOR_DISPLAY_A_ID = $envValues["DISPLAY_A_ID"].Trim()
      }

      if ($envValues.ContainsKey("DISPLAY_B_ID") -and -not [string]::IsNullOrWhiteSpace($envValues["DISPLAY_B_ID"])) {
        $env:ONLYSPEECH_RUNTIME_DOCTOR_DISPLAY_B_ID = $envValues["DISPLAY_B_ID"].Trim()
      }

      if ($envValues.ContainsKey("MIC_A_ID") -and -not [string]::IsNullOrWhiteSpace($envValues["MIC_A_ID"])) {
        $env:ONLYSPEECH_RUNTIME_DOCTOR_MIC_A_ID = $envValues["MIC_A_ID"].Trim()
      }

      if ($envValues.ContainsKey("MIC_B_ID") -and -not [string]::IsNullOrWhiteSpace($envValues["MIC_B_ID"])) {
        $env:ONLYSPEECH_RUNTIME_DOCTOR_MIC_B_ID = $envValues["MIC_B_ID"].Trim()
      }
    }

    try {
      $runtimeDoctorJson = & powershell.exe @runtimeDoctorArgs 2>&1
      $runtimeDoctorOutput = @($runtimeDoctorJson | ForEach-Object { "$_" })
      if ($LASTEXITCODE -ne 0) {
        Write-Check "WARN" "Workstation runtime diagnostics" ($runtimeDoctorOutput | Out-String).Trim()
      } else {
        $runtimeDoctorPayload = Get-LastJsonPayload -OutputLines $runtimeDoctorOutput
        if ([string]::IsNullOrWhiteSpace($runtimeDoctorPayload)) {
          Write-Check "WARN" "Workstation runtime diagnostics" "No JSON payload was emitted by workstation-runtime-doctor."
          $runtimeDiagnostics = $null
        } else {
          $runtimeDiagnostics = $runtimeDoctorPayload | ConvertFrom-Json
        }

        if ($null -ne $runtimeDiagnostics) {
          $displayAssignments = @($runtimeDiagnostics.displayAssignments | Where-Object { $null -ne $_ })
          $displayIssues = @($runtimeDiagnostics.displayIssues | Where-Object { $null -ne $_ })
          $microphoneAssignments = @($runtimeDiagnostics.microphoneAssignments | Where-Object { $null -ne $_ })
          $microphoneIssues = @($runtimeDiagnostics.microphoneIssues | Where-Object { $null -ne $_ })
          $assignableMicrophones = @($runtimeDiagnostics.assignableMicrophones | Where-Object { $null -ne $_ })
          $displays = @($runtimeDiagnostics.displays | Where-Object { $null -ne $_ })

          $displaySummary = "$($displays.Count) detected"
          if ($displayAssignments.Count -gt 0) {
            $displaySummary += "; " + (($displayAssignments | ForEach-Object {
                  "$($_.side)=$($_.label)"
                }) -join ", ")
          }

          if ($displayIssues.Count -eq 0) {
            Write-Check "PASS" "Workstation displays" $displaySummary
          } else {
            Write-Check "WARN" "Workstation displays" ($displaySummary + " | " + (($displayIssues) -join " "))
          }

          if ($runtimeDiagnostics.microphonePermissionGranted) {
            Write-Check "PASS" "Microphone permission" "Electron media capture succeeded"
          } else {
            $microphonePermissionError = if ([string]::IsNullOrWhiteSpace($runtimeDiagnostics.microphoneError)) {
              "Permission was denied or the media probe failed"
            } else {
              $runtimeDiagnostics.microphoneError
            }

            Write-Check "WARN" "Microphone permission" $microphonePermissionError
          }

          $microphoneSummary = "$($assignableMicrophones.Count) assignable"
          if ($microphoneAssignments.Count -gt 0) {
            $microphoneSummary += "; " + (($microphoneAssignments | ForEach-Object {
                  "$($_.side)=$($_.label)"
                }) -join ", ")
          }

          if ($microphoneIssues.Count -eq 0 -and $runtimeDiagnostics.microphonePermissionGranted) {
            Write-Check "PASS" "Assignable microphones" $microphoneSummary
          } else {
            $issueText = (($microphoneIssues) -join " ")
            $details = if ([string]::IsNullOrWhiteSpace($issueText)) { $microphoneSummary } else { "$microphoneSummary | $issueText" }
            Write-Check "WARN" "Assignable microphones" $details

            if (
              $assignableMicrophones.Count -eq 1 -and
              $runtimeDiagnostics.microphonePermissionGranted -and
              $microphonePttMode -eq "dual-dedicated" -and
              $requiredMicrophones -ge 2
            ) {
              Write-Check "INFO" "Microphone profile guidance" "One assignable microphone detected in dual-dedicated mode. The runtime automatically shares it to both sides (1-mic kiosk fallback). To configure a fixed shared microphone explicitly, save MICROPHONE_PTT_MODE=single-shared and REQUIRED_MICROPHONES=1 through the setup wizard."
            }

            $staleMicrophoneAssignments = @($microphoneIssues | Where-Object {
                $_ -like "Configured MIC_A_ID*" -or $_ -like "Configured MIC_B_ID*"
              })
            if ($staleMicrophoneAssignments.Count -gt 0) {
              Write-Check "INFO" "Microphone repair flow" ("Run " + (Get-MicrophoneRepairCommand -RepoRoot $repoRoot) + " to reopen the setup wizard directly on the microphone repair section and save the new assignment.")
            }
          }
        }
      }
    } catch {
      Write-Check "WARN" "Workstation runtime diagnostics" $_.Exception.Message
    } finally {
      $env:ONLYSPEECH_RUNTIME_DOCTOR_DISPLAY_A_ID = $previousDisplayAId
      $env:ONLYSPEECH_RUNTIME_DOCTOR_DISPLAY_B_ID = $previousDisplayBId
      $env:ONLYSPEECH_RUNTIME_DOCTOR_MIC_A_ID = $previousMicAId
      $env:ONLYSPEECH_RUNTIME_DOCTOR_MIC_B_ID = $previousMicBId
    }
  } else {
    Write-Check "WARN" "Workstation runtime diagnostics" "Electron runtime probe unavailable until local dependencies are installed"
  }
}

Write-Check "INFO" "Touch input" "Verify touch input manually on the commissioned workstation"

if ($failed) {
  exit 1
}
