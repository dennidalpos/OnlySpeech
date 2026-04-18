import { resolveProviderTargetLanguageCode } from "../../shared/language-registry.js";
import { getOnlySpeechRendererApi } from "../../shared/onlyspeech-api.js";
import { reportRuntimeDiagnostic } from "../../shared/runtime-diagnostics.js";
import { getProviderAdapter } from "./provider-adapters.js";
import type {
  SpeechEventPayload,
  SpeechStartCommand,
  SpeechTurnPartialDiagnostic
} from "../../shared/types.js";

type SpeechSdkModule = typeof import("microsoft-cognitiveservices-speech-sdk");

interface SpeechHandlers {
  onEvent: (event: SpeechEventPayload) => void;
}

interface RecognizerLike {
  recognizing?: unknown;
  recognized?: unknown;
  canceled?: unknown;
  sessionStarted?: unknown;
  sessionStopped?: unknown;
  startContinuousRecognitionAsync: (cb?: () => void, err?: (error: string) => void) => void;
  stopContinuousRecognitionAsync: (cb?: () => void, err?: (error: string) => void) => void;
  close: () => void;
}

type EmitIfCurrent = (event: Omit<SpeechEventPayload, "sessionId">) => void;

let speechSdkModulePromise: Promise<SpeechSdkModule> | null = null;

const PREFERRED_RECORDING_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg"
];

const CHATGPT_INCREMENTAL_TIMESLICE_MS = 250;
const CHATGPT_INCREMENTAL_UPDATE_MS = 500;
const CHATGPT_PARTIAL_MIN_BYTES_DELTA = 4096;
const CHATGPT_PARTIAL_MAX_STALENESS_MS = 1500;
const CHATGPT_SILENCE_CHECK_INTERVAL_MS = 100;
const DEFAULT_CHATGPT_SILENCE_RMS_THRESHOLD = 0.02;
const CHATGPT_PARTIAL_UNSUPPORTED_MESSAGE =
  "ChatGPT partial transcription is disabled for live incremental captures because MediaRecorder chunks are not finalized upload containers. OnlySpeech will continue with the final turn only.";

function buildMicrophoneConstraints(command: {
  microphoneDeviceId: string;
  audioEchoCancellation: boolean;
  audioNoiseSuppression: boolean;
}): MediaTrackConstraints {
  return {
    deviceId: { exact: command.microphoneDeviceId },
    echoCancellation: command.audioEchoCancellation,
    noiseSuppression: command.audioNoiseSuppression
  };
}

function createMediaRecorder(stream: MediaStream): MediaRecorder {
  if (typeof MediaRecorder.isTypeSupported !== "function") {
    return new MediaRecorder(stream);
  }

  const supportedMimeType = PREFERRED_RECORDING_MIME_TYPES.find((mimeType) =>
    MediaRecorder.isTypeSupported(mimeType)
  );

  if (!supportedMimeType) {
    return new MediaRecorder(stream);
  }

  return new MediaRecorder(stream, { mimeType: supportedMimeType });
}

async function loadSpeechSdk(): Promise<SpeechSdkModule> {
  speechSdkModulePromise ??= import("microsoft-cognitiveservices-speech-sdk");
  return speechSdkModulePromise;
}

export class LiveSpeechClient {
  private recognizer: RecognizerLike | null = null;

  private mediaRecorder: MediaRecorder | null = null;

  private recordedChunks: Blob[] = [];

  private audioStream: MediaStream | null = null;

  private audioContext: AudioContext | null = null;

  private analyserNode: AnalyserNode | null = null;

  private analyserBuffer: Uint8Array<ArrayBuffer> | null = null;

  private silenceMonitorTimer: number | null = null;

  private silenceMonitorAttempted = false;

  private peakInputLevel = 0;

  private activeCommand: SpeechStartCommand | null = null;

  private activeSessionId: string | null = null;

  private generation = 0;

  private pendingPartialUpdateTimer: number | null = null;

  private pendingPartialChunks: Blob[] = [];

  private pendingPartialBytes = 0;

  private lastPartialSentAt = 0;

  private lastPartialDiagnosticSignature: string | null = null;

  private partialUpdatesDisabledReason: SpeechTurnPartialDiagnostic | null = null;

  async start(command: SpeechStartCommand, handlers: SpeechHandlers): Promise<void> {
    await this.stop();

    const generation = ++this.generation;
    this.activeSessionId = command.sessionId;
    this.activeCommand = command;
    const provider = getProviderAdapter(command.translationProvider);

    if (!provider.supportsStt) {
      throw new Error(`${provider.label} does not support provider-managed speech recognition in OnlySpeech.`);
    }

    if (command.translationProvider === "azure") {
      await this.startAzureTranslation(command, handlers, generation);
      return;
    }

    if (command.translationProvider === "chatgpt") {
      await this.startChatGptTurn(command, handlers, generation);
      return;
    }

    throw new Error(`${provider.label} does not support provider-managed speech recognition in OnlySpeech.`);
  }

  async stop(): Promise<void> {
    const recognizer = this.recognizer;
    const mediaRecorder = this.mediaRecorder;
    const audioStream = this.audioStream;
    const audioContext = this.audioContext;
    this.resetRuntimeState();

    await this.stopRecognizer(recognizer);
    await this.stopMediaRecorder(mediaRecorder, audioStream);
    await audioContext?.close().catch(() => undefined);
  }

  async finish(handlers: SpeechHandlers): Promise<void> {
    if (this.activeCommand?.translationProvider === "chatgpt" && this.mediaRecorder) {
      await this.finalizeTurn(handlers);
      return;
    }

    await this.stop();
  }

  async finalizeTurn(handlers: SpeechHandlers): Promise<void> {
    const mediaRecorder = this.mediaRecorder;
    const command = this.activeCommand;
    const generation = this.generation;
    if (!mediaRecorder || !command) {
      return;
    }

    this.clearPendingPartialUpdate();
    const emitIfCurrent = this.createEmitIfCurrent(command, handlers, generation);
    const finalTurnAudio = await this.stopAndCollectFinalTurnAudio(mediaRecorder);
    const hasDetectedSpeech = this.hasDetectedSpeech();
    await this.releaseChatGptTurnResources();
    this.pendingPartialChunks = [];
    this.pendingPartialBytes = 0;

    if (finalTurnAudio.size === 0) {
      emitIfCurrent({
        type: "error",
        side: command.side,
        error: "PTT capture produced an empty audio payload."
      });
      this.activeCommand = null;
      return;
    }

    if (!hasDetectedSpeech) {
      reportRuntimeDiagnostic(
        "warn",
        "[OnlySpeech] No speech detected during the ChatGPT push-to-talk turn; skipping provider submission."
      );
      emitIfCurrent({
        type: "speech-stopped",
        side: command.side
      });
      this.activeCommand = null;
      return;
    }

    const onlySpeechApi = this.getSpeechBridge(emitIfCurrent, command.side);
    if (!onlySpeechApi) {
      this.activeCommand = null;
      return;
    }

    await this.submitFinalTurn({
      audio: finalTurnAudio,
      command,
      emitIfCurrent,
      onlySpeechApi
    });
  }

  private resetRuntimeState(): void {
    this.recognizer = null;
    this.mediaRecorder = null;
    this.audioStream = null;
    this.audioContext = null;
    this.analyserNode = null;
    this.analyserBuffer = null;
    this.recordedChunks = [];
    this.activeSessionId = null;
    this.activeCommand = null;
    this.clearPendingPartialUpdate();
    this.clearSilenceMonitor();
    this.pendingPartialChunks = [];
    this.pendingPartialBytes = 0;
    this.lastPartialSentAt = 0;
    this.lastPartialDiagnosticSignature = null;
    this.partialUpdatesDisabledReason = null;
    this.peakInputLevel = 0;
    this.silenceMonitorAttempted = false;
    this.generation += 1;
  }

  private async stopRecognizer(recognizer: RecognizerLike | null): Promise<void> {
    if (!recognizer) {
      return;
    }

    await new Promise<void>((resolve) => {
      recognizer.stopContinuousRecognitionAsync(
        () => {
          recognizer.close();
          resolve();
        },
        () => {
          recognizer.close();
          resolve();
        }
      );
    });
  }

  private async stopMediaRecorder(
    mediaRecorder: MediaRecorder | null,
    audioStream: MediaStream | null
  ): Promise<void> {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        mediaRecorder.addEventListener(
          "stop",
          () => {
            this.stopAudioStream(audioStream);
            resolve();
          },
          { once: true }
        );
        mediaRecorder.stop();
      });
      return;
    }

    this.stopAudioStream(audioStream);
  }

  private stopAudioStream(audioStream: MediaStream | null): void {
    audioStream?.getTracks().forEach((track) => track.stop());
  }

  private async stopAndCollectFinalTurnAudio(mediaRecorder: MediaRecorder): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      mediaRecorder.addEventListener(
        "stop",
        () => {
          const blob = new Blob(this.recordedChunks, { type: mediaRecorder.mimeType || "audio/webm" });
          this.stopAudioStream(this.audioStream);
          this.mediaRecorder = null;
          this.audioStream = null;
          this.recordedChunks = [];
          resolve(blob);
        },
        { once: true }
      );
      mediaRecorder.addEventListener(
        "error",
        () => reject(new Error("MediaRecorder failed while stopping the PTT capture.")),
        { once: true }
      );
      mediaRecorder.stop();
    });
  }

  private async releaseChatGptTurnResources(): Promise<void> {
    const audioContext = this.audioContext;
    this.clearSilenceMonitor();
    this.audioContext = null;
    this.analyserNode = null;
    this.analyserBuffer = null;
    await audioContext?.close().catch(() => undefined);
  }

  private getSpeechBridge(
    emitIfCurrent: EmitIfCurrent,
    side: SpeechStartCommand["side"]
  ): ReturnType<typeof getOnlySpeechRendererApi> {
    const onlySpeechApi = getOnlySpeechRendererApi();
    if (onlySpeechApi) {
      return onlySpeechApi;
    }

    emitIfCurrent({
      type: "error",
      side,
      error: "Speech bridge is not available in this renderer."
    });
    return null;
  }

  private async submitFinalTurn(options: {
    audio: Blob;
    command: SpeechStartCommand;
    emitIfCurrent: EmitIfCurrent;
    onlySpeechApi: NonNullable<ReturnType<typeof getOnlySpeechRendererApi>>;
  }): Promise<void> {
    const { audio, command, emitIfCurrent, onlySpeechApi } = options;
    const audioBase64 = await this.blobToBase64(audio);

    try {
      const result = await onlySpeechApi.processSpeechTurn({
        provider: command.translationProvider,
        sourceLanguage: command.sourceLanguage,
        targetLanguage: command.targetLanguage,
        audioBase64,
        audioMimeType: audio.type || "audio/webm",
        isPartial: false
      });

      emitIfCurrent({
        type: "recognized",
        side: command.side,
        transcript: result.transcript,
        translation: result.translation,
        detectedLanguage: result.detectedLanguage
      });
      emitIfCurrent({
        type: "speech-stopped",
        side: command.side
      });
    } catch (error) {
      emitIfCurrent({
        type: "error",
        side: command.side,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      this.activeCommand = null;
    }
  }

  private async startChatGptTurn(
    command: SpeechStartCommand,
    handlers: SpeechHandlers,
    generation: number
  ): Promise<void> {
    const stream = await this.requestChatGptRecorderStream(command);

    if (generation !== this.generation) {
      this.stopAudioStream(stream);
      return;
    }

    const mediaRecorder = this.activateChatGptRecorder(stream);
    this.attachChatGptRecorderListeners(mediaRecorder, command, handlers, generation);
    const emitIfCurrent = this.createEmitIfCurrent(command, handlers, generation);
    mediaRecorder.start(CHATGPT_INCREMENTAL_TIMESLICE_MS);
    emitIfCurrent({
      type: "speech-started",
      side: command.side
    });
  }

  private async requestChatGptRecorderStream(command: SpeechStartCommand): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Browser media capture is not available in this Electron renderer.");
    }

    if (typeof MediaRecorder === "undefined") {
      throw new Error("MediaRecorder is not available in this Electron renderer.");
    }

    return navigator.mediaDevices.getUserMedia({
      audio: buildMicrophoneConstraints(command),
      video: false
    });
  }

  private activateChatGptRecorder(stream: MediaStream): MediaRecorder {
    const mediaRecorder = createMediaRecorder(stream);
    this.audioStream = stream;
    this.mediaRecorder = mediaRecorder;
    this.recordedChunks = [];
    this.peakInputLevel = 0;
    this.startSilenceMonitor(stream);
    return mediaRecorder;
  }

  private attachChatGptRecorderListeners(
    mediaRecorder: MediaRecorder,
    command: SpeechStartCommand,
    handlers: SpeechHandlers,
    generation: number
  ): void {
    mediaRecorder.addEventListener("dataavailable", (event) => {
      this.handleChatGptRecorderChunk(event.data, command, handlers, generation);
    });
  }

  private handleChatGptRecorderChunk(
    chunk: Blob | undefined,
    command: SpeechStartCommand,
    handlers: SpeechHandlers,
    generation: number
  ): void {
    if (!chunk || chunk.size === 0) {
      return;
    }

    this.recordedChunks.push(chunk);
    if (this.partialUpdatesDisabledReason) {
      return;
    }

    this.pendingPartialChunks.push(chunk);
    this.pendingPartialBytes += chunk.size;
    this.schedulePartialUpdate(command, handlers, generation);
  }

  private schedulePartialUpdate(
    command: SpeechStartCommand,
    handlers: SpeechHandlers,
    generation: number
  ): void {
    if (this.pendingPartialUpdateTimer !== null) {
      return;
    }

    this.pendingPartialUpdateTimer = window.setTimeout(() => {
      this.pendingPartialUpdateTimer = null;
      void this.flushPartialUpdate(command, handlers, generation);
    }, CHATGPT_INCREMENTAL_UPDATE_MS);
  }

  private async flushPartialUpdate(
    command: SpeechStartCommand,
    handlers: SpeechHandlers,
    generation: number
  ): Promise<void> {
    if (!this.canFlushPartialUpdate(command, generation)) {
      return;
    }

    if (this.partialUpdatesDisabledReason) {
      return;
    }

    if (!this.hasDetectedSpeech()) {
      return;
    }

    const now = Date.now();
    const partialIsStale =
      this.lastPartialSentAt === 0 || now - this.lastPartialSentAt >= CHATGPT_PARTIAL_MAX_STALENESS_MS;

    if (!partialIsStale && this.pendingPartialBytes < CHATGPT_PARTIAL_MIN_BYTES_DELTA) {
      return;
    }

    this.disableFurtherPartialUpdates();
    this.emitPartialDiagnostic(
      command,
      handlers,
      generation,
      "partial-degraded",
      CHATGPT_PARTIAL_UNSUPPORTED_MESSAGE,
      {
        code: "partial-audio-unsupported",
        disableFurtherPartialUpdates: true
      }
    );
  }

  private canFlushPartialUpdate(command: SpeechStartCommand, generation: number): boolean {
    return (
      generation === this.generation &&
      this.activeSessionId === command.sessionId &&
      this.pendingPartialChunks.length > 0
    );
  }

  private disableFurtherPartialUpdates(): void {
    this.partialUpdatesDisabledReason = {
      code: "partial-audio-unsupported",
      message: CHATGPT_PARTIAL_UNSUPPORTED_MESSAGE,
      disableFurtherPartialUpdates: true
    };
    this.pendingPartialChunks = [];
    this.pendingPartialBytes = 0;
  }

  private emitPartialDiagnostic(
    command: SpeechStartCommand,
    handlers: SpeechHandlers,
    generation: number,
    type: Extract<SpeechEventPayload["type"], "partial-degraded" | "partial-failed">,
    error: string,
    details: Record<string, unknown>
  ): void {
    const signature = JSON.stringify([type, error, details.code ?? null]);
    if (signature === this.lastPartialDiagnosticSignature) {
      return;
    }

    this.lastPartialDiagnosticSignature = signature;
    const emitIfCurrent = this.createEmitIfCurrent(command, handlers, generation);
    emitIfCurrent({
      type,
      side: command.side,
      error,
      details
    });
  }

  private clearPendingPartialUpdate(): void {
    if (this.pendingPartialUpdateTimer !== null) {
      window.clearTimeout(this.pendingPartialUpdateTimer);
      this.pendingPartialUpdateTimer = null;
    }
  }

  private startSilenceMonitor(stream: MediaStream): void {
    this.silenceMonitorAttempted = true;
    this.clearSilenceMonitor();

    try {
      const AudioContextConstructor = this.getAudioContextConstructor();
      if (!AudioContextConstructor) {
        reportRuntimeDiagnostic(
          "warn",
          "[OnlySpeech] AudioContext is not available; silence monitoring will be skipped for this turn."
        );
        return;
      }

      const audioContext = new AudioContextConstructor();
      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }
      this.initializeSilenceAnalyser(audioContext, stream);
    } catch (err) {
      reportRuntimeDiagnostic("error", "[OnlySpeech] Failed to start the silence monitor for a ChatGPT turn.", err);
      this.clearSilenceMonitor();
    }
  }

  private getAudioContextConstructor(): (new () => AudioContext) | undefined {
    return window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  }

  private initializeSilenceAnalyser(audioContext: AudioContext, stream: MediaStream): void {
    const sourceNode = audioContext.createMediaStreamSource(stream);
    const analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    sourceNode.connect(analyserNode);

    this.audioContext = audioContext;
    this.analyserNode = analyserNode;
    this.analyserBuffer = new Uint8Array(new ArrayBuffer(analyserNode.fftSize));
    this.silenceMonitorTimer = window.setInterval(() => {
      this.sampleInputLevel();
    }, CHATGPT_SILENCE_CHECK_INTERVAL_MS);
  }

  private clearSilenceMonitor(): void {
    if (this.silenceMonitorTimer !== null) {
      window.clearInterval(this.silenceMonitorTimer);
      this.silenceMonitorTimer = null;
    }
  }

  private sampleInputLevel(): void {
    if (!this.analyserNode || !this.analyserBuffer) {
      return;
    }

    this.analyserNode.getByteTimeDomainData(this.analyserBuffer);
    let energy = 0;
    for (const sample of this.analyserBuffer) {
      const normalized = (sample - 128) / 128;
      energy += normalized * normalized;
    }

    const rms = Math.sqrt(energy / this.analyserBuffer.length);
    if (rms > this.peakInputLevel) {
      this.peakInputLevel = rms;
    }
  }

  private hasDetectedSpeech(): boolean {
    if (this.silenceMonitorAttempted && !this.analyserNode) {
      // Monitor was attempted but AudioContext was unavailable or failed — assume speech present.
      return true;
    }
    const threshold = Math.max(
      0,
      this.activeCommand?.chatGptSilenceRmsThreshold ?? DEFAULT_CHATGPT_SILENCE_RMS_THRESHOLD
    );
    return this.peakInputLevel >= threshold;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private async startAzureTranslation(
    command: SpeechStartCommand,
    handlers: SpeechHandlers,
    generation: number
  ): Promise<void> {
    await this.warmUpAzureMicrophone(command);

    if (generation !== this.generation) return;

    const speechSdk = await loadSpeechSdk();

    if (generation !== this.generation) return;

    const config = speechSdk.SpeechTranslationConfig.fromSubscription(command.azureKey, command.azureRegion);
    const azureTargetLanguage =
      resolveProviderTargetLanguageCode(command.targetLanguage, "azure", {
        includeProviderExpansions: true
      }) ?? command.targetLanguage;
    config.addTargetLanguage(azureTargetLanguage);
    config.speechRecognitionLanguage = command.sourceLanguage;

    const audioConfig = speechSdk.AudioConfig.fromMicrophoneInput(command.microphoneDeviceId);
    const recognizer = new speechSdk.TranslationRecognizer(config, audioConfig);
    this.recognizer = recognizer;

    const emitIfCurrent = this.createEmitIfCurrent(command, handlers, generation);

    recognizer.recognizing = (_, event) => {
      emitIfCurrent({
        type: "recognizing",
        side: command.side,
        transcript: event.result.text,
        translation: event.result.translations.get(azureTargetLanguage) || ""
      });
    };

    recognizer.recognized = (_, event) => {
      emitIfCurrent({
        type: "recognized",
        side: command.side,
        transcript: event.result.text,
        translation: event.result.translations.get(azureTargetLanguage) || ""
      });
    };

    recognizer.canceled = (_, event) => {
      emitIfCurrent({
        type: "canceled",
        side: command.side,
        error: `${event.errorCode}: ${event.errorDetails || event.reason}`
      });
    };

    recognizer.sessionStarted = () => {
      emitIfCurrent({
        type: "speech-started",
        side: command.side
      });
    };

    recognizer.sessionStopped = () => {
      emitIfCurrent({
        type: "speech-stopped",
        side: command.side
      });
    };

    await this.startRecognizer(recognizer);
  }

  private async warmUpAzureMicrophone(command: SpeechStartCommand): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return;
    }

    const warmupStream = await navigator.mediaDevices.getUserMedia({
      audio: buildMicrophoneConstraints(command),
      video: false
    });
    this.stopAudioStream(warmupStream);
  }

  private createEmitIfCurrent(
    command: SpeechStartCommand,
    handlers: SpeechHandlers,
    generation: number
  ): EmitIfCurrent {
    return (event) => {
      if (generation !== this.generation || this.activeSessionId !== command.sessionId) {
        return;
      }

      handlers.onEvent({
        sessionId: command.sessionId,
        ...event
      });
    };
  }

  private async startRecognizer(recognizer: RecognizerLike): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      recognizer.startContinuousRecognitionAsync(resolve, (error) => reject(new Error(error)));
    });
  }
}
