param(
  [ValidateSet("report", "export", "cleanup")]
  [string]$Mode = "report",
  [string]$SourcePath,
  [string]$ExportDirectory,
  [int]$OlderThanDays = -1,
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
$helpersPath = Join-Path $PSScriptRoot "..\lib\plans.ps1"
. $repoHelpersPath
. $helpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot

function Get-LogFiles {
  param(
    [string]$LogDirectory
  )

  if (-not (Test-Path -LiteralPath $LogDirectory)) {
    return @()
  }

  return @(Get-ChildItem -LiteralPath $LogDirectory -Filter "*.jsonl" -File | Sort-Object Name)
}

$existingLogPaths = @(Get-OnlySpeechRuntimeLogCandidates -LocalAppData $env:LOCALAPPDATA |
    Where-Object { Test-Path -LiteralPath $_ })
$resolvedSourcePath = Resolve-OnlySpeechRuntimeLogSourcePath `
  -RequestedPath $SourcePath `
  -ExistingPaths $existingLogPaths `
  -LocalAppData $env:LOCALAPPDATA
$logFiles = Get-LogFiles -LogDirectory $resolvedSourcePath
$plan = Get-OnlySpeechRuntimeLogPlan `
  -Mode $Mode `
  -RequestedPath $SourcePath `
  -ExportDirectory $ExportDirectory `
  -OlderThanDays $OlderThanDays `
  -RepoRoot $repoRoot `
  -LocalAppData $env:LOCALAPPDATA `
  -Files $logFiles `
  -ExistingPaths $existingLogPaths

switch ($Mode) {
  "report" {
    Write-Host "[runtime-logs] source=$($plan.SourcePath)"
    Write-Host "[runtime-logs] files=$($plan.Files.Count)"
    foreach ($file in $plan.Files) {
      Write-Host ("[runtime-logs] {0} size={1} lastWrite={2}" -f $file.Name, $file.Length, $file.LastWriteTime.ToString("s"))
    }
  }

  "export" {
    Write-Host "[runtime-logs] source=$($plan.SourcePath)"
    Write-Host "[runtime-logs] export=$($plan.ExportDirectory)"

    if ($DryRun) {
      foreach ($operation in $plan.Operations) {
        Write-Host ("[export] {0} -> {1}" -f $operation.SourcePath, $operation.DestinationPath)
      }
      return
    }

    New-Item -ItemType Directory -Path $plan.ExportDirectory -Force | Out-Null
    foreach ($operation in $plan.Operations) {
      Copy-Item -LiteralPath $operation.SourcePath -Destination $operation.DestinationPath -Force
      Write-Host ("[export] copied {0}" -f $operation.Name)
    }
  }

  "cleanup" {
    Write-Host "[runtime-logs] source=$($plan.SourcePath)"
    Write-Host "[runtime-logs] olderThanDays=$($plan.OlderThanDays)"
    Write-Host "[runtime-logs] matches=$($plan.Operations.Count)"

    foreach ($operation in $plan.Operations) {
      if ($DryRun) {
        Write-Host ("[cleanup] would remove {0}" -f $operation.SourcePath)
      } else {
        Remove-Item -LiteralPath $operation.SourcePath -Force -ErrorAction Stop
        Write-Host ("[cleanup] removed {0}" -f $operation.Name)
      }
    }
  }
}


