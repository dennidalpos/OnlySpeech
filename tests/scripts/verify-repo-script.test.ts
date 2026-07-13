import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const describeWindows = process.platform === "win32" ? describe : describe.skip;
const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "support", "workspace", "verify-repo.ps1");
const doctorScriptPath = join(repoRoot, "scripts", "support", "workspace", "doctor.ps1");
const packageJsonPath = join(repoRoot, "package.json");
const ciWorkflowPath = join(repoRoot, ".github", "workflows", "ci.yml");
const releaseWorkflowPath = join(repoRoot, ".github", "workflows", "release.yml");
const publicBootstrapScriptPath = join(repoRoot, "scripts", "bootstrap.ps1");
const publicCleanWorkstationScriptPath = join(repoRoot, "scripts", "clean-workstation.ps1");
const publicGateScriptPath = join(repoRoot, "scripts", "gate.ps1");
const publicLicenseKeygenScriptPath = join(repoRoot, "scripts", "license-keygen.ps1");
const powerSettingsScriptPath = join(repoRoot, "scripts", "support", "packaging", "configure-power-settings.ps1");
const removedPowerSettingsWrapperPath = join(
  repoRoot,
  "scripts",
  "internal",
  "runtime",
  "startup",
  "configure-power-settings.ps1"
);
const projectSpecPath = join(repoRoot, "docs", "PROJECT_SPEC.md");
const projectStatusPath = join(repoRoot, "PROJECT_STATUS.json");
const readmePath = join(repoRoot, "README.md");

describeWindows("verify-repo.ps1", () => {
  it("hashes intentional duplicates without relying on optional PowerShell cmdlets", () => {
    const script = readFileSync(scriptPath, "utf8");

    expect(script).toContain("[System.Security.Cryptography.SHA256]::Create()");
    expect(script).toContain("Get-OnlySpeechFileSha256 -LiteralPath $leftPath");
    expect(script).not.toContain("Get-FileHash");
  });

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
    expect(result.stdout).toContain("[lint] npm run lint");
    expect(result.stdout).toContain("[coverage] npm run test:coverage");
    expect(result.stdout).toContain("-Profile Internal");
    expect(result.stdout).toContain("[archive-unpacked]");
    expect(result.stdout).toContain("OnlySpeech-0.1.0-x64-unpacked.zip");
    expect(result.stdout.indexOf("[archive-unpacked]")).toBeLessThan(result.stdout.indexOf("[release-evidence]"));
    expect(result.stdout).not.toContain("audit:scripts");
  });

  it("supports opt-in workstation cleanup and dependency refresh in the dry-run gate sequence", () => {
    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
        "-CleanWorkstationData",
        "-ForceRefreshDependencies",
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

    expect(result.stdout).toContain("[clean-workstation] powershell.exe");
    expect(result.stdout).toContain("scripts\\clean-workstation.ps1");
    expect(result.stdout).toContain("[bootstrap] npm run bootstrap -- -ForceRefresh");
  });

  it("keeps the public gate wrapper pointed at canonical repository verification", () => {
    const script = readFileSync(publicGateScriptPath, "utf8");

    expect(script).toContain("scripts\\support\\workspace\\verify-repo.ps1");
    expect(script).toContain("-CleanWorkstationData");
    expect(script).toContain("-ForceRefreshDependencies");
    expect(script).toContain("-EnablePackagedAutomation");
    expect(script).toContain("Invoke-OnlySpeechStep -Label \"gate\"");
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
      "./scripts/support/commissioning/run-target-station-automation.ps1 -UpdateValidationPath ./artifacts/logs/target-station-validation.json"
    );
    expect(packageJson.scripts["speech:matrix-template"]).toContain(
      "./scripts/support/commissioning/write-live-provider-speech-proof-artifact.ps1"
    );
  });

  it("keeps the canonical internal npm surface aligned with the new internal domains", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["clean:repo"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/support/workspace/clean-repo.ps1 -KeepDependencies -KeepEnvFile -KeepWorkstationData -KeepAutostart"
    );
    expect(packageJson.scripts["clean:reset"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/support/workspace/reset-repo.ps1"
    );
    expect(packageJson.scripts["audit:packaging"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/support/packaging/package-audit.ps1"
    );
    expect(packageJson.scripts["package:internal"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/support/packaging/package-core.ps1 -Profile Internal"
    );
    expect(packageJson.scripts["verify:repo"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/support/workspace/verify-repo.ps1"
    );
    expect(packageJson.scripts["docs:screenshots"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/support/docs/write-product-screenshots.ps1"
    );
    expect(packageJson.scripts["test:packaged-lifecycle"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/support/commissioning/test-packaged-install-lifecycle.ps1"
    );
    expect(packageJson.scripts["test:packaged-automation"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/support/commissioning/test-packaged-runtime-automation.ps1"
    );
  });

  it("keeps the public npm surface limited to nine stable commands", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts.bootstrap).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/bootstrap.ps1"
    );
    expect(packageJson.scripts.dev).toBe("powershell -ExecutionPolicy Bypass -File ./scripts/dev.ps1");
    expect(packageJson.scripts.start).toBe("powershell -ExecutionPolicy Bypass -File ./scripts/start.ps1");
    expect(packageJson.scripts.build).toBe("powershell -ExecutionPolicy Bypass -File ./scripts/build.ps1");
    expect(packageJson.scripts.gate).toBe("powershell -ExecutionPolicy Bypass -File ./scripts/gate.ps1");
    expect(packageJson.scripts.package).toBe("powershell -ExecutionPolicy Bypass -File ./scripts/package.ps1");
    expect(packageJson.scripts.clean).toBe("powershell -ExecutionPolicy Bypass -File ./scripts/clean.ps1");
    expect(packageJson.scripts["clean:workstation"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/clean-workstation.ps1"
    );
    expect(packageJson.scripts["license:keygen"]).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/license-keygen.ps1"
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


  it("keeps scripts/support/packaging/configure-power-settings.ps1 as the only tracked power-settings script", () => {
    const script = readFileSync(powerSettingsScriptPath, "utf8");

    expect(existsSync(removedPowerSettingsWrapperPath)).toBe(false);
    expect(script).toContain("scripts/support/packaging/configure-power-settings.ps1");
    expect(script).not.toContain("scripts/support/shared/configure-power-settings.ps1");
  });

  it("keeps docs/PROJECT_SPEC.md aligned with the stable npm surface", () => {
    const projectSpec = readFileSync(projectSpecPath, "utf8");

    expect(projectSpec).toContain("`clean:workstation`");
    expect(projectSpec).toContain("`gate`");
    expect(projectSpec).toContain("`test:e2e`");
    expect(projectSpec).toContain("`npm run verify:repo -- -KeepOutputs -EnablePackagedAutomation`");
    expect(projectSpec).toContain("`npm run package`");
  });

  it("keeps the root README aligned with the real command surface", () => {
    const readme = readFileSync(readmePath, "utf8");

    expect(readme).toContain("build/icon.png");
    expect(readme).toContain("## Overview");
    expect(readme).toContain("## Verified Features");
    expect(readme).toContain("## Requirements");
    expect(readme).toContain("## Setup");
    expect(readme).toContain("## Commands");
    expect(readme).toContain("## Project Status");
    expect(readme).toContain("## Technical Documentation");
    expect(readme).toContain("npm run bootstrap");
    expect(readme).toContain("npm run dev");
    expect(readme).toContain("npm run start");
    expect(readme).toContain("npm run gate -- -KeepOutputs -EnablePackagedAutomation");
    expect(readme).toContain("npm run clean:workstation");
    expect(readme).toContain("npm run verify:repo -- -KeepOutputs -EnablePackagedAutomation");
    expect(readme).toContain("npm run release:customer-bundle");
    expect(readme).toContain("docs/PROJECT_SPEC.md");
  });

  it("keeps docs/PROJECT_SPEC.md as the primary technical contract and defines doc ownership", () => {
    const projectSpec = readFileSync(projectSpecPath, "utf8");

    expect(projectSpec).toContain("README.md` is the repository overview and quick-start command map");
    expect(projectSpec).toContain("docs/PROJECT_SPEC.md` is the primary technical contract");
    expect(projectSpec).toContain("scripts/script.md");
    expect(projectSpec).toContain(".github/workflows/*.yml");
    expect(projectSpec).toContain("docs/customer-bundle/*");
    expect(projectSpec).not.toContain("docs/product/Marketplace_Sales_Package.md");
  });

  it("keeps PROJECT_STATUS.json limited to incomplete todo text", () => {
    const projectStatus = JSON.parse(readFileSync(projectStatusPath, "utf8")) as {
      todos: string[];
    };

    expect(Object.keys(projectStatus).sort()).toEqual(["todos"]);
    expect(projectStatus.todos.every((task) => typeof task === "string" && task.trim().length > 0)).toBe(true);
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
