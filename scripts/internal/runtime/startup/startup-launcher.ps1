param(
  [switch]$PreferPackaged,
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\..\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$workstationLauncher = Join-Path $repoRoot "scripts\internal\runtime\run-workstation.ps1"

function Invoke-OnlySpeechGitCapture {
  param(
    [string[]]$Arguments = @(),
    [switch]$AllowFailure
  )

  $output = @()
  $exitCode = 0

  Push-Location $repoRoot
  try {
    $output = @(& git @Arguments 2>&1)
    $exitCode = $LASTEXITCODE
  } finally {
    Pop-Location
  }

  $text = (@($output | ForEach-Object { "$_" }) -join [Environment]::NewLine).Trim()
  if ($exitCode -ne 0 -and -not $AllowFailure) {
    if ([string]::IsNullOrWhiteSpace($text)) {
      throw "git $($Arguments -join ' ') failed with exit code $exitCode."
    }

      throw "git $($Arguments -join ' ') failed with exit code ${exitCode}: $text"
  }

  return [pscustomobject]@{
    ExitCode = $exitCode
    Output = $text
  }
}

function Get-OnlySpeechStartupSyncDecision {
  param(
    [string]$RepoRoot
  )

  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    return [pscustomobject]@{
      RequiresSync = $false
      Reason = "Git is not available on this workstation."
      Upstream = ""
    }
  }

  if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot ".git"))) {
    return [pscustomobject]@{
      RequiresSync = $false
      Reason = "The current launcher path is not inside a git checkout."
      Upstream = ""
    }
  }

  $branchResult = Invoke-OnlySpeechGitCapture -Arguments @("rev-parse", "--abbrev-ref", "HEAD")
  $branchName = $branchResult.Output.Trim()
  if ([string]::IsNullOrWhiteSpace($branchName) -or $branchName -eq "HEAD") {
    return [pscustomobject]@{
      RequiresSync = $false
      Reason = "Detached HEAD detected, so automatic startup sync is skipped."
      Upstream = ""
    }
  }

  $upstreamResult = Invoke-OnlySpeechGitCapture -Arguments @("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}") -AllowFailure
  if ($upstreamResult.ExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($upstreamResult.Output)) {
    return [pscustomobject]@{
      RequiresSync = $false
      Reason = "No upstream tracking branch is configured for $branchName."
      Upstream = ""
    }
  }

  $upstream = $upstreamResult.Output.Trim()
  $trackedChanges = (Invoke-OnlySpeechGitCapture -Arguments @("status", "--porcelain", "--untracked-files=no")).Output
  if (-not [string]::IsNullOrWhiteSpace($trackedChanges)) {
    return [pscustomobject]@{
      RequiresSync = $false
      Reason = "Tracked local changes detected, so startup sync is skipped."
      Upstream = $upstream
    }
  }

  $null = Invoke-OnlySpeechGitCapture -Arguments @("fetch", "--quiet", "--prune")

  $behindCount = [int](Invoke-OnlySpeechGitCapture -Arguments @("rev-list", "--count", "HEAD..@{u}")).Output.Trim()
  $aheadCount = [int](Invoke-OnlySpeechGitCapture -Arguments @("rev-list", "--count", "@{u}..HEAD")).Output.Trim()

  if ($behindCount -gt 0 -and $aheadCount -gt 0) {
    return [pscustomobject]@{
      RequiresSync = $false
      Reason = "Local and remote history diverged on $upstream, so startup sync is skipped."
      Upstream = $upstream
    }
  }

  if ($behindCount -gt 0) {
    return [pscustomobject]@{
      RequiresSync = $true
      Reason = "Remote updates detected on $upstream."
      Upstream = $upstream
    }
  }

  return [pscustomobject]@{
    RequiresSync = $false
    Reason = "No remote repo updates detected on $upstream."
    Upstream = $upstream
  }
}

$launchArguments = @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $workstationLauncher,
  "-PreferPackaged"
)
$skipInstall = $true
$skipDoctor = $true

if ($DryRun) {
  Write-Host "[startup-launcher] Dry-run skips remote update detection and plans the fast startup path."
} else {
  try {
    $decision = Get-OnlySpeechStartupSyncDecision -RepoRoot $repoRoot
    Write-Host "[startup-launcher] $($decision.Reason)"

    if ($decision.RequiresSync) {
      try {
        Wait-OnlySpeechRepoProcessRelease -RepoRoot $repoRoot -Operation "sync repo before startup"
        Invoke-OnlySpeechStep -Label "git-pull" -FilePath "git" -Arguments @("pull", "--ff-only") -WorkingDirectory $repoRoot
        $skipInstall = $false
        $skipDoctor = $false
      } catch {
        Write-Warning "Startup sync failed; launching the existing app without bootstrap or doctor. $($_.Exception.Message)"
      }
    }
  } catch {
    Write-Warning "Startup update detection failed; launching the existing app without bootstrap or doctor. $($_.Exception.Message)"
  }
}

if ($skipInstall) {
  $launchArguments += "-SkipInstall"
}

if ($skipDoctor) {
  $launchArguments += "-SkipDoctor"
}

if ($DryRun) {
  $launchArguments += "-DryRun"
}

Invoke-OnlySpeechStep -Label "startup-launch" -FilePath "powershell.exe" -Arguments $launchArguments -WorkingDirectory $repoRoot -DryRun:$DryRun


