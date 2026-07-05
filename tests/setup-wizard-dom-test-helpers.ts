import { afterEach, vi, type Mock } from "vitest";
import { JSDOM, type DOMWindow } from "jsdom";
import { assignDisplay, createInitialWizardState } from "../src/tools/setup-wizard/shared.js";
import type { WizardState } from "../src/tools/setup-wizard/shared.js";
import type {
  AzureTextToSpeechCatalogSnapshot,
  TextToSpeechEventPayload,
  TrialAvailabilityState
} from "../src/shared/types.js";

type AnyMock = Mock<(...args: any[]) => any>;

export interface WizardApiMock {
  getState: AnyMock;
  openMonitorSetup: AnyMock;
  closeMonitorSetup: AnyMock;
  assignDisplay: AnyMock;
  assignMicrophone: AnyMock;
  updateMicrophones: AnyMock;
  updateSignalLevel: AnyMock;
  updateEnvValues: AnyMock;
  updateAutostart: AnyMock;
  previewEnv: AnyMock;
  saveEnv: AnyMock;
  getAzureTextToSpeechCatalog: AnyMock;
  openLogsFolder: AnyMock;
  testProviderTranslation: AnyMock;
  testProviderSpeech: AnyMock;
  testTextToSpeech: AnyMock;
  releaseTextToSpeech: AnyMock;
  closeCurrentOverlay: AnyMock;
  closeWizard: AnyMock;
  getLicenseState: AnyMock;
  getTrialAvailability: AnyMock;
  submitNewLicense: AnyMock;
  clearLicense: AnyMock;
  submitTrial: AnyMock;
  terminateApplication: AnyMock;
  onState: AnyMock;
  onTextToSpeechEvent: AnyMock;
  emitState: (nextState: WizardState) => void;
  emitTextToSpeechEvent: (event: TextToSpeechEventPayload) => void;
}

export interface Deferred<T> {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: T | PromiseLike<T>) => void;
}

interface CreateDomOptions {
  beforeParse?: (window: DOMWindow) => void;
}

const openWindows: JSDOM[] = [];

afterEach(() => {
  while (openWindows.length > 0) {
    openWindows.pop()?.window.close();
  }
});

export function createWizardState(): WizardState {
  const baseState = createInitialWizardState(
    [
      { displayId: 101, label: "Fixture A", bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 },
      { displayId: 202, label: "Fixture B", bounds: { x: 1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 }
    ],
    {
      TRANSLATION_PROVIDER: "chatgpt",
      DEFAULT_TARGET_LANG_A: "it",
      DEFAULT_TARGET_LANG_B: "en",
      CHATGPT_API_KEY: "chatgpt-key",
      CHATGPT_MODEL: "gpt-4o-mini",
      CHATGPT_TRANSCRIBE_MODEL: "whisper-1",
      AZURE_SPEECH_KEY: "azure-key",
      AZURE_SPEECH_REGION: "westeurope"
    }
  );

  return {
    ...baseState,
    monitorSetupSessionActive: false,
    overlayDisplayIds: [],
    displays: assignDisplay(assignDisplay(baseState.displays, "A", 101), "B", 202),
    microphonePermissionGranted: true,
    microphones: [
      {
        deviceId: "mic-a",
        groupId: "ga",
        label: "Microfono A",
        connectionType: "usb",
        connectionLabel: "USB",
        assignedSides: ["A"]
      },
      {
        deviceId: "mic-b",
        groupId: "gb",
        label: "Microfono B",
        connectionType: "analog",
        connectionLabel: "Analogico",
        assignedSides: ["B"]
      },
      {
        deviceId: "mic-c",
        groupId: "gc",
        label: "Microfono C",
        connectionType: "usb",
        connectionLabel: "USB",
        assignedSides: []
      }
    ],
    signalLevels: {
      A: 0,
      B: 0
    },
    autostart: {
      mechanism: "current-user-run-key",
      scope: "current-user",
      supported: true,
      canModify: true,
      currentEnabled: true,
      selectedEnabled: true
    }
  };
}

export function createWizardApi(state: WizardState): WizardApiMock {
  let currentState = structuredClone(state);
  const listeners = new Set<(nextState: WizardState) => void>();
  const textToSpeechListeners = new Set<(event: TextToSpeechEventPayload) => void>();
  const defaultAzureTextToSpeechCatalog: AzureTextToSpeechCatalogSnapshot = {
    region: "westeurope",
    status: "fresh",
    fetchedAt: "2026-04-09T08:00:00.000Z",
    freshUntil: "2026-04-09T08:05:00.000Z",
    voiceCount: 2,
    error: null,
    voices: [
      {
        id: "it-IT-ElsaNeural",
        name: "Elsa",
        language: "it-IT",
        engine: "azure",
        localeName: "Italian (Italy)",
        localName: "Elsa",
        shortName: "it-IT-ElsaNeural",
        gender: "Female"
      },
      {
        id: "en-US-JennyNeural",
        name: "Jenny",
        language: "en-US",
        engine: "azure",
        localeName: "English (United States)",
        localName: "Jenny",
        shortName: "en-US-JennyNeural",
        gender: "Female"
      }
    ]
  };

  const publish = () => {
    const nextState = structuredClone(currentState);
    for (const listener of listeners) {
      listener(nextState);
    }
  };

  const emitState = (nextState: WizardState) => {
    currentState = structuredClone(nextState);
    publish();
  };

  const emitTextToSpeechEvent = (event: TextToSpeechEventPayload) => {
    for (const listener of textToSpeechListeners) {
      listener(event);
    }
  };

  return {
    getState: vi.fn(async () => structuredClone(currentState)),
    openMonitorSetup: vi.fn(async () => {
      currentState = {
        ...currentState,
        monitorSetupSessionActive: true,
        overlayDisplayIds: currentState.displays.map((display) => display.displayId)
      };
      publish();
      return undefined;
    }),
    closeMonitorSetup: vi.fn(() => {
      currentState = {
        ...currentState,
        monitorSetupSessionActive: false,
        overlayDisplayIds: []
      };
      publish();
    }),
    assignDisplay: vi.fn(async (side: "A" | "B" | null, displayId: number) => {
      currentState = {
        ...currentState,
        displays: currentState.displays.map((display) =>
          display.displayId === displayId
            ? { ...display, assignedSide: side }
            : display.assignedSide === side && side !== null
              ? { ...display, assignedSide: null }
              : display
        )
      };
      publish();
      return structuredClone(currentState);
    }),
    assignMicrophone: vi.fn(async (side: "A" | "B", deviceId: string | null) => {
      currentState = {
        ...currentState,
        microphones: currentState.microphones.map((microphone) => ({
          ...microphone,
          assignedSides:
            microphone.deviceId === deviceId
              ? [...microphone.assignedSides.filter((assignedSide) => assignedSide !== side), side]
              : microphone.assignedSides.filter((assignedSide) => assignedSide !== side)
        }))
      };
      publish();
      return structuredClone(currentState);
    }),
    updateMicrophones: vi.fn(async () => structuredClone(currentState)),
    updateSignalLevel: vi.fn(async () => structuredClone(currentState)),
    updateEnvValues: vi.fn(async (values: Record<string, string>) => {
      currentState = {
        ...currentState,
        envValues: {
          ...currentState.envValues,
          ...values
        }
      };
      publish();
      return structuredClone(currentState);
    }),
    updateAutostart: vi.fn(async (selectedEnabled: boolean) => {
      currentState = {
        ...currentState,
        autostart: {
          ...currentState.autostart,
          currentEnabled: selectedEnabled,
          selectedEnabled
        }
      };
      publish();
      return structuredClone(currentState);
    }),
    previewEnv: vi.fn(async () => "PREVIEW=ok"),
    saveEnv: vi.fn(async () => ({
      envPath: "C:\\OnlySpeech\\.env",
      preview: "PREVIEW=ok",
      secretStorageMode: "dotenv" as const,
      storedSecretKeys: [],
      autostartEnabled: currentState.autostart.selectedEnabled,
      autostartSupported: currentState.autostart.supported,
      temporaryWizardPassword: "TEMP-PASS-01",
      mustChangeWizardPassword: true
    })),
    getAzureTextToSpeechCatalog: vi.fn(async () => structuredClone(defaultAzureTextToSpeechCatalog)),
    openLogsFolder: vi.fn(async () => ({
      path: "C:\\OnlySpeech\\logs"
    })),
    testProviderTranslation: vi.fn(async (request) => ({
      provider: request.provider,
      mode: "translation" as const,
      output: "translated output"
    })),
    testProviderSpeech: vi.fn(async () => ({
      transcript: "ciao",
      translation: "hello"
    })),
    testTextToSpeech: vi.fn(
      async (request: { language: string; translationProvider?: string | null }) => {
        if (request.translationProvider === "azure") {
          return {
            requestId: "wizard-tts-1",
            engine: "azure" as const,
            language: request.language.toLowerCase() === "en" ? "en-US" : "it-IT",
            voiceName: request.language.toLowerCase() === "en" ? "Jenny" : "Elsa",
            normalizedText:
              request.language.toLowerCase() === "en"
                ? "Hello, this is a provider speech playback test."
                : "Buongiorno, questo e' un test di riproduzione provider.",
            requestedLanguage: request.language,
            translated: true
          };
        }

        return {
          requestId: "wizard-tts-1",
          engine: "openai" as const,
          language: request.language.toLowerCase() === "pt" ? "pt-BR" : request.language,
          voiceName: request.language.toLowerCase() === "pt" ? "Alloy" : "Alloy",
          normalizedText: "Hello, this is a provider speech playback test.",
          requestedLanguage: request.language,
          translated: true
        };
      }
    ),
    releaseTextToSpeech: vi.fn(async () => undefined),
    closeCurrentOverlay: vi.fn(),
    closeWizard: vi.fn(),
    getLicenseState: vi.fn(async () => null),
    getTrialAvailability: vi.fn(async (): Promise<TrialAvailabilityState> => ({
      eligible: true,
      exhaustedAt: null
    })),
    submitNewLicense: vi.fn(async () => ({ ok: true })),
    clearLicense: vi.fn(async () => ({ ok: true })),
    submitTrial: vi.fn(async () => ({ ok: true })),
    terminateApplication: vi.fn(async () => ({ ok: true })),
    onState: vi.fn((listener: (nextState: WizardState) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    onTextToSpeechEvent: vi.fn((listener: (event: TextToSpeechEventPayload) => void) => {
      textToSpeechListeners.add(listener);
      return () => textToSpeechListeners.delete(listener);
    }),
    emitState,
    emitTextToSpeechEvent
  };
}

export async function waitForScripts(window: DOMWindow): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

export function click(window: DOMWindow, selector: string): void {
  const element = window.document.querySelector(selector);
  if (!(element instanceof window.HTMLElement)) {
    throw new Error(`Element '${selector}' not found.`);
  }

  element.click();
}

export function setValue(window: DOMWindow, selector: string, value: string): void {
  const element = window.document.querySelector(selector);
  if (!(element instanceof window.HTMLInputElement || element instanceof window.HTMLSelectElement || element instanceof window.HTMLTextAreaElement)) {
    throw new Error(`Element '${selector}' not found or not editable.`);
  }

  element.value = value;
  element.dispatchEvent(new window.Event("change", { bubbles: true }));
}

export function setInputValue(window: DOMWindow, selector: string, value: string): void {
  const element = window.document.querySelector(selector);
  if (!(element instanceof window.HTMLInputElement || element instanceof window.HTMLTextAreaElement)) {
    throw new Error(`Element '${selector}' not found or not editable as input.`);
  }

  element.value = value;
  element.dispatchEvent(new window.Event("input", { bubbles: true }));
}

export function createDeferred<T>(): Deferred<T> {
  let resolve!: Deferred<T>["resolve"];
  let reject!: Deferred<T>["reject"];
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, resolve, reject };
}

export async function createDom(
  html: string,
  api: WizardApiMock,
  url: string,
  options: CreateDomOptions = {}
): Promise<JSDOM> {
  const dom = new JSDOM(html, {
    url,
    runScripts: "dangerously",
    resources: "usable",
    beforeParse(window) {
      (window as typeof window & { onlySpeechWizard?: WizardApiMock }).onlySpeechWizard = api;
      Object.defineProperty(window, "confirm", {
        configurable: true,
        value: vi.fn(() => true)
      });
      Object.defineProperty(window.navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: vi.fn(async () => ({
            getTracks: () => [
              {
                stop: vi.fn()
              }
            ]
          })),
          enumerateDevices: vi.fn(async () => [
            { kind: "audioinput", deviceId: "mic-a", groupId: "ga", label: "Microfono A" },
            { kind: "audioinput", deviceId: "mic-b", groupId: "gb", label: "Microfono B" }
          ])
        }
      });
      (window as typeof window & { MediaRecorder: typeof MediaRecorder }).MediaRecorder = class MockMediaRecorder {
        static isTypeSupported() {
          return true;
        }

        mimeType: string;

        ondataavailable: ((event: { data: Blob }) => void) | null = null;

        onstop: (() => void) | null = null;

        onerror: ((event: { error?: Error }) => void) | null = null;

        constructor(_stream: MediaStream, options: { mimeType: string }) {
          this.mimeType = options.mimeType;
        }

        start() {
          this.ondataavailable?.({
            data: new window.Blob(["audio"], { type: this.mimeType })
          });
        }

        stop() {
          this.onstop?.();
        }
      } as unknown as typeof MediaRecorder;
      window.requestAnimationFrame = vi.fn(() => 1) as unknown as typeof window.requestAnimationFrame;
      window.cancelAnimationFrame = vi.fn() as unknown as typeof window.cancelAnimationFrame;
      options.beforeParse?.(window);
    }
  });

  openWindows.push(dom);
  await waitForScripts(dom.window);
  return dom;
}

