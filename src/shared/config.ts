import { config as loadEnv } from "dotenv";
import { z } from "zod";
import {
  findInteractionLanguageChoice
} from "./language-registry.js";
import { resolveSynchronizedSourceLanguage } from "./language-flow.js";
import { normalizeVisitorLocalizationLanguageKey } from "./visitor-language-readiness.js";
import {
  DEFAULT_APP_MODE,
  DEFAULT_MICROPHONE_PTT_MODE,
  SUPPORTED_APP_MODES,
  SUPPORTED_MICROPHONE_PTT_MODES
} from "./runtime-profiles.js";
import { RUNTIME_ENV_DEFAULTS } from "./runtime-env-contract.js";
import { normalizeRuntimeEnvValues } from "./runtime-env-normalization.js";
import { normalizeRuntimeDisclosureMode } from "./runtime-disclosure.js";
import type {
  ChatGptTranslationDetectedLanguageMode,
  ProviderLanguageContractMode,
  RuntimeConfig,
  TranslationProvider,
  UiLanguage
} from "./types.js";

loadEnv({ quiet: true });

const numberFromEnv = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((value) => {
      if (!value) {
        return fallback;
      }

      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    });

const nullableNumber = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  });

const nullableString = z
  .string()
  .optional()
  .transform((value) => (value && value.trim().length > 0 ? value.trim() : null));

const booleanFromEnv = (fallback: boolean) =>
  z
    .string()
    .optional()
    .transform((value) => {
      if (!value) {
        return fallback;
      }

      const normalized = value.trim().toLowerCase();
      if (["1", "true", "yes", "on"].includes(normalized)) {
        return true;
      }

      if (["0", "false", "no", "off"].includes(normalized)) {
        return false;
      }

      return fallback;
    });

const translationProvider = z
  .enum(["azure", "chatgpt", "ollama"] satisfies [TranslationProvider, ...TranslationProvider[]])
  .catch(RUNTIME_ENV_DEFAULTS.TRANSLATION_PROVIDER as TranslationProvider);

const providerLanguageContractMode = z
  .enum(["strict", "compatible"] satisfies [ProviderLanguageContractMode, ...ProviderLanguageContractMode[]])
  .catch(RUNTIME_ENV_DEFAULTS.PROVIDER_LANGUAGE_CONTRACT_MODE as ProviderLanguageContractMode);

const chatGptTranslationDetectedLanguageMode = z
  .enum(["off", "diagnostic", "adaptive"] satisfies [
    ChatGptTranslationDetectedLanguageMode,
    ...ChatGptTranslationDetectedLanguageMode[]
  ])
  .catch(
    RUNTIME_ENV_DEFAULTS.CHATGPT_TRANSLATION_DETECTED_LANGUAGE_MODE as ChatGptTranslationDetectedLanguageMode
  );

const setupUiLanguage = z
  .string()
  .optional()
  .transform<UiLanguage>((value) =>
    normalizeVisitorLocalizationLanguageKey(value ?? RUNTIME_ENV_DEFAULTS.SETUP_UI_LANGUAGE)
  );

const optionalSelectorUiLanguage = z
  .string()
  .optional()
  .transform<UiLanguage | undefined>((value) => {
    if (!value || value.trim().length === 0) {
      return undefined;
    }

    return normalizeVisitorLocalizationLanguageKey(value);
  });

function resolveConfiguredTargetLanguage(
  envKey: "DEFAULT_TARGET_LANG_A" | "DEFAULT_TARGET_LANG_B",
  value: string,
  translationProvider: TranslationProvider
): string {
  const resolved = findInteractionLanguageChoice(value, translationProvider, {
    includeProviderExpansions: true
  });

  if (!resolved) {
    throw new Error(
      `${envKey}='${value}' is not supported by the provider language registry for translation provider '${translationProvider}'.`
    );
  }

  return resolved.value;
}

const schema = z.object({
  APP_MODE: z.enum(SUPPORTED_APP_MODES).catch(DEFAULT_APP_MODE),
  MICROPHONE_PTT_MODE: z.enum(SUPPORTED_MICROPHONE_PTT_MODES).catch(DEFAULT_MICROPHONE_PTT_MODE),
  SETUP_UI_LANGUAGE: setupUiLanguage,
  SELECTOR_UI_LANGUAGE_A: optionalSelectorUiLanguage,
  SELECTOR_UI_LANGUAGE_B: optionalSelectorUiLanguage,
  DEMO_SLIDE_INTERVAL_SECONDS: numberFromEnv(Number(RUNTIME_ENV_DEFAULTS.DEMO_SLIDE_INTERVAL_SECONDS)),
  TEXT_TO_SPEECH_ENABLED: booleanFromEnv(RUNTIME_ENV_DEFAULTS.TEXT_TO_SPEECH_ENABLED === "true"),
  RUNTIME_DISCLOSURE_MODE: z.string().default(RUNTIME_ENV_DEFAULTS.RUNTIME_DISCLOSURE_MODE),
  RUNTIME_DISCLOSURE_CUSTOM_TEXT: nullableString,
  REQUIRED_MONITORS: numberFromEnv(Number(RUNTIME_ENV_DEFAULTS.REQUIRED_MONITORS)),
  REQUIRED_MICROPHONES: numberFromEnv(Number(RUNTIME_ENV_DEFAULTS.REQUIRED_MICROPHONES)),
  DISPLAY_A_ID: nullableNumber,
  DISPLAY_B_ID: nullableNumber,
  MIC_A_ID: nullableString,
  MIC_B_ID: nullableString,
  IDLE_CLEAR_SECONDS: numberFromEnv(Number(RUNTIME_ENV_DEFAULTS.IDLE_CLEAR_SECONDS)),
  IDLE_HARD_RESET_SECONDS: numberFromEnv(Number(RUNTIME_ENV_DEFAULTS.IDLE_HARD_RESET_SECONDS)),
  PTT_RELEASE_GRACE_MS: numberFromEnv(Number(RUNTIME_ENV_DEFAULTS.PTT_RELEASE_GRACE_MS)),
  PROVIDER_REQUEST_TIMEOUT_MS: numberFromEnv(Number(RUNTIME_ENV_DEFAULTS.PROVIDER_REQUEST_TIMEOUT_MS)),
  CHATGPT_SILENCE_RMS_THRESHOLD: numberFromEnv(Number(RUNTIME_ENV_DEFAULTS.CHATGPT_SILENCE_RMS_THRESHOLD)),
  VISITOR_CONVERSATION_HISTORY_ENABLED: booleanFromEnv(
    RUNTIME_ENV_DEFAULTS.VISITOR_CONVERSATION_HISTORY_ENABLED === "true"
  ),
  AUDIO_ECHO_CANCELLATION: booleanFromEnv(RUNTIME_ENV_DEFAULTS.AUDIO_ECHO_CANCELLATION === "true"),
  AUDIO_NOISE_SUPPRESSION: booleanFromEnv(RUNTIME_ENV_DEFAULTS.AUDIO_NOISE_SUPPRESSION === "true"),
  AUDIO_CAPTURE_SETTINGS_DIAGNOSTICS_ENABLED: booleanFromEnv(
    RUNTIME_ENV_DEFAULTS.AUDIO_CAPTURE_SETTINGS_DIAGNOSTICS_ENABLED === "true"
  ),
  AZURE_SPEECH_KEY: z.string().optional().default(RUNTIME_ENV_DEFAULTS.AZURE_SPEECH_KEY),
  AZURE_SPEECH_REGION: z.string().optional().default(RUNTIME_ENV_DEFAULTS.AZURE_SPEECH_REGION),
  AZURE_TRANSLATOR_KEY: z.string().optional().default(RUNTIME_ENV_DEFAULTS.AZURE_TRANSLATOR_KEY),
  AZURE_TRANSLATOR_REGION: z.string().optional().default(RUNTIME_ENV_DEFAULTS.AZURE_TRANSLATOR_REGION),
  AZURE_TRANSLATOR_ENDPOINT: nullableString,
  TRANSLATION_PROVIDER: translationProvider.default(RUNTIME_ENV_DEFAULTS.TRANSLATION_PROVIDER as TranslationProvider),
  PROVIDER_LANGUAGE_CONTRACT_MODE: providerLanguageContractMode.default(
    RUNTIME_ENV_DEFAULTS.PROVIDER_LANGUAGE_CONTRACT_MODE as ProviderLanguageContractMode
  ),
  CHATGPT_API_KEY: z.string().optional().default(RUNTIME_ENV_DEFAULTS.CHATGPT_API_KEY),
  CHATGPT_MODEL: z.string().optional().default(RUNTIME_ENV_DEFAULTS.CHATGPT_MODEL),
  CHATGPT_TRANSCRIBE_MODEL: z.string().optional().default(RUNTIME_ENV_DEFAULTS.CHATGPT_TRANSCRIBE_MODEL),
  CHATGPT_STT_LANGUAGE_PROMPT_ENABLED: booleanFromEnv(
    RUNTIME_ENV_DEFAULTS.CHATGPT_STT_LANGUAGE_PROMPT_ENABLED === "true"
  ),
  CHATGPT_TRANSLATION_DETECTED_LANGUAGE_MODE: chatGptTranslationDetectedLanguageMode.default(
    RUNTIME_ENV_DEFAULTS.CHATGPT_TRANSLATION_DETECTED_LANGUAGE_MODE as ChatGptTranslationDetectedLanguageMode
  ),
  OPENAI_TTS_LANGUAGE_INSTRUCTIONS_ENABLED: booleanFromEnv(
    RUNTIME_ENV_DEFAULTS.OPENAI_TTS_LANGUAGE_INSTRUCTIONS_ENABLED === "true"
  ),
  AZURE_TTS_LANG_ELEMENT_ENABLED: booleanFromEnv(RUNTIME_ENV_DEFAULTS.AZURE_TTS_LANG_ELEMENT_ENABLED === "true"),
  OLLAMA_BASE_URL: z.string().optional().default(RUNTIME_ENV_DEFAULTS.OLLAMA_BASE_URL),
  OLLAMA_MODEL: z.string().optional().default(RUNTIME_ENV_DEFAULTS.OLLAMA_MODEL),
  OLLAMA_REQUEST_TIMEOUT_MS: numberFromEnv(Number(RUNTIME_ENV_DEFAULTS.OLLAMA_REQUEST_TIMEOUT_MS)),
  OLLAMA_STREAMING_ENABLED: booleanFromEnv(RUNTIME_ENV_DEFAULTS.OLLAMA_STREAMING_ENABLED === "true"),
  OLLAMA_API_KEY: z.string().optional().default(RUNTIME_ENV_DEFAULTS.OLLAMA_API_KEY),
  DEFAULT_TARGET_LANG_A: z.string().default(RUNTIME_ENV_DEFAULTS.DEFAULT_TARGET_LANG_A),
  DEFAULT_TARGET_LANG_B: z.string().default(RUNTIME_ENV_DEFAULTS.DEFAULT_TARGET_LANG_B),
  LOG_LEVEL: z.string().default(RUNTIME_ENV_DEFAULTS.LOG_LEVEL)
});

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const parsed = schema.parse(normalizeRuntimeEnvValues(env));
  const defaultTargetLangA = resolveConfiguredTargetLanguage(
    "DEFAULT_TARGET_LANG_A",
    parsed.DEFAULT_TARGET_LANG_A,
    parsed.TRANSLATION_PROVIDER
  );
  const defaultTargetLangB = resolveConfiguredTargetLanguage(
    "DEFAULT_TARGET_LANG_B",
    parsed.DEFAULT_TARGET_LANG_B,
    parsed.TRANSLATION_PROVIDER
  );
  const defaultSourceLangA = resolveSynchronizedSourceLanguage(
    defaultTargetLangA,
    "en-US",
    parsed.TRANSLATION_PROVIDER
  );
  const defaultSourceLangB = resolveSynchronizedSourceLanguage(
    defaultTargetLangB,
    "en-US",
    parsed.TRANSLATION_PROVIDER
  );

  return {
    appMode: parsed.APP_MODE,
    microphonePttMode: parsed.MICROPHONE_PTT_MODE,
    setupUiLanguage: parsed.SETUP_UI_LANGUAGE,
    selectorUiLanguageA: parsed.SELECTOR_UI_LANGUAGE_A ?? parsed.SETUP_UI_LANGUAGE,
    selectorUiLanguageB: parsed.SELECTOR_UI_LANGUAGE_B ?? parsed.SETUP_UI_LANGUAGE,
    demoSlideIntervalSeconds: parsed.DEMO_SLIDE_INTERVAL_SECONDS,
    runtimeDisclosure: {
      mode: normalizeRuntimeDisclosureMode(parsed.RUNTIME_DISCLOSURE_MODE),
      customText: parsed.RUNTIME_DISCLOSURE_CUSTOM_TEXT
    },
    textToSpeechEnabled: parsed.TEXT_TO_SPEECH_ENABLED,
    requiredMonitors: parsed.REQUIRED_MONITORS,
    requiredMicrophones: parsed.REQUIRED_MICROPHONES,
    displayAId: parsed.DISPLAY_A_ID,
    displayBId: parsed.DISPLAY_B_ID,
    micAId: parsed.MIC_A_ID,
    micBId: parsed.MIC_B_ID,
    idleClearSeconds: parsed.IDLE_CLEAR_SECONDS,
    idleHardResetSeconds: parsed.IDLE_HARD_RESET_SECONDS,
    pttReleaseGraceMs: parsed.PTT_RELEASE_GRACE_MS,
    providerRequestTimeoutMs: parsed.PROVIDER_REQUEST_TIMEOUT_MS,
    chatGptSilenceRmsThreshold: parsed.CHATGPT_SILENCE_RMS_THRESHOLD,
    visitorConversationHistoryEnabled: parsed.VISITOR_CONVERSATION_HISTORY_ENABLED,
    audioEchoCancellation: parsed.AUDIO_ECHO_CANCELLATION,
    audioNoiseSuppression: parsed.AUDIO_NOISE_SUPPRESSION,
    audioCaptureSettingsDiagnosticsEnabled: parsed.AUDIO_CAPTURE_SETTINGS_DIAGNOSTICS_ENABLED,
    azureSpeechKey: parsed.AZURE_SPEECH_KEY,
    azureSpeechRegion: parsed.AZURE_SPEECH_REGION,
    azureTranslatorKey: parsed.AZURE_TRANSLATOR_KEY,
    azureTranslatorRegion: parsed.AZURE_TRANSLATOR_REGION,
    azureTranslatorEndpoint: parsed.AZURE_TRANSLATOR_ENDPOINT,
    translationProvider: parsed.TRANSLATION_PROVIDER,
    providerLanguageContractMode: parsed.PROVIDER_LANGUAGE_CONTRACT_MODE,
    chatGptApiKey: parsed.CHATGPT_API_KEY,
    chatGptModel: parsed.CHATGPT_MODEL,
    chatGptTranscribeModel: parsed.CHATGPT_TRANSCRIBE_MODEL,
    chatGptSttLanguagePromptEnabled: parsed.CHATGPT_STT_LANGUAGE_PROMPT_ENABLED,
    chatGptTranslationDetectedLanguageMode: parsed.CHATGPT_TRANSLATION_DETECTED_LANGUAGE_MODE,
    openAiTtsLanguageInstructionsEnabled: parsed.OPENAI_TTS_LANGUAGE_INSTRUCTIONS_ENABLED,
    azureTtsLangElementEnabled: parsed.AZURE_TTS_LANG_ELEMENT_ENABLED,
    ollamaBaseUrl: parsed.OLLAMA_BASE_URL,
    ollamaModel: parsed.OLLAMA_MODEL,
    ollamaRequestTimeoutMs: parsed.OLLAMA_REQUEST_TIMEOUT_MS,
    ollamaStreamingEnabled: parsed.OLLAMA_STREAMING_ENABLED,
    ollamaApiKey: parsed.OLLAMA_API_KEY,
    defaultTargetLangA,
    defaultTargetLangB,
    defaultSourceLangA: defaultSourceLangA ?? "en-US",
    defaultSourceLangB: defaultSourceLangB ?? "en-US",
    logLevel: parsed.LOG_LEVEL
  };
}

export function hasSpeechRecognitionConfig(config: RuntimeConfig): boolean {
  switch (config.translationProvider) {
    case "azure":
      return Boolean(config.azureSpeechKey.trim() && config.azureSpeechRegion.trim());
    case "chatgpt":
      return Boolean(config.chatGptApiKey.trim() && config.chatGptTranscribeModel.trim());
    case "ollama":
      return false;
    default:
      return false;
  }
}

export function hasTranslationProviderConfig(config: RuntimeConfig): boolean {
  switch (config.translationProvider) {
    case "azure":
      return hasSpeechRecognitionConfig(config);
    case "chatgpt":
      return Boolean(
        config.chatGptApiKey.trim() && config.chatGptModel.trim() && config.chatGptTranscribeModel.trim()
      );
    case "ollama":
      return Boolean(config.ollamaBaseUrl.trim() && config.ollamaModel.trim());
    default:
      return false;
  }
}
