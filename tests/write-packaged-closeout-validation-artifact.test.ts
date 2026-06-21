import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "support", "commissioning", "write-packaged-closeout-validation-artifact.ps1");
const tempDirectories: string[] = [];

function createTempDirectory(name: string): string {
  const directory = mkdtempSync(join(tmpdir(), `${name}-`));
  tempDirectories.push(directory);
  return directory;
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

describe("New-PackagedCloseoutValidationArtifact", () => {
  it("writes a packaged close-out template covering the current package and autostart evidence", () => {
    const tempRepo = createTempDirectory("onlyspeech-packaged-closeout");
    const packageRoot = join(tempRepo, "artifacts", "packages");
    mkdirSync(join(packageRoot, "win-unpacked"), { recursive: true });
    writeFileSync(
      join(tempRepo, "package.json"),
      JSON.stringify({ name: "onlyspeech", version: "0.1.0" }, null, 2),
      "utf8"
    );
    writeFileSync(join(packageRoot, "win-unpacked", "OnlySpeech.exe"), "", "utf8");
    writeFileSync(join(packageRoot, "OnlySpeech-0.1.0-x64-setup.exe"), "", "utf8");
    writeFileSync(join(packageRoot, "OnlySpeech-0.1.0-x64-portable.exe"), "", "utf8");

    const repoLiteral = tempRepo.replace(/'/g, "''");
    const result = runPowerShellJson(
      [
        `& { . '${scriptPath}'`,
        `  New-PackagedCloseoutValidationArtifact -RepoRoot '${repoLiteral}' | ConvertTo-Json -Depth 12 -Compress`,
        "}"
      ].join("\n")
    ) as {
      outputPath: string;
      artifact: {
        package_layout: {
          current_installer: string | null;
          portable_executable: string | null;
          unpacked_executable: string | null;
        };
        project_status_task_coverage: Array<{ task_id: string; evidence_paths: string[] }>;
        autostart: { registry_path: string; value_name: string; scenarios: Array<{ id: string; status: string }> };
      };
    };

    const writtenArtifact = JSON.parse(readFileSync(result.outputPath, "utf8")) as typeof result.artifact;

    expect(result.outputPath).toBe(join(tempRepo, "artifacts", "logs", "packaged-closeout-validation.json"));
    expect(result.artifact.package_layout).toEqual({
      package_root: "artifacts/packages",
      current_installer: "artifacts/packages/OnlySpeech-0.1.0-x64-setup.exe",
      portable_executable: "artifacts/packages/OnlySpeech-0.1.0-x64-portable.exe",
      unpacked_executable: "artifacts/packages/win-unpacked/OnlySpeech.exe"
    });
    expect(result.artifact.project_status_task_coverage.map((entry) => entry.task_id)).toEqual([
      "residual-packaged-activation-commissioning-validation",
      "residual-live-provider-speech-proof",
      "residual-packaged-autostart-live-validation"
    ]);
    expect(result.artifact.autostart.registry_path).toBe("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run");
    expect(result.artifact.autostart.value_name).toBe("OnlySpeech");
    expect(result.artifact.autostart.scenarios).toHaveLength(5);
    expect(result.artifact.autostart.scenarios.every((scenario) => scenario.status === "pending")).toBe(true);
    expect(result.artifact.autostart.scenarios.map((scenario) => scenario.id)).toContain("autostart-single-run-key-mechanism");
    expect(writtenArtifact).toEqual(result.artifact);
  });

  it("writes the requested artifact path when invoked as a script", () => {
    const outputRoot = createTempDirectory("onlyspeech-packaged-closeout-script");
    const outputPath = join(outputRoot, "packaged-closeout-validation.json");

    const result = spawnSync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath, "-OutputPath", outputPath],
      { cwd: repoRoot, encoding: "utf8" }
    );

    if (result.status !== 0) {
      throw new Error([result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n"));
    }

    expect(result.stdout.trim()).toContain("Packaged close-out validation artifact written to");
    expect(existsSync(outputPath)).toBe(true);

    const artifact = JSON.parse(readFileSync(outputPath, "utf8")) as {
      schema_version: number;
      autostart: { scenarios: Array<{ id: string }> };
    };

    expect(artifact.schema_version).toBe(1);
    expect(artifact.autostart.scenarios).toHaveLength(5);
  });
});
