import { execFileSync } from "node:child_process";

const REG_KEY = "HKCU\\Software\\OnlySpeech\\Activation";
const TRIAL_VALUE = "TrialUsedAt";

/**
 * Reads the trial tombstone from the Windows Registry.
 * Returns the ISO 8601 UTC timestamp stored when the trial was first activated,
 * or null if no tombstone is present or the read fails.
 *
 * The tombstone persists across app uninstall/reinstall because the NSIS uninstaller
 * only removes the autostart registry entry, not this key.
 */
export function readTrialTombstone(): string | null {
  try {
    const output = execFileSync("reg", ["query", REG_KEY, "/v", TRIAL_VALUE], {
      windowsHide: true,
      encoding: "utf8"
    });
    const match = /REG_SZ\s+(.+)/.exec(output);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

/**
 * Writes the trial tombstone to the Windows Registry.
 * Throws when persistence fails so packaged trial activation never succeeds
 * without durable local enforcement.
 */
export function writeTrialTombstone(issuedAt: string): void {
  try {
    execFileSync(
      "reg",
      ["add", REG_KEY, "/v", TRIAL_VALUE, "/t", "REG_SZ", "/d", issuedAt, "/f"],
      { windowsHide: true, stdio: "ignore" }
    );
  } catch {
    throw new Error("Trial tombstone persistence failed.");
  }
}
