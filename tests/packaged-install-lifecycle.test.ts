import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const describeWindows = process.platform === "win32" ? describe : describe.skip;
const repoRoot = process.cwd();
const lifecycleScriptPath = join(repoRoot, "scripts", "internal", "commissioning", "test-packaged-install-lifecycle.ps1");
const tempDirectories: string[] = [];

function createTempDirectory(name: string): string {
  const directory = mkdtempSync(join(tmpdir(), `${name}-`));
  tempDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describeWindows("test-packaged-install-lifecycle.ps1", () => {
  it("prints the current package lifecycle steps in dry-run mode", () => {
    const packageRoot = createTempDirectory("onlyspeech-packages");
    const unpackedRoot = join(packageRoot, "win-unpacked");
    mkdirSync(unpackedRoot, { recursive: true });
    writeFileSync(join(unpackedRoot, "OnlySpeech.exe"), "", "utf8");
    writeFileSync(join(packageRoot, "OnlySpeech-0.1.0-portable.exe"), "", "utf8");
    writeFileSync(join(packageRoot, "OnlySpeech-0.1.0-installer.exe"), "", "utf8");

    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        lifecycleScriptPath,
        "-PackageRoot",
        packageRoot,
        "-DryRun"
      ],
      {
        cwd: repoRoot,
        encoding: "utf8"
      }
    );

    if (result.status !== 0) {
      throw new Error([result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n"));
    }

    expect(result.stdout).toContain("[layout]");
    expect(result.stdout).toContain("[unpacked-launch]");
    expect(result.stdout).toContain("[current-reset]");
    expect(result.stdout).toContain("[current-install]");
    expect(result.stdout).toContain("[current-launch]");
    expect(result.stdout).toContain("[current-uninstall]");
  });

  it("prints upgrade and rollback steps when comparison installers are supplied", () => {
    const packageRoot = createTempDirectory("onlyspeech-packages-upgrade");
    const unpackedRoot = join(packageRoot, "win-unpacked");
    const comparisonRoot = createTempDirectory("onlyspeech-packages-comparison");
    mkdirSync(unpackedRoot, { recursive: true });
    writeFileSync(join(unpackedRoot, "OnlySpeech.exe"), "", "utf8");
    writeFileSync(join(packageRoot, "OnlySpeech-0.2.0-portable.exe"), "", "utf8");
    writeFileSync(join(packageRoot, "OnlySpeech-0.2.0-installer.exe"), "", "utf8");
    const previousInstallerPath = join(comparisonRoot, "OnlySpeech-0.1.0-installer.exe");
    const rollbackInstallerPath = join(comparisonRoot, "OnlySpeech-0.0.9-installer.exe");
    writeFileSync(previousInstallerPath, "", "utf8");
    writeFileSync(rollbackInstallerPath, "", "utf8");

    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        lifecycleScriptPath,
        "-PackageRoot",
        packageRoot,
        "-PreviousInstallerPath",
        previousInstallerPath,
        "-RollbackInstallerPath",
        rollbackInstallerPath,
        "-DryRun"
      ],
      {
        cwd: repoRoot,
        encoding: "utf8"
      }
    );

    if (result.status !== 0) {
      throw new Error([result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n"));
    }

    expect(result.stdout).toContain("[upgrade-plan]");
    expect(result.stdout).toContain("[previous-reset]");
    expect(result.stdout).toContain("[previous-install]");
    expect(result.stdout).toContain("[rollback-install]");
  });

  it("accepts a relaunched packaged process after the bootstrap pid exits cleanly", () => {
    const script = readFileSync(lifecycleScriptPath, "utf8");

    expect(script).toContain("$process.HasExited -and $process.ExitCode -ne 0");
    expect(script).toContain("$resolved = @(Get-OnlySpeechProcesses -ExpectedPath $ExecutablePath)");
    expect(script).not.toContain('$resolved = @(Get-OnlySpeechProcesses -ExpectedPath $ExecutablePath | Where-Object { $_.ProcessId -eq $process.Id })');
  });
});
