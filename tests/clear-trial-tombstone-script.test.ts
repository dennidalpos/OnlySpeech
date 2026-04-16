import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const describeWindows = process.platform === "win32" ? describe : describe.skip;
const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "internal", "runtime", "clear-trial-tombstone.ps1");

function toPowerShellString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function extractLastJsonObject(output: string): unknown {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const candidate = lines[index];
    if (!candidate.startsWith("{") && !candidate.startsWith("[")) {
      continue;
    }

    return JSON.parse(candidate);
  }

  throw new Error(`No JSON payload found in output:\n${output}`);
}

function runPowerShell(script: string): string {
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
    {
      cwd: repoRoot,
      encoding: "utf8"
    }
  );

  if (result.status !== 0) {
    throw new Error([result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n"));
  }

  return result.stdout.trim();
}

describeWindows("clear-trial-tombstone.ps1", () => {
  it("reports when the trial tombstone registry key is missing", () => {
    const output = runPowerShell(
      [
        "& {",
        "  function Test-Path { param([string]$LiteralPath) return $false }",
        `  & ${toPowerShellString(scriptPath)}`,
        "}"
      ].join("\n")
    );

    expect(output).toContain("No trial tombstone registry key was found.");
  });

  it("reports when the registry key exists but the trial tombstone value is missing", () => {
    const output = runPowerShell(
      [
        "& {",
        "  function Test-Path { param([string]$LiteralPath) return $true }",
        "  function Get-ItemProperty {",
        "    param([string]$LiteralPath, [string]$Name, [object]$ErrorAction)",
        "    throw 'PropertyNotFound'",
        "  }",
        `  & ${toPowerShellString(scriptPath)}`,
        "}"
      ].join("\n")
    );

    expect(output).toContain("No trial tombstone value was found.");
  });

  it("removes the registry value and reports the cleared tombstone timestamp", () => {
    const output = runPowerShell(
      [
        "& {",
        "  $global:removal = $null",
        "  function Test-Path { param([string]$LiteralPath) return $true }",
        "  function Get-ItemProperty {",
        "    param([string]$LiteralPath, [string]$Name, [object]$ErrorAction)",
        "    return [pscustomobject]@{ TrialUsedAt = '2026-04-09T08:00:00.000Z' }",
        "  }",
        "  function Remove-ItemProperty {",
        "    param([string]$LiteralPath, [string]$Name, [object]$ErrorAction)",
        "    $global:removal = [pscustomobject]@{ LiteralPath = $LiteralPath; Name = $Name }",
        "  }",
        `  & ${toPowerShellString(scriptPath)}`,
        "  @{ removal = $global:removal } | ConvertTo-Json -Depth 4 -Compress",
        "}"
      ].join("\n")
    );

    const payload = extractLastJsonObject(output) as {
      removal: { LiteralPath: string; Name: string };
    };

    expect(output).toContain("Removed OnlySpeech trial tombstone: 2026-04-09T08:00:00.000Z");
    expect(payload.removal).toEqual({
      LiteralPath: "HKCU:\\Software\\OnlySpeech\\Activation",
      Name: "TrialUsedAt"
    });
  });
});
