import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AzureTextToSpeechProvider,
  AZURE_TEXT_TO_SPEECH_INVALID_CREDENTIALS_ERROR_CODE,
  AZURE_TEXT_TO_SPEECH_THROTTLED_ERROR_CODE,
  AZURE_TEXT_TO_SPEECH_UPSTREAM_ERROR_CODE
} from "../../src/services/speech/azure-text-to-speech-provider.js";
import { TextToSpeechClient } from "../../src/services/speech/text-to-speech-client.js";
import type { StartTextToSpeechCommand, TextToSpeechEventPayload } from "../../src/shared/types.js";

class MockAudio {
  readonly currentSrc: string;

  readonly readyState = 4;

  readonly networkState = 1;

  readonly error: { code: number } | null = null;

  currentTime = 0;

  onplaying: (() => void) | null = null;

  onended: (() => void) | null = null;

  onerror: (() => void) | null = null;

  constructor(sourceUrl: string) {
    this.currentSrc = sourceUrl;
  }

  async play(): Promise<void> {
    this.onplaying?.();
  }

  pause(): void {}
}

function createVoiceCatalogResponse(): Response {
  return new Response(
    JSON.stringify([
      {
        ShortName: "it-IT-ElsaNeural",
        DisplayName: "Elsa",
        LocalName: "Elsa",
        Locale: "it-IT",
        LocaleName: "Italian (Italy)",
        Gender: "Female"
      },
      {
        ShortName: "en-US-JennyNeural",
        DisplayName: "Jenny",
        LocalName: "Jenny",
        Locale: "en-US",
        LocaleName: "English (United States)",
        Gender: "Female"
      },
      {
        ShortName: "ar-EG-ShakirNeural",
        DisplayName: "Shakir",
        LocalName: "شاكر",
        Locale: "ar-EG",
        LocaleName: "Arabic (Egypt)",
        Gender: "Male"
      },
      {
        ShortName: "zh-CN-XiaoxiaoNeural",
        DisplayName: "Xiaoxiao",
        LocalName: "晓晓",
        Locale: "zh-CN",
        LocaleName: "Chinese (Mainland)",
        Gender: "Female"
      }
    ]),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

function createStartCommand(language: string, overrides: Partial<StartTextToSpeechCommand> = {}): StartTextToSpeechCommand {
  return {
    type: "start-tts",
    side: "A",
    content: "technical",
    requestId: "azure-tts-req-1",
    text: "مرحبا من OnlySpeech",
    language,
    engine: "azure",
    translationProvider: "azure",
    azureSpeechKey: "azure-key",
    azureSpeechRegion: "westeurope",
    ...overrides
  };
}

describe("AzureTextToSpeechProvider", () => {
  beforeEach(() => {
    AzureTextToSpeechProvider.resetCache();
    vi.stubGlobal("Audio", MockAudio);
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:azure-tts-preview"),
      revokeObjectURL: vi.fn()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    AzureTextToSpeechProvider.resetCache();
  });

  it("parses the Azure voice catalog for representative locales", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(createVoiceCatalogResponse());
    const provider = new AzureTextToSpeechProvider({
      getConfig: async () => ({ key: "azure-key", region: "westeurope" })
    });

    const voices = await provider.listVoices();

    expect(voices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "it-IT-ElsaNeural", locale: "it-IT", name: "Elsa" }),
        expect.objectContaining({ id: "en-US-JennyNeural", locale: "en-US", name: "Jenny" }),
        expect.objectContaining({ id: "ar-EG-ShakirNeural", locale: "ar-EG", name: "Shakir" }),
        expect.objectContaining({ id: "zh-CN-XiaoxiaoNeural", locale: "zh-CN", name: "Xiaoxiao" })
      ])
    );
  });

  it("builds the Azure synthesis request with SSML, headers, and the voice selected for the requested language", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(createVoiceCatalogResponse())
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    const client = new TextToSpeechClient();
    const events: TextToSpeechEventPayload[] = [];

    await client.start(createStartCommand("ar-EG"), {
      onEvent: (event) => {
        events.push(event);
      }
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    const synthCall = vi.mocked(fetch).mock.calls[1];
    expect(synthCall[0]).toBe("https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1");
    expect(synthCall[1]).toEqual(
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/ssml+xml",
          "Ocp-Apim-Subscription-Key": "azure-key",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3"
        })
      })
    );
    expect(String(synthCall[1]?.body)).toContain('<voice name="ar-EG-ShakirNeural">');
    expect(String(synthCall[1]?.body)).toContain('<lang xml:lang="ar-EG">');
    expect(String(synthCall[1]?.body)).toContain("مرحبا من OnlySpeech");
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "started",
        engine: "azure",
        voiceName: "Shakir",
        language: "ar-EG"
      })
    );
  });

  it("can disable the Azure SSML lang wrapper per command", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(createVoiceCatalogResponse())
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    const client = new TextToSpeechClient();

    await client.start(
      createStartCommand("ar-EG", {
        azureTtsLangElementEnabled: false
      }),
      {
        onEvent: () => {}
      }
    );

    const synthCall = vi.mocked(fetch).mock.calls[1];
    expect(String(synthCall[1]?.body)).toContain('<voice name="ar-EG-ShakirNeural">');
    expect(String(synthCall[1]?.body)).not.toContain('<lang xml:lang="ar-EG">');
  });

  it.each([
    [401, AZURE_TEXT_TO_SPEECH_INVALID_CREDENTIALS_ERROR_CODE],
    [429, AZURE_TEXT_TO_SPEECH_THROTTLED_ERROR_CODE],
    [503, AZURE_TEXT_TO_SPEECH_UPSTREAM_ERROR_CODE]
  ])("maps Azure synthesis status %i to errorCode %s", async (status, errorCode) => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(createVoiceCatalogResponse())
      .mockResolvedValueOnce(new Response("failure", { status }));
    const client = new TextToSpeechClient();
    const events: TextToSpeechEventPayload[] = [];

    await client.start(createStartCommand("en-US", { text: "Hello from Azure" }), {
      onEvent: (event) => {
        events.push(event);
      }
    });

    expect(events).toContainEqual(
      expect.objectContaining({
        type: "error",
        engine: "azure",
        errorCode
      })
    );
  });

  it("reuses the in-memory catalog inside the TTL window without hitting the network again", async () => {
    let now = 1_000;
    vi.mocked(fetch).mockResolvedValueOnce(createVoiceCatalogResponse());
    const provider = new AzureTextToSpeechProvider({
      getConfig: async () => ({ key: "azure-key", region: "westeurope" }),
      cacheTtlMs: 1_000,
      now: () => now
    });

    await provider.listVoices();
    now += 500;
    await provider.listVoices();

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("falls back to the stale catalog when the cache is expired and the refresh fails due to a network error", async () => {
    let now = 1_000;
    const provider = new AzureTextToSpeechProvider({
      getConfig: async () => ({ key: "azure-key", region: "westeurope" }),
      cacheTtlMs: 1_000,
      now: () => now
    });
    vi.mocked(fetch).mockResolvedValueOnce(createVoiceCatalogResponse());

    const freshVoices = await provider.listVoices();
    now += 1_500;
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error("socket hang up"))
      .mockRejectedValueOnce(new Error("socket hang up"));

    const staleSnapshot = await provider.getCatalogSnapshot();
    const staleVoices = await provider.listVoices();

    expect(staleSnapshot.status).toBe("stale");
    expect(staleSnapshot.voiceCount).toBe(freshVoices.length);
    expect(staleSnapshot.error).toContain("socket hang up");
    expect(staleVoices).toEqual(freshVoices);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
