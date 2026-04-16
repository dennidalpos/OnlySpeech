param(
  [switch]$SetupWizard,
  [ValidateSet("stations", "provider", "languages", "diagnostics", "license")]
  [string]$WizardSection,
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\internal\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$launcherScript = Join-Path $repoRoot "scripts\internal\runtime\start-local.ps1"
$arguments = @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $launcherScript
)

if ($SetupWizard) {
  $arguments += "-SetupWizard"
}

if (-not [string]::IsNullOrWhiteSpace($WizardSection)) {
  $arguments += "-WizardSection"
  $arguments += $WizardSection
}

Invoke-OnlySpeechStep -Label "start" -FilePath "powershell.exe" -Arguments $arguments -WorkingDirectory $repoRoot -DryRun:$DryRun

