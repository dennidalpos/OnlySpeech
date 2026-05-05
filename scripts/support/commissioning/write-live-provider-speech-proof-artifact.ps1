param(
  [string]$OutputPath = "",
  [string]$RuntimeEnvPath = ""
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

function Read-EnvFile {
  param(
    [string]$FilePath
  )

  if (-not (Test-Path -LiteralPath $FilePath)) {
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

function Test-ConfiguredKeys {
  param(
    [hashtable]$Values,
    [string[]]$Keys
  )

  if ($null -eq $Values) {
    return $false
  }

  foreach ($key in $Keys) {
    if (-not $Values.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($Values[$key])) {
      return $false
    }
  }

  return $true
}

function Get-LiveProviderSpeechValidationScenarios {
  return @(
    [ordered]@{
      id = "initial-save-supported-languages"
      status = "pending"
      provider = "azure-or-chatgpt"
      description = "Select side A/B languages that remain inside the active provider-owned kiosk catalog and confirm the setup wizard saves successfully."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "initial-save-uncovered-language-blocked"
      status = "pending"
      provider = "azure-or-chatgpt"
      description = "Select at least one uncovered language pair and confirm the setup wizard blocks the save with an explicit playback-readiness explanation."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "provider-translation-validation-azure"
      status = "pending"
      provider = "azure"
      description = "Run the provider translation validation from the Diagnostics step with Azure selected and record the returned transcript or provider error."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "provider-translation-validation-chatgpt"
      status = "pending"
      provider = "chatgpt"
      description = "Run the provider translation validation from the Diagnostics step with ChatGPT selected and record the returned transcript or provider error."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "live-microphone-validation-azure"
      status = "pending"
      provider = "azure"
      description = "Run the Azure live microphone validation and retain proof that transcript plus translation are produced from microphone input."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "final-turn-validation-chatgpt"
      status = "pending"
      provider = "chatgpt"
      description = "Run the ChatGPT final-turn speech validation and retain proof that the post-turn transcript plus translation are produced."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "translation-playback-azure"
      status = "pending"
      provider = "azure"
      description = "Trigger Azure playback for a supported language and retain proof that playback starts with the Azure engine and selected voice."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "translation-playback-chatgpt"
      status = "pending"
      provider = "chatgpt"
      description = "Trigger ChatGPT playback for a shared-catalog language and retain proof that playback starts with the OpenAI engine and selected voice."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "unsupported-playback-blocked"
      status = "pending"
      provider = "azure-or-chatgpt"
      description = "Trigger playback for an uncovered language and retain proof that the UI stays explicit without silent cross-provider fallback."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "tts-disabled-runtime"
      status = "pending"
      provider = "azure-or-chatgpt"
      description = "Set TEXT_TO_SPEECH_ENABLED=false, repeat playback, and retain proof that no playback starts while the UI remains coherent."
      checked_at = $null
      evidence = $null
      notes = $null
    }
  )
}

function New-LiveProviderSpeechProofArtifact {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot),
    [string]$OutputPath = "",
    [string]$RuntimeEnvPath = ""
  )

  $resolvedOutputPath = if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    Join-Path $RepoRoot "artifacts\logs\live-provider-speech-proof.json"
  } else {
    $OutputPath
  }

  $resolvedRuntimeEnvPath = Resolve-OnlySpeechRuntimeEnvPath -RepoRoot $RepoRoot -RequestedPath $RuntimeEnvPath -AllowMissing
  $envValues = if (Test-Path -LiteralPath $resolvedRuntimeEnvPath) {
    Read-EnvFile -FilePath $resolvedRuntimeEnvPath
  } else {
    $null
  }
  $translationProvider = if ($null -ne $envValues -and $envValues.ContainsKey("TRANSLATION_PROVIDER") -and -not [string]::IsNullOrWhiteSpace($envValues["TRANSLATION_PROVIDER"])) {
    $envValues["TRANSLATION_PROVIDER"].Trim().ToLowerInvariant()
  } else {
    $null
  }
  $speechProvider = if ($null -ne $envValues -and $envValues.ContainsKey("SPEECH_PROVIDER") -and -not [string]::IsNullOrWhiteSpace($envValues["SPEECH_PROVIDER"])) {
    $envValues["SPEECH_PROVIDER"].Trim().ToLowerInvariant()
  } else {
    $translationProvider
  }
  $textToSpeechEnabled = if ($null -ne $envValues -and $envValues.ContainsKey("TEXT_TO_SPEECH_ENABLED") -and -not [string]::IsNullOrWhiteSpace($envValues["TEXT_TO_SPEECH_ENABLED"])) {
    $envValues["TEXT_TO_SPEECH_ENABLED"].Trim().ToLowerInvariant() -eq "true"
  } else {
    $null
  }

  $artifact = [ordered]@{
    schema_version = 1
    generated_at = (Get-Date).ToString("s")
    station_id = $null
    validated_by = $null
    runtime_env_path = $resolvedRuntimeEnvPath
    notes = "Refresh this template before the real workstation speech pass, then record operator proof for each retained scenario."
    env_readiness = [ordered]@{
      env_file_present = $null -ne $envValues
      translation_provider = $translationProvider
      speech_provider = $speechProvider
      text_to_speech_enabled = $textToSpeechEnabled
      azure = [ordered]@{
        speech_configured = Test-ConfiguredKeys -Values $envValues -Keys @("AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION")
        translator_configured = Test-ConfiguredKeys -Values $envValues -Keys @("AZURE_TRANSLATOR_KEY", "AZURE_TRANSLATOR_REGION")
      }
      chatgpt = [ordered]@{
        translation_configured = Test-ConfiguredKeys -Values $envValues -Keys @("CHATGPT_API_KEY", "CHATGPT_MODEL")
        speech_configured = Test-ConfiguredKeys -Values $envValues -Keys @("CHATGPT_API_KEY", "CHATGPT_TRANSCRIBE_MODEL")
        tts_configured = Test-ConfiguredKeys -Values $envValues -Keys @("CHATGPT_API_KEY", "CHATGPT_TTS_MODEL", "CHATGPT_TTS_VOICE")
      }
    }
    scenarios = @(Get-LiveProviderSpeechValidationScenarios)
  }

  $outputDirectory = Split-Path -Parent $resolvedOutputPath
  if (-not [string]::IsNullOrWhiteSpace($outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
  }

  Write-OnlySpeechUtf8File -Path $resolvedOutputPath -Content ($artifact | ConvertTo-Json -Depth 8)

  return [ordered]@{
    outputPath = $resolvedOutputPath
    artifact = $artifact
  }
}

function Invoke-LiveProviderSpeechProofArtifactWrite {
  param(
    [string]$OutputPath,
    [string]$RuntimeEnvPath
  )

  $repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
  $resolvedOutputPath = if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    Join-Path $repoRoot "artifacts\logs\live-provider-speech-proof.json"
  } else {
    $OutputPath
  }

  $result = New-LiveProviderSpeechProofArtifact -RepoRoot $repoRoot -OutputPath $resolvedOutputPath -RuntimeEnvPath $RuntimeEnvPath
  [Console]::Out.WriteLine("Live provider speech proof artifact written to $(Get-OnlySpeechRepoRelativePath -RepoRoot $repoRoot -AbsolutePath $result.outputPath).")
  exit 0
}

if ($MyInvocation.InvocationName -ne ".") {
  Invoke-LiveProviderSpeechProofArtifactWrite -OutputPath $OutputPath -RuntimeEnvPath $RuntimeEnvPath
}

