import {
  buildInteractionLanguageChoices
} from "./language-flow.js";
import {
  getSupportedTranslationTargetLanguageCodes
} from "./language-registry.js";
import {
  resolveChatGptTranscriptionLanguagePolicy
} from "./provider-language-policy.js";
import {
  resolveVisitorLocalizationState,
  usesVisitorTechnicalEnglishFallback
} from "./visitor-language-readiness.js";
import {
  hasVisitorTechnicalLocalization
} from "./visitor-technical-localization.js";
import type { TranslationProvider } from "./types.js";

export interface ProviderLanguageMatrixEntry {
  provider: TranslationProvider;
  code: string;
  category: "interaction" | "translation-target";
  hasDedicatedVisitorLocalization: boolean;
  usesVisitorEnglishFallback: boolean;
  hasDedicatedTechnicalLocalization: boolean;
  usesTechnicalEnglishFallback: boolean;
  chatGptTranscriptionCatalogStatus?: "official" | "prompt-fallback";
  chatGptLanguageHint?: string | null;
}

function buildInteractionMatrix(provider: TranslationProvider): ProviderLanguageMatrixEntry[] {
  return buildInteractionLanguageChoices(provider, {
    includeProviderExpansions: true
  }).map((choice) => {
    const visitorState = resolveVisitorLocalizationState(choice.value);
    const transcriptionPolicy =
      provider === "chatgpt" ? resolveChatGptTranscriptionLanguagePolicy(choice.sourceLocale) : null;

    return {
      provider,
      code: choice.value,
      category: "interaction",
      hasDedicatedVisitorLocalization: visitorState.hasDedicatedLocalization,
      usesVisitorEnglishFallback: visitorState.usesEnglishFallback,
      hasDedicatedTechnicalLocalization: hasVisitorTechnicalLocalization(choice.value),
      usesTechnicalEnglishFallback: usesVisitorTechnicalEnglishFallback(choice.value),
      chatGptTranscriptionCatalogStatus: transcriptionPolicy?.catalogStatus,
      chatGptLanguageHint: transcriptionPolicy?.languageHint ?? null
    };
  });
}

function buildTranslationTargetMatrix(provider: TranslationProvider): ProviderLanguageMatrixEntry[] {
  const interactionCodes = new Set(
    buildInteractionLanguageChoices(provider, {
      includeProviderExpansions: true
    }).map((choice) => choice.value)
  );

  return getSupportedTranslationTargetLanguageCodes(provider, {
    includeProviderExpansions: true
  })
    .filter((code) => !interactionCodes.has(code))
    .map((code) => {
      const visitorState = resolveVisitorLocalizationState(code);
      return {
        provider,
        code,
        category: "translation-target",
        hasDedicatedVisitorLocalization: visitorState.hasDedicatedLocalization,
        usesVisitorEnglishFallback: visitorState.usesEnglishFallback,
        hasDedicatedTechnicalLocalization: hasVisitorTechnicalLocalization(code),
        usesTechnicalEnglishFallback: usesVisitorTechnicalEnglishFallback(code)
      };
    });
}

export function buildProviderLanguageMatrix(provider: TranslationProvider): ProviderLanguageMatrixEntry[] {
  return [...buildInteractionMatrix(provider), ...buildTranslationTargetMatrix(provider)];
}

export function buildProviderLanguageMatrixSummary(): Record<
  TranslationProvider,
  {
    interaction: ProviderLanguageMatrixEntry[];
    translationTargets: ProviderLanguageMatrixEntry[];
  }
> {
  return {
    azure: {
      interaction: buildInteractionMatrix("azure"),
      translationTargets: buildTranslationTargetMatrix("azure")
    },
    chatgpt: {
      interaction: buildInteractionMatrix("chatgpt"),
      translationTargets: buildTranslationTargetMatrix("chatgpt")
    }
  };
}
