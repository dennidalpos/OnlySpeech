import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function installAudioMocks() {
  const NativeURL = globalThis.URL;
  class MockAudio {
    currentTime = 0;
    onplaying?: () => void;
    onended?: () => void;
    onerror?: () => void;

    constructor(public readonly src: string) {}

    async play() {
      this.onplaying?.();
    }

    pause() {}
  }

  vi.stubGlobal("Audio", MockAudio as unknown as typeof Audio);
  class MockURL extends NativeURL {}
  Object.assign(MockURL, {
    createObjectURL: vi.fn(() => "blob:wizard-tts"),
    revokeObjectURL: vi.fn()
  });
  vi.stubGlobal("URL", MockURL);
  vi.stubGlobal("window", {
    setTimeout,
    clearTimeout
  });
}

const preloadMocks = vi.hoisted(() => {
  const invoke = vi.fn();
  const send = vi.fn();
  const on = vi.fn();
  const removeListener = vi.fn();
  const exposeInMainWorld = vi.fn();

  const reset = () => {
    invoke.mockReset();
    send.mockReset();
    on.mockReset();
    removeListener.mockReset();
    exposeInMainWorld.mockReset();
  };

  return {
    invoke,
    send,
    on,
    removeListener,
    exposeInMainWorld,
    reset
  };
});

vi.mock("electron", () => ({
  contextBridge: {
    exposeInMainWorld: preloadMocks.exposeInMainWorld
  },
  ipcRenderer: {
    invoke: preloadMocks.invoke,
    send: preloadMocks.send,
    on: preloadMocks.on,
    removeListener: preloadMocks.removeListener
  }
}));

describe("setup-wizard preload", () => {
  beforeEach(() => {
    vi.resetModules();
    preloadMocks.reset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exposes the wizard bridge without the legacy managed-TTS helpers", async () => {
    await import("../src/tools/setup-wizard/preload.js");

    expect(preloadMocks.exposeInMainWorld).toHaveBeenCalledTimes(1);
    expect(preloadMocks.exposeInMainWorld.mock.calls[0]?.[0]).toBe("onlySpeechWizard");
    const api = preloadMocks.exposeInMainWorld.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(api.manageTextToSpeech).toBeUndefined();
    expect(api.getTextToSpeechCoverageSnapshot).toBeUndefined();
  });

  it("routes chatgpt speech tests through ipc and keeps azure speech lazy", async () => {
    preloadMocks.invoke.mockResolvedValue({ transcript: "ciao", translation: "hello" });

    await import("../src/tools/setup-wizard/preload.js");
    const api = preloadMocks.exposeInMainWorld.mock.calls[0]?.[1] as {
      testProviderSpeech: (request: {
        provider: "chatgpt";
        sourceLanguage: string;
        targetLanguage: string;
      }) => Promise<unknown>;
    };

    await api.testProviderSpeech({
      provider: "chatgpt",
      sourceLanguage: "it-IT",
      targetLanguage: "en"
    });

    expect(preloadMocks.invoke).toHaveBeenCalledWith("wizard:test-provider-speech", {
      provider: "chatgpt",
      sourceLanguage: "it-IT",
      targetLanguage: "en"
    });
  });

  it("runs provider-owned playback previews using the active provider credentials from wizard state", async () => {
    installAudioMocks();
    preloadMocks.invoke.mockImplementation(async (channel) => {
      if (channel === "wizard:get-state") {
        return {
          envValues: {
            TRANSLATION_PROVIDER: "chatgpt",
            CHATGPT_API_KEY: "wizard-openai-key",
            AZURE_SPEECH_KEY: "",
            AZURE_SPEECH_REGION: ""
          }
        };
      }

      if (channel === "wizard:normalize-provider-playback-text") {
        return {
          outputText: "Hello from normalized playback",
          targetLanguage: "en",
          mode: "translated"
        };
      }

      if (channel === "onlyspeech:synthesize-text-to-speech") {
        return {
          ok: true,
          synthesis: {
            audioBase64: "AQID",
            audioMimeType: "audio/mpeg",
            engine: "openai",
            language: "en-US",
            voiceName: "OpenAI alloy"
          }
        };
      }

      return undefined;
    });

    await import("../src/tools/setup-wizard/preload.js");
    const api = preloadMocks.exposeInMainWorld.mock.calls[0]?.[1] as {
      testTextToSpeech: (request: { text: string; language: string; translationProvider?: "chatgpt" | "azure" | null }) => Promise<{
        engine: string;
        voiceName: string | null;
      }>;
    };

    const preview = await api.testTextToSpeech({
      text: "Hello from setup",
      language: "en",
      translationProvider: "chatgpt"
    });

    expect(preview).toEqual(
      expect.objectContaining({
        engine: "openai",
        normalizedText: "Hello from normalized playback",
        requestedLanguage: "en",
        translated: true
      })
    );
    expect(preloadMocks.invoke).toHaveBeenCalledWith("wizard:get-state");
    expect(preloadMocks.invoke).toHaveBeenCalledWith("wizard:normalize-provider-playback-text", {
      provider: "chatgpt",
      targetLanguage: "en",
      text: "Hello from setup"
    });
    expect(preloadMocks.invoke).toHaveBeenCalledWith(
      "onlyspeech:synthesize-text-to-speech",
      expect.objectContaining({
        type: "start-tts",
        translationProvider: "chatgpt",
        text: "Hello from normalized playback",
        chatGptApiKey: "wizard-openai-key"
      })
    );
  });
});
