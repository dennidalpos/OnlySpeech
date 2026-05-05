import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "support", "packaging", "write-release-evidence.ps1");
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

function getSha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("New-ReleaseEvidence", () => {
  it("writes deterministic source metadata and SHA-256 hashes for packaged artifacts", () => {
    const tempRepo = createTempDirectory("onlyspeech-release-evidence");
    const packagesRoot = join(tempRepo, "artifacts", "packages");
    const nestedPackageRoot = join(packagesRoot, "win-unpacked");
    mkdirSync(nestedPackageRoot, { recursive: true });

    writeFileSync(
      join(tempRepo, "package.json"),
      JSON.stringify(
        {
          name: "onlyspeech",
          version: "0.1.0",
          build: {
            productName: "OnlySpeech",
            win: {
              target: ["nsis", "portable", "dir"]
            }
          }
        },
        null,
        2
      ),
      "utf8"
    );

    const installerPath = join(packagesRoot, "OnlySpeech-0.1.0-x64.exe");
    const unpackedExePath = join(nestedPackageRoot, "OnlySpeech.exe");
    writeFileSync(installerPath, "installer-binary", "utf8");
    writeFileSync(unpackedExePath, "portable-binary", "utf8");

    const repoLiteral = tempRepo.replace(/'/g, "''");
    const packagesLiteral = packagesRoot.replace(/'/g, "''");
    const result = runPowerShellJson(
      [
        `& { . '${scriptPath}'`,
        "  $env:GITHUB_SHA = 'abc123def456'",
        "  $env:GITHUB_REF_NAME = 'v0.1.0'",
        "  $env:GITHUB_REF_TYPE = 'tag'",
        "  $env:GITHUB_REPOSITORY = 'acme/onlyspeech'",
        "  $env:GITHUB_WORKFLOW = 'Release'",
        "  $env:GITHUB_RUN_ID = '42'",
        "  $env:GITHUB_RUN_ATTEMPT = '3'",
        `  New-ReleaseEvidence -RepoRoot '${repoLiteral}' -PackagesRoot '${packagesLiteral}' | ConvertTo-Json -Depth 12 -Compress`,
        "}"
      ].join("\n")
    ) as {
      outputPath: string;
      evidence: {
        application: {
          name: string;
          version: string;
          productName: string;
          packagingTargets: string[];
        };
        source: { git_sha: string; git_ref: string; git_tag: string };
        workflow: {
          repository: string;
          workflow: string;
          run_id: string;
          run_attempt: string;
        };
        artifacts: Array<{ path: string; size_bytes: number; sha256: string }>;
      };
    };

    const writtenEvidence = JSON.parse(readFileSync(result.outputPath, "utf8")) as typeof result.evidence;

    expect(result.outputPath).toBe(join(tempRepo, "artifacts", "logs", "release-evidence.json"));
    expect(result.evidence.application).toEqual({
      name: "onlyspeech",
      version: "0.1.0",
      productName: "OnlySpeech",
      packagingTargets: ["nsis", "portable", "dir"]
    });
    expect(result.evidence.source).toEqual({
      git_sha: "abc123def456",
      git_ref: "v0.1.0",
      git_tag: "v0.1.0"
    });
    expect(result.evidence.workflow).toEqual({
      repository: "acme/onlyspeech",
      workflow: "Release",
      run_id: "42",
      run_attempt: "3"
    });
    expect(result.evidence.artifacts).toEqual([
      {
        path: "artifacts/packages/OnlySpeech-0.1.0-x64.exe",
        size_bytes: Buffer.byteLength("installer-binary"),
        sha256: getSha256("installer-binary")
      },
      {
        path: "artifacts/packages/win-unpacked/OnlySpeech.exe",
        size_bytes: Buffer.byteLength("portable-binary"),
        sha256: getSha256("portable-binary")
      }
    ]);
    expect(writtenEvidence).toEqual(result.evidence);
  });
});
