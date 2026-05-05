import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "support", "packaging", "package-audit.ps1");

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

function getExpectedState(): {
  expectedFix: { name: string; isSemVerMajor: boolean };
  expectedVulnerabilities: string[];
  expectedCounts: Record<string, number>;
} {
  return runPowerShellJson(
    `& { . '${scriptPath}'; Get-ExpectedPackagingAuditState | ConvertTo-Json -Depth 6 -Compress }`
  ) as {
    expectedFix: { name: string; isSemVerMajor: boolean };
    expectedVulnerabilities: string[];
    expectedCounts: Record<string, number>;
  };
}

function validateReport(report: unknown) {
  const reportJson = JSON.stringify(report).replace(/'/g, "''");
  return runPowerShellJson(
    `& { . '${scriptPath}'; $report = ConvertFrom-Json -InputObject '${reportJson}'; Validate-PackagingAuditReport -Report $report | ConvertTo-Json -Compress }`
  );
}

describe("Validate-PackagingAuditReport", () => {
  it("accepts the current known audit shape", { timeout: 15000 }, () => {
    const expected = getExpectedState();
    const vulnerabilities = Object.fromEntries(
      expected.expectedVulnerabilities.map((name) => [
        name,
        {
          name,
          severity: "moderate",
          fixAvailable: { ...expected.expectedFix }
        }
      ])
    );

    expect(
      validateReport({
        vulnerabilities,
        metadata: { vulnerabilities: { ...expected.expectedCounts } }
      })
    ).toEqual({
      ok: true,
      message: "Packaging audit matches the current known packaging dependency state (2 findings)."
    });
  });

  it("rejects unexpected counts", () => {
    const expected = getExpectedState();
    expect(
      validateReport({
        vulnerabilities: {},
        metadata: { vulnerabilities: { ...expected.expectedCounts, total: 21 } }
      })
    ).toEqual({
      ok: false,
      message: "Unexpected total count: expected 2, found 21."
    });
  });

  it("rejects unexpected vulnerability entries", () => {
    const expected = getExpectedState();
    expect(
      validateReport({
        vulnerabilities: {
          electronBuilder: {
            name: "electronBuilder",
            severity: "moderate",
            fixAvailable: { ...expected.expectedFix }
          },
          uuid: {
            name: "uuid",
            severity: "moderate",
            fixAvailable: { ...expected.expectedFix }
          }
        },
        metadata: { vulnerabilities: { ...expected.expectedCounts } }
      })
    ).toEqual({
      ok: false,
      message: "Unexpected vulnerability list. Expected microsoft-cognitiveservices-speech-sdk, uuid. Found electronBuilder, uuid."
    });
  });

  it("accepts npm audit entries that collapse fixAvailable to true", () => {
    const expected = getExpectedState();
    const vulnerabilities = Object.fromEntries(
      expected.expectedVulnerabilities.map((name) => [
        name,
        {
          name,
          severity: "moderate",
          fixAvailable: name === "uuid" ? true : { ...expected.expectedFix }
        }
      ])
    );

    expect(
      validateReport({
        vulnerabilities,
        metadata: { vulnerabilities: { ...expected.expectedCounts } }
      })
    ).toEqual({
      ok: true,
      message: "Packaging audit matches the current known packaging dependency state (2 findings)."
    });
  });
});
