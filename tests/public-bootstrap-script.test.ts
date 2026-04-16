import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "public", "bootstrap.ps1");
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

describe("public bootstrap wrapper", () => {
  it("plans npm ci when node_modules is missing", () => {
    const tempRepo = createTempDirectory("onlyspeech-bootstrap-missing");
    writeFileSync(join(tempRepo, "package-lock.json"), "{\n  \"name\": \"onlyspeech\"\n}\n", "utf8");

    const repoLiteral = tempRepo.replace(/'/g, "''");
    const result = runPowerShellJson(
      [
        `& { . '${scriptPath}'`,
        `  Get-OnlySpeechBootstrapPlan -RepoRoot '${repoLiteral}' | ConvertTo-Json -Depth 8 -Compress`,
        "}"
      ].join("\n")
    ) as {
      ShouldInstall: boolean;
      Reason: string;
      Arguments: string[];
    };

    expect(result.ShouldInstall).toBe(true);
    expect(result.Reason).toBe("missing-node-modules");
    expect(result.Arguments).toEqual(["ci", "--include=dev", "--omit=optional"]);
  });

  it("fails early when the active Node.js version is below the supported baseline", () => {
    const tempRepo = createTempDirectory("onlyspeech-bootstrap-node-version");
    writeFileSync(join(tempRepo, "package-lock.json"), "{\n  \"name\": \"onlyspeech\"\n}\n", "utf8");

    const repoLiteral = tempRepo.replace(/'/g, "''");
    const result = runPowerShellJson(
      [
        `& { . '${scriptPath}'`,
        "  try {",
        `    Get-OnlySpeechBootstrapPlan -RepoRoot '${repoLiteral}' -NodeVersion 'v20.18.0' | Out-Null`,
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

  it("skips npm ci when the dependency tree is already healthy", () => {
    const tempRepo = createTempDirectory("onlyspeech-bootstrap-ok");
    writeFileSync(join(tempRepo, "package-lock.json"), "{\n  \"name\": \"onlyspeech\"\n}\n", "utf8");
    mkdirSync(join(tempRepo, "node_modules"), { recursive: true });

    const repoLiteral = tempRepo.replace(/'/g, "''");
    const result = runPowerShellJson(
      [
        `& { . '${scriptPath}'`,
        "  $state = [pscustomobject]@{ ExitCode = 0; Output = @('ok') }",
        `  Get-OnlySpeechBootstrapPlan -RepoRoot '${repoLiteral}' -DependencyInstallState $state | ConvertTo-Json -Depth 8 -Compress`,
        "}"
      ].join("\n")
    ) as {
      ShouldInstall: boolean;
      Reason: string;
      Message: string;
    };

    expect(result.ShouldInstall).toBe(false);
    expect(result.Reason).toBe("already-installed");
    expect(result.Message).toContain("skipping npm ci");
  });

  it("reinstalls when the dependency probe reports an inconsistent tree", () => {
    const tempRepo = createTempDirectory("onlyspeech-bootstrap-broken");
    writeFileSync(join(tempRepo, "package-lock.json"), "{\n  \"name\": \"onlyspeech\"\n}\n", "utf8");
    mkdirSync(join(tempRepo, "node_modules"), { recursive: true });

    const repoLiteral = tempRepo.replace(/'/g, "''");
    const result = runPowerShellJson(
      [
        `& { . '${scriptPath}'`,
        "  $state = [pscustomobject]@{ ExitCode = 1; Output = @('missing: vite') }",
        `  Get-OnlySpeechBootstrapPlan -RepoRoot '${repoLiteral}' -DependencyInstallState $state | ConvertTo-Json -Depth 8 -Compress`,
        "}"
      ].join("\n")
    ) as {
      ShouldInstall: boolean;
      Reason: string;
      Message: string;
    };

    expect(result.ShouldInstall).toBe(true);
    expect(result.Reason).toBe("invalid-dependency-tree");
    expect(result.Message).toContain("reinstalling dependencies with npm ci");
    expect(result.Message).toContain("missing: vite");
  });

  it("honors a forced refresh request even when node_modules already exists", () => {
    const tempRepo = createTempDirectory("onlyspeech-bootstrap-force");
    writeFileSync(join(tempRepo, "package-lock.json"), "{\n  \"name\": \"onlyspeech\"\n}\n", "utf8");
    mkdirSync(join(tempRepo, "node_modules"), { recursive: true });

    const repoLiteral = tempRepo.replace(/'/g, "''");
    const result = runPowerShellJson(
      [
        `& { . '${scriptPath}'`,
        `  Get-OnlySpeechBootstrapPlan -RepoRoot '${repoLiteral}' -ForceRefresh | ConvertTo-Json -Depth 8 -Compress`,
        "}"
      ].join("\n")
    ) as {
      ShouldInstall: boolean;
      Reason: string;
    };

    expect(result.ShouldInstall).toBe(true);
    expect(result.Reason).toBe("force-refresh");
  });
});
