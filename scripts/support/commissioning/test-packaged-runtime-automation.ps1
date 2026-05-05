param(
  [string]$PackageRoot = "",
  [string]$ExecutablePath = "",
  [switch]$DryRun
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

$repoRoot = Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot
$resolvedPackageRoot = if ([string]::IsNullOrWhiteSpace($PackageRoot)) {
  Join-Path $repoRoot "artifacts\packages"
} else {
  $PackageRoot
}
$resolvedExecutablePath = if ([string]::IsNullOrWhiteSpace($ExecutablePath)) {
  Join-Path $resolvedPackageRoot "win-unpacked\OnlySpeech.exe"
} else {
  $ExecutablePath
}

if (-not (Test-Path -LiteralPath $resolvedExecutablePath)) {
  throw "Packaged executable not found: $resolvedExecutablePath"
}

Write-Host "[packaged-runtime-automation] executable=$resolvedExecutablePath"
Write-Host "[packaged-runtime-automation] npm exec -- vitest run tests/packaged-runtime-automation.test.ts"

if ($DryRun) {
  exit 0
}

$previousPackagedExecutable = $env:ONLYSPEECH_PACKAGED_EXECUTABLE

try {
  $env:ONLYSPEECH_PACKAGED_EXECUTABLE = $resolvedExecutablePath
  Invoke-OnlySpeechStep `
    -Label "packaged-runtime-automation" `
    -FilePath "npm" `
    -Arguments @("exec", "--", "vitest", "run", "tests/packaged-runtime-automation.test.ts") `
    -WorkingDirectory $repoRoot
} finally {
  if ($null -eq $previousPackagedExecutable) {
    Remove-Item Env:\ONLYSPEECH_PACKAGED_EXECUTABLE -ErrorAction SilentlyContinue
  } else {
    $env:ONLYSPEECH_PACKAGED_EXECUTABLE = $previousPackagedExecutable
  }
}

