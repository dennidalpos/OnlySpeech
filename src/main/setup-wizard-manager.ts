import { createServer, type Server } from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, ipcMain, screen, shell, type IpcMainEvent, type IpcMainInvokeEvent } from "electron";
import { parse as parseEnv } from "dotenv";
import {
  findMatchingPersistedMicrophone,
} from "../services/audio/persisted-microphone-id.js";
import { filterSelectableMicrophones } from "../services/audio/selectable-microphones.js";
import { TranslationProviderService } from "../services/speech/translation-provider-service.js";
import { findInteractionLanguageChoice } from "../shared/language-registry.js";
import type {
  ActivationSubmissionResult,
  SpeechTurnResult,
  TrialAvailabilityState,
  TranslationProvider
} from "../shared/types.js";
import {
  createDefaultEnvValues,
  type EnvKey,
  type ProbeMicrophoneInfo
} from "../tools/env-probe-output.js";
import { getSetupWizardControlHtml, getSetupWizardOverlayHtml } from "../tools/setup-wizard/pages.js";
import { getRuntimeEnvFilePath, getRuntimeSecretsFilePath } from "./runtime-paths.js";
import {
  applyWizardSelectionsFromEnv,
  assignDisplay,
  assignMicrophone,
  buildWizardEnv,
  getWizardRuntimeProfile,
  mergeMicrophoneProbe,
  type WizardLicenseInfo,
  type WizardState
} from "../tools/setup-wizard/shared.js";
import {
  normalizeSetupWizardUiLanguage,
  type SetupWizardUiLanguage
} from "../tools/setup-wizard/localization.js";
import {
  type PersistedActivationState
} from "./activation-storage.js";
import {
  collectDisplays,
  configureWizardPermissions,
  createInitialWizardRuntimeStateWithAutostart,
  createRuntimeConfigFromWizardEnv,
  getRuntimeLogsDirectory
} from "./setup-wizard-runtime.js";
import {
  getSecureRuntimeSecretKeys,
  isSecureRuntimeSecretStorageEnabled,
  persistRuntimeSecrets,
  type RuntimeSecretStorageAdapter
} from "./runtime-secrets.js";
import { clampBoundsToVisibleArea } from "./window-factory.js";
import { getAzureTextToSpeechCatalogSnapshotFromEnvironment } from "./azure-text-to-speech-catalog.js";
import {
  clickBrowserWindowSelector,
  captureBrowserWindowPng,
  focusBrowserWindow,
  inspectBrowserWindowSelectors,
  type BrowserWindowSelectorInspection,
  waitForBrowserWindowReady
} from "./browser-window-dom.js";
import {
  getSetupWizardLicenseFailureMessage,
  prepareActivationSubmission
} from "./activation-flow.js";
import {
  applyWizardAutostartSelection,
  getWizardAutostartState
} from "./setup-wizard-autostart.js";
import { installWindowNavigationGuards } from "./window-security.js";
import { overlayWizardChannels, parseWizardPayload } from "./setup-wizard-ipc.js";

export { hasRuntimeEnvFile } from "./setup-wizard-runtime.js";

interface SetupWizardSessionClosedEvent {
  saved: boolean;
  appliedDuringSession: boolean;
}

interface SetupWizardManagerOptions {
  runtimeRoot: string;
  getAutostartState?: () => WizardState["autostart"];
  getAccessNotice?: () => {
    temporaryPassword: string | null;
    mustChangePassword: boolean;
  };
  onEnvSaved?: () => Promise<void> | void;
  onSessionClosed?: (event: SetupWizardSessionClosedEvent) => void;
  onVisibilityChanged?: (visible: boolean) => void;
  /** Returns the currently persisted activation state, or null if none exists. */
  getLicenseState?: () => PersistedActivationState | null;
  /** Persists a newly validated activation state. */
  updateLicense?: (newState: PersistedActivationState) => void;
  /** Deletes the stored activation state. */
  clearLicense?: () => void;
  /** Returns whether the packaged workstation can still start a local trial. */
  getTrialAvailability?: () => TrialAvailabilityState;
  /** Starts the packaged trial through the canonical activation flow. */
  submitTrial?: () => Promise<ActivationSubmissionResult> | ActivationSubmissionResult;
  /** Terminates the application after the wizard completes a blocking close-out path. */
  terminateApplication?: () => Promise<void> | void;
  /** Applies the packaged autostart selection. Primarily injectable for tests. */
  applyAutostartSelection?: (selectedEnabled: boolean) => WizardState["autostart"];
  /** Encrypts packaged runtime secrets. Primarily injectable for tests. */
  runtimeSecretStorageAdapter?: RuntimeSecretStorageAdapter;
  /** Sets/persists a custom setup wizard password. */
  setPassword?: (password: string) => void;
}

function usesSecureRuntimeSecretStorage(): boolean {
  return isSecureRuntimeSecretStorageEnabled({ isPackaged: app.isPackaged });
}

function mergeSecureRuntimeSecretsForWizardState(
  redactedEnvValues: Partial<Record<EnvKey, string>>,
  sourceEnvValues: Record<EnvKey, string>
): Partial<Record<EnvKey, string>> {
  if (!usesSecureRuntimeSecretStorage()) {
    return redactedEnvValues;
  }

  const envValues = { ...redactedEnvValues };
  for (const key of getSecureRuntimeSecretKeys()) {
    envValues[key] = sourceEnvValues[key] ?? "";
  }

  return envValues;
}

function computeWizardLicenseInfo(state: PersistedActivationState, now = new Date()): WizardLicenseInfo {
  let daysRemaining: number | null = null;
  let isExpired = false;

  if (state.claims.expiresAt !== null) {
    const expiresAtMs = Date.parse(state.claims.expiresAt);
    const diffMs = expiresAtMs - now.getTime();
    daysRemaining = Math.ceil(diffMs / 86_400_000);
    isExpired = diffMs <= 0;
  }

  return {
    email: state.claims.email,
    plan: state.claims.plan,
    issuedAt: state.claims.issuedAt,
    expiresAt: state.claims.expiresAt,
    activatedAt: state.activatedAt,
    daysRemaining,
    isExpired
  };
}

function validateWizardDefaultTargetLanguages(envValues: Record<EnvKey, string>): void {
  const provider = envValues.TRANSLATION_PROVIDER.trim();
  if (provider !== "azure" && provider !== "chatgpt" && provider !== "ollama") {
    throw new Error(`TRANSLATION_PROVIDER='${provider}' is not supported by the setup wizard.`);
  }
  const defaults: Array<readonly ["DEFAULT_TARGET_LANG_A" | "DEFAULT_TARGET_LANG_B", string]> = [
    ["DEFAULT_TARGET_LANG_A", envValues.DEFAULT_TARGET_LANG_A],
    ["DEFAULT_TARGET_LANG_B", envValues.DEFAULT_TARGET_LANG_B]
  ];

  for (const [envKey, value] of defaults) {
    const resolved = findInteractionLanguageChoice(value, provider as TranslationProvider, {
      includeProviderExpansions: true
    });

    if (!resolved) {
      throw new Error(
        `${envKey}='${value}' is not supported by translation provider '${provider}'.`
      );
    }
  }
}

function resolveSetupWizardUiLanguage(
  envValues: Partial<Record<EnvKey, string>>
): SetupWizardUiLanguage {
  return normalizeSetupWizardUiLanguage(envValues.SETUP_UI_LANGUAGE);
}

export class SetupWizardManager {
  private readonly preloadPath = fileURLToPath(new URL("../tools/setup-wizard/preload.cjs", import.meta.url));

  private readonly overlayWindows = new Map<number, BrowserWindow>();

  private controlWindow: BrowserWindow | null = null;

  private server: Server | null = null;

  private port: number | null = null;

  private state: WizardState | null = null;

  private readyPromise: Promise<void> | null = null;

  private ipcRegistered = false;

  private savedDuringSession = false;

  private appliedDuringSession = false;

  private monitorSessionActive = false;

  private stopWatchingDisplays: (() => void) | null = null;

  private pendingDisplaySyncTimer: NodeJS.Timeout | null = null;

  constructor(private readonly options: SetupWizardManagerOptions) {}

  async ensureReady(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = this.initializeInternal();
    }

    await this.readyPromise;
  }

  async open(): Promise<void> {
    await this.ensureReady();

    if (this.monitorSessionActive) {
      this.closeMonitorSetup();
    }

    if (this.controlWindow && !this.controlWindow.isDestroyed()) {
      focusBrowserWindow(this.controlWindow);
      this.broadcastState();
      return;
    }

    this.savedDuringSession = false;
    this.appliedDuringSession = false;
    this.refreshState();
    this.createControlWindow();
    this.broadcastState();
  }

  async openMonitorSetup(): Promise<void> {
    await this.open();
    this.refreshState();
    this.monitorSessionActive = true;
    if (this.controlWindow && !this.controlWindow.isDestroyed() && !this.controlWindow.isMinimized()) {
      this.controlWindow.minimize();
    }
    this.createOverlayWindows({ focusWindows: true });
    this.broadcastState();
  }

  closeMonitorSetup(): void {
    this.monitorSessionActive = false;
    this.closeOverlayWindows();
    this.restoreControlWindow();
  }

  private closeOverlayWindows(): void {
    for (const [displayId, window] of this.overlayWindows.entries()) {
      if (!window.isDestroyed()) {
        window.close();
      }
      this.overlayWindows.delete(displayId);
    }
  }

  close(): void {
    if (this.controlWindow && !this.controlWindow.isDestroyed()) {
      this.controlWindow.close();
      return;
    }

    this.closeMonitorSetup();
  }

  closeCurrentOverlay(window: BrowserWindow | null): void {
    if (!window || window.isDestroyed()) {
      return;
    }

    const displayEntry = [...this.overlayWindows.entries()].find(([, candidate]) => candidate === window);
    if (displayEntry) {
      this.overlayWindows.delete(displayEntry[0]);
    }
    window.close();
  }

  dispose(): void {
    this.monitorSessionActive = false;
    this.stopWatchingDisplays?.();
    this.stopWatchingDisplays = null;
    if (this.pendingDisplaySyncTimer) {
      clearTimeout(this.pendingDisplaySyncTimer);
      this.pendingDisplaySyncTimer = null;
    }
    this.closeOverlayWindows();
    if (this.controlWindow && !this.controlWindow.isDestroyed()) {
      this.controlWindow.destroy();
    }
    this.controlWindow = null;
    this.server?.close();
    this.server = null;
    this.port = null;
  }

  isOpen(): boolean {
    return Boolean(this.controlWindow && !this.controlWindow.isDestroyed());
  }

  getSnapshot(): {
    controlWindowOpen: boolean;
    overlayDisplayIds: number[];
    state: WizardState | null;
  } {
    return {
      controlWindowOpen: Boolean(this.controlWindow && !this.controlWindow.isDestroyed()),
      overlayDisplayIds: [...this.overlayWindows.entries()]
        .filter(([, window]) => !window.isDestroyed())
        .map(([displayId]) => displayId)
        .sort((left, right) => left - right),
      state: this.state ? structuredClone(this.state) : null
    };
  }

  async navigateControlWindowToSection(section: "stations" | "provider" | "languages" | "diagnostics" | "license"): Promise<void> {
    const window = this.controlWindow;
    if (!window || window.isDestroyed()) {
      throw new Error("Setup wizard control window is not open.");
    }

    await waitForBrowserWindowReady(window);
    await window.webContents.executeJavaScript(`
      (() => {
        const button = document.querySelector('.section-link[data-section="${section}"]');
        if (!(button instanceof HTMLElement)) {
          throw new Error("Wizard section button not found: ${section}");
        }
        button.click();
        return true;
      })()
    `);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  async captureControlWindow(): Promise<Buffer | null> {
    const window = this.controlWindow;
    if (!window || window.isDestroyed()) {
      return null;
    }

    return captureBrowserWindowPng(window);
  }

  async captureOverlayWindow(displayId: number): Promise<Buffer | null> {
    const window = this.overlayWindows.get(displayId) ?? null;
    if (!window || window.isDestroyed()) {
      return null;
    }

    return captureBrowserWindowPng(window);
  }

  async inspectControlWindow(
    selectors: string[]
  ): Promise<Record<string, BrowserWindowSelectorInspection>> {
    const window = this.controlWindow;
    if (!window || window.isDestroyed()) {
      throw new Error("Setup wizard control window is not open.");
    }

    return inspectBrowserWindowSelectors(window, selectors);
  }

  async inspectOverlayWindow(
    displayId: number,
    selectors: string[]
  ): Promise<Record<string, BrowserWindowSelectorInspection>> {
    const window = this.overlayWindows.get(displayId) ?? null;
    if (!window || window.isDestroyed()) {
      throw new Error(`Setup wizard overlay window is not open for display ${displayId}.`);
    }

    return inspectBrowserWindowSelectors(window, selectors);
  }

  async clickControlWindow(selector: string): Promise<void> {
    const window = this.controlWindow;
    if (!window || window.isDestroyed()) {
      throw new Error("Setup wizard control window is not open.");
    }

    await clickBrowserWindowSelector(window, selector);
  }

  private async initializeInternal(): Promise<void> {
    configureWizardPermissions();
    this.refreshState();
    this.watchDisplays();
    this.registerIpcHandlers();
    await this.startServer();
  }

  private getStateOrThrow(): WizardState {
    if (!this.state) {
      throw new Error("Setup wizard state is not initialized.");
    }

    return this.decorateWizardState(this.state);
  }

  private decorateWizardState(state: WizardState): WizardState {
    const overlayDisplayIds = [...this.overlayWindows.entries()]
      .filter(([, window]) => !window.isDestroyed())
      .map(([displayId]) => displayId)
      .sort((left, right) => left - right);

    return {
      ...state,
      monitorSetupSessionActive: this.monitorSessionActive && overlayDisplayIds.length > 0,
      overlayDisplayIds
    };
  }

  private refreshState(): void {
    this.state = createInitialWizardRuntimeStateWithAutostart(
      this.options.runtimeRoot,
      this.getAutostartState()
    );
  }

  private refreshDisplayState(): void {
    if (!this.state) {
      this.refreshState();
      return;
    }

    const currentAssignments = new Map(this.state.displays.map((display) => [display.displayId, display.assignedSide] as const));
    this.state = {
      ...this.state,
      displays: collectDisplays().map((display) => ({
        ...display,
        assignedSide: currentAssignments.get(display.displayId) ?? null
      }))
    };
  }

  private watchDisplays(): void {
    const handleDisplayChange = () => {
      if (this.pendingDisplaySyncTimer) {
        clearTimeout(this.pendingDisplaySyncTimer);
      }

      this.pendingDisplaySyncTimer = setTimeout(() => {
        this.pendingDisplaySyncTimer = null;
        this.syncOpenWindowsToDisplayTopology();
      }, 300);
    };

    screen.on("display-added", handleDisplayChange);
    screen.on("display-removed", handleDisplayChange);
    screen.on("display-metrics-changed", handleDisplayChange);

    this.stopWatchingDisplays = () => {
      screen.removeListener("display-added", handleDisplayChange);
      screen.removeListener("display-removed", handleDisplayChange);
      screen.removeListener("display-metrics-changed", handleDisplayChange);
    };
  }

  private syncOpenWindowsToDisplayTopology(): void {
    this.refreshDisplayState();

    if (this.controlWindow && !this.controlWindow.isDestroyed()) {
      this.syncControlWindowToPrimaryDisplay();
    }

    if (this.monitorSessionActive) {
      this.createOverlayWindows();
    }

    if (this.controlWindow && !this.controlWindow.isDestroyed()) {
      this.broadcastState();
    }
  }

  private async startServer(): Promise<void> {
    if (this.server && this.port !== null) {
      return;
    }

    const WIZARD_CSP =
      "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; media-src 'self' data: blob: file:;";
    const server = createServer((request, response) => {
      const url = new URL(request.url || "/", "http://127.0.0.1");

      if (url.pathname === "/control") {
        const uiLanguage = normalizeSetupWizardUiLanguage(url.searchParams.get("uiLanguage"));
        response.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Security-Policy": WIZARD_CSP
        });
        response.end(getSetupWizardControlHtml(uiLanguage));
        return;
      }

      if (url.pathname === "/overlay") {
        const uiLanguage = normalizeSetupWizardUiLanguage(url.searchParams.get("uiLanguage"));
        response.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Security-Policy": WIZARD_CSP
        });
        response.end(getSetupWizardOverlayHtml(uiLanguage));
        return;
      }

      response.writeHead(404);
      response.end("Not found");
    });

    this.server = server;
    this.port = await new Promise<number>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          reject(new Error("Unable to bind setup wizard server."));
          return;
        }

        resolve(address.port);
      });
    });
  }

  private createOverlayWindows(options: { focusWindows?: boolean } = {}): void {
    const state = this.getStateOrThrow();
    const uiLanguage = resolveSetupWizardUiLanguage(state.envValues);
    const desiredDisplayIds = new Set(state.displays.map((display) => display.displayId));

    for (const display of state.displays) {
      const existing = this.overlayWindows.get(display.displayId);
      if (existing && !existing.isDestroyed()) {
        existing.setBounds(clampBoundsToVisibleArea(display.bounds));
        existing.setFullScreen(true);
        existing.show();
        if (options.focusWindows) {
          focusBrowserWindow(existing);
        }
        continue;
      }

      const window = new BrowserWindow({
        x: clampBoundsToVisibleArea(display.bounds).x,
        y: clampBoundsToVisibleArea(display.bounds).y,
        width: clampBoundsToVisibleArea(display.bounds).width,
        height: clampBoundsToVisibleArea(display.bounds).height,
        fullscreen: true,
        fullscreenable: false,
        frame: false,
        autoHideMenuBar: true,
        show: false,
        focusable: true,
        skipTaskbar: true,
        movable: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        backgroundColor: "#09111d",
        webPreferences: {
          preload: this.preloadPath,
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
          additionalArguments: ["--onlyspeech-wizard-role=overlay"]
        }
      });
      installWindowNavigationGuards(window);

      window.once("ready-to-show", () => {
        window.show();
        if (options.focusWindows) {
          focusBrowserWindow(window);
        }
      });
      window.on("closed", () => {
        this.overlayWindows.delete(display.displayId);
        if (this.monitorSessionActive && this.overlayWindows.size === 0) {
          this.monitorSessionActive = false;
          this.restoreControlWindow();
        }
        this.broadcastState();
      });
      void window.loadURL(`http://127.0.0.1:${this.port}/overlay?displayId=${display.displayId}&uiLanguage=${uiLanguage}`);
      this.overlayWindows.set(display.displayId, window);
    }

    for (const [displayId, window] of this.overlayWindows.entries()) {
      if (desiredDisplayIds.has(displayId)) {
        continue;
      }

      if (!window.isDestroyed()) {
        window.close();
      }
      this.overlayWindows.delete(displayId);
    }
  }

  private createControlWindow(): void {
    const currentState = this.getStateOrThrow();
    const uiLanguage = resolveSetupWizardUiLanguage(currentState.envValues);
    const primaryDisplay = screen.getPrimaryDisplay();
    const initialBounds = clampBoundsToVisibleArea(primaryDisplay.bounds);
    const window = new BrowserWindow({
      width: initialBounds.width,
      height: initialBounds.height,
      x: initialBounds.x,
      y: initialBounds.y,
      autoHideMenuBar: true,
      fullscreen: true,
      fullscreenable: false,
      show: false,
      backgroundColor: "#07111f",
      webPreferences: {
        preload: this.preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        additionalArguments: ["--onlyspeech-wizard-role=control"]
      }
    });
    installWindowNavigationGuards(window);

    window.once("ready-to-show", () => {
      this.syncControlWindowToPrimaryDisplay();
      window.show();
    });
    window.on("closed", () => {
      this.monitorSessionActive = false;
      this.closeOverlayWindows();
      this.controlWindow = null;
      this.options.onVisibilityChanged?.(false);
      const saved = this.savedDuringSession;
      const appliedDuringSession = this.appliedDuringSession;
      this.savedDuringSession = false;
      this.appliedDuringSession = false;
      this.options.onSessionClosed?.({ saved, appliedDuringSession });
    });
    this.controlWindow = window;
    this.options.onVisibilityChanged?.(true);
    void window.loadURL(`http://127.0.0.1:${this.port}/control?uiLanguage=${uiLanguage}`);
  }

  private getAutostartState(): WizardState["autostart"] {
    if (this.options.getAutostartState) {
      return this.options.getAutostartState();
    }

    return getWizardAutostartState({ isPackaged: app.isPackaged });
  }

  private syncControlWindowToPrimaryDisplay(): void {
    const window = this.controlWindow;
    if (!window || window.isDestroyed()) {
      return;
    }

    const bounds = clampBoundsToVisibleArea(screen.getPrimaryDisplay().bounds);
    window.setBounds(bounds);
    window.setFullScreen(true);
  }

  private restoreControlWindow(): void {
    if (!this.controlWindow || this.controlWindow.isDestroyed()) {
      return;
    }

    focusBrowserWindow(this.controlWindow);
  }

  private broadcastState(): void {
    const state = this.getStateOrThrow();

    if (this.controlWindow && !this.controlWindow.isDestroyed()) {
      this.controlWindow.webContents.send("wizard:state", state);
    }

    for (const window of this.overlayWindows.values()) {
      if (!window.isDestroyed()) {
        window.webContents.send("wizard:state", state);
      }
    }
  }

  private syncStoredMicrophoneAssignments(nextMicrophones: ProbeMicrophoneInfo[]): void {
    const state = this.getStateOrThrow();
    const runtimeProfile = getWizardRuntimeProfile(
      state.envValues.APP_MODE,
      state.envValues.MICROPHONE_PTT_MODE
    );

    if (!state.microphones.some((item) => item.assignedSides.includes("A"))) {
      const micAId = state.envValues.MIC_A_ID;
      const matchingMicrophoneA = micAId ? findMatchingPersistedMicrophone(nextMicrophones, micAId) : null;
      if (matchingMicrophoneA) {
        this.state = {
          ...state,
          microphones: assignMicrophone(state.microphones, "A", matchingMicrophoneA.deviceId, {
            appMode: runtimeProfile.appMode,
            microphonePttMode: runtimeProfile.microphonePttMode
          })
        };
      }
    }

    const updatedState = this.getStateOrThrow();
    if (!updatedState.microphones.some((item) => item.assignedSides.includes("B"))) {
      const micBId = updatedState.envValues.MIC_B_ID;
      const matchingMicrophoneB = micBId ? findMatchingPersistedMicrophone(nextMicrophones, micBId) : null;
      if (matchingMicrophoneB) {
        this.state = {
          ...updatedState,
          microphones: assignMicrophone(updatedState.microphones, "B", matchingMicrophoneB.deviceId, {
            appMode: runtimeProfile.appMode,
            microphonePttMode: runtimeProfile.microphonePttMode
          })
        };
      }
    }
  }

  private registerIpcHandlers(): void {
    if (this.ipcRegistered) {
      return;
    }

    this.ipcRegistered = true;

    const authorizeSender = (channel: string, event: IpcMainEvent | IpcMainInvokeEvent): void => {
      const controlAuthorized = this.controlWindow?.webContents === event.sender;
      const overlayAuthorized = overlayWizardChannels.has(channel) &&
        [...this.overlayWindows.values()].some((window) => window.webContents === event.sender);
      if (!controlAuthorized && !overlayAuthorized) {
        throw new Error(`Unauthorized setup wizard IPC sender for ${channel}.`);
      }
    };
    const registerHandle = (
      channel: string,
      listener: (event: IpcMainInvokeEvent, payload?: any) => unknown
    ): void => {
      ipcMain.handle(channel, (event, payload?: unknown, ...extra: unknown[]) => {
        authorizeSender(channel, event);
        if (extra.length > 0) {
          throw new Error(`Invalid ${channel} payload.`);
        }
        return listener(event, parseWizardPayload(channel, payload));
      });
    };
    const registerOn = (
      channel: string,
      listener: (event: IpcMainEvent, payload?: any) => void
    ): void => {
      ipcMain.on(channel, (event, payload?: unknown, ...extra: unknown[]) => {
        authorizeSender(channel, event);
        if (extra.length > 0) {
          throw new Error(`Invalid ${channel} payload.`);
        }
        listener(event, parseWizardPayload(channel, payload));
      });
    };

    registerHandle("wizard:get-state", async () => this.getStateOrThrow());
    registerHandle("wizard:get-azure-text-to-speech-catalog", async () => {
      return await getAzureTextToSpeechCatalogSnapshotFromEnvironment(this.getStateOrThrow().envValues);
    });
    registerHandle("wizard:open-monitor-setup", async () => {
      await this.openMonitorSetup();
      return this.getSnapshot();
    });
    registerHandle("wizard:assign-display", (_event, payload: { side: "A" | "B" | null; displayId: number }) => {
      const state = this.getStateOrThrow();

      if (!payload.side) {
        this.state = {
          ...state,
          displays: state.displays.map((display) =>
            display.displayId === payload.displayId ? { ...display, assignedSide: null } : display
          )
        };
      } else {
        this.state = {
          ...state,
          displays: assignDisplay(state.displays, payload.side, payload.displayId)
        };
      }

      this.broadcastState();
      return this.getStateOrThrow();
    });

    registerHandle("wizard:assign-microphone", (_event, payload: { side: "A" | "B"; deviceId: string | null }) => {
      const state = this.getStateOrThrow();
      this.state = {
        ...state,
        microphones: assignMicrophone(state.microphones, payload.side, payload.deviceId, {
          appMode: state.envValues.APP_MODE,
          microphonePttMode: state.envValues.MICROPHONE_PTT_MODE
        })
      };
      this.broadcastState();
      return this.getStateOrThrow();
    });

    registerHandle(
      "wizard:update-microphones",
      (
        _event,
        payload: {
          microphones: ProbeMicrophoneInfo[];
          microphonePermissionGranted: boolean;
          microphoneError: string | null;
        }
      ) => {
        const state = this.getStateOrThrow();
        const merged = mergeMicrophoneProbe(state.microphones, {
          microphones: filterSelectableMicrophones(payload.microphones),
          microphonePermissionGranted: payload.microphonePermissionGranted,
          microphoneError: payload.microphoneError
        });

        this.state = {
          ...state,
          microphones: merged.microphones,
          microphonePermissionGranted: merged.microphonePermissionGranted,
          microphoneError: merged.microphoneError
        };
        this.syncStoredMicrophoneAssignments(merged.microphones);
        this.broadcastState();
        return this.getStateOrThrow();
      }
    );

    registerHandle("wizard:update-signal-level", (_event, payload: { side: "A" | "B"; level: number }) => {
      const state = this.getStateOrThrow();
      this.state = {
        ...state,
        signalLevels: {
          ...state.signalLevels,
          [payload.side]: payload.level
        }
      };
      this.broadcastState();
      return this.getStateOrThrow();
    });

    registerHandle("wizard:update-env-values", (_event, values: Partial<Record<EnvKey, string>>) => {
      const state = this.getStateOrThrow();
      const nextEnvValues = createDefaultEnvValues({
        ...state.envValues,
        ...values
      });
      const runtimeProfile = getWizardRuntimeProfile(
        nextEnvValues.APP_MODE,
        nextEnvValues.MICROPHONE_PTT_MODE
      );
      nextEnvValues.APP_MODE = runtimeProfile.appMode;
      nextEnvValues.MICROPHONE_PTT_MODE = runtimeProfile.microphonePttMode;
      nextEnvValues.REQUIRED_MICROPHONES = String(runtimeProfile.requiredMicrophones);
      let microphones = state.microphones;
      if (runtimeProfile.microphonePttMode === "single-shared") {
        const sharedMicrophone =
          state.microphones.find((item) => item.assignedSides.includes("A")) ??
          state.microphones.find((item) => item.assignedSides.includes("B")) ??
          null;
        microphones = sharedMicrophone
          ? assignMicrophone(state.microphones, "A", sharedMicrophone.deviceId, {
              appMode: runtimeProfile.appMode,
              microphonePttMode: runtimeProfile.microphonePttMode
            })
          : state.microphones.map((microphone) => ({
              ...microphone,
              assignedSides: microphone.assignedSides.filter(
                (assignedSide) => assignedSide === "A" || assignedSide === "B"
              )
            }));
      }
      this.state = {
        ...state,
        envValues: nextEnvValues,
        microphones
      };
      this.broadcastState();
      return this.getStateOrThrow();
    });

    registerHandle("wizard:update-autostart", (_event, payload: { selectedEnabled: boolean }) => {
      const state = this.getStateOrThrow();
      if (!state.autostart.supported || !state.autostart.canModify) {
        return state;
      }

      const nextAutostart = this.options.applyAutostartSelection
        ? this.options.applyAutostartSelection(Boolean(payload.selectedEnabled))
        : applyWizardAutostartSelection({
            enabled: Boolean(payload.selectedEnabled),
            executablePath: process.execPath
          });

      this.state = {
        ...state,
        autostart: nextAutostart
      };
      this.broadcastState();
      return this.getStateOrThrow();
    });

    registerHandle("wizard:preview-env", () =>
      buildWizardEnv(this.getStateOrThrow(), {
        secureSecretStorage: usesSecureRuntimeSecretStorage()
      })
    );
    registerHandle("wizard:open-logs-folder", async () => {
      const logsPath = getRuntimeLogsDirectory();
      mkdirSync(logsPath, { recursive: true });
      const openError = await shell.openPath(logsPath);
      if (openError) {
        throw new Error(openError);
      }

      return { path: logsPath };
    });
    registerHandle(
      "wizard:test-provider-translation",
      async (
        _event,
        payload: {
          provider: TranslationProvider;
          sourceLanguage: string;
          targetLanguage: string;
          text: string;
        }
      ) => {
        const config = createRuntimeConfigFromWizardEnv(this.getStateOrThrow().envValues);
        const service = new TranslationProviderService({
          ...config,
          translationProvider: payload.provider
        });

        const result = await service.smokeTestTranslationProvider({
          provider: payload.provider,
          sourceLanguage: payload.sourceLanguage,
          targetLanguage: payload.targetLanguage,
          text: payload.text
        });

        return {
          provider: payload.provider,
          mode: result.mode,
          output: result.output
        };
      }
    );
    registerHandle(
      "wizard:normalize-provider-playback-text",
      async (
        _event,
        payload: {
          provider: TranslationProvider;
          targetLanguage: string;
          text: string;
        }
      ) => {
        const config = createRuntimeConfigFromWizardEnv(this.getStateOrThrow().envValues);
        const service = new TranslationProviderService({
          ...config,
          translationProvider: payload.provider
        });

        return await service.normalizeTextForPlayback({
          provider: payload.provider,
          targetLanguage: payload.targetLanguage,
          text: payload.text
        });
      }
    );
    registerHandle(
      "wizard:test-provider-speech",
      async (
        _event,
        payload: {
          provider: TranslationProvider;
          sourceLanguage: string;
          targetLanguage: string;
          audioBase64: string;
          audioMimeType: string;
        }
      ): Promise<SpeechTurnResult> => {
        const config = createRuntimeConfigFromWizardEnv(this.getStateOrThrow().envValues);
        const service = new TranslationProviderService({
          ...config,
          translationProvider: payload.provider
        });

        return service.processSpeechTurn({
          provider: payload.provider,
          sourceLanguage: payload.sourceLanguage,
          targetLanguage: payload.targetLanguage,
          audioBase64: payload.audioBase64,
          audioMimeType: payload.audioMimeType
        });
      }
    );
    registerHandle("wizard:save-env", async (_event, payload?: { wizardPassword?: string }) => {
      const state = this.getStateOrThrow();
      validateWizardDefaultTargetLanguages(state.envValues);
      const envPath = getRuntimeEnvFilePath(this.options.runtimeRoot);
      const preview = buildWizardEnv(state, {
        secureSecretStorage: usesSecureRuntimeSecretStorage()
      });
      const parsedPreview = parseEnv(preview) as Partial<Record<EnvKey, string>>;

      const persistedAutostart = state.autostart;

      const secretPersistence = persistRuntimeSecrets(state.envValues, {
        runtimeRoot: this.options.runtimeRoot,
        secretsFilePath: getRuntimeSecretsFilePath(app.getPath("userData")),
        secureStorageEnabled: usesSecureRuntimeSecretStorage(),
        safeStorageAdapter: this.options.runtimeSecretStorageAdapter
      });

      if (payload?.wizardPassword) {
        this.options.setPassword?.(payload.wizardPassword);
      }

      writeFileSync(envPath, preview, "utf8");

      this.savedDuringSession = true;
      await this.options.onEnvSaved?.();
      this.appliedDuringSession = true;
      this.state = applyWizardSelectionsFromEnv(
        {
          ...state,
          autostart: persistedAutostart,
          lastSavedEnvPath: envPath,
          lastSavedPreview: preview
        },
        mergeSecureRuntimeSecretsForWizardState(parsedPreview, state.envValues)
      );
      this.broadcastState();
      return {
        envPath,
        preview,
        secretStorageMode: usesSecureRuntimeSecretStorage() ? "windows-secure-store" : "dotenv",
        storedSecretKeys: secretPersistence.storedKeys,
        autostartEnabled: persistedAutostart.selectedEnabled,
        autostartSupported: persistedAutostart.supported,
        temporaryWizardPassword: null,
        mustChangeWizardPassword: false
      };
    });

    registerHandle("wizard:get-license-state", (): WizardLicenseInfo | null => {
      const persistedState = this.options.getLicenseState?.();
      if (!persistedState) {
        return null;
      }

      return computeWizardLicenseInfo(persistedState);
    });

    registerHandle(
      "wizard:submit-new-license",
      (_event, payload: { email: string; activationCode: string }): { ok: true } | { ok: false; message: string } => {
        const submission = prepareActivationSubmission({
          email: payload.email,
          activationToken: payload.activationCode
        });

        if (!submission.ok) {
          return {
            ok: false,
            message: getSetupWizardLicenseFailureMessage(submission.reason)
          };
        }

        this.options.updateLicense?.(submission.activationState);
        return { ok: true };
      }
    );

    registerHandle("wizard:clear-license", (): { ok: true } => {
      this.options.clearLicense?.();
      return { ok: true };
    });

    registerHandle("wizard:get-trial-availability", (): TrialAvailabilityState => {
      return this.options.getTrialAvailability?.() ?? {
        eligible: true,
        exhaustedAt: null
      };
    });

    registerHandle("wizard:submit-trial", async (): Promise<{ ok: true } | { ok: false; message: string }> => {
      if (!this.options.submitTrial) {
        return { ok: false, message: "Trial activation is unavailable." };
      }

      const result = await this.options.submitTrial();
      if (result.ok) {
        return { ok: true };
      }

      return { ok: false, message: result.message };
    });

    registerHandle("wizard:terminate-application", async (): Promise<{ ok: true }> => {
      await this.options.terminateApplication?.();
      return { ok: true };
    });

    registerOn("wizard:close", () => {
      this.close();
    });

    registerOn("wizard:close-monitor-setup", () => {
      this.closeMonitorSetup();
    });

    registerOn("wizard:close-current-overlay", (event) => {
      const currentWindow = BrowserWindow.fromWebContents(event.sender);
      this.closeCurrentOverlay(currentWindow);
    });
  }
}
