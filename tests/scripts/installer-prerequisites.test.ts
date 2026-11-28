import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "support", "packaging", "assert-installer-prerequisites.ps1");
const tempDirectories: string[] = [];

function createTempWindowsRoot(name: string, includeMediaFoundation: boolean): string {
  const root = mkdtempSync(join(tmpdir(), `${name}-`));
  tempDirectories.push(root);
  const system32 = join(root, "System32");
  mkdirSync(system32, { recursive: true });

  if (includeMediaFoundation) {
    writeFileSync(join(system32, "mfplat.dll"), "", "utf8");
    writeFileSync(join(system32, "mfreadwrite.dll"), "", "utf8");
  }

  return root;
}

function runPowerShellJson(script: string): unknown {
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
    { cwd: repoRoot, encoding: "utf8" }
  );

  if (result.status !== 0) {
    throw new Error([result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n"));
  }

  return JSON.parse(result.stdout.trim());
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("installer prerequisite preflight", () => {
  it("uses the electron-builder customInit hook instead of redefining .onInit", () => {
    const installerInclude = readFileSync(join(repoRoot, "build", "installer.nsh"), "utf8");

    expect(installerInclude).toContain("!macro customInit");
    expect(installerInclude).not.toContain("Function .onInit");
  });

  it("passes on a supported Windows x64 image with media components", () => {
    const systemRoot = createTempWindowsRoot("onlyspeech-prereq-present", true).replace(/'/g, "''");
    const result = runPowerShellJson(
      [
        "& {",
        `  . '${scriptPath}'`,
        `  $results = Get-OnlySpeechInstallerPrerequisiteResults -WindowsVersion '10.0.22631' -Is64BitOperatingSystem $true -SystemRoot '${systemRoot}' -PowerShellVersion '5.1.22621.2506'`,
        "  [pscustomobject]@{ ok = [string]::IsNullOrWhiteSpace((Format-OnlySpeechPrerequisiteFailureMessage -Results $results)); results = $results } | ConvertTo-Json -Depth 6 -Compress",
        "}"
      ].join("\n")
    ) as { ok: boolean; results: Array<{ name: string; ok: boolean }> };

    expect(result.ok).toBe(true);
    expect(result.results.every((entry) => entry.ok)).toBe(true);
  });

  it("blocks missing media components with actionable guidance", () => {
    const systemRoot = createTempWindowsRoot("onlyspeech-prereq-missing", false).replace(/'/g, "''");
    const result = runPowerShellJson(
      [
        "& {",
        `  . '${scriptPath}'`,
        `  $results = Get-OnlySpeechInstallerPrerequisiteResults -WindowsVersion '10.0.22631' -Is64BitOperatingSystem $true -SystemRoot '${systemRoot}' -PowerShellVersion '5.1.22621.2506'`,
        "  [pscustomobject]@{ message = Format-OnlySpeechPrerequisiteFailureMessage -Results $results } | ConvertTo-Json -Depth 4 -Compress",
        "}"
      ].join("\n")
    ) as { message: string };

    expect(result.message).toContain("Windows Media Foundation");
    expect(result.message).toContain("Media Feature Pack");
    expect(result.message).toContain("mfplat.dll");
  });

  it("blocks unsupported Windows architecture before installation", () => {
    const systemRoot = createTempWindowsRoot("onlyspeech-prereq-x86", true).replace(/'/g, "''");
    const result = runPowerShellJson(
      [
        "& {",
        `  . '${scriptPath}'`,
        `  $results = Get-OnlySpeechInstallerPrerequisiteResults -WindowsVersion '10.0.22631' -Is64BitOperatingSystem $false -SystemRoot '${systemRoot}' -PowerShellVersion '5.1.22621.2506'`,
        "  [pscustomobject]@{ message = Format-OnlySpeechPrerequisiteFailureMessage -Results $results } | ConvertTo-Json -Depth 4 -Compress",
        "}"
      ].join("\n")
    ) as { message: string };

    expect(result.message).toContain("Windows 10/11 x64");
    expect(result.message).toContain("Windows 10 x64");
  });
});
