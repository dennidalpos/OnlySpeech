import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FlagIcon } from "../../renderer/operator/components/FlagIcon.js";
import {
  buildCommonProviderInteractionLanguageChoices,
  buildCommonProviderInteractionLanguageOptionGroups,
  buildCommonProviderInteractionLanguageSourceLocaleMap,
  buildCommonProviderSpeechSourceLanguageChoices,
  buildInteractionLanguageChoices
} from "../../shared/language-flow.js";
import { buildInteractionLanguageMacroAreaGroups } from "../../shared/language-selector-map.js";
import {
  buildCommonProviderTranslationTargetOptionGroups
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
  { value: "azure", label: "Azure Speech" }
];

const logLevelOptions = [
  { value: "error", label: "error" },
  { value: "warn", label: "warn" },
  { value: "info", label: "info" },
  { value: "debug", label: "debug" }
];

function buildInteractionLanguageFlagMarkupByProvider() {
  const providers = ["chatgpt", "azure"] as const;

  return Object.fromEntries(
    providers.map((provider) => {
      const entries = buildCommonProviderInteractionLanguageChoices(provider).map((choice) => [
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
  const providers = ["chatgpt", "azure"] as const;

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
      chatgpt: buildCommonProviderSpeechSourceLanguageChoices("chatgpt"),
      azure: buildCommonProviderSpeechSourceLanguageChoices("azure")
    }),
    chatGptModelOptions: JSON.stringify(chatGptModelOptions),
    chatGptTranscribeModelOptions: JSON.stringify(chatGptTranscribeModelOptions),
    translationProviders: JSON.stringify(translationProviders),
    interactionLanguageChoicesByProvider: JSON.stringify({
      chatgpt: buildCommonProviderInteractionLanguageChoices("chatgpt"),
      azure: buildCommonProviderInteractionLanguageChoices("azure")
    }),
    interactionLanguageOptionGroupsByProvider: JSON.stringify({
      chatgpt: buildCommonProviderInteractionLanguageOptionGroups("chatgpt"),
      azure: buildCommonProviderInteractionLanguageOptionGroups("azure")
    }),
    interactionLanguageFlagMarkupByProvider: JSON.stringify(buildInteractionLanguageFlagMarkupByProvider()),
    interactionLanguageLabelsByProvider: JSON.stringify(buildInteractionLanguageLabelsByProvider()),
    interactionLanguageSupportedCodesByProvider: JSON.stringify({
      chatgpt: buildCommonProviderInteractionLanguageChoices("chatgpt").map((choice) => choice.value),
      azure: buildCommonProviderInteractionLanguageChoices("azure").map((choice) => choice.value)
    }),
    interactionLanguageMacroAreaGroupsByProvider: JSON.stringify({
      chatgpt: buildInteractionLanguageMacroAreaGroups(
        buildCommonProviderInteractionLanguageChoices("chatgpt")
      ),
      azure: buildInteractionLanguageMacroAreaGroups(
        buildCommonProviderInteractionLanguageChoices("azure")
      )
    }),
    translationTargetOptionGroupsByProvider: JSON.stringify({
      chatgpt: buildCommonProviderTranslationTargetOptionGroups("chatgpt"),
      azure: buildCommonProviderTranslationTargetOptionGroups("azure")
    }),
    sourceLocaleByTargetLanguageByProvider: JSON.stringify({
      chatgpt: buildCommonProviderInteractionLanguageSourceLocaleMap("chatgpt"),
      azure: buildCommonProviderInteractionLanguageSourceLocaleMap("azure")
    }),
    runtimeDisclosureDefaultsByLanguage: JSON.stringify(runtimeDisclosureDefaultsByLanguage),
    logLevelOptions: JSON.stringify(logLevelOptions)
  };
}
