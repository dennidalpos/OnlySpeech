import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const describeWindows = process.platform === "win32" ? describe : describe.skip;
const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "internal", "packaging", "package-release-artifacts.ps1");
const customerBundleWriteTimeoutMs = 15000;
const tempDirectories: string[] = [];

function createTempDirectory(name: string): string {
  const directory = mkdtempSync(join(tmpdir(), `${name}-`));
  tempDirectories.push(directory);
  return directory;
}

function runPowerShell(args: string[]): string {
  const result = spawnSync("powershell.exe", args, {
    cwd: repoRoot,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `PowerShell command failed with exit code ${result.status}.`,
        result.stdout.trim(),
        result.stderr.trim()
      ]
        .filter((value) => value.length > 0)
        .join("\n")
    );
  }

  return result.stdout.trim();
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describeWindows("write-customer-release-bundle.ps1", () => {
  it("prints the deterministic bundle plan in dry-run mode", () => {
    const output = runPowerShell([
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-DryRun"
    ]);

    const payload = JSON.parse(output) as {
      bundleName: string;
      dryRun: boolean;
    };

    expect(payload.bundleName).toBe("OnlySpeech-0.1.0-customer-release");
    expect(payload.dryRun).toBe(true);
  });

  it("writes the bundle structure with buyer docs and separated internal evidence", { timeout: customerBundleWriteTimeoutMs }, () => {
    const packagesRoot = createTempDirectory("onlyspeech-customer-bundle-packages");
    const logsRoot = createTempDirectory("onlyspeech-customer-bundle-logs");
    const outputRoot = createTempDirectory("onlyspeech-customer-bundle-output");
    const winUnpackedRoot = join(packagesRoot, "win-unpacked");
    mkdirSync(winUnpackedRoot, { recursive: true });

    writeFileSync(join(packagesRoot, "OnlySpeech-0.1.0-x64-setup.exe"), "setup", "utf8");
    writeFileSync(join(packagesRoot, "OnlySpeech-0.1.0-x64-portable.exe"), "portable", "utf8");
    writeFileSync(join(winUnpackedRoot, "OnlySpeech.exe"), "binary", "utf8");
    writeFileSync(join(logsRoot, "release-evidence.json"), '{"ok":true}', "utf8");
    writeFileSync(join(logsRoot, "third-party-notices.json"), '{"notices":[]}', "utf8");
    writeFileSync(join(logsRoot, "sbom.cdx.json"), '{"bomFormat":"CycloneDX"}', "utf8");

    const output = runPowerShell([
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-PackagesRoot",
      packagesRoot,
      "-LogsRoot",
      logsRoot,
      "-OutputRoot",
      outputRoot
    ]);

    const payload = JSON.parse(output) as {
      bundleRoot: string;
      manifestPath: string;
      checklistPath: string;
      unpackedArchivePath: string;
      internalEvidenceIncluded: string[];
    };

    const bundleRoot = payload.bundleRoot;
    const manifest = JSON.parse(readFileSync(payload.manifestPath, "utf8")) as {
      included_packages: Array<{ bundled_as: string }>;
      internal_evidence: Array<{ bundled_as: string; included: boolean }>;
    };

    expect(existsSync(bundleRoot)).toBe(true);
    expect(existsSync(payload.checklistPath)).toBe(true);
    expect(existsSync(payload.unpackedArchivePath)).toBe(true);
    expect(readdirSync(join(bundleRoot, "customer-docs")).sort()).toEqual([
      "ai-disclosure-copy.md",
      "b2b-dpa-baseline.md",
      "customer-quick-start.md",
      "operator-privacy-deployment-guidance.md",
      "privacy-policy-baseline.md",
      "support-and-fulfillment-policy.md",
      "terms-and-license-baseline.md"
    ]);
    expect(readdirSync(join(bundleRoot, "internal-evidence")).sort()).toEqual([
      "release-evidence.json",
      "sbom.cdx.json",
      "third-party-notices.json"
    ]);
    expect(manifest.included_packages.map((item) => item.bundled_as)).toContain("packages\\OnlySpeech-0.1.0-x64-setup.exe");
    expect(manifest.included_packages.map((item) => item.bundled_as)).toContain("packages\\OnlySpeech-0.1.0-x64-portable.exe");
    expect(manifest.included_packages.map((item) => item.bundled_as)).toContain("packages\\OnlySpeech-0.1.0-x64-unpacked.zip");
    expect(manifest.internal_evidence.every((item) => item.included)).toBe(true);
    expect(payload.internalEvidenceIncluded).toEqual([
      "internal-evidence\\release-evidence.json",
      "internal-evidence\\third-party-notices.json",
      "internal-evidence\\sbom.cdx.json"
    ]);
  });

  it("recreates the versioned bundle root so stale buyer docs are removed", { timeout: customerBundleWriteTimeoutMs }, () => {
    const packagesRoot = createTempDirectory("onlyspeech-customer-bundle-stale-packages");
    const logsRoot = createTempDirectory("onlyspeech-customer-bundle-stale-logs");
    const outputRoot = createTempDirectory("onlyspeech-customer-bundle-stale-output");
    const winUnpackedRoot = join(packagesRoot, "win-unpacked");
    const bundleRoot = join(outputRoot, "OnlySpeech-0.1.0-customer-release");
    const staleDocPath = join(bundleRoot, "customer-docs", "marketplace-sales-package.md");

    mkdirSync(winUnpackedRoot, { recursive: true });
    mkdirSync(join(bundleRoot, "customer-docs"), { recursive: true });

    writeFileSync(join(packagesRoot, "OnlySpeech-0.1.0-x64-setup.exe"), "setup", "utf8");
    writeFileSync(join(packagesRoot, "OnlySpeech-0.1.0-x64-portable.exe"), "portable", "utf8");
    writeFileSync(join(winUnpackedRoot, "OnlySpeech.exe"), "binary", "utf8");
    writeFileSync(join(logsRoot, "release-evidence.json"), '{"ok":true}', "utf8");
    writeFileSync(join(logsRoot, "third-party-notices.json"), '{"notices":[]}', "utf8");
    writeFileSync(join(logsRoot, "sbom.cdx.json"), '{"bomFormat":"CycloneDX"}', "utf8");
    writeFileSync(staleDocPath, "obsolete", "utf8");

    runPowerShell([
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-PackagesRoot",
      packagesRoot,
      "-LogsRoot",
      logsRoot,
      "-OutputRoot",
      outputRoot
    ]);

    expect(existsSync(staleDocPath)).toBe(false);
    expect(readdirSync(join(bundleRoot, "customer-docs")).sort()).not.toContain("marketplace-sales-package.md");
  });

  it("accepts the versioned unpacked zip after the public packaging cleanup", () => {
    const packagesRoot = createTempDirectory("onlyspeech-customer-bundle-zipped-packages");
    const logsRoot = createTempDirectory("onlyspeech-customer-bundle-zipped-logs");
    const outputRoot = createTempDirectory("onlyspeech-customer-bundle-zipped-output");

    writeFileSync(join(packagesRoot, "OnlySpeech-0.1.0-x64-setup.exe"), "setup", "utf8");
    writeFileSync(join(packagesRoot, "OnlySpeech-0.1.0-x64-portable.exe"), "portable", "utf8");
    writeFileSync(join(packagesRoot, "OnlySpeech-0.1.0-x64-unpacked.zip"), "zip-binary", "utf8");
    writeFileSync(join(logsRoot, "release-evidence.json"), '{"ok":true}', "utf8");
    writeFileSync(join(logsRoot, "third-party-notices.json"), '{"notices":[]}', "utf8");
    writeFileSync(join(logsRoot, "sbom.cdx.json"), '{"bomFormat":"CycloneDX"}', "utf8");

    const output = runPowerShell([
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-PackagesRoot",
      packagesRoot,
      "-LogsRoot",
      logsRoot,
      "-OutputRoot",
      outputRoot
    ]);

    const payload = JSON.parse(output) as {
      manifestPath: string;
      unpackedArchivePath: string;
    };
    const manifest = JSON.parse(readFileSync(payload.manifestPath, "utf8")) as {
      included_packages: Array<{ source: string; bundled_as: string }>;
    };

    expect(existsSync(payload.unpackedArchivePath)).toBe(true);
    expect(readFileSync(payload.unpackedArchivePath, "utf8")).toBe("zip-binary");
    expect(
      manifest.included_packages.some(
        (item) =>
          item.bundled_as === "packages\\OnlySpeech-0.1.0-x64-unpacked.zip" &&
          item.source.endsWith("OnlySpeech-0.1.0-x64-unpacked.zip")
      )
    ).toBe(true);
  });

  it("includes only the retained internal evidence files that actually exist", { timeout: customerBundleWriteTimeoutMs }, () => {
    const packagesRoot = createTempDirectory("onlyspeech-customer-bundle-partial-packages");
    const logsRoot = createTempDirectory("onlyspeech-customer-bundle-partial-logs");
    const outputRoot = createTempDirectory("onlyspeech-customer-bundle-partial-output");
    const winUnpackedRoot = join(packagesRoot, "win-unpacked");

    mkdirSync(winUnpackedRoot, { recursive: true });
    writeFileSync(join(packagesRoot, "OnlySpeech-0.1.0-x64-setup.exe"), "setup", "utf8");
    writeFileSync(join(packagesRoot, "OnlySpeech-0.1.0-x64-portable.exe"), "portable", "utf8");
    writeFileSync(join(winUnpackedRoot, "OnlySpeech.exe"), "binary", "utf8");
    writeFileSync(join(logsRoot, "release-evidence.json"), '{"ok":true}', "utf8");

    const output = runPowerShell([
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-PackagesRoot",
      packagesRoot,
      "-LogsRoot",
      logsRoot,
      "-OutputRoot",
      outputRoot
    ]);

    const payload = JSON.parse(output) as {
      bundleRoot: string;
      manifestPath: string;
      internalEvidenceIncluded: string[];
    };
    const manifest = JSON.parse(readFileSync(payload.manifestPath, "utf8")) as {
      internal_evidence: Array<{ bundled_as: string; included: boolean; source: string | null }>;
    };

    expect(existsSync(join(payload.bundleRoot, "internal-evidence", "release-evidence.json"))).toBe(true);
    expect(existsSync(join(payload.bundleRoot, "internal-evidence", "third-party-notices.json"))).toBe(false);
    expect(existsSync(join(payload.bundleRoot, "internal-evidence", "sbom.cdx.json"))).toBe(false);
    expect(payload.internalEvidenceIncluded).toEqual(["internal-evidence\\release-evidence.json"]);
    expect(manifest.internal_evidence).toEqual([
      {
        source: expect.stringContaining("release-evidence.json"),
        bundled_as: "internal-evidence\\release-evidence.json",
        included: true
      },
      {
        source: null,
        bundled_as: "internal-evidence\\third-party-notices.json",
        included: false
      },
      {
        source: null,
        bundled_as: "internal-evidence\\sbom.cdx.json",
        included: false
      }
    ]);
  });
});
