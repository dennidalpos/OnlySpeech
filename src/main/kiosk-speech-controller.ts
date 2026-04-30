import { areSidesReadyForSpeech, canSideUseSpeech, resolveRemoteTargetLanguage } from "../shared/side-flow.js";
import type { AppState, RendererCommand, RuntimeConfig, Side } from "../shared/types.js";
import { JsonlLogger } from "../services/logging/jsonl-logger.js";
import { SessionStore } from "../services/session/session-store.js";
import { resolveSideSpeechStartParameters } from "../shared/speech-flow.js";

const PTT_STOP_FALLBACK_GRACE_MS = 1500;

interface KioskSpeechControllerOptions {
  config: RuntimeConfig;
  sessionStore: SessionStore;
  logger: JsonlLogger;
  getState: () => AppState;
  broadcastState: () => void;
  sendCommand: (side: Side, command: RendererCommand) => void;
  clearTransientIssues: () => void;
  getSideLogContext: (side: Side) => {
    selected_interaction_language: string | null;
    normalized_target_language: string | null;
    requested_ui_language: string | null;
    effective_ui_language: string;
    english_ui_fallback: boolean;
  };
}

export class KioskSpeechController {
  private sessionStartedLogged = false;

  private pendingStopTimeout: NodeJS.Timeout | null = null;

  private stopFallbackTimeout: NodeJS.Timeout | null = null;

  constructor(private readonly options: KioskSpeechControllerOptions) {}

  dispose(): void {
    this.clearPendingStops();
  }

  markSessionNotStarted(): void {
    this.sessionStartedLogged = false;
  }

  shouldRestartSessionForLanguageChange(side: Side, targetLanguage: string): boolean {
    const state = this.options.getState();
    const currentLanguage = state.sides[side].selectedTargetLanguage ?? null;

    return (
      this.sessionStartedLogged &&
      areSidesReadyForSpeech(state) &&
      currentLanguage !== null &&
      currentLanguage !== targetLanguage
    );
  }

  restartSessionForLanguageChange(side: Side, targetLanguage: string): void {
    const previousState = this.options.getState();
    const previousSessionId = previousState.sessionId;
    const previousTargetLanguage = previousState.sides[side].selectedTargetLanguage ?? null;

    this.clearPendingStops();
    this.options.sendCommand("A", { type: "stop-speech", side: "A" });
    this.options.sendCommand("B", { type: "stop-speech", side: "B" });
    this.options.sessionStore.restartForLanguageChange(side, targetLanguage);
    this.sessionStartedLogged = false;

    const nextState = this.options.getState();
    this.options.logger.log({
      session_id: previousSessionId,
      side,
      event: "language_change",
      ...this.options.getSideLogContext(side),
      source_language: nextState.sides[side].sourceLanguage,
      target_language: nextState.sides[side].selectedTargetLanguage,
      details: {
        previous_target_language: previousTargetLanguage,
        next_session_id: nextState.sessionId,
        reset_session: true,
        changed_side: side
      }
    });

    this.options.broadcastState();
    this.recordSessionStartIfReady();
  }

  startSpeechIfAllowed(side: Side): void {
    const state = this.options.getState();
    if (!canSideUseSpeech(state, side)) {
      this.options.broadcastState();
      return;
    }

    if (state.activeSide && state.activeSide !== side) {
      return;
    }

    if (state.activeSide === side && this.pendingStopTimeout) {
      clearTimeout(this.pendingStopTimeout);
      this.pendingStopTimeout = null;
      return;
    }

    const microphone = state.health.microphoneAssignments.find((assignment) => assignment.side === side);
    if (!microphone) {
      return;
    }

    const targetLanguage = resolveRemoteTargetLanguage(state, side);
    if (!targetLanguage) {
      return;
    }

    const sourceState = state.sides[side];
    const speechStartParameters = resolveSideSpeechStartParameters(this.options.config.translationProvider, sourceState);

    this.options.clearTransientIssues();
    this.options.sessionStore.setActiveSide(side);
    this.options.broadcastState();

    this.options.logger.log({
      session_id: state.sessionId,
      side,
      event: "ptt_down",
      ...this.options.getSideLogContext(side),
      source_language: state.sides[side].sourceLanguage,
      target_language: targetLanguage
    });

    this.options.sendCommand(side, {
      type: "start-speech",
      side,
      sessionId: state.sessionId,
      translationProvider: this.options.config.translationProvider,
      sourceLanguage: speechStartParameters.sourceLanguage,
      targetLanguage,
      microphoneDeviceId: microphone.deviceId,
      azureKey: this.options.config.azureSpeechKey,
      azureRegion: this.options.config.azureSpeechRegion,
      chatGptSilenceRmsThreshold: this.options.config.chatGptSilenceRmsThreshold,
      audioEchoCancellation: this.options.config.audioEchoCancellation,
      audioNoiseSuppression: this.options.config.audioNoiseSuppression,
      audioCaptureSettingsDiagnosticsEnabled: this.options.config.audioCaptureSettingsDiagnosticsEnabled
    });
  }

  scheduleSpeechStop(side: Side): void {
    if (this.options.getState().activeSide !== side) {
      return;
    }

    if (this.pendingStopTimeout) {
      clearTimeout(this.pendingStopTimeout);
    }

    this.pendingStopTimeout = setTimeout(() => {
      this.options.sendCommand(side, { type: "stop-speech", side });
      this.options.logger.log({
        session_id: this.options.sessionStore.getState().sessionId,
        side,
        event: "ptt_up",
        ...this.options.getSideLogContext(side),
        source_language: this.options.getState().sides[side].sourceLanguage,
        target_language: this.options.getState().sides[side === "A" ? "B" : "A"].selectedTargetLanguage
      });

      this.stopFallbackTimeout = setTimeout(() => {
        if (this.options.getState().activeSide === side) {
          this.options.sessionStore.setActiveSide(null);
          this.options.broadcastState();
        }
      }, PTT_STOP_FALLBACK_GRACE_MS);
    }, this.options.config.pttReleaseGraceMs);
  }

  async stopAllSpeech(): Promise<void> {
    this.clearPendingStops();
    this.options.sendCommand("A", { type: "stop-speech", side: "A" });
    this.options.sendCommand("B", { type: "stop-speech", side: "B" });
    this.options.sessionStore.setActiveSide(null);
    this.options.broadcastState();
  }

  stopSpeechForSide(side: Side): void {
    this.clearPendingStops();
    this.options.sendCommand(side, { type: "stop-speech", side });

    if (this.options.getState().activeSide === side) {
      this.options.sessionStore.setActiveSide(null);
    }

    this.options.broadcastState();
  }

  async resetSession(): Promise<void> {
    await this.stopAllSpeech();
    this.options.sessionStore.hardReset();
    this.sessionStartedLogged = false;
    this.options.logger.log({
      session_id: this.options.sessionStore.getState().sessionId,
      event: "session_reset"
    });
    this.options.broadcastState();
  }

  recordSessionStartIfReady(): void {
    if (this.sessionStartedLogged || !areSidesReadyForSpeech(this.options.getState())) {
      return;
    }

    const state = this.options.getState();
    this.sessionStartedLogged = true;
    this.options.logger.log({
      session_id: state.sessionId,
      event: "session_start",
      details: {
        sideA: {
          selectedInteractionLanguage: state.sides.A.selectedInteractionLanguage,
          normalizedTargetLanguage: state.sides.A.normalizedTargetLanguage,
          sourceLanguage: state.sides.A.sourceLanguage,
          targetLanguage: state.sides.A.selectedTargetLanguage,
          requestedUiLanguage: state.sides.A.requestedUiLanguage,
          effectiveUiLanguage: state.sides.A.effectiveUiLanguage,
          englishUiFallback: state.sides.A.usesEnglishUiFallback
        },
        sideB: {
          selectedInteractionLanguage: state.sides.B.selectedInteractionLanguage,
          normalizedTargetLanguage: state.sides.B.normalizedTargetLanguage,
          sourceLanguage: state.sides.B.sourceLanguage,
          targetLanguage: state.sides.B.selectedTargetLanguage,
          requestedUiLanguage: state.sides.B.requestedUiLanguage,
          effectiveUiLanguage: state.sides.B.effectiveUiLanguage,
          englishUiFallback: state.sides.B.usesEnglishUiFallback
        }
      }
    });
  }

  private clearPendingStops(): void {
    if (this.pendingStopTimeout) {
      clearTimeout(this.pendingStopTimeout);
      this.pendingStopTimeout = null;
    }

    if (this.stopFallbackTimeout) {
      clearTimeout(this.stopFallbackTimeout);
      this.stopFallbackTimeout = null;
    }
  }
}
