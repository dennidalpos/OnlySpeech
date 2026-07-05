<#
.SYNOPSIS
    Installs the OnlySpeech agent skills to the local workspace customization root.
.DESCRIPTION
    Creates or updates the .agents/skills.json configuration to point to the repository's
    version-controlled skills directory. This ensures the AI agent loads these custom skills.
.EXAMPLE
    .\scripts\install-skills.ps1
#>

$ErrorActionPreference = "Stop"

# Get project root (parent directory of the scripts folder)
$ProjectRoot = (Get-Item -Path $PSScriptRoot).Parent.FullName
$SkillsDir = Join-Path -Path $ProjectRoot -ChildPath "skills"
$AgentsDir = Join-Path -Path $ProjectRoot -ChildPath ".agents"

Write-Host "Configuring OnlySpeech agent skills..." -ForegroundColor Cyan

# Ensure .agents folder exists
if (-not (Test-Path -Path $AgentsDir)) {
    New-Item -ItemType Directory -Path $AgentsDir | Out-Null
    Write-Host "Created workspace customizations root: .agents/" -ForegroundColor Gray
}

# Create/update skills.json pointing to the absolute path of skills directory
$SkillsJsonPath = Join-Path -Path $AgentsDir -ChildPath "skills.json"

# Formulate json payload
$Config = @{
    entries = @(
        @{
            path = $SkillsDir.Replace('\', '/')
        }
    )
}

$JsonString = $Config | ConvertTo-Json -Depth 5
# Write using UTF-8 without BOM or standard UTF-8 (depending on PowerShell version, standard Out-File is fine)
[System.IO.File]::WriteAllText($SkillsJsonPath, $JsonString)

Write-Host "Success: Antigravity workspace skills configured at $SkillsJsonPath" -ForegroundColor Green
Write-Host "Skills path linked: $SkillsDir" -ForegroundColor Cyan
