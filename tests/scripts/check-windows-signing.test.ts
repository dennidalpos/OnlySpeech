import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "support", "packaging", "check-windows-signing.ps1");

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

describe("Test-WindowsSigning", () => {
  it("accepts configured signing inputs", () => {
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; $values = @{ WIN_CSC_LINK = 'file://certificate.pfx'; WIN_CSC_KEY_PASSWORD = 'secret' }; Get-WindowsSigningStatus -Values $values | ConvertTo-Json -Compress }`
    );

    expect(result).toEqual({
      configured: true,
      requireSigning: false,
      missing: []
    });
  });

  it("fails when signing is required but inputs are missing", () => {
    const result = runPowerShellJson(
      `& { . '${scriptPath}'; $values = @{ ONLYSPEECH_REQUIRE_WINDOWS_SIGNING = 'true' }; Test-WindowsSigning -Values $values | ConvertTo-Json -Compress }`
    );

    expect(result).toEqual({
      ok: false,
      message: "Windows code-signing inputs are missing: WIN_CSC_LINK or CSC_LINK, WIN_CSC_KEY_PASSWORD or CSC_KEY_PASSWORD."
    });
  });
});
