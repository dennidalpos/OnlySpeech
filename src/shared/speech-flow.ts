import {
  findSourceLanguageOption
} from "./language-options.js";
import { resolveInteractionLanguageSourceLocale } from "./language-registry.js";
import { resolveProviderLanguageContract } from "./provider-language-contract.js";
import { resolveChatGptTranscriptionLanguagePolicy } from "./provider-language-policy.js";
import { resolveSynchronizedSourceLanguage } from "./language-flow.js";
import type { ChatGptTranslationDetectedLanguageMode, SideState, TranslationProvider } from "./types.js";

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
  sourceLanguage: string | null | undefined,
  options: { alwaysInclude?: boolean } = {}
): string | undefined {
  if (!sourceLanguage) {
    return undefined;
  }

  const transcriptionPolicy = resolveChatGptTranscriptionLanguagePolicy(sourceLanguage);
  if (!options.alwaysInclude && transcriptionPolicy && !transcriptionPolicy.usesPromptFallback) {
    return undefined;
  }

  const languageLabel = resolveChatGptTranscriptionPromptLabel(sourceLanguage);
  return [
    `The audio is primarily in ${languageLabel}.`,
    `Treat ${languageLabel} as the configured source language for this turn.`,
    "Ignore background voices or noise that do not match the configured source language.",
    "Return only a verbatim transcript in the original spoken language.",
    "Do not translate the transcript."
  ].join(" ");
}

export function resolveSpeechTurnSourceLanguage(
  sourceLanguage: string,
  detectedLanguage: string | undefined,
  detectedLanguageMode: ChatGptTranslationDetectedLanguageMode = "diagnostic"
): string {
  if (detectedLanguageMode === "adaptive" && detectedLanguage?.trim()) {
    return (
      resolveInteractionLanguageSourceLocale(detectedLanguage, "chatgpt", {
        includeProviderExpansions: true
      }) ?? detectedLanguage.trim()
    );
  }

  return sourceLanguage;
}

function resolveInstructionLanguageLabel(contract: ReturnType<typeof resolveProviderLanguageContract>): string {
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
    const label = displayNames.of(contract.canonicalBcp47);
    if (label) {
      return label;
    }
  } catch {
    // Keep instructions deterministic even when Intl data is incomplete.
  }

  return contract.englishLabel || contract.displayLabel || contract.selectedLanguage;
}

export function resolveTextToSpeechLanguageInstructions(
  provider: TranslationProvider,
  language: string | null | undefined
): string | undefined {
  if (!language?.trim()) {
    return undefined;
  }

  const contract = resolveProviderLanguageContract({
    provider,
    language
  });
  const languageLabel = resolveInstructionLanguageLabel(contract);

  return [
    `Speak entirely in ${languageLabel}.`,
    `Use natural ${languageLabel} pronunciation and accent for the selected locale ${contract.ttsLocale ?? contract.canonicalBcp47}.`,
    "Do not translate, paraphrase, or switch languages.",
    "Read only the provided text."
  ].join(" ");
}

export function resolveSpeechStartParameters(options: {
  translationProvider: TranslationProvider;
  sourceLanguage: string | null;
}): SpeechStartParameters {
  return {
    sourceLanguage: options.sourceLanguage?.trim() || "en-GB"
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
      "en-GB",
      translationProvider
    );

  return resolveSpeechStartParameters({
    translationProvider,
    sourceLanguage: synchronizedSourceLanguage
  });
}
