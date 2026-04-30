import { app } from "electron";
import type {
  AppState,
  DeviceProbePayload,
  OperatorAction,
  RuntimeConfig,
  Side,
  TechnicalIssue,
  SpeechEventPayload,
  TextToSpeechEventPayload,
  TextToSpeechRequest,
  StopTextToSpeechRequest
} from "../shared/types.js";
import { JsonlLogger } from "../services/logging/jsonl-logger.js";
import { IdleController } from "../services/privacy/idle-controller.js";
import { SessionStore } from "../services/session/session-store.js";
import { canSideUseSpeech } from "../shared/side-flow.js";
import { DemoRuntimeController } from "./demo-runtime-controller.js";
import { DisplayManager } from "./display-manager.js";
import { KioskDisplayRuntime, type KioskWindowAutomationSnapshot } from "./kiosk-display-runtime.js";
import { KioskHealthController } from "./kiosk-health-controller.js";
import { KioskSpeechController } from "./kiosk-speech-controller.js";
import { KioskTextToSpeechController } from "./kiosk-text-to-speech-controller.js";

function isSpeechDeviceUnavailableError(error: string | undefined): boolean {
  if (!error) {
    return false;
  }

  const normalized = error.toLowerCase();

  return (
    normalized.includes("notfounderror") ||
    normalized.includes("notreadableerror") ||
    normalized.includes("overconstrainederror") ||
    normalized.includes("trackstarterror") ||
    normalized.includes("aborterror") ||
    normalized.includes("requested device not found") ||
    normalized.includes("requested microphone") ||
    normalized.includes("device is no longer available") ||
    normalized.includes("could not start audio source") ||
    normalized.includes("starting audio capture failed")
  );
}

function createSpeechFailureIssue(payload: SpeechEventPayload, config: RuntimeConfig): TechnicalIssue {
  if (payload.type === "canceled") {
    return {
      code: "translation-provider-failure",
      message: `Richiesta al provider traduzione non riuscita (${config.translationProvider}).`,
      retryable: true,
      side: payload.side,
      details: payload.error
    };
  }

  if (isSpeechDeviceUnavailableError(payload.error)) {
    return {
      code: "microphone-unavailable",
      message: "Il microfono assegnato non e disponibile o non e acquisibile.",
      retryable: true,
      side: payload.side,
      details: payload.error
    };
  }

  return {
    code: "speech-stream-failure",
    message: "Errore nello stream vocale.",
    retryable: true,
    side: payload.side,
    details: payload.error
  };
}

export class KioskManager {
  private readonly sessionStore: SessionStore;

  private readonly logger: JsonlLogger;

  private readonly displayManager: DisplayManager;

  private readonly displayRuntime: KioskDisplayRuntime;

  private readonly healthController: KioskHealthController;

  private readonly speechController: KioskSpeechController;

  private readonly idleController: IdleController;

  private readonly demoController: DemoRuntimeController | null;

  private readonly textToSpeechController: KioskTextToSpeechController;

  constructor(private readonly config: RuntimeConfig) {
    this.sessionStore = new SessionStore(config);
    this.logger = new JsonlLogger({ logLevel: config.logLevel });
    this.displayManager = new DisplayManager(config);
    this.displayRuntime = new KioskDisplayRuntime({
      displayManager: this.displayManager,
      logger: this.logger,
      getState: () => this.getState(),
      devServerUrl: process.env.VITE_DEV_SERVER_URL
    });
    this.healthController = new KioskHealthController({
      config,
      sessionStore: this.sessionStore,
      logger: this.logger
    });
    this.speechController = new KioskSpeechController({
      config,
      sessionStore: this.sessionStore,
      logger: this.logger,
      getState: () => this.getState(),
      broadcastState: () => this.broadcastState(),
      sendCommand: (side, command) => this.displayRuntime.sendCommand(side, command),
      clearTransientIssues: () => this.healthController.clearTransientIssues(),
      getSideLogContext: (side) => this.getSideLogContext(side)
    });
    this.textToSpeechController = new KioskTextToSpeechController({
      sessionStore: this.sessionStore,
      logger: this.logger,
      getState: () => this.getState(),
      broadcastState: () => this.broadcastState(),
      azureSpeechKey: config.azureSpeechKey,
      azureSpeechRegion: config.azureSpeechRegion,
      chatGptApiKey: config.chatGptApiKey,
      openAiTtsLanguageInstructionsEnabled: config.openAiTtsLanguageInstructionsEnabled,
      azureTtsLangElementEnabled: config.azureTtsLangElementEnabled,
      sendCommand: (side, command) => this.displayRuntime.sendCommand(side, command)
    });
    this.idleController = new IdleController({
      clearAfterMs: config.idleClearSeconds * 1000,
      hardResetAfterMs: config.idleHardResetSeconds * 1000,
      onClear: () => {
        const previousSessionId = this.sessionStore.getState().sessionId;
        this.speechController.dispose();
        this.textToSpeechController.stopPlayback("idle-clear", false);
        this.displayRuntime.sendCommand("A", { type: "stop-speech", side: "A" });
        this.displayRuntime.sendCommand("B", { type: "stop-speech", side: "B" });
        this.sessionStore.idleReset();
        this.speechController.markSessionNotStarted();
        this.broadcastState();
        this.logger.log({
          session_id: previousSessionId,
          event: "idle_clear",
          details: {
            next_session_id: this.sessionStore.getState().sessionId,
            reset_to_defaults: true
          }
        });
      },
      onHardReset: () => {
        void this.speechController.stopAllSpeech();
        this.textToSpeechController.stopPlayback("hard-reset", false);
        this.sessionStore.hardReset();
        this.speechController.markSessionNotStarted();
        this.broadcastState();
        this.logger.log({
          session_id: this.sessionStore.getState().sessionId,
          event: "hard_reset"
        });
      }
    });
    this.demoController =
      config.appMode === "demo"
        ? new DemoRuntimeController({
            sessionStore: this.sessionStore,
            logger: this.logger,
            broadcastState: () => this.broadcastState(),
            slideIntervalSeconds: config.demoSlideIntervalSeconds
          })
        : null;
  }

  initialize(): void {
    this.displayRuntime.initialize(() => {
      this.reconcileDisplays();
    });

    this.reconcileDisplays();
    this.idleController.start();

    this.logger.log({
      session_id: this.sessionStore.getState().sessionId,
      event: "app_startup",
      details: {
        appMode: this.config.appMode
      }
    });

    this.demoController?.start();
  }

  shutdown(): void {
    this.demoController?.stop();
    this.textToSpeechController.stopPlayback("shutdown", false);
    this.speechController.dispose();
    this.idleController.stop();
    this.displayRuntime.shutdown();
  }

  setDemoPaused(paused: boolean): void {
    if (!this.demoController) {
      return;
    }

    if (paused) {
      this.demoController.pause();
      return;
    }

    this.demoController.resume();
  }

  getSnapshot(): { state: AppState; windows: Array<{ side: Side; destroyed: boolean }> } {
    return {
      state: structuredClone(this.getState()),
      windows: this.displayRuntime.getSnapshot()
    };
  }

  async captureWindow(side: Side): Promise<Buffer | null> {
    return this.displayRuntime.captureWindow(side);
  }

  async inspectWindow(side: Side): Promise<KioskWindowAutomationSnapshot | null> {
    return this.displayRuntime.inspectWindow(side);
  }

  handleOperatorAction(action: OperatorAction): void {
    this.idleController.activity();

    switch (action.type) {
      case "renderer-ready":
        this.displayRuntime.sendCommand(action.side, { type: "probe-devices" });
        this.sendStateTo(action.side);
        return;
      case "activity":
        return;
      case "select-target-language":
        if (this.demoController) {
          return;
        }
        if (!action.targetLanguage) {
          return;
        }

        if (this.speechController.shouldRestartSessionForLanguageChange(action.side, action.targetLanguage)) {
          this.textToSpeechController.stopPlayback("language-change");
          this.speechController.restartSessionForLanguageChange(action.side, action.targetLanguage);
          return;
        }

        this.textToSpeechController.stopPlayback("language-change");
        this.sessionStore.setTargetLanguage(action.side, action.targetLanguage);
        this.sessionStore.clearSoftResetMarker();
        this.logger.log({
          session_id: this.sessionStore.getState().sessionId,
          side: action.side,
          event: "language_change",
          ...this.getSideLogContext(action.side),
          source_language: this.getState().sides[action.side].sourceLanguage,
          target_language: action.targetLanguage
        });
        this.speechController.recordSessionStartIfReady();
        this.broadcastState();
        return;
      case "request-ptt-down":
        if (this.demoController) {
          return;
        }
        this.textToSpeechController.stopPlayback("speech-start");
        this.speechController.startSpeechIfAllowed(action.side);
        return;
      case "request-ptt-up":
        if (this.demoController) {
          return;
        }
        this.speechController.scheduleSpeechStop(action.side);
        return;
      case "request-reset":
        if (this.demoController) {
          this.textToSpeechController.stopPlayback("demo-restart");
          this.demoController.restart();
          return;
        }
        this.textToSpeechController.stopPlayback("reset");
        void this.speechController.resetSession();
        return;
      case "request-close":
        this.logger.log({
          session_id: this.sessionStore.getState().sessionId,
          side: action.side,
          event: "close_app"
        });
        this.textToSpeechController.stopPlayback("close-app");
        void this.speechController.stopAllSpeech().finally(() => app.quit());
        return;
      case "retry-health-check":
        this.healthController.clearTransientIssues();
        this.reconcileDisplays();
        this.displayRuntime.broadcastProbeCommand();
        return;
      default:
        return;
    }
  }

  handleDeviceProbe(payload: DeviceProbePayload): void {
    if (!payload.failureKind) {
      this.healthController.clearTransientIssuesMatching(
        (issue) => issue.code === "microphone-unavailable" && (!issue.side || issue.side === payload.side)
      );
    }

    this.healthController.handleDeviceProbe(payload);
    const state = this.getState();
    if (state.activeSide && !canSideUseSpeech(state, state.activeSide)) {
      this.speechController.stopSpeechForSide(state.activeSide);
    }

    this.broadcastState();
    this.speechController.recordSessionStartIfReady();
  }

  handleSpeechEvent(payload: SpeechEventPayload): void {
    if (payload.sessionId !== this.sessionStore.getState().sessionId) {
      return;
    }

    switch (payload.type) {
      case "speech-started":
        return;
      case "recognizing":
        this.sessionStore.updateSpeech(payload.side, payload.transcript, payload.translation, payload.detectedLanguage);
        this.broadcastState();
        return;
      case "recognized":
        this.sessionStore.updateSpeech(payload.side, payload.transcript, payload.translation, payload.detectedLanguage);
        this.sessionStore.appendConversationTurn(payload.side, payload.transcript ?? "", payload.translation, payload.detectedLanguage);
        this.broadcastState();
        return;
      case "partial-degraded":
      case "partial-failed":
        this.logger.log({
          session_id: this.sessionStore.getState().sessionId,
          side: payload.side,
          event: payload.type === "partial-failed" ? "partial_update_failed" : "partial_update_degraded",
          details: payload.details,
          error: payload.error || null
        });
        return;
      case "speech-stopped":
        this.speechController.dispose();
        if (this.getState().activeSide === payload.side) {
          this.sessionStore.setActiveSide(null);
        }
        this.broadcastState();
        return;
      case "canceled":
      case "error":
        this.speechController.dispose();
        this.healthController.setTransientIssues([createSpeechFailureIssue(payload, this.config)]);
        this.logger.log({
          session_id: this.sessionStore.getState().sessionId,
          side: payload.side,
          event: "technical_error",
          error: payload.error || null
        });
        this.sessionStore.setActiveSide(null);
        this.broadcastState();
        return;
      default:
        return;
    }
  }

  handleTextToSpeechRequest(request: TextToSpeechRequest): void {
    this.idleController.activity();
    this.textToSpeechController.requestPlayback(request);
  }

  handleTextToSpeechStop(request?: StopTextToSpeechRequest): void {
    this.idleController.activity();

    if (request?.side && request?.content) {
      this.textToSpeechController.stopPlaybackForPanel(request.side, request.content);
      return;
    }

    this.textToSpeechController.stopPlayback();
  }

  handleTextToSpeechEvent(payload: TextToSpeechEventPayload): void {
    this.textToSpeechController.handleEvent(payload);
  }

  private getState(): AppState {
    return this.sessionStore.getState();
  }

  private getSideLogContext(side: Side) {
    const sideState = this.getState().sides[side];
    return {
      selected_interaction_language: sideState.selectedInteractionLanguage,
      normalized_target_language: sideState.normalizedTargetLanguage,
      requested_ui_language: sideState.requestedUiLanguage,
      effective_ui_language: sideState.effectiveUiLanguage,
      english_ui_fallback: sideState.usesEnglishUiFallback
    };
  }

  private reconcileDisplays(): void {
    const { assignments, issues } = this.displayRuntime.reconcileDisplays();
    this.healthController.setDisplayState(assignments, issues);
    this.broadcastState();
  }

  private sendStateTo(side: Side): void {
    this.displayRuntime.sendStateTo(side);
  }

  private broadcastState(): void {
    this.displayRuntime.broadcastState();
  }
}
