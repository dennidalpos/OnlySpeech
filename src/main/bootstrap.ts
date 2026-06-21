import { execFile } from "node:child_process";
import { app, dialog, safeStorage, type BrowserWindow } from "electron";
import { loadRuntimeConfig } from "../shared/config.js";
import { registerIpcHandlers } from "./ipc.js";
import { KioskManager } from "./kiosk-manager.js";
import { isTestAutomationEnabled, TestAutomationServer } from "./test-automation.js";
import { TranslationProviderService } from "../services/speech/translation-provider-service.js";
import { SetupWizardManager, hasRuntimeEnvFile } from "./setup-wizard-manager.js";
import {
  getActivationStateFilePath,
  getRuntimeSecretsFilePath,
  getSetupWizardAccessFilePath,
  resolveAppProfilePaths,
  resolveRuntimeRoot
} from "./runtime-paths.js";
import { isSecureRuntimeSecretStorageEnabled, loadRuntimeEnvironment } from "./runtime-secrets.js";
import { ENV_KEY_ORDER } from "../tools/env-probe-output.js";
import { SetupWizardAccessManager } from "./setup-wizard-access.js";
import {
  type ActivationStorageEncryptionAdapter,
  clearPersistedActivationState,
  createPersistedActivationState,
  loadPersistedActivationState,
  persistActivationState
} from "./activation-storage.js";
import { evaluatePersistedActivationState } from "./activation-state.js";
import { createActivationWindow } from "./activation-window.js";
import { readTrialTombstone, writeTrialTombstone } from "./trial-tombstone.js";
import type {
  ActivationGateState,
  ActivationSubmissionResult,
  TrialAvailabilityState
} from "../shared/types.js";
import { reportRuntimeDiagnostic } from "../shared/runtime-diagnostics.js";
import {
  formatPackagedRuntimePrerequisiteFailure,
  getPackagedRuntimePrerequisites
} from "./runtime-prerequisites.js";
import {
  createActivationGateState,
  inspectPersistedActivationForRuntime,
  mapActivationFailureReasonToStatus,
  prepareActivationSubmission
} from "./activation-flow.js";

const appProfilePaths = resolveAppProfilePaths();
const runtimeRoot = resolveRuntimeRoot({ packagedDefaultRoot: appProfilePaths.userDataPath });
const ACTIVATION_RUNTIME_REVALIDATION_INTERVAL_MS = 60 * 1000;

if (typeof app.setName === "function") {
  app.setName("OnlySpeech");
}
if (typeof app.setPath === "function") {
  app.setPath("userData", appProfilePaths.userDataPath);
  app.setPath("sessionData", appProfilePaths.sessionDataPath);
}

let kioskManager: KioskManager | null = null;
let translationProviderService: TranslationProviderService | null = null;
let activationWindow: BrowserWindow | null = null;
let isQuitting = false;
let isSetupWizardOpen = false;
let isActivationGateActive = false;
let hasCompletedStartupAfterActivation = false;
let activationRuntimeRevalidationTimer: NodeJS.Timeout | null = null;
let activationGateState: ActivationGateState = createActivationGateState("required");
const setupWizardAccessManager = new SetupWizardAccessManager(
  getSetupWizardAccessFilePath(appProfilePaths.userDataPath)
);
const activationStateFilePath = getActivationStateFilePath(appProfilePaths.userDataPath);

function getActivationStorageAdapter(): ActivationStorageEncryptionAdapter | undefined {
  if (!isSecureRuntimeSecretStorageEnabled({ isPackaged: app.isPackaged })) {
    return undefined;
  }

  return safeStorage as ActivationStorageEncryptionAdapter;
}

type SetupWizardSection = "stations" | "provider" | "languages" | "diagnostics" | "license";

function normalizeWizardSection(value: string | undefined): SetupWizardSection | null {
  switch (value) {
    case "stations":
    case "provider":
    case "languages":
    case "diagnostics":
    case "license":
      return value;
    default:
      return null;
  }
}

function parseBootOptions(args = process.argv.slice(1)): {
  forceSetupWizard: boolean;
  wizardSection: SetupWizardSection;
} {
  let forceSetupWizard = false;
  let wizardSection: SetupWizardSection = "stations";

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--setup-wizard") {
      forceSetupWizard = true;
      continue;
    }

    if (argument === "--wizard-section") {
      const nextSection = normalizeWizardSection(args[index + 1]);
      if (nextSection) {
        wizardSection = nextSection;
        index += 1;
      }
      continue;
    }

    if (argument.startsWith("--wizard-section=")) {
      const nextSection = normalizeWizardSection(argument.slice("--wizard-section=".length));
      if (nextSection) {
        wizardSection = nextSection;
      }
    }
  }

  return { forceSetupWizard, wizardSection };
}

const bootOptions = parseBootOptions();
process.env.ONLYSPEECH_SETUP_WIZARD_SECTION = bootOptions.wizardSection;

function loadRuntimeEnv(): void {
  const runtimeEnv = loadRuntimeEnvironment({
    runtimeRoot,
    secretsFilePath: getRuntimeSecretsFilePath(appProfilePaths.userDataPath),
    secureStorageEnabled: isSecureRuntimeSecretStorageEnabled({
      isPackaged: app.isPackaged
    })
  });

  for (const key of ENV_KEY_ORDER) {
    const value = runtimeEnv[key];
    if (value === undefined) {
      delete process.env[key];
      continue;
    }

    process.env[key] = value;
  }
}

function stopKiosk(): void {
  kioskManager?.shutdown();
  kioskManager = null;
  translationProviderService = null;
}

function startKiosk(): void {
  loadRuntimeEnv();
  stopKiosk();
  const config = loadRuntimeConfig();
  kioskManager = new KioskManager(config);
  translationProviderService = new TranslationProviderService(config);
  kioskManager.initialize();
  kioskManager.setDemoPaused(isSetupWizardOpen);
}

function inspectPackagedActivationState():
  | { ok: true }
  | { ok: false; status: ActivationGateState["status"] } {
  try {
    const persistedActivationState = loadPersistedActivationState(activationStateFilePath, getActivationStorageAdapter());
    if (!persistedActivationState) {
      if (readTrialTombstoneForRuntime() !== null) {
        return { ok: false, status: "trial-exhausted" };
      }
      return {
        ok: false,
        status: "required"
      };
    }

    const inspection = inspectPersistedActivationForRuntime(persistedActivationState);
    if (inspection.shouldPersist) {
      persistActivationState(
        activationStateFilePath,
        inspection.updatedState,
        getActivationStorageAdapter()
      );
    }

    if (!inspection.ok) {
      return {
        ok: false,
        status: inspection.status
      };
    }

    return { ok: true };
  } catch (error) {
    reportRuntimeDiagnostic("error", "OnlySpeech activation gate failed during packaged startup.", error);
    return {
      ok: false,
      status: "invalid-state"
    };
  }
}

function evaluatePackagedActivationGate(): boolean {
  if (!app.isPackaged) {
    return true;
  }

  const inspection = inspectPackagedActivationState();
  if (!inspection.ok) {
    activationGateState = createActivationGateState(inspection.status);
    return false;
  }

  return true;
}

function getTrialAvailabilityState(): TrialAvailabilityState {
  const exhaustedAt = readTrialTombstoneForRuntime();

  return {
    eligible: exhaustedAt === null,
    exhaustedAt
  };
}

async function submitTrialActivation(): Promise<ActivationSubmissionResult> {
  try {
    const trialAvailability = getTrialAvailabilityState();
    if (!trialAvailability.eligible) {
      activationGateState = createActivationGateState("trial-exhausted");
      return {
        ok: false,
        status: "trial-exhausted",
        message: activationGateState.message
      } satisfies ActivationSubmissionResult;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days

    const persistedActivationState = createPersistedActivationState({
      activationToken: null,
      claims: {
        keyId: "trial",
        email: "trial@onlyspeech.local",
        plan: "trial",
        issuedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString()
      },
      activatedAt: now.toISOString()
    });

    const evaluation = evaluatePersistedActivationState({
      state: persistedActivationState
    });

    if (!evaluation.ok) {
      const failureStatus = mapActivationFailureReasonToStatus(evaluation.code);
      activationGateState = createActivationGateState(failureStatus);
      return {
        ok: false,
        status: failureStatus,
        message: activationGateState.message
      } satisfies ActivationSubmissionResult;
    }

    persistActivationState(activationStateFilePath, evaluation.updatedState, getActivationStorageAdapter());

    try {
      writeTrialTombstone(now.toISOString());
    } catch (error) {
      clearPersistedActivationState(activationStateFilePath);
      throw error;
    }

    activationGateState = createActivationGateState("required");
    activationWindow?.close();
    await continueStartupAfterActivation();

    return {
      ok: true,
      status: "success",
      message: "Trial activation successful."
    } satisfies ActivationSubmissionResult;
  } catch (error) {
    reportRuntimeDiagnostic("error", "Trial activation failed.", error);
    activationGateState = createActivationGateState("invalid-state");
    return {
      ok: false,
      status: "invalid-state",
      message: activationGateState.message
    } satisfies ActivationSubmissionResult;
  }
}

function readTrialTombstoneForRuntime(): string | null {
  if (isTestAutomationEnabled({ isPackaged: app.isPackaged })) {
    return process.env.ONLYSPEECH_TEST_TRIAL_EXHAUSTED_AT?.trim() || null;
  }

  return readTrialTombstone();
}

async function continueStartupAfterActivation(): Promise<void> {
  hasCompletedStartupAfterActivation = true;
  isActivationGateActive = false;
  startActivationRuntimeRevalidation();

  if (hasRuntimeEnvFile(runtimeRoot) && !bootOptions.forceSetupWizard) {
    startKiosk();
    return;
  }

  await setupWizardManager.open();
}

function openActivationGateWindow(): void {
  isActivationGateActive = true;

  if (activationWindow && !activationWindow.isDestroyed()) {
    if (activationWindow.isMinimized()) {
      activationWindow.restore();
    }
    activationWindow.focus();
    return;
  }

  activationWindow = createActivationWindow({
    devServerUrl: process.env.VITE_DEV_SERVER_URL,
    onClosed: () => {
      activationWindow = null;
      if (!isQuitting && !hasCompletedStartupAfterActivation) {
        app.quit();
      }
    }
  });
}

function stopActivationRuntimeRevalidation(): void {
  if (activationRuntimeRevalidationTimer) {
    clearInterval(activationRuntimeRevalidationTimer);
    activationRuntimeRevalidationTimer = null;
  }
}

function startActivationRuntimeRevalidation(): void {
  stopActivationRuntimeRevalidation();

  if (!app.isPackaged) {
    return;
  }

  activationRuntimeRevalidationTimer = setInterval(() => {
    revalidatePackagedActivationStateAtRuntime();
  }, ACTIVATION_RUNTIME_REVALIDATION_INTERVAL_MS);
}

function transitionToActivationGate(status: ActivationGateState["status"]): void {
  activationGateState = createActivationGateState(status);
  isActivationGateActive = true;
  stopActivationRuntimeRevalidation();
  openActivationGateWindow();
  setupWizardManager.close();
  stopKiosk();
}

function revalidatePackagedActivationStateAtRuntime(): boolean {
  if (
    !app.isPackaged ||
    isQuitting ||
    !hasCompletedStartupAfterActivation ||
    isActivationGateActive
  ) {
    return true;
  }

  const inspection = inspectPackagedActivationState();
  if (inspection.ok) {
    return true;
  }

  transitionToActivationGate(inspection.status);
  return false;
}

const setupWizardManager = new SetupWizardManager({
  runtimeRoot,
  getAccessNotice: () => setupWizardAccessManager.getProvisioningNotice(),
  onEnvSaved: () => {
    if (isQuitting || isActivationGateActive) {
      return;
    }

    startKiosk();
  },
  onSessionClosed: ({ saved, appliedDuringSession }) => {
    if (isQuitting || isActivationGateActive) {
      return;
    }

    if (!saved || appliedDuringSession) {
      return;
    }

    startKiosk();
  },
  onVisibilityChanged: (visible) => {
    isSetupWizardOpen = visible;
    kioskManager?.setDemoPaused(visible);
  },
  getLicenseState: () => loadPersistedActivationState(activationStateFilePath, getActivationStorageAdapter()),
  updateLicense: (newState) => { persistActivationState(activationStateFilePath, newState, getActivationStorageAdapter()); },
  clearLicense: () => { clearPersistedActivationState(activationStateFilePath); },
  getTrialAvailability: () => getTrialAvailabilityState(),
  submitTrial: () => submitTrialActivation(),
  terminateApplication: () => {
    isQuitting = true;
    app.quit();
  }
});
const testAutomationServer = isTestAutomationEnabled({ isPackaged: app.isPackaged })
  ? new TestAutomationServer({
      isPackaged: app.isPackaged,
      getKioskManager: () => kioskManager,
      getSetupWizardManager: () => setupWizardManager,
      openSetupWizard: () => setupWizardManager.open(),
      openSetupWizardMonitorSetup: () => setupWizardManager.openMonitorSetup(),
      closeSetupWizard: () => setupWizardManager.close(),
      navigateSetupWizardToSection: (section) => setupWizardManager.navigateControlWindowToSection(section),
      inspectSetupWizardControlWindow: (selectors) => setupWizardManager.inspectControlWindow(selectors),
      inspectSetupWizardOverlayWindow: (displayId, selectors) =>
        setupWizardManager.inspectOverlayWindow(displayId, selectors),
      clickSetupWizardControlWindow: (selector) => setupWizardManager.clickControlWindow(selector),
      captureKioskWindow: (side) => kioskManager?.captureWindow(side) ?? Promise.resolve(null),
      inspectKioskWindow: (side) => kioskManager?.inspectWindow(side) ?? Promise.resolve(null),
      captureSetupWizardControlWindow: () => setupWizardManager.captureControlWindow(),
      captureSetupWizardOverlayWindow: (displayId) => setupWizardManager.captureOverlayWindow(displayId)
    })
  : null;

function assertPackagedRuntimePrerequisites(): boolean {
  if (!app.isPackaged) {
    return true;
  }

  const message = formatPackagedRuntimePrerequisiteFailure(getPackagedRuntimePrerequisites());
  if (message === "") {
    return true;
  }

  reportRuntimeDiagnostic("error", message);
  dialog.showErrorBox("OnlySpeech prerequisite check failed", message);
  return false;
}

app.whenReady()
  .then(async () => {
    if (!assertPackagedRuntimePrerequisites()) {
      app.exit(1);
      return;
    }

    setupWizardAccessManager.ensureInitialized();

    registerIpcHandlers({
      getActivationGateState: () => activationGateState,
      submitActivation: async (request) => {
        const submission = prepareActivationSubmission({
          email: request.email,
          activationToken: request.activationCode
        });

        if (!submission.ok) {
          activationGateState = createActivationGateState(submission.status);
          return {
            ok: false,
            status: submission.status,
            message: activationGateState.message
          } satisfies ActivationSubmissionResult;
        }

        persistActivationState(
          activationStateFilePath,
          submission.activationState,
          getActivationStorageAdapter()
        );
        activationGateState = createActivationGateState("required");
        activationWindow?.close();
        await continueStartupAfterActivation();

        return {
          ok: true,
          status: "success",
          message: "Activation successful."
        } satisfies ActivationSubmissionResult;
      },
      submitTrial: async () => submitTrialActivation(),
      getKioskManager: () => kioskManager,
      getTranslationProviderService: () => translationProviderService,
      openSetupWizard: () => setupWizardManager.open(),
      setDemoPaused: (paused) => kioskManager?.setDemoPaused(paused),
      getSetupWizardAccessState: () =>
        setupWizardAccessManager.getAccessState({
          runtimeEnvPresent: hasRuntimeEnvFile(runtimeRoot)
        }),
      requestSetupWizardAccess: async (request) => {
        const result = setupWizardAccessManager.authorize(request);
        if (result.ok) {
          await setupWizardManager.open();
        }

        return result;
      },
      shutdownComputer: () =>
        new Promise<void>((resolve, reject) => {
          execFile("shutdown", ["/s", "/t", "0"], { windowsHide: true }, (error) => {
            if (error) {
              reject(new Error(`Shutdown command failed: ${error.message}`));
              return;
            }

            resolve();
          });
        }),
      canShutdownComputer: () => app.isPackaged
    });

    await setupWizardManager.ensureReady();
    await testAutomationServer?.ensureStarted();

    if (!evaluatePackagedActivationGate()) {
      openActivationGateWindow();
      return;
    }

    await continueStartupAfterActivation();
  })
  .catch((error) => {
    reportRuntimeDiagnostic("error", "OnlySpeech failed to initialize.", error);
    app.exit(1);
  });

app.on("before-quit", () => {
  isQuitting = true;
  stopActivationRuntimeRevalidation();
  if (activationWindow && !activationWindow.isDestroyed()) {
    activationWindow.close();
  }
  activationWindow = null;
  stopKiosk();
  testAutomationServer?.dispose();
  setupWizardManager.dispose();
});

app.on("window-all-closed", () => {
  if (isQuitting) {
    return;
  }

  if (isActivationGateActive) {
    app.quit();
    return;
  }

  if (hasRuntimeEnvFile(runtimeRoot)) {
    void setupWizardManager.open();
    return;
  }

  app.quit();
});
