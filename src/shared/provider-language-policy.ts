import {
  CANONICAL_AZURE_TARGET_ONLY_LANGUAGES,
  CANONICAL_INTERACTION_LANGUAGES
} from "./language-registry-data.js";
import type { LanguageOption, TranslationProvider } from "./types.js";

export interface SourceLanguageOption extends LanguageOption {
  locale: string;
}

export type ChatGptTranscriptionCatalogStatus =
  | "official"
  | "prompt-fallback";

export interface ChatGptTranscriptionLanguagePolicy {
  productLanguageCode: string;
  catalogStatus: ChatGptTranscriptionCatalogStatus;
  languageHint: string | null;
  usesPromptFallback: boolean;
}

const ITALIAN_REGION_DISPLAY_NAMES = new Intl.DisplayNames(["it"], {
  type: "region"
});

const CHATGPT_OFFICIAL_TRANSCRIPTION_HINTS_BY_LANGUAGE_CODE = Object.freeze({
  af: "af",
  ar: "ar",
  az: "az",
  be: "be",
  bg: "bg",
  bs: "bs",
  ca: "ca",
  cs: "cs",
  cy: "cy",
  da: "da",
  de: "de",
  el: "el",
  en: "en",
  es: "es",
  et: "et",
  fa: "fa",
  fi: "fi",
  fil: "tl",
  fr: "fr",
  gl: "gl",
  he: "he",
  hi: "hi",
  hr: "hr",
  hu: "hu",
  hy: "hy",
  id: "id",
  is: "is",
  it: "it",
  ja: "ja",
  kk: "kk",
  kn: "kn",
  ko: "ko",
  lt: "lt",
  lv: "lv",
  mi: "mi",
  mk: "mk",
  mr: "mr",
  ms: "ms",
  nb: "no",
  ne: "ne",
  nl: "nl",
  pl: "pl",
  pt: "pt",
  ro: "ro",
  ru: "ru",
  sk: "sk",
  sl: "sl",
  "sr-Cyrl": "sr",
  "sr-Latn": "sr",
  sv: "sv",
  sw: "sw",
  ta: "ta",
  th: "th",
  tr: "tr",
  uk: "uk",
  ur: "ur",
  vi: "vi",
  "zh-Hans": "zh",
  "zh-Hant": "zh"
}) satisfies Readonly<Record<string, string>>;

const SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE = new Map<string, string>();

for (const entry of CANONICAL_INTERACTION_LANGUAGES) {
  SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set(entry.code.toLowerCase(), entry.code);
  SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set(entry.preferredSourceLocale.toLowerCase(), entry.code);
  SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set(entry.displayLocale.toLowerCase(), entry.code);
}

SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set("fil-ph", "fil");
SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set("tl-ph", "fil");
SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set("no-no", "nb");
SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set("en-us", "en");
SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set("en-gb", "en");
SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set("fr-ca", "fr");
SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set("pt-pt", "pt");
SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set("zh-cn", "zh-Hans");
SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set("zh-sg", "zh-Hans");
SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set("zh-hans", "zh-Hans");
SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set("zh-tw", "zh-Hant");
SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set("zh-hant", "zh-Hant");
SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set("zh-hk", "yue");
SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set("yue-cn", "yue");
SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.set("yue-hk", "yue");

function normalizeLanguageCode(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function getBaseLanguageFamily(languageCode: string): string {
  const normalized = languageCode.toLowerCase();

  if (normalized.startsWith("zh-")) {
    return "zh";
  }

  if (normalized.startsWith("sr-")) {
    return "sr";
  }

  if (normalized.startsWith("en-")) {
    return "en";
  }

  if (normalized.startsWith("fr-")) {
    return "fr";
  }

  if (normalized.startsWith("pt-")) {
    return "pt";
  }

  return normalized.split("-")[0] ?? normalized;
}

function resolveLanguageCodeFromSourceLocale(sourceLanguage: string | null | undefined): string | null {
  const normalized = normalizeLanguageCode(sourceLanguage);
  if (!normalized) {
    return null;
  }

  const aliasedCode = SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.get(normalized);
  if (aliasedCode) {
    return aliasedCode;
  }

  if (normalized.startsWith("sr-")) {
    return "sr-Cyrl";
  }

  if (normalized.startsWith("zh-")) {
    return normalized === "zh-hk" ? "yue" : normalized === "zh-tw" ? "zh-Hant" : "zh-Hans";
  }

  if (normalized.startsWith("fil-") || normalized.startsWith("tl-")) {
    return "fil";
  }

  if (normalized.startsWith("nb-") || normalized.startsWith("no-")) {
    return "nb";
  }

  if (normalized.startsWith("fr-")) {
    return "fr";
  }

  if (normalized.startsWith("pt-")) {
    return "pt";
  }

  if (normalized.startsWith("en-")) {
    return "en";
  }

  if (normalized.startsWith("sq-")) {
    return "sq";
  }

  const baseCode = normalized.split("-")[0] ?? normalized;
  const canonicalBaseCode = SOURCE_LOCALE_ALIAS_TO_LANGUAGE_CODE.get(baseCode);
  return canonicalBaseCode ?? baseCode;
}

function buildChatGptTranscriptionLanguagePolicy(languageCode: string): ChatGptTranscriptionLanguagePolicy {
  const officialHint =
    CHATGPT_OFFICIAL_TRANSCRIPTION_HINTS_BY_LANGUAGE_CODE[
      languageCode as keyof typeof CHATGPT_OFFICIAL_TRANSCRIPTION_HINTS_BY_LANGUAGE_CODE
    ] ?? null;

  if (officialHint) {
    return Object.freeze({
      productLanguageCode: languageCode,
      catalogStatus: "official",
      languageHint: officialHint,
      usesPromptFallback: false
    });
  }

  return Object.freeze({
    productLanguageCode: languageCode,
    catalogStatus: "prompt-fallback",
    languageHint: null,
    usesPromptFallback: true
  });
}

export const CHATGPT_TRANSCRIPTION_LANGUAGE_POLICIES = Object.freeze(
  Object.fromEntries(
    CANONICAL_INTERACTION_LANGUAGES.map((entry) => [
      entry.code.toLowerCase(),
      buildChatGptTranscriptionLanguagePolicy(entry.code)
    ])
  )
) satisfies Readonly<Record<string, ChatGptTranscriptionLanguagePolicy>>;

export function resolveChatGptTranscriptionLanguagePolicy(
  sourceLanguage: string | null | undefined
): ChatGptTranscriptionLanguagePolicy | null {
  const languageCode = resolveLanguageCodeFromSourceLocale(sourceLanguage);
  if (!languageCode) {
    return null;
  }

  return CHATGPT_TRANSCRIPTION_LANGUAGE_POLICIES[languageCode.toLowerCase()] ?? null;
}

export const CHATGPT_TRANSCRIPTION_LANGUAGE_HINT_CODES = Object.freeze(
  Object.values(CHATGPT_TRANSCRIPTION_LANGUAGE_POLICIES)
    .map((policy) => policy.languageHint)
    .filter((hint): hint is string => Boolean(hint))
) satisfies readonly string[];

function getRegionCodeFromLocale(locale: string): string | null {
  const match = locale.match(/-([A-Z]{2})(?:$|-)/);
  return match?.[1] ?? null;
}

function buildSourceLanguageOptionLabel(languageCode: string, label: string, locale: string): string {
  if (label.includes("(")) {
    return label;
  }

  const familyCount = CANONICAL_INTERACTION_LANGUAGES.filter(
    (entry) => getBaseLanguageFamily(entry.code) === getBaseLanguageFamily(languageCode)
  ).length;

  if (familyCount <= 1) {
    return label;
  }

  const regionCode = getRegionCodeFromLocale(locale);
  if (!regionCode) {
    return label;
  }

  const regionLabel = ITALIAN_REGION_DISPLAY_NAMES.of(regionCode);
  return regionLabel ? `${label} (${regionLabel})` : label;
}

export const SUPPORTED_SOURCE_LANGUAGE_OPTIONS = Object.freeze(
  CANONICAL_INTERACTION_LANGUAGES.reduce<SourceLanguageOption[]>((options, entry) => {
    const locale = entry.preferredSourceLocale;
    if (options.some((option) => option.value === locale)) {
      return options;
    }

    options.push({
      value: locale,
      locale,
      label: buildSourceLanguageOptionLabel(entry.code, entry.label, locale)
    });

    return options;
  }, [])
) satisfies readonly SourceLanguageOption[];

function buildTargetLanguageOptions(): LanguageOption[] {
  const targetOptions: LanguageOption[] = [];

  for (const entry of CANONICAL_INTERACTION_LANGUAGES) {
    const chatGptTargetEnabled =
      entry.providers.chatgpt.translationTarget ?? entry.providers.chatgpt.enabled;
    const azureTargetEnabled = entry.providers.azure.translationTarget ?? entry.providers.azure.enabled;

    if (!chatGptTargetEnabled && !azureTargetEnabled) {
      continue;
    }

    targetOptions.push({
      value: entry.code,
      label: entry.label
    });
  }

  for (const entry of CANONICAL_AZURE_TARGET_ONLY_LANGUAGES) {
    if (!entry.providers.azure.translationTarget) {
      continue;
    }

    targetOptions.push({
      value: entry.code,
      label: entry.label
    });
  }

  return targetOptions;
}

export const SUPPORTED_TARGET_LANGUAGE_OPTIONS = Object.freeze(
  buildTargetLanguageOptions()
) satisfies readonly LanguageOption[];

function isAzureSpeechToTextEnabled(languageCode: string): boolean {
  const entry = CANONICAL_INTERACTION_LANGUAGES.find((candidate) => candidate.code === languageCode);
  if (!entry) {
    return false;
  }

  const providerConfig = entry.providers.azure;
  return providerConfig.enabled && (providerConfig.speechToText ?? providerConfig.enabled);
}

function getAzureLanguageIdentificationFamily(languageCode: string): string {
  return getBaseLanguageFamily(languageCode);
}

function buildAzureLanguageIdentificationCandidates(): string[] {
  const familyToLocale = new Map<string, string>();

  for (const entry of CANONICAL_INTERACTION_LANGUAGES) {
    if (!isAzureSpeechToTextEnabled(entry.code)) {
      continue;
    }

    const family = getAzureLanguageIdentificationFamily(entry.code);
    if (familyToLocale.has(family)) {
      continue;
    }

    familyToLocale.set(family, entry.preferredSourceLocale);
  }

  return [...familyToLocale.values()];
}

export const AUTO_DETECT_SOURCE_LANGUAGE_CANDIDATES = Object.freeze(
  buildAzureLanguageIdentificationCandidates()
) satisfies readonly string[];

export function getSupportedSourceLanguageOptionsByProvider(
  provider: TranslationProvider
): SourceLanguageOption[] {
  if (provider === "ollama") {
    return [];
  }

  return CANONICAL_INTERACTION_LANGUAGES.filter((entry) => {
    const providerConfig = entry.providers[provider];
    return providerConfig.enabled && (providerConfig.speechToText ?? providerConfig.enabled);
  }).reduce<SourceLanguageOption[]>((options, entry) => {
    const option = SUPPORTED_SOURCE_LANGUAGE_OPTIONS.find(
      (candidate) => candidate.value === entry.preferredSourceLocale
    );

    if (!option || options.some((candidate) => candidate.value === option.value)) {
      return options;
    }

    options.push({ ...option });
    return options;
  }, []);
}
