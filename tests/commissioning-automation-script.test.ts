import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const describeWindows = process.platform === "win32" ? describe : describe.skip;
const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "support", "commissioning", "run-target-station-automation.ps1");

describeWindows("run-target-station-automation.ps1", () => {
  it("prints the automation phases and planned outputs in dry-run mode", () => {
    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
        "-SkipCompile",
        "-UpdateValidationPath",
        "./artifacts/logs/target-station-validation.json",
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

    expect(result.stdout).toContain("[automation-phase] fullscreen-displays");
    expect(result.stdout).toContain("[automation-phase] hard-reset");
    expect(result.stdout).toContain("[automation-phase] idle-clear");
    expect(result.stdout).toContain("[automation-phase] visitor-language-catalog-validation");
    expect(result.stdout).toContain("target-station-validation.json");
    expect(result.stdout).toContain("[runtime-env]");
    expect(result.stdout).toContain("[automation-artifact]");
  });

  it("uses the shared runtime env resolver and no longer hardcodes a workstation id", () => {
    const script = readFileSync(scriptPath, "utf8");

    expect(script).toContain("Resolve-OnlySpeechRuntimeEnvPath");
    expect(script).toContain("Runtime env file not found.");
    expect(script).not.toContain("WS-DP01");
  });
});
