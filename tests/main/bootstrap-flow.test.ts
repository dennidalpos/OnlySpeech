import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersistedActivationState } from "../../src/main/activation-storage.js";
import type { ActivationStateEvaluationResult } from "../../src/main/activation-state.js";
import type { ActivationValidationResult } from "../../src/main/activation-validator.js";

const originalArgv = [...process.argv];

const bootstrapMocks = vi.hoisted(() => {
  let readyResolver: (() => void) | null = null;

  const whenReady = vi.fn(() => new Promise<void>((resolve) => {
    readyResolver = resolve;
  }));
  const resolveWhenReady = () => {
    readyResolver?.();
  };

  const appOn = vi.fn();
  const exit = vi.fn();
  const quit = vi.fn();
  const createActivationWindow = vi.fn(() => ({
    isDestroyed: vi.fn(() => false),
    isMinimized: vi.fn(() => false),
    restore: vi.fn(),
    focus: vi.fn(),
    close: vi.fn()
  }));
  const isTestAutomationEnabled = vi.fn(() => false);
  const registerIpcHandlers = vi.fn();
  const loadRuntimeConfig = vi.fn(() => ({ appMode: "kiosk" }));
  const hasRuntimeEnvFile = vi.fn(() => false);
  const resolveAppProfilePaths = vi.fn(() => ({
    userDataPath: "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech",
    sessionDataPath: "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech\\session-data"
  }));
  const resolveRuntimeRoot = vi.fn(() => "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech");
  const getActivationStateFilePath = vi.fn((userDataPath: string) => `${userDataPath}\\config\\activation-state.json`);
  const getRuntimeSecretsFilePath = vi.fn((userDataPath: string) => `${userDataPath}\\config\\runtime-secrets.json`);
  const getSetupWizardAccessFilePath = vi.fn((userDataPath: string) => `${userDataPath}\\config\\setup-wizard-access.json`);
  const loadPersistedActivationState = vi.fn((): PersistedActivationState | null => ({
    schemaVersion: 1 as const,
    activationToken: "OS1.payload.signature",
    claims: {
      keyId: "ks1",
      email: "buyer@example.com",
      plan: "annual" as const,
      issuedAt: "2026-04-07T10:30:00.000Z",
      expiresAt: "2027-04-07T10:30:00.000Z"
    },
    activatedAt: "2026-04-07T10:35:00.000Z",
    lastValidatedAt: "2026-04-07T10:35:00.000Z",
    lastTrustedUtc: "2026-04-07T10:35:00.000Z"
  }));
  const createPersistedActivationState = vi.fn((state: unknown) => ({
    schemaVersion: 1,
    activationToken: (state as { activationToken?: string }).activationToken ?? "OS1.payload.signature",
    claims: (state as { claims?: unknown }).claims,
    activatedAt: (state as { activatedAt?: string }).activatedAt ?? "2026-04-07T10:35:00.000Z",
    lastValidatedAt: (state as { activatedAt?: string }).activatedAt ?? "2026-04-07T10:35:00.000Z",
    lastTrustedUtc: (state as { activatedAt?: string }).activatedAt ?? "2026-04-07T10:35:00.000Z"
  }));
  const validateActivationCode = vi.fn((): ActivationValidationResult => ({
    ok: true,
    canonicalEmail: "buyer@example.com",
    claims: {
      schemaVersion: 1 as const,
      keyId: "ks1",
      email: "buyer@example.com",
      plan: "annual" as const,
      issuedAt: "2026-04-07T10:30:00.000Z",
      expiresAt: "2027-04-07T10:30:00.000Z"
    }
  }));
  const persistActivationState = vi.fn((_filePath: string, state: unknown) => state);
  const clearPersistedActivationState = vi.fn();
  const readTrialTombstone = vi.fn(() => null as string | null);
  const writeTrialTombstone = vi.fn();
  const evaluatePersistedActivationState = vi.fn(({ state }: { state: PersistedActivationState }): ActivationStateEvaluationResult => ({
    ok: true,
    effectiveUtc: "2026-04-07T10:35:00.000Z",
    updatedState: state,
    shouldPersist: false
  }));
  const accessManagerInstances: Array<{
    ensureInitialized: ReturnType<typeof vi.fn>;
    getAccessState: ReturnType<typeof vi.fn>;
    getProvisioningNotice: ReturnType<typeof vi.fn>;
    authorize: ReturnType<typeof vi.fn>;
  }> = [];
  class MockSetupWizardAccessManager {
    readonly ensureInitialized = vi.fn();

    readonly getAccessState = vi.fn(({ runtimeEnvPresent }: { runtimeEnvPresent: boolean }) => ({
      requiresPassword: runtimeEnvPresent,
      mustChangePassword: runtimeEnvPresent,
      temporaryPassword: runtimeEnvPresent ? "TEMP-PASS-01" : null
    }));

    readonly getProvisioningNotice = vi.fn(() => ({
      temporaryPassword: "TEMP-PASS-01",
      mustChangePassword: true
    }));

    readonly authorize = vi.fn(() => ({ ok: true as const }));

    constructor(public readonly accessFilePath: string) {
      accessManagerInstances.push(this);
    }
  }

  const kioskInstances: Array<{
    config: unknown;
    initialize: ReturnType<typeof vi.fn>;
    shutdown: ReturnType<typeof vi.fn>;
    setDemoPaused: ReturnType<typeof vi.fn>;
  }> = [];
  class MockKioskManager {
    readonly initialize = vi.fn();

    readonly shutdown = vi.fn();

    readonly setDemoPaused = vi.fn();

    constructor(public readonly config: unknown) {
      kioskInstances.push(this);
    }
  }

  const translationServiceInstances: Array<{ config: unknown }> = [];
  class MockTranslationProviderService {
    constructor(public readonly config: unknown) {
      translationServiceInstances.push(this);
    }
  }

  const wizardInstances: Array<{
    options: {
      runtimeRoot: string;
      onEnvSaved?: () => void;
      onSessionClosed?: (event: { saved: boolean; appliedDuringSession: boolean }) => void;
      onVisibilityChanged?: (visible: boolean) => void;
    };
    ensureReady: ReturnType<typeof vi.fn>;
    open: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
  }> = [];
  class MockSetupWizardManager {
    readonly ensureReady = vi.fn(async () => undefined);

    readonly open = vi.fn(async () => undefined);

    readonly close = vi.fn();

    readonly dispose = vi.fn();

    constructor(
      public readonly options: {
        runtimeRoot: string;
        onEnvSaved?: () => void;
        onSessionClosed?: (event: { saved: boolean; appliedDuringSession: boolean }) => void;
        onVisibilityChanged?: (visible: boolean) => void;
      }
    ) {
      wizardInstances.push(this);
    }
  }

  const testAutomationServerInstances: Array<{
    ensureStarted: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
  }> = [];
  class MockTestAutomationServer {
    readonly ensureStarted = vi.fn(async () => undefined);

    readonly dispose = vi.fn();

    constructor(public readonly _bindings: unknown) {
      testAutomationServerInstances.push(this);
    }
  }

  const reset = () => {
    readyResolver = null;
    whenReady.mockClear();
    appOn.mockClear();
    exit.mockClear();
    quit.mockClear();
    createActivationWindow.mockClear();
    isTestAutomationEnabled.mockReset();
    isTestAutomationEnabled.mockReturnValue(false);
    registerIpcHandlers.mockClear();
    loadRuntimeConfig.mockClear();
    hasRuntimeEnvFile.mockReset();
    hasRuntimeEnvFile.mockReturnValue(false);
    resolveAppProfilePaths.mockClear();
    resolveRuntimeRoot.mockClear();
    getActivationStateFilePath.mockClear();
    getRuntimeSecretsFilePath.mockClear();
    getSetupWizardAccessFilePath.mockClear();
    loadPersistedActivationState.mockReset();
    loadPersistedActivationState.mockReturnValue({
      schemaVersion: 1,
      activationToken: "OS1.payload.signature",
      claims: {
        keyId: "ks1",
        email: "buyer@example.com",
        plan: "annual",
        issuedAt: "2026-04-07T10:30:00.000Z",
        expiresAt: "2027-04-07T10:30:00.000Z"
      },
      activatedAt: "2026-04-07T10:35:00.000Z",
      lastValidatedAt: "2026-04-07T10:35:00.000Z",
      lastTrustedUtc: "2026-04-07T10:35:00.000Z"
    });
    persistActivationState.mockClear();
    clearPersistedActivationState.mockClear();
    readTrialTombstone.mockReset();
    readTrialTombstone.mockReturnValue(null);
    writeTrialTombstone.mockClear();
    createPersistedActivationState.mockClear();
    evaluatePersistedActivationState.mockReset();
    evaluatePersistedActivationState.mockImplementation(({ state }: { state: PersistedActivationState }) => ({
      ok: true,
      effectiveUtc: "2026-04-07T10:35:00.000Z",
      updatedState: state,
      shouldPersist: false
    }));
    validateActivationCode.mockReset();
    validateActivationCode.mockReturnValue({
      ok: true,
      canonicalEmail: "buyer@example.com",
      claims: {
        schemaVersion: 1,
        keyId: "ks1",
        email: "buyer@example.com",
        plan: "annual",
        issuedAt: "2026-04-07T10:30:00.000Z",
        expiresAt: "2027-04-07T10:30:00.000Z"
      }
    });
    kioskInstances.splice(0);
    translationServiceInstances.splice(0);
    wizardInstances.splice(0);
    accessManagerInstances.splice(0);
    testAutomationServerInstances.splice(0);
  };

  return {
    whenReady,
    resolveWhenReady,
    appOn,
    exit,
    quit,
    createActivationWindow,
    isTestAutomationEnabled,
    registerIpcHandlers,
    loadRuntimeConfig,
    hasRuntimeEnvFile,
    resolveAppProfilePaths,
    resolveRuntimeRoot,
    getActivationStateFilePath,
    getRuntimeSecretsFilePath,
    getSetupWizardAccessFilePath,
    loadPersistedActivationState,
    createPersistedActivationState,
    persistActivationState,
    clearPersistedActivationState,
    evaluatePersistedActivationState,
    validateActivationCode,
    readTrialTombstone,
    writeTrialTombstone,
    accessManagerInstances,
    kioskInstances,
    translationServiceInstances,
    wizardInstances,
    MockSetupWizardAccessManager,
    MockKioskManager,
    MockTranslationProviderService,
    MockSetupWizardManager,
    MockTestAutomationServer,
    testAutomationServerInstances,
    reset
  };
});

vi.mock("electron", () => ({
  app: {
    whenReady: bootstrapMocks.whenReady,
    on: bootstrapMocks.appOn,
    setName: vi.fn(),
    setPath: vi.fn(),
    isPackaged: true,
    exit: bootstrapMocks.exit,
    quit: bootstrapMocks.quit
  },
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => false),
    encryptString: vi.fn((value: string) => Buffer.from(value)),
    decryptString: vi.fn((value: Buffer) => value.toString())
  }
}));

vi.mock("../../src/shared/config.js", () => ({
  loadRuntimeConfig: bootstrapMocks.loadRuntimeConfig
}));

vi.mock("../../src/main/ipc.js", () => ({
  registerIpcHandlers: bootstrapMocks.registerIpcHandlers
}));

vi.mock("../../src/main/activation-window.js", () => ({
  createActivationWindow: bootstrapMocks.createActivationWindow
}));

vi.mock("../../src/main/test-automation.js", () => ({
  isTestAutomationEnabled: bootstrapMocks.isTestAutomationEnabled,
  TestAutomationServer: bootstrapMocks.MockTestAutomationServer
}));

vi.mock("../../src/main/kiosk-manager.js", () => ({
  KioskManager: bootstrapMocks.MockKioskManager
}));

vi.mock("../../src/services/speech/translation-provider-service.js", () => ({
  TranslationProviderService: bootstrapMocks.MockTranslationProviderService
}));

vi.mock("../../src/main/setup-wizard-manager.js", () => ({
  hasRuntimeEnvFile: bootstrapMocks.hasRuntimeEnvFile,
  SetupWizardManager: bootstrapMocks.MockSetupWizardManager
}));

vi.mock("../../src/main/runtime-paths.js", () => ({
  resolveAppProfilePaths: bootstrapMocks.resolveAppProfilePaths,
  resolveRuntimeRoot: bootstrapMocks.resolveRuntimeRoot,
  getActivationStateFilePath: bootstrapMocks.getActivationStateFilePath,
  getRuntimeSecretsFilePath: bootstrapMocks.getRuntimeSecretsFilePath,
  getSetupWizardAccessFilePath: bootstrapMocks.getSetupWizardAccessFilePath
}));

vi.mock("../../src/main/setup-wizard-access.js", () => ({
  SetupWizardAccessManager: bootstrapMocks.MockSetupWizardAccessManager
}));

vi.mock("../../src/main/activation-storage.js", () => ({
  createPersistedActivationState: bootstrapMocks.createPersistedActivationState,
  loadPersistedActivationState: bootstrapMocks.loadPersistedActivationState,
  persistActivationState: bootstrapMocks.persistActivationState,
  clearPersistedActivationState: bootstrapMocks.clearPersistedActivationState
}));

vi.mock("../../src/main/activation-state.js", () => ({
  evaluatePersistedActivationState: bootstrapMocks.evaluatePersistedActivationState
}));

vi.mock("../../src/main/activation-validator.js", () => ({
  validateActivationCode: bootstrapMocks.validateActivationCode
}));

vi.mock("../../src/main/trial-tombstone.js", () => ({
  readTrialTombstone: bootstrapMocks.readTrialTombstone,
  writeTrialTombstone: bootstrapMocks.writeTrialTombstone
}));

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

async function importBootstrap(): Promise<void> {
  await import("../../src/main/bootstrap.js");
}

function enablePackagedTestAutomation(override?: string): void {
  bootstrapMocks.isTestAutomationEnabled.mockReturnValue(true);
  if (override) {
    process.env.ONLYSPEECH_TEST_TRIAL_EXHAUSTED_AT = override;
    return;
  }

  delete process.env.ONLYSPEECH_TEST_TRIAL_EXHAUSTED_AT;
}

describe("bootstrap integrated setup wizard flow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    bootstrapMocks.reset();
    process.argv = [...originalArgv];
    delete process.env.ONLYSPEECH_SETUP_WIZARD_SECTION;
    delete process.env.ONLYSPEECH_TEST_TRIAL_EXHAUSTED_AT;
  });

  afterEach(() => {
    process.argv = [...originalArgv];
    vi.clearAllTimers();
    vi.useRealTimers();
    delete process.env.ONLYSPEECH_SETUP_WIZARD_SECTION;
    delete process.env.ONLYSPEECH_TEST_TRIAL_EXHAUSTED_AT;
  });

  it("preserves documented setup wizard section arguments during bootstrap", async () => {
    process.argv = ["electron", ".", "--setup-wizard", "--wizard-section", "diagnostics"];

    await importBootstrap();

    expect(process.env.ONLYSPEECH_SETUP_WIZARD_SECTION).toBe("diagnostics");
  });

  it("ignores unsupported setup wizard sections", async () => {
    process.argv = ["electron", ".", "--setup-wizard", "--wizard-section=monitors"];

    await importBootstrap();

    expect(process.env.ONLYSPEECH_SETUP_WIZARD_SECTION).toBe("stations");
  });

  it("opens the setup wizard automatically when .env is missing", async () => {
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(false);

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    expect(bootstrapMocks.wizardInstances).toHaveLength(1);
    expect(bootstrapMocks.accessManagerInstances).toHaveLength(1);
    expect(bootstrapMocks.accessManagerInstances[0]?.ensureInitialized).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.wizardInstances[0]?.ensureReady).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.wizardInstances[0]?.open).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.kioskInstances).toHaveLength(0);
    expect(bootstrapMocks.translationServiceInstances).toHaveLength(0);
  });

  it("opens the activation window before wizard and kiosk when no activation state is present", async () => {
    bootstrapMocks.loadPersistedActivationState.mockReturnValue(null);
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(false);

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    expect(bootstrapMocks.createActivationWindow).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.registerIpcHandlers).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.wizardInstances[0]?.ensureReady).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.wizardInstances[0]?.open).not.toHaveBeenCalled();
    expect(bootstrapMocks.kioskInstances).toHaveLength(0);
  });

  it("opens the activation window in trial-exhausted state when the profile is missing but the tombstone exists", async () => {
    bootstrapMocks.loadPersistedActivationState.mockReturnValue(null);
    bootstrapMocks.readTrialTombstone.mockReturnValue("2026-04-08T12:00:00.000Z");
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(false);

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    const bindings = bootstrapMocks.registerIpcHandlers.mock.calls[0]?.[0] as
      | { getActivationGateState: () => Promise<unknown> | unknown }
      | undefined;

    expect(bootstrapMocks.createActivationWindow).toHaveBeenCalledTimes(1);
    await expect(Promise.resolve(bindings?.getActivationGateState())).resolves.toEqual({
      status: "trial-exhausted",
      message: "The trial has already been used on this device. Purchase a license to continue."
    });
  });

  it("ignores the real tombstone during packaged test automation when no override is set", async () => {
    enablePackagedTestAutomation();
    bootstrapMocks.loadPersistedActivationState.mockReturnValue(null);
    bootstrapMocks.readTrialTombstone.mockReturnValue("2026-04-08T12:00:00.000Z");
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(false);

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    const bindings = bootstrapMocks.registerIpcHandlers.mock.calls[0]?.[0] as
      | { getActivationGateState: () => Promise<unknown> | unknown }
      | undefined;

    expect(bootstrapMocks.createActivationWindow).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.readTrialTombstone).not.toHaveBeenCalled();
    await expect(Promise.resolve(bindings?.getActivationGateState())).resolves.toEqual({
      status: "required",
      message: "Activation is required before startup can continue."
    });
  });

  it("uses the packaged test automation override to force trial exhaustion without reading the real tombstone", async () => {
    enablePackagedTestAutomation("2026-04-08T12:00:00.000Z");
    bootstrapMocks.loadPersistedActivationState.mockReturnValue(null);
    bootstrapMocks.readTrialTombstone.mockReturnValue(null);
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(false);

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    const bindings = bootstrapMocks.registerIpcHandlers.mock.calls[0]?.[0] as
      | { getActivationGateState: () => Promise<unknown> | unknown }
      | undefined;

    expect(bootstrapMocks.createActivationWindow).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.readTrialTombstone).not.toHaveBeenCalled();
    await expect(Promise.resolve(bindings?.getActivationGateState())).resolves.toEqual({
      status: "trial-exhausted",
      message: "The trial has already been used on this device. Purchase a license to continue."
    });
  });

  it("exposes the shutdown capability in packaged operator mode", async () => {
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(true);

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    const bindings = bootstrapMocks.registerIpcHandlers.mock.calls[0]?.[0] as
      | { canShutdownComputer: () => boolean }
      | undefined;

    expect(bindings?.canShutdownComputer()).toBe(true);
  });

  it("does not start the kiosk when the first-run wizard closes without saving", async () => {
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(false);

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    bootstrapMocks.wizardInstances[0]?.options.onSessionClosed?.({ saved: false, appliedDuringSession: false });

    expect(bootstrapMocks.kioskInstances).toHaveLength(0);
    expect(bootstrapMocks.translationServiceInstances).toHaveLength(0);
  });

  it("starts the kiosk after a first-run wizard session is saved", async () => {
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(false);

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    bootstrapMocks.wizardInstances[0]?.options.onSessionClosed?.({ saved: true, appliedDuringSession: false });

    expect(bootstrapMocks.loadRuntimeConfig).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.kioskInstances).toHaveLength(1);
    expect(bootstrapMocks.kioskInstances[0]?.initialize).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.kioskInstances[0]?.setDemoPaused).toHaveBeenCalledWith(false);
    expect(bootstrapMocks.translationServiceInstances).toHaveLength(1);
  });

  it("resolves the packaged default runtime root from LocalAppData userData", async () => {
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(false);

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();
    bootstrapMocks.wizardInstances[0]?.options.onSessionClosed?.({ saved: true, appliedDuringSession: false });

    expect(bootstrapMocks.resolveAppProfilePaths).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.resolveRuntimeRoot).toHaveBeenCalledWith({
      packagedDefaultRoot: "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech"
    });
    expect(bootstrapMocks.getActivationStateFilePath).toHaveBeenCalledWith(
      "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech"
    );
    expect(bootstrapMocks.getRuntimeSecretsFilePath).toHaveBeenCalledWith(
      "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech"
    );
    expect(bootstrapMocks.getSetupWizardAccessFilePath).toHaveBeenCalledWith(
      "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech"
    );
    expect(bootstrapMocks.wizardInstances[0]?.options.runtimeRoot).toBe(
      "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech"
    );
  });

  it("persists the revalidated activation record before continuing packaged startup", async () => {
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(false);
    bootstrapMocks.evaluatePersistedActivationState.mockImplementation(({ state }: { state: PersistedActivationState }) => ({
      ok: true,
      effectiveUtc: "2026-04-08T07:00:00.000Z",
      updatedState: {
        ...state,
        lastValidatedAt: "2026-04-08T07:00:00.000Z",
        lastTrustedUtc: "2026-04-08T07:00:00.000Z"
      },
      shouldPersist: true
    }));

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    expect(bootstrapMocks.persistActivationState).toHaveBeenCalledWith(
      "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech\\config\\activation-state.json",
      expect.objectContaining({
        lastValidatedAt: "2026-04-08T07:00:00.000Z",
        lastTrustedUtc: "2026-04-08T07:00:00.000Z"
      }),
      expect.anything()
    );
    expect(bootstrapMocks.wizardInstances[0]?.open).toHaveBeenCalledTimes(1);
  });

  it("submits activation through the registered bindings, persists the unlock state, and continues startup", async () => {
    bootstrapMocks.loadPersistedActivationState.mockReturnValue(null);
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(false);
    bootstrapMocks.evaluatePersistedActivationState.mockImplementation(({ state }: { state: PersistedActivationState }) => ({
      ok: true,
      effectiveUtc: "2026-04-07T10:35:00.000Z",
      updatedState: {
        ...state,
        lastValidatedAt: "2026-04-07T10:35:00.000Z",
        lastTrustedUtc: "2026-04-07T10:35:00.000Z"
      },
      shouldPersist: false
    }));

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    const bindings = bootstrapMocks.registerIpcHandlers.mock.calls[0]?.[0] as
      | { submitActivation: (request: { email: string; activationCode: string }) => Promise<unknown> }
      | undefined;

    await expect(
      bindings?.submitActivation({
        email: "buyer@example.com",
        activationCode: "OS1.payload.signature"
      })
    ).resolves.toEqual({
      ok: true,
      status: "success",
      message: "Activation successful."
    });

    expect(bootstrapMocks.validateActivationCode).toHaveBeenCalledWith({
      email: "buyer@example.com",
      activationToken: "OS1.payload.signature"
    });
    expect(bootstrapMocks.createPersistedActivationState).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.persistActivationState).toHaveBeenCalledWith(
      "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech\\config\\activation-state.json",
      expect.objectContaining({
        lastValidatedAt: "2026-04-07T10:35:00.000Z",
        lastTrustedUtc: "2026-04-07T10:35:00.000Z"
      }),
      expect.anything()
    );
    expect(bootstrapMocks.wizardInstances[0]?.open).toHaveBeenCalledTimes(1);
  });

  it("submits the packaged trial through the canonical activation binding and writes the tombstone", async () => {
    bootstrapMocks.loadPersistedActivationState.mockReturnValue(null);
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(false);

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    const bindings = bootstrapMocks.registerIpcHandlers.mock.calls[0]?.[0] as
      | { submitTrial: () => Promise<unknown> }
      | undefined;

    await expect(bindings?.submitTrial()).resolves.toEqual({
      ok: true,
      status: "success",
      message: "Trial activation successful."
    });

    expect(bootstrapMocks.createPersistedActivationState).toHaveBeenCalledWith(
      expect.objectContaining({
        activationToken: null,
        claims: expect.objectContaining({
          plan: "trial"
        })
      })
    );
    expect(bootstrapMocks.writeTrialTombstone).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.persistActivationState).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.wizardInstances[0]?.open).toHaveBeenCalledTimes(1);
  });

  it("rejects packaged trial activation when tombstone persistence fails and rolls back the local activation file", async () => {
    bootstrapMocks.loadPersistedActivationState.mockReturnValue(null);
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(false);
    bootstrapMocks.writeTrialTombstone.mockImplementation(() => {
      throw new Error("registry unavailable");
    });

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    const bindings = bootstrapMocks.registerIpcHandlers.mock.calls[0]?.[0] as
      | {
          submitTrial: () => Promise<unknown>;
          getActivationGateState: () => Promise<unknown> | unknown;
        }
      | undefined;

    await expect(bindings?.submitTrial()).resolves.toEqual({
      ok: false,
      status: "invalid-state",
      message: "Stored activation data could not be read."
    });

    expect(bootstrapMocks.persistActivationState).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.clearPersistedActivationState).toHaveBeenCalledWith(
      "C:\\Users\\Installer\\AppData\\Local\\OnlySpeech\\config\\activation-state.json"
    );
    expect(bootstrapMocks.wizardInstances[0]?.open).not.toHaveBeenCalled();
    await expect(Promise.resolve(bindings?.getActivationGateState())).resolves.toEqual({
      status: "invalid-state",
      message: "Stored activation data could not be read."
    });
  });

  it("returns to the activation window when persisted activation revalidation fails with an invalid code", async () => {
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(true);
    bootstrapMocks.validateActivationCode.mockReturnValue({
      ok: false,
      code: "invalid-code",
      message: "Activation code is invalid."
    });

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    expect(bootstrapMocks.createActivationWindow).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.kioskInstances).toHaveLength(0);
  });

  it("returns to the activation window when persisted activation is expired at packaged startup", async () => {
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(true);
    bootstrapMocks.evaluatePersistedActivationState.mockReturnValue({
      ok: false,
      code: "expired",
      message: "Persisted activation is expired.",
      effectiveUtc: "2026-04-08T07:00:00.000Z",
      updatedState: bootstrapMocks.loadPersistedActivationState() as PersistedActivationState,
      shouldPersist: false
    });

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    expect(bootstrapMocks.createActivationWindow).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.kioskInstances).toHaveLength(0);
  });

  it("returns to the activation window when persisted activation hits clock rollback at packaged startup", async () => {
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(true);
    bootstrapMocks.evaluatePersistedActivationState.mockReturnValue({
      ok: false,
      code: "clock-rollback",
      message: "Local clock rollback exceeds the offline activation tolerance.",
      effectiveUtc: null,
      updatedState: bootstrapMocks.loadPersistedActivationState() as PersistedActivationState,
      shouldPersist: false
    });

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    expect(bootstrapMocks.createActivationWindow).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.kioskInstances).toHaveLength(0);
  });

  it("returns to the activation gate when the persisted activation disappears after packaged startup", async () => {
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(true);
    bootstrapMocks.loadPersistedActivationState
      .mockReturnValueOnce({
        schemaVersion: 1,
        activationToken: "OS1.payload.signature",
        claims: {
          keyId: "ks1",
          email: "buyer@example.com",
          plan: "annual",
          issuedAt: "2026-04-07T10:30:00.000Z",
          expiresAt: "2027-04-07T10:30:00.000Z"
        },
        activatedAt: "2026-04-07T10:35:00.000Z",
        lastValidatedAt: "2026-04-07T10:35:00.000Z",
        lastTrustedUtc: "2026-04-07T10:35:00.000Z"
      })
      .mockReturnValueOnce(null);

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    expect(bootstrapMocks.kioskInstances).toHaveLength(1);
    expect(bootstrapMocks.createActivationWindow).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(60_000);
    await flushAsyncWork();

    expect(bootstrapMocks.createActivationWindow).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.kioskInstances[0]?.shutdown).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.wizardInstances[0]?.open).not.toHaveBeenCalled();
  });

  it("reopens the setup wizard from the registered runtime bindings", async () => {
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(true);

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    const bindings = bootstrapMocks.registerIpcHandlers.mock.calls[0]?.[0] as
      | { openSetupWizard: () => Promise<void> }
      | undefined;

    expect(bindings).toBeDefined();

    await bindings?.openSetupWizard();

    expect(bootstrapMocks.wizardInstances[0]?.open).toHaveBeenCalledTimes(1);
  });

  it("applies wizard changes immediately when the env is saved", async () => {
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(true);

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    expect(bootstrapMocks.kioskInstances).toHaveLength(1);

    bootstrapMocks.wizardInstances[0]?.options.onEnvSaved?.();

    expect(bootstrapMocks.kioskInstances).toHaveLength(2);
    expect(bootstrapMocks.kioskInstances[0]?.shutdown).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.kioskInstances[1]?.initialize).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.kioskInstances[1]?.setDemoPaused).toHaveBeenCalledWith(false);
    expect(bootstrapMocks.translationServiceInstances).toHaveLength(2);
  });

  it("does not restart the kiosk again when the already-applied wizard session closes", async () => {
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(true);

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    bootstrapMocks.wizardInstances[0]?.options.onEnvSaved?.();

    expect(bootstrapMocks.kioskInstances).toHaveLength(2);

    bootstrapMocks.wizardInstances[0]?.options.onSessionClosed?.({ saved: true, appliedDuringSession: true });

    expect(bootstrapMocks.kioskInstances).toHaveLength(2);
    expect(bootstrapMocks.kioskInstances[1]?.shutdown).not.toHaveBeenCalled();
  });

  it("keeps the demo runtime paused until the wizard session is closed", async () => {
    bootstrapMocks.hasRuntimeEnvFile.mockReturnValue(true);

    await importBootstrap();
    bootstrapMocks.resolveWhenReady();
    await flushAsyncWork();

    bootstrapMocks.wizardInstances[0]?.options.onVisibilityChanged?.(true);
    expect(bootstrapMocks.kioskInstances[0]?.setDemoPaused).toHaveBeenLastCalledWith(true);

    bootstrapMocks.wizardInstances[0]?.options.onEnvSaved?.();

    expect(bootstrapMocks.kioskInstances).toHaveLength(2);
    expect(bootstrapMocks.kioskInstances[1]?.setDemoPaused).toHaveBeenCalledWith(true);

    bootstrapMocks.wizardInstances[0]?.options.onVisibilityChanged?.(false);
    expect(bootstrapMocks.kioskInstances[1]?.setDemoPaused).toHaveBeenLastCalledWith(false);
  });
});
