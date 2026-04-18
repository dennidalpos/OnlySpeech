import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const describeWindows = process.platform === "win32" ? describe : describe.skip;
const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "internal", "workspace", "verify-repo.ps1");
const doctorScriptPath = join(repoRoot, "scripts", "internal", "workspace", "doctor.ps1");
const packageJsonPath = join(repoRoot, "package.json");
const scriptsReadmePath = join(repoRoot, "scripts", "README.md");
const ciWorkflowPath = join(repoRoot, ".github", "workflows", "ci.yml");
const releaseWorkflowPath = join(repoRoot, ".github", "workflows", "release.yml");
const publicBootstrapScriptPath = join(repoRoot, "scripts", "public", "bootstrap.ps1");
const publicCleanWorkstationScriptPath = join(repoRoot, "scripts", "public", "clean-workstation.ps1");
const publicLicenseKeygenScriptPath = join(repoRoot, "scripts", "public", "license-keygen.ps1");
const projectSpecPath = join(repoRoot, "docs", "PROJECT_SPEC.md");
const readmePath = join(repoRoot, "README.md");

describeWindows("verify-repo.ps1", () => {
  it("uses the internal packaging profile in the dry-run acceptance sequence", () => {
    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
        "-EnablePackagedAutomation",
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

    expect(result.stdout).toContain("[package-internal] powershell.exe");
    expect(result.stdout).toContain("-Profile Internal");
    expect(result.stdout).toContain("[archive-unpacked]");
    expect(result.stdout).toContain("OnlySpeech-0.1.0-x64-unpacked.zip");
    expect(result.stdout.indexOf("[archive-unpacked]")).toBeLessThan(result.stdout.indexOf("[release-evidence]"));
    expect(result.stdout).not.toContain("audit:scripts");
  });

  it("skips the source smoke start in dry-run mode when -SkipSmokeStart is passed", () => {
    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
        "-SkipSmokeStart",
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

    expect(result.stdout).not.toContain("[smoke-start-source]");
    expect(result.stdout).toContain("[packaged-lifecycle]");
    expect(result.stdout).toContain("-SkipLaunches");
  });

  it("documents the dependency installation integrity check in doctor", () => {
    const script = readFileSync(doctorScriptPath, "utf8");

    expect(script).not.toContain("--depth=0");
    expect(script).toContain("--all");
    expect(script).toContain("--omit=optional");
    expect(script).toContain("Dependency installation state");
    expect(script).toContain("npm run bootstrap to restore a deterministic install tree");
  });

  it("keeps doctor guidance explicit for the supported single-shared microphone profile", () => {
    const script = readFileSync(doctorScriptPath, "utf8");

    expect(script).toContain("MICROPHONE_PTT_MODE=single-shared");
    expect(script).toContain("REQUIRED_MICROPHONES=1");
    expect(script).toContain("single-shared profile active; one assignable microphone can satisfy both sides.");
  });

  it("keeps the npm commissioning surface aligned with the retained validation flow", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["commission:handover"]).toContain(
      "-TargetStationValidationPath ./artifacts/logs/target-station-validation.json"
    );
    expect(packageJson.scripts["commission:template"]).toContain(
      "-WriteTargetStationValidationTemplatePath ./artifacts/logs/target-station-validation.json"
    );
    expect(packageJson.scripts["commission:automation"]).toContain(
      "./scripts/internal/commissioning/run-target-station-automation.ps1 -UpdateValidationPath ./artifacts/logs/target-station-validation.json"
    );
    expect(packageJson.scripts["speech:matrix-template"]).toContain(
      "./scripts/internal/commissioning/write-live-provider-speech-proof-artifact.ps1"
    );
  });

  it("keeps the canonical internal npm surface aligned with the new internal domains", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["clean:repo"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/internal/workspace/clean-repo.ps1 -KeepDependencies -KeepEnvFile -KeepWorkstationData -KeepAutostart"
    );
    expect(packageJson.scripts["clean:reset"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/internal/workspace/reset-repo.ps1"
    );
    expect(packageJson.scripts["audit:packaging"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/internal/packaging/package-audit.ps1"
    );
    expect(packageJson.scripts["package:internal"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/internal/packaging/package-core.ps1 -Profile Internal"
    );
    expect(packageJson.scripts["verify:repo"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/internal/workspace/verify-repo.ps1"
    );
    expect(packageJson.scripts["docs:screenshots"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/internal/docs/write-product-screenshots.ps1"
    );
    expect(packageJson.scripts["test:packaged-lifecycle"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/internal/commissioning/test-packaged-install-lifecycle.ps1"
    );
    expect(packageJson.scripts["test:packaged-automation"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/internal/commissioning/test-packaged-runtime-automation.ps1"
    );
  });

  it("keeps the public npm surface limited to eight stable commands", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts.bootstrap).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/public/bootstrap.ps1"
    );
    expect(packageJson.scripts.dev).toBe("powershell -ExecutionPolicy Bypass -File ./scripts/public/dev.ps1");
    expect(packageJson.scripts.start).toBe("powershell -ExecutionPolicy Bypass -File ./scripts/public/start.ps1");
    expect(packageJson.scripts.build).toBe("powershell -ExecutionPolicy Bypass -File ./scripts/public/build.ps1");
    expect(packageJson.scripts.package).toBe("powershell -ExecutionPolicy Bypass -File ./scripts/public/package.ps1");
    expect(packageJson.scripts.clean).toBe("powershell -ExecutionPolicy Bypass -File ./scripts/public/clean.ps1");
    expect(packageJson.scripts["clean:workstation"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/public/clean-workstation.ps1"
    );
    expect(packageJson.scripts["license:keygen"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/public/license-keygen.ps1"
    );

    expect(packageJson.scripts.doctor).toBeUndefined();
    expect(packageJson.scripts["setup:initial"]).toBeUndefined();
    expect(packageJson.scripts.pack).toBeUndefined();
    expect(packageJson.scripts["start:quick"]).toBeUndefined();
    expect(packageJson.scripts["start:source"]).toBeUndefined();
    expect(packageJson.scripts["start:smoke"]).toBeUndefined();
    expect(packageJson.scripts["logs:runtime"]).toBeUndefined();
    expect(packageJson.scripts["repair:microphones"]).toBeUndefined();
    expect(packageJson.scripts["startup:shortcut"]).toBeUndefined();
  });

  it("keeps scripts/README.md as the canonical script index", () => {
    const scriptsReadme = readFileSync(scriptsReadmePath, "utf8");

    expect(scriptsReadme).toContain("scripts/public/bootstrap.ps1");
    expect(scriptsReadme).toContain("scripts/public/dev.ps1");
    expect(scriptsReadme).toContain("scripts/public/start.ps1");
    expect(scriptsReadme).toContain("scripts/public/build.ps1");
    expect(scriptsReadme).toContain("scripts/public/package.ps1");
    expect(scriptsReadme).toContain("scripts/public/clean.ps1");
    expect(scriptsReadme).toContain("scripts/public/clean-workstation.ps1");
    expect(scriptsReadme).toContain("scripts/public/license-keygen.ps1");
    expect(scriptsReadme).toContain("clear-local-workstation-data.ps1");
    expect(scriptsReadme).toContain("clear-trial-tombstone.ps1");
    expect(scriptsReadme).toContain("write-product-demo-video.ps1");
    expect(scriptsReadme).not.toContain("scripts/public/start-source.ps1");
    expect(scriptsReadme).not.toContain("audit-supported-scripts");
  });

  it("keeps docs/PROJECT_SPEC.md aligned with the stable npm surface", () => {
    const projectSpec = readFileSync(projectSpecPath, "utf8");

    expect(projectSpec).toContain("`clean:workstation`");
    expect(projectSpec).toContain("`test:e2e`");
    expect(projectSpec).toContain("`npm run verify:repo -- -KeepOutputs -EnablePackagedAutomation`");
    expect(projectSpec).toContain("`npm run package`");
  });

  it("keeps the repo summary as a storefront instead of a technical command matrix", () => {
    const readme = readFileSync(readmePath, "utf8");

    expect(readme).toContain("build/icon.png");
    expect(readme).toContain("## Overview");
    expect(readme).toContain("## Verified Features");
    expect(readme).toContain("## Verified Windows-First Setup");
    expect(readme).toContain("## Current Status");
    expect(readme).toContain("## Technical Documentation");
    expect(readme).toContain("npm run bootstrap");
    expect(readme).toContain("npm run dev");
    expect(readme).toContain("npm run start");
    expect(readme).toContain("docs/PROJECT_SPEC.md");
    expect(readme).not.toContain("## Stable Commands");
    expect(readme).not.toContain("npm run clean:workstation");
    expect(readme).not.toContain("npm run release:customer-bundle");
    expect(readme).not.toContain("npm run release:evidence");
  });

  it("keeps docs/PROJECT_SPEC.md as the primary technical contract and marks the root README as non-normative", () => {
    const projectSpec = readFileSync(projectSpecPath, "utf8");

    expect(projectSpec).toContain("README.md` is a GitHub-facing storefront summary only");
    expect(projectSpec).toContain("docs/PROJECT_SPEC.md` is the primary technical contract");
    expect(projectSpec).toContain("scripts/README.md");
    expect(projectSpec).toContain(".github/workflows/*.yml");
    expect(projectSpec).toContain("docs/customer-bundle/*");
    expect(projectSpec).not.toContain("docs/product/Marketplace_Sales_Package.md");
  });

  it("keeps the public bootstrap wrapper pointed at the deterministic npm ci flow", () => {
    const script = readFileSync(publicBootstrapScriptPath, "utf8");

    expect(script).toContain("npm ci");
    expect(script).toContain("--include=dev");
    expect(script).toContain("--omit=optional");
    expect(script).toContain("node_modules already consistent; skipping npm ci.");
  });

  it("keeps the public license key generator wrapper pointed at the repo-local generator", () => {
    const script = readFileSync(publicLicenseKeygenScriptPath, "utf8");

    expect(script).toContain(".local\\activation-generator\\launch-generator.ps1");
    expect(script).toContain("License key generator not found");
    expect(script).toContain("npm run license:keygen");
  });

  it("keeps the public workstation cleanup wrapper pointed at the packaged cleanup flow", () => {
    const script = readFileSync(publicCleanWorkstationScriptPath, "utf8");

    expect(script).toContain("clear-local-workstation-data.ps1");
    expect(script).toContain("-LocalAppDataPath");
    expect(script).toContain("clean-workstation");
  });

  it("keeps the canonical GitHub Windows workflows on packaged runtime automation coverage", () => {
    const ciWorkflow = readFileSync(ciWorkflowPath, "utf8");
    const releaseWorkflow = readFileSync(releaseWorkflowPath, "utf8");

    expect(ciWorkflow).toContain('-ArgumentList @("run", "verify:repo", "--", "-KeepOutputs", "-EnablePackagedAutomation")');
    expect(ciWorkflow).toContain("command=npm run verify:repo -- -KeepOutputs -EnablePackagedAutomation");
    expect(ciWorkflow).not.toContain("Archive unpacked Windows app");
    expect(releaseWorkflow).toContain(
      '-ArgumentList @("run", "verify:repo", "--", "-KeepOutputs", "-EnablePackagedAutomation")'
    );
    expect(releaseWorkflow).toContain("command=npm run verify:repo -- -KeepOutputs -EnablePackagedAutomation");
    expect(releaseWorkflow).not.toContain("Archive unpacked Windows app");
  });

  it("keeps packaged smoke validation resilient to Electron process handoff", () => {
    const script = readFileSync(scriptPath, "utf8");

    expect(script).toContain("$appProcess.HasExited -and $appProcess.ExitCode -ne 0");
    expect(script).toContain("$runningProcesses = @(Get-PackagedAppProcesses)");
    expect(script).toContain("$resolvedAppProcess = $runningProcesses | Select-Object -First 1");
    expect(script).not.toContain(
      "$resolvedAppProcess = $runningProcesses | Where-Object { $_.ProcessId -eq $appProcess.Id } | Select-Object -First 1"
    );
  });
});
