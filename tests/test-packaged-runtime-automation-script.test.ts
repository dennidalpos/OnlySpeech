import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const describeWindows = process.platform === "win32" ? describe : describe.skip;
const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "internal", "commissioning", "test-packaged-runtime-automation.ps1");
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

describeWindows("test-packaged-runtime-automation.ps1", () => {
  it("prints the packaged executable and vitest command in dry-run mode", () => {
    const packageRoot = createTempDirectory("onlyspeech-packaged-automation");
    const unpackedRoot = join(packageRoot, "win-unpacked");
    mkdirSync(unpackedRoot, { recursive: true });
    writeFileSync(join(unpackedRoot, "OnlySpeech.exe"), "", "utf8");

    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
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

    expect(result.stdout).toContain("[packaged-runtime-automation] executable=");
    expect(result.stdout).toContain("vitest run tests/packaged-runtime-automation.test.ts");
  });
});
