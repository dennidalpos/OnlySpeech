import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "internal", "packaging", "assert-release-tag.ps1");

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

describe("Test-ReleaseTag", () => {
  it("accepts a matching semantic version tag", () => {
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; Test-ReleaseTag -Tag 'v0.1.0' -Version '0.1.0' | ConvertTo-Json -Compress }`
    );

    expect(result).toEqual({
      ok: true,
      message: "Release tag v0.1.0 matches package.json version 0.1.0."
    });
  });

  it("rejects a mismatched tag", () => {
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; Test-ReleaseTag -Tag 'v0.2.0' -Version '0.1.0' | ConvertTo-Json -Compress }`
    );

    expect(result).toEqual({
      ok: false,
      message: "Release tag mismatch: expected v0.1.0, received v0.2.0."
    });
  });
});
