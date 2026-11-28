import type {
  RuntimeConfig,
  ProviderAdapter,
  SpeechTurnRequest,
  SpeechTurnResult,
  TranslationProvider,
  TranslationRequest
} from "../../shared/types.js";
import { resolveProviderTargetLanguageCode } from "../../shared/language-registry.js";
import {
  resolveChatGptTranscriptionPrompt,
  resolveChatGptTranscriptionLanguageHint,
  resolveSpeechTurnSourceLanguage
} from "../../shared/speech-flow.js";
import { getProviderAdapter } from "./provider-adapters.js";
import { buildPlaybackNormalizationPrompt, buildSpeechTurnTranslationPrompt, buildTranslationPrompt } from "./translation-prompts.js";
import {
  buildProviderTransportFailureMessage,
  decodeBase64Audio,
  inferAudioExtension,
  isRecoverableChatGptPartialTranscriptionFailure,
  normalizeDetectedLanguageCode,
  parseJsonObject,
  parseProviderError as parseError,
  readChatCompletionContent,
  type AzureTranslatorResponseShape,
  type ChatGptSpeechTurnTranslationShape,
  type OllamaChatResponseShape,
  type OllamaTagsResponseShape,
  type OllamaVersionResponseShape,
  type OpenAiTranscriptionShape,
  type TranslationResponseShape
} from "./provider-response-utils.js";

interface ProviderSmokeTestResult {
  mode: "translation" | "validation";
  output: string;
}

interface PlaybackNormalizationResult {
  outputText: string;
  targetLanguage: string;
  mode: "translated" | "passthrough";
}

const CHATGPT_TRANSLATION_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const CHATGPT_TRANSCRIPTION_ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";
const DEFAULT_AZURE_TRANSLATOR_ENDPOINT = "https://api.cognitive.microsofttranslator.com";
const CHATGPT_PARTIAL_AUDIO_FALLBACK_MESSAGE =
  "ChatGPT partial transcription is unavailable for this incremental capture; OnlySpeech will continue with the final turn only.";

interface SpeechTranslationProvider extends ProviderAdapter {
  translate: (request: TranslationRequest, isPartial: boolean) => Promise<string>;
  smokeTest: (request: TranslationRequest) => Promise<ProviderSmokeTestResult>;
  normalizeTextForPlayback: (request: {
    provider: TranslationProvider;
    targetLanguage: string;
    text: string;
  }) => Promise<PlaybackNormalizationResult>;
  processSpeechTurn: (request: SpeechTurnRequest) => Promise<SpeechTurnResult>;
}

export class TranslationProviderService {
  private readonly providers: Record<TranslationProvider, SpeechTranslationProvider>;

  constructor(private readonly config: RuntimeConfig) {
    this.providers = {
      azure: {
        ...getProviderAdapter("azure"),
        translate: async (request) => request.text,
        smokeTest: async () => {
          this.assertAzureSpeechConfigured();
          await this.issueAzureSpeechToken();
          return {
            mode: "validation",
            output: `Azure Speech credentials validated for region ${this.config.azureSpeechRegion}. Live microphone recognition still needs kiosk-side validation on the target workstation.`
          };
        },
        normalizeTextForPlayback: async (request) => {
          const targetLanguage =
            resolveProviderTargetLanguageCode(request.targetLanguage, "azure", {
              includeProviderExpansions: true
            }) ?? request.targetLanguage;
          const text = request.text.trim();
          if (!text) {
            return {
              outputText: "",
              targetLanguage,
              mode: "passthrough"
            };
          }

          return {
            outputText: await this.translateWithAzureTranslator(text, targetLanguage),
            targetLanguage,
            mode: "translated"
          };
        },
        processSpeechTurn: async () => {
          throw new Error("Azure live speech is handled directly in the renderer pipeline.");
        }
      },
      chatgpt: {
        ...getProviderAdapter("chatgpt"),
        translate: async (request, isPartial) => {
          if (!request.text.trim()) {
            return "";
          }

          this.assertChatGptTranslationConfigured();
          return this.translateWithChatGpt(request, isPartial);
        },
        smokeTest: async (request) => ({
          mode: "translation",
          output: await this.providers.chatgpt.translate(request, false)
        }),
        normalizeTextForPlayback: async (request) => {
          const targetLanguage =
            resolveProviderTargetLanguageCode(request.targetLanguage, "chatgpt", {
              includeProviderExpansions: true
            }) ?? request.targetLanguage;
          const text = request.text.trim();
          if (!text) {
            return {
              outputText: "",
              targetLanguage,
              mode: "passthrough"
            };
          }

          return {
            outputText: await this.translatePlaybackTextWithChatGpt(text, targetLanguage),
            targetLanguage,
            mode: "translated"
          };
        },
        processSpeechTurn: async (request) => this.processChatGptSpeechTurn(request)
      },
      ollama: {
        ...getProviderAdapter("ollama"),
        translate: async (request, isPartial) => {
          if (!request.text.trim()) {
            return "";
          }

          this.assertOllamaConfigured();
          return this.translateWithOllama(request, isPartial);
        },
        smokeTest: async (request) => {
          this.assertOllamaConfigured();
          await this.getOllamaVersion();
          await this.assertOllamaModelAvailable();
          return {
            mode: "translation",
            output: await this.providers.ollama.translate(request, false)
          };
        },
        normalizeTextForPlayback: async (request) => {
          const text = request.text.trim();
          const targetLanguage = request.targetLanguage;
          if (!text) {
            return {
              outputText: "",
              targetLanguage,
              mode: "passthrough"
            };
          }

          return {
            outputText: await this.translatePlaybackTextWithOllama(text, targetLanguage),
            targetLanguage,
            mode: "translated"
          };
        },
        processSpeechTurn: async () => {
          throw new Error("Ollama is translation-only in OnlySpeech and does not provide live speech capture.");
        }
      }
    };
  }

  getProviderLabel(provider: TranslationProvider = this.config.translationProvider): string {
    return this.providers[provider].label;
  }

  async translate(request: TranslationRequest, isPartial = false): Promise<string> {
    return this.providers[request.provider].translate(request, isPartial);
  }

  async smokeTestTranslationProvider(request: TranslationRequest): Promise<ProviderSmokeTestResult> {
    return this.providers[request.provider].smokeTest(request);
  }

  async normalizeTextForPlayback(request: {
    provider: TranslationProvider;
    targetLanguage: string;
    text: string;
  }): Promise<PlaybackNormalizationResult> {
    return this.providers[request.provider].normalizeTextForPlayback(request);
  }

  async processSpeechTurn(request: SpeechTurnRequest): Promise<SpeechTurnResult> {
    return this.providers[request.provider].processSpeechTurn(request);
  }

  private async processChatGptSpeechTurn(request: SpeechTurnRequest): Promise<SpeechTurnResult> {
    this.assertChatGptSpeechConfigured();
    if (!request.audioBase64.trim()) {
      throw new Error("ChatGPT speech turn requires a non-empty audio payload.");
    }

    let transcription: { transcript: string; detectedLanguage?: string };
    try {
      transcription = await this.transcribeWithChatGpt(request);
    } catch (error) {
      if (request.isPartial && isRecoverableChatGptPartialTranscriptionFailure(error)) {
        return {
          transcript: "",
          translation: "",
          partialDiagnostic: {
            code: "partial-audio-unsupported",
            message: CHATGPT_PARTIAL_AUDIO_FALLBACK_MESSAGE,
            disableFurtherPartialUpdates: true
          }
        };
      }

      throw error;
    }

    if (!transcription.transcript) {
      return {
        transcript: "",
        translation: "",
        detectedLanguage: transcription.detectedLanguage
      };
    }

    const translatedTurn = await this.translateSpeechTurnWithChatGpt(
      {
        provider: "chatgpt",
        sourceLanguage: resolveSpeechTurnSourceLanguage(
          request.sourceLanguage,
          transcription.detectedLanguage,
          this.config.chatGptTranslationDetectedLanguageMode ?? "diagnostic"
        ),
        targetLanguage: request.targetLanguage,
        text: transcription.transcript
      },
      request.isPartial ?? false
    );
    return {
      transcript: transcription.transcript,
      translation: translatedTurn.translation,
      detectedLanguage: translatedTurn.detectedLanguage ?? transcription.detectedLanguage
    };
  }

  private async translateWithChatGpt(request: TranslationRequest, isPartial: boolean): Promise<string> {
    const response = await this.fetchWithTimeout(CHATGPT_TRANSLATION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.chatGptApiKey}`
      },
      body: JSON.stringify({
        model: this.config.chatGptModel,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You translate live speech for a kiosk app. Return only the translation text with no commentary."
          },
          {
            role: "user",
            content: buildTranslationPrompt(request, isPartial)
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`ChatGPT request failed: ${await parseError(response)}`);
    }

    const payload = (await response.json()) as TranslationResponseShape;
    return readChatCompletionContent(payload);
  }

  private async translatePlaybackTextWithChatGpt(text: string, targetLanguage: string): Promise<string> {
    this.assertChatGptTranslationConfigured();

    const response = await this.fetchWithTimeout(CHATGPT_TRANSLATION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.chatGptApiKey}`
      },
      body: JSON.stringify({
        model: this.config.chatGptModel,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You normalize short speech playback text for a kiosk app. Return only the final target-language text."
          },
          {
            role: "user",
            content: buildPlaybackNormalizationPrompt(targetLanguage, text)
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`ChatGPT request failed: ${await parseError(response)}`);
    }

    const payload = (await response.json()) as TranslationResponseShape;
    const normalizedText = readChatCompletionContent(payload);
    if (!normalizedText) {
      throw new Error("ChatGPT playback normalization returned no translated text.");
    }

    return normalizedText;
  }

  private async translateWithOllama(request: TranslationRequest, isPartial: boolean): Promise<string> {
    const response = await this.fetchWithTimeout(
      this.buildOllamaUrl("/chat"),
      {
        method: "POST",
        headers: this.buildOllamaHeaders(),
        body: JSON.stringify({
          model: this.config.ollamaModel,
          stream: this.config.ollamaStreamingEnabled,
          messages: [
            {
              role: "system",
              content: "You translate live speech for a kiosk app. Return only the translated text with no commentary."
            },
            {
              role: "user",
              content: buildTranslationPrompt({ ...request, provider: "ollama" }, isPartial)
            }
          ]
        })
      },
      this.config.ollamaRequestTimeoutMs
    );

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${await parseError(response)}`);
    }

    return await this.readOllamaChatContent(response);
  }

  private async translatePlaybackTextWithOllama(text: string, targetLanguage: string): Promise<string> {
    const response = await this.fetchWithTimeout(
      this.buildOllamaUrl("/chat"),
      {
        method: "POST",
        headers: this.buildOllamaHeaders(),
        body: JSON.stringify({
          model: this.config.ollamaModel,
          stream: this.config.ollamaStreamingEnabled,
          messages: [
            {
              role: "system",
              content:
                "You normalize short speech playback text for a kiosk app. Return only the final target-language text."
            },
            {
              role: "user",
              content: buildPlaybackNormalizationPrompt(targetLanguage, text)
            }
          ]
        })
      },
      this.config.ollamaRequestTimeoutMs
    );

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${await parseError(response)}`);
    }

    const content = await this.readOllamaChatContent(response);
    if (!content) {
      throw new Error("Ollama playback normalization returned no translated text.");
    }

    return content;
  }

  private async translateSpeechTurnWithChatGpt(
    request: TranslationRequest,
    isPartial: boolean
  ): Promise<ChatGptSpeechTurnTranslationShape> {
    const response = await this.fetchWithTimeout(CHATGPT_TRANSLATION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.chatGptApiKey}`
      },
      body: JSON.stringify({
        model: this.config.chatGptModel,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You translate live speech for a kiosk app. Return only strict JSON with translation and detected language metadata."
          },
          {
            role: "user",
            content: buildSpeechTurnTranslationPrompt(
              request,
              isPartial,
              this.config.chatGptTranslationDetectedLanguageMode ?? "diagnostic"
            )
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`ChatGPT request failed: ${await parseError(response)}`);
    }

    const payload = (await response.json()) as TranslationResponseShape;
    const content = readChatCompletionContent(payload);
    const parsed = parseJsonObject(content);
    if (!parsed) {
      return {
        translation: content
      };
    }

    const translation = typeof parsed.translation === "string" ? parsed.translation.trim() : "";
    return {
      translation: translation || content,
      detectedLanguage: normalizeDetectedLanguageCode(parsed.detected_language ?? parsed.detectedLanguage)
    };
  }

  private async issueAzureSpeechToken(): Promise<string> {
    const response = await this.fetchWithTimeout(
      `https://${this.config.azureSpeechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": this.config.azureSpeechKey,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: ""
      }
    );

    if (!response.ok) {
      throw new Error(`Azure Speech validation failed: ${await parseError(response)}`);
    }

    return (await response.text()).trim();
  }

  private async translateWithAzureTranslator(text: string, targetLanguage: string): Promise<string> {
    this.assertAzureTranslatorConfigured();
    const endpoint = (this.config.azureTranslatorEndpoint?.trim() || DEFAULT_AZURE_TRANSLATOR_ENDPOINT).replace(/\/+$/, "");
    const response = await this.fetchWithTimeout(
      `${endpoint}/translate?api-version=3.0&to=${encodeURIComponent(targetLanguage)}`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": this.config.azureTranslatorKey!.trim(),
          "Ocp-Apim-Subscription-Region": this.config.azureTranslatorRegion!.trim(),
          "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify([{ Text: text }])
      }
    );

    if (!response.ok) {
      throw new Error(`Azure Translator failed: ${await parseError(response)}`);
    }

    const payload = (await response.json()) as AzureTranslatorResponseShape[];
    const translatedText = payload[0]?.translations?.[0]?.text?.trim() ?? "";
    if (!translatedText) {
      throw new Error("Azure Translator returned no translated text.");
    }

    return translatedText;
  }

  private async transcribeWithChatGpt(
    request: SpeechTurnRequest
  ): Promise<{ transcript: string; detectedLanguage?: string }> {
    if (!request.audioMimeType.trim()) {
      throw new Error("ChatGPT speech turn requires a valid audio MIME type.");
    }

    const formData = new FormData();
    const audioBytes = decodeBase64Audio(request.audioBase64);
    const extension = inferAudioExtension(request.audioMimeType);
    formData.append("file", new Blob([audioBytes], { type: request.audioMimeType }), `ptt-audio.${extension}`);
    formData.append("model", this.config.chatGptTranscribeModel);
    const languageHint = resolveChatGptTranscriptionLanguageHint(request.sourceLanguage);
    if (languageHint) {
      formData.append("language", languageHint);
    }
    const transcriptionPrompt = resolveChatGptTranscriptionPrompt(request.sourceLanguage, {
      alwaysInclude: this.config.chatGptSttLanguagePromptEnabled !== false
    });
    if (transcriptionPrompt) {
      formData.append("prompt", transcriptionPrompt);
    }

    const response = await this.fetchWithTimeout(CHATGPT_TRANSCRIPTION_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.chatGptApiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`ChatGPT transcription failed: ${await parseError(response)}`);
    }

    const payload = (await response.json()) as OpenAiTranscriptionShape;
    return {
      transcript: payload.text?.trim() ?? "",
      detectedLanguage: payload.language?.trim() || undefined
    };
  }

  private async fetchWithTimeout(input: string, init: RequestInit, timeoutMs = this.config.providerRequestTimeoutMs): Promise<Response> {
    const controller = new AbortController();
    const effectiveTimeoutMs = Math.max(1, timeoutMs);
    const timeoutHandle = setTimeout(() => controller.abort(), effectiveTimeoutMs);

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Provider request timed out after ${effectiveTimeoutMs}ms.`, { cause: error });
      }

      throw new Error(buildProviderTransportFailureMessage(error), { cause: error });
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private assertChatGptTranslationConfigured(): void {
    const missingKeys = [
      !this.config.chatGptApiKey.trim() ? "CHATGPT_API_KEY" : null,
      !this.config.chatGptModel.trim() ? "CHATGPT_MODEL" : null
    ].filter((value): value is string => value !== null);

    if (missingKeys.length > 0) {
      throw new Error(`ChatGPT translation is not configured. Missing ${missingKeys.join(", ")}.`);
    }
  }

  private assertAzureSpeechConfigured(): void {
    const missingKeys = [
      !this.config.azureSpeechKey.trim() ? "AZURE_SPEECH_KEY" : null,
      !this.config.azureSpeechRegion.trim() ? "AZURE_SPEECH_REGION" : null
    ].filter((value): value is string => value !== null);

    if (missingKeys.length > 0) {
      throw new Error(`Azure Speech is not configured. Missing ${missingKeys.join(", ")}.`);
    }
  }

  private assertAzureTranslatorConfigured(): void {
    const missingKeys = [
      !this.config.azureTranslatorKey?.trim() ? "AZURE_TRANSLATOR_KEY" : null,
      !this.config.azureTranslatorRegion?.trim() ? "AZURE_TRANSLATOR_REGION" : null
    ].filter((value): value is string => value !== null);

    if (missingKeys.length > 0) {
      throw new Error(`Azure Translator is not configured. Missing ${missingKeys.join(", ")}.`);
    }
  }

  private assertChatGptSpeechConfigured(): void {
    this.assertChatGptTranslationConfigured();

    if (!this.config.chatGptTranscribeModel.trim()) {
      throw new Error("ChatGPT speech recognition is not configured. Missing CHATGPT_TRANSCRIBE_MODEL.");
    }
  }

  private assertOllamaConfigured(): void {
    const missingKeys = [
      !this.config.ollamaBaseUrl.trim() ? "OLLAMA_BASE_URL" : null,
      !this.config.ollamaModel.trim() ? "OLLAMA_MODEL" : null
    ].filter((value): value is string => value !== null);

    if (missingKeys.length > 0) {
      throw new Error(`Ollama translation is not configured. Missing ${missingKeys.join(", ")}.`);
    }
  }

  private buildOllamaUrl(path: "/chat" | "/tags" | "/version"): string {
    const baseUrl = this.config.ollamaBaseUrl.trim().replace(/\/+$/, "");
    const normalizedBaseUrl = /\/api$/i.test(baseUrl) ? baseUrl : `${baseUrl}/api`;
    return `${normalizedBaseUrl}${path}`;
  }

  private buildOllamaHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      ...(this.config.ollamaApiKey.trim()
        ? { Authorization: `Bearer ${this.config.ollamaApiKey.trim()}` }
        : {})
    };
  }

  private async getOllamaVersion(): Promise<string> {
    const response = await this.fetchWithTimeout(
      this.buildOllamaUrl("/version"),
      {
        method: "GET",
        headers: this.buildOllamaHeaders()
      },
      this.config.ollamaRequestTimeoutMs
    );

    if (!response.ok) {
      throw new Error(`Ollama version check failed: ${await parseError(response)}`);
    }

    const payload = (await response.json()) as OllamaVersionResponseShape;
    const version = payload.version?.trim() ?? "";
    if (!version) {
      throw new Error("Ollama version check returned no version.");
    }

    return version;
  }

  private async assertOllamaModelAvailable(): Promise<void> {
    const response = await this.fetchWithTimeout(
      this.buildOllamaUrl("/tags"),
      {
        method: "GET",
        headers: this.buildOllamaHeaders()
      },
      this.config.ollamaRequestTimeoutMs
    );

    if (!response.ok) {
      throw new Error(`Ollama model inventory failed: ${await parseError(response)}`);
    }

    const payload = (await response.json()) as OllamaTagsResponseShape;
    const configuredModel = this.config.ollamaModel.trim();
    const availableModels = payload.models?.flatMap((model) => [model.name?.trim() ?? "", model.model?.trim() ?? ""]) ?? [];
    if (!availableModels.includes(configuredModel)) {
      throw new Error(`Ollama model '${configuredModel}' is not available on the configured server.`);
    }
  }

  private async readOllamaChatContent(response: Response): Promise<string> {
    if (!this.config.ollamaStreamingEnabled) {
      const payload = (await response.json()) as OllamaChatResponseShape;
      return payload.message?.content?.trim() ?? "";
    }

    const rawBody = await response.text();
    const chunks = rawBody
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as OllamaChatResponseShape;
        } catch {
          return null;
        }
      })
      .filter((value): value is OllamaChatResponseShape => value !== null);

    return chunks.map((chunk) => chunk.message?.content ?? "").join("").trim();
  }
}
