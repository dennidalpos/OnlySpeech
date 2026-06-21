import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const describeWindows = process.platform === "win32" ? describe : describe.skip;
const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "support", "docs", "write-social-assets.ps1");

describeWindows("write-social-assets.ps1", () => {
  it("prints the compile and capture plan in dry-run mode", () => {
    const result = spawnSync("powershell.exe", [
      "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath, "-DryRun"
    ], { cwd: repoRoot, encoding: "utf8" });

    if (result.status !== 0) {
      throw new Error([result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n"));
    }

    expect(result.stdout).toContain("[compile] npm run compile");
    expect(result.stdout).toContain("[social-assets] node");
    expect(result.stdout).toContain("scripts\\support\\docs\\capture-social-assets.mjs");
  });
});
