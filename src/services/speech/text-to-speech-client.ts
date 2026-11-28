import { pickBestMatchingTextToSpeechVoice } from "../../shared/text-to-speech-policy.js";
import type {
  StartTextToSpeechCommand,
  StopTextToSpeechCommand,
  TextToSpeechEngine,
  TextToSpeechEventPayload,
  TextToSpeechSynthesisResult,
  TextToSpeechSynthesisResponse
} from "../../shared/types.js";
import { AzureTextToSpeechProvider } from "./azure-text-to-speech-provider.js";
import { OpenAiTextToSpeechProvider } from "./openai-text-to-speech-provider.js";
import {
  ProviderPlayback,
  SynthesizedTextToSpeechAudio,
  TextToSpeechHandlers,
  TextToSpeechProvider,
  TextToSpeechProviderError,
  VoiceCandidate
} from "./text-to-speech-provider.js";

interface ActivePlayback {
  command: StartTextToSpeechCommand;
  playback: ProviderPlayback;
}

interface TextToSpeechClientOptions {
  synthesizeTextToSpeech?: (
    command: StartTextToSpeechCommand
  ) => Promise<TextToSpeechSynthesisResponse>;
  createAudio?: (sourceUrl: string) => HTMLAudioElement;
}

function resolveRequestedEngine(command: StartTextToSpeechCommand): TextToSpeechEngine {
  if (command.translationProvider === "azure") {
    return "azure";
  }

  if (command.translationProvider === "chatgpt") {
    return "openai";
  }

  return command.engine;
}

function createUnavailableEvent(
  command: StartTextToSpeechCommand,
  error: string,
  engine: TextToSpeechEngine
): TextToSpeechEventPayload {
  return {
    type: "unavailable",
    side: command.side,
    content: command.content,
    requestId: command.requestId,
    engine,
    language: command.language,
    error
  };
}

function createProviderErrorEvent(
  command: StartTextToSpeechCommand,
  error: TextToSpeechProviderError
): TextToSpeechEventPayload {
  return {
    type: error.eventType,
    side: command.side,
    content: command.content,
    requestId: command.requestId,
    engine: error.engine,
    language: command.language,
    error: error.message,
    errorCode: error.errorCode
  };
}

export class TextToSpeechClient {
  private activePlayback: ActivePlayback | null = null;

  private currentAzureSpeechConfig: { key: string; region: string } | null = null;

  private currentOpenAiSpeechConfig: { apiKey: string; model: string; voice: string } | null = null;

  private readonly providers: TextToSpeechProvider[];

  constructor(private readonly options: TextToSpeechClientOptions = {}) {
    this.providers = [
      new AzureTextToSpeechProvider({
        getConfig: async () => this.currentAzureSpeechConfig,
        createAudio: this.options.createAudio
      }),
      new OpenAiTextToSpeechProvider({
        getConfig: async () => this.currentOpenAiSpeechConfig,
        createAudio: this.options.createAudio
      })
    ];
  }

  private getProviderByEngine(engine: TextToSpeechEngine): TextToSpeechProvider | null {
    return this.providers.find((candidate) => candidate.engine === engine) ?? null;
  }

  async start(command: StartTextToSpeechCommand, handlers: TextToSpeechHandlers): Promise<void> {
    await this.cancelActivePlayback();
    this.currentAzureSpeechConfig =
      command.azureSpeechKey?.trim() && command.azureSpeechRegion?.trim()
        ? {
            key: command.azureSpeechKey.trim(),
            region: command.azureSpeechRegion.trim()
          }
        : null;
    this.currentOpenAiSpeechConfig = command.chatGptApiKey?.trim()
      ? {
          apiKey: command.chatGptApiKey.trim(),
          model: command.chatGptTextToSpeechModel?.trim() || "gpt-4o-mini-tts",
          voice: command.chatGptTextToSpeechVoice?.trim() || "alloy"
        }
      : null;

    const text = command.text.trim();
    const engine = resolveRequestedEngine(command);
    if (!text) {
      handlers.onEvent(createUnavailableEvent(command, "No text is available for playback.", engine));
      return;
    }

    if (!this.isPlaybackSupported()) {
      handlers.onEvent(
        createUnavailableEvent(command, "Provider-owned text-to-speech playback is unavailable in this renderer.", engine)
      );
      return;
    }

    if (this.options.synthesizeTextToSpeech) {
      await this.startWithSynthesis(command, handlers);
      return;
    }

    const provider = this.getProviderByEngine(engine);
    if (!provider || !provider.isSupported()) {
      handlers.onEvent(
        createUnavailableEvent(command, "Provider-owned text-to-speech is unavailable in this renderer.", engine)
      );
      return;
    }

    let voices: VoiceCandidate[];
    try {
      voices = await provider.listVoices();
    } catch (error) {
      if (error instanceof TextToSpeechProviderError) {
        handlers.onEvent(createProviderErrorEvent(command, error));
        return;
      }
      throw error;
    }

    const voice = pickBestMatchingTextToSpeechVoice(voices, command.language);
    if (!voice) {
      handlers.onEvent(
        createUnavailableEvent(
          command,
          engine === "azure"
            ? "Azure text-to-speech does not expose a compatible voice for the selected language."
            : "OpenAI text-to-speech does not expose the shared kiosk catalog for the selected language.",
          engine
        )
      );
      return;
    }

    let playback: ProviderPlayback;
    try {
      playback = await provider.start(command, voice, handlers);
    } catch (error) {
      if (error instanceof TextToSpeechProviderError) {
        handlers.onEvent(createProviderErrorEvent(command, error));
        return;
      }
      throw error;
    }

    this.activePlayback = {
      command,
      playback
    };
  }

  private isPlaybackSupported(): boolean {
    return (
      typeof Blob !== "undefined" &&
      typeof Audio !== "undefined" &&
      typeof URL !== "undefined" &&
      typeof URL.createObjectURL === "function" &&
      typeof URL.revokeObjectURL === "function"
    );
  }

  private createAudio(sourceUrl: string): HTMLAudioElement {
    return this.options.createAudio ? this.options.createAudio(sourceUrl) : new Audio(sourceUrl);
  }

  private decodeAudioBase64(audioBase64: string): Uint8Array {
    if (typeof atob === "function") {
      const decoded = atob(audioBase64);
      const bytes = new Uint8Array(decoded.length);
      for (let index = 0; index < decoded.length; index += 1) {
        bytes[index] = decoded.charCodeAt(index);
      }
      return bytes;
    }

    if (typeof Buffer !== "undefined") {
      return Uint8Array.from(Buffer.from(audioBase64, "base64"));
    }

    throw new Error("No base64 decoder is available in this renderer.");
  }

  private async startWithSynthesis(
    command: StartTextToSpeechCommand,
    handlers: TextToSpeechHandlers
  ): Promise<void> {
    const response = await this.options.synthesizeTextToSpeech?.(command);
    if (!response) {
      handlers.onEvent(
        createUnavailableEvent(command, "Provider-owned text-to-speech synthesis is unavailable.", resolveRequestedEngine(command))
      );
      return;
    }

    if (!response.ok) {
      handlers.onEvent({
        type: response.eventType,
        side: command.side,
        content: command.content,
        requestId: command.requestId,
        engine: response.engine,
        language: command.language,
        error: response.message,
        errorCode: response.errorCode
      });
      return;
    }

    let playback: ProviderPlayback;
    try {
      playback = await this.playSynthesizedAudio(command, response.synthesis, handlers);
    } catch (error) {
      if (error instanceof TextToSpeechProviderError) {
        handlers.onEvent(createProviderErrorEvent(command, error));
        return;
      }
      throw error;
    }

    this.activePlayback = {
      command,
      playback
    };
  }

  private async playSynthesizedAudio(
    command: StartTextToSpeechCommand,
    synthesis: SynthesizedTextToSpeechAudio | TextToSpeechSynthesisResult,
    handlers: TextToSpeechHandlers
  ): Promise<ProviderPlayback> {
    const audioBytes =
      "audioBuffer" in synthesis
        ? new Uint8Array(synthesis.audioBuffer)
        : this.decodeAudioBase64(synthesis.audioBase64);
    const normalizedAudioBytes = new Uint8Array(audioBytes.byteLength);
    normalizedAudioBytes.set(audioBytes);
    const audioUrl = URL.createObjectURL(
      new Blob([normalizedAudioBytes], { type: synthesis.audioMimeType })
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
        engine: synthesis.engine,
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
        engine: synthesis.engine,
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
        engine: synthesis.engine,
        language: synthesis.language,
        voiceName: synthesis.voiceName,
        error: `${synthesis.engine === "azure" ? "Azure" : "OpenAI"} text-to-speech playback failed after synthesis.`
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
        message: `${synthesis.engine === "azure" ? "Azure" : "OpenAI"} text-to-speech playback could not start: ${detail}`,
        engine: synthesis.engine
      });
    }

    return {
      engine: synthesis.engine,
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

  async stop(command: StopTextToSpeechCommand, handlers: TextToSpeechHandlers): Promise<void> {
    const activePlayback = this.activePlayback;
    if (!activePlayback) {
      return;
    }

    if (command.requestId && command.requestId !== activePlayback.command.requestId) {
      return;
    }

    const voiceName = await this.cancelActivePlayback();
    handlers.onEvent({
      type: "stopped",
      side: activePlayback.command.side,
      content: activePlayback.command.content,
      requestId: activePlayback.command.requestId,
      engine: activePlayback.playback.engine,
      language: activePlayback.command.language,
      voiceName
    });
  }

  shutdown(): void {
    void this.cancelActivePlayback();
  }

  private async cancelActivePlayback(): Promise<string | null> {
    const activePlayback = this.activePlayback;
    this.activePlayback = null;
    if (!activePlayback) {
      return null;
    }

    return await activePlayback.playback.stop();
  }
}
