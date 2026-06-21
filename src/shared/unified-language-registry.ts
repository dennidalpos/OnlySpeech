import {
  CANONICAL_AZURE_TARGET_ONLY_LANGUAGES,
  CANONICAL_INTERACTION_LANGUAGES,
  CHATGPT_SPEECH_TO_TEXT_SUPPORTED_LANGUAGE_CODES,
  PROVIDER_LANGUAGE_CAPABILITIES_BY_CODE
} from "./language-registry-data.js";
import {
  getInteractionLanguageCurrentLabel,
  getInteractionLanguageEnglishLabel,
  resolveInteractionLanguageSourceLocale
} from "./language-registry.js";
import { resolveChatGptTranscriptionLanguagePolicy } from "./provider-language-policy.js";
import {
  REGION_REGISTRY,
  getRegionDefinition,
  getRegionLabel,
  type RegionId
} from "./region-registry.js";
import type { ProviderLanguageCapability, TranslationProvider } from "./types.js";

export interface UnifiedLanguageRecord {
  id: string;
  label: string;
  nativeLabel: string;
  englishLabel: string | null;
  canonicalBcp47: string;
  scriptDirection: "ltr" | "rtl";
  flagRegionCode: string | null;
  primaryRegionId: RegionId;
  regionIds: RegionId[];
  visualReferences: RegionId[];
  variants: string[];
  interactionLanguage: boolean;
}

export interface ProviderScopedLanguageRecord extends UnifiedLanguageRecord {
  providerCapability: ProviderLanguageCapability;
  speechReady: boolean;
  translationOnly: boolean;
  unsupportedReason: string | null;
}

export interface RegionLanguageGroup {
  regionId: RegionId;
  label: string;
  position: {
    top: string;
    left: string;
    width: string;
    height: string;
    compactTop: string;
    compactLeft: string;
    compactWidth: string;
    compactHeight: string;
  };
  languages: ProviderScopedLanguageRecord[];
}

const RTL_LANGUAGE_CODES = new Set(["ar", "fa", "he", "prs", "ps", "ur", "yi"]);

const REGION_COUNTRY_CODES: Readonly<Record<RegionId, readonly string[]>> = Object.freeze({
  europe: ["AL", "AT", "AZ", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GE", "GR", "HR", "HU", "IE", "IS", "IT", "LT", "LV", "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "RU", "SE", "SI", "SK", "TR", "UA"],
  "north-america": ["CA", "MX", "US"],
  "central-america-caribbean": ["AG", "AW", "BB", "BS", "BZ", "CR", "CU", "DM", "DO", "GD", "GT", "HN", "HT", "JM", "KN", "LC", "NI", "PA", "PR", "SV", "TT", "VC"],
  "south-america": ["AR", "BO", "BR", "CL", "CO", "EC", "GF", "GY", "PE", "PY", "SR", "UY", "VE"],
  africa: ["DZ", "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ", "EG", "ER", "ET", "GA", "GH", "GM", "GN", "GQ", "GW", "KE", "KM", "LR", "LS", "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ", "NA", "NE", "NG", "RW", "SC", "SD", "SL", "SN", "SO", "SS", "ST", "SZ", "TD", "TG", "TN", "TZ", "UG", "ZA", "ZM", "ZW"],
  "middle-east": ["AE", "BH", "IL", "IQ", "IR", "JO", "KW", "LB", "OM", "PS", "QA", "SA", "SY", "YE"],
  "central-asia": ["AM", "KG", "KZ", "MN", "TJ", "TM", "UZ"],
  "south-asia": ["AF", "BD", "BT", "IN", "LK", "MV", "NP", "PK"],
  "east-asia": ["CN", "HK", "JP", "KP", "KR", "MO", "TW"],
  "southeast-asia": ["BN", "ID", "KH", "LA", "MM", "MY", "PH", "SG", "TH", "TL", "VN"],
  oceania: ["AU", "FJ", "KI", "MH", "FM", "NC", "NR", "NZ", "PF", "PG", "PW", "SB", "TO", "TV", "VU", "WS"]
});

const MACRO_AREA_PRIMARY_REGION_IDS: Readonly<
  Record<"europe" | "americas" | "oceania" | "africa" | "asia", readonly RegionId[]>
> = Object.freeze({
  europe: ["europe"],
  americas: ["north-america"],
  oceania: ["oceania"],
  africa: ["africa"],
  asia: ["middle-east"]
});

const INTERACTION_LANGUAGE_PRIMARY_REGION_OVERRIDES: Readonly<Partial<Record<string, RegionId>>> = Object.freeze({
  az: "central-asia",
  ka: "central-asia",
  tr: "middle-east"
});

const INTERACTION_LANGUAGE_IDS = Object.freeze(
  CANONICAL_INTERACTION_LANGUAGES.map((entry) => entry.code)
);

const OPENAI_TTS_SUPPORTED_LANGUAGE_CODES = new Set(
  CHATGPT_SPEECH_TO_TEXT_SUPPORTED_LANGUAGE_CODES.map((code) => code.toLowerCase())
);

function normalizeLanguageId(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function getCountryCodeRegion(countryCode: string | null | undefined): RegionId | null {
  if (!countryCode) {
    return null;
  }

  const normalizedCountryCode = countryCode.toUpperCase();
  for (const region of REGION_REGISTRY) {
    if (REGION_COUNTRY_CODES[region.id].includes(normalizedCountryCode)) {
      return region.id;
    }
  }

  return null;
}

function getFlagRegionCode(languageId: string): string | null {
  return (
    CANONICAL_INTERACTION_LANGUAGES.find((entry) => entry.code === languageId)?.displayLocale.match(/-([A-Z]{2})$/)?.[1] ??
    CANONICAL_AZURE_TARGET_ONLY_LANGUAGES.find((entry) => entry.code === languageId)?.flagRegionCode ??
    null
  );
}

function getPrimaryMacroAreaRegion(languageId: string): RegionId[] {
  const interactionEntry = CANONICAL_INTERACTION_LANGUAGES.find((entry) => entry.code === languageId);
  if (!interactionEntry) {
    const targetOnlyEntry = CANONICAL_AZURE_TARGET_ONLY_LANGUAGES.find((entry) => entry.code === languageId);
    const targetOnlyMacroArea = targetOnlyEntry?.macroAreas[0];
    return targetOnlyMacroArea ? [...MACRO_AREA_PRIMARY_REGION_IDS[targetOnlyMacroArea]] : [];
  }

  const explicitRegion = INTERACTION_LANGUAGE_PRIMARY_REGION_OVERRIDES[interactionEntry.code];
  if (explicitRegion) {
    return [explicitRegion];
  }

  return [...MACRO_AREA_PRIMARY_REGION_IDS[interactionEntry.macroArea]];
}

function resolveRegionIds(languageId: string): { primaryRegionId: RegionId; visualReferences: RegionId[] } {
  const flagRegionCode = getFlagRegionCode(languageId);
  const interactionEntry = CANONICAL_INTERACTION_LANGUAGES.find((entry) => entry.code === languageId);
  const forcedRegion = interactionEntry ? INTERACTION_LANGUAGE_PRIMARY_REGION_OVERRIDES[interactionEntry.code] ?? null : null;
  const directRegion = forcedRegion ?? getCountryCodeRegion(flagRegionCode);
  const visualReferences = new Set<RegionId>(
    directRegion ? [directRegion] : getPrimaryMacroAreaRegion(languageId)
  );

  const primaryRegionId = directRegion ?? [...visualReferences][0] ?? "europe";
  visualReferences.add(primaryRegionId);

  return {
    primaryRegionId,
    visualReferences: [...visualReferences]
  };
}

function resolveVariants(languageId: string): string[] {
  const interactionEntry = CANONICAL_INTERACTION_LANGUAGES.find((entry) => entry.code === languageId);
  if (!interactionEntry) {
    return [languageId];
  }

  return [...new Set([languageId, interactionEntry.displayLocale, interactionEntry.preferredSourceLocale])];
}

function resolveScriptDirection(languageId: string): "ltr" | "rtl" {
  return RTL_LANGUAGE_CODES.has(normalizeLanguageId(languageId).split("-")[0] ?? "") ? "rtl" : "ltr";
}

function buildUnifiedLanguageRecord(languageId: string): UnifiedLanguageRecord {
  const canonicalBcp47 =
    CANONICAL_INTERACTION_LANGUAGES.find((entry) => entry.code === languageId)?.displayLocale ??
    resolveInteractionLanguageSourceLocale(languageId, undefined, { includeProviderExpansions: true }) ??
    languageId;
  const { primaryRegionId, visualReferences } = resolveRegionIds(languageId);

  return {
    id: languageId,
    label: getInteractionLanguageCurrentLabel(languageId, undefined, {
      includeProviderExpansions: true
    }),
    nativeLabel: getInteractionLanguageCurrentLabel(languageId, undefined, {
      includeProviderExpansions: true
    }),
    englishLabel: getInteractionLanguageEnglishLabel(languageId, undefined, {
      includeProviderExpansions: true
    }),
    canonicalBcp47,
    scriptDirection: resolveScriptDirection(languageId),
    flagRegionCode: getFlagRegionCode(languageId),
    primaryRegionId,
    regionIds: visualReferences,
    visualReferences,
    variants: resolveVariants(languageId),
    interactionLanguage: INTERACTION_LANGUAGE_IDS.includes(languageId)
  };
}

const BASE_LANGUAGE_REGISTRY = Object.freeze(
  Object.fromEntries(
    [...CANONICAL_INTERACTION_LANGUAGES, ...CANONICAL_AZURE_TARGET_ONLY_LANGUAGES].map((entry) => [
      entry.code,
      buildUnifiedLanguageRecord(entry.code)
    ])
  )
) as Readonly<Record<string, UnifiedLanguageRecord>>;

function buildProviderCapability(
  provider: TranslationProvider,
  languageId: string
): ProviderLanguageCapability {
  if (provider === "ollama") {
    return {
      languageId,
      stt: false,
      translation: true,
      tts: false,
      sourceLocale:
        resolveInteractionLanguageSourceLocale(languageId, undefined, {
          includeProviderExpansions: true
        }) ?? BASE_LANGUAGE_REGISTRY[languageId]?.canonicalBcp47 ?? null,
      targetCode: languageId,
      defaultVoice: null,
      notes: ["Uses Ollama native chat APIs for text translation and diagnostics."],
      limitations: [
        "No native STT endpoint exposed by Ollama.",
        "No native TTS endpoint exposed by Ollama."
      ]
    };
  }

  const providerCapability = PROVIDER_LANGUAGE_CAPABILITIES_BY_CODE[provider][normalizeLanguageId(languageId)];
  const sourceLocale =
    providerCapability?.preferredSourceLocale ??
    resolveInteractionLanguageSourceLocale(languageId, provider, {
      includeProviderExpansions: true
    }) ??
    null;
  const chatGptPolicy =
    provider === "chatgpt" ? resolveChatGptTranscriptionLanguagePolicy(sourceLocale ?? languageId) : null;
  const stt = providerCapability?.speechToText ?? false;
  const translation = providerCapability?.translationTarget ?? false;
  const tts =
    provider === "azure"
      ? Boolean(sourceLocale)
      : OPENAI_TTS_SUPPORTED_LANGUAGE_CODES.has(normalizeLanguageId(languageId));

  return {
    languageId,
    stt,
    translation,
    tts,
    sourceLocale,
    targetCode: providerCapability?.targetCode ?? null,
    defaultVoice: provider === "azure" ? "runtime-catalog" : tts ? "alloy" : null,
    notes: [
      ...(provider === "chatgpt" && chatGptPolicy?.usesPromptFallback
        ? ["STT language hint falls back to prompt guidance for this language."]
        : [])
    ],
    limitations: [
      ...(provider === "azure" && tts ? ["Default voice is resolved from the runtime Azure voice catalog."] : []),
      ...(provider === "chatgpt" && !stt ? ["Not listed in the official OpenAI STT support set."] : [])
    ]
  };
}

function toProviderScopedLanguage(
  provider: TranslationProvider,
  languageId: string
): ProviderScopedLanguageRecord {
  const baseLanguage = BASE_LANGUAGE_REGISTRY[languageId];
  const providerCapability = buildProviderCapability(provider, languageId);
  const speechReady = providerCapability.stt && providerCapability.translation && providerCapability.tts;
  const translationOnly = providerCapability.translation && !speechReady;

  return {
    ...baseLanguage,
    providerCapability,
    speechReady,
    translationOnly,
    unsupportedReason:
      providerCapability.translation
        ? speechReady
          ? null
          : !providerCapability.stt
            ? "Speech-to-text is not supported by this provider for the selected language."
            : !providerCapability.tts
              ? "Text-to-speech is not supported by this provider for the selected language."
              : null
        : "Translation is not supported by this provider for the selected language."
  };
}

export const baseLanguageRegistry = BASE_LANGUAGE_REGISTRY;

export const regionRegistry = REGION_REGISTRY;

export const providerLanguageCapabilities = Object.freeze({
  azure: Object.freeze(
    Object.fromEntries(Object.keys(BASE_LANGUAGE_REGISTRY).map((languageId) => [languageId, buildProviderCapability("azure", languageId)]))
  ),
  chatgpt: Object.freeze(
    Object.fromEntries(Object.keys(BASE_LANGUAGE_REGISTRY).map((languageId) => [languageId, buildProviderCapability("chatgpt", languageId)]))
  ),
  ollama: Object.freeze(
    Object.fromEntries(Object.keys(BASE_LANGUAGE_REGISTRY).map((languageId) => [languageId, buildProviderCapability("ollama", languageId)]))
  )
}) as Readonly<Record<TranslationProvider, Readonly<Record<string, ProviderLanguageCapability>>>>;

export function getAllUnifiedLanguages(): UnifiedLanguageRecord[] {
  return Object.values(BASE_LANGUAGE_REGISTRY);
}

export function getLanguagesForProvider(provider: TranslationProvider): ProviderScopedLanguageRecord[] {
  return INTERACTION_LANGUAGE_IDS.map((languageId) => toProviderScopedLanguage(provider, languageId)).filter(
    (language) => language.providerCapability.translation
  );
}

export function getSpeechReadyLanguages(provider: TranslationProvider): ProviderScopedLanguageRecord[] {
  return getLanguagesForProvider(provider).filter((language) => language.speechReady);
}

export function getTranslationOnlyLanguages(provider: TranslationProvider): ProviderScopedLanguageRecord[] {
  return getLanguagesForProvider(provider).filter((language) => language.translationOnly);
}

export function getProviderCapabilityForLanguage(
  provider: TranslationProvider,
  languageId: string
): ProviderLanguageCapability | null {
  return providerLanguageCapabilities[provider][languageId] ?? null;
}

export function isLanguageSpeechReady(provider: TranslationProvider, languageId: string): boolean {
  const capability = getProviderCapabilityForLanguage(provider, languageId);
  return Boolean(capability?.stt && capability.translation && capability.tts);
}

export function getLanguagesByRegion(provider?: TranslationProvider, displayLanguage = "en"): RegionLanguageGroup[] {
  const sourceLanguages = provider
    ? INTERACTION_LANGUAGE_IDS.map((languageId) => toProviderScopedLanguage(provider, languageId))
    : INTERACTION_LANGUAGE_IDS.map((languageId) => ({
        ...BASE_LANGUAGE_REGISTRY[languageId],
        providerCapability: buildProviderCapability("chatgpt", languageId),
        speechReady: false,
        translationOnly: false,
        unsupportedReason: null
      }));

  return REGION_REGISTRY.map((region) => ({
    regionId: region.id,
    label: getRegionLabel(region.id, displayLanguage),
    position: getRegionDefinition(region.id).position,
    languages: sourceLanguages.filter((language) => language.visualReferences.includes(region.id))
  })).filter((group) => group.languages.length > 0);
}

export function getVisualReferencesForRegion(regionId: RegionId): UnifiedLanguageRecord[] {
  return Object.values(BASE_LANGUAGE_REGISTRY).filter((language) => language.visualReferences.includes(regionId));
}
