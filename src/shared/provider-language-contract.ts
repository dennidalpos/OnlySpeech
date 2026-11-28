import {
  getInteractionLanguageEnglishLabel,
  getInteractionLanguageLabel,
  getInteractionLanguageCurrentLabel,
  normalizeInteractionLanguage,
  resolveInteractionLanguageSourceLocale,
  resolveProviderTargetLanguageCode
} from "./language-registry.js";
import {
  baseLanguageRegistry,
  getProviderCapabilityForLanguage
} from "./unified-language-registry.js";
import type {
  ProviderLanguageCapability,
  TranslationProvider
} from "./types.js";

export interface ProviderLanguageContract {
  provider: TranslationProvider;
  selectedLanguage: string;
  sourceLocale: string | null;
  targetCode: string | null;
  ttsLocale: string | null;
  canonicalBcp47: string;
  displayLabel: string;
  englishLabel: string;
  capability: ProviderLanguageCapability | null;
}

export function resolveProviderLanguageContract(options: {
  provider: TranslationProvider;
  language: string | null | undefined;
  fallbackLanguage?: string;
}): ProviderLanguageContract {
  const fallbackLanguage = options.fallbackLanguage ?? "en";
  const selectedLanguage = normalizeInteractionLanguage(
    options.language,
    options.provider,
    fallbackLanguage,
    { includeProviderExpansions: true }
  );
  const capability = getProviderCapabilityForLanguage(options.provider, selectedLanguage);
  const registryEntry = baseLanguageRegistry[selectedLanguage];
  const sourceLocale =
    capability?.sourceLocale ??
    resolveInteractionLanguageSourceLocale(selectedLanguage, options.provider, {
      includeProviderExpansions: true
    });
  const canonicalBcp47 = registryEntry?.canonicalBcp47 ?? sourceLocale ?? selectedLanguage;
  const targetCode =
    capability?.targetCode ??
    resolveProviderTargetLanguageCode(selectedLanguage, options.provider, {
      includeProviderExpansions: true
    });
  const displayLabel = getInteractionLanguageCurrentLabel(selectedLanguage, options.provider, {
    includeProviderExpansions: true
  });

  return {
    provider: options.provider,
    selectedLanguage,
    sourceLocale,
    targetCode,
    ttsLocale: sourceLocale ?? canonicalBcp47,
    canonicalBcp47,
    displayLabel,
    englishLabel:
      getInteractionLanguageEnglishLabel(selectedLanguage, options.provider, {
        includeProviderExpansions: true
      }) ??
      getInteractionLanguageLabel(selectedLanguage, options.provider, {
        includeProviderExpansions: true
      }),
    capability
  };
}
