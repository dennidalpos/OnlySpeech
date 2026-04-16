import { mkdtempSync, mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "internal", "runtime", "start-local.ps1");
const tempDirectories: string[] = [];

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

function createTempRepo(name: string): string {
  const directory = mkdtempSync(join(tmpdir(), `${name}-`));
  tempDirectories.push(directory);
  return directory;
}

function writeRuntimeOutputs(tempRepo: string): void {
  const mainOutput = join(tempRepo, "dist", "main");
  const rendererOutput = join(tempRepo, "dist", "renderer");

  mkdirSync(mainOutput, { recursive: true });
  mkdirSync(rendererOutput, { recursive: true });
  writeFileSync(join(mainOutput, "bootstrap.js"), "export {};\n", "utf8");
  writeFileSync(join(rendererOutput, "index.html"), "<!doctype html>\n", "utf8");
}

function writeElectronCli(tempRepo: string): void {
  const electronDirectory = join(tempRepo, "node_modules", "electron");
  mkdirSync(electronDirectory, { recursive: true });
  writeFileSync(join(electronDirectory, "cli.js"), "console.log('electron');\n", "utf8");
}

function writeSourceInput(tempRepo: string, relativePath: string, contents: string): string {
  const absolutePath = join(tempRepo, relativePath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, contents, "utf8");
  return absolutePath;
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("start-local launcher", () => {
  it("parses smoke arguments deterministically", () => {
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; Parse-StartArgs -Arguments @('--smoke', '--timeout-ms=9000') | ConvertTo-Json -Compress }`
    );

    expect(result).toEqual({
      smoke: true,
      smokeTimeoutMs: 9000,
      setupWizard: false,
      wizardSection: null
    });
  });

  it("detects missing compiled runtime outputs", () => {
    const tempRepo = createTempRepo("onlyspeech-start-missing");
    const repoLiteral = tempRepo.replace(/'/g, "''");
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; Get-MissingRuntimeOutputs -RepoRoot '${repoLiteral}' | ConvertTo-Json -Compress }`
    );

    expect(result).toEqual([
      join(tempRepo, "dist", "main", "bootstrap.js"),
      join(tempRepo, "dist", "renderer", "index.html")
    ]);
  });

  it("plans compile before launch when runtime outputs are missing", () => {
    const tempRepo = createTempRepo("onlyspeech-start-compile");
    writeElectronCli(tempRepo);
    const repoLiteral = tempRepo.replace(/'/g, "''");
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; Get-StartPlan -RepoRoot '${repoLiteral}' -Platform 'win32' | ConvertTo-Json -Depth 6 -Compress }`
    ) as {
      electronInstalled: boolean;
      compileCommand: { command: string; args: string[] };
      startCommand: string;
      startArgs: string[];
    };

    expect(result.electronInstalled).toBe(true);
    expect(result.compileCommand).toEqual({
      command: process.env.ComSpec ?? "cmd.exe",
      args: ["/d", "/s", "/c", "npm run compile"]
    });
    expect(result.startCommand).toBe("node");
    expect(result.startArgs).toEqual([
      join(tempRepo, "node_modules", "electron", "cli.js"),
      tempRepo
    ]);
  });

  it("launches Electron directly when runtime outputs already exist", () => {
    const tempRepo = createTempRepo("onlyspeech-start-ready");
    writeElectronCli(tempRepo);
    writeRuntimeOutputs(tempRepo);
    const repoLiteral = tempRepo.replace(/'/g, "''");
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; Get-StartPlan -RepoRoot '${repoLiteral}' -Platform 'win32' | ConvertTo-Json -Depth 6 -Compress }`
    ) as { compileCommand: unknown; startArgs: string[]; staleRuntimeOutputs: string[]; compileReason: string | null };

    expect(result.compileCommand).toBeNull();
    expect(result.staleRuntimeOutputs).toEqual([]);
    expect(result.compileReason).toBeNull();
    expect(result.startArgs).toEqual([
      join(tempRepo, "node_modules", "electron", "cli.js"),
      tempRepo
    ]);
  });

  it("reports a missing Electron installation through the plan", () => {
    const tempRepo = createTempRepo("onlyspeech-start-no-electron");
    writeRuntimeOutputs(tempRepo);
    const repoLiteral = tempRepo.replace(/'/g, "''");
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; Get-StartPlan -RepoRoot '${repoLiteral}' | ConvertTo-Json -Depth 6 -Compress }`
    ) as { electronInstalled: boolean };

    expect(result.electronInstalled).toBe(false);
  });

  it("adds setup wizard arguments to the launch plan", () => {
    const tempRepo = createTempRepo("onlyspeech-start-wizard");
    writeElectronCli(tempRepo);
    writeRuntimeOutputs(tempRepo);
    const repoLiteral = tempRepo.replace(/'/g, "''");
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; Get-StartPlan -RepoRoot '${repoLiteral}' -SetupWizard $true -WizardSection 'provider' | ConvertTo-Json -Depth 6 -Compress }`
    ) as { startArgs: string[] };

    expect(result.startArgs).toEqual([
      join(tempRepo, "node_modules", "electron", "cli.js"),
      tempRepo,
      "--setup-wizard",
      "--wizard-section",
      "provider"
    ]);
  });

  it("rebuilds when runtime outputs are older than source inputs", () => {
    const tempRepo = createTempRepo("onlyspeech-start-stale");
    writeElectronCli(tempRepo);
    writeRuntimeOutputs(tempRepo);
    const sourceFile = writeSourceInput(tempRepo, join("src", "renderer", "main.tsx"), "export {};\n");
    const newerTime = new Date(Date.now() + 10_000);
    utimesSync(sourceFile, newerTime, newerTime);
    const repoLiteral = tempRepo.replace(/'/g, "''");
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; Get-StartPlan -RepoRoot '${repoLiteral}' -Platform 'win32' | ConvertTo-Json -Depth 6 -Compress }`
    ) as {
      compileCommand: { command: string; args: string[] } | null;
      staleRuntimeOutputs: string[];
      compileReason: string | null;
    };

    expect(result.compileReason).toBe("stale-runtime-output");
    expect(result.staleRuntimeOutputs).toEqual([
      join(tempRepo, "dist", "main", "bootstrap.js"),
      join(tempRepo, "dist", "renderer", "index.html")
    ]);
    expect(result.compileCommand).toEqual({
      command: process.env.ComSpec ?? "cmd.exe",
      args: ["/d", "/s", "/c", "npm run compile"]
    });
  });

  it("keeps npm run start pointed at the canonical public source-only wrapper", () => {
    const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts.start).toBe("powershell -ExecutionPolicy Bypass -File ./scripts/public/start.ps1");
    expect(packageJson.scripts["start:source"]).toBeUndefined();
    expect(packageJson.scripts["start:smoke"]).toBeUndefined();
  });
});
