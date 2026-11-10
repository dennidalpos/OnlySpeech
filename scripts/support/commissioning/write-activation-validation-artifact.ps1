param(
  [string]$OutputPath = ""
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

function Get-ActivationValidationScenarios {
  return @(
    [ordered]@{
      id = "valid-first-activation"
      status = "pending"
      description = "Start the packaged app without persisted activation state and confirm valid email plus code unlocks the workstation."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "invalid-code-rejected"
      status = "pending"
      description = "Confirm malformed or otherwise invalid activation codes stay blocked with an explicit invalid-code style outcome."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "email-mismatch-rejected"
      status = "pending"
      description = "Confirm a valid code paired with the wrong customer email stays blocked with an email-mismatch style outcome."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "startup-blocked-before-activation"
      status = "pending"
      description = "Confirm packaged startup returns to the activation window before wizard or kiosk flow when local activation state is missing."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "startup-unlock-after-persisted-activation"
      status = "pending"
      description = "Confirm packaged startup resumes normal flow after a successful persisted activation."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "plan-recognition"
      status = "pending"
      description = "Confirm the packaged app or support-visible surface shows the purchased plan expected by the signed claims."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "temporary-plan-expiry"
      status = "pending"
      description = "Confirm a non-lifetime activation is rejected after its expected expiry window."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "lifetime-plan-no-expiry"
      status = "pending"
      description = "Confirm a lifetime activation does not show or enforce a time-based expiry."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "reinstall-preserved-profile"
      status = "pending"
      description = "Confirm reinstall or relaunch with preserved `%LOCALAPPDATA%\\OnlySpeech` keeps the workstation unlocked."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "reinstall-removed-profile"
      status = "pending"
      description = "Confirm reinstall or relaunch after removing the local profile requires activation again."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "clock-rollback"
      status = "pending"
      description = "Confirm a backward clock change larger than 5 minutes triggers the packaged clock-rollback protection."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "copy-risk-observation"
      status = "pending"
      description = "Record the observed outcome when activation material is copied to another workstation only if the release session explicitly authorizes that risk check."
      checked_at = $null
      evidence = $null
      notes = $null
    }
  )
}

function New-ActivationValidationArtifact {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot),
    [string]$OutputPath = ""
  )

  $packageJson = Get-Content -LiteralPath (Join-Path $RepoRoot "package.json") -Raw | ConvertFrom-Json
  $defaultExecutablePath = Join-Path $RepoRoot "artifacts\packages\win-unpacked\OnlySpeech.exe"
  $resolvedOutputPath = if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    Join-Path $RepoRoot "artifacts\logs\activation-validation.json"
  } else {
    $OutputPath
  }

  $artifact = [ordered]@{
    schema_version = 1
    generated_at = (Get-Date).ToString("s")
    application = [ordered]@{
      name = [string]$packageJson.name
      version = [string]$packageJson.version
      packaged_executable = if (Test-Path -LiteralPath $defaultExecutablePath) {
        Get-OnlySpeechRepoRelativePath -RepoRoot $RepoRoot -AbsolutePath $defaultExecutablePath
      } else {
        $null
      }
    }
    validated_by = $null
    notes = $null
    scenarios = @(Get-ActivationValidationScenarios)
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

function Invoke-ActivationValidationArtifactWrite {
  param(
    [string]$OutputPath
  )

  $repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
  $resolvedOutputPath = if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    Join-Path $repoRoot "artifacts\logs\activation-validation.json"
  } else {
    $OutputPath
  }

  $result = New-ActivationValidationArtifact -RepoRoot $repoRoot -OutputPath $resolvedOutputPath
  [Console]::Out.WriteLine("Activation validation artifact written to $(Get-OnlySpeechRepoRelativePath -RepoRoot $repoRoot -AbsolutePath $result.outputPath).")
  exit 0
}

if ($MyInvocation.InvocationName -ne ".") {
  Invoke-ActivationValidationArtifactWrite -OutputPath $OutputPath
}

