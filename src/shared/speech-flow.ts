import {
  findSourceLanguageOption
} from "./language-options.js";
import { resolveChatGptTranscriptionLanguagePolicy } from "./provider-language-policy.js";
import { resolveSynchronizedSourceLanguage } from "./language-flow.js";
import type { SideState, TranslationProvider } from "./types.js";

export interface SpeechStartParameters {
  sourceLanguage: string;
}

export function resolveChatGptTranscriptionLanguageHint(
  sourceLanguage: string | null | undefined
): string | undefined {
  return resolveChatGptTranscriptionLanguagePolicy(sourceLanguage)?.languageHint ?? undefined;
}

function resolveChatGptTranscriptionPromptLabel(sourceLanguage: string): string {
  const normalizedSourceLanguage = sourceLanguage.trim();
  const baseLanguageCode = normalizedSourceLanguage.split("-")[0] ?? normalizedSourceLanguage;

  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
    const localizedLabel = displayNames.of(baseLanguageCode);
    if (localizedLabel) {
      return localizedLabel;
    }
  } catch {
    // Ignore Intl display-name failures and continue to deterministic fallbacks.
  }

  return findSourceLanguageOption(normalizedSourceLanguage)?.label ?? baseLanguageCode;
}

export function resolveChatGptTranscriptionPrompt(
  sourceLanguage: string | null | undefined
): string | undefined {
  if (!sourceLanguage) {
    return undefined;
  }

  const transcriptionPolicy = resolveChatGptTranscriptionLanguagePolicy(sourceLanguage);
  if (transcriptionPolicy && !transcriptionPolicy.usesPromptFallback) {
    return undefined;
  }

  const languageLabel = resolveChatGptTranscriptionPromptLabel(sourceLanguage);
  return `The audio is primarily in ${languageLabel}. Return only a verbatim transcript in the original spoken language.`;
}

export function resolveSpeechTurnSourceLanguage(
  sourceLanguage: string,
  _detectedLanguage: string | undefined
): string {
  return sourceLanguage;
}

export function resolveSpeechStartParameters(options: {
  translationProvider: TranslationProvider;
  sourceLanguage: string | null;
}): SpeechStartParameters {
  return {
    sourceLanguage: options.sourceLanguage?.trim() || "en-US"
  };
}

export function resolveSideSpeechStartParameters(
  translationProvider: TranslationProvider,
  sideState: SideState
): SpeechStartParameters {
  const synchronizedSourceLanguage =
    sideState.sourceLanguage?.trim() ||
    resolveSynchronizedSourceLanguage(
      sideState.selectedTargetLanguage ?? sideState.normalizedTargetLanguage,
      "en-US",
      translationProvider
    );

  return resolveSpeechStartParameters({
    translationProvider,
    sourceLanguage: synchronizedSourceLanguage
  });
}
