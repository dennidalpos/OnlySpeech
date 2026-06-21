import { describe, expect, it } from "vitest";
import { hasSpeechRecognitionConfig, hasTranslationProviderConfig, loadRuntimeConfig } from "../src/shared/config.js";

describe("loadRuntimeConfig", () => {
  it("parses numeric and optional values", () => {
    const config = loadRuntimeConfig({
      APP_MODE: "kiosk",
      DEMO_SLIDE_INTERVAL_SECONDS: "12",
      TEXT_TO_SPEECH_ENABLED: "false",
      RUNTIME_DISCLOSURE_MODE: "custom",
      RUNTIME_DISCLOSURE_CUSTOM_TEXT: "Custom runtime notice.\nSecond paragraph.",
      REQUIRED_MONITORS: "2",
      REQUIRED_MICROPHONES: "2",
      DISPLAY_A_ID: "101",
      DISPLAY_B_ID: "202",
      MIC_A_ID: "mic-a",
      MIC_B_ID: "mic-b",
      IDLE_CLEAR_SECONDS: "30",
      IDLE_HARD_RESET_SECONDS: "90",
      PTT_RELEASE_GRACE_MS: "450",
      PROVIDER_REQUEST_TIMEOUT_MS: "15000",
      CHATGPT_SILENCE_RMS_THRESHOLD: "0.05",
      VISITOR_CONVERSATION_HISTORY_ENABLED: "true",
      AUDIO_ECHO_CANCELLATION: "false",
      AUDIO_NOISE_SUPPRESSION: "false",
      CHATGPT_API_KEY: "chatgpt-key",
      CHATGPT_MODEL: "gpt-4.1-mini",
      CHATGPT_TRANSCRIBE_MODEL: "gpt-4o-mini-transcribe",
      TRANSLATION_PROVIDER: "chatgpt",
      DEFAULT_TARGET_LANG_A: "fr",
      DEFAULT_TARGET_LANG_B: "de",
      LOG_LEVEL: "debug"
    });

    expect(config.requiredMonitors).toBe(2);
    expect(config.demoSlideIntervalSeconds).toBe(12);
    expect(config.textToSpeechEnabled).toBe(false);
    expect(config.runtimeDisclosure).toEqual({
      mode: "custom",
      customText: "Custom runtime notice.\nSecond paragraph."
    });
    expect(config.displayAId).toBe(101);
    expect(config.displayBId).toBe(202);
    expect(config.micAId).toBe("mic-a");
    expect(config.pttReleaseGraceMs).toBe(450);
    expect(config.providerRequestTimeoutMs).toBe(15000);
    expect(config.chatGptSilenceRmsThreshold).toBe(0.05);
    expect(config.visitorConversationHistoryEnabled).toBe(true);
    expect(config.audioEchoCancellation).toBe(false);
    expect(config.audioNoiseSuppression).toBe(false);
    expect(config.translationProvider).toBe("chatgpt");
    expect(config.setupUiLanguage).toBe("en");
    expect(config.selectorUiLanguageA).toBe("en");
    expect(config.selectorUiLanguageB).toBe("en");
    expect(config.defaultTargetLangA).toBe("fr");
    expect(config.defaultTargetLangB).toBe("de");
    expect(config.defaultSourceLangA).toBe("fr-FR");
    expect(config.defaultSourceLangB).toBe("de-DE");
    expect(hasSpeechRecognitionConfig(config)).toBe(true);
    expect(hasTranslationProviderConfig(config)).toBe(true);
  });

  it("falls back when values are missing", () => {
    const config = loadRuntimeConfig({});

    expect(config.requiredMonitors).toBe(2);
    expect(config.demoSlideIntervalSeconds).toBe(8);
    expect(config.textToSpeechEnabled).toBe(true);
    expect(config.runtimeDisclosure).toEqual({
      mode: "standard",
      customText: null
    });
    expect(config.displayAId).toBeNull();
    expect(config.micAId).toBeNull();
    expect(config.translationProvider).toBe("chatgpt");
    expect(config.setupUiLanguage).toBe("en");
    expect(config.selectorUiLanguageA).toBe("en");
    expect(config.selectorUiLanguageB).toBe("en");
    expect(config.providerRequestTimeoutMs).toBe(45000);
    expect(config.chatGptSilenceRmsThreshold).toBe(0.02);
    expect(config.visitorConversationHistoryEnabled).toBe(false);
    expect(config.audioEchoCancellation).toBe(true);
    expect(config.audioNoiseSuppression).toBe(true);
    expect(config.defaultTargetLangA).toBe("en");
    expect(config.defaultTargetLangB).toBe("en");
    expect(config.defaultSourceLangA).toBe("en-GB");
    expect(config.defaultSourceLangB).toBe("en-GB");
    expect(hasSpeechRecognitionConfig(config)).toBe(false);
    expect(hasTranslationProviderConfig(config)).toBe(false);
  });

  it("requires chatgpt transcription settings for full speech pipeline", () => {
    const config = loadRuntimeConfig({
      TRANSLATION_PROVIDER: "chatgpt",
      CHATGPT_API_KEY: "chatgpt-key",
      CHATGPT_MODEL: "gpt-4.1-mini",
      CHATGPT_TRANSCRIBE_MODEL: "gpt-4o-mini-transcribe"
    });

    expect(hasSpeechRecognitionConfig(config)).toBe(true);
    expect(hasTranslationProviderConfig(config)).toBe(true);
  });

  it("rejects unsupported default languages when env values are invalid", () => {
    expect(() =>
      loadRuntimeConfig({
        DEFAULT_TARGET_LANG_A: "invalid-target",
        DEFAULT_TARGET_LANG_B: "still-invalid"
      })
    ).toThrow(
      "DEFAULT_TARGET_LANG_A='invalid-target' is not supported by the provider language registry for translation provider 'chatgpt'."
    );
  });

  it("rejects provider-only language codes outside the active interaction registry", () => {
    expect(() =>
      loadRuntimeConfig({
        DEFAULT_TARGET_LANG_A: "prs",
        DEFAULT_TARGET_LANG_B: "tlh-Latn"
      })
    ).toThrow(
      "DEFAULT_TARGET_LANG_A='prs' is not supported by the provider language registry for translation provider 'chatgpt'."
    );
  });

  it("normalizes locale-style env language values to the canonical product registry", () => {
    const config = loadRuntimeConfig({
      DEFAULT_TARGET_LANG_A: "zh-CN",
      DEFAULT_TARGET_LANG_B: "pt-BR"
    });

    expect(config.defaultTargetLangA).toBe("zh-Hans");
    expect(config.defaultTargetLangB).toBe("pt");
    expect(config.defaultSourceLangA).toBe("zh-CN");
    expect(config.defaultSourceLangB).toBe("pt-BR");
  });

  it("falls back to the demo slide default when the configured value is invalid", () => {
    const config = loadRuntimeConfig({
      DEMO_SLIDE_INTERVAL_SECONDS: "not-a-number"
    });

    expect(config.demoSlideIntervalSeconds).toBe(8);
  });

  it("clamps required monitors to the supported two-display product range", () => {
    expect(loadRuntimeConfig({ REQUIRED_MONITORS: "0" }).requiredMonitors).toBe(2);
    expect(loadRuntimeConfig({ REQUIRED_MONITORS: "3" }).requiredMonitors).toBe(2);
  });

  it("normalizes unsupported numeric env values to safe runtime defaults", () => {
    const config = loadRuntimeConfig({
      APP_MODE: "kiosk",
      MICROPHONE_PTT_MODE: "dual-dedicated",
      REQUIRED_MICROPHONES: "0",
      IDLE_CLEAR_SECONDS: "-1",
      IDLE_HARD_RESET_SECONDS: "-10",
      PTT_RELEASE_GRACE_MS: "-50",
      PROVIDER_REQUEST_TIMEOUT_MS: "0",
      CHATGPT_SILENCE_RMS_THRESHOLD: "5"
    });

    expect(config.requiredMicrophones).toBe(2);
    expect(config.idleClearSeconds).toBe(60);
    expect(config.idleHardResetSeconds).toBe(180);
    expect(config.pttReleaseGraceMs).toBe(400);
    expect(config.providerRequestTimeoutMs).toBe(45000);
    expect(config.chatGptSilenceRmsThreshold).toBe(0.02);
  });

  it("keeps the wizard-supported zero values for demo microphones and disabled idle timers", () => {
    const config = loadRuntimeConfig({
      APP_MODE: "demo",
      REQUIRED_MICROPHONES: "0",
      IDLE_CLEAR_SECONDS: "0",
      IDLE_HARD_RESET_SECONDS: "0",
      PTT_RELEASE_GRACE_MS: "0",
      CHATGPT_SILENCE_RMS_THRESHOLD: "0"
    });

    expect(config.requiredMicrophones).toBe(0);
    expect(config.idleClearSeconds).toBe(0);
    expect(config.idleHardResetSeconds).toBe(0);
    expect(config.pttReleaseGraceMs).toBe(0);
    expect(config.chatGptSilenceRmsThreshold).toBe(0);
  });

  it("parses text-to-speech runtime toggles from env", () => {
    expect(loadRuntimeConfig({ TEXT_TO_SPEECH_ENABLED: "true" }).textToSpeechEnabled).toBe(true);
    expect(loadRuntimeConfig({ TEXT_TO_SPEECH_ENABLED: "false" }).textToSpeechEnabled).toBe(false);
  });

  it("normalizes runtime disclosure env settings", () => {
    expect(loadRuntimeConfig({ RUNTIME_DISCLOSURE_MODE: "disabled" }).runtimeDisclosure).toEqual({
      mode: "disabled",
      customText: null
    });
    expect(
      loadRuntimeConfig({
        RUNTIME_DISCLOSURE_MODE: "custom",
        RUNTIME_DISCLOSURE_CUSTOM_TEXT: "  Custom runtime notice  "
      }).runtimeDisclosure
    ).toEqual({
      mode: "custom",
      customText: "Custom runtime notice"
    });
  });

  it("normalizes the persisted setup UI language independently from the runtime language defaults", () => {
    const config = loadRuntimeConfig({
      SETUP_UI_LANGUAGE: "it-IT",
      DEFAULT_TARGET_LANG_A: "en",
      DEFAULT_TARGET_LANG_B: "ja"
    });

    expect(config.setupUiLanguage).toBe("it");
    expect(config.selectorUiLanguageA).toBe("it");
    expect(config.selectorUiLanguageB).toBe("it");
    expect(config.defaultTargetLangA).toBe("en");
    expect(config.defaultTargetLangB).toBe("ja");
  });

  it("accepts explicit selector UI defaults per side while keeping setup UI as the fallback", () => {
    const config = loadRuntimeConfig({
      SETUP_UI_LANGUAGE: "it",
      SELECTOR_UI_LANGUAGE_A: "fr-FR",
      SELECTOR_UI_LANGUAGE_B: "de-DE"
    });

    expect(config.setupUiLanguage).toBe("it");
    expect(config.selectorUiLanguageA).toBe("fr");
    expect(config.selectorUiLanguageB).toBe("de");
  });

  it("treats blank selector UI defaults as an explicit fallback to the setup UI language", () => {
    const config = loadRuntimeConfig({
      SETUP_UI_LANGUAGE: "it",
      SELECTOR_UI_LANGUAGE_A: "",
      SELECTOR_UI_LANGUAGE_B: ""
    });

    expect(config.setupUiLanguage).toBe("it");
    expect(config.selectorUiLanguageA).toBe("it");
    expect(config.selectorUiLanguageB).toBe("it");
  });

  it("parses optional azure translator playback-normalization settings", () => {
    const config = loadRuntimeConfig({
      AZURE_TRANSLATOR_KEY: "translator-key",
      AZURE_TRANSLATOR_REGION: "westeurope",
      AZURE_TRANSLATOR_ENDPOINT: "https://translator.example.test"
    });

    expect(config.azureTranslatorKey).toBe("translator-key");
    expect(config.azureTranslatorRegion).toBe("westeurope");
    expect(config.azureTranslatorEndpoint).toBe("https://translator.example.test");
  });
});
