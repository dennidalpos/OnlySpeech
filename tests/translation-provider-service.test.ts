import { afterEach, describe, expect, it, vi } from "vitest";
import { TranslationProviderService } from "../src/services/speech/translation-provider-service.js";
import type { RuntimeConfig, TranslationRequest } from "../src/shared/types.js";

function createConfig(): RuntimeConfig {
  return {
    appMode: "kiosk",
    microphonePttMode: "dual-dedicated",
    demoSlideIntervalSeconds: 8,
    textToSpeechEnabled: true,
    requiredMonitors: 2,
    requiredMicrophones: 2,
    displayAId: null,
    displayBId: null,
    micAId: null,
    micBId: null,
    idleClearSeconds: 60,
    idleHardResetSeconds: 180,
    pttReleaseGraceMs: 400,
    providerRequestTimeoutMs: 45000,
    chatGptSilenceRmsThreshold: 0.02,
    visitorConversationHistoryEnabled: false,
    audioEchoCancellation: true,
    audioNoiseSuppression: true,
    azureSpeechKey: "azure-key",
    azureSpeechRegion: "westeurope",
    translationProvider: "chatgpt",
    chatGptApiKey: "chatgpt-key",
    chatGptModel: "gpt-4.1-mini",
    chatGptTranscribeModel: "gpt-4o-mini-transcribe",
    ollamaBaseUrl: "http://localhost:11434/api",
    ollamaModel: "gemma3",
    ollamaRequestTimeoutMs: 45000,
    ollamaStreamingEnabled: false,
    ollamaApiKey: "",
    defaultTargetLangA: "it",
    defaultTargetLangB: "en",
    defaultSourceLangA: "it-IT",
    defaultSourceLangB: "en-US",
    logLevel: "info"
  };
}

function createRequest(provider: TranslationRequest["provider"]): TranslationRequest {
  return {
    provider,
    sourceLanguage: "it-IT",
    targetLanguage: "en-US",
    text: "ciao mondo"
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TranslationProviderService", () => {
  it("returns original text for azure provider", async () => {
    const service = new TranslationProviderService(createConfig());
    await expect(service.translate(createRequest("azure"))).resolves.toBe("ciao mondo");
  });

  it("validates azure credentials through the speech token endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "azure-token"
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService({
      ...createConfig(),
      translationProvider: "azure"
    });

    await expect(service.smokeTestTranslationProvider(createRequest("azure"))).resolves.toEqual({
      mode: "validation",
      output:
        "Azure Speech credentials validated for region westeurope. Live microphone recognition still needs kiosk-side validation on the target workstation."
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://westeurope.api.cognitive.microsoft.com/sts/v1.0/issueToken",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Ocp-Apim-Subscription-Key": "azure-key"
        })
      })
    );
  });

  it("fails fast when azure speech config is incomplete", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService({
      ...createConfig(),
      translationProvider: "azure",
      azureSpeechKey: ""
    });

    await expect(service.smokeTestTranslationProvider(createRequest("azure"))).rejects.toThrow(
      "Azure Speech is not configured. Missing AZURE_SPEECH_KEY."
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalizes playback text through ChatGPT before provider-owned TTS", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "Ciao dal playback"
            }
          }
        ]
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService(createConfig());
    await expect(
      service.normalizeTextForPlayback({
        provider: "chatgpt",
        targetLanguage: "it",
        text: "Hello from playback"
      })
    ).resolves.toEqual({
      outputText: "Ciao dal playback",
      targetLanguage: "it",
      mode: "translated"
    });
  });

  it("normalizes playback text through Azure Translator when azure is active", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          translations: [
            {
              text: "Hello from Azure playback",
              to: "en"
            }
          ]
        }
      ])
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService({
      ...createConfig(),
      translationProvider: "azure",
      azureTranslatorKey: "translator-key",
      azureTranslatorRegion: "westeurope"
    });

    await expect(
      service.normalizeTextForPlayback({
        provider: "azure",
        targetLanguage: "en",
        text: "Ciao dal playback"
      })
    ).resolves.toEqual({
      outputText: "Hello from Azure playback",
      targetLanguage: "en",
      mode: "translated"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=en",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Ocp-Apim-Subscription-Key": "translator-key",
          "Ocp-Apim-Subscription-Region": "westeurope"
        })
      })
    );
  });

  it("fails fast when azure playback normalization is requested without translator credentials", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService({
      ...createConfig(),
      translationProvider: "azure"
    });

    await expect(
      service.normalizeTextForPlayback({
        provider: "azure",
        targetLanguage: "en",
        text: "ciao"
      })
    ).rejects.toThrow("Azure Translator is not configured. Missing AZURE_TRANSLATOR_KEY, AZURE_TRANSLATOR_REGION.");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls ChatGPT with configured model", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "hello world"
            }
          }
        ]
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService(createConfig());
    await expect(service.translate(createRequest("chatgpt"))).resolves.toBe("hello world");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer chatgpt-key"
        })
      })
    );
  });

  it("surfaces provider request failures", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "invalid api key"
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService(createConfig());
    await expect(service.translate(createRequest("chatgpt"))).rejects.toThrow(
      "ChatGPT request failed: 401 Unauthorized"
    );
  });

  it("uses stable remote error codes instead of leaking raw provider bodies", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => JSON.stringify({
        error: {
          code: "invalid_api_key",
          message: "token=secret"
        }
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService(createConfig());
    await expect(service.translate(createRequest("chatgpt"))).rejects.toThrow(
      "ChatGPT request failed: 401 Unauthorized (invalid_api_key)"
    );
  });

  it("fails fast when chatgpt translation config is incomplete", async () => {
    const config = createConfig();
    config.chatGptApiKey = "";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService(config);
    await expect(service.translate(createRequest("chatgpt"))).rejects.toThrow(
      "ChatGPT translation is not configured. Missing CHATGPT_API_KEY."
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("processes a full chatgpt speech turn", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: "ciao mondo"
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '{"translation":"hello world","detected_language":"it"}'
              }
            }
          ]
        })
      });
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService(createConfig());
    await expect(
      service.processSpeechTurn({
        provider: "chatgpt",
        sourceLanguage: "it-IT",
        targetLanguage: "en-US",
        audioBase64: Buffer.from("fake-audio").toString("base64"),
        audioMimeType: "audio/webm"
      })
    ).resolves.toEqual({
      transcript: "ciao mondo",
      translation: "hello world",
      detectedLanguage: "it"
    });
  });

  it("marks partial speech turns so the translation prompt can handle incomplete utterances", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: "ciao mon"
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '{"translation":"hello wo","detected_language":"it"}'
              }
            }
          ]
        })
      });
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService(createConfig());
    await expect(
      service.processSpeechTurn({
        provider: "chatgpt",
        sourceLanguage: "it-IT",
        targetLanguage: "en-US",
        audioBase64: Buffer.from("fake-audio").toString("base64"),
        audioMimeType: "audio/webm",
        isPartial: true
      })
    ).resolves.toEqual({
      transcript: "ciao mon",
      translation: "hello wo",
      detectedLanguage: "it"
    });

    expect(fetchMock.mock.calls[1]?.[1]?.body).toContain("incomplete because it comes from a live partial capture");
  });

  it("falls back gracefully when ChatGPT rejects incremental partial audio as unsupported", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => "The audio file could not be decoded or its format is not supported."
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService(createConfig());
    await expect(
      service.processSpeechTurn({
        provider: "chatgpt",
        sourceLanguage: "it-IT",
        targetLanguage: "en-US",
        audioBase64: Buffer.from("fake-audio").toString("base64"),
        audioMimeType: "audio/webm",
        isPartial: true
      })
    ).resolves.toEqual({
      transcript: "",
      translation: "",
      partialDiagnostic: {
        code: "partial-audio-unsupported",
        message:
          "ChatGPT partial transcription is unavailable for this incremental capture; OnlySpeech will continue with the final turn only.",
        disableFurtherPartialUpdates: true
      }
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to a transcription prompt for Albanian because the ChatGPT STT language parameter rejects sq", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: "pershendetje botë"
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '{"translation":"hello world","detected_language":"sq"}'
              }
            }
          ]
        })
      });
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService(createConfig());
    await expect(
      service.processSpeechTurn({
        provider: "chatgpt",
        sourceLanguage: "sq-AL",
        targetLanguage: "en-US",
        audioBase64: Buffer.from("fake-audio").toString("base64"),
        audioMimeType: "audio/webm"
      })
    ).resolves.toEqual({
      transcript: "pershendetje botë",
      translation: "hello world",
      detectedLanguage: "sq"
    });

    const transcriptionFormData = fetchMock.mock.calls[0]?.[1]?.body as FormData;
    expect(transcriptionFormData.get("language")).toBeNull();
    expect(transcriptionFormData.get("prompt")).toContain("Albanian");
  });

  it("keeps the ChatGPT transcription language hint for supported languages", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: "ciao mondo"
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '{"translation":"hello world","detected_language":"it"}'
              }
            }
          ]
        })
      });
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService(createConfig());
    await service.processSpeechTurn({
      provider: "chatgpt",
      sourceLanguage: "it-IT",
      targetLanguage: "en-US",
      audioBase64: Buffer.from("fake-audio").toString("base64"),
      audioMimeType: "audio/webm"
    });

    const transcriptionFormData = fetchMock.mock.calls[0]?.[1]?.body as FormData;
    expect(transcriptionFormData.get("language")).toBe("it");
    expect(transcriptionFormData.get("prompt")).toBeNull();
  });

  it("maps product language variants to the official OpenAI transcription hint codes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: "kumusta mundo"
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '{"translation":"hello world","detected_language":"tl"}'
              }
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: "hei verden"
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '{"translation":"hello world","detected_language":"no"}'
              }
            }
          ]
        })
      });
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService(createConfig());

    await service.processSpeechTurn({
      provider: "chatgpt",
      sourceLanguage: "fil-PH",
      targetLanguage: "en-US",
      audioBase64: Buffer.from("fake-audio").toString("base64"),
      audioMimeType: "audio/webm"
    });

    await service.processSpeechTurn({
      provider: "chatgpt",
      sourceLanguage: "nb-NO",
      targetLanguage: "en-US",
      audioBase64: Buffer.from("fake-audio").toString("base64"),
      audioMimeType: "audio/webm"
    });

    const tagalogFormData = fetchMock.mock.calls[0]?.[1]?.body as FormData;
    const norwegianFormData = fetchMock.mock.calls[2]?.[1]?.body as FormData;
    expect(tagalogFormData.get("language")).toBe("tl");
    expect(tagalogFormData.get("prompt")).toBeNull();
    expect(norwegianFormData.get("language")).toBe("no");
    expect(norwegianFormData.get("prompt")).toBeNull();
  });

  it("does not call translation when transcription returns empty text", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        text: "   "
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService(createConfig());
    await expect(
      service.processSpeechTurn({
        provider: "chatgpt",
        sourceLanguage: "it-IT",
        targetLanguage: "en-US",
        audioBase64: Buffer.from("fake-audio").toString("base64"),
        audioMimeType: "audio/webm"
      })
    ).resolves.toEqual({
      transcript: "",
      translation: "",
      detectedLanguage: undefined
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to plain-text translation when the speech-turn translation response is not valid JSON", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: "ciao mondo"
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "hello world"
              }
            }
          ]
        })
      });
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService(createConfig());
    await expect(
      service.processSpeechTurn({
        provider: "chatgpt",
        sourceLanguage: "it-IT",
        targetLanguage: "en-US",
        audioBase64: Buffer.from("fake-audio").toString("base64"),
        audioMimeType: "audio/webm"
      })
    ).resolves.toEqual({
      transcript: "ciao mondo",
      translation: "hello world",
      detectedLanguage: undefined
    });
  });

  it("surfaces provider timeout failures with a stable message", async () => {
    const fetchMock = vi.fn().mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }));
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService({
      ...createConfig(),
      providerRequestTimeoutMs: 1234
    });

    await expect(service.translate(createRequest("chatgpt"))).rejects.toThrow(
      "Provider request timed out after 1234ms."
    );
  });

  it("surfaces transport failures before the provider responds with a stable message", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService(createConfig());

    await expect(service.translate(createRequest("chatgpt"))).rejects.toThrow(
      "Provider request failed before receiving a response: fetch failed"
    );
  });

  it("surfaces chatgpt speech transport failures with the same stable message", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const service = new TranslationProviderService(createConfig());

    await expect(
      service.processSpeechTurn({
        provider: "chatgpt",
        sourceLanguage: "it-IT",
        targetLanguage: "en-US",
        audioBase64: Buffer.from("fake-audio").toString("base64"),
        audioMimeType: "audio/webm"
      })
    ).rejects.toThrow("Provider request failed before receiving a response: network down");
  });
});
