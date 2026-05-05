import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "support", "packaging", "write-release-compliance-artifacts.ps1");
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

describe("New-ReleaseComplianceArtifacts", () => {
  it("writes deterministic notices and a CycloneDX SBOM from the lockfile and packaged artifacts", () => {
    const tempRepo = createTempDirectory("onlyspeech-compliance");
    const packagesRoot = join(tempRepo, "artifacts", "packages");
    mkdirSync(packagesRoot, { recursive: true });

    writeFileSync(
      join(tempRepo, "package.json"),
      JSON.stringify(
        {
          name: "onlyspeech",
          version: "0.1.0",
          build: {
            productName: "OnlySpeech"
          }
        },
        null,
        2
      ),
      "utf8"
    );
    writeFileSync(
      join(tempRepo, "package-lock.json"),
      JSON.stringify(
        {
          name: "onlyspeech",
          version: "0.1.0",
          lockfileVersion: 3,
          packages: {
            "": {
              name: "onlyspeech",
              version: "0.1.0",
              dependencies: {
                react: "^19.0.0"
              }
            },
            "node_modules/react": {
              version: "19.0.0",
              license: "MIT",
              resolved: "https://registry.npmjs.org/react/-/react-19.0.0.tgz",
              integrity: "sha512-react"
            },
            "node_modules/scheduler": {
              version: "0.25.0",
              license: "MIT",
              resolved: "https://registry.npmjs.org/scheduler/-/scheduler-0.25.0.tgz",
              integrity: "sha512-scheduler",
              dev: true
            }
          }
        },
        null,
        2
      ),
      "utf8"
    );
    writeFileSync(join(packagesRoot, "OnlySpeech-0.1.0-x64.exe"), "binary", "utf8");

    const repoLiteral = tempRepo.replace(/'/g, "''");
    const packagesLiteral = packagesRoot.replace(/'/g, "''");
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; New-ReleaseComplianceArtifacts -RepoRoot '${repoLiteral}' -PackagesRoot '${packagesLiteral}' | ConvertTo-Json -Depth 12 -Compress }`
    ) as { noticesOutputPath: string; sbomOutputPath: string };

    const notices = JSON.parse(readFileSync(result.noticesOutputPath, "utf8"));
    const sbom = JSON.parse(readFileSync(result.sbomOutputPath, "utf8"));

    expect(result.noticesOutputPath).toBe(join(tempRepo, "artifacts", "logs", "third-party-notices.json"));
    expect(result.sbomOutputPath).toBe(join(tempRepo, "artifacts", "logs", "sbom.cdx.json"));
    expect(notices.summary).toEqual({
      package_count: 2,
      direct_dependencies: 1,
      transitive_dependencies: 1,
      licenses: [{ license: "MIT", count: 2 }]
    });
    expect(notices.packages[0]).toMatchObject({
      name: "react",
      version: "19.0.0",
      direct: true
    });
    expect(sbom).toMatchObject({
      bomFormat: "CycloneDX",
      specVersion: "1.6",
      metadata: {
        component: {
          name: "OnlySpeech",
          version: "0.1.0"
        }
      }
    });
    expect(sbom.components).toHaveLength(2);
    expect(
      sbom.metadata.properties.find((entry: { name: string; value: string }) => entry.name === "onlyspeech:artifact:0:path")
    ).toEqual({
      name: "onlyspeech:artifact:0:path",
      value: "artifacts/packages/OnlySpeech-0.1.0-x64.exe"
    });
  });
});
