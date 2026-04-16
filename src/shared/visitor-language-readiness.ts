import {
  VISITOR_LOCALIZATION_LANGUAGE_KEYS,
  getVisitorLanguagePolicy
} from "./visitor-language-policy.js";

const VISITOR_LOCALIZATION_LANGUAGE_KEY_SET = new Set<string>(VISITOR_LOCALIZATION_LANGUAGE_KEYS);

export { VISITOR_LOCALIZATION_LANGUAGE_KEYS } from "./visitor-language-policy.js";

export interface VisitorLocalizationState {
  requestedLanguageKey: string;
  effectiveLanguageKey: string;
  hasDedicatedLocalization: boolean;
  usesEnglishFallback: boolean;
}

export function normalizeVisitorLocalizationLanguageKey(
  languageCode: string | null | undefined
): string {
  if (!languageCode) {
    return "en";
  }

  const normalized = languageCode.trim();
  if (!normalized) {
    return "en";
  }

  const lower = normalized.toLowerCase();

  if (lower === "sr-cyrl") {
    return "sr-Cyrl";
  }

  if (lower === "sr-latn") {
    return "sr-Latn";
  }

  if (lower === "zh-hant") {
    return "zh-Hant";
  }

  if (lower.startsWith("zh")) {
    return "zh";
  }

  return normalized.split(/[-_]/)[0].toLowerCase();
}

export function hasVisitorLocalization(languageCode: string | null | undefined): boolean {
  return VISITOR_LOCALIZATION_LANGUAGE_KEY_SET.has(normalizeVisitorLocalizationLanguageKey(languageCode));
}

export function resolveVisitorLocalizationState(
  languageCode: string | null | undefined
): VisitorLocalizationState {
  const requestedLanguageKey = normalizeVisitorLocalizationLanguageKey(languageCode);
  const hasDedicatedLocalization = VISITOR_LOCALIZATION_LANGUAGE_KEY_SET.has(requestedLanguageKey);

  return {
    requestedLanguageKey,
    effectiveLanguageKey: hasDedicatedLocalization ? requestedLanguageKey : "en",
    hasDedicatedLocalization,
    usesEnglishFallback: !hasDedicatedLocalization
  };
}

export function usesVisitorTechnicalEnglishFallback(
  languageCode: string | null | undefined
): boolean {
  const policy = getVisitorLanguagePolicy(normalizeVisitorLocalizationLanguageKey(languageCode));
  return policy?.technicalLocalization === "english-fallback";
}

