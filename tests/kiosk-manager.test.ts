import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppState, RuntimeConfig } from "../src/shared/types.js";

const kioskMocks = vi.hoisted(() => ({
  log: vi.fn(),
  getAssignments: vi.fn(() => ({ assignments: [], issues: [] }))
}));

vi.mock("electron", () => ({
  app: {
    quit: vi.fn()
  },
  session: {
    defaultSession: {
      setPermissionCheckHandler: vi.fn(),
      setPermissionRequestHandler: vi.fn()
    }
  },
  BrowserWindow: class MockBrowserWindow {}
}));

vi.mock("../src/services/logging/jsonl-logger.js", () => ({
  JsonlLogger: class MockJsonlLogger {
    log = kioskMocks.log;
  }
}));

vi.mock("../src/main/display-manager.js", () => ({
  DisplayManager: class MockDisplayManager {
    getAssignments() {
      return kioskMocks.getAssignments();
    }

    watch() {
      return () => undefined;
    }
  }
}));

vi.mock("../src/main/window-factory.js", () => ({
  createOperatorWindow: vi.fn(),
  syncWindowToDisplay: vi.fn()
}));

import { KioskManager } from "../src/main/kiosk-manager.js";

function createConfig(overrides = {}) {
  return {
    appMode: "kiosk",
    microphonePttMode: "dual-dedicated",
    requiredMonitors: 2,
    requiredMicrophones: 2,
    demoSlideIntervalSeconds: 8,
    textToSpeechEnabled: true,
    displayAId: null,
    displayBId: null,
    micAId: null,
    micBId: null,
    idleClearSeconds: 60,
    idleHardResetSeconds: 180,
    pttReleaseGraceMs: 400,
    providerRequestTimeoutMs: 45000,
    chatGptSilenceRmsThreshold: 0.02,
    visitorConversationHistoryEnabled: false,
    audioEchoCancellation: true,
    audioNoiseSuppression: true,
    azureSpeechKey: "",
    azureSpeechRegion: "",
    translationProvider: "chatgpt",
    chatGptApiKey: "chatgpt-key",
    chatGptModel: "gpt-4.1-mini",
    chatGptTranscribeModel: "gpt-4o-mini-transcribe",
    ollamaBaseUrl: "http://localhost:11434/api",
    ollamaModel: "gemma3",
    ollamaRequestTimeoutMs: 45000,
    ollamaStreamingEnabled: false,
    ollamaApiKey: "",
    defaultTargetLangA: "it",
    defaultTargetLangB: "en",
    defaultSourceLangA: "it-IT",
    defaultSourceLangB: "en-US",
    logLevel: "info",
    ...overrides
  } satisfies RuntimeConfig;
}

describe("KioskManager microphone probes", () => {
  beforeEach(() => {
    kioskMocks.log.mockReset();
    kioskMocks.getAssignments.mockClear();
  });

  it("keeps permission-denied probe details in logs while exposing a dedicated blocking issue", () => {
    const manager = new KioskManager(createConfig());

    manager.handleDeviceProbe({
      side: "A",
      devices: [],
      permissionGranted: false,
      error: "NotAllowedError: Permission denied"
    });

    const state = (manager as unknown as { getState: () => AppState }).getState();

    expect(state.health.blockingIssues).toEqual([
      expect.objectContaining({
        code: "microphone-permission-denied",
        side: "A",
        retryable: true
      })
    ]);
    expect(state.health.blockingIssues[0]?.details).toBeUndefined();
    expect(state.health.microphoneAssignments).toEqual([]);
    expect(state.sides.A.error?.code).toBe("microphone-permission-denied");
    expect(kioskMocks.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "microphone_permission_denied",
        side: "A",
        details: expect.objectContaining({
          error: "NotAllowedError: Permission denied",
          permissionGranted: false
        })
      })
    );
  });

  it("starts a new shared session when a side changes language after the session already started", () => {
    const manager = new KioskManager(createConfig());

    manager.handleDeviceProbe({
      side: "A",
      devices: [
        { deviceId: "mic-a", groupId: "group-a", label: "Microphone A" },
        { deviceId: "mic-b", groupId: "group-b", label: "Microphone B" }
      ],
      permissionGranted: true
    });
    manager.handleDeviceProbe({
      side: "B",
      devices: [
        { deviceId: "mic-a", groupId: "group-a", label: "Microphone A" },
        { deviceId: "mic-b", groupId: "group-b", label: "Microphone B" }
      ],
      permissionGranted: true
    });
    manager.handleOperatorAction({ type: "select-target-language", side: "A", targetLanguage: "fr" });
    manager.handleOperatorAction({ type: "select-target-language", side: "B", targetLanguage: "ja" });
    const startedState = (manager as unknown as { getState: () => AppState }).getState();

    manager.handleSpeechEvent({
      type: "recognized",
      sessionId: startedState.sessionId,
      side: "A",
      transcript: "bonjour",
      translation: "hello"
    });
    expect(kioskMocks.log).not.toHaveBeenCalledWith(expect.objectContaining({ event: "transcript_final" }));
    expect(kioskMocks.log).not.toHaveBeenCalledWith(expect.objectContaining({ event: "translation_final" }));

    const previousSessionId = (manager as unknown as { getState: () => AppState }).getState().sessionId;
    manager.handleOperatorAction({ type: "select-target-language", side: "A", targetLanguage: "es" });

    const resetState = (manager as unknown as { getState: () => AppState }).getState();

    expect(resetState.sessionId).not.toBe(previousSessionId);
    expect(resetState.sessionResetReason).toBe("language-change");
    expect(resetState.sessionResetSide).toBe("A");
    expect(resetState.conversationHistory).toEqual([]);
    expect(resetState.sides.A.selectedTargetLanguage).toBe("es");
    expect(resetState.sides.A.localTranscript).toBe("");
    expect(resetState.sides.B.selectedTargetLanguage).toBe("ja");
    expect(resetState.sides.B.remoteTranslation).toBe("");
    expect(kioskMocks.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "language_change",
        details: expect.objectContaining({
          reset_session: true,
          changed_side: "A",
          previous_target_language: "fr"
        })
      })
    );
  });

  it("keeps STT blocked until both sides explicitly confirm their language", () => {
    const manager = new KioskManager(createConfig());

    manager.handleDeviceProbe({
      side: "A",
      devices: [
        { deviceId: "mic-a", groupId: "group-a", label: "Microphone A" },
        { deviceId: "mic-b", groupId: "group-b", label: "Microphone B" }
      ],
      permissionGranted: true
    });
    manager.handleDeviceProbe({
      side: "B",
      devices: [
        { deviceId: "mic-a", groupId: "group-a", label: "Microphone A" },
        { deviceId: "mic-b", groupId: "group-b", label: "Microphone B" }
      ],
      permissionGranted: true
    });

    manager.handleOperatorAction({ type: "request-ptt-down", side: "A" });
    expect((manager as unknown as { getState: () => AppState }).getState().activeSide).toBeNull();

    manager.handleOperatorAction({ type: "select-target-language", side: "A", targetLanguage: "it" });
    manager.handleOperatorAction({ type: "request-ptt-down", side: "A" });
    expect((manager as unknown as { getState: () => AppState }).getState().activeSide).toBeNull();

    manager.handleOperatorAction({ type: "select-target-language", side: "B", targetLanguage: "en" });
    manager.handleOperatorAction({ type: "request-ptt-down", side: "A" });
    expect((manager as unknown as { getState: () => AppState }).getState().activeSide).toBe("A");
  });

  it("runs the scripted demo loop without requiring live provider credentials", () => {
    vi.useFakeTimers();

    const manager = new KioskManager(
      createConfig({
        appMode: "demo",
        chatGptApiKey: "",
        chatGptModel: "",
        chatGptTranscribeModel: ""
      })
    );

    manager.initialize();
    vi.advanceTimersByTime(7_000);

    const state = (manager as unknown as { getState: () => AppState }).getState();

    expect(state.appMode).toBe("demo");
    expect(state.health.blockingIssues).toEqual([]);
    expect(state.sides.A.selectedTargetLanguage).toBeTruthy();
    expect(state.sides.B.selectedTargetLanguage).toBeTruthy();
    expect(["zh-Hans", "yue"]).toContain(state.sides.B.selectedTargetLanguage);
    expect(state.visitorConversationHistoryEnabled).toBe(false);
    expect(state.conversationHistory).toHaveLength(2);

    manager.shutdown();
    vi.useRealTimers();
  });

  it("keeps demo mode reachable even when runtime microphone probes fail", () => {
    const manager = new KioskManager(
      createConfig({
        appMode: "demo",
        chatGptApiKey: "",
        chatGptModel: "",
        chatGptTranscribeModel: ""
      })
    );

    manager.handleDeviceProbe({
      side: "A",
      devices: [],
      permissionGranted: false,
      failureKind: "permission-denied",
      error: "NotAllowedError: Permission denied"
    });

    const state = (manager as unknown as { getState: () => AppState }).getState();

    expect(state.appMode).toBe("demo");
    expect(state.health.microphonesReady).toBe(true);
    expect(state.health.blockingIssues).toEqual([]);
  });

  it("uses the configured demo slide interval for cycle restarts", () => {
    vi.useFakeTimers();

    const manager = new KioskManager(
      createConfig({
        appMode: "demo",
        demoSlideIntervalSeconds: 4,
        chatGptApiKey: "",
        chatGptModel: "",
        chatGptTranscribeModel: ""
      })
    );

    manager.initialize();
    vi.advanceTimersByTime(4_200);

    const cycleStarts = kioskMocks.log.mock.calls.filter(
      ([entry]) => entry && typeof entry === "object" && "event" in (entry as Record<string, unknown>) && (entry as Record<string, unknown>).event === "demo_cycle_start"
    );

    expect(cycleStarts).toHaveLength(2);
    expect(cycleStarts[0]?.[0]).toEqual(
      expect.objectContaining({
        details: expect.objectContaining({
          visitor_history: false
        })
      })
    );
    expect(cycleStarts[1]?.[0]).toEqual(
      expect.objectContaining({
        details: expect.objectContaining({
          visitor_history: true
        })
      })
    );

    manager.shutdown();
    vi.useRealTimers();
  });

  it("pauses the scripted demo loop while the setup wizard is open", () => {
    vi.useFakeTimers();

    const manager = new KioskManager(
      createConfig({
        appMode: "demo",
        chatGptApiKey: "",
        chatGptModel: "",
        chatGptTranscribeModel: ""
      })
    );

    manager.initialize();
    vi.advanceTimersByTime(3_600);
    const stateBeforePause = (manager as unknown as { getState: () => AppState }).getState();

    manager.setDemoPaused(true);
    vi.advanceTimersByTime(15_000);
    const stateWhilePaused = (manager as unknown as { getState: () => AppState }).getState();

    expect(stateWhilePaused.conversationHistory).toEqual(stateBeforePause.conversationHistory);

    manager.setDemoPaused(false);
    vi.advanceTimersByTime(4_000);
    const stateAfterResume = (manager as unknown as { getState: () => AppState }).getState();

    expect(stateAfterResume.conversationHistory.length).toBeGreaterThan(stateWhilePaused.conversationHistory.length);

    manager.shutdown();
    vi.useRealTimers();
  });

  it("uses the Azure TTS engine in azure mode", () => {
    const manager = new KioskManager(
      createConfig({
        translationProvider: "azure",
        azureSpeechKey: "azure-key",
        azureSpeechRegion: "westeurope"
      })
    );

    manager.handleTextToSpeechRequest({
      side: "A",
      content: "translation",
      text: "Buongiorno",
      language: "it-IT"
    });

    const state = (manager as unknown as { getState: () => AppState }).getState();
    expect(state.translationProvider).toBe("azure");
    expect(state.textToSpeech).toEqual(
      expect.objectContaining({
        side: "A",
        content: "translation",
        status: "starting",
        engine: "azure",
        language: "it-IT"
      })
    );
  });

  it("uses the OpenAI TTS engine in chatgpt mode", () => {
    const manager = new KioskManager(createConfig());

    manager.handleTextToSpeechRequest({
      side: "B",
      content: "transcript",
      text: "hello",
      language: "en-US"
    });

    const state = (manager as unknown as { getState: () => AppState }).getState();
    expect(state.translationProvider).toBe("chatgpt");
    expect(state.textToSpeech).toEqual(
      expect.objectContaining({
        side: "B",
        content: "transcript",
        status: "starting",
        engine: "openai",
        language: "en-US"
      })
    );
  });

  it("blocks TTS while live microphone capture is active and surfaces a stable unavailable state", () => {
    const manager = new KioskManager(createConfig());

    manager.handleDeviceProbe({
      side: "A",
      devices: [
        { deviceId: "mic-a", groupId: "group-a", label: "Microphone A" },
        { deviceId: "mic-b", groupId: "group-b", label: "Microphone B" }
      ],
      permissionGranted: true
    });
    manager.handleDeviceProbe({
      side: "B",
      devices: [
        { deviceId: "mic-a", groupId: "group-a", label: "Microphone A" },
        { deviceId: "mic-b", groupId: "group-b", label: "Microphone B" }
      ],
      permissionGranted: true
    });
    manager.handleOperatorAction({ type: "select-target-language", side: "A", targetLanguage: "it" });
    manager.handleOperatorAction({ type: "select-target-language", side: "B", targetLanguage: "en" });
    manager.handleOperatorAction({ type: "request-ptt-down", side: "A" });

    manager.handleTextToSpeechRequest({
      side: "B",
      content: "translation",
      text: "hello",
      language: "en-US"
    });

    const state = (manager as unknown as { getState: () => AppState }).getState();
    expect(state.activeSide).toBe("A");
    expect(state.textToSpeech).toEqual(
      expect.objectContaining({
        side: "B",
        content: "translation",
        requestId: null,
        status: "unavailable",
        error: "Audio playback is unavailable while live microphone capture is active."
      })
    );
  });

  it("does not start TTS playback when runtime TTS is disabled", () => {
    const manager = new KioskManager(
      createConfig({
        textToSpeechEnabled: false
      })
    );

    manager.handleTextToSpeechRequest({
      side: "A",
      content: "translation",
      text: "hello",
      language: "en-US"
    });

    const state = (manager as unknown as { getState: () => AppState }).getState();
    expect(state.textToSpeech).toEqual(
      expect.objectContaining({
        side: "A",
        content: "translation",
        requestId: null,
        status: "unavailable",
        error: "Audio playback is disabled in the current runtime configuration."
      })
    );
    expect(kioskMocks.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "tts_blocked",
        details: expect.objectContaining({
          reason: "runtime_disabled"
        })
      })
    );
  });

  it("clears active TTS state on session reset", () => {
    const manager = new KioskManager(createConfig());

    manager.handleTextToSpeechRequest({
      side: "A",
      content: "translation",
      text: "hello",
      language: "en-US"
    });
    manager.handleOperatorAction({ type: "request-reset", side: "A" });

    const state = (manager as unknown as { getState: () => AppState }).getState();
    expect(state.textToSpeech.status).toBe("idle");
    expect(state.textToSpeech.requestId).toBeNull();
  });

  it("clears active TTS state when a side changes language", () => {
    const manager = new KioskManager(createConfig());

    manager.handleTextToSpeechRequest({
      side: "A",
      content: "translation",
      text: "hello",
      language: "en-US"
    });
    manager.handleOperatorAction({ type: "select-target-language", side: "A", targetLanguage: "fr" });

    const state = (manager as unknown as { getState: () => AppState }).getState();
    expect(state.textToSpeech.status).toBe("idle");
    expect(state.sides.A.selectedTargetLanguage).toBe("fr");
  });

  it("keeps TTS reachable in demo mode for scripted text", () => {
    const manager = new KioskManager(
      createConfig({
        appMode: "demo",
        chatGptApiKey: "",
        chatGptModel: "",
        chatGptTranscribeModel: ""
      })
    );

    manager.handleTextToSpeechRequest({
      side: "B",
      content: "translation",
      text: "Demo translation",
      language: "en-US"
    });

    const state = (manager as unknown as { getState: () => AppState }).getState();
    expect(state.appMode).toBe("demo");
    expect(state.textToSpeech.status).toBe("starting");
  });
});
