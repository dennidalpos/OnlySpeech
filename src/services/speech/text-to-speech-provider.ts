import type {
  StartTextToSpeechCommand,
  TextToSpeechEngine,
  TextToSpeechEventPayload
} from "../../shared/types.js";

export interface TextToSpeechHandlers {
  onEvent: (event: TextToSpeechEventPayload) => void;
}

export interface VoiceCandidate {
  id: string;
  name: string;
  locale: string;
}

export interface ProviderPlayback {
  engine: TextToSpeechEngine;
  stop: () => Promise<string | null>;
  utterance?: SpeechSynthesisUtterance | null;
}

export interface SynthesizedTextToSpeechAudio {
  audioBuffer: ArrayBuffer;
  audioMimeType: string;
  engine: TextToSpeechEngine;
  language: string | null;
  voiceName: string | null;
}

export interface TextToSpeechProvider {
  engine: TextToSpeechEngine;
  isSupported: () => boolean;
  listVoices: () => Promise<VoiceCandidate[]>;
  start: (
    command: StartTextToSpeechCommand,
    voice: VoiceCandidate,
    handlers: TextToSpeechHandlers
  ) => Promise<ProviderPlayback>;
}

export class TextToSpeechProviderError extends Error {
  readonly engine: TextToSpeechEngine;

  readonly eventType: Extract<TextToSpeechEventPayload["type"], "error" | "unavailable">;

  readonly errorCode?: string;

  constructor(options: {
    message: string;
    engine: TextToSpeechEngine;
    eventType?: Extract<TextToSpeechEventPayload["type"], "error" | "unavailable">;
    errorCode?: string;
  }) {
    super(options.message);
    this.name = "TextToSpeechProviderError";
    this.engine = options.engine;
    this.eventType = options.eventType ?? "error";
    this.errorCode = options.errorCode;
  }
}
