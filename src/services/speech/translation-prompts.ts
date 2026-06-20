import { resolveProviderTargetLanguageCode } from "../../shared/language-registry.js";
import type { RuntimeConfig, TranslationRequest } from "../../shared/types.js";

export function buildTranslationPrompt(request: TranslationRequest, isPartial: boolean): string {
  const targetLanguage = resolveProviderTargetLanguageCode(request.targetLanguage, request.provider, {
    includeProviderExpansions: true
  }) ?? request.targetLanguage;
  return [
    `Source language: ${request.sourceLanguage}`,
    `Target language: ${targetLanguage}`,
    "Translate the spoken text naturally for a live conversation.",
    isPartial ? "The utterance may be incomplete because it comes from a live partial capture." : null,
    "Return only the translated text, with no notes, labels, or quotation marks.",
    "",
    request.text
  ].filter((line): line is string => Boolean(line)).join("\n");
}

export function buildSpeechTurnTranslationPrompt(
  request: TranslationRequest,
  isPartial: boolean,
  detectedLanguageMode: RuntimeConfig["chatGptTranslationDetectedLanguageMode"]
): string {
  const targetLanguage = resolveProviderTargetLanguageCode(request.targetLanguage, request.provider, {
    includeProviderExpansions: true
  }) ?? request.targetLanguage;
  const detectedLanguageInstruction = detectedLanguageMode === "off"
    ? 'Return strict JSON with key "translation" only.'
    : 'Return strict JSON with keys "translation" and "detected_language". Use null for "detected_language" when unclear. The detected language is diagnostic metadata only unless runtime configuration explicitly enables adaptive source language mode.';
  return [
    `Configured source locale hint: ${request.sourceLanguage}`,
    `Target language: ${targetLanguage}`,
    "Translate the spoken text naturally for a live conversation.",
    detectedLanguageMode === "off" ? null : "Infer the dominant spoken language from the transcript and return only its ISO 639-1 or ISO 639-3 code when clear.",
    isPartial ? "The utterance may be incomplete because it comes from a live partial capture." : null,
    detectedLanguageInstruction,
    "",
    request.text
  ].filter((line): line is string => Boolean(line)).join("\n");
}

export function buildPlaybackNormalizationPrompt(targetLanguage: string, text: string): string {
  return [
    `Target language: ${targetLanguage}`,
    "Detect the input language automatically.",
    "Rewrite the text so it can be spoken naturally in the target language by a kiosk text-to-speech system.",
    "If the text is already in the target language, keep the meaning and return a natural equivalent in that same language.",
    "Return only the final target-language text, with no notes, labels, or quotation marks.",
    "",
    text
  ].join("\n");
}
