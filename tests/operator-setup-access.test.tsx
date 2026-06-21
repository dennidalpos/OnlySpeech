// @vitest-environment jsdom

import { act } from "react";
import ReactDOM from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OperatorApp } from "../src/renderer/operator/app/OperatorApp.js";
import type { OnlySpeechRendererApi } from "../src/shared/onlyspeech-api.js";
import type {
  AppState,
  RendererCommand,
  SetupWizardAccessRequest,
  SetupWizardAccessResult,
  SetupWizardAccessState
} from "../src/shared/types.js";

const mocks = vi.hoisted(() => ({
  probeAudioInputDevices: vi.fn(async () => ({
    side: "A" as const,
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

function createAppState(overrides: Partial<AppState> = {}): AppState {
  return {
    sessionId: "session-1",
    appMode: "kiosk",
    microphonePttMode: "dual-dedicated",
    translationProvider: "chatgpt",
    textToSpeechEnabled: true,
    activeSide: null,
    lastActivityAt: "2026-03-31T12:00:00.000Z",
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
      blockingIssues: [
        {
          code: "missing-monitor",
          message: "Two active monitors are required to start the session.",
          retryable: true
        }
      ],
      displayAssignments: [],
      microphoneAssignments: []
    },
    ...overrides
  };
}

function bodyText(): string {
  return document.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
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

function getPasswordInputs(): HTMLInputElement[] {
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

async function dispatchClick(element: Element): Promise<void> {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => window.setTimeout(resolve, 0));
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

async function waitForDialog(): Promise<HTMLDivElement> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 1000) {
    const dialog = document.querySelector(".dialog-card");
    if (dialog instanceof HTMLDivElement) {
      return dialog;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 25));
  }

  throw new Error("Setup access dialog did not appear.");
}

interface SetupAccessHarness {
  api: OnlySpeechRendererApi;
  requestCalls: SetupWizardAccessRequest[];
  emitState: (state: AppState) => Promise<void>;
}

function createHarness(options: {
  accessState: SetupWizardAccessState;
  accessResult?: SetupWizardAccessResult;
}): SetupAccessHarness {
  const stateListeners = new Set<(state: AppState) => void>();
  const requestCalls: SetupWizardAccessRequest[] = [];

  return {
    requestCalls,
    api: {
      sendOperatorAction: vi.fn(),
      openSetupWizard: vi.fn(),
      setDemoPaused: vi.fn(async () => undefined),
      getSetupWizardAccessState: vi.fn(async () => options.accessState),
      requestSetupWizardAccess: vi.fn(async (request) => {
        requestCalls.push(request);
        return options.accessResult ?? { ok: true as const };
      }),
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
      shutdownComputer: vi.fn(),
      onState: (listener) => {
        stateListeners.add(listener);
        return () => stateListeners.delete(listener);
      },
      onCommand: (_listener: (command: RendererCommand) => void) => () => undefined
    },
    emitState: async (state) => {
      await act(async () => {
        for (const listener of stateListeners) {
          listener(structuredClone(state));
        }
        await Promise.resolve();
      });
    }
  };
}

let root: ReactDOM.Root | null = null;
let container: HTMLDivElement | null = null;

async function renderOperatorApp(harness: SetupAccessHarness): Promise<void> {
  window.onlySpeech = harness.api;
  window.history.replaceState({}, "", "/?side=A");

  container = document.createElement("div");
  document.body.innerHTML = "";
  document.body.appendChild(container);
  root = ReactDOM.createRoot(container);

  await act(async () => {
    root!.render(<OperatorApp />);
    await Promise.resolve();
  });

  await harness.emitState(createAppState());
}

beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
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

describe("operator setup access gate", () => {
  it("requests the workstation-local wizard password before reopening setup", async () => {
    const harness = createHarness({
      accessState: {
        requiresPassword: true,
        mustChangePassword: false,
        temporaryPassword: null
      }
    });

    await renderOperatorApp(harness);
    await harness.emitState(createAppState({ appMode: "demo" }));
    await dispatchClick(findButtonByText("Open setup"));

    expect(harness.api.setDemoPaused).toHaveBeenCalledWith(true);
    expect((await waitForDialog()).textContent).toContain("Setup password");

    const [passwordInput] = getPasswordInputs();
    expect(passwordInput).toBeDefined();
    await dispatchInput(passwordInput!, "TEMP-PASS-01");
    await dispatchClick(getDialogSubmitButton());

    expect(harness.requestCalls).toEqual([
      {
        password: "TEMP-PASS-01",
        nextPassword: undefined
      }
    ]);
  });

  it("forces the temporary password to be changed before reopening setup", async () => {
    const harness = createHarness({
      accessState: {
        requiresPassword: true,
        mustChangePassword: true,
        temporaryPassword: "TEMP-PASS-01"
      }
    });

    await renderOperatorApp(harness);
    await harness.emitState(createAppState({ appMode: "demo" }));
    await dispatchClick(findButtonByText("Open setup"));

    await waitForDialog();
    const [passwordInput, nextPasswordInput, confirmPasswordInput] = getPasswordInputs();
    expect(confirmPasswordInput).toBeDefined();
    await dispatchInput(passwordInput!, "TEMP-PASS-01");
    await dispatchInput(nextPasswordInput!, "OperatorPass42");
    await dispatchInput(confirmPasswordInput!, "OperatorPass42");
    await dispatchClick(getDialogSubmitButton());

    expect(harness.api.setDemoPaused).toHaveBeenCalledWith(true);
    expect(harness.requestCalls).toEqual([
      {
        password: "TEMP-PASS-01",
        nextPassword: "OperatorPass42"
      }
    ]);
  });

  it("shows the temporary setup password automatically on Station A while the first password change is required", async () => {
    const harness = createHarness({
      accessState: {
        requiresPassword: true,
        mustChangePassword: true,
        temporaryPassword: "TEMP-PASS-01"
      }
    });

    await renderOperatorApp(harness);

    expect(bodyText()).toContain("Temporary setup password is active");
    expect(bodyText()).toContain("TEMP-PASS-01");
  });

  it("releases the demo pause when setup access is cancelled before the wizard opens", async () => {
    const harness = createHarness({
      accessState: {
        requiresPassword: true,
        mustChangePassword: false,
        temporaryPassword: null
      }
    });

    const setDemoPaused = harness.api.setDemoPaused as ReturnType<typeof vi.fn>;

    await renderOperatorApp(harness);
    await harness.emitState(createAppState({ appMode: "demo" }));
    await dispatchClick(findButtonByText("Open setup"));
    await waitForDialog();
    await dispatchClick(findButtonByText("Cancel"));

    expect(setDemoPaused.mock.calls).toEqual([[true], [false]]);
  });

  it("shows the setup access dialog from the runtime banner while Station A is still on language selection", async () => {
    const harness = createHarness({
      accessState: {
        requiresPassword: true,
        mustChangePassword: false,
        temporaryPassword: null
      }
    });

    await renderOperatorApp(harness);
    await harness.emitState(
      createAppState({
        sides: {
          A: {
            ...createAppState().sides.A,
            hasCommittedLanguageSelection: false,
            selectedTargetLanguage: null,
            selectedInteractionLanguage: null,
            normalizedTargetLanguage: null
          },
          B: createAppState().sides.B
        },
        health: {
          ...createAppState().health,
          blockingIssues: [
            {
              code: "missing-microphone-a",
              message: "Microfono operatore non rilevato.",
              retryable: true,
              side: "A"
            }
          ]
        }
      })
    );

    await dispatchClick(findButtonByText("Open setup"));

    expect((await waitForDialog()).textContent).toContain("Setup password");
  });
});
