import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "internal", "commissioning", "write-activation-validation-artifact.ps1");
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

describe("New-ActivationValidationArtifact", () => {
  it("writes a deterministic activation-validation template with packaged executable metadata when present", () => {
    const tempRepo = createTempDirectory("onlyspeech-activation-validation");
    const packageJsonPath = join(tempRepo, "package.json");
    const packagedExePath = join(tempRepo, "artifacts", "packages", "win-unpacked", "OnlySpeech.exe");

    writeFileSync(
      packageJsonPath,
      JSON.stringify(
        {
          name: "onlyspeech",
          version: "0.1.0"
        },
        null,
        2
      ),
      "utf8"
    );
    mkdirSync(join(tempRepo, "artifacts", "packages", "win-unpacked"), { recursive: true });
    writeFileSync(packagedExePath, "binary", "utf8");

    const repoLiteral = tempRepo.replace(/'/g, "''");
    const result = runPowerShellJson(
      [
        `& { . '${scriptPath}'`,
        `  New-ActivationValidationArtifact -RepoRoot '${repoLiteral}' | ConvertTo-Json -Depth 12 -Compress`,
        "}"
      ].join("\n")
    ) as {
      outputPath: string;
      artifact: {
        application: { name: string; version: string; packaged_executable: string | null };
        scenarios: Array<{ id: string; status: string }>;
      };
    };

    const writtenArtifact = JSON.parse(readFileSync(result.outputPath, "utf8")) as typeof result.artifact;

    expect(result.outputPath).toBe(join(tempRepo, "artifacts", "logs", "activation-validation.json"));
    expect(result.artifact.application).toEqual({
      name: "onlyspeech",
      version: "0.1.0",
      packaged_executable: "artifacts/packages/win-unpacked/OnlySpeech.exe"
    });
    expect(result.artifact.scenarios).toHaveLength(12);
    expect(result.artifact.scenarios.every((scenario) => scenario.status === "pending")).toBe(true);
    expect(result.artifact.scenarios.map((scenario) => scenario.id)).toContain("clock-rollback");
    expect(result.artifact.scenarios.map((scenario) => scenario.id)).toContain("copy-risk-observation");
    expect(writtenArtifact).toEqual(result.artifact);
  });

  it("writes the default repo-local artifact path when invoked as a script", () => {
    const outputRoot = createTempDirectory("onlyspeech-activation-validation-script");
    const outputPath = join(outputRoot, "activation-validation.json");

    const result = spawnSync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath, "-OutputPath", outputPath],
      { cwd: repoRoot, encoding: "utf8" }
    );

    if (result.status !== 0) {
      throw new Error([result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n"));
    }

    expect(result.stdout.trim()).toContain("Activation validation artifact written to");
    expect(existsSync(outputPath)).toBe(true);

    const artifact = JSON.parse(readFileSync(outputPath, "utf8")) as {
      schema_version: number;
      scenarios: Array<{ id: string }>;
    };

    expect(artifact.schema_version).toBe(1);
    expect(artifact.scenarios).toHaveLength(12);
  });
});
