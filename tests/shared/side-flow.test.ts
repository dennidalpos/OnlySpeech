import { describe, expect, it } from "vitest";
import { areSidesReadyForSpeech, canSideUseSpeech, resolveOperatorViewMode } from "../../src/shared/side-flow.js";
import type { AppState, SideState } from "../../src/shared/types.js";

function createSideState(partial: Partial<SideState>): SideState {
  return {
    side: "A",
    selectedInteractionLanguage: "en",
    normalizedTargetLanguage: "en",
    sourceLanguage: "it-IT",
    hasCommittedLanguageSelection: true,
    requestedUiLanguage: "en",
    effectiveUiLanguage: "en",
    usesEnglishUiFallback: false,
    selectedTargetLanguage: "en",
    localTranscript: "",
    remoteTranslation: "",
    status: "ready",
    error: null,
    isActiveSpeaker: false,
    ...partial
  };
}

function createAppState(): AppState {
  return {
    sessionId: "session-1",
    appMode: "kiosk",
    microphonePttMode: "dual-dedicated",
    translationProvider: "chatgpt",
    textToSpeechEnabled: true,
    activeSide: null,
    lastActivityAt: "2026-03-27T12:00:00.000Z",
    clearTriggeredAt: null,
    visitorConversationHistoryEnabled: false,
    conversationHistory: [],
    textToSpeech: {
      side: null,
      content: null,
      requestId: null,
      status: "idle",
      engine: null,
      language: null,
      voiceName: null,
      error: null
    },
    sides: {
      A: createSideState({ side: "A", sourceLanguage: "it-IT", selectedTargetLanguage: "en" }),
      B: createSideState({ side: "B", sourceLanguage: "en-US", selectedTargetLanguage: "it" })
    },
    health: {
      displaysReady: true,
      microphonesReady: true,
      speechReady: true,
      translationReady: true,
      blockingIssues: [],
      displayAssignments: [],
      microphoneAssignments: []
    }
  };
}

describe("side-flow", () => {
  it("treats both sides as ready when target languages are set and no blocking issue is active", () => {
    expect(areSidesReadyForSpeech(createAppState())).toBe(true);

    const blockedState = createAppState();
    blockedState.health.blockingIssues = [
      {
        code: "translation-config-missing",
        message: "Configurazione traduzione mancante per il provider selezionato.",
        retryable: true
      }
    ];

    expect(areSidesReadyForSpeech(blockedState)).toBe(false);
  });

  it("does not treat a side as ready until both language selections have been explicitly confirmed", () => {
    const uncommittedState = createAppState();
    uncommittedState.sides.B.hasCommittedLanguageSelection = false;

    expect(areSidesReadyForSpeech(uncommittedState)).toBe(false);
  });

  it("blocks only the affected side in dual-dedicated mode when a dedicated microphone is missing", () => {
    const degradedState = createAppState();
    degradedState.health.blockingIssues = [
      {
        code: "missing-microphone-a",
        message: "Microfono A non rilevato.",
        retryable: true,
        side: "A"
      }
    ];

    expect(canSideUseSpeech(degradedState, "A")).toBe(false);
    expect(canSideUseSpeech(degradedState, "B")).toBe(true);
    expect(areSidesReadyForSpeech(degradedState)).toBe(false);
  });

  it("blocks both sides in single-shared mode when the shared microphone is unavailable", () => {
    const degradedState = createAppState();
    degradedState.microphonePttMode = "single-shared";
    degradedState.health.blockingIssues = [
      {
        code: "microphone-unavailable",
        message: "Il microfono assegnato non e disponibile o non e acquisibile.",
        retryable: true,
        side: "B"
      }
    ];

    expect(canSideUseSpeech(degradedState, "A")).toBe(false);
    expect(canSideUseSpeech(degradedState, "B")).toBe(false);
  });

  it("keeps the interface reachable when only hardware blockers are active", () => {
    const degradedState = createAppState();
    degradedState.health.blockingIssues = [
      {
        code: "missing-monitor",
        message: "Two active monitors are required to start the session.",
        retryable: true
      }
    ];

    expect(
      resolveOperatorViewMode({
        appState: degradedState,
        side: "A",
        showLanguageSelector: false,
        visitorLanguageCommitted: true
      })
    ).toBe("operator-session");
  });
});
