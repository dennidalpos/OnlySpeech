// @vitest-environment jsdom

import { act } from "react";
import ReactDOM from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OperatorApp } from "../src/renderer/operator/app/OperatorApp.js";
import { buildInteractionLanguageChoices } from "../src/shared/language-flow.js";
import type { OnlySpeechRendererApi } from "../src/shared/onlyspeech-api.js";
import type {
  AppState,
  OperatorAction,
  RendererCommand,
  SetupWizardAccessRequest,
  SetupWizardAccessResult,
  SetupWizardAccessState,
  Side
} from "../src/shared/types.js";
import { getUiText } from "../src/shared/ui-localization.js";
import { getVisitorUiText } from "../src/shared/visitor-localization.js";
import {
  getVisitorTechnicalErrorText,
  localizeVisitorTechnicalIssue
} from "../src/shared/visitor-technical-localization.js";

const mocks = vi.hoisted(() => ({
  probeAudioInputDevices: vi.fn(async (side: Side) => ({
    side,
    devices: [],
    permissionGranted: true
  }))
}));

vi.mock("../src/services/audio/media-device-probe.js", () => ({
  probeAudioInputDevices: mocks.probeAudioInputDevices
}));

vi.mock("../src/services/speech/live-speech-client.js", () => ({
  LiveSpeechClient: class MockLiveSpeechClient {
    async start() {
      return undefined;
    }

    async finish() {
      return undefined;
    }

    async stop() {
      return undefined;
    }
  }
}));

function createAppState(): AppState {
  return {
    sessionId: "session-1",
    appMode: "kiosk",
    microphonePttMode: "dual-dedicated",
    translationProvider: "chatgpt",
    textToSpeechEnabled: true,
    activeSide: null,
    lastActivityAt: "2026-03-27T12:00:00.000Z",
    clearTriggeredAt: null,
    visitorConversationHistoryEnabled: false,
    conversationHistory: [],
    textToSpeech: {
      side: null,
      content: null,
      requestId: null,
      status: "idle",
      engine: null,
      language: null,
      voiceName: null,
      error: null
    },
    sides: {
      A: {
        side: "A",
        selectedInteractionLanguage: "en",
        normalizedTargetLanguage: "en",
        sourceLanguage: "it-IT",
        hasCommittedLanguageSelection: true,
        wizardDefaultUiLanguage: "en",
        requestedUiLanguage: "en",
        effectiveUiLanguage: "en",
        usesEnglishUiFallback: false,
        selectedTargetLanguage: "en",
        localTranscript: "",
        remoteTranslation: "",
        status: "ready",
        error: null,
        isActiveSpeaker: false
      },
      B: {
        side: "B",
        selectedInteractionLanguage: "it",
        normalizedTargetLanguage: "it",
        sourceLanguage: "it-IT",
        hasCommittedLanguageSelection: true,
        wizardDefaultUiLanguage: "en",
        requestedUiLanguage: "it",
        effectiveUiLanguage: "it",
        usesEnglishUiFallback: false,
        selectedTargetLanguage: "it",
        localTranscript: "",
        remoteTranslation: "",
        status: "ready",
        error: null,
        isActiveSpeaker: false
      }
    },
    health: {
      displaysReady: true,
      microphonesReady: true,
      speechReady: true,
      translationReady: true,
      blockingIssues: [],
      displayAssignments: [],
      microphoneAssignments: []
    }
  };
}

function cloneState(state: AppState): AppState {
  return structuredClone(state);
}

function dispatchClick(element: Element): Promise<void> {
  return act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await Promise.resolve();
  });
}

function findButtonByText(text: string): HTMLButtonElement {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const button = [...document.querySelectorAll("button")].find((candidate) =>
    candidate.textContent?.replace(/\s+/g, " ").includes(normalizedText)
  );

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Button not found for text '${text}'.`);
  }

  return button;
}

function findMacroAreaButton(label: string): HTMLButtonElement {
  const button = [...document.querySelectorAll("button.world-map-hotspot")].find((candidate) =>
    candidate.textContent?.replace(/\s+/g, " ").includes(label)
  );

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Macro-area button not found for label '${label}'.`);
  }

  return button;
}

function macroAreaLabel(regionCode: string, language: string): string {
  return new Intl.DisplayNames([language], { type: "region" }).of(regionCode) ?? regionCode;
}

function bodyText(): string {
  return document.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function latestAction(actions: OperatorAction[]): OperatorAction | undefined {
  return actions.at(-1);
}

function setNavigatorLanguage(language: string): void {
  Object.defineProperty(window.navigator, "language", {
    configurable: true,
    value: language
  });
}

function findSelectedLanguageTile(): HTMLButtonElement {
  const button = querySelectedLanguageTile();

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error("Selected language tile not found.");
  }

  return button;
}

function querySelectedLanguageTile(): HTMLButtonElement | null {
  const button = document.querySelector(".visitor-language-tile.selected");
  return button instanceof HTMLButtonElement ? button : null;
}

function panelHistoryText(index: number): string {
  const panel = document.querySelectorAll(".text-panel-history")[index];
  if (!(panel instanceof HTMLDivElement)) {
    throw new Error(`History panel ${index} not found.`);
  }

  return panel.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function getDialogPasswordInputs(): HTMLInputElement[] {
  return [...document.querySelectorAll(".setup-access-field input")].filter(
    (element): element is HTMLInputElement => element instanceof HTMLInputElement
  );
}

function getDialogSubmitButton(): HTMLButtonElement {
  const button = document.querySelector(".dialog-card .primary-button");
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error("Setup access submit button not found.");
  }

  return button;
}

function findButtonByAriaLabel(label: string): HTMLButtonElement {
  const button = document.querySelector(`button[aria-label="${label}"]`);
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Button not found for aria-label '${label}'.`);
  }

  return button;
}

function getPttButton(): HTMLButtonElement {
  const button = document.querySelector(".ptt-button");
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error("PTT button not found.");
  }

  return button;
}

function speakerButtons(): HTMLButtonElement[] {
  return [...document.querySelectorAll(".speaker-button")].filter(
    (element): element is HTMLButtonElement => element instanceof HTMLButtonElement
  );
}

async function dispatchKeyboard(element: Element, type: "keydown" | "keyup", code: string): Promise<void> {
  await act(async () => {
    element.dispatchEvent(
      new KeyboardEvent(type, {
        bubbles: true,
        cancelable: true,
        code,
        key: code === "Space" ? " " : "Enter"
      })
    );
    await Promise.resolve();
  });
}

async function dispatchInput(element: HTMLInputElement, value: string): Promise<void> {
  const eventCtor = element.ownerDocument.defaultView?.Event ?? Event;
  const valueSetter = Object.getOwnPropertyDescriptor(
    element.ownerDocument.defaultView?.HTMLInputElement.prototype ?? HTMLInputElement.prototype,
    "value"
  )?.set;

  await act(async () => {
    valueSetter?.call(element, value);
    element.dispatchEvent(new eventCtor("input", { bubbles: true }));
    element.dispatchEvent(new eventCtor("change", { bubbles: true }));
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  });
}

interface OnlySpeechHarness {
  actions: OperatorAction[];
  emitState: (state: AppState) => Promise<void>;
  openSetupWizardCalls: number;
  requestCalls: SetupWizardAccessRequest[];
  api: OnlySpeechRendererApi;
}

function createOnlySpeechHarness(options?: {
  accessResult?: SetupWizardAccessResult;
  accessState?: SetupWizardAccessState;
  shutdownCapability?: boolean;
  shutdownResult?: { ok: true } | { ok: false; message: string };
}): OnlySpeechHarness {
  const actions: OperatorAction[] = [];
  const requestCalls: SetupWizardAccessRequest[] = [];
  let openSetupWizardCalls = 0;
  const stateListeners = new Set<(state: AppState) => void>();
  const commandListeners = new Set<(command: RendererCommand) => void>();

  return {
    actions,
    get openSetupWizardCalls() {
      return openSetupWizardCalls;
    },
    requestCalls,
    api: {
      sendOperatorAction: (action: OperatorAction) => {
        actions.push(action);
      },
      openSetupWizard: () => {
        openSetupWizardCalls += 1;
      },
      setDemoPaused: vi.fn(async () => undefined),
      getSetupWizardAccessState: vi.fn(async () => options?.accessState ?? ({
        requiresPassword: false,
        mustChangePassword: false,
        temporaryPassword: null
      })),
      requestSetupWizardAccess: vi.fn(async (request) => {
        requestCalls.push(request);
        return options?.accessResult ?? { ok: true as const };
      }),
      getShutdownCapability: vi.fn(async () => options?.shutdownCapability ?? false),
      sendDeviceProbe: vi.fn(),
      sendSpeechEvent: vi.fn(),
      processSpeechTurn: vi.fn(async () => ({
        transcript: "",
        translation: ""
      })),
      synthesizeTextToSpeech: vi.fn(async () => ({
        ok: false as const,
        engine: "openai" as const,
        eventType: "unavailable" as const,
        message: "not used in this test"
      })),
      requestTextToSpeech: vi.fn(),
      stopTextToSpeech: vi.fn(),
      sendTextToSpeechEvent: vi.fn(),
      shutdownComputer: vi.fn(async () => options?.shutdownResult ?? ({ ok: true as const })),
      onState: (listener: (state: AppState) => void) => {
        stateListeners.add(listener);
        return () => {
          stateListeners.delete(listener);
        };
      },
      onCommand: (listener: (command: RendererCommand) => void) => {
        commandListeners.add(listener);
        return () => {
          commandListeners.delete(listener);
        };
      }
    },
    emitState: async (state) => {
      const nextState = cloneState(state);
      await act(async () => {
        for (const listener of stateListeners) {
          listener(nextState);
        }
        await Promise.resolve();
      });
    }
  };
}

let container: HTMLDivElement | null = null;
let root: ReactDOM.Root | null = null;

async function renderOperatorApp(side: Side, state: AppState) {
  const harness = createOnlySpeechHarness();
  window.onlySpeech = harness.api;
  window.history.replaceState({}, "", `/?side=${side}`);

  container = document.createElement("div");
  container.id = "root";
  document.body.innerHTML = "";
  document.body.appendChild(container);
  root = ReactDOM.createRoot(container);

  await act(async () => {
    root?.render(<OperatorApp />);
    await Promise.resolve();
  });

  await harness.emitState(state);

  return harness;
}

beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  setNavigatorLanguage("en-US");
  Object.defineProperty(window.navigator, "mediaDevices", {
    configurable: true,
    value: {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
  });
});

afterEach(async () => {
  await act(async () => {
    root?.unmount();
    await Promise.resolve();
  });

  root = null;
  container?.remove();
  container = null;
  document.body.innerHTML = "";
  delete (window as Partial<Window>).onlySpeech;
  mocks.probeAudioInputDevices.mockClear();
});

describe("operator app mounted UI smoke coverage", () => {
  it("drives Station A through the mounted language selector flow", async () => {
    const harness = await renderOperatorApp("A", createAppState());
    const arabic = buildInteractionLanguageChoices().find((choice) => choice.value === "ar");
    const operatorLabels = getUiText("en");

    expect(arabic).toBeDefined();
    harness.actions.length = 0;

    await dispatchClick(findButtonByText("Change language"));
    expect(bodyText()).toContain(operatorLabels.selectInteractionLanguageTitle);

    await dispatchClick(findMacroAreaButton("Middle East"));
    await dispatchClick(findButtonByText(arabic!.nativeLabel));

    expect(latestAction(harness.actions)).toEqual({
      type: "select-target-language",
      side: "A",
      targetLanguage: "ar"
    });
  });

  it("keeps Station A on the selector until the language is explicitly confirmed after boot or reset", async () => {
    const appState = createAppState();
    const harness = await renderOperatorApp("A", appState);
    const operatorLabels = getUiText("en");

    appState.sides.A.hasCommittedLanguageSelection = false;
    await harness.emitState(appState);

    expect(bodyText()).toContain(operatorLabels.selectInteractionLanguageTitle);
    expect(bodyText()).not.toContain(operatorLabels.changeLanguage);
  });

  it("localizes the Station A selector with the operator-specific wizard default UI language", async () => {
    const appState = createAppState();
    appState.sides.A.hasCommittedLanguageSelection = false;
    appState.sides.A.wizardDefaultUiLanguage = "fr";
    const harness = await renderOperatorApp("A", appState);
    const frenchLabels = getUiText("fr");

    await harness.emitState(appState);

    expect(bodyText()).toContain(frenchLabels.selectInteractionLanguageTitle);
    expect(bodyText()).toContain("Avis d'utilisation assistee par IA");
    expect(querySelectedLanguageTile()).toBeNull();
    expect(document.querySelector(".world-map-hotspot.active")?.textContent).toContain("Europe");
  });

  it("updates the operator AI notice to the language currently selected in the selector", async () => {
    const appState = createAppState();
    appState.sides.A.hasCommittedLanguageSelection = false;
    const harness = await renderOperatorApp("A", appState);

    await harness.emitState(appState);

    expect(bodyText()).toContain("AI-assisted use notice");
    await dispatchClick(findMacroAreaButton(macroAreaLabel("150", "en")));
    await dispatchClick(findButtonByText("italiano"));

    expect(bodyText()).toContain("Avviso uso assistito da AI");
    expect(bodyText()).not.toContain("AI-assisted use notice");
  });

  it("commits Station B visitor selection and returns to the selector on change-language", async () => {
    const appState = createAppState();
    appState.sides.B.hasCommittedLanguageSelection = false;
    const harness = await renderOperatorApp("B", appState);
    const sessionLabels = getVisitorUiText(appState.sides.B.effectiveUiLanguage);
    const selectorLabels = getVisitorUiText(appState.sides.B.wizardDefaultUiLanguage ?? "en");
    const italian = buildInteractionLanguageChoices().find((choice) => choice.value === "it");

    expect(italian).toBeDefined();
    harness.actions.length = 0;

    expect(bodyText()).toContain(selectorLabels.selectLanguageTitle);
    await dispatchClick(findButtonByText(italian!.nativeLabel));

    expect(latestAction(harness.actions)).toEqual({
      type: "select-target-language",
      side: "B",
      targetLanguage: "it"
    });

    appState.sides.B.hasCommittedLanguageSelection = true;
    await harness.emitState(appState);

    expect(bodyText()).toContain(sessionLabels.changeLanguage);

    await dispatchClick(findButtonByText(sessionLabels.changeLanguage));

    expect(bodyText()).toContain(selectorLabels.selectLanguageTitle);
    expect(findButtonByText(italian!.nativeLabel)).toBeDefined();
  });

  it("updates the visitor AI notice to the language currently selected in the selector", async () => {
    const appState = createAppState();
    appState.sides.B.hasCommittedLanguageSelection = false;
    const harness = await renderOperatorApp("B", appState);

    await harness.emitState(appState);

    expect(bodyText()).toContain("Avviso uso assistito da AI");
    await dispatchClick(findButtonByText("Deutsch"));

    expect(bodyText()).toContain("Hinweis zur KI-unterstutzten Nutzung");
    expect(bodyText()).not.toContain("Avviso uso assistito da AI");
  });

  it("keeps Station B in the localized session view after a language-change session restart", async () => {
    const appState = createAppState();
    const harness = await renderOperatorApp("B", appState);
    const initialLabels = getVisitorUiText(appState.sides.B.effectiveUiLanguage);
    const nextLabels = getVisitorUiText("fr");
    const french = buildInteractionLanguageChoices().find((choice) => choice.value === "fr");

    expect(french).toBeDefined();

    await dispatchClick(findButtonByText(initialLabels.changeLanguage));
    await dispatchClick(findButtonByText(french!.nativeLabel));

    expect(latestAction(harness.actions)).toEqual({
      type: "select-target-language",
      side: "B",
      targetLanguage: "fr"
    });

    appState.sessionId = "session-2";
    appState.sessionResetReason = "language-change";
    appState.sessionResetSide = "B";
    appState.sides.B.selectedInteractionLanguage = "fr";
    appState.sides.B.normalizedTargetLanguage = "fr";
    appState.sides.B.selectedTargetLanguage = "fr";
    appState.sides.B.sourceLanguage = "fr-FR";
    appState.sides.B.requestedUiLanguage = "fr";
    appState.sides.B.effectiveUiLanguage = "fr";
    appState.sides.B.hasCommittedLanguageSelection = true;

    await harness.emitState(appState);

    expect(bodyText()).toContain(nextLabels.changeLanguage);
    expect(bodyText()).not.toContain(nextLabels.selectLanguageTitle);
  });

  it("keeps the visitor session manual when runtime metadata changes", async () => {
    const appState = createAppState();
    appState.sides.B.hasCommittedLanguageSelection = false;
    const harness = await renderOperatorApp("B", appState);
    const visitorLabels = getVisitorUiText(appState.sides.B.effectiveUiLanguage);

    await dispatchClick(findSelectedLanguageTile());
    appState.sides.B.hasCommittedLanguageSelection = true;
    await harness.emitState(appState);
    harness.actions.length = 0;

    appState.sides.B.sourceLanguage = "es-ES";

    await harness.emitState(appState);

    expect(bodyText()).toContain(visitorLabels.changeLanguage);
    expect(harness.actions).toEqual([]);
  });

  it("returns Station B to the wizard default language after a hard reset and localizes the selector accordingly", async () => {
    const appState = createAppState();
    appState.sides.B.hasCommittedLanguageSelection = false;
    const marathi = buildInteractionLanguageChoices("chatgpt", { includeProviderExpansions: true }).find(
      (choice) => choice.value === "mr"
    );
    const nepali = buildInteractionLanguageChoices("chatgpt", { includeProviderExpansions: true }).find(
      (choice) => choice.value === "ne"
    );

    expect(marathi).toBeDefined();
    expect(nepali).toBeDefined();

    appState.sides.B.selectedInteractionLanguage = "mr";
    appState.sides.B.normalizedTargetLanguage = "mr";
    appState.sides.B.selectedTargetLanguage = "mr";
    appState.sides.B.sourceLanguage = "mr-IN";
    appState.sides.B.requestedUiLanguage = "mr";
    appState.sides.B.effectiveUiLanguage = "mr";

    const harness = await renderOperatorApp("B", appState);
    const marathiLabels = getVisitorUiText("mr");
    const nepaliLabels = getVisitorUiText("ne");
    const selectorLabels = getVisitorUiText(appState.sides.B.wizardDefaultUiLanguage ?? "en");

    expect(bodyText()).toContain(selectorLabels.selectLanguageTitle);
    expect(findSelectedLanguageTile().textContent).toContain(marathi!.nativeLabel);

    await dispatchClick(findSelectedLanguageTile());
    appState.sides.B.hasCommittedLanguageSelection = true;
    await harness.emitState(appState);
    await dispatchClick(findButtonByText(marathiLabels.changeLanguage));
    await dispatchClick(findMacroAreaButton("South Asia"));
    await dispatchClick(findButtonByText(nepali!.nativeLabel));

    expect(latestAction(harness.actions)).toEqual({
      type: "select-target-language",
      side: "B",
      targetLanguage: "ne"
    });

    appState.sessionId = "session-2";
    appState.sessionResetReason = "language-change";
    appState.sessionResetSide = "B";
    appState.sides.B.selectedInteractionLanguage = "ne";
    appState.sides.B.normalizedTargetLanguage = "ne";
    appState.sides.B.selectedTargetLanguage = "ne";
    appState.sides.B.sourceLanguage = "ne-NP";
    appState.sides.B.requestedUiLanguage = "ne";
    appState.sides.B.effectiveUiLanguage = "ne";
    appState.sides.B.hasCommittedLanguageSelection = true;

    await harness.emitState(appState);

    expect(bodyText()).toContain(nepaliLabels.changeLanguage);
    await dispatchClick(findButtonByText(nepaliLabels.changeLanguage));
    expect(bodyText()).toContain(selectorLabels.selectLanguageTitle);
    expect(findSelectedLanguageTile().textContent).toContain(nepali!.nativeLabel);

    appState.sessionId = "session-3";
    appState.sessionResetReason = "hard-reset";
    appState.sessionResetSide = null;
    appState.clearTriggeredAt = null;
    appState.sides.A.hasCommittedLanguageSelection = false;
    appState.sides.B.hasCommittedLanguageSelection = false;
    appState.sides.B.selectedInteractionLanguage = "mr";
    appState.sides.B.normalizedTargetLanguage = "mr";
    appState.sides.B.selectedTargetLanguage = "mr";
    appState.sides.B.sourceLanguage = "mr-IN";
    appState.sides.B.wizardDefaultUiLanguage = "en";
    appState.sides.B.requestedUiLanguage = "mr";
    appState.sides.B.effectiveUiLanguage = "mr";

    await harness.emitState(appState);

    expect(bodyText()).toContain(selectorLabels.selectLanguageTitle);
    expect(findSelectedLanguageTile().textContent).toContain(marathi!.nativeLabel);
  });

  it("keeps the visitor selector localized to the wizard default language after switching to Georgian", async () => {
    const appState = createAppState();
    appState.sides.B.hasCommittedLanguageSelection = false;
    const harness = await renderOperatorApp("B", appState);
    const georgian = buildInteractionLanguageChoices("chatgpt", { includeProviderExpansions: true }).find(
      (choice) => choice.value === "ka"
    );
    const englishSelectorLabels = getVisitorUiText(appState.sides.B.wizardDefaultUiLanguage ?? "en");
    const georgianSessionLabels = getVisitorUiText("ka");

    expect(georgian).toBeDefined();

    await dispatchClick(findSelectedLanguageTile());
    appState.sides.B.hasCommittedLanguageSelection = true;
    await harness.emitState(appState);
    await dispatchClick(findButtonByText(appState.sides.B.effectiveUiLanguage === "it" ? getVisitorUiText("it").changeLanguage : "Change language"));
    await dispatchClick(findMacroAreaButton("Central Asia"));
    await dispatchClick(findButtonByText(georgian!.nativeLabel));

    appState.sessionId = "session-ka";
    appState.sessionResetReason = "language-change";
    appState.sessionResetSide = "B";
    appState.sides.B.selectedInteractionLanguage = "ka";
    appState.sides.B.normalizedTargetLanguage = "ka";
    appState.sides.B.selectedTargetLanguage = "ka";
    appState.sides.B.sourceLanguage = "ka-GE";
    appState.sides.B.requestedUiLanguage = "ka";
    appState.sides.B.effectiveUiLanguage = "ka";
    appState.sides.B.hasCommittedLanguageSelection = true;

    await harness.emitState(appState);

    expect(bodyText()).toContain(georgianSessionLabels.changeLanguage);
    await dispatchClick(findButtonByText(georgianSessionLabels.changeLanguage));
    expect(bodyText()).toContain(englishSelectorLabels.selectLanguageTitle);
    expect(findSelectedLanguageTile().textContent).toContain(georgian!.nativeLabel);
  });

  it("retries localized visitor technical errors from the mounted blocking screen", async () => {
    const appState = createAppState();
    const harness = await renderOperatorApp("B", appState);
    const issue = {
      code: "missing-monitor",
      message: "Sono necessari due monitor attivi per avviare la sessione.",
      retryable: true
    } as const;
    const technicalLabels = getVisitorTechnicalErrorText("es");

    harness.actions.length = 0;
    appState.sides.B.requestedUiLanguage = "es";
    appState.sides.B.effectiveUiLanguage = "es";
    appState.health.blockingIssues = [issue];

    await harness.emitState(appState);

    expect(bodyText()).toContain(technicalLabels.technicalError);
    expect(bodyText()).toContain(localizeVisitorTechnicalIssue(issue, "es").message);

    await dispatchClick(findButtonByText(technicalLabels.retry));

    expect(latestAction(harness.actions)).toEqual({
      type: "retry-health-check",
      side: "B"
    });
  });

  it("updates the runtime document language metadata to match the rendered visitor UI", async () => {
    const appState = createAppState();
    appState.sides.B.requestedUiLanguage = "es";
    appState.sides.B.effectiveUiLanguage = "es";

    await renderOperatorApp("B", appState);

    expect(document.documentElement.lang).toBe("es");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("switches the runtime document direction for rtl visitor surfaces", async () => {
    const appState = createAppState();
    appState.sides.B.selectedInteractionLanguage = "ar";
    appState.sides.B.normalizedTargetLanguage = "ar";
    appState.sides.B.selectedTargetLanguage = "ar";
    appState.sides.B.requestedUiLanguage = "ar";
    appState.sides.B.effectiveUiLanguage = "ar";

    await renderOperatorApp("B", appState);

    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("keeps the visitor runtime banner localized for microphone permission errors on spanish surfaces", async () => {
    const appState = createAppState();
    const harness = await renderOperatorApp("B", appState);

    appState.sides.B.requestedUiLanguage = "es";
    appState.sides.B.effectiveUiLanguage = "es";
    appState.health.blockingIssues = [
      {
        code: "microphone-permission-denied",
        message: "Accesso al microfono bloccato per la postazione.",
        retryable: true,
        side: "B",
        details: "NotAllowedError: Permission denied"
      }
    ];

    await harness.emitState(appState);

    expect(bodyText()).toContain("El acceso al microfono esta bloqueado.");
    expect(bodyText()).toContain("Pide al operador que vuelva a abrir la configuracion.");
    expect(bodyText()).not.toContain("Ask the operator to reopen setup.");
  });

  it("offers setup repair from the operator blocking screen for microphone permission errors", async () => {
    const appState = createAppState();
    const harness = await renderOperatorApp("A", appState);

    appState.health.blockingIssues = [
      {
        code: "microphone-permission-denied",
        message: "Accesso al microfono bloccato per la postazione.",
        retryable: true,
        side: "A",
        details: "NotAllowedError: Permission denied"
      }
    ];

    await harness.emitState(appState);

    expect(bodyText()).toContain("Station A cannot access its microphone.");
    expect(bodyText()).toContain("Open setup");
    expect(bodyText()).not.toContain("NotAllowedError: Permission denied");

    await dispatchClick(findButtonByText("Open setup"));

    expect(harness.openSetupWizardCalls).toBe(1);
  });

  it("offers setup repair from the operator blocking screen for monitor and provider setup issues", async () => {
    const appState = createAppState();
    const harness = await renderOperatorApp("A", appState);

    appState.health.blockingIssues = [
      {
        code: "missing-monitor",
        message: "Sono necessari due monitor attivi per avviare la sessione.",
        retryable: true
      },
      {
        code: "translation-config-missing",
        message: "Configurazione provider traduzione mancante: chatgpt.",
        retryable: false
      }
    ];

    await harness.emitState(appState);

    expect(bodyText()).toContain("Two active monitors are required to start the session.");
    expect(bodyText()).toContain("Open setup");

    await dispatchClick(findButtonByText("Open setup"));

    expect(harness.openSetupWizardCalls).toBe(1);
  });

  it("hides the shutdown control when the runtime reports shutdown is unavailable", async () => {
    await renderOperatorApp("A", createAppState());

    expect(document.querySelector('button[aria-label="Shutdown computer"]')).toBeNull();
  });

  it("surfaces shutdown failures instead of silently dismissing the confirmation flow", async () => {
    const harness = createOnlySpeechHarness({
      shutdownCapability: true,
      shutdownResult: {
        ok: false,
        message: "Shutdown command failed: Access is denied."
      }
    });
    window.onlySpeech = harness.api;
    window.history.replaceState({}, "", "/?side=A");

    container = document.createElement("div");
    container.id = "root";
    document.body.innerHTML = "";
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);

    await act(async () => {
      root?.render(<OperatorApp />);
      await Promise.resolve();
    });

    await harness.emitState(createAppState());
    await act(async () => {
      await Promise.resolve();
    });
    await dispatchClick(findButtonByAriaLabel("Shut down computer"));
    await dispatchClick(findButtonByText("Confirm"));

    expect(harness.api.shutdownComputer).toHaveBeenCalledTimes(1);
    expect(bodyText()).toContain("Shutdown command failed: Access is denied.");
  });

  it("keeps the mounted Station A setup access gate active before reopening setup in demo mode", async () => {
    const appState = createAppState();
    appState.appMode = "demo";
    const harness = await renderOperatorApp("A", appState);

    (harness.api.getSetupWizardAccessState as ReturnType<typeof vi.fn>).mockResolvedValue({
      requiresPassword: true,
      mustChangePassword: false,
      temporaryPassword: null
    });

    await dispatchClick(findButtonByAriaLabel("Open setup"));
    await dispatchInput(getDialogPasswordInputs()[0]!, "TEMP-PASS-01");
    await dispatchClick(getDialogSubmitButton());

    expect(harness.api.setDemoPaused).toHaveBeenCalledWith(true);
    expect(harness.requestCalls).toEqual([
      {
        password: "TEMP-PASS-01",
        nextPassword: undefined
      }
    ]);
  });

  it("shows only local turns in the local transcript history and only remote turns in the translated history", async () => {
    const appState = createAppState();
    appState.visitorConversationHistoryEnabled = true;
    appState.sides.A.localTranscript = "come ti chiami?";
    appState.sides.A.remoteTranslation = "my name is ben.";
    appState.sides.A.detectedSourceLanguage = "es-ES";
    appState.conversationHistory = [
      {
        id: "turn-1",
        sequence: 1,
        speakerSide: "A",
        transcript: "ciao",
        translation: "hi",
        sourceLanguage: "it-IT",
        targetLanguage: "en"
      },
      {
        id: "turn-2",
        sequence: 2,
        speakerSide: "B",
        transcript: "my name is ben",
        translation: "mi chiamo ben",
        sourceLanguage: "en-US",
        targetLanguage: "it"
      }
    ];

    await renderOperatorApp("A", appState);

    expect(bodyText()).toContain("Source language: Spagnolo (Spagna)");
    expect(panelHistoryText(0)).toContain("Operator");
    expect(panelHistoryText(0)).toContain("ciao");
    expect(panelHistoryText(0)).not.toContain("my name is ben");
    expect(panelHistoryText(1)).toContain("User");
    expect(panelHistoryText(1)).toContain("mi chiamo ben");
    expect(panelHistoryText(1)).not.toContain("ciao");
  });

  it("renders accessible speaker controls on both text panels and routes playback from the visitor surface", async () => {
    const appState = createAppState();
    appState.sides.B.localTranscript = "ciao";
    appState.sides.B.remoteTranslation = "hello";

    const harness = await renderOperatorApp("B", appState);
    const buttons = speakerButtons();

    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.getAttribute("aria-label")).toContain("Testo utente");
    expect(buttons[1]?.getAttribute("aria-label")).toContain("Traduzione operatore");

    await dispatchClick(buttons[0]!);

    expect(harness.api.requestTextToSpeech).toHaveBeenCalledWith({
      side: "B",
      content: "transcript",
      text: "ciao",
      language: "it-IT"
    });
  });

  it("starts and releases operator push-to-talk from the focused button keyboard flow", async () => {
    const harness = await renderOperatorApp("A", createAppState());
    const pttButton = getPttButton();

    expect(pttButton.disabled).toBe(false);
    expect(pttButton.getAttribute("aria-disabled")).toBe("false");
    pttButton.focus();
    expect(document.activeElement).toBe(pttButton);
    harness.actions.length = 0;

    await dispatchKeyboard(pttButton, "keydown", "Space");
    await dispatchKeyboard(pttButton, "keyup", "Space");

    expect(harness.actions).toEqual([
      {
        type: "request-ptt-down",
        side: "A"
      },
      {
        type: "request-ptt-up",
        side: "A"
      }
    ]);
  });

  it("exposes unavailable push-to-talk as disabled and ignores keyboard activation", async () => {
    const appState = createAppState();
    appState.activeSide = "B";
    const harness = await renderOperatorApp("A", appState);
    const pttButton = getPttButton();

    expect(pttButton.classList.contains("disabled")).toBe(true);
    expect(pttButton.disabled).toBe(true);
    expect(pttButton.getAttribute("aria-disabled")).toBe("true");
    harness.actions.length = 0;

    await dispatchKeyboard(pttButton, "keydown", "Enter");
    await dispatchKeyboard(pttButton, "keyup", "Enter");

    expect(harness.actions).toEqual([]);
  });

  it("exposes unavailable visitor push-to-talk with the same disabled semantics", async () => {
    const appState = createAppState();
    appState.appMode = "demo";
    const harness = await renderOperatorApp("B", appState);
    const pttButton = getPttButton();

    expect(pttButton.classList.contains("disabled")).toBe(true);
    expect(pttButton.disabled).toBe(true);
    expect(pttButton.getAttribute("aria-disabled")).toBe("true");
    harness.actions.length = 0;

    await dispatchKeyboard(pttButton, "keydown", "Space");
    await dispatchKeyboard(pttButton, "keyup", "Space");

    expect(harness.actions).toEqual([]);
  });

  it("toggles the speaker control to stop when the same panel is already playing", async () => {
    const appState = createAppState();
    appState.sides.A.localTranscript = "hello there";
    appState.textToSpeech = {
      side: "A",
      content: "transcript",
      requestId: "tts-1",
      status: "playing",
      engine: "azure",
      language: "en-US",
      voiceName: "English Voice",
      error: null
    };

    const harness = await renderOperatorApp("A", appState);
    const buttons = speakerButtons();

    expect(buttons[0]?.textContent).toContain("Stop");
    await dispatchClick(buttons[0]!);

    expect(harness.api.stopTextToSpeech).toHaveBeenCalledWith({
      side: "A",
      content: "transcript"
    });
  });

  it("keeps the session visible when the last TTS request ended in error", async () => {
    const appState = createAppState();
    appState.sides.A.remoteTranslation = "hello";
    appState.textToSpeech = {
      side: "A",
      content: "translation",
      requestId: null,
      status: "error",
      engine: "azure",
      language: "en-US",
      voiceName: null,
      error: "Speech synthesis failed."
    };

    await renderOperatorApp("A", appState);

    expect(bodyText()).toContain("Audio error");
    expect(bodyText()).toContain("hello");
  });

  it("hides speaker controls on both operator and visitor surfaces when runtime TTS is disabled", async () => {
    const operatorState = createAppState();
    operatorState.textToSpeechEnabled = false;
    operatorState.sides.A.localTranscript = "hello there";
    operatorState.sides.A.remoteTranslation = "ciao";

    await renderOperatorApp("A", operatorState);
    expect(speakerButtons()).toHaveLength(0);

    const visitorState = createAppState();
    visitorState.textToSpeechEnabled = false;
    visitorState.sides.B.localTranscript = "ciao";
    visitorState.sides.B.remoteTranslation = "hello";

    await renderOperatorApp("B", visitorState);
    expect(speakerButtons()).toHaveLength(0);
  });

  it("shows the standardized AI-assisted disclosure on both operator and visitor runtime surfaces", async () => {
    await renderOperatorApp("A", createAppState());
    expect(bodyText()).toContain("AI-assisted use notice");
    expect(bodyText()).toContain("Output may contain errors and must not be the sole basis");

    await renderOperatorApp("B", createAppState());
    expect(bodyText()).toContain("Avviso uso assistito da AI");
    expect(bodyText()).toContain("non deve essere l'unica base per decisioni critiche");
  });

  it("renders the custom disclosure text across runtime surfaces", async () => {
    const appState = createAppState();
    appState.runtimeDisclosure = {
      mode: "custom",
      customText: "Custom runtime disclosure.\nGlobal paragraph two."
    };

    await renderOperatorApp("A", appState);
    expect(bodyText()).toContain("Custom runtime disclosure.");
    expect(bodyText()).toContain("Global paragraph two.");
  });

  it("hides the runtime disclosure entirely when disabled", async () => {
    const appState = createAppState();
    appState.runtimeDisclosure = {
      mode: "disabled",
      customText: null
    };

    await renderOperatorApp("A", appState);
    expect(bodyText()).not.toContain("AI-assisted use notice");
    expect(bodyText()).not.toContain("Output may contain errors and must not be the sole basis");
  });
});
