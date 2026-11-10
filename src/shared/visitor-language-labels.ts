import { findTargetLanguageOption, resolveDetectedSourceLanguageOption } from "./language-options.js";
import { getInteractionLanguageCurrentLabel } from "./language-registry.js";
import { resolveVisitorLocalizationState } from "./visitor-language-readiness.js";

export function getVisitorCurrentLanguageLabel(languageCode: string | null | undefined): string {
  if (!languageCode || !findTargetLanguageOption(languageCode)) return "-";
  return getInteractionLanguageCurrentLabel(languageCode);
}

function normalizeLanguageDisplayCode(languageCode: string): string {
  const normalized = languageCode.trim();
  const aliases: Record<string, string> = {
    "en-us": "en-US",
    "pt-pt": "pt-PT",
    "fr-ca": "fr-CA",
    "zh-hans": "zh-Hans",
    "zh-hant": "zh-Hant"
  };
  return aliases[normalized.toLowerCase()] ?? normalized;
}

export function getVisitorLocalizedLanguageLabel(
  languageCode: string | null | undefined,
  viewerLanguageCode: string | null | undefined
): string {
  if (!languageCode) return "-";
  const viewerLocale = resolveVisitorLocalizationState(viewerLanguageCode).effectiveLanguageKey;
  const displayCode = normalizeLanguageDisplayCode(languageCode);
  try {
    const localized = new Intl.DisplayNames([viewerLocale], { type: "language" }).of(displayCode);
    if (localized) return localized;
  } catch {
    // Continue to deterministic registry fallbacks.
  }
  const detectedSourceLanguage = resolveDetectedSourceLanguageOption(languageCode);
  return getInteractionLanguageCurrentLabel(detectedSourceLanguage?.value ?? languageCode);
}
