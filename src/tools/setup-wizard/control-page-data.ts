import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FlagIcon } from "../../renderer/operator/components/FlagIcon.js";
import {
  buildInteractionLanguageChoices,
  buildInteractionLanguageOptionGroups,
  buildInteractionLanguageSourceLocaleMap,
  buildProviderSpeechSourceLanguageChoices
} from "../../shared/language-flow.js";
import { findSourceLanguageOption } from "../../shared/language-options.js";
import { buildInteractionLanguageRegionGroups } from "../../shared/language-selector-map.js";
import {
  buildTranslationTargetOptionGroups
} from "../../shared/language-registry.js";
import { getRuntimeDisclosureText } from "../../shared/runtime-disclosure.js";
import {
  getWizardRuntimeProfile,
  getWizardConfigurationIssues,
  getWizardSidePresentation
} from "./shared.js";
import { getSetupWizardControlShellHtml } from "./control-page-shell.js";
import {
  SUPPORTED_SETUP_WIZARD_UI_LANGUAGES,
  type SetupWizardUiLanguage
} from "./localization.js";

const chatGptModelOptions = [
  { value: "gpt-4.1-mini", label: "gpt-4.1-mini" },
  { value: "gpt-4.1", label: "gpt-4.1" },
  { value: "gpt-4o-mini", label: "gpt-4o-mini" },
  { value: "gpt-4o", label: "gpt-4o" }
];

const chatGptTranscribeModelOptions = [
  { value: "gpt-4o-mini-transcribe", label: "gpt-4o-mini-transcribe" },
  { value: "gpt-4o-transcribe", label: "gpt-4o-transcribe" },
  { value: "whisper-1", label: "whisper-1" }
];

const translationProviders = [
  { value: "chatgpt", label: "ChatGPT" },
  { value: "azure", label: "Azure Speech" },
  { value: "ollama", label: "Ollama" }
];

const logLevelOptions = [
  { value: "error", label: "error" },
  { value: "warn", label: "warn" },
  { value: "info", label: "info" },
  { value: "debug", label: "debug" }
];

const providerLanguageContractModeOptions = [
  { value: "strict", label: "strict" },
  { value: "compatible", label: "compatible" }
];

const chatGptTranslationDetectedLanguageModeOptions = [
  { value: "off", label: "off" },
  { value: "diagnostic", label: "diagnostic" },
  { value: "adaptive", label: "adaptive" }
];

function buildInteractionLanguageFlagMarkupByProvider() {
  const providers = ["chatgpt", "azure", "ollama"] as const;

  return Object.fromEntries(
    providers.map((provider) => {
      const entries = buildInteractionLanguageChoices(provider, { includeProviderExpansions: true }).map((choice) => [
        choice.value,
        renderToStaticMarkup(
          createElement(FlagIcon, {
            id: `wizard-${provider}-${choice.value}`,
            regionCode: choice.regionCode
          })
        )
      ]);

      return [provider, Object.fromEntries(entries)];
    })
  );
}

function buildInteractionLanguageLabelsByProvider() {
  const providers = ["chatgpt", "azure", "ollama"] as const;

  return Object.fromEntries(
    providers.map((provider) => [
      provider,
      Object.fromEntries(
        buildInteractionLanguageChoices(provider, { includeProviderExpansions: true }).map((choice) => [
          choice.value,
          choice.nativeLabel
        ])
      )
    ])
  );
}

function buildTranslationSourceLanguageChoices(provider?: "chatgpt" | "azure" | "ollama") {
  const seen = new Set<string>();

  return buildInteractionLanguageChoices(provider, { includeProviderExpansions: true }).flatMap((choice) => {
    if (!choice.sourceLocale || seen.has(choice.sourceLocale)) {
      return [];
    }

    const option = findSourceLanguageOption(choice.sourceLocale);
    if (!option) {
      return [];
    }

    seen.add(choice.sourceLocale);
    return [{ ...option }];
  });
}

export function getSetupWizardControlPageData(uiLanguage: SetupWizardUiLanguage = "en") {
  const wizardShellByLanguage = Object.fromEntries(
    SUPPORTED_SETUP_WIZARD_UI_LANGUAGES.map((language) => [language, getSetupWizardControlShellHtml(language)])
  );
  const wizardSidePresentationByLanguage = Object.fromEntries(
    SUPPORTED_SETUP_WIZARD_UI_LANGUAGES.map((language) => [language, getWizardSidePresentation(language)])
  );
  const runtimeDisclosureDefaultsByLanguage = Object.fromEntries(
    SUPPORTED_SETUP_WIZARD_UI_LANGUAGES.map((language) => [language, getRuntimeDisclosureText(language)])
  );

  return {
    wizardShellByLanguage: JSON.stringify(wizardShellByLanguage),
    initialWizardSection: JSON.stringify(process.env.ONLYSPEECH_SETUP_WIZARD_SECTION ?? "stations"),
    initialWizardUiLanguage: JSON.stringify(uiLanguage),
    wizardSidePresentationByLanguage: JSON.stringify(wizardSidePresentationByLanguage),
    wizardConfigurationIssuesFunction: getWizardConfigurationIssues.toString(),
    wizardRuntimeProfileFunction: getWizardRuntimeProfile.toString(),
    sourceLanguageOptionsByProvider: JSON.stringify({
      chatgpt: buildProviderSpeechSourceLanguageChoices("chatgpt", { includeProviderExpansions: true }),
      azure: buildProviderSpeechSourceLanguageChoices("azure", { includeProviderExpansions: true }),
      ollama: buildTranslationSourceLanguageChoices("ollama")
    }),
    chatGptModelOptions: JSON.stringify(chatGptModelOptions),
    chatGptTranscribeModelOptions: JSON.stringify(chatGptTranscribeModelOptions),
    translationProviders: JSON.stringify(translationProviders),
    interactionLanguageChoicesByProvider: JSON.stringify({
      chatgpt: buildInteractionLanguageChoices("chatgpt", { includeProviderExpansions: true }),
      azure: buildInteractionLanguageChoices("azure", { includeProviderExpansions: true }),
      ollama: buildInteractionLanguageChoices("ollama", { includeProviderExpansions: true })
    }),
    interactionLanguageOptionGroupsByProvider: JSON.stringify({
      chatgpt: buildInteractionLanguageOptionGroups("chatgpt", { includeProviderExpansions: true }),
      azure: buildInteractionLanguageOptionGroups("azure", { includeProviderExpansions: true }),
      ollama: buildInteractionLanguageOptionGroups("ollama", { includeProviderExpansions: true })
    }),
    interactionLanguageFlagMarkupByProvider: JSON.stringify(buildInteractionLanguageFlagMarkupByProvider()),
    interactionLanguageLabelsByProvider: JSON.stringify(buildInteractionLanguageLabelsByProvider()),
    interactionLanguageSupportedCodesByProvider: JSON.stringify({
      chatgpt: buildInteractionLanguageChoices("chatgpt", { includeProviderExpansions: true }).map((choice) => choice.value),
      azure: buildInteractionLanguageChoices("azure", { includeProviderExpansions: true }).map((choice) => choice.value),
      ollama: buildInteractionLanguageChoices("ollama", { includeProviderExpansions: true }).map((choice) => choice.value)
    }),
    interactionLanguageMacroAreaGroupsByProvider: JSON.stringify({
      chatgpt: buildInteractionLanguageRegionGroups(
        buildInteractionLanguageChoices("chatgpt", { includeProviderExpansions: true })
      ),
      azure: buildInteractionLanguageRegionGroups(
        buildInteractionLanguageChoices("azure", { includeProviderExpansions: true })
      ),
      ollama: buildInteractionLanguageRegionGroups(
        buildInteractionLanguageChoices("ollama", { includeProviderExpansions: true })
      )
    }),
    translationTargetOptionGroupsByProvider: JSON.stringify({
      chatgpt: buildTranslationTargetOptionGroups("chatgpt", { includeProviderExpansions: true }),
      azure: buildTranslationTargetOptionGroups("azure", { includeProviderExpansions: true }),
      ollama: buildTranslationTargetOptionGroups("ollama", { includeProviderExpansions: true })
    }),
    sourceLocaleByTargetLanguageByProvider: JSON.stringify({
      chatgpt: buildInteractionLanguageSourceLocaleMap("chatgpt", { includeProviderExpansions: true }),
      azure: buildInteractionLanguageSourceLocaleMap("azure", { includeProviderExpansions: true }),
      ollama: buildInteractionLanguageSourceLocaleMap("ollama", { includeProviderExpansions: true })
    }),
    runtimeDisclosureDefaultsByLanguage: JSON.stringify(runtimeDisclosureDefaultsByLanguage),
    providerLanguageContractModeOptions: JSON.stringify(providerLanguageContractModeOptions),
    chatGptTranslationDetectedLanguageModeOptions: JSON.stringify(chatGptTranslationDetectedLanguageModeOptions),
    logLevelOptions: JSON.stringify(logLevelOptions)
  };
}
