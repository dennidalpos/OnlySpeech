import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { createInitialWizardState } from "../src/tools/setup-wizard/shared.js";

const electronMocks = vi.hoisted(() => {
  const createdWindows: MockBrowserWindow[] = [];

  class MockBrowserWindow {
    static instances = createdWindows;

    readonly options: Record<string, unknown>;

    private destroyed = false;

    private readonly onceListeners = new Map<string, () => void>();

    private readonly onListeners = new Map<string, () => void>();

    loadURL = vi.fn(async () => undefined);

    once = vi.fn((event: string, listener: () => void) => {
      this.onceListeners.set(event, listener);
    });

    on = vi.fn((event: string, listener: () => void) => {
      this.onListeners.set(event, listener);
    });

    setBounds = vi.fn();

    setFullScreen = vi.fn();

    show = vi.fn();

    isDestroyed = vi.fn(() => this.destroyed);

    constructor(options: Record<string, unknown>) {
      this.options = options;
      createdWindows.push(this);
    }

    emit(event: string): void {
      this.onceListeners.get(event)?.();
      this.onListeners.get(event)?.();
    }
  }

  return {
    BrowserWindow: MockBrowserWindow,
    app: {
      isPackaged: false,
      getPath: vi.fn((name: string) => {
        if (name === "userData") {
          return "D:\\OnlySpeech\\userData";
        }
        if (name === "appData") {
          return "C:\\Users\\Installer\\AppData\\Roaming";
        }
        return "D:\\OnlySpeech";
      })
    },
    ipcMain: {
      handle: vi.fn(),
      on: vi.fn()
    },
    screen: {
      getAllDisplays: vi.fn(),
      getDisplayMatching: vi.fn(),
      getPrimaryDisplay: vi.fn()
    },
    shell: {
      openPath: vi.fn()
    },
    createdWindows
  };
});

vi.mock("electron", () => ({
  BrowserWindow: electronMocks.BrowserWindow,
  app: electronMocks.app,
  ipcMain: electronMocks.ipcMain,
  screen: electronMocks.screen,
  shell: electronMocks.shell
}));

import { SetupWizardManager } from "../src/main/setup-wizard-manager.js";

const tempDirectories: string[] = [];

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop() ?? "", { recursive: true, force: true });
  }
});

describe("SetupWizardManager control window", () => {
  beforeEach(() => {
    electronMocks.createdWindows.length = 0;
    electronMocks.ipcMain.handle.mockReset();
    electronMocks.ipcMain.on.mockReset();
    electronMocks.screen.getAllDisplays.mockReset();
    electronMocks.screen.getDisplayMatching.mockReset();
    electronMocks.screen.getPrimaryDisplay.mockReset();
    const primaryDisplay = {
      id: 1,
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      workArea: { x: 0, y: 40, width: 1920, height: 1000 }
    };
    electronMocks.screen.getAllDisplays.mockReturnValue([primaryDisplay]);
    electronMocks.screen.getDisplayMatching.mockReturnValue(primaryDisplay);
    electronMocks.screen.getPrimaryDisplay.mockReturnValue(primaryDisplay);
  });

  it("creates the setup wizard control window in native fullscreen on the primary display", () => {
    const manager = new SetupWizardManager({
      runtimeRoot: "D:\\OnlySpeech"
    });

    (manager as unknown as { state: unknown }).state = {
      envValues: {
        SETUP_UI_LANGUAGE: "en"
      }
    };
    (manager as unknown as { port: number }).port = 43123;

    (manager as unknown as { createControlWindow: () => void }).createControlWindow();

    const [window] = electronMocks.createdWindows;
    expect(window).toBeDefined();
    expect(window.options).toMatchObject({
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      fullscreen: true,
      fullscreenable: false,
      show: false
    });
    expect(window.loadURL).toHaveBeenCalledWith("http://127.0.0.1:43123/control?uiLanguage=en");

    window.emit("ready-to-show");

    expect(window.setBounds).toHaveBeenCalledWith({
      x: 0,
      y: 0,
      width: 1920,
      height: 1080
    });
    expect(window.setFullScreen).toHaveBeenCalledWith(true);
    expect(window.show).toHaveBeenCalledTimes(1);
  });

  it("initializes wizard state with the injected autostart snapshot", () => {
    const manager = new SetupWizardManager({
      runtimeRoot: "D:\\OnlySpeech",
      getAutostartState: () => ({
        mechanism: "startup-shortcut",
        scope: "current-user",
        supported: true,
        canModify: true,
        currentEnabled: false,
        selectedEnabled: true
      })
    });

    (manager as unknown as { refreshState: () => void }).refreshState();

    const snapshot = manager.getSnapshot();
    expect(snapshot.state?.autostart).toEqual({
      mechanism: "startup-shortcut",
      scope: "current-user",
      supported: true,
      canModify: true,
      currentEnabled: false,
      selectedEnabled: true
    });
  });

  it("persists env and secrets through wizard:save-env without touching autostart", async () => {
    const runtimeRoot = mkdtempSync(join(tmpdir(), "onlyspeech-wizard-save-"));
    tempDirectories.push(runtimeRoot);
    const onEnvSaved = vi.fn();

    const manager = new SetupWizardManager({
      runtimeRoot,
      onEnvSaved,
      getAutostartState: () => ({
        mechanism: "current-user-run-key" as const,
        scope: "current-user" as const,
        supported: true,
        canModify: true,
        currentEnabled: true,
        selectedEnabled: true
      })
    });

    const state = createInitialWizardState(
      [
        { displayId: 1, label: "A", bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 },
        { displayId: 2, label: "B", bounds: { x: 1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 }
      ],
      {
        SETUP_UI_LANGUAGE: "en",
        TRANSLATION_PROVIDER: "chatgpt",
        DEFAULT_TARGET_LANG_A: "it",
        DEFAULT_TARGET_LANG_B: "en",
        CHATGPT_API_KEY: "chatgpt-key",
        CHATGPT_MODEL: "gpt-4.1-mini",
        CHATGPT_TRANSCRIBE_MODEL: "gpt-4o-mini-transcribe"
      }
    );
    (manager as unknown as { state: unknown }).state = {
      ...state,
      autostart: {
        mechanism: "current-user-run-key",
        scope: "current-user",
        supported: true,
        canModify: true,
        currentEnabled: true,
        selectedEnabled: true
      }
    };
    (manager as unknown as { registerIpcHandlers: () => void }).registerIpcHandlers();

    const saveHandler = electronMocks.ipcMain.handle.mock.calls.find(
      ([channel]: string[]) => channel === "wizard:save-env"
    )?.[1] as (() => Promise<{
      envPath: string;
      preview: string;
      autostartEnabled: boolean;
      autostartSupported: boolean;
    }>) | undefined;

    if (!saveHandler) {
      throw new Error("wizard:save-env handler not registered.");
    }

    const result = await saveHandler();

    expect(onEnvSaved).toHaveBeenCalledTimes(1);
    expect(result.autostartEnabled).toBe(true);
    expect(result.autostartSupported).toBe(true);
    expect(readFileSync(join(runtimeRoot, ".env"), "utf8")).toContain("TRANSLATION_PROVIDER=chatgpt");
    expect(manager.getSnapshot().state?.autostart.currentEnabled).toBe(true);
    expect(manager.getSnapshot().state?.autostart.mechanism).toBe("current-user-run-key");
  });

  it("wizard:update-autostart applies the selected packaged startup state immediately", async () => {
    const runtimeRoot = mkdtempSync(join(tmpdir(), "onlyspeech-wizard-autostart-"));
    tempDirectories.push(runtimeRoot);
    const applyAutostartSelection = vi.fn((selectedEnabled: boolean) => ({
      mechanism: "current-user-run-key" as const,
      scope: "current-user" as const,
      supported: true,
      canModify: true,
      currentEnabled: selectedEnabled,
      selectedEnabled
    }));

    const manager = new SetupWizardManager({
      runtimeRoot,
      applyAutostartSelection,
      getAutostartState: () => ({
        mechanism: "current-user-run-key" as const,
        scope: "current-user" as const,
        supported: true,
        canModify: true,
        currentEnabled: true,
        selectedEnabled: true
      })
    });

    const state = createInitialWizardState(
      [
        { displayId: 1, label: "A", bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 },
        { displayId: 2, label: "B", bounds: { x: 1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 }
      ],
      {
        SETUP_UI_LANGUAGE: "en",
        TRANSLATION_PROVIDER: "chatgpt",
        DEFAULT_TARGET_LANG_A: "it",
        DEFAULT_TARGET_LANG_B: "en",
        CHATGPT_API_KEY: "chatgpt-key",
        CHATGPT_MODEL: "gpt-4.1-mini",
        CHATGPT_TRANSCRIBE_MODEL: "gpt-4o-mini-transcribe"
      }
    );
    (manager as unknown as { state: unknown }).state = {
      ...state,
      autostart: {
        mechanism: "current-user-run-key",
        scope: "current-user",
        supported: true,
        canModify: true,
        currentEnabled: true,
        selectedEnabled: true
      }
    };
    (manager as unknown as { registerIpcHandlers: () => void }).registerIpcHandlers();

    const updateAutostartHandler = electronMocks.ipcMain.handle.mock.calls.find(
      ([channel]: string[]) => channel === "wizard:update-autostart"
    )?.[1] as ((_event: unknown, payload: { selectedEnabled: boolean }) => Promise<unknown> | unknown) | undefined;

    if (!updateAutostartHandler) {
      throw new Error("wizard:update-autostart handler not registered.");
    }

    await updateAutostartHandler({}, { selectedEnabled: false });

    expect(applyAutostartSelection).toHaveBeenCalledWith(false);
    expect(manager.getSnapshot().state?.autostart).toMatchObject({
      mechanism: "current-user-run-key",
      scope: "current-user",
      currentEnabled: false,
      selectedEnabled: false
    });
  });
});
