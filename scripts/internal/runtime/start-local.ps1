param(
  [switch]$Smoke,
  [int]$SmokeTimeoutMs = 8000,
  [switch]$SetupWizard,
  [ValidateSet("stations", "provider", "languages", "diagnostics", "license")]
  [string]$WizardSection
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

function Get-RequiredRuntimeOutputs {
  param(
    [string]$RepoRoot
  )

  return @(
    (Join-Path $RepoRoot "dist\main\bootstrap.js"),
    (Join-Path $RepoRoot "dist\renderer\index.html")
  )
}

function Get-MissingRuntimeOutputs {
  param(
    [string]$RepoRoot
  )

  return @(
    Get-RequiredRuntimeOutputs -RepoRoot $RepoRoot | Where-Object { -not (Test-Path -LiteralPath $_) }
  )
}

function Get-RuntimeSourceInputs {
  param(
    [string]$RepoRoot
  )

  return @(
    (Join-Path $RepoRoot "src"),
    (Join-Path $RepoRoot "index.html"),
    (Join-Path $RepoRoot "package.json"),
    (Join-Path $RepoRoot "tsconfig.json"),
    (Join-Path $RepoRoot "tsconfig.main.json"),
    (Join-Path $RepoRoot "vite.config.ts")
  ) | Where-Object { Test-Path -LiteralPath $_ }
}

function Get-LatestWriteTimeUtc {
  param(
    [string[]]$Paths = @()
  )

  $latest = [datetime]::MinValue

  foreach ($path in $Paths) {
    if (-not (Test-Path -LiteralPath $path)) {
      continue
    }

    $item = Get-Item -LiteralPath $path
    if ($item.PSIsContainer) {
      $candidates = @($item) + @(Get-ChildItem -LiteralPath $path -Recurse -File -Force -ErrorAction SilentlyContinue)
    } else {
      $candidates = @($item)
    }

    foreach ($candidate in $candidates) {
      $candidateTime = $candidate.LastWriteTimeUtc
      if ($candidateTime -gt $latest) {
        $latest = $candidateTime
      }
    }
  }

  return $latest
}

function Get-StaleRuntimeOutputs {
  param(
    [string]$RepoRoot
  )

  $requiredOutputs = @(Get-RequiredRuntimeOutputs -RepoRoot $RepoRoot)
  if ($requiredOutputs.Count -eq 0) {
    return @()
  }

  $latestSourceWriteTime = Get-LatestWriteTimeUtc -Paths @(Get-RuntimeSourceInputs -RepoRoot $RepoRoot)
  if ($latestSourceWriteTime -eq [datetime]::MinValue) {
    return @()
  }

  return @(
    $requiredOutputs | Where-Object {
      (Get-Item -LiteralPath $_).LastWriteTimeUtc -lt $latestSourceWriteTime
    }
  )
}

function Get-CompileCommand {
  param(
    [string]$Platform = $env:OS
  )

  if ($Platform -eq "Windows_NT" -or $Platform -eq "win32") {
    $command = if ([string]::IsNullOrWhiteSpace($env:ComSpec)) { "cmd.exe" } else { $env:ComSpec }
    return [ordered]@{
      command = $command
      args = @("/d", "/s", "/c", "npm run compile")
    }
  }

  return [ordered]@{
    command = "npm"
    args = @("run", "compile")
  }
}

function Get-ElectronCliPath {
  param(
    [string]$RepoRoot
  )

  return Join-Path $RepoRoot "node_modules\electron\cli.js"
}

function Parse-StartArgs {
  param(
    [string[]]$Arguments = @()
  )

  $options = [ordered]@{
    smoke = $false
    smokeTimeoutMs = 8000
    setupWizard = $false
    wizardSection = $null
  }

  for ($index = 0; $index -lt $Arguments.Count; $index += 1) {
    $argument = $Arguments[$index]

    switch -Regex ($argument) {
      "^--smoke$" {
        $options.smoke = $true
        continue
      }
      "^--timeout-ms$" {
        $index += 1
        $value = $Arguments[$index]
        $parsedValue = 0
        if (-not [int]::TryParse($value, [ref]$parsedValue) -or $parsedValue -lt 1) {
          throw "Invalid smoke timeout '$value'. Use a positive integer in milliseconds."
        }
        $options.smokeTimeoutMs = $parsedValue
        continue
      }
      "^--timeout-ms=(.+)$" {
        $value = $Matches[1]
        $parsedValue = 0
        if (-not [int]::TryParse($value, [ref]$parsedValue) -or $parsedValue -lt 1) {
          throw "Invalid smoke timeout '$value'. Use a positive integer in milliseconds."
        }
        $options.smokeTimeoutMs = $parsedValue
        continue
      }
      "^--setup-wizard$" {
        $options.setupWizard = $true
        continue
      }
      "^--wizard-section$" {
        $index += 1
        $options.wizardSection = if ($index -lt $Arguments.Count) { $Arguments[$index] } else { $null }
        continue
      }
      "^--wizard-section=(.+)$" {
        $options.wizardSection = if ([string]::IsNullOrWhiteSpace($Matches[1])) { $null } else { $Matches[1] }
        continue
      }
      default {
        throw "Unsupported start-local argument '$argument'."
      }
    }
  }

  return $options
}

function Get-ElectronAppArgs {
  param(
    [bool]$SetupWizard = $false,
    [string]$WizardSection = $null
  )

  $args = @()
  if ($SetupWizard) {
    $args += "--setup-wizard"
  }

  if (-not [string]::IsNullOrWhiteSpace($WizardSection)) {
    $args += "--wizard-section"
    $args += $WizardSection
  }

  return $args
}

function Get-StartPlan {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot),
    [string]$Platform = $env:OS,
    [bool]$SetupWizard = $false,
    [string]$WizardSection = $null
  )

  $electronCli = Get-ElectronCliPath -RepoRoot $RepoRoot
  $missingOutputs = @(Get-MissingRuntimeOutputs -RepoRoot $RepoRoot)
  $staleOutputs = if ($missingOutputs.Count -eq 0) { @(Get-StaleRuntimeOutputs -RepoRoot $RepoRoot) } else { @() }
  $compileCommand = if ($missingOutputs.Count -gt 0 -or $staleOutputs.Count -gt 0) { Get-CompileCommand -Platform $Platform } else { $null }
  $compileReason = if ($missingOutputs.Count -gt 0) {
    "missing-runtime-output"
  } elseif ($staleOutputs.Count -gt 0) {
    "stale-runtime-output"
  } else {
    $null
  }

  return [ordered]@{
    repoRoot = $RepoRoot
    electronCli = $electronCli
    electronInstalled = (Test-Path -LiteralPath $electronCli)
    missingRuntimeOutputs = @($missingOutputs)
    staleRuntimeOutputs = @($staleOutputs)
    compileReason = $compileReason
    compileCommand = $compileCommand
    startCommand = "node"
    startWorkingDirectory = $RepoRoot
    startArgs = @($electronCli, $RepoRoot) + @(Get-ElectronAppArgs -SetupWizard $SetupWizard -WizardSection $WizardSection)
  }
}

function Invoke-CompileIfNeeded {
  param(
    $Plan
  )

  if ($Plan.compileReason -eq $null) {
    return 0
  }

  if ($Plan.compileReason -eq "stale-runtime-output") {
    [Console]::Out.WriteLine("OnlySpeech runtime outputs are older than source or config inputs. Running 'npm run compile' before launch.")
  } else {
    [Console]::Out.WriteLine("OnlySpeech runtime is not compiled yet. Running 'npm run compile' before launch.")
  }
  & $Plan.compileCommand.command $Plan.compileCommand.args
  return $LASTEXITCODE
}

function Invoke-StartLocal {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot),
    [string]$Platform = $env:OS,
    [bool]$SetupWizard = $false,
    [string]$WizardSection = $null
  )

  $plan = Get-StartPlan -RepoRoot $RepoRoot -Platform $Platform -SetupWizard $SetupWizard -WizardSection $WizardSection
  $compileExitCode = Invoke-CompileIfNeeded -Plan $plan
  if ($compileExitCode -ne 0) {
    return $compileExitCode
  }

  if (-not $plan.electronInstalled) {
    [Console]::Error.WriteLine("Electron is not installed locally. Run 'npm run bootstrap' first.")
    return 1
  }

  Push-Location -LiteralPath $plan.startWorkingDirectory
  try {
    & $plan.startCommand $plan.startArgs
    return $LASTEXITCODE
  } finally {
    Pop-Location
  }
}

function Invoke-StartLocalSmoke {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot),
    [string]$Platform = $env:OS,
    [int]$SmokeTimeoutMs = 8000,
    [bool]$SetupWizard = $false,
    [string]$WizardSection = $null
  )

  $plan = Get-StartPlan -RepoRoot $RepoRoot -Platform $Platform -SetupWizard $SetupWizard -WizardSection $WizardSection
  $compileExitCode = Invoke-CompileIfNeeded -Plan $plan
  if ($compileExitCode -ne 0) {
    return $compileExitCode
  }

  if (-not $plan.electronInstalled) {
    [Console]::Error.WriteLine("Electron is not installed locally. Run 'npm run bootstrap' first.")
    return 1
  }

  $process = Start-Process -FilePath $plan.startCommand -ArgumentList $plan.startArgs -WorkingDirectory $plan.startWorkingDirectory -PassThru -WindowStyle Hidden
  try {
    Wait-Process -Id $process.Id -Timeout ([Math]::Max([int][Math]::Ceiling($SmokeTimeoutMs / 1000), 1)) -ErrorAction Stop
    $process.Refresh()
    [Console]::Error.WriteLine("OnlySpeech exited before the smoke timeout expired (exit code $($process.ExitCode)).")
    return 1
  } catch {
    if ($_.Exception -is [System.TimeoutException] -or $_.FullyQualifiedErrorId -like "*Timeout*") {
      [Console]::Out.WriteLine("OnlySpeech stayed alive for ${SmokeTimeoutMs}ms. Ending smoke run.")
      return 0
    }

    [Console]::Error.WriteLine("OnlySpeech smoke start failed before the runtime became stable: $($_.Exception.Message)")
    return 1
  } finally {
    if (-not $process.HasExited) {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
  }
}

if ($MyInvocation.InvocationName -ne ".") {
  $repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot

  if ($Smoke) {
    exit (Invoke-StartLocalSmoke -RepoRoot $repoRoot -SmokeTimeoutMs $SmokeTimeoutMs -SetupWizard:$SetupWizard -WizardSection $WizardSection)
  }

  exit (Invoke-StartLocal -RepoRoot $repoRoot -SetupWizard:$SetupWizard -WizardSection $WizardSection)
}

