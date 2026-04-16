function Resolve-OnlySpeechCanonicalLocalAppDataPath {
  param(
    [string]$LocalAppData,
    [string]$SpecialFolderPath
  )

  if (-not [string]::IsNullOrWhiteSpace($LocalAppData)) {
    return $LocalAppData
  }

  $resolvedSpecialFolderPath = if ([string]::IsNullOrWhiteSpace($SpecialFolderPath)) {
    [Environment]::GetFolderPath([System.Environment+SpecialFolder]::LocalApplicationData)
  } else {
    $SpecialFolderPath
  }

  if (-not [string]::IsNullOrWhiteSpace($resolvedSpecialFolderPath)) {
    return $resolvedSpecialFolderPath
  }

  throw "Unable to resolve the canonical OnlySpeech LocalAppData root on this workstation."
}

function Get-OnlySpeechRuntimeLogCandidates {
  param(
    [string]$LocalAppData,
    [string]$SpecialFolderPath
  )

  $resolvedLocalAppData = Resolve-OnlySpeechCanonicalLocalAppDataPath `
    -LocalAppData $LocalAppData `
    -SpecialFolderPath $SpecialFolderPath

  return @(
    Join-Path $resolvedLocalAppData "OnlySpeech\logs"
  )
}

function Resolve-OnlySpeechRuntimeLogSourcePath {
  param(
    [string]$RequestedPath,
    [string[]]$ExistingPaths = @(),
    [string]$LocalAppData
  )

  if (-not [string]::IsNullOrWhiteSpace($RequestedPath)) {
    return $RequestedPath
  }

  $candidates = @(Get-OnlySpeechRuntimeLogCandidates -LocalAppData $LocalAppData)
  foreach ($candidate in $candidates) {
    if ($ExistingPaths -contains $candidate) {
      return $candidate
    }
  }

  return $candidates[0]
}

function Get-OnlySpeechRuntimeLogPlan {
  param(
    [ValidateSet("report", "export", "cleanup")]
    [string]$Mode = "report",
    [string]$RequestedPath,
    [string]$ExportDirectory,
    [int]$OlderThanDays = -1,
    [string]$RepoRoot,
    [string]$LocalAppData,
    [object[]]$Files = @(),
    [string[]]$ExistingPaths = @(),
    [datetime]$Now = (Get-Date)
  )

  $resolvedSourcePath = Resolve-OnlySpeechRuntimeLogSourcePath `
    -RequestedPath $RequestedPath `
    -ExistingPaths $ExistingPaths `
    -LocalAppData $LocalAppData

  $resolvedExportDirectory = if ([string]::IsNullOrWhiteSpace($ExportDirectory)) {
    Join-Path $RepoRoot "artifacts\logs\runtime-logs"
  } else {
    $ExportDirectory
  }

  $normalizedFiles = @($Files | Sort-Object Name | ForEach-Object {
      [pscustomobject]@{
        Name = $_.Name
        FullName = $_.FullName
        Length = $_.Length
        LastWriteTime = [datetime]$_.LastWriteTime
      }
    })

  $operations = @()
  $threshold = $null

  if ($Mode -eq "export") {
    $operations = @($normalizedFiles | ForEach-Object {
        [pscustomobject]@{
          Action = "copy"
          Name = $_.Name
          SourcePath = $_.FullName
          DestinationPath = Join-Path $resolvedExportDirectory $_.Name
        }
      })
  } elseif ($Mode -eq "cleanup") {
    if ($OlderThanDays -lt 0) {
      throw "cleanup mode requires -OlderThanDays with a non-negative value."
    }

    $threshold = $Now.AddDays(-$OlderThanDays)
    $operations = @($normalizedFiles | Where-Object { $_.LastWriteTime -lt $threshold } | ForEach-Object {
        [pscustomobject]@{
          Action = "remove"
          Name = $_.Name
          SourcePath = $_.FullName
        }
      })
  }

  return [pscustomobject]@{
    Mode = $Mode
    SourcePath = $resolvedSourcePath
    ExportDirectory = $resolvedExportDirectory
    OlderThanDays = $OlderThanDays
    Threshold = $threshold
    Files = $normalizedFiles
    Operations = $operations
  }
}

function Get-OnlySpeechStartupShortcutPlan {
  param(
    [string]$ShortcutName = "OnlySpeech.lnk",
    [string]$AppData,
    [string]$LauncherPath,
    [string]$RepoRoot,
    [string]$IconPath
  )

  $startupDirectory = Join-Path $AppData "Microsoft\Windows\Start Menu\Programs\Startup"
  $resolvedIconPath = if ([string]::IsNullOrWhiteSpace($IconPath)) {
    Join-Path $RepoRoot "build\icon.ico"
  } else {
    $IconPath
  }

  return [pscustomobject]@{
    ShortcutName = $ShortcutName
    StartupDirectory = $startupDirectory
    ShortcutPath = Join-Path $startupDirectory $ShortcutName
    TargetPath = "powershell.exe"
    Arguments = "-ExecutionPolicy Bypass -File `"$LauncherPath`" -PreferPackaged"
    WorkingDirectory = $RepoRoot
    IconLocation = $resolvedIconPath
  }
}

function Get-OnlySpeechStartupShortcutRemovalPlan {
  param(
    [string]$ShortcutName = "OnlySpeech.lnk",
    [string]$AppData
  )

  $startupDirectory = Join-Path $AppData "Microsoft\Windows\Start Menu\Programs\Startup"
  return [pscustomobject]@{
    ShortcutName = $ShortcutName
    StartupDirectory = $startupDirectory
    ShortcutPath = Join-Path $startupDirectory $ShortcutName
  }
}

function Get-OnlySpeechAutostartTaskPlan {
  param(
    [string]$TaskName = "OnlySpeech Kiosk",
    [switch]$PreferPackaged,
    [string]$LauncherScript,
    [string]$RepoRoot,
    [string]$Username
  )

  $arguments = "-ExecutionPolicy Bypass -File `"$LauncherScript`" -SkipInstall -SkipDoctor"
  if ($PreferPackaged) {
    $arguments += " -PreferPackaged"
  }

  return [pscustomobject]@{
    TaskName = $TaskName
    Execute = "powershell.exe"
    Arguments = $arguments
    WorkingDirectory = $RepoRoot
    PrincipalUserId = $Username
    Description = "Starts the OnlySpeech kiosk app at user logon."
  }
}

function Get-OnlySpeechAutostartTaskRemovalPlan {
  param(
    [string]$TaskName = "OnlySpeech Kiosk"
  )

  return [pscustomobject]@{
    TaskName = $TaskName
  }
}
