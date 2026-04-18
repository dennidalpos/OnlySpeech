import type {
  AppState,
  Side,
  TextToSpeechEventPayload,
  TextToSpeechEngine,
  TextToSpeechRequest,
  TextToSpeechState,
  TranslationProvider
} from "../shared/types.js";
import { JsonlLogger } from "../services/logging/jsonl-logger.js";
import { SessionStore } from "../services/session/session-store.js";

interface KioskTextToSpeechControllerOptions {
  sessionStore: SessionStore;
  logger: JsonlLogger;
  getState: () => AppState;
  broadcastState: () => void;
  azureSpeechKey: string;
  azureSpeechRegion: string;
  chatGptApiKey: string;
  sendCommand: (
    side: Side,
    command:
      | {
          type: "start-tts";
          side: Side;
          content: TextToSpeechRequest["content"];
          requestId: string;
          text: string;
          language: string | null;
          engine: TextToSpeechEngine;
          translationProvider?: TranslationProvider | null;
          azureSpeechKey?: string | null;
          azureSpeechRegion?: string | null;
          chatGptApiKey?: string | null;
          chatGptTextToSpeechModel?: string | null;
          chatGptTextToSpeechVoice?: string | null;
        }
      | {
          type: "stop-tts";
          side: Side;
          requestId: string | null;
          reason?: string;
        }
  ) => void;
}

function resolveProviderEngine(provider: TranslationProvider): TextToSpeechEngine | null {
  if (provider === "azure") {
    return "azure";
  }

  if (provider === "chatgpt") {
    return "openai";
  }

  return null;
}

function createPlaybackState(
  request: TextToSpeechRequest,
  requestId: string,
  status: TextToSpeechState["status"],
  engine: TextToSpeechEngine
): TextToSpeechState {
  return {
    side: request.side,
    content: request.content,
    requestId,
    status,
    engine,
    language: request.language,
    voiceName: null,
    error: null
  };
}

export class KioskTextToSpeechController {
  private requestSequence = 0;

  constructor(private readonly options: KioskTextToSpeechControllerOptions) {}

  requestPlayback(request: TextToSpeechRequest): void {
    const text = request.text.trim();
    const engine = resolveProviderEngine(this.options.getState().translationProvider);
    if (!engine) {
      this.options.sessionStore.setTextToSpeechState({
        side: request.side,
        content: request.content,
        requestId: null,
        status: "unavailable",
        engine: "openai",
        language: request.language,
        voiceName: null,
        error: "The selected provider does not expose runtime text-to-speech playback."
      });
      this.options.logger.log({
        session_id: this.options.getState().sessionId,
        side: request.side,
        event: "tts_blocked",
        details: {
          content: request.content,
          reason: "provider_tts_unavailable"
        }
      });
      this.options.broadcastState();
      return;
    }

    if (!this.options.getState().textToSpeechEnabled) {
      this.options.sessionStore.setTextToSpeechState({
        side: request.side,
        content: request.content,
        requestId: null,
        status: "unavailable",
        engine,
        language: request.language,
        voiceName: null,
        error: "Audio playback is disabled in the current runtime configuration."
      });
      this.options.logger.log({
        session_id: this.options.getState().sessionId,
        side: request.side,
        event: "tts_blocked",
        details: {
          content: request.content,
          reason: "runtime_disabled"
        }
      });
      this.options.broadcastState();
      return;
    }

    if (!text) {
      this.options.sessionStore.setTextToSpeechState({
        side: request.side,
        content: request.content,
        requestId: null,
        status: "unavailable",
        engine,
        language: request.language,
        voiceName: null,
        error: "No text is available for playback."
      });
      this.options.broadcastState();
      return;
    }

    if (this.options.getState().activeSide) {
      this.options.sessionStore.setTextToSpeechState({
        side: request.side,
        content: request.content,
        requestId: null,
        status: "unavailable",
        engine,
        language: request.language,
        voiceName: null,
        error: "Audio playback is unavailable while live microphone capture is active."
      });
      this.options.logger.log({
        session_id: this.options.getState().sessionId,
        side: request.side,
        event: "tts_blocked",
        details: {
          content: request.content,
          reason: "live_capture_active"
        }
      });
      this.options.broadcastState();
      return;
    }

    this.stopPlayback("superseded", false);

    const requestId = `tts-${++this.requestSequence}`;
    this.options.sessionStore.setTextToSpeechState(createPlaybackState(request, requestId, "starting", engine));
    this.options.logger.log({
      session_id: this.options.getState().sessionId,
      side: request.side,
      event: "tts_requested",
      details: {
        content: request.content,
        engine,
        language: request.language
      }
    });
    this.options.sendCommand(request.side, {
      type: "start-tts",
      side: request.side,
      content: request.content,
      requestId,
      text,
      language: request.language,
      engine,
      translationProvider: this.options.getState().translationProvider,
      azureSpeechKey:
        this.options.getState().translationProvider === "azure"
          ? this.options.azureSpeechKey
          : null,
      azureSpeechRegion:
        this.options.getState().translationProvider === "azure"
          ? this.options.azureSpeechRegion
          : null,
      chatGptApiKey:
        this.options.getState().translationProvider === "chatgpt"
          ? this.options.chatGptApiKey
          : null
    });
    this.options.broadcastState();
  }

  stopPlayback(reason = "manual", broadcastState = true): void {
    const state = this.options.getState().textToSpeech;
    if (!state.side && !state.requestId) {
      return;
    }

    this.options.sendCommand("A", {
      type: "stop-tts",
      side: "A",
      requestId: state.requestId,
      reason
    });
    this.options.sendCommand("B", {
      type: "stop-tts",
      side: "B",
      requestId: state.requestId,
      reason
    });

    if (state.requestId) {
      this.options.logger.log({
        session_id: this.options.getState().sessionId,
        side: state.side ?? undefined,
        event: "tts_stopped",
        details: {
          content: state.content,
          reason
        }
      });
    }

    this.options.sessionStore.clearTextToSpeechState();
    if (broadcastState) {
      this.options.broadcastState();
    }
  }

  stopPlaybackForPanel(side: Side, content: TextToSpeechRequest["content"], reason = "manual"): void {
    const state = this.options.getState().textToSpeech;
    if (state.side !== side || state.content !== content) {
      return;
    }

    this.stopPlayback(reason);
  }

  handleEvent(event: TextToSpeechEventPayload): void {
    const state = this.options.getState().textToSpeech;
    if (state.requestId !== event.requestId) {
      return;
    }

    switch (event.type) {
      case "started":
        this.options.sessionStore.setTextToSpeechState({
          ...state,
          status: "playing",
          engine: event.engine,
          voiceName: event.voiceName ?? null,
          error: null
        });
        this.options.logger.log({
          session_id: this.options.getState().sessionId,
          side: event.side,
          event: "tts_started",
          details: {
            content: event.content,
            engine: event.engine,
            language: event.language,
            voiceName: event.voiceName ?? null
          }
        });
        this.options.broadcastState();
        return;
      case "ended":
        this.options.logger.log({
          session_id: this.options.getState().sessionId,
          side: event.side,
          event: "tts_completed",
          details: {
            content: event.content,
            engine: event.engine,
            language: event.language,
            voiceName: event.voiceName ?? null
          }
        });
        this.options.sessionStore.clearTextToSpeechState();
        this.options.broadcastState();
        return;
      case "stopped":
        this.options.sessionStore.clearTextToSpeechState();
        this.options.broadcastState();
        return;
      case "unavailable":
      case "error":
        this.options.sessionStore.setTextToSpeechState({
          side: event.side,
          content: event.content,
          requestId: null,
          status: event.type === "unavailable" ? "unavailable" : "error",
          engine: event.engine,
          language: event.language,
          voiceName: event.voiceName ?? null,
          error: event.error ?? (event.type === "unavailable" ? "Audio playback is unavailable." : "Audio playback failed.")
        });
        this.options.logger.log({
          session_id: this.options.getState().sessionId,
          side: event.side,
          event: event.type === "unavailable" ? "tts_unavailable" : "tts_error",
          details: {
            content: event.content,
            engine: event.engine,
            language: event.language,
            voiceName: event.voiceName ?? null
          },
          error: event.error ?? null
        });
        this.options.broadcastState();
        return;
      default:
        return;
    }
  }
}
