param(
  [string]$OutputPath = "",
  [string]$PackageRoot = "",
  [string]$PreviousInstallerPath = "",
  [string]$RollbackInstallerPath = ""
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

function Resolve-OnlySpeechArtifactInputPath {
  param(
    [string]$RepoRoot,
    [string]$Path
  )

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return $null
  }

  $resolvedPath = if ([System.IO.Path]::IsPathRooted($Path)) {
    [System.IO.Path]::GetFullPath($Path)
  } else {
    [System.IO.Path]::GetFullPath((Join-Path $RepoRoot $Path))
  }

  $resolvedRepoRoot = [System.IO.Path]::GetFullPath($RepoRoot).TrimEnd('\', '/')
  if ($resolvedPath.StartsWith("$resolvedRepoRoot\", [System.StringComparison]::OrdinalIgnoreCase)) {
    return Get-OnlySpeechRepoRelativePath -RepoRoot $RepoRoot -AbsolutePath $resolvedPath
  }

  return $resolvedPath
}

function Get-OnlySpeechFirstMatchingFile {
  param(
    [string]$Root,
    [string]$Filter,
    [scriptblock]$Where = { $true }
  )

  if (-not (Test-Path -LiteralPath $Root)) {
    return $null
  }

  return Get-ChildItem -LiteralPath $Root -Filter $Filter -File -ErrorAction SilentlyContinue |
    Where-Object $Where |
    Sort-Object Name |
    Select-Object -First 1
}

function Get-PackagedAutostartValidationScenarios {
  return @(
    [ordered]@{
      id = "autostart-enable-run-key"
      status = "pending"
      description = "Enable automatic startup from the packaged setup wizard and confirm HKCU Run value OnlySpeech exists."
      expected_evidence = "Registry query for HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\OnlySpeech pointing to the packaged OnlySpeech.exe path."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "autostart-launches-at-next-logon"
      status = "pending"
      description = "Sign out or reboot, sign back in as the same user, and confirm the packaged app starts automatically."
      expected_evidence = "Operator note or screenshot showing app launch after real Windows logon for the same user."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "autostart-disable-removes-run-key"
      status = "pending"
      description = "Disable automatic startup from the packaged setup wizard and confirm the HKCU Run value is removed."
      expected_evidence = "Registry query showing the OnlySpeech Run value is absent after disabling the setting."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "autostart-disabled-no-logon-launch"
      status = "pending"
      description = "Sign out or reboot again and confirm the packaged app no longer starts automatically."
      expected_evidence = "Operator note confirming no app process appeared after logon once autostart was disabled."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "autostart-no-legacy-mechanism"
      status = "pending"
      description = "Confirm no Startup shortcut or scheduled task is required for the supported packaged autostart path."
      expected_evidence = "Operator note documenting any Startup shortcut or scheduled task inspection outcome."
      checked_at = $null
      evidence = $null
      notes = $null
    }
  )
}

function Get-UpgradeRollbackValidationScenarios {
  return @(
    [ordered]@{
      id = "previous-installer-install-launch"
      status = "pending"
      description = "Install the retained previous supported installer on the dedicated Windows validation workstation and confirm it launches."
      expected_evidence = "Installer path, install root, launch result, and version note for the previous baseline."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "current-installer-upgrade-launch"
      status = "pending"
      description = "Upgrade the previous install to the current retained installer and confirm the upgraded app launches."
      expected_evidence = "Current installer path, upgrade install root, launch result, and retained lifecycle command output."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "rollback-installer-launch"
      status = "pending"
      description = "Install the retained rollback baseline over the upgraded install and confirm the rolled-back app launches."
      expected_evidence = "Rollback installer path, launch result, and retained lifecycle command output."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "profile-preservation-observation"
      status = "pending"
      description = "Record whether activation state, runtime .env, secure secrets, and setup selections were preserved or intentionally reset across upgrade and rollback."
      expected_evidence = "Operator note referencing the packaged profile under %LOCALAPPDATA%\\OnlySpeech without exposing secrets."
      checked_at = $null
      evidence = $null
      notes = $null
    },
    [ordered]@{
      id = "uninstall-cleanup-observation"
      status = "pending"
      description = "Record the uninstall result for the lifecycle install root and any expected workstation-local state left for support reinstall flows."
      expected_evidence = "Install-root snapshot and note on retained %LOCALAPPDATA%\\OnlySpeech profile state."
      checked_at = $null
      evidence = $null
      notes = $null
    }
  )
}

function New-PackagedCloseoutValidationArtifact {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot),
    [string]$OutputPath = "",
    [string]$PackageRoot = "",
    [string]$PreviousInstallerPath = "",
    [string]$RollbackInstallerPath = ""
  )

  $packageJson = Get-Content -LiteralPath (Join-Path $RepoRoot "package.json") -Raw | ConvertFrom-Json
  $resolvedOutputPath = if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    Join-Path $RepoRoot "artifacts\logs\packaged-closeout-validation.json"
  } else {
    if ([System.IO.Path]::IsPathRooted($OutputPath)) {
      $OutputPath
    } else {
      Join-Path $RepoRoot $OutputPath
    }
  }
  $resolvedPackageRoot = if ([string]::IsNullOrWhiteSpace($PackageRoot)) {
    Join-Path $RepoRoot "artifacts\packages"
  } else {
    if ([System.IO.Path]::IsPathRooted($PackageRoot)) {
      $PackageRoot
    } else {
      Join-Path $RepoRoot $PackageRoot
    }
  }

  $unpackedExecutablePath = Join-Path $resolvedPackageRoot "win-unpacked\OnlySpeech.exe"
  $portableExecutable = Get-OnlySpeechFirstMatchingFile -Root $resolvedPackageRoot -Filter "*.exe" -Where { $_.Name -match "portable" }
  $currentInstaller = Get-OnlySpeechFirstMatchingFile -Root $resolvedPackageRoot -Filter "*.exe" -Where { $_.Name -notmatch "portable" }

  $artifact = [ordered]@{
    schema_version = 1
    generated_at = (Get-Date).ToString("s")
    application = [ordered]@{
      name = [string]$packageJson.name
      version = [string]$packageJson.version
    }
    package_layout = [ordered]@{
      package_root = Resolve-OnlySpeechArtifactInputPath -RepoRoot $RepoRoot -Path $resolvedPackageRoot
      current_installer = if ($null -ne $currentInstaller) { Resolve-OnlySpeechArtifactInputPath -RepoRoot $RepoRoot -Path $currentInstaller.FullName } else { $null }
      portable_executable = if ($null -ne $portableExecutable) { Resolve-OnlySpeechArtifactInputPath -RepoRoot $RepoRoot -Path $portableExecutable.FullName } else { $null }
      unpacked_executable = if (Test-Path -LiteralPath $unpackedExecutablePath) { Resolve-OnlySpeechArtifactInputPath -RepoRoot $RepoRoot -Path $unpackedExecutablePath } else { $null }
    }
    comparison_installers = [ordered]@{
      previous_installer = Resolve-OnlySpeechArtifactInputPath -RepoRoot $RepoRoot -Path $PreviousInstallerPath
      rollback_installer = Resolve-OnlySpeechArtifactInputPath -RepoRoot $RepoRoot -Path $RollbackInstallerPath
    }
    validated_by = $null
    notes = "Use this template only for real packaged workstation close-out. Do not mark scenarios passed until retained evidence exists."
    project_status_task_coverage = @(
      [ordered]@{
        task_id = "residual-packaged-activation-commissioning-validation"
        evidence_paths = @("artifacts/logs/activation-validation.json", "artifacts/logs/commissioning-evidence.json")
        completion_rule = "All activation and target-station commissioning scenarios are passed or explicitly not_applicable with retained evidence."
      },
      [ordered]@{
        task_id = "residual-live-provider-speech-proof"
        evidence_paths = @("artifacts/logs/live-provider-speech-proof.json")
        completion_rule = "Live provider speech scenarios cover microphone input, STT, translation, and TTS playback on real hardware with real credentials."
      },
      [ordered]@{
        task_id = "residual-upgrade-rollback-validation"
        evidence_paths = @("artifacts/logs/packaged-closeout-validation.json")
        completion_rule = "Every upgrade_rollback scenario is passed or explicitly not_applicable with retained installer paths."
      },
      [ordered]@{
        task_id = "residual-packaged-autostart-live-validation"
        evidence_paths = @("artifacts/logs/packaged-closeout-validation.json")
        completion_rule = "Every autostart scenario is passed or explicitly not_applicable after a real Windows logon pass."
      }
    )
    autostart = [ordered]@{
      registry_path = "HKCU\Software\Microsoft\Windows\CurrentVersion\Run"
      value_name = "OnlySpeech"
      expected_target = "Packaged OnlySpeech.exe path selected by the setup wizard."
      scenarios = @(Get-PackagedAutostartValidationScenarios)
    }
    upgrade_rollback = [ordered]@{
      command = "powershell -ExecutionPolicy Bypass -File .\scripts\support\commissioning\test-packaged-install-lifecycle.ps1 -PreviousInstallerPath <previous-installer.exe> -RollbackInstallerPath <rollback-installer.exe>"
      scenarios = @(Get-UpgradeRollbackValidationScenarios)
    }
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

function Invoke-PackagedCloseoutValidationArtifactWrite {
  param(
    [string]$OutputPath,
    [string]$PackageRoot,
    [string]$PreviousInstallerPath,
    [string]$RollbackInstallerPath
  )

  $repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
  $result = New-PackagedCloseoutValidationArtifact `
    -RepoRoot $repoRoot `
    -OutputPath $OutputPath `
    -PackageRoot $PackageRoot `
    -PreviousInstallerPath $PreviousInstallerPath `
    -RollbackInstallerPath $RollbackInstallerPath

  [Console]::Out.WriteLine("Packaged close-out validation artifact written to $(Get-OnlySpeechRepoRelativePath -RepoRoot $repoRoot -AbsolutePath $result.outputPath).")
  exit 0
}

if ($MyInvocation.InvocationName -ne ".") {
  Invoke-PackagedCloseoutValidationArtifactWrite `
    -OutputPath $OutputPath `
    -PackageRoot $PackageRoot `
    -PreviousInstallerPath $PreviousInstallerPath `
    -RollbackInstallerPath $RollbackInstallerPath
}
