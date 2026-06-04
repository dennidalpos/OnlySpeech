import { afterEach, describe, expect, it, vi } from "vitest";
import { TextToSpeechClient } from "../src/services/speech/text-to-speech-client.js";
import type { StartTextToSpeechCommand, TextToSpeechEventPayload } from "../src/shared/types.js";

function createCommand(overrides: Partial<StartTextToSpeechCommand> = {}): StartTextToSpeechCommand {
  return {
    type: "start-tts",
    side: "A",
    content: "translation",
    requestId: "tts-1",
    text: "Hello world",
    language: "en",
    engine: "openai",
    translationProvider: "chatgpt",
    chatGptApiKey: "openai-key",
    ...overrides
  };
}

function installAudioMocks() {
  const revokeObjectURL = vi.fn();
  const createObjectURL = vi.fn(() => "blob:tts-preview");

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
  vi.stubGlobal("URL", {
    createObjectURL,
    revokeObjectURL
  });

  return {
    createObjectURL,
    revokeObjectURL
  };
}

function createAudioResponse() {
  return {
    ok: true,
    status: 200,
    arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    json: async () => []
  };
}

describe("TextToSpeechClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts provider-owned OpenAI playback for the ChatGPT provider", async () => {
    installAudioMocks();
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => createAudioResponse());
    vi.stubGlobal("fetch", fetchMock);

    const client = new TextToSpeechClient();
    const emitted: TextToSpeechEventPayload[] = [];

    await client.start(createCommand(), {
      onEvent: (event) => emitted.push(event)
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/audio/speech",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer openai-key"
        })
      })
    );
    const speechBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(speechBody.instructions).toContain("English");
    expect(emitted[0]).toEqual(
      expect.objectContaining({
        type: "started",
        engine: "openai",
        requestId: "tts-1"
      })
    );
  });

  it("can disable OpenAI TTS language instructions per command", async () => {
    installAudioMocks();
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => createAudioResponse());
    vi.stubGlobal("fetch", fetchMock);

    const client = new TextToSpeechClient();

    await client.start(createCommand({ openAiTtsLanguageInstructionsEnabled: false }), {
      onEvent: () => {}
    });

    const speechBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(speechBody.instructions).toBeUndefined();
  });

  it("emits unavailable when the ChatGPT/OpenAI provider has no configured API key", async () => {
    installAudioMocks();
    vi.stubGlobal("fetch", vi.fn());

    const client = new TextToSpeechClient();
    const emitted: TextToSpeechEventPayload[] = [];

    await client.start(
      createCommand({
        chatGptApiKey: null
      }),
      {
        onEvent: (event) => emitted.push(event)
      }
    );

    expect(emitted).toEqual([
      expect.objectContaining({
        type: "unavailable",
        engine: "openai",
        error: "OpenAI text-to-speech credentials are not configured."
      })
    ]);
  });

  it("emits unavailable when the shared kiosk catalog does not contain the requested OpenAI language", async () => {
    installAudioMocks();
    vi.stubGlobal("fetch", vi.fn(async () => createAudioResponse()));

    const client = new TextToSpeechClient();
    const emitted: TextToSpeechEventPayload[] = [];

    await client.start(
      createCommand({
        language: "prs"
      }),
      {
        onEvent: (event) => emitted.push(event)
      }
    );

    expect(emitted).toEqual([
      expect.objectContaining({
        type: "unavailable",
        engine: "openai",
        error: "OpenAI text-to-speech does not expose the shared kiosk catalog for the selected language."
      })
    ]);
  });

  it("starts Azure playback when the Azure provider is active and the catalog contains a compatible voice", async () => {
    installAudioMocks();
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/voices/list")) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              ShortName: "it-IT-ElsaNeural",
              DisplayName: "Elsa",
              Locale: "it-IT",
              LocaleName: "Italian (Italy)",
              LocalName: "Elsa",
              Gender: "Female"
            }
          ],
          arrayBuffer: async () => new Uint8Array([1]).buffer
        };
      }

      return createAudioResponse();
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new TextToSpeechClient();
    const emitted: TextToSpeechEventPayload[] = [];

    await client.start(
      createCommand({
        engine: "azure",
        translationProvider: "azure",
        language: "it",
        azureSpeechKey: "azure-key",
        azureSpeechRegion: "westeurope"
      }),
      {
        onEvent: (event) => emitted.push(event)
      }
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://westeurope.tts.speech.microsoft.com/cognitiveservices/voices/list",
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Ocp-Apim-Subscription-Key": "azure-key"
        })
      })
    );
    expect(emitted[0]).toEqual(
      expect.objectContaining({
        type: "started",
        engine: "azure",
        requestId: "tts-1"
      })
    );
  });

  it("plays provider audio synthesized through the main-process bridge without renderer fetches", async () => {
    installAudioMocks();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const synthesizeTextToSpeech = vi.fn(async () => ({
      ok: true as const,
      synthesis: {
        audioBase64: "AQID",
        audioMimeType: "audio/mpeg",
        engine: "openai" as const,
        language: "en-US",
        voiceName: "OpenAI alloy"
      }
    }));

    const client = new TextToSpeechClient({
      synthesizeTextToSpeech
    });
    const emitted: TextToSpeechEventPayload[] = [];

    await client.start(createCommand(), {
      onEvent: (event) => emitted.push(event)
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(synthesizeTextToSpeech).toHaveBeenCalledWith(createCommand());
    expect(emitted[0]).toEqual(
      expect.objectContaining({
        type: "started",
        engine: "openai",
        voiceName: "OpenAI alloy"
      })
    );
  });

  it("stops the active provider playback and emits a stopped event", async () => {
    installAudioMocks();
    vi.stubGlobal("fetch", vi.fn(async () => createAudioResponse()));

    const client = new TextToSpeechClient();
    const emitted: TextToSpeechEventPayload[] = [];
    await client.start(createCommand(), {
      onEvent: (event) => emitted.push(event)
    });

    await client.stop(
      {
        type: "stop-tts",
        side: "A",
        requestId: "tts-1"
      },
      {
        onEvent: (event) => emitted.push(event)
      }
    );

    expect(emitted.at(-1)).toEqual(
      expect.objectContaining({
        type: "stopped",
        requestId: "tts-1",
        engine: "openai"
      })
    );
  });
});
