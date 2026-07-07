import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const electronMocks = vi.hoisted(() => ({
  app: {
    isPackaged: false,
    getPath: vi.fn(() => "D:\\OnlySpeech\\userData")
  },
  session: {
    defaultSession: {
      setPermissionRequestHandler: vi.fn(),
      setPermissionCheckHandler: vi.fn()
    }
  }
}));

vi.mock("electron", () => electronMocks);

const displayMocks = vi.hoisted(() => ({
  getAvailableDisplays: vi.fn(() => [
    {
      id: 101,
      label: "Fixture A",
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      scaleFactor: 1
    },
    {
      id: 202,
      label: "Fixture B",
      bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
      scaleFactor: 1
    }
  ])
}));

vi.mock("../src/main/display-source.js", () => displayMocks);

import { createInitialWizardRuntimeStateWithAutostart } from "../src/main/setup-wizard-runtime.js";

const tempDirectories: string[] = [];

function createTempDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "onlyspeech-setup-runtime-"));
  tempDirectories.push(directory);
  return directory;
}

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop() ?? "", { recursive: true, force: true });
  }
});

describe("setup wizard runtime state", () => {
  it("marks an existing runtime env as saved so reopen flows do not force first-run password setup", () => {
    const runtimeRoot = createTempDirectory();
    const envText = [
      "APP_MODE=kiosk",
      "DISPLAY_A_ID=101",
      "DISPLAY_B_ID=202",
      "TRANSLATION_PROVIDER=chatgpt",
      "DEFAULT_TARGET_LANG_A=it",
      "DEFAULT_TARGET_LANG_B=en"
    ].join("\n");
    writeFileSync(join(runtimeRoot, ".env"), envText, "utf8");

    const state = createInitialWizardRuntimeStateWithAutostart(runtimeRoot, {
      mechanism: "current-user-run-key",
      scope: "current-user",
      supported: false,
      canModify: false,
      currentEnabled: false,
      selectedEnabled: false
    });

    expect(state.lastSavedEnvPath).toBe(join(runtimeRoot, ".env"));
    expect(state.lastSavedPreview).toBe(envText);
    expect(state.displays.find((display) => display.displayId === 101)?.assignedSide).toBe("A");
    expect(state.displays.find((display) => display.displayId === 202)?.assignedSide).toBe("B");
  });

  it("keeps first-run mode when no runtime env exists", () => {
    const runtimeRoot = createTempDirectory();
    mkdirSync(runtimeRoot, { recursive: true });

    const state = createInitialWizardRuntimeStateWithAutostart(runtimeRoot, {
      mechanism: "current-user-run-key",
      scope: "current-user",
      supported: false,
      canModify: false,
      currentEnabled: false,
      selectedEnabled: false
    });

    expect(state.lastSavedEnvPath).toBeNull();
    expect(state.lastSavedPreview).toBeNull();
  });
});
