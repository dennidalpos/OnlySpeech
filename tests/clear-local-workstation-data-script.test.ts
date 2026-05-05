import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const describeWindows = process.platform === "win32" ? describe : describe.skip;
const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "support", "runtime", "clear-local-workstation-data.ps1");
const tempDirectories: string[] = [];

function createTempDirectory(name: string): string {
  const directory = mkdtempSync(join(tmpdir(), `${name}-`));
  tempDirectories.push(directory);
  return directory;
}

function toPowerShellString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
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

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describeWindows("clear-local-workstation-data.ps1", () => {
  it("removes the packaged LocalAppData profile including the saved runtime env", () => {
    const localAppDataRoot = createTempDirectory("onlyspeech-localappdata-reset");
    const packagedRoot = join(localAppDataRoot, "OnlySpeech");
    mkdirSync(join(packagedRoot, "config"), { recursive: true });
    mkdirSync(join(packagedRoot, "logs"), { recursive: true });
    writeFileSync(join(packagedRoot, ".env"), "APP_MODE=kiosk\n", "utf8");
    writeFileSync(join(packagedRoot, "config", "activation-state.json"), '{"ok":true}\n', "utf8");

    const output = runPowerShell(
      [
        "& {",
        "  $global:trialRemoval = $null",
        "  function Test-Path {",
        "    param([string]$Path, [string]$LiteralPath)",
        `    if ($LiteralPath -eq 'HKCU:\\Software\\OnlySpeech\\Activation' -or $Path -eq 'HKCU:\\Software\\OnlySpeech\\Activation') { return $true }`,
        "    Microsoft.PowerShell.Management\\Test-Path @PSBoundParameters",
        "  }",
        "  function Get-ItemProperty {",
        "    param([string]$LiteralPath, [string]$Name, [object]$ErrorAction)",
        "    return [pscustomobject]@{ TrialUsedAt = '2026-04-10T07:00:00.000Z' }",
        "  }",
        "  function Remove-ItemProperty {",
        "    param([string]$LiteralPath, [string]$Name, [object]$ErrorAction)",
        "    $global:trialRemoval = [pscustomobject]@{ LiteralPath = $LiteralPath; Name = $Name }",
        "  }",
        `  & ${toPowerShellString(scriptPath)} -LocalAppDataPath ${toPowerShellString(localAppDataRoot)}`,
        "  @{",
        `    packagedRootExists = Test-Path -LiteralPath ${toPowerShellString(packagedRoot)}`,
        "    trialRemoval = $global:trialRemoval",
        "  } | ConvertTo-Json -Depth 4 -Compress",
        "}"
      ].join("\n")
    );

    const payload = extractLastJsonObject(output) as {
      packagedRootExists: boolean;
      trialRemoval: { LiteralPath: string; Name: string };
    };

    expect(output).toContain(`[workstation-data] removed ${packagedRoot}`);
    expect(output).toContain("[workstation-data] removed-trial-tombstone 2026-04-10T07:00:00.000Z");
    expect(existsSync(packagedRoot)).toBe(false);
    expect(payload.packagedRootExists).toBe(false);
    expect(payload.trialRemoval).toEqual({
      LiteralPath: "HKCU:\\Software\\OnlySpeech\\Activation",
      Name: "TrialUsedAt"
    });
  });

  it("reports a dry-run plan without deleting workstation data", () => {
    const localAppDataRoot = createTempDirectory("onlyspeech-localappdata-dryrun");
    const packagedRoot = join(localAppDataRoot, "OnlySpeech");
    mkdirSync(packagedRoot, { recursive: true });
    writeFileSync(join(packagedRoot, ".env"), "APP_MODE=kiosk\n", "utf8");

    const output = runPowerShell(
      [
        "& {",
        "  function Test-Path {",
        "    param([string]$Path, [string]$LiteralPath)",
        `    if ($LiteralPath -eq 'HKCU:\\Software\\OnlySpeech\\Activation' -or $Path -eq 'HKCU:\\Software\\OnlySpeech\\Activation') { return $true }`,
        "    Microsoft.PowerShell.Management\\Test-Path @PSBoundParameters",
        "  }",
        "  function Get-ItemProperty {",
        "    param([string]$LiteralPath, [string]$Name, [object]$ErrorAction)",
        "    return [pscustomobject]@{ TrialUsedAt = '2026-04-10T07:00:00.000Z' }",
        "  }",
        "  function Remove-ItemProperty { throw 'should-not-remove-trial-tombstone-during-dry-run' }",
        `  & ${toPowerShellString(scriptPath)} -LocalAppDataPath ${toPowerShellString(localAppDataRoot)} -DryRun`,
        "}"
      ].join("\n")
    );

    expect(output).toContain(`[workstation-data] would-remove ${packagedRoot}`);
    expect(output).toContain("[workstation-data] would-remove-trial-tombstone 2026-04-10T07:00:00.000Z");
    expect(existsSync(packagedRoot)).toBe(true);
  });

  it("reports when neither the packaged profile nor the trial tombstone exists", () => {
    const localAppDataRoot = createTempDirectory("onlyspeech-localappdata-empty");
    const packagedRoot = join(localAppDataRoot, "OnlySpeech");

    const output = runPowerShell(
      [
        "& {",
        "  function Test-Path {",
        "    param([string]$Path, [string]$LiteralPath)",
        `    if ($LiteralPath -eq 'HKCU:\\Software\\OnlySpeech\\Activation' -or $Path -eq 'HKCU:\\Software\\OnlySpeech\\Activation') { return $false }`,
        "    Microsoft.PowerShell.Management\\Test-Path @PSBoundParameters",
        "  }",
        `  & ${toPowerShellString(scriptPath)} -LocalAppDataPath ${toPowerShellString(localAppDataRoot)}`,
        "}"
      ].join("\n")
    );

    expect(output).toContain(`[workstation-data] not-present ${packagedRoot}`);
    expect(output).toContain("[workstation-data] no-trial-tombstone-key");
    expect(existsSync(packagedRoot)).toBe(false);
  });
});
