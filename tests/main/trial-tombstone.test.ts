import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock child_process before importing the module under test
vi.mock("node:child_process", () => ({
  execFileSync: vi.fn()
}));

import { execFileSync } from "node:child_process";
import { readTrialTombstone, writeTrialTombstone } from "../../src/main/trial-tombstone.js";

const mockExecFileSync = vi.mocked(execFileSync);

beforeEach(() => {
  mockExecFileSync.mockReset();
});

describe("readTrialTombstone", () => {
  it("returns null when reg.exe throws (key absent)", () => {
    mockExecFileSync.mockImplementation(() => { throw new Error("exit code 1"); });
    expect(readTrialTombstone()).toBeNull();
  });

  it("returns null when reg output does not contain a REG_SZ value", () => {
    mockExecFileSync.mockReturnValue("HKEY_CURRENT_USER\\Software\\OnlySpeech\\Activation\r\n");
    expect(readTrialTombstone()).toBeNull();
  });

  it("returns the timestamp when the registry value is present", () => {
    const ts = "2026-04-08T12:00:00.000Z";
    mockExecFileSync.mockReturnValue(
      `HKEY_CURRENT_USER\\Software\\OnlySpeech\\Activation\r\n    TrialUsedAt    REG_SZ    ${ts}\r\n`
    );
    expect(readTrialTombstone()).toBe(ts);
  });
});

describe("writeTrialTombstone", () => {
  it("calls reg add with the correct arguments", () => {
    const ts = "2026-04-08T12:00:00.000Z";
    mockExecFileSync.mockReturnValue(undefined as unknown as string);
    writeTrialTombstone(ts);
    expect(mockExecFileSync).toHaveBeenCalledWith(
      "reg",
      ["add", "HKCU\\Software\\OnlySpeech\\Activation", "/v", "TrialUsedAt", "/t", "REG_SZ", "/d", ts, "/f"],
      { windowsHide: true, stdio: "ignore" }
    );
  });

  it("throws when reg.exe fails so packaged trial activation cannot continue without enforcement", () => {
    mockExecFileSync.mockImplementation(() => { throw new Error("access denied"); });
    expect(() => writeTrialTombstone("2026-04-08T12:00:00.000Z")).toThrow(
      "Trial tombstone persistence failed."
    );
  });
});
