param(
  [switch]$Smoke,
  [int]$SmokeTimeoutMs = 8000,
  [switch]$SetupWizard,
  [ValidateSet("stations", "provider", "languages", "diagnostics", "license")]
  [string]$WizardSection,
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "support\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$launcherScript = Join-Path $repoRoot "scripts\support\runtime\start-local.ps1"
$arguments = @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $launcherScript
)

if ($Smoke) {
  $arguments += "-Smoke"
  $arguments += "-SmokeTimeoutMs"
  $arguments += $SmokeTimeoutMs
}

if ($SetupWizard) {
  $arguments += "-SetupWizard"
}

if (-not [string]::IsNullOrWhiteSpace($WizardSection)) {
  $arguments += "-WizardSection"
  $arguments += $WizardSection
}

Invoke-OnlySpeechStep -Label "start" -FilePath "powershell.exe" -Arguments $arguments -WorkingDirectory $repoRoot -DryRun:$DryRun

