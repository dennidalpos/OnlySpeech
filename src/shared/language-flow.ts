import {
  findSourceLanguageOption,
  SUPPORTED_SOURCE_LANGUAGE_OPTIONS,
  type SourceLanguageOption
} from "./language-options.js";
import { baseLanguageRegistry } from "./unified-language-registry.js";
import type { RegionId } from "./region-registry.js";
import {
  buildCommonProviderInteractionLanguageChoices as buildRegistryCommonProviderInteractionLanguageChoices,
  buildCommonProviderInteractionLanguageOptionGroups as buildRegistryCommonProviderInteractionLanguageOptionGroups,
  buildCommonProviderInteractionLanguageOptions as buildRegistryCommonProviderInteractionLanguageOptions,
  buildCommonProviderInteractionLanguageSourceLocaleMap as buildRegistryCommonProviderInteractionLanguageSourceLocaleMap,
  buildInteractionLanguageChoices as buildRegistryInteractionLanguageChoices,
  buildInteractionLanguageOptionGroups as buildRegistryInteractionLanguageOptionGroups,
  buildInteractionLanguageOptions as buildRegistryInteractionLanguageOptions,
  buildInteractionLanguageSourceLocaleMap as buildRegistryInteractionLanguageSourceLocaleMap,
  getSupportedSpeechToTextLanguageCodes,
  type InteractionLanguageChoice as RegistryInteractionLanguageChoice,
  type InteractionLanguageQueryOptions,
  normalizeCommonProviderInteractionLanguage,
  normalizeInteractionLanguage,
  resolveCommonProviderInteractionLanguageSourceLocale,
  resolveInteractionLanguageSourceLocale
} from "./language-registry.js";
import type { LanguageOption, SideState, TranslationProvider } from "./types.js";

export type InteractionLanguageChoice = RegistryInteractionLanguageChoice & {
  regionIds: RegionId[];
  primaryRegionId: RegionId;
};

export interface ResolvedSideLanguageState {
  sourceLanguage: string | null;
}

const SOURCE_LANGUAGE_CHOICES = [...SUPPORTED_SOURCE_LANGUAGE_OPTIONS];

function decorateChoice(choice: RegistryInteractionLanguageChoice): InteractionLanguageChoice {
  const baseLanguage = baseLanguageRegistry[choice.value];
  if (!baseLanguage) {
    throw new Error(`Missing unified language registry entry for interaction language '${choice.value}'.`);
  }

  return {
    ...choice,
    regionIds: [...baseLanguage.regionIds],
    primaryRegionId: baseLanguage.primaryRegionId
  };
}

export function buildInteractionLanguageChoices(
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): InteractionLanguageChoice[] {
  return buildRegistryInteractionLanguageChoices(provider, options).map((choice) => decorateChoice(choice));
}

export function buildInteractionLanguageOptions(
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): LanguageOption[] {
  return buildRegistryInteractionLanguageOptions(provider, options).map((option) => ({ ...option }));
}

export function buildInteractionLanguageOptionGroups(
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
) {
  return buildRegistryInteractionLanguageOptionGroups(provider, options).map((group) => ({
    ...group,
    options: group.options.map((option) => ({ ...option }))
  }));
}

export function buildInteractionLanguageSourceLocaleMap(
  provider?: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): Record<string, string> {
  return { ...buildRegistryInteractionLanguageSourceLocaleMap(provider, options) };
}

export function buildCommonProviderInteractionLanguageChoices(
  provider?: TranslationProvider
): InteractionLanguageChoice[] {
  return buildRegistryCommonProviderInteractionLanguageChoices(provider).map((choice) => decorateChoice(choice));
}

export function buildCommonProviderInteractionLanguageOptions(
  provider?: TranslationProvider
): LanguageOption[] {
  return buildRegistryCommonProviderInteractionLanguageOptions(provider).map((option) => ({ ...option }));
}

export function buildCommonProviderInteractionLanguageOptionGroups(
  provider?: TranslationProvider
) {
  return buildRegistryCommonProviderInteractionLanguageOptionGroups(provider).map((group) => ({
    ...group,
    options: group.options.map((option) => ({ ...option }))
  }));
}

export function buildCommonProviderInteractionLanguageSourceLocaleMap(
  provider?: TranslationProvider
): Record<string, string> {
  return { ...buildRegistryCommonProviderInteractionLanguageSourceLocaleMap(provider) };
}

export function buildSourceLanguageChoices(_includeAutomatic = false): SourceLanguageOption[] {
  return SOURCE_LANGUAGE_CHOICES.map((choice) => ({ ...choice }));
}

export function buildProviderSpeechSourceLanguageChoices(
  provider: TranslationProvider,
  options?: InteractionLanguageQueryOptions
): SourceLanguageOption[] {
  const codes = getSupportedSpeechToTextLanguageCodes(provider, options);
  const seen = new Set<string>();
  const choices: SourceLanguageOption[] = [];

  for (const code of codes) {
    const sourceLocale = resolveInteractionLanguageSourceLocale(code, provider, options);
    if (!sourceLocale || seen.has(sourceLocale)) {
      continue;
    }

    const option = findSourceLanguageOption(sourceLocale);
    if (!option) {
      continue;
    }

    seen.add(sourceLocale);
    choices.push({ ...option });
  }

  return choices;
}

export function buildCommonProviderSpeechSourceLanguageChoices(provider: TranslationProvider): SourceLanguageOption[] {
  const seen = new Set<string>();
  const choices: SourceLanguageOption[] = [];

  for (const interactionChoice of buildCommonProviderInteractionLanguageChoices(provider)) {
    const sourceLocale = interactionChoice.sourceLocale;
    if (!sourceLocale || seen.has(sourceLocale)) {
      continue;
    }

    const option = findSourceLanguageOption(sourceLocale);
    if (!option) {
      continue;
    }

    seen.add(sourceLocale);
    choices.push({ ...option });
  }

  return choices;
}

export function resolveSynchronizedSourceLanguage(
  targetLanguage: string | null | undefined,
  fallbackSourceLanguage: string,
  translationProvider?: TranslationProvider
): string {
  const normalizedTargetLanguage = normalizeInteractionLanguage(
    targetLanguage,
    translationProvider,
    targetLanguage ?? fallbackSourceLanguage,
    { includeProviderExpansions: true }
  );
  return (
    resolveInteractionLanguageSourceLocale(normalizedTargetLanguage, translationProvider, {
      includeProviderExpansions: true
    }) ?? fallbackSourceLanguage
  );
}

export function resolveCommonProviderSynchronizedSourceLanguage(
  targetLanguage: string | null | undefined,
  fallbackSourceLanguage: string,
  translationProvider?: TranslationProvider
): string {
  const normalizedTargetLanguage = normalizeCommonProviderInteractionLanguage(
    targetLanguage,
    translationProvider,
    targetLanguage ?? "en"
  );

  return resolveCommonProviderInteractionLanguageSourceLocale(normalizedTargetLanguage, translationProvider) ?? fallbackSourceLanguage;
}

export function resolveConfiguredSideLanguageState(options: {
  targetLanguage: string | null | undefined;
  fallbackSourceLanguage: string;
  translationProvider?: TranslationProvider;
}): ResolvedSideLanguageState {
  return {
    sourceLanguage: resolveSynchronizedSourceLanguage(options.targetLanguage, options.fallbackSourceLanguage, options.translationProvider)
  };
}

export function resolveSelectedTargetLanguageState(
  targetLanguage: string,
  fallbackSourceLanguage: string,
  translationProvider?: TranslationProvider
): ResolvedSideLanguageState {
  return {
    sourceLanguage: resolveSynchronizedSourceLanguage(targetLanguage, fallbackSourceLanguage, translationProvider)
  };
}

export function applyResolvedLanguageState(
  sideState: SideState,
  resolvedState: ResolvedSideLanguageState
): SideState {
  return {
    ...sideState,
    sourceLanguage: resolvedState.sourceLanguage
  };
}
