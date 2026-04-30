import type {
  AzureTextToSpeechCatalogSnapshot,
  AzureTextToSpeechVoice,
  StartTextToSpeechCommand
} from "../../shared/types.js";
import {
  ProviderPlayback,
  SynthesizedTextToSpeechAudio,
  TextToSpeechHandlers,
  TextToSpeechProvider,
  TextToSpeechProviderError,
  VoiceCandidate
} from "./text-to-speech-provider.js";

export const AZURE_TEXT_TO_SPEECH_INVALID_CREDENTIALS_ERROR_CODE = "tts_azure_invalid_credentials";
export const AZURE_TEXT_TO_SPEECH_THROTTLED_ERROR_CODE = "tts_azure_throttled";
export const AZURE_TEXT_TO_SPEECH_UPSTREAM_ERROR_CODE = "tts_azure_upstream";
export const AZURE_TEXT_TO_SPEECH_NETWORK_ERROR_CODE = "tts_azure_network";

const DEFAULT_AZURE_TEXT_TO_SPEECH_CACHE_TTL_MS = 5 * 60 * 1000;
const AZURE_TEXT_TO_SPEECH_OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";
const AZURE_TEXT_TO_SPEECH_USER_AGENT = "OnlySpeech/0.1";
const AZURE_TEXT_TO_SPEECH_AUDIO_MIME_TYPE = "audio/mpeg";

interface AzureTextToSpeechConfig {
  key: string;
  region: string;
}

interface AzureVoiceListEntry {
  ShortName?: string;
  DisplayName?: string;
  LocalName?: string;
  Locale?: string;
  LocaleName?: string;
  Gender?: string;
}

interface CachedAzureVoiceCatalog {
  voices: AzureTextToSpeechVoice[];
  fetchedAt: number;
  freshUntil: number;
}

interface AzureTextToSpeechProviderOptions {
  getConfig: () => AzureTextToSpeechConfig | null | Promise<AzureTextToSpeechConfig | null>;
  fetchImpl?: typeof fetch;
  cacheTtlMs?: number;
  now?: () => number;
  createAudio?: (sourceUrl: string) => HTMLAudioElement;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIsoString(timestamp: number | null): string | null {
  return timestamp === null ? null : new Date(timestamp).toISOString();
}

function createUnavailableCatalogSnapshot(
  region: string | null,
  error: string | null
): AzureTextToSpeechCatalogSnapshot {
  return {
    region,
    status: "unavailable",
    fetchedAt: null,
    freshUntil: null,
    voiceCount: 0,
    error,
    voices: []
  };
}

function mapAzureVoiceEntry(entry: AzureVoiceListEntry): AzureTextToSpeechVoice | null {
  const shortName = entry.ShortName?.trim() ?? "";
  const locale = entry.Locale?.trim() ?? "";
  if (!shortName || !locale) {
    return null;
  }

  const displayName = entry.DisplayName?.trim() || shortName;
  return {
    id: shortName,
    name: displayName,
    language: locale,
    engine: "azure",
    localeName: entry.LocaleName?.trim() || null,
    localName: entry.LocalName?.trim() || null,
    shortName,
    gender: entry.Gender?.trim() || null
  };
}

function buildVoiceCatalogUrl(region: string): string {
  return `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
}

function buildSynthesisUrl(region: string): string {
  return `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
}

function createSsml(command: StartTextToSpeechCommand, voice: VoiceCandidate): string {
  const xmlLanguage = voice.locale || command.language || "en-US";
  const escapedText = escapeXml(command.text);
  const body =
    command.azureTtsLangElementEnabled === false
      ? escapedText
      : `<lang xml:lang="${escapeXml(xmlLanguage)}">${escapedText}</lang>`;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<speak version="1.0" xml:lang="${escapeXml(xmlLanguage)}">`,
    `<voice name="${escapeXml(voice.id)}">${body}</voice>`,
    "</speak>"
  ].join("");
}

function normalizeProviderError(error: unknown): TextToSpeechProviderError {
  if (error instanceof TextToSpeechProviderError) {
    return error;
  }

  const detail = error instanceof Error && error.message.trim().length > 0 ? error.message.trim() : String(error);
  return new TextToSpeechProviderError({
    message: `Azure text-to-speech request failed: ${detail}`,
    engine: "azure",
    errorCode: AZURE_TEXT_TO_SPEECH_NETWORK_ERROR_CODE
  });
}

export function resolveAzureTextToSpeechConfigFromEnvironment(
  env: Record<string, string | undefined | null>
): AzureTextToSpeechConfig | null {
  const key = env.AZURE_SPEECH_KEY?.trim() ?? "";
  const region = env.AZURE_SPEECH_REGION?.trim() ?? "";
  if (!key || !region) {
    return null;
  }

  return { key, region };
}

export class AzureTextToSpeechProvider implements TextToSpeechProvider {
  readonly engine = "azure" as const;

  private static readonly catalogCache = new Map<string, CachedAzureVoiceCatalog>();

  constructor(private readonly options: AzureTextToSpeechProviderOptions) {}

  static resetCache(): void {
    this.catalogCache.clear();
  }

  isSupported(): boolean {
    return (
      typeof this.getFetchImpl() === "function" &&
      typeof Blob !== "undefined" &&
      typeof Audio !== "undefined" &&
      typeof URL !== "undefined" &&
      typeof URL.createObjectURL === "function" &&
      typeof URL.revokeObjectURL === "function"
    );
  }

  async getCatalogSnapshot(): Promise<AzureTextToSpeechCatalogSnapshot> {
    const config = await this.resolveConfig(false);
    if (!config) {
      return createUnavailableCatalogSnapshot(
        null,
        "Azure text-to-speech credentials are not configured."
      );
    }

    try {
      const result = await this.loadCatalog(config);
      return {
        region: config.region,
        status: result.status,
        fetchedAt: toIsoString(result.catalog.fetchedAt),
        freshUntil: toIsoString(result.catalog.freshUntil),
        voiceCount: result.catalog.voices.length,
        error: result.error,
        voices: result.catalog.voices.map((voice) => ({ ...voice }))
      };
    } catch (error) {
      const normalizedError = normalizeProviderError(error);
      return createUnavailableCatalogSnapshot(config.region, normalizedError.message);
    }
  }

  async listVoices(): Promise<VoiceCandidate[]> {
    const config = await this.resolveConfig(true);
    if (!config) {
      throw new TextToSpeechProviderError({
        message: "Azure text-to-speech credentials are not configured.",
        engine: this.engine,
        eventType: "unavailable"
      });
    }
    const result = await this.loadCatalog(config);
    return result.catalog.voices.map((voice) => ({
      id: voice.id,
      name: voice.name,
      locale: voice.language
    }));
  }

  async start(
    command: StartTextToSpeechCommand,
    voice: VoiceCandidate,
    handlers: TextToSpeechHandlers
  ): Promise<ProviderPlayback> {
    const synthesis = await this.synthesize(command, voice);
    const audioUrl = URL.createObjectURL(
      new Blob([synthesis.audioBuffer], { type: synthesis.audioMimeType })
    );
    const audio = this.createAudio(audioUrl);
    let active = true;
    let started = false;
    let released = false;

    const cleanup = () => {
      if (released) {
        return;
      }

      released = true;
      URL.revokeObjectURL(audioUrl);
    };

    const emitStarted = () => {
      if (!active || started) {
        return;
      }

      started = true;
      handlers.onEvent({
        type: "started",
        side: command.side,
        content: command.content,
        requestId: command.requestId,
        engine: this.engine,
        language: synthesis.language,
        voiceName: synthesis.voiceName
      });
    };

    audio.onplaying = () => {
      emitStarted();
    };

    audio.onended = () => {
      if (!active) {
        return;
      }

      active = false;
      cleanup();
      handlers.onEvent({
        type: "ended",
        side: command.side,
        content: command.content,
        requestId: command.requestId,
        engine: this.engine,
        language: synthesis.language,
        voiceName: synthesis.voiceName
      });
    };

    audio.onerror = () => {
      if (!active) {
        return;
      }

      active = false;
      cleanup();
      handlers.onEvent({
        type: "error",
        side: command.side,
        content: command.content,
        requestId: command.requestId,
        engine: this.engine,
        language: synthesis.language,
        voiceName: synthesis.voiceName,
        error: "Azure text-to-speech playback failed after synthesis."
      });
    };

    try {
      await audio.play();
      emitStarted();
    } catch (error) {
      active = false;
      cleanup();
      const detail =
        error instanceof Error && error.message.trim().length > 0 ? error.message.trim() : String(error);
      throw new TextToSpeechProviderError({
        message: `Azure text-to-speech playback could not start: ${detail}`,
        engine: this.engine
      });
    }

    return {
      engine: this.engine,
      stop: async () => {
        if (!active) {
          cleanup();
          return synthesis.voiceName;
        }

        active = false;
        audio.pause();
        audio.currentTime = 0;
        cleanup();
        return synthesis.voiceName;
      }
    };
  }

  async synthesize(
    command: StartTextToSpeechCommand,
    voice: VoiceCandidate
  ): Promise<SynthesizedTextToSpeechAudio> {
    const config = await this.resolveConfig(true);
    if (!config) {
      throw new TextToSpeechProviderError({
        message: "Azure text-to-speech credentials are not configured.",
        engine: this.engine,
        eventType: "unavailable"
      });
    }
    const response = await this.fetchWithErrorMapping(buildSynthesisUrl(config.region), {
      method: "POST",
      headers: {
        "Content-Type": "application/ssml+xml",
        "Ocp-Apim-Subscription-Key": config.key,
        "User-Agent": AZURE_TEXT_TO_SPEECH_USER_AGENT,
        "X-Microsoft-OutputFormat": AZURE_TEXT_TO_SPEECH_OUTPUT_FORMAT
      },
      body: createSsml(command, voice)
    });
    const audioBuffer = await response.arrayBuffer();
    if (audioBuffer.byteLength === 0) {
      throw new TextToSpeechProviderError({
        message: "Azure text-to-speech returned an empty audio payload.",
        engine: this.engine,
        errorCode: AZURE_TEXT_TO_SPEECH_UPSTREAM_ERROR_CODE
      });
    }

    return {
      audioBuffer,
      audioMimeType: AZURE_TEXT_TO_SPEECH_AUDIO_MIME_TYPE,
      engine: this.engine,
      language: voice.locale,
      voiceName: voice.name
    };
  }

  private createAudio(sourceUrl: string): HTMLAudioElement {
    return this.options.createAudio ? this.options.createAudio(sourceUrl) : new Audio(sourceUrl);
  }

  private getFetchImpl(): typeof fetch {
    return this.options.fetchImpl ?? fetch;
  }

  private getNow(): number {
    return this.options.now ? this.options.now() : Date.now();
  }

  private getCacheTtlMs(): number {
    return this.options.cacheTtlMs ?? DEFAULT_AZURE_TEXT_TO_SPEECH_CACHE_TTL_MS;
  }

  private async resolveConfig(required: boolean): Promise<AzureTextToSpeechConfig | null> {
    const config = await this.options.getConfig();
    const key = config?.key?.trim() ?? "";
    const region = config?.region?.trim() ?? "";
    if (!key || !region) {
      if (!required) {
        return null;
      }

      throw new TextToSpeechProviderError({
        message: "Azure text-to-speech credentials are not configured.",
        engine: this.engine,
        eventType: "unavailable"
      });
    }

    return { key, region };
  }

  private async loadCatalog(
    config: AzureTextToSpeechConfig
  ): Promise<{
    catalog: CachedAzureVoiceCatalog;
    status: AzureTextToSpeechCatalogSnapshot["status"];
    error: string | null;
  }> {
    const now = this.getNow();
    const cachedCatalog = AzureTextToSpeechProvider.catalogCache.get(config.region) ?? null;
    if (cachedCatalog && cachedCatalog.freshUntil > now) {
      return {
        catalog: cachedCatalog,
        status: "fresh",
        error: null
      };
    }

    try {
      const response = await this.fetchWithErrorMapping(buildVoiceCatalogUrl(config.region), {
        method: "GET",
        headers: {
          "Ocp-Apim-Subscription-Key": config.key
        }
      });
      const payload = (await response.json()) as AzureVoiceListEntry[];
      const voices = Array.isArray(payload)
        ? payload.map(mapAzureVoiceEntry).filter((voice): voice is AzureTextToSpeechVoice => voice !== null)
        : [];
      const nextCatalog: CachedAzureVoiceCatalog = {
        voices,
        fetchedAt: now,
        freshUntil: now + this.getCacheTtlMs()
      };
      AzureTextToSpeechProvider.catalogCache.set(config.region, nextCatalog);
      return {
        catalog: nextCatalog,
        status: "fresh",
        error: null
      };
    } catch (error) {
      const normalizedError = normalizeProviderError(error);
      if (
        cachedCatalog &&
        normalizedError.errorCode === AZURE_TEXT_TO_SPEECH_NETWORK_ERROR_CODE
      ) {
        return {
          catalog: cachedCatalog,
          status: "stale",
          error: normalizedError.message
        };
      }

      throw normalizedError;
    }
  }

  private async fetchWithErrorMapping(
    input: string,
    init: RequestInit
  ): Promise<Response> {
    try {
      const response = await this.getFetchImpl()(input, init);
      if (response.ok) {
        return response;
      }

      throw this.mapResponseToError(response);
    } catch (error) {
      if (error instanceof TextToSpeechProviderError) {
        throw error;
      }

      const detail =
        error instanceof Error && error.message.trim().length > 0 ? error.message.trim() : String(error);
      throw new TextToSpeechProviderError({
        message: `Azure text-to-speech network request failed: ${detail}`,
        engine: this.engine,
        errorCode: AZURE_TEXT_TO_SPEECH_NETWORK_ERROR_CODE
      });
    }
  }

  private mapResponseToError(response: Response): TextToSpeechProviderError {
    const status = response.status;
    if (status === 401) {
      return new TextToSpeechProviderError({
        message: "Azure text-to-speech credentials are invalid.",
        engine: this.engine,
        errorCode: AZURE_TEXT_TO_SPEECH_INVALID_CREDENTIALS_ERROR_CODE
      });
    }

    if (status === 429) {
      return new TextToSpeechProviderError({
        message: "Azure text-to-speech is throttling requests.",
        engine: this.engine,
        errorCode: AZURE_TEXT_TO_SPEECH_THROTTLED_ERROR_CODE
      });
    }

    if (status >= 500) {
      return new TextToSpeechProviderError({
        message: `Azure text-to-speech upstream failed with status ${status}.`,
        engine: this.engine,
        errorCode: AZURE_TEXT_TO_SPEECH_UPSTREAM_ERROR_CODE
      });
    }

    return new TextToSpeechProviderError({
      message: `Azure text-to-speech request failed with status ${status}.`,
      engine: this.engine
    });
  }
}
