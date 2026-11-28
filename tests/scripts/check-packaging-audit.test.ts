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
  expectedFix: { name: string; isSemVerMajor: boolean } | null;
  expectedVulnerabilities: string[];
  expectedCounts: Record<string, number>;
} {
  return runPowerShellJson(
    `& { . '${scriptPath}'; Get-ExpectedPackagingAuditState | ConvertTo-Json -Depth 6 -Compress }`
  ) as {
    expectedFix: { name: string; isSemVerMajor: boolean } | null;
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
  it("accepts a clean audit report", { timeout: 15000 }, () => {
    const expected = getExpectedState();

    expect(
      validateReport({
        vulnerabilities: {},
        metadata: { vulnerabilities: { ...expected.expectedCounts } }
      })
    ).toEqual({
      ok: true,
      message: "Packaging audit matches the current expected dependency state (0 findings)."
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
      message: "Unexpected total count: expected 0, found 21."
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
            fixAvailable: true
          },
          uuid: {
            name: "uuid",
            severity: "moderate",
            fixAvailable: true
          }
        },
        metadata: { vulnerabilities: { ...expected.expectedCounts, moderate: 2, total: 2 } }
      })
    ).toEqual({
      ok: false,
      message: "Unexpected moderate count: expected 0, found 2."
    });
  });

  it("rejects vulnerability entries when counts claim a clean audit", () => {
    expect(
      validateReport({
        vulnerabilities: {
          uuid: {
            name: "uuid",
            severity: "moderate",
            fixAvailable: true
          }
        },
        metadata: {
          vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 }
        }
      })
    ).toEqual({
      ok: false,
      message: "Unexpected vulnerability list length: expected 0, found 1."
    });
  });
});
