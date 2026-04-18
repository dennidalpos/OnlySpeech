import {
  CANONICAL_AZURE_TARGET_ONLY_LANGUAGES,
  CANONICAL_INTERACTION_LANGUAGES,
  CANONICAL_INTERACTION_LANGUAGE_BASELINE_COUNT,
  INTERACTION_LANGUAGE_FLAG_REGION_CODES,
  INTERACTION_LANGUAGE_MACRO_AREA_MEMBERSHIPS,
  PROVIDER_INTERACTION_LANGUAGE_CATALOGS,
  PROVIDER_LANGUAGE_CAPABILITIES_BY_CODE,
  PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODES,
  type CanonicalInteractionLanguageDefinition,
  type InteractionLanguageTier,
  type LanguageMacroArea,
  type ProviderTargetOnlyLanguageDefinition
} from "./language-registry-data.js";
import { findSourceLanguageOption, findTargetLanguageOption } from "./language-options.js";
import type {
  LanguageOption,
  TranslationProvider,
  TranslationProviderLanguageCapabilities,
  UiLanguage
} from "./types.js";
import {
  hasVisitorLocalization,
  normalizeVisitorLocalizationLanguageKey
} from "./visitor-language-readiness.js";

export interface InteractionLanguageChoice extends LanguageOption {
  nativeLabel: string;
  regionCode: string | null;
  flagRegionCode: string | null;
  sourceLocale: string;
  tier: InteractionLanguageTier;
  macroArea: LanguageMacroArea;
  macroAreas: LanguageMacroArea[];
  primaryMacroArea: LanguageMacroArea;
  macroAreaLabel: string;
  macroAreaLabels: string[];
  visitorLocalizationKey: string;
  hasDedicatedVisitorLocalization: boolean;
  fallbackUiLanguage: UiLanguage;
  fallsBackToEnglish: boolean;
}

export interface InteractionLanguageOptionGroup {
  macroArea: LanguageMacroArea;
  label: string;
  options: LanguageOption[];
}

export interface TranslationTargetOptionGroup {
  macroArea: LanguageMacroArea | "other";
  label: string;
  options: LanguageOption[];
}

export interface InteractionLanguageQueryOptions {
  includeProviderExpansions?: boolean;
}

export interface InteractionLanguageUiMetadata {
  requestedLanguageKey: string;
  effectiveLanguageKey: string;
  hasDedicatedLocalization: boolean;
  fallbackUiLanguage: UiLanguage;
  fallsBackToEnglish: boolean;
}

type RegistryLanguageEntry = CanonicalInteractionLanguageDefinition | ProviderTargetOnlyLanguageDefinition;

const MACRO_AREA_LABELS: Record<LanguageMacroArea, string> = {
  europe: "Europa",
  americas: "Americhe",
  oceania: "Oceania",
  africa: "Africa",
  asia: "Asia"
};

const MACRO_AREA_ORDER: readonly LanguageMacroArea[] = ["europe", "americas", "oceania", "africa", "asia"];

const ALL_LANGUAGE_ENTRIES: readonly RegistryLanguageEntry[] = Object.freeze([
  ...CANONICAL_INTERACTION_LANGUAGES,
  ...CANONICAL_AZURE_TARGET_ONLY_LANGUAGES
]);

const PROVIDER_INTERACTION_LANGUAGE_CODE_SETS = Object.freeze({
  azure: new Set(PROVIDER_INTERACTION_LANGUAGE_CATALOGS.azure.map((entry) => entry.code.toLowerCase())),
  chatgpt: new Set(PROVIDER_INTERACTION_LANGUAGE_CATALOGS.chatgpt.map((entry) => entry.code.toLowerCase())),
  ollama: new Set(PROVIDER_INTERACTION_LANGUAGE_CATALOGS.ollama.map((entry) => entry.code.toLowerCase()))
}) satisfies Readonly<Record<TranslationProvider, ReadonlySet<string>>>;

const PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODE_SETS = Object.freeze({
  azure: new Set(PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODES.azure.map((code) => code.toLowerCase())),
  chatgpt: new Set(PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODES.chatgpt.map((code) => code.toLowerCase())),
  ollama: new Set(PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODES.ollama.map((code) => code.toLowerCase()))
}) satisfies Readonly<Record<TranslationProvider, ReadonlySet<string>>>;

const COMMON_PROVIDER_INTERACTION_LANGUAGE_CODES = Object.freeze(
  CANONICAL_INTERACTION_LANGUAGES.filter(
    (entry) =>
      PROVIDER_INTERACTION_LANGUAGE_CODE_SETS.azure.has(entry.code.toLowerCase()) &&
      PROVIDER_INTERACTION_LANGUAGE_CODE_SETS.chatgpt.has(entry.code.toLowerCase())
  ).map((entry) => entry.code)
);

const COMMON_PROVIDER_INTERACTION_LANGUAGE_CODE_SET = new Set(
  COMMON_PROVIDER_INTERACTION_LANGUAGE_CODES.map((code) => code.toLowerCase())
);

const COMMON_PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODES = Object.freeze(
  PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODES.chatgpt.filter((code) =>
    PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODE_SETS.azure.has(code.toLowerCase())
  )
);

const COMMON_PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODE_SET = new Set(
  COMMON_PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODES.map((code) => code.toLowerCase())
);

const INTERACTION_LANGUAGE_CODE_ALIASES = new Map<string, string>(
  ALL_LANGUAGE_ENTRIES.flatMap((entry) => {
    const aliases: Array<readonly [string, string]> = [[entry.code.toLowerCase(), entry.code]];

    if ("displayLocale" in entry && entry.displayLocale) {
      aliases.push([entry.displayLocale.toLowerCase(), entry.code]);
    }

    if ("preferredSourceLocale" in entry) {
      aliases.push([entry.preferredSourceLocale.toLowerCase(), entry.code]);
    }

    return aliases;
  })
);

INTERACTION_LANGUAGE_CODE_ALIASES.set("zh-cn", "zh-Hans");
INTERACTION_LANGUAGE_CODE_ALIASES.set("zh-hk", "yue");
INTERACTION_LANGUAGE_CODE_ALIASES.set("zh-sg", "zh-Hans");
INTERACTION_LANGUAGE_CODE_ALIASES.set("zh-hans", "zh-Hans");
INTERACTION_LANGUAGE_CODE_ALIASES.set("zh-tw", "zh-Hant");
INTERACTION_LANGUAGE_CODE_ALIASES.set("zh-hant", "zh-Hant");
INTERACTION_LANGUAGE_CODE_ALIASES.set("yue-cn", "yue");
INTERACTION_LANGUAGE_CODE_ALIASES.set("yue-hk", "yue");

const PRECOMPUTED_NATIVE_LANGUAGE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  it: "italiano",
  en: "English",
  "en-us": "American English",
  "en-gb": "British English",
  fr: "français",
  de: "Deutsch",
  es: "español",
  pt: "português",
  nl: "Nederlands",
  pl: "polski",
  ro: "română",
  ru: "русский",
  uk: "українська",
  af: "Afrikaans",
  am: "አማርኛ",
  sw: "Kiswahili",
  ar: "العربية",
  he: "עברית",
  fa: "فارسی",
  ur: "اردو",
  tr: "Türkçe",
  ps: "پښتو",
  hi: "हिन्दी",
  bn: "বাংলা",
  ta: "தமிழ்",
  te: "తెలుగు",
  th: "ไทย",
  vi: "Tiếng Việt",
  ms: "Melayu",
  id: "Indonesia",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
  yue: "廣東話",
  ja: "日本語",
  ko: "한국어",
  sq: "shqip",
  bs: "bosanski",
  bg: "български",
  ca: "català",
  cs: "čeština",
  hr: "hrvatski",
  da: "dansk",
  et: "eesti",
  fi: "suomi",
  cy: "Cymraeg",
  el: "Ελληνικά",
  ga: "Gaeilge",
  is: "íslenska",
  lv: "latviešu",
  lt: "lietuvių",
  mt: "Malti",
  nb: "norsk bokmål",
  "pt-pt": "português europeu",
  "sr-Cyrl": "српски (ћирилица)",
  "sr-Latn": "српски (латиница)",
  sk: "slovenčina",
  sl: "slovenščina",
  sv: "svenska",
  hu: "magyar",
  "fr-ca": "français canadien",
  hy: "հայերեն",
  as: "অসমীয়া",
  az: "azərbaycan",
  fil: "Filipino",
  gu: "ગુજરાતી",
  kn: "ಕನ್ನಡ",
  kk: "қазақ тілі",
  km: "ខ្មែរ",
  lo: "ລາວ",
  ml: "മലയാളം",
  mr: "मराठी",
  my: "မြန်မာ",
  ne: "नेपाली",
  or: "ଓଡ଼ିଆ",
  pa: "ਪੰਜਾਬੀ",
  eu: "euskara",
  gl: "galego",
  ka: "ქართული",
  mk: "македонски",
  mn: "монгол",
  si: "සිංහල",
  so: "Soomaali",
  uz: "o‘zbek",
  be: "беларуская",
  mi: "Māori",
  fj: "figiano",
  ht: "creolo haitiano",
  iu: "inuktitut",
  ku: "kurdî (kurmancî)",
  kmr: "kurdî (kurmancî)",
  lzh: "cinese classico",
  mg: "Malagasy",
  mww: "mww",
  otq: "otq",
  prs: "دری",
  sm: "samoano",
  ti: "ትግርኛ",
  "tlh-Latn": "klingon",
  "tlh-Piqd": "klingon",
  to: "lea fakatonga",
  ty: "taitiano",
  yua: "yua"
});

function isCanonicalInteractionLanguage(
  entry: RegistryLanguageEntry
): entry is CanonicalInteractionLanguageDefinition {
  return "tier" in entry;
}

function getEntryDisplayLocale(entry: RegistryLanguageEntry): string {
  if ("displayLocale" in entry && entry.displayLocale) {
    return entry.displayLocale;
  }

  if (isCanonicalInteractionLanguage(entry)) {
    return entry.preferredSourceLocale;
  }

  return entry.code;
}

function getEntryMacroAreas(entry: RegistryLanguageEntry): LanguageMacroArea[] {
  if (isCanonicalInteractionLanguage(entry)) {
    const overrides = INTERACTION_LANGUAGE_MACRO_AREA_MEMBERSHIPS[entry.code as keyof typeof INTERACTION_LANGUAGE_MACRO_AREA_MEMBERSHIPS];
    return [...(overrides ?? [entry.macroArea])];
  }

  return [...entry.macroAreas];
}

function getEntryFlagRegionCode(entry: RegistryLanguageEntry): string | null {
  const explicit = INTERACTION_LANGUAGE_FLAG_REGION_CODES[entry.code as keyof typeof INTERACTION_LANGUAGE_FLAG_REGION_CODES];
  if (explicit) {
    return explicit;
  }

  if (!isCanonicalInteractionLanguage(entry)) {
    return entry.flagRegionCode;
  }

  const match = entry.displayLocale.match(/-([A-Z]{2})$/);
  return match?.[1] ?? null;
}

function assertCanonicalInteractionLanguageRegistry(): void {
  const duplicates = CANONICAL_INTERACTION_LANGUAGES.filter(
    (entry, index, all) =>
      all.findIndex((candidate) => candidate.code.toLowerCase() === entry.code.toLowerCase()) !== index
  );

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate canonical interaction language codes: ${duplicates.map((entry) => entry.code).join(", ")}.`
    );
  }

  const baselineEntries = CANONICAL_INTERACTION_LANGUAGES.filter((entry) => entry.tier === "baseline");
  if (baselineEntries.length !== CANONICAL_INTERACTION_LANGUAGE_BASELINE_COUNT) {
    throw new Error(
      `Expected ${CANONICAL_INTERACTION_LANGUAGE_BASELINE_COUNT} baseline interaction languages, found ${baselineEntries.length}.`
    );
  }

  for (const macroArea of MACRO_AREA_ORDER) {
    if (!baselineEntries.some((entry) => getEntryMacroAreas(entry).includes(macroArea))) {
      throw new Error(`Baseline interaction language catalog is missing macro area ${macroArea}.`);
    }
  }
}

assertCanonicalInteractionLanguageRegistry();

function normalizeCode(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function isBaselineEntry(
  entry: CanonicalInteractionLanguageDefinition,
  options?: InteractionLanguageQueryOptions
): boolean {
  return options?.includeProviderExpansions === true || entry.tier === "baseline";
}

function resolveRegistryEntry(languageCode: string | null | undefined): RegistryLanguageEntry | null {
  const normalized = normalizeCode(languageCode);
  if (!normalized) {
    return null;
  }

  const canonicalCode = INTERACTION_LANGUAGE_CODE_ALIASES.get(normalized) ?? normalized;
  return ALL_LANGUAGE_ENTRIES.find((entry) => entry.code.toLowerCase() === canonicalCode.toLowerCase()) ?? null;
}

function toDisplayNameCode(languageCode: string): string {
  if (languageCode === "en-us") {
    return "en-US";
  }

  if (languageCode === "en-gb") {
    return "en-GB";
  }

  if (languageCode === "pt-pt") {
    return "pt-PT";
  }

  if (languageCode === "fr-ca") {
    return "fr-CA";
  }

  if (languageCode === "tlh-Latn" || languageCode === "tlh-Piqd") {
    return "tlh";
  }

  return languageCode;
}

function getLocalizedLanguageLabel(languageCode: string, fallbackLabel: string, locale: string): string {
  const precomputedLabel = PRECOMPUTED_NATIVE_LANGUAGE_LABELS[languageCode];
  if (locale !== "en" && precomputedLabel) {
    return precomputedLabel;
  }

  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "language" });
    return displayNames.of(toDisplayNameCode(languageCode)) ?? fallbackLabel;
  } catch {
    return fallbackLabel;
  }
}

function getNativeLanguageLabel(languageCode: string, fallbackLabel: string, locale: string): string {
  return getLocalizedLanguageLabel(languageCode, fallbackLabel, locale);
}

function normalizeComparableLanguageLabel(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

function buildInteractionLanguageUiMetadata(languageCode: string): InteractionLanguageUiMetadata {
  const requestedLanguageKey = normalizeVisitorLocalizationLanguageKey(languageCode);
  const hasDedicatedLocalization = hasVisitorLocalization(languageCode);

  return {
    requestedLanguageKey,
    effectiveLanguageKey: hasDedicatedLocalization ? requestedLanguageKey : "en",
    hasDedicatedLocalization,
    fallbackUiLanguage: "en",
    fallsBackToEnglish: !hasDedicatedLocalization
  };
}

function resolveProviderCapabilities(
  entry: RegistryLanguageEntry,
  provider: TranslationProvider
): TranslationProviderLanguageCapabilities {
  if (provider === "ollama") {
    return {
      speechToText: false,
      translationTarget: isCanonicalInteractionLanguage(entry),
      preferredSourceLocale: isCanonicalInteractionLanguage(entry) ? entry.preferredSourceLocale : null,
      targetCode: isCanonicalInteractionLanguage(entry) ? entry.code : null
    };
  }

  return { ...(PROVIDER_LANGUAGE_CAPABILITIES_BY_CODE[provider][entry.code.toLowerCase()] ?? entry.providers[provider]) };
}

function supportsInteractionLanguage(
  entry: RegistryLanguageEntry,
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): boolean {
  if (!isCanonicalInteractionLanguage(entry) || !isBaselineEntry(entry, options)) {
    return false;
  }

  if (!provider) {
    return (["azure", "chatgpt"] as const).some((candidate) =>
      PROVIDER_INTERACTION_LANGUAGE_CODE_SETS[candidate].has(entry.code.toLowerCase())
    );
  }

  if (provider === "ollama") {
    return true;
  }

  return PROVIDER_INTERACTION_LANGUAGE_CODE_SETS[provider].has(entry.code.toLowerCase());
}

function buildChoice(
  entry: CanonicalInteractionLanguageDefinition,
  provider?: TranslationProvider
): InteractionLanguageChoice {
  const capabilities = provider
    ? resolveProviderCapabilities(entry, provider)
    : (["azure", "chatgpt"] as const)
        .map((candidate) => resolveProviderCapabilities(entry, candidate))
        .find((candidate) => candidate.speechToText && candidate.translationTarget) ??
      resolveProviderCapabilities(entry, "azure");

  if (!capabilities.preferredSourceLocale) {
    throw new Error(`Interaction language ${entry.code} does not expose a source locale.`);
  }

  const macroAreas = getEntryMacroAreas(entry);
  const primaryMacroArea = macroAreas[0];
  if (!primaryMacroArea) {
    throw new Error(`Interaction language ${entry.code} does not expose any macro area.`);
  }

  const flagRegionCode = getEntryFlagRegionCode(entry);
  const uiMetadata = buildInteractionLanguageUiMetadata(entry.code);

  return {
    value: entry.code,
    label: entry.label,
    nativeLabel: getNativeLanguageLabel(entry.code, entry.label, getEntryDisplayLocale(entry)),
    regionCode: flagRegionCode,
    flagRegionCode,
    sourceLocale: capabilities.preferredSourceLocale,
    tier: entry.tier,
    macroArea: primaryMacroArea,
    macroAreas,
    primaryMacroArea,
    macroAreaLabel: MACRO_AREA_LABELS[primaryMacroArea],
    macroAreaLabels: macroAreas.map((area) => MACRO_AREA_LABELS[area]),
    visitorLocalizationKey: uiMetadata.requestedLanguageKey,
    hasDedicatedVisitorLocalization: uiMetadata.hasDedicatedLocalization,
    fallbackUiLanguage: uiMetadata.fallbackUiLanguage,
    fallsBackToEnglish: uiMetadata.fallsBackToEnglish
  };
}

export function getSupportedInteractionLanguageCodes(
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): string[] {
  return CANONICAL_INTERACTION_LANGUAGES.filter((entry) => supportsInteractionLanguage(entry, provider, options)).map(
    (entry) => entry.code
  );
}

export const COMMON_PROVIDER_INTERACTION_LANGUAGE_COUNT = COMMON_PROVIDER_INTERACTION_LANGUAGE_CODES.length;

export const COMMON_PROVIDER_TRANSLATION_TARGET_LANGUAGE_COUNT = COMMON_PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODES.length;

export function getCommonProviderInteractionLanguageCodes(): string[] {
  return [...COMMON_PROVIDER_INTERACTION_LANGUAGE_CODES];
}

export function getCommonProviderTranslationTargetLanguageCodes(): string[] {
  return [...COMMON_PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODES];
}

export function getProviderTargetOnlyLanguageCodes(provider: TranslationProvider): string[] {
  return ALL_LANGUAGE_ENTRIES.filter((entry) => {
    const capabilities = resolveProviderCapabilities(entry, provider);
    return !capabilities.speechToText && capabilities.translationTarget;
  }).map((entry) => entry.code);
}

export function getSupportedSpeechToTextLanguageCodes(
  provider: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): string[] {
  if (provider === "ollama") {
    return [];
  }

  return CANONICAL_INTERACTION_LANGUAGES.filter(
    (entry) =>
      PROVIDER_INTERACTION_LANGUAGE_CODE_SETS[provider].has(entry.code.toLowerCase()) &&
      isBaselineEntry(entry, options)
  ).map((entry) => entry.code);
}

export function getSupportedTranslationTargetLanguageCodes(
  provider: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): string[] {
  if (provider === "ollama") {
    return CANONICAL_INTERACTION_LANGUAGES.filter((entry) => isBaselineEntry(entry, options)).map((entry) => entry.code);
  }

  return PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODES[provider].filter((code) => {
    const entry = resolveRegistryEntry(code);
    if (!entry) {
      return false;
    }

    return !isCanonicalInteractionLanguage(entry) || isBaselineEntry(entry, options);
  });
}

export function findInteractionLanguageChoice(
  languageCode: string | null | undefined,
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): InteractionLanguageChoice | null {
  const entry = resolveRegistryEntry(languageCode);
  if (!entry || !isCanonicalInteractionLanguage(entry) || !supportsInteractionLanguage(entry, provider, options)) {
    return null;
  }

  return buildChoice(entry, provider);
}

export function isInteractionLanguageSupported(
  languageCode: string | null | undefined,
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): boolean {
  return findInteractionLanguageChoice(languageCode, provider, options) !== null;
}

export function normalizeInteractionLanguage(
  languageCode: string | null | undefined,
  provider: TranslationProvider | undefined,
  fallback: string,
  options?: InteractionLanguageQueryOptions
): string {
  const directMatch = findInteractionLanguageChoice(languageCode, provider, options);
  if (directMatch) {
    return directMatch.value;
  }

  const fallbackMatch = findInteractionLanguageChoice(fallback, provider, options);
  if (fallbackMatch) {
    return fallbackMatch.value;
  }

  return getSupportedInteractionLanguageCodes(provider, options)[0] ?? fallback;
}

export function findCommonProviderInteractionLanguageChoice(
  languageCode: string | null | undefined,
  provider?: TranslationProvider
): InteractionLanguageChoice | null {
  const entry = resolveRegistryEntry(languageCode);
  if (!entry || !isCanonicalInteractionLanguage(entry) || !COMMON_PROVIDER_INTERACTION_LANGUAGE_CODE_SET.has(entry.code.toLowerCase())) {
    return null;
  }

  return buildChoice(entry, provider);
}

export function normalizeCommonProviderInteractionLanguage(
  languageCode: string | null | undefined,
  provider: TranslationProvider | undefined,
  fallback: string
): string {
  const directMatch = findCommonProviderInteractionLanguageChoice(languageCode, provider);
  if (directMatch) {
    return directMatch.value;
  }

  const fallbackMatch = findCommonProviderInteractionLanguageChoice(fallback, provider);
  if (fallbackMatch) {
    return fallbackMatch.value;
  }

  return COMMON_PROVIDER_INTERACTION_LANGUAGE_CODES[0] ?? fallback;
}

export function resolveProviderTargetLanguageCode(
  languageCode: string | null | undefined,
  provider: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): string | null {
  const entry = resolveRegistryEntry(languageCode);
  if (!entry) {
    return null;
  }

  if (isCanonicalInteractionLanguage(entry) && !isBaselineEntry(entry, options)) {
    return null;
  }

  const capabilities = resolveProviderCapabilities(entry, provider);
  return capabilities.translationTarget ? capabilities.targetCode : null;
}

export function resolveInteractionLanguageSourceLocale(
  languageCode: string | null | undefined,
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): string | null {
  const entry = resolveRegistryEntry(languageCode);
  if (!entry || !isCanonicalInteractionLanguage(entry) || !supportsInteractionLanguage(entry, provider, options)) {
    return null;
  }

  return buildChoice(entry, provider).sourceLocale;
}

export function resolveCommonProviderInteractionLanguageSourceLocale(
  languageCode: string | null | undefined,
  provider?: TranslationProvider
): string | null {
  const choice = findCommonProviderInteractionLanguageChoice(languageCode, provider);
  return choice?.sourceLocale ?? null;
}

export function resolveInteractionLanguageUiMetadata(
  languageCode: string | null | undefined,
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): InteractionLanguageUiMetadata | null {
  const choice = findInteractionLanguageChoice(languageCode, provider, options);
  if (!choice) {
    return null;
  }

  return {
    requestedLanguageKey: choice.visitorLocalizationKey,
    effectiveLanguageKey: choice.fallsBackToEnglish ? "en" : choice.visitorLocalizationKey,
    hasDedicatedLocalization: choice.hasDedicatedVisitorLocalization,
    fallbackUiLanguage: choice.fallbackUiLanguage,
    fallsBackToEnglish: choice.fallsBackToEnglish
  };
}

export function buildInteractionLanguageChoices(
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): InteractionLanguageChoice[] {
  return CANONICAL_INTERACTION_LANGUAGES.filter((entry) => supportsInteractionLanguage(entry, provider, options)).map(
    (entry) => buildChoice(entry, provider)
  );
}

export function buildCommonProviderInteractionLanguageChoices(
  provider?: TranslationProvider
): InteractionLanguageChoice[] {
  return COMMON_PROVIDER_INTERACTION_LANGUAGE_CODES.map((code) =>
    buildChoice(
      CANONICAL_INTERACTION_LANGUAGES.find((entry) => entry.code === code)!,
      provider
    )
  );
}

export function buildCommonProviderInteractionLanguageOptions(
  provider?: TranslationProvider
): LanguageOption[] {
  return buildCommonProviderInteractionLanguageChoices(provider).map(({ value, nativeLabel }) => ({
    value,
    label: nativeLabel
  }));
}

export function buildCommonProviderInteractionLanguageOptionGroups(
  provider?: TranslationProvider
): InteractionLanguageOptionGroup[] {
  const groups = new Map<LanguageMacroArea, InteractionLanguageOptionGroup>();

  for (const choice of buildCommonProviderInteractionLanguageChoices(provider)) {
    for (const macroArea of choice.macroAreas) {
      const existing = groups.get(macroArea);
      const option = { value: choice.value, label: choice.nativeLabel };

      if (existing) {
        if (!existing.options.some((candidate) => candidate.value === option.value)) {
          existing.options.push(option);
        }
        continue;
      }

      groups.set(macroArea, {
        macroArea,
        label: MACRO_AREA_LABELS[macroArea],
        options: [option]
      });
    }
  }

  return MACRO_AREA_ORDER.filter((macroArea) => groups.has(macroArea))
    .map((macroArea) => groups.get(macroArea)!)
    .map((group) => ({
      ...group,
      options: group.options.map((option) => ({ ...option }))
    }));
}

export function buildInteractionLanguageOptions(
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): LanguageOption[] {
  return buildInteractionLanguageChoices(provider, options).map(({ value, nativeLabel }) => ({
    value,
    label: nativeLabel
  }));
}

export function buildInteractionLanguageOptionGroups(
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): InteractionLanguageOptionGroup[] {
  const groups = new Map<LanguageMacroArea, InteractionLanguageOptionGroup>();

  for (const choice of buildInteractionLanguageChoices(provider, options)) {
    for (const macroArea of choice.macroAreas) {
      const existing = groups.get(macroArea);
      const option = { value: choice.value, label: choice.nativeLabel };

      if (existing) {
        if (!existing.options.some((candidate) => candidate.value === option.value)) {
          existing.options.push(option);
        }
        continue;
      }

      groups.set(macroArea, {
        macroArea,
        label: MACRO_AREA_LABELS[macroArea],
        options: [option]
      });
    }
  }

  return MACRO_AREA_ORDER.filter((macroArea) => groups.has(macroArea))
    .map((macroArea) => groups.get(macroArea)!)
    .map((group) => ({
      ...group,
      options: group.options.map((option) => ({ ...option }))
    }));
}

export function buildTranslationTargetOptions(
  provider: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): LanguageOption[] {
  return getSupportedTranslationTargetLanguageCodes(provider, options).map((code) => ({
    value: code,
    label: getInteractionLanguageCurrentLabel(code, provider, options)
  }));
}

export function buildCommonProviderTranslationTargetOptions(
  provider?: TranslationProvider
): LanguageOption[] {
  return COMMON_PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODES.map((code) => ({
    value: code,
    label: getInteractionLanguageCurrentLabel(code, provider)
  }));
}

export function buildTranslationTargetOptionGroups(
  provider: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): TranslationTargetOptionGroup[] {
  const groups = new Map<LanguageMacroArea | "other", TranslationTargetOptionGroup>();

  for (const code of getSupportedTranslationTargetLanguageCodes(provider, options)) {
    const entry = resolveRegistryEntry(code);
    if (!entry) {
      continue;
    }

    const macroAreas = getEntryMacroAreas(entry);
    const groupKeys = macroAreas.length > 0 ? macroAreas : (["other"] as const);
    const option = {
      value: code,
      label: getInteractionLanguageCurrentLabel(code, provider, options)
    };

    for (const groupKey of groupKeys) {
      const label = groupKey === "other" ? "Altre" : MACRO_AREA_LABELS[groupKey];
      const existing = groups.get(groupKey);
      if (existing) {
        if (!existing.options.some((candidate) => candidate.value === option.value)) {
          existing.options.push(option);
        }
        continue;
      }

      groups.set(groupKey, {
        macroArea: groupKey,
        label,
        options: [option]
      });
    }
  }

  const order: Array<LanguageMacroArea | "other"> = [...MACRO_AREA_ORDER, "other"];
  return order
    .filter((groupKey) => groups.has(groupKey))
    .map((groupKey) => groups.get(groupKey)!)
    .map((group) => ({
      ...group,
      options: group.options.map((option) => ({ ...option }))
    }));
}

export function buildCommonProviderTranslationTargetOptionGroups(
  provider?: TranslationProvider
): TranslationTargetOptionGroup[] {
  const groups = new Map<LanguageMacroArea | "other", TranslationTargetOptionGroup>();

  for (const code of COMMON_PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODES) {
    const entry = resolveRegistryEntry(code);
    if (!entry || !COMMON_PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODE_SET.has(code.toLowerCase())) {
      continue;
    }

    const macroAreas = getEntryMacroAreas(entry);
    const groupKeys = macroAreas.length > 0 ? macroAreas : (["other"] as const);
    const option = {
      value: code,
      label: getInteractionLanguageCurrentLabel(code, provider)
    };

    for (const groupKey of groupKeys) {
      const label = groupKey === "other" ? "Altre" : MACRO_AREA_LABELS[groupKey];
      const existing = groups.get(groupKey);
      if (existing) {
        if (!existing.options.some((candidate) => candidate.value === option.value)) {
          existing.options.push(option);
        }
        continue;
      }

      groups.set(groupKey, {
        macroArea: groupKey,
        label,
        options: [option]
      });
    }
  }

  const order: Array<LanguageMacroArea | "other"> = [...MACRO_AREA_ORDER, "other"];
  return order
    .filter((groupKey) => groups.has(groupKey))
    .map((groupKey) => groups.get(groupKey)!)
    .map((group) => ({
      ...group,
      options: group.options.map((option) => ({ ...option }))
    }));
}

export function buildInteractionLanguageSourceLocaleMap(
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): Record<string, string> {
  return Object.fromEntries(
    buildInteractionLanguageChoices(provider, options).map((choice) => [choice.value, choice.sourceLocale])
  );
}

export function buildCommonProviderInteractionLanguageSourceLocaleMap(
  provider?: TranslationProvider
): Record<string, string> {
  return Object.fromEntries(
    buildCommonProviderInteractionLanguageChoices(provider).map((choice) => [choice.value, choice.sourceLocale])
  );
}

export function getInteractionLanguageCurrentLabel(
  languageCode: string | null | undefined,
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): string {
  const choice = findInteractionLanguageChoice(languageCode, provider, options);
  if (choice) {
    return choice.nativeLabel;
  }

  const resolvedEntry = resolveRegistryEntry(languageCode);
  if (resolvedEntry) {
    return getNativeLanguageLabel(resolvedEntry.code, resolvedEntry.label, getEntryDisplayLocale(resolvedEntry));
  }

  const normalized = normalizeCode(languageCode);
  if (!normalized) {
    return "-";
  }

  const fallbackLabel = findTargetLanguageOption(normalized)?.label ?? normalized;
  const fallbackLocale = findSourceLanguageOption(normalized)?.locale ?? normalized;
  return getNativeLanguageLabel(normalized, fallbackLabel, fallbackLocale);
}

export function getInteractionLanguageEnglishLabel(
  languageCode: string | null | undefined,
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): string | null {
  const choice = findInteractionLanguageChoice(languageCode, provider, options);
  if (choice) {
    const englishLabel = getLocalizedLanguageLabel(choice.value, choice.label, "en");
    return normalizeComparableLanguageLabel(englishLabel) === normalizeComparableLanguageLabel(choice.nativeLabel)
      ? null
      : englishLabel;
  }

  const resolvedEntry = resolveRegistryEntry(languageCode);
  if (resolvedEntry) {
    const nativeLabel = getNativeLanguageLabel(
      resolvedEntry.code,
      resolvedEntry.label,
      getEntryDisplayLocale(resolvedEntry)
    );
    const englishLabel = getLocalizedLanguageLabel(resolvedEntry.code, resolvedEntry.label, "en");
    return normalizeComparableLanguageLabel(englishLabel) === normalizeComparableLanguageLabel(nativeLabel)
      ? null
      : englishLabel;
  }

  const normalized = normalizeCode(languageCode);
  if (!normalized) {
    return null;
  }

  const fallbackLabel = findTargetLanguageOption(normalized)?.label ?? normalized;
  const fallbackLocale = findSourceLanguageOption(normalized)?.locale ?? normalized;
  const nativeLabel = getNativeLanguageLabel(normalized, fallbackLabel, fallbackLocale);
  const englishLabel = getLocalizedLanguageLabel(normalized, fallbackLabel, "en");
  return normalizeComparableLanguageLabel(englishLabel) === normalizeComparableLanguageLabel(nativeLabel)
    ? null
    : englishLabel;
}

export function getInteractionLanguageLabel(
  languageCode: string | null | undefined,
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): string {
  const choice = findInteractionLanguageChoice(languageCode, provider, options);
  if (choice) {
    return choice.label;
  }

  const resolvedEntry = resolveRegistryEntry(languageCode);
  if (resolvedEntry) {
    return resolvedEntry.label;
  }

  const normalized = normalizeCode(languageCode);
  if (!normalized) {
    return "-";
  }

  return findTargetLanguageOption(normalized)?.label ?? normalized;
}
