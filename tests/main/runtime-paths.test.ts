import { describe, expect, it } from "vitest";
import {
  getActivationStateFilePath,
  getRuntimeEnvFilePath,
  getRuntimeSecretsFilePath,
  getSetupWizardAccessFilePath,
  resolveAppProfilePaths,
  resolveCanonicalWindowsLocalAppDataPath,
  selectRuntimeRoot
} from "../../src/main/runtime-paths.js";

describe("selectRuntimeRoot", () => {
  it("uses the current working directory during source execution", () => {
    const runtimeRoot = selectRuntimeRoot({
      isPackaged: false,
      currentWorkingDirectory: "D:\\Repo",
      packagedDefaultRoot: "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech"
    });

    expect(runtimeRoot).toBe("D:\\Repo");
  });

  it("uses the packaged app profile root during packaged execution", () => {
    const runtimeRoot = selectRuntimeRoot({
      isPackaged: true,
      currentWorkingDirectory: "D:\\Repo",
      packagedDefaultRoot: "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech"
    });

    expect(runtimeRoot).toBe("C:\\Users\\Installer\\AppData\\Local\\OnlySpeech");
  });
});

describe("getRuntimeEnvFilePath", () => {
  it("builds the runtime env path from the chosen root", () => {
    expect(getRuntimeEnvFilePath("D:\\Deploy\\OnlySpeech")).toBe("D:\\Deploy\\OnlySpeech\\.env");
  });
});

describe("getRuntimeSecretsFilePath", () => {
  it("stores packaged release secrets under the workstation user profile", () => {
    expect(getRuntimeSecretsFilePath("C:\\Users\\Installer\\AppData\\Local\\OnlySpeech")).toBe(
      "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech\\config\\runtime-secrets.json"
    );
  });
});

describe("getActivationStateFilePath", () => {
  it("stores packaged activation state next to the other workstation-local config files", () => {
    expect(getActivationStateFilePath("C:\\Users\\Installer\\AppData\\Local\\OnlySpeech")).toBe(
      "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech\\config\\activation-state.json"
    );
  });
});

describe("getSetupWizardAccessFilePath", () => {
  it("stores the setup wizard access gate next to the other workstation-local config files", () => {
    expect(getSetupWizardAccessFilePath("C:\\Users\\Installer\\AppData\\Local\\OnlySpeech")).toBe(
      "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech\\config\\setup-wizard-access.json"
    );
  });
});

describe("resolveAppProfilePaths", () => {
  it("uses LocalAppData on Windows for a stable local workstation profile", () => {
    expect(
      resolveAppProfilePaths({
        platform: "win32",
        localAppDataPath: "C:\\Users\\Installer\\AppData\\Local",
        appDataPath: "C:\\Users\\Installer\\AppData\\Roaming"
      })
    ).toEqual({
      userDataPath: "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech",
      sessionDataPath: "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech\\session-data"
    });
  });

  it("derives LocalAppData from the Windows user profile when the env var is missing", () => {
    expect(
      resolveCanonicalWindowsLocalAppDataPath({
        localAppDataPath: null,
        userProfilePath: "C:\\Users\\Installer",
        homeDrivePath: null,
        homePath: null
      })
    ).toBe("C:\\Users\\Installer\\AppData\\Local");
  });

  it("uses the derived LocalAppData path on Windows when LOCALAPPDATA is unavailable", () => {
    expect(
      resolveAppProfilePaths({
        platform: "win32",
        localAppDataPath: null,
        userProfilePath: "C:\\Users\\Installer",
        appDataPath: "C:\\Users\\Installer\\AppData\\Roaming"
      })
    ).toEqual({
      userDataPath: "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech",
      sessionDataPath: "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech\\session-data"
    });
  });

  it("ignores an app-specific userData override and derives the canonical Windows LocalAppData root", () => {
    expect(
      resolveAppProfilePaths({
        platform: "win32",
        localAppDataPath: "D:\\OnlySpeech\\userData",
        userProfilePath: "C:\\Users\\Installer",
        appDataPath: "C:\\Users\\Installer\\AppData\\Roaming"
      })
    ).toEqual({
      userDataPath: "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech",
      sessionDataPath: "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech\\session-data"
    });
  });

  it("requires a resolvable LocalAppData root on Windows", () => {
    expect(() =>
      resolveAppProfilePaths({
        platform: "win32",
        localAppDataPath: null,
        userProfilePath: null,
        homeDrivePath: null,
        homePath: null,
        appDataPath: null
      })
    ).toThrow("Unable to resolve the OnlySpeech LocalAppData root on Windows.");
  });
});
