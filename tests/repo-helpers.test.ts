import { mkdtempSync, mkdirSync, rmSync, writeFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const helperPath = join(repoRoot, "scripts", "support", "lib", "repo.ps1");
const tempDirectories: string[] = [];

function createTempDirectory(name: string): string {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), `${name}-`)));
  tempDirectories.push(directory);
  return directory;
}

function runPowerShellJson(script: string): unknown {
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
    {
      cwd: repoRoot,
      encoding: "utf8"
    }
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

describe("repo-helpers", () => {
  it("parses the supported Node.js baseline from the shared helper", () => {
    const result = runPowerShellJson(
      [
        "& {",
        `  . '${helperPath}'`,
        "  Get-OnlySpeechNodeVersionInfo -NodeVersionText 'v25.9.0' | ConvertTo-Json -Compress",
        "}"
      ].join("\n")
    ) as { Version: string; Major: number; MinimumSupportedMajor: number };

    expect(result).toEqual({
      Version: "v25.9.0",
      Major: 25,
      MinimumSupportedMajor: 22
    });
  });

  it("fails clearly when the shared Node.js baseline is not met", () => {
    const result = runPowerShellJson(
      [
        "& {",
        `  . '${helperPath}'`,
        "  try {",
        "    Assert-OnlySpeechSupportedNodeVersion -NodeVersionText 'v20.18.0' | Out-Null",
        "    [pscustomobject]@{ ok = $true } | ConvertTo-Json -Compress",
        "  } catch {",
        "    [pscustomobject]@{ ok = $false; message = $_.Exception.Message } | ConvertTo-Json -Compress",
        "  }",
        "}"
      ].join("\n")
    ) as { ok: boolean; message: string };

    expect(result.ok).toBe(false);
    expect(result.message).toContain("Node.js v20.18.0 detected");
    expect(result.message).toContain("Node.js 22+");
  });

  it("filters only repo-local locking processes", () => {
    const result = runPowerShellJson(
      [
        "& {",
        `  . '${helperPath}'`,
        "  $repoProcesses = @(",
        "    [pscustomobject]@{",
        "      ProcessId = 10",
        "      Name = 'node.exe'",
        "      ExecutablePath = 'C:\\Program Files\\nodejs\\node.exe'",
        "      CommandLine = 'node D:\\Repo\\node_modules\\vitest\\vitest.mjs run'",
        "    },",
        "    [pscustomobject]@{",
        "      ProcessId = 11",
        "      Name = 'OnlySpeech.exe'",
        "      ExecutablePath = 'D:\\Repo\\artifacts\\packages\\win-unpacked\\OnlySpeech.exe'",
        "      CommandLine = ''",
        "    },",
        "    [pscustomobject]@{",
        "      ProcessId = 12",
        "      Name = 'node.exe'",
        "      ExecutablePath = 'C:\\Program Files\\nodejs\\node.exe'",
        "      CommandLine = 'node C:\\Users\\Utente\\AppData\\Local\\npm-cache\\_npx\\playwright\\cli.js'",
        "    }",
        "  )",
        "  @(Get-OnlySpeechRepoLockingProcesses -RepoRoot 'D:\\Repo' -Processes $repoProcesses -IgnoreProcessIds @(11)) | ConvertTo-Json -Compress",
        "}"
      ].join("\n")
    ) as { ProcessId: number; Name: string } | Array<{ ProcessId: number; Name: string }>;

    const items = Array.isArray(result) ? result : [result];

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      ProcessId: 10,
      Name: "node.exe"
    });
  });

  it("fails with a clear message when repo-local processes keep bootstrap busy", () => {
    const result = runPowerShellJson(
      [
        "& {",
        `  . '${helperPath}'`,
        "  $repoProcesses = @(",
        "    [pscustomobject]@{",
        "      ProcessId = 21",
        "      Name = 'node.exe'",
        "      ExecutablePath = 'C:\\Program Files\\nodejs\\node.exe'",
        "      CommandLine = 'node D:\\Repo\\node_modules\\vitest\\vitest.mjs run'",
        "    }",
        "  )",
        "  try {",
        "    Wait-OnlySpeechRepoProcessRelease -RepoRoot 'D:\\Repo' -Operation 'run bootstrap' -TimeoutSeconds 0 -PollMilliseconds 1 -Processes $repoProcesses -IgnoreProcessIds @(99999)",
        "    [pscustomobject]@{ ok = $true } | ConvertTo-Json -Compress",
        "  } catch {",
        "    [pscustomobject]@{ ok = $false; message = $_.Exception.Message } | ConvertTo-Json -Compress",
        "  }",
        "}"
      ].join("\n")
    ) as { ok: boolean; message: string };

    expect(result.ok).toBe(false);
    expect(result.message).toContain("Cannot run bootstrap while repo-local processes are still active");
    expect(result.message).toContain("node.exe pid=21");
  });

  it("prefers the packaged runtime env when it exists", () => {
    const tempRepo = createTempDirectory("onlyspeech-runtime-env-packaged");
    const localAppData = join(tempRepo, "localappdata");
    const packagedEnvPath = join(localAppData, "OnlySpeech", ".env");
    mkdirSync(join(localAppData, "OnlySpeech"), { recursive: true });
    writeFileSync(packagedEnvPath, "TRANSLATION_PROVIDER=azure\n", "utf8");
    writeFileSync(join(tempRepo, ".env"), "TRANSLATION_PROVIDER=chatgpt\n", "utf8");

    const repoLiteral = tempRepo.replace(/'/g, "''");
    const localAppDataLiteral = localAppData.replace(/'/g, "''");
    const result = runPowerShellJson(
      [
        "& {",
        `  . '${helperPath}'`,
        `  Resolve-OnlySpeechRuntimeEnvPath -RepoRoot '${repoLiteral}' -LocalAppData '${localAppDataLiteral}' | ConvertTo-Json -Compress`,
        "}"
      ].join("\n")
    );

    expect(result).toBe(packagedEnvPath);
  });

  it("falls back to the repo-root env when no packaged profile is present", () => {
    const tempRepo = createTempDirectory("onlyspeech-runtime-env-repo");
    const repoEnvPath = join(tempRepo, ".env");
    writeFileSync(repoEnvPath, "TRANSLATION_PROVIDER=chatgpt\n", "utf8");

    const repoLiteral = tempRepo.replace(/'/g, "''");
    const localAppDataLiteral = join(tempRepo, "missing-localappdata").replace(/'/g, "''");
    const result = runPowerShellJson(
      [
        "& {",
        `  . '${helperPath}'`,
        `  Resolve-OnlySpeechRuntimeEnvPath -RepoRoot '${repoLiteral}' -LocalAppData '${localAppDataLiteral}' | ConvertTo-Json -Compress`,
        "}"
      ].join("\n")
    );

    expect(result).toBe(repoEnvPath);
  });
});
