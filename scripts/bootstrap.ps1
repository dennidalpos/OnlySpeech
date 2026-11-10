param(
  [switch]$ForceRefresh,
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "support\lib\repo.ps1"
. $repoHelpersPath

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

function Get-OnlySpeechBootstrapPlan {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot),
    [switch]$ForceRefresh,
    $DependencyInstallState = $null,
    [string]$NodeVersion = ""
  )

  $null = Assert-OnlySpeechSupportedNodeVersion -NodeVersionText $NodeVersion

  $packageLockPath = Join-Path $RepoRoot "package-lock.json"
  if (-not (Test-Path -LiteralPath $packageLockPath)) {
    throw "package-lock.json missing at $packageLockPath. Restore the lockfile before bootstrapping dependencies."
  }

  $nodeModulesPath = Join-Path $RepoRoot "node_modules"
  $installArguments = @("ci", "--include=dev", "--omit=optional")

  if ($ForceRefresh) {
    return [ordered]@{
      RepoRoot = $RepoRoot
      ShouldInstall = $true
      Reason = "force-refresh"
      Message = "Force refresh requested; reinstalling dependencies with npm ci."
      Command = "npm"
      Arguments = $installArguments
    }
  }

  if (-not (Test-Path -LiteralPath $nodeModulesPath)) {
    return [ordered]@{
      RepoRoot = $RepoRoot
      ShouldInstall = $true
      Reason = "missing-node-modules"
      Message = "node_modules missing; installing dependencies with npm ci."
      Command = "npm"
      Arguments = $installArguments
    }
  }

  if ($null -eq $DependencyInstallState) {
    $DependencyInstallState = Test-DependencyInstallState -RepoRoot $RepoRoot
  }

  if ([int]$DependencyInstallState.ExitCode -eq 0) {
    return [ordered]@{
      RepoRoot = $RepoRoot
      ShouldInstall = $false
      Reason = "already-installed"
      Message = "node_modules already consistent; skipping npm ci."
      Command = "npm"
      Arguments = $installArguments
    }
  }

  $dependencyDetails = Get-CompactOutputText -OutputLines $DependencyInstallState.Output -MaxLines 4
  $message = "node_modules present but inconsistent; reinstalling dependencies with npm ci."
  if (-not [string]::IsNullOrWhiteSpace($dependencyDetails)) {
    $message += " $dependencyDetails"
  }

  return [ordered]@{
    RepoRoot = $RepoRoot
    ShouldInstall = $true
    Reason = "invalid-dependency-tree"
    Message = $message
    Command = "npm"
    Arguments = $installArguments
  }
}

function Invoke-OnlySpeechBootstrap {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot),
    [switch]$ForceRefresh,
    [switch]$DryRun
  )

  $plan = Get-OnlySpeechBootstrapPlan -RepoRoot $RepoRoot -ForceRefresh:$ForceRefresh
  Write-Host "[bootstrap-status] $($plan.Message)"

  if (-not $plan.ShouldInstall) {
    return 0
  }

  if (-not $DryRun) {
    Wait-OnlySpeechRepoProcessRelease -RepoRoot $RepoRoot -Operation "run bootstrap"
  }

  Invoke-OnlySpeechStep -Label "bootstrap" -FilePath $plan.Command -Arguments $plan.Arguments -WorkingDirectory $RepoRoot -DryRun:$DryRun
  return 0
}

if ($MyInvocation.InvocationName -ne ".") {
  $repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
  exit (Invoke-OnlySpeechBootstrap -RepoRoot $repoRoot -ForceRefresh:$ForceRefresh -DryRun:$DryRun)
}
