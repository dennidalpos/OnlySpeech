import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "internal", "packaging", "package-core.ps1");
const exampleRepoRoot = String.raw`D:\Repo`;

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

describe("Get-PackagingLineClassification", () => {
  it("flags duplicate dependency output as unexpected", () => {
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; Get-PackagingLineClassification -Line '  • duplicate dependency references  dependencies=["@azure/abort-controller@2.1.2","debug@4.4.3","debug@4.4.3","debug@4.4.3"]' | ConvertTo-Json -Compress }`
    );

    expect(result).toEqual({ type: "unexpected-warning" });
  });

  it("flags DEP0190 output as unexpected", () => {
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; Get-PackagingLineClassification -Line '(node:28656) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.' | ConvertTo-Json -Compress }`
    );

    expect(result).toEqual({ type: "unexpected-warning" });
  });

  it("passes through normal electron-builder progress lines", () => {
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; Get-PackagingLineClassification -Line '  • packaging       platform=win32 arch=x64 electron=41.1.0' | ConvertTo-Json -Compress }`
    );

    expect(result).toEqual({ type: "normal" });
  });
});

describe("New-PackEnvironment", () => {
  it("adds the packaging compatibility preload", () => {
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; $envMap = @{ PATH = 'C:\\Windows\\System32' }; New-PackEnvironment -Environment $envMap -RepoRoot '${exampleRepoRoot}' | ConvertTo-Json -Compress }`
    ) as { NODE_OPTIONS: string };

    expect(result.NODE_OPTIONS).toContain(`--require=${exampleRepoRoot}\\tooling\\packaging\\electron-builder-compat-preload.cjs`);
  });

  it("does not duplicate the preload flag", () => {
    const preloadFlag = `--require=${exampleRepoRoot}\\tooling\\packaging\\electron-builder-compat-preload.cjs`;
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; $envMap = @{ NODE_OPTIONS = '${preloadFlag}' }; New-PackEnvironment -Environment $envMap -RepoRoot '${exampleRepoRoot}' | ConvertTo-Json -Compress }`
    ) as { NODE_OPTIONS: string };

    expect(result.NODE_OPTIONS).toBe(preloadFlag);
  });
});

describe("Get-PackCommandArgs", () => {
  it("pins the public Windows packaging targets and publish mode", () => {
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; Get-PackCommandArgs -RepoRoot '${exampleRepoRoot}' | ConvertTo-Json -Compress }`
    );

    expect(result).toEqual([
      `${exampleRepoRoot}\\node_modules\\electron-builder\\cli.js`,
      "--publish",
      "never",
      "--win",
      "nsis",
      "portable"
    ]);
  });

  it("adds the internal dir target only for the internal packaging profile", () => {
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; Get-PackCommandArgs -RepoRoot '${exampleRepoRoot}' -Profile Internal | ConvertTo-Json -Compress }`
    );

    expect(result).toEqual([
      `${exampleRepoRoot}\\node_modules\\electron-builder\\cli.js`,
      "--publish",
      "never",
      "--win",
      "nsis",
      "portable",
      "dir"
    ]);
  });
});

describe("Get-PublicPackageCleanupPlan", () => {
  it("keeps the public setup, portable, and unpacked archive artifacts", () => {
    const result = runPowerShellJson(
      [
        "& {",
        `  . '${scriptPath}'`,
        "  $entries = @(",
        "    [pscustomobject]@{ Name = 'OnlySpeech-0.1.0-x64-setup.exe'; FullName = 'D:\\Repo\\artifacts\\packages\\OnlySpeech-0.1.0-x64-setup.exe'; PSIsContainer = $false },",
        "    [pscustomobject]@{ Name = 'OnlySpeech-0.1.0-x64-portable.exe'; FullName = 'D:\\Repo\\artifacts\\packages\\OnlySpeech-0.1.0-x64-portable.exe'; PSIsContainer = $false },",
        "    [pscustomobject]@{ Name = 'OnlySpeech-0.1.0-x64-unpacked.zip'; FullName = 'D:\\Repo\\artifacts\\packages\\OnlySpeech-0.1.0-x64-unpacked.zip'; PSIsContainer = $false },",
        "    [pscustomobject]@{ Name = 'OnlySpeech-0.1.0-x64-setup.exe.blockmap'; FullName = 'D:\\Repo\\artifacts\\packages\\OnlySpeech-0.1.0-x64-setup.exe.blockmap'; PSIsContainer = $false },",
        "    [pscustomobject]@{ Name = 'latest.yml'; FullName = 'D:\\Repo\\artifacts\\packages\\latest.yml'; PSIsContainer = $false },",
        "    [pscustomobject]@{ Name = 'builder-debug.yml'; FullName = 'D:\\Repo\\artifacts\\packages\\builder-debug.yml'; PSIsContainer = $false },",
        "    [pscustomobject]@{ Name = 'win-unpacked'; FullName = 'D:\\Repo\\artifacts\\packages\\win-unpacked'; PSIsContainer = $true }",
        "  )",
        `  Get-PublicPackageCleanupPlan -PackagesRoot '${exampleRepoRoot}\\artifacts\\packages' -Entries $entries | ConvertTo-Json -Depth 6 -Compress`,
        "}"
      ].join("\n")
    ) as { Removals: Array<{ Name: string }> };

    expect(result.Removals.map((entry) => entry.Name)).toEqual([
      "OnlySpeech-0.1.0-x64-setup.exe.blockmap",
      "latest.yml",
      "builder-debug.yml",
      "win-unpacked"
    ]);
  });
});

describe("Get-PublicPackageArchiveName", () => {
  it("derives the unpacked archive name from the setup artifact", () => {
    const result = runPowerShellJson(
      [
        "& {",
        `  . '${scriptPath}'`,
        "  $entries = @(",
        "    [pscustomobject]@{ Name = 'OnlySpeech-0.1.0-x64-setup.exe'; FullName = 'D:\\Repo\\artifacts\\packages\\OnlySpeech-0.1.0-x64-setup.exe'; PSIsContainer = $false },",
        "    [pscustomobject]@{ Name = 'OnlySpeech-0.1.0-x64-portable.exe'; FullName = 'D:\\Repo\\artifacts\\packages\\OnlySpeech-0.1.0-x64-portable.exe'; PSIsContainer = $false }",
        "  )",
        `  Get-PublicPackageArchiveName -PackagesRoot '${exampleRepoRoot}\\artifacts\\packages' -Entries $entries | ConvertTo-Json -Compress`,
        "}"
      ].join("\n")
    );

    expect(result).toBe("OnlySpeech-0.1.0-x64-unpacked.zip");
  });
});

describe("package.json Windows packaging metadata", () => {
  it("brands the NSIS installer and shortcut configuration with the real app icon", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
      build: {
        artifactName: string;
        win: { icon: string };
        nsis: Record<string, unknown>;
        portable: Record<string, unknown>;
      };
    };

    expect(packageJson.build.artifactName).toBe("${productName}-${version}-${arch}.${ext}");
    expect(packageJson.build.win.icon).toBe("build/icon.ico");
    expect(packageJson.build.win.target).toEqual(["nsis", "portable"]);
    expect(packageJson.build.nsis).toMatchObject({
      artifactName: "${productName}-${version}-${arch}-setup.${ext}",
      createDesktopShortcut: "always",
      createStartMenuShortcut: true,
      shortcutName: "OnlySpeech",
      installerIcon: "build/icon.ico",
      uninstallerIcon: "build/icon.ico",
      installerHeaderIcon: "build/icon.ico"
    });
    expect(packageJson.build.portable).toMatchObject({
      artifactName: "${productName}-${version}-${arch}-portable.${ext}"
    });
  });

  it("keeps the canonical bootstrap wrapper on the lean Windows dependency tree", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
      engines: Record<string, string>;
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.engines).toEqual({
      node: ">=22",
      npm: ">=10"
    });
    expect(packageJson.scripts.bootstrap).toBe(
      "powershell -ExecutionPolicy Bypass -File ./scripts/public/bootstrap.ps1"
    );
    expect(packageJson.devDependencies["@rollup/rollup-win32-x64-msvc"]).toBe("4.60.1");
  });
});
