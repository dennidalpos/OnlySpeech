import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const describeWindows = process.platform === "win32" ? describe : describe.skip;
const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "clean-workstation.ps1");

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

describeWindows("public clean-workstation wrapper", () => {
  it("forwards dry-run execution to the packaged workstation cleanup script", () => {
    const output = runPowerShell(`& ${toPowerShellString(scriptPath)} -DryRun`);

    expect(output).toContain("[clean-workstation] powershell.exe");
    expect(output).toContain("clear-local-workstation-data.ps1");
    expect(output).toContain("-DryRun");
  });

  it("forwards LocalAppDataPath without altering the provided path", () => {
    const localAppDataPath = "C:\\Support\\Local AppData Root";
    const output = runPowerShell(
      `& ${toPowerShellString(scriptPath)} -LocalAppDataPath ${toPowerShellString(localAppDataPath)} -DryRun`
    );

    expect(output).toContain("[clean-workstation] powershell.exe");
    expect(output).toContain("clear-local-workstation-data.ps1");
    expect(output).toContain("-LocalAppDataPath");
    expect(output).toContain(localAppDataPath);
  });
});
