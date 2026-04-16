import { buildCommonProviderInteractionLanguageChoices } from "../../shared/language-flow.js";
import type { StartTextToSpeechCommand } from "../../shared/types.js";
import {
  ProviderPlayback,
  SynthesizedTextToSpeechAudio,
  TextToSpeechHandlers,
  TextToSpeechProvider,
  TextToSpeechProviderError,
  VoiceCandidate
} from "./text-to-speech-provider.js";

export const OPENAI_TEXT_TO_SPEECH_INVALID_CREDENTIALS_ERROR_CODE = "tts_openai_invalid_credentials";
export const OPENAI_TEXT_TO_SPEECH_THROTTLED_ERROR_CODE = "tts_openai_throttled";
export const OPENAI_TEXT_TO_SPEECH_UPSTREAM_ERROR_CODE = "tts_openai_upstream";
export const OPENAI_TEXT_TO_SPEECH_NETWORK_ERROR_CODE = "tts_openai_network";

const OPENAI_TEXT_TO_SPEECH_ENDPOINT = "https://api.openai.com/v1/audio/speech";
const DEFAULT_OPENAI_TEXT_TO_SPEECH_MODEL = "gpt-4o-mini-tts";
const DEFAULT_OPENAI_TEXT_TO_SPEECH_VOICE = "alloy";
const OPENAI_TEXT_TO_SPEECH_AUDIO_MIME_TYPE = "audio/mpeg";

interface OpenAiTextToSpeechConfig {
  apiKey: string;
  model: string;
  voice: string;
}

interface OpenAiTextToSpeechProviderOptions {
  getConfig: () => OpenAiTextToSpeechConfig | null | Promise<OpenAiTextToSpeechConfig | null>;
  fetchImpl?: typeof fetch;
  createAudio?: (sourceUrl: string) => HTMLAudioElement;
}

function buildVoiceCandidates(): VoiceCandidate[] {
  return buildCommonProviderInteractionLanguageChoices("chatgpt").map((choice) => ({
    id: `${DEFAULT_OPENAI_TEXT_TO_SPEECH_VOICE}:${choice.value}`,
    name: `OpenAI ${DEFAULT_OPENAI_TEXT_TO_SPEECH_VOICE}`,
    locale: choice.sourceLocale
  }));
}

function normalizeProviderError(error: unknown): TextToSpeechProviderError {
  if (error instanceof TextToSpeechProviderError) {
    return error;
  }

  const detail = error instanceof Error && error.message.trim().length > 0 ? error.message.trim() : String(error);
  return new TextToSpeechProviderError({
    message: `OpenAI text-to-speech request failed: ${detail}`,
    engine: "openai",
    errorCode: OPENAI_TEXT_TO_SPEECH_NETWORK_ERROR_CODE
  });
}

export class OpenAiTextToSpeechProvider implements TextToSpeechProvider {
  readonly engine = "openai" as const;

  constructor(private readonly options: OpenAiTextToSpeechProviderOptions) {}

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

  async listVoices(): Promise<VoiceCandidate[]> {
    await this.resolveConfig(true);
    return buildVoiceCandidates();
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
        error: "OpenAI text-to-speech playback failed after synthesis."
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
        message: `OpenAI text-to-speech playback could not start: ${detail}`,
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
    const response = await this.fetchWithErrorMapping(OPENAI_TEXT_TO_SPEECH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        voice: config.voice,
        input: command.text,
        response_format: "mp3"
      })
    });
    const audioBuffer = await response.arrayBuffer();
    if (audioBuffer.byteLength === 0) {
      throw new TextToSpeechProviderError({
        message: "OpenAI text-to-speech returned an empty audio payload.",
        engine: this.engine,
        errorCode: OPENAI_TEXT_TO_SPEECH_UPSTREAM_ERROR_CODE
      });
    }

    return {
      audioBuffer,
      audioMimeType: OPENAI_TEXT_TO_SPEECH_AUDIO_MIME_TYPE,
      engine: this.engine,
      language: command.language ?? voice.locale,
      voiceName: voice.name
    };
  }

  private createAudio(sourceUrl: string): HTMLAudioElement {
    return this.options.createAudio ? this.options.createAudio(sourceUrl) : new Audio(sourceUrl);
  }

  private getFetchImpl(): typeof fetch {
    return this.options.fetchImpl ?? fetch;
  }

  private async resolveConfig(required: boolean): Promise<OpenAiTextToSpeechConfig> {
    const config = await this.options.getConfig();
    const apiKey = config?.apiKey?.trim() ?? "";
    const model = config?.model?.trim() || DEFAULT_OPENAI_TEXT_TO_SPEECH_MODEL;
    const voice = config?.voice?.trim() || DEFAULT_OPENAI_TEXT_TO_SPEECH_VOICE;

    if (!apiKey) {
      if (!required) {
        return {
          apiKey,
          model,
          voice
        };
      }

      throw new TextToSpeechProviderError({
        message: "OpenAI text-to-speech credentials are not configured.",
        engine: this.engine,
        eventType: "unavailable"
      });
    }

    return {
      apiKey,
      model,
      voice
    };
  }

  private async fetchWithErrorMapping(input: string, init: RequestInit): Promise<Response> {
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

      throw normalizeProviderError(error);
    }
  }

  private mapResponseToError(response: Response): TextToSpeechProviderError {
    const status = response.status;
    if (status === 401) {
      return new TextToSpeechProviderError({
        message: "OpenAI text-to-speech credentials are invalid.",
        engine: this.engine,
        errorCode: OPENAI_TEXT_TO_SPEECH_INVALID_CREDENTIALS_ERROR_CODE
      });
    }

    if (status === 429) {
      return new TextToSpeechProviderError({
        message: "OpenAI text-to-speech is throttling requests.",
        engine: this.engine,
        errorCode: OPENAI_TEXT_TO_SPEECH_THROTTLED_ERROR_CODE
      });
    }

    if (status >= 500) {
      return new TextToSpeechProviderError({
        message: `OpenAI text-to-speech upstream failed with status ${status}.`,
        engine: this.engine,
        errorCode: OPENAI_TEXT_TO_SPEECH_UPSTREAM_ERROR_CODE
      });
    }

    return new TextToSpeechProviderError({
      message: `OpenAI text-to-speech request failed with status ${status}.`,
      engine: this.engine
    });
  }
}
