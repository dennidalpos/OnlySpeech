param(
  [string]$Tag,
  [string]$Version
)

$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

function Get-PackageVersion {
  param(
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot)
  )

  $packageJsonPath = Join-Path $RepoRoot "package.json"
  $packageJson = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json
  $resolvedVersion = [string]$packageJson.version

  if ([string]::IsNullOrWhiteSpace($resolvedVersion)) {
    throw "package.json does not contain a valid version string."
  }

  return $resolvedVersion.Trim()
}

function Test-ReleaseTag {
  param(
    [string]$Tag,
    [string]$Version = (Get-PackageVersion)
  )

  if ([string]::IsNullOrWhiteSpace($Tag)) {
    return [ordered]@{
      ok = $false
      message = "Release tag is required."
    }
  }

  $normalizedTag = $Tag.Trim()
  $expectedTag = "v$Version"

  if ($normalizedTag -ne $expectedTag) {
    return [ordered]@{
      ok = $false
      message = "Release tag mismatch: expected $expectedTag, received $normalizedTag."
    }
  }

  return [ordered]@{
    ok = $true
    message = "Release tag $normalizedTag matches package.json version $Version."
  }
}

function Invoke-ReleaseTagCheck {
  param(
    [string]$Tag,
    [string]$Version
  )

  $resolvedTag = if (-not [string]::IsNullOrWhiteSpace($Tag)) {
    $Tag
  } elseif (-not [string]::IsNullOrWhiteSpace($env:GITHUB_REF_NAME)) {
    $env:GITHUB_REF_NAME
  } elseif (-not [string]::IsNullOrWhiteSpace($env:RELEASE_TAG)) {
    $env:RELEASE_TAG
  } else {
    ""
  }

  $resolvedVersion = if ([string]::IsNullOrWhiteSpace($Version)) { Get-PackageVersion } else { $Version }
  $result = Test-ReleaseTag -Tag $resolvedTag -Version $resolvedVersion
  if (-not $result.ok) {
    [Console]::Error.WriteLine($result.message)
    exit 1
  }

  [Console]::Out.WriteLine($result.message)
  exit 0
}

if ($MyInvocation.InvocationName -ne ".") {
  Invoke-ReleaseTagCheck -Tag $Tag -Version $Version
}

