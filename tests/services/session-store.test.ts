import { describe, expect, it } from "vitest";
import { SessionStore } from "../../src/services/session/session-store.js";
import { buildCommonProviderInteractionLanguageChoices } from "../../src/shared/language-flow.js";
import type { HealthState, RuntimeConfig } from "../../src/shared/types.js";

function createConfig(): RuntimeConfig {
  return {
    appMode: "kiosk",
    microphonePttMode: "dual-dedicated",
    setupUiLanguage: "en",
    demoSlideIntervalSeconds: 8,
    textToSpeechEnabled: true,
    requiredMonitors: 2,
    requiredMicrophones: 2,
    displayAId: null,
    displayBId: null,
    micAId: null,
    micBId: null,
    idleClearSeconds: 60,
    idleHardResetSeconds: 180,
    pttReleaseGraceMs: 400,
    providerRequestTimeoutMs: 45000,
    azureSpeechKey: "key",
    azureSpeechRegion: "region",
    visitorConversationHistoryEnabled: false,
    audioEchoCancellation: true,
    audioNoiseSuppression: true,
    translationProvider: "chatgpt",
    chatGptApiKey: "chatgpt-key",
    chatGptModel: "gpt-4o-mini",
    chatGptTranscribeModel: "whisper-1",
    chatGptSilenceRmsThreshold: 0.02,
    ollamaBaseUrl: "http://localhost:11434/api",
    ollamaModel: "gemma3",
    ollamaRequestTimeoutMs: 45000,
    ollamaStreamingEnabled: false,
    ollamaApiKey: "",
    defaultTargetLangA: "it",
    defaultTargetLangB: "en",
    defaultSourceLangA: "it-IT",
    defaultSourceLangB: "en-US",
    logLevel: "info"
  };
}

function createHealthyState(): HealthState {
  return {
    displaysReady: true,
    microphonesReady: true,
    speechReady: true,
    translationReady: true,
    blockingIssues: [],
    displayAssignments: [],
    microphoneAssignments: []
  };
}

describe("SessionStore", () => {
  it("starts in language selection mode until both sides explicitly confirm their language", () => {
    const store = new SessionStore(createConfig());
    store.setHealth(createHealthyState());

    expect(store.getState().textToSpeechEnabled).toBe(true);
    expect(store.getState().sides.A.status).toBe("language-selection");
    expect(store.getState().sides.B.status).toBe("language-selection");
    expect(store.getState().sides.A.hasCommittedLanguageSelection).toBe(false);
    expect(store.getState().sides.B.hasCommittedLanguageSelection).toBe(false);
    expect(store.getState().sides.A.selectedInteractionLanguage).toBe("it");
    expect(store.getState().sides.A.normalizedTargetLanguage).toBe("it");
    expect(store.getState().sides.A.requestedUiLanguage).toBe("it");
    expect(store.getState().sides.A.effectiveUiLanguage).toBe("it");
    expect(store.getState().sides.A.usesEnglishUiFallback).toBe(false);
    expect(store.getState().sides.A.selectedTargetLanguage).toBe("it");
    expect(store.getState().sides.A.sourceLanguage).toBe("it-IT");
    expect(store.getState().sides.A.detectedSourceLanguage).toBeNull();
    expect(store.getState().sides.B.selectedInteractionLanguage).toBe("en");
    expect(store.getState().sides.B.normalizedTargetLanguage).toBe("en");
    expect(store.getState().sides.B.requestedUiLanguage).toBe("en");
    expect(store.getState().sides.B.effectiveUiLanguage).toBe("en");
    expect(store.getState().sides.B.usesEnglishUiFallback).toBe(false);
    expect(store.getState().sides.B.selectedTargetLanguage).toBe("en");
    expect(store.getState().sides.B.sourceLanguage).toBe("en-GB");
    expect(store.getState().sides.B.detectedSourceLanguage).toBeNull();

    store.setTargetLanguage("A", "it");
    store.setTargetLanguage("B", "en");

    expect(store.getState().sides.A.status).toBe("ready");
    expect(store.getState().sides.B.status).toBe("ready");
    expect(store.getState().sides.A.hasCommittedLanguageSelection).toBe(true);
    expect(store.getState().sides.B.hasCommittedLanguageSelection).toBe(true);

    store.setActiveSide("A");
    store.updateSpeech("A", "ciao", "hello");
    store.appendConversationTurn("A", "ciao", "hello");

    expect(store.getState().sides.A.status).toBe("listening");
    expect(store.getState().sides.B.status).toBe("translating");
    expect(store.getState().sides.A.localTranscript).toBe("ciao");
    expect(store.getState().sides.B.remoteTranslation).toBe("hello");
    expect(store.getState().conversationHistory).toEqual([
      expect.objectContaining({
        id: "turn-1",
        sequence: 1,
        speakerSide: "A",
        transcript: "ciao",
        translation: "hello",
        sourceLanguage: "it-IT",
        targetLanguage: "en"
      })
    ]);
  });

  it("hard reset clears content and requires the languages to be confirmed again", () => {
    const store = new SessionStore(createConfig());
    store.setHealth(createHealthyState());
    store.setTargetLanguage("A", "en");
    store.setTargetLanguage("B", "it");
    store.updateSpeech("A", "ciao", "hello");
    store.appendConversationTurn("A", "ciao", "hello");

    store.hardReset();

    expect(store.getState().sides.A.selectedTargetLanguage).toBe("it");
    expect(store.getState().sides.A.sourceLanguage).toBe("it-IT");
    expect(store.getState().sides.B.selectedTargetLanguage).toBe("en");
    expect(store.getState().sides.B.sourceLanguage).toBe("en-GB");
    expect(store.getState().sides.A.hasCommittedLanguageSelection).toBe(false);
    expect(store.getState().sides.B.hasCommittedLanguageSelection).toBe(false);
    expect(store.getState().sides.A.status).toBe("language-selection");
    expect(store.getState().sides.B.status).toBe("language-selection");
    expect(store.getState().sides.A.localTranscript).toBe("");
    expect(store.getState().sides.B.remoteTranslation).toBe("");
    expect(store.getState().conversationHistory).toEqual([]);
  });

  it("keeps the operator side fixed to the same interaction language used for reading", () => {
    const store = new SessionStore({
      ...createConfig(),
      defaultTargetLangA: "en"
    });

    expect(store.getState().sides.A.sourceLanguage).toBe("en-GB");

    store.setTargetLanguage("A", "fr");

    expect(store.getState().sides.A.selectedTargetLanguage).toBe("fr");
    expect(store.getState().sides.A.sourceLanguage).toBe("fr-FR");
  });

  it("keeps the visitor side fixed to the same language chosen in the full-screen selector", () => {
    const store = new SessionStore(createConfig());

    expect(store.getState().sides.B.sourceLanguage).toBe("en-GB");

    store.setTargetLanguage("B", "ja");

    expect(store.getState().sides.B.selectedTargetLanguage).toBe("ja");
    expect(store.getState().sides.B.selectedInteractionLanguage).toBe("ja");
    expect(store.getState().sides.B.requestedUiLanguage).toBe("ja");
    expect(store.getState().sides.B.effectiveUiLanguage).toBe("ja");
    expect(store.getState().sides.B.sourceLanguage).toBe("ja-JP");
  });

  it("keeps speech ready when the chosen interaction language has dedicated visitor UI copy and provider support", () => {
    const store = new SessionStore(createConfig());
    store.setHealth(createHealthyState());

    store.setTargetLanguage("B", "bg");

    expect(store.getState().sides.B.selectedInteractionLanguage).toBe("bg");
    expect(store.getState().sides.B.normalizedTargetLanguage).toBe("bg");
    expect(store.getState().sides.B.requestedUiLanguage).toBe("bg");
    expect(store.getState().sides.B.effectiveUiLanguage).toBe("bg");
    expect(store.getState().sides.B.usesEnglishUiFallback).toBe(false);
    expect(store.getState().sides.B.status).toBe("ready");
  });

  it("resets both sides to their configured defaults on idle clear", () => {
    const store = new SessionStore(createConfig());
    store.setHealth(createHealthyState());
    const initialSessionId = store.getState().sessionId;
    store.setTargetLanguage("A", "fr");
    store.setTargetLanguage("B", "ja");
    store.updateSpeech("A", "ciao", "hello");
    store.appendConversationTurn("A", "ciao", "hello");

    store.idleReset();

    expect(store.getState().conversationHistory).toEqual([]);
    expect(store.getState().sessionId).not.toBe(initialSessionId);
    expect(store.getState().clearTriggeredAt).not.toBeNull();
    expect(store.getState().sides.A.selectedTargetLanguage).toBe("it");
    expect(store.getState().sides.A.sourceLanguage).toBe("it-IT");
    expect(store.getState().sides.B.selectedTargetLanguage).toBe("en");
    expect(store.getState().sides.B.sourceLanguage).toBe("en-GB");
  });

  it("starts a new shared session on language change while preserving the opposite side language", () => {
    const store = new SessionStore(createConfig());
    store.setHealth(createHealthyState());
    store.setTargetLanguage("A", "fr");
    store.setTargetLanguage("B", "ja");
    store.updateSpeech("A", "bonjour", "hello");
    store.appendConversationTurn("A", "bonjour", "hello");
    const previousSessionId = store.getState().sessionId;

    store.restartForLanguageChange("A", "es");

    const state = store.getState();
    expect(state.sessionId).not.toBe(previousSessionId);
    expect(state.sessionResetReason).toBe("language-change");
    expect(state.sessionResetSide).toBe("A");
    expect(state.conversationHistory).toEqual([]);
    expect(state.sides.A.selectedTargetLanguage).toBe("es");
    expect(state.sides.A.sourceLanguage).toBe("es-MX");
    expect(state.sides.A.localTranscript).toBe("");
    expect(state.sides.B.selectedTargetLanguage).toBe("ja");
    expect(state.sides.B.sourceLanguage).toBe("ja-JP");
    expect(state.sides.B.remoteTranslation).toBe("");
  });

  it("accepts every common-provider visitor language without snapping back to the wizard default", () => {
    for (const provider of ["azure", "chatgpt"] as const) {
      const store = new SessionStore({
        ...createConfig(),
        translationProvider: provider
      });

      for (const choice of buildCommonProviderInteractionLanguageChoices(provider)) {
        store.setTargetLanguage("B", choice.value);
        const sideState = store.getState().sides.B;
        expect(sideState.selectedInteractionLanguage).toBe(choice.value);
        expect(sideState.selectedTargetLanguage).toBe(choice.value);
        expect(sideState.normalizedTargetLanguage).toBeTruthy();
        expect(sideState.sourceLanguage).toBe(choice.sourceLocale);
      }
    }
  });

  it("keeps provider-specific requested languages when the active provider supports them", () => {
    const azureStore = new SessionStore({
      ...createConfig(),
      translationProvider: "azure"
    });
    azureStore.setTargetLanguage("B", "am");

    expect(azureStore.getState().sides.B).toMatchObject({
      selectedInteractionLanguage: "am",
      selectedTargetLanguage: "am",
      sourceLanguage: "am-ET"
    });

    const chatGptStore = new SessionStore({
      ...createConfig(),
      translationProvider: "chatgpt"
    });
    chatGptStore.setTargetLanguage("B", "be");

    expect(chatGptStore.getState().sides.B).toMatchObject({
      selectedInteractionLanguage: "be",
      selectedTargetLanguage: "be",
      sourceLanguage: "be-BY"
    });
  });

  it("tracks the detected source language for the live transcript and stored history entry", () => {
    const store = new SessionStore(createConfig());
    store.setHealth(createHealthyState());
    store.setTargetLanguage("A", "es");

    store.updateSpeech("A", "hola", "hello", "es");
    store.appendConversationTurn("A", "hola", "hello", "es");

    const state = store.getState();
    expect(state.sides.A.detectedSourceLanguage).toBe("es-MX");
    expect(state.conversationHistory).toEqual([
      expect.objectContaining({
        sourceLanguage: "es-MX",
        transcript: "hola",
        translation: "hello"
      })
    ]);
  });

  it("preserves the detected regional English locale in conversation history", () => {
    const store = new SessionStore(createConfig());
    store.setHealth(createHealthyState());
    store.setTargetLanguage("A", "en");

    store.updateSpeech("A", "hello", "ciao", "en-US");
    store.appendConversationTurn("A", "hello", "ciao", "en-US");

    const state = store.getState();
    expect(state.sides.A.sourceLanguage).toBe("en-GB");
    expect(state.sides.A.detectedSourceLanguage).toBe("en-US");
    expect(state.conversationHistory).toEqual([
      expect.objectContaining({
        sourceLanguage: "en-US",
        transcript: "hello",
        translation: "ciao"
      })
    ]);
  });

  it("ignores incompatible provider language detection when the source language is already configured", () => {
    const store = new SessionStore(createConfig());
    store.setHealth(createHealthyState());
    store.setTargetLanguage("A", "sq");

    store.updateSpeech("A", "Çfarë po bën?", "What are you doing?", "hr");
    store.appendConversationTurn("A", "Çfarë po bën?", "What are you doing?", "hr");

    const state = store.getState();
    expect(state.sides.A.sourceLanguage).toBe("sq-AL");
    expect(state.sides.A.detectedSourceLanguage).toBeNull();
    expect(state.conversationHistory).toEqual([
      expect.objectContaining({
        sourceLanguage: "sq-AL",
        transcript: "Çfarë po bën?",
        translation: "What are you doing?"
      })
    ]);
  });

  it("resets detectedSourceLanguage when the language actually changes via setTargetLanguage", () => {
    const store = new SessionStore(createConfig());
    store.setHealth(createHealthyState());
    store.setTargetLanguage("A", "es");
    store.updateSpeech("A", "hola", "hello", "es");

    expect(store.getState().sides.A.detectedSourceLanguage).toBe("es-MX");

    store.setTargetLanguage("A", "fr");

    expect(store.getState().sides.A.detectedSourceLanguage).toBeNull();
  });

  it("preserves detectedSourceLanguage when the same language is reselected via setTargetLanguage", () => {
    const store = new SessionStore(createConfig());
    store.setHealth(createHealthyState());
    store.setTargetLanguage("A", "es");
    store.updateSpeech("A", "hola", "hello", "es");

    expect(store.getState().sides.A.detectedSourceLanguage).toBe("es-MX");

    store.setTargetLanguage("A", "es");

    expect(store.getState().sides.A.detectedSourceLanguage).toBe("es-MX");
  });

  it("keeps dedicated visitor runtime copy when the selected language is localized", () => {
    const store = new SessionStore(createConfig());

    store.setTargetLanguage("B", "ka");

    const sideState = store.getState().sides.B;
    expect(sideState.selectedTargetLanguage).toBe("ka");
    expect(sideState.usesEnglishUiFallback).toBe(false);
    expect(sideState.effectiveUiLanguage).toBe("ka");
    expect(sideState.requestedUiLanguage).toBe("ka");
  });

  it("keeps dedicated operator runtime copy when the selected side A language is localized", () => {
    const store = new SessionStore({
      ...createConfig(),
      setupUiLanguage: "it"
    });

    store.setTargetLanguage("A", "fr");

    expect(store.getState().sides.A).toMatchObject({
      selectedTargetLanguage: "fr",
      sourceLanguage: "fr-FR",
      wizardDefaultUiLanguage: "it",
      requestedUiLanguage: "fr",
      effectiveUiLanguage: "fr",
      usesEnglishUiFallback: false
    });
  });

  it("keeps separate selector UI defaults for operator and visitor sides", () => {
    const store = new SessionStore({
      ...createConfig(),
      setupUiLanguage: "it",
      selectorUiLanguageA: "fr",
      selectorUiLanguageB: "de"
    });

    expect(store.getState().sides.A.wizardDefaultUiLanguage).toBe("fr");
    expect(store.getState().sides.B.wizardDefaultUiLanguage).toBe("de");
  });
});
