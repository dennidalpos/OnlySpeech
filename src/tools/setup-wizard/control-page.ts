import { getSetupWizardControlPageData } from "./control-page-data.js";
import { getSetupWizardControlScript } from "./control-page-script.js";
import { getSetupWizardControlShellHtml } from "./control-page-shell.js";
import type { SetupWizardUiLanguage } from "./localization.js";
import { SETUP_WIZARD_CONTROL_PAGE_STYLE } from "./control-page-style.js";

export function getSetupWizardControlHtml(uiLanguage: SetupWizardUiLanguage = "en"): string {
  const {
    wizardShellByLanguage,
    initialWizardSection,
    initialWizardUiLanguage,
    wizardSidePresentationByLanguage,
    wizardConfigurationIssuesFunction,
    wizardRuntimeProfileFunction,
    sourceLanguageOptionsByProvider,
    chatGptModelOptions,
    chatGptTranscribeModelOptions,
    translationProviders,
    interactionLanguageChoicesByProvider,
    interactionLanguageOptionGroupsByProvider,
    interactionLanguageFlagMarkupByProvider,
    interactionLanguageLabelsByProvider,
    interactionLanguageSupportedCodesByProvider,
    interactionLanguageMacroAreaGroupsByProvider,
    translationTargetOptionGroupsByProvider,
    sourceLocaleByTargetLanguageByProvider,
    runtimeDisclosureDefaultsByLanguage,
    logLevelOptions
  } = getSetupWizardControlPageData(uiLanguage);
  return `<!doctype html>
<html lang="${uiLanguage}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OnlySpeech Setup Wizard</title>
    <style>${SETUP_WIZARD_CONTROL_PAGE_STYLE}
    </style>
  </head>
  <body>
${getSetupWizardControlShellHtml(uiLanguage)}
    <script>
${getSetupWizardControlScript({
  wizardShellByLanguage,
  initialWizardSection,
  initialWizardUiLanguage,
  wizardSidePresentationByLanguage,
  wizardConfigurationIssuesFunction,
  wizardRuntimeProfileFunction,
  sourceLanguageOptionsByProvider,
  chatGptModelOptions,
  chatGptTranscribeModelOptions,
  translationProviders,
  interactionLanguageChoicesByProvider,
  interactionLanguageOptionGroupsByProvider,
  interactionLanguageFlagMarkupByProvider,
  interactionLanguageLabelsByProvider,
  interactionLanguageSupportedCodesByProvider,
  interactionLanguageMacroAreaGroupsByProvider,
  translationTargetOptionGroupsByProvider,
  sourceLocaleByTargetLanguageByProvider,
  runtimeDisclosureDefaultsByLanguage,
  logLevelOptions
})}
    </script>
  </body>
</html>`;
}
