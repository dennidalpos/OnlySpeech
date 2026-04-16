function Resolve-OnlySpeechRepoRoot {
  param(
    [string]$ScriptRoot = $PSScriptRoot
  )

  $resolvedScriptRoot = (Resolve-Path -LiteralPath $ScriptRoot).Path
  $currentDirectory = $resolvedScriptRoot

  while (-not [string]::IsNullOrWhiteSpace($currentDirectory)) {
    if (Test-Path -LiteralPath (Join-Path $currentDirectory "package.json")) {
      return $currentDirectory
    }

    $parentDirectory = Split-Path -Path $currentDirectory -Parent
    if ([string]::IsNullOrWhiteSpace($parentDirectory) -or $parentDirectory -eq $currentDirectory) {
      break
    }

    $currentDirectory = $parentDirectory
  }

  throw "Unable to resolve the OnlySpeech repository root from '$resolvedScriptRoot'."
}

function Get-OnlySpeechMinimumSupportedNodeMajor {
  return 22
}

function Get-OnlySpeechNodeVersionInfo {
  param(
    [string]$NodeVersionText = ""
  )

  if ([string]::IsNullOrWhiteSpace($NodeVersionText)) {
    $NodeVersionText = & node --version 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($NodeVersionText)) {
      throw "Node.js not found in PATH. Install Node.js 22+ before running OnlySpeech bootstrap or repository checks."
    }
  }

  $majorText = ($NodeVersionText -replace '^v', '').Split('.')[0]
  $nodeMajor = 0
  if (-not [int]::TryParse($majorText, [ref]$nodeMajor)) {
    throw "Unable to parse Node.js version '$NodeVersionText'."
  }

  return [ordered]@{
    Version = $NodeVersionText
    Major = $nodeMajor
    MinimumSupportedMajor = (Get-OnlySpeechMinimumSupportedNodeMajor)
  }
}

function Assert-OnlySpeechSupportedNodeVersion {
  param(
    [string]$NodeVersionText = ""
  )

  $nodeVersionInfo = Get-OnlySpeechNodeVersionInfo -NodeVersionText $NodeVersionText
  if ([int]$nodeVersionInfo.Major -lt [int]$nodeVersionInfo.MinimumSupportedMajor) {
    throw "Node.js $($nodeVersionInfo.Version) detected. OnlySpeech requires Node.js $($nodeVersionInfo.MinimumSupportedMajor)+ for bootstrap and repository verification."
  }

  return $nodeVersionInfo
}

function Get-OnlySpeechCanonicalLocalAppDataPath {
  param(
    [string]$LocalAppData = $env:LOCALAPPDATA
  )

  if (-not [string]::IsNullOrWhiteSpace($LocalAppData)) {
    return [System.IO.Path]::GetFullPath($LocalAppData)
  }

  $specialFolderPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::LocalApplicationData)
  if ([string]::IsNullOrWhiteSpace($specialFolderPath)) {
    return ""
  }

  return [System.IO.Path]::GetFullPath($specialFolderPath)
}

function Get-OnlySpeechPackagedRuntimeRoot {
  param(
    [string]$LocalAppData = $env:LOCALAPPDATA
  )

  $canonicalLocalAppData = Get-OnlySpeechCanonicalLocalAppDataPath -LocalAppData $LocalAppData
  if ([string]::IsNullOrWhiteSpace($canonicalLocalAppData)) {
    return ""
  }

  return Join-Path $canonicalLocalAppData "OnlySpeech"
}

function Resolve-OnlySpeechRuntimeEnvPath {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot),
    [string]$RequestedPath = "",
    [string]$LocalAppData = $env:LOCALAPPDATA,
    [switch]$AllowMissing
  )

  if (-not [string]::IsNullOrWhiteSpace($RequestedPath)) {
    $resolvedRequestedPath = if ([System.IO.Path]::IsPathRooted($RequestedPath)) {
      [System.IO.Path]::GetFullPath($RequestedPath)
    } else {
      [System.IO.Path]::GetFullPath((Join-Path $RepoRoot $RequestedPath))
    }

    if ($AllowMissing -or (Test-Path -LiteralPath $resolvedRequestedPath)) {
      return $resolvedRequestedPath
    }

    return $null
  }

  $candidatePaths = New-Object System.Collections.Generic.List[string]
  $packagedRuntimeRoot = Get-OnlySpeechPackagedRuntimeRoot -LocalAppData $LocalAppData
  if (-not [string]::IsNullOrWhiteSpace($packagedRuntimeRoot)) {
    $candidatePaths.Add((Join-Path $packagedRuntimeRoot ".env"))
  }
  $candidatePaths.Add((Join-Path $RepoRoot ".env"))

  foreach ($candidatePath in $candidatePaths) {
    if (Test-Path -LiteralPath $candidatePath) {
      return [System.IO.Path]::GetFullPath($candidatePath)
    }
  }

  if ($AllowMissing) {
    return [System.IO.Path]::GetFullPath($candidatePaths[0])
  }

  return $null
}

function Invoke-OnlySpeechStep {
  param(
    [string]$Label,
    [string]$FilePath,
    [string[]]$Arguments = @(),
    [string]$WorkingDirectory = (Resolve-OnlySpeechRepoRoot),
    [switch]$DryRun
  )

  $argumentText = if ($Arguments.Count -gt 0) { $Arguments -join " " } else { "" }
  Write-Host "[$Label] $FilePath $argumentText".TrimEnd()

  if ($DryRun) {
    return
  }

  Push-Location $WorkingDirectory
  try {
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "$Label failed with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
}

function Get-OnlySpeechInvocationProcessIds {
  $processIds = New-Object System.Collections.Generic.HashSet[int]
  $currentProcessId = [int]$PID

  while ($currentProcessId -gt 0 -and -not $processIds.Contains($currentProcessId)) {
    $processIds.Add($currentProcessId) | Out-Null

    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $currentProcessId" -ErrorAction SilentlyContinue
    if ($null -eq $process) {
      break
    }

    $parentProcessId = [int]$process.ParentProcessId
    if ($parentProcessId -le 0 -or $parentProcessId -eq $currentProcessId) {
      break
    }

    $currentProcessId = $parentProcessId
  }

  return @($processIds)
}

function Get-OnlySpeechRepoLockingProcesses {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot),
    $Processes = $null,
    [int[]]$IgnoreProcessIds = @()
  )

  $resolvedRepoRoot = [System.IO.Path]::GetFullPath($RepoRoot).TrimEnd('\', '/')
  $normalizedRepoRoot = $resolvedRepoRoot.ToLowerInvariant()
  $normalizedRepoRootWithSlash = ($resolvedRepoRoot -replace '\\', '/').ToLowerInvariant()
  $ignoredProcessIds = @($IgnoreProcessIds | ForEach-Object { [int]$_ })

  if ($null -eq $Processes) {
    $Processes = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue)
  }

  $results = @()

  foreach ($process in @($Processes)) {
    $processId = [int]($process.ProcessId)
    if ($ignoredProcessIds -contains $processId) {
      continue
    }

    $processName = [string]$process.Name
    if (@("node.exe", "electron.exe", "onlyspeech.exe") -notcontains $processName.ToLowerInvariant()) {
      continue
    }

    $commandLine = [string]$process.CommandLine
    $executablePath = [string]$process.ExecutablePath
    $haystacks = @($commandLine, $executablePath) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

    $referencesRepo = $false
    foreach ($value in $haystacks) {
      $normalizedValue = $value.ToLowerInvariant()
      if ($normalizedValue.Contains($normalizedRepoRoot) -or $normalizedValue.Contains($normalizedRepoRootWithSlash)) {
        $referencesRepo = $true
        break
      }
    }

    if (-not $referencesRepo) {
      continue
    }

    $results += [pscustomobject]@{
      ProcessId = $processId
      Name = $processName
      ExecutablePath = $executablePath
      CommandLine = $commandLine
    }
  }

  return @($results | Sort-Object Name, ProcessId)
}

function Wait-OnlySpeechRepoProcessRelease {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot),
    [string]$Operation = "run bootstrap",
    [int]$TimeoutSeconds = 15,
    [int[]]$IgnoreProcessIds = @(),
    $Processes = $null,
    [int]$PollMilliseconds = 500
  )

  $resolvedRepoRoot = [System.IO.Path]::GetFullPath($RepoRoot)
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $ignoredProcessIds = @((Get-OnlySpeechInvocationProcessIds) + $IgnoreProcessIds | Select-Object -Unique)

  do {
    $conflicts = @(Get-OnlySpeechRepoLockingProcesses -RepoRoot $resolvedRepoRoot -Processes $Processes -IgnoreProcessIds $ignoredProcessIds)
    if ($conflicts.Count -eq 0) {
      return
    }

    if ((Get-Date) -ge $deadline) {
      $details = @(
        $conflicts | ForEach-Object {
          $summary = if ([string]::IsNullOrWhiteSpace($_.CommandLine)) {
            $_.ExecutablePath
          } else {
            $_.CommandLine
          }

          if ($summary.Length -gt 180) {
            $summary = $summary.Substring(0, 177) + "..."
          }

          " - $($_.Name) pid=$($_.ProcessId): $summary"
        }
      )

      throw "Cannot $Operation while repo-local processes are still active under '$resolvedRepoRoot'. Close the running app, dev server, tests, or shell using this repo and retry.`n$($details -join "`n")"
    }

    Start-Sleep -Milliseconds $PollMilliseconds
  } while ($true)
}

function Get-OnlySpeechRepoRelativePath {
  param(
    [string]$RepoRoot,
    [string]$AbsolutePath
  )

  $resolvedRepoRoot = [System.IO.Path]::GetFullPath($RepoRoot)
  if (-not $resolvedRepoRoot.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
    $resolvedRepoRoot += [System.IO.Path]::DirectorySeparatorChar
  }

  $repoUri = New-Object System.Uri($resolvedRepoRoot)
  $absoluteUri = New-Object System.Uri([System.IO.Path]::GetFullPath($AbsolutePath))
  return [System.Uri]::UnescapeDataString($repoUri.MakeRelativeUri($absoluteUri).ToString())
}

function Get-OnlySpeechFileSha256 {
  param([string]$Path)

  $stream = [System.IO.File]::OpenRead($Path)
  try {
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
      return ([System.BitConverter]::ToString($sha256.ComputeHash($stream))).Replace("-", "").ToLowerInvariant()
    } finally {
      $sha256.Dispose()
    }
  } finally {
    $stream.Dispose()
  }
}

function Write-OnlySpeechUtf8File {
  param(
    [string]$Path,
    [string]$Content
  )

  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}
