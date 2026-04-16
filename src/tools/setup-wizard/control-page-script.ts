import { getSetupWizardControlActionsScript } from "./control-page-script-actions.js";
import { getSetupWizardControlBootstrapScript } from "./control-page-script-bootstrap.js";
import { getSetupWizardControlCoreScript } from "./control-page-script-core.js";
import { getSetupWizardControlEnvScript } from "./control-page-script-env.js";
import { getSetupWizardControlLanguageScript } from "./control-page-script-language.js";
import { getSetupWizardControlLicenseScript } from "./control-page-script-license.js";

export interface SetupWizardControlScriptData {
  wizardShellByLanguage: string;
  wizardSidePresentationByLanguage: string;
  wizardConfigurationIssuesFunction: string;
  wizardRuntimeProfileFunction: string;
  sourceLanguageOptionsByProvider: string;
  chatGptModelOptions: string;
  chatGptTranscribeModelOptions: string;
  translationProviders: string;
  interactionLanguageChoicesByProvider: string;
  interactionLanguageOptionGroupsByProvider: string;
  interactionLanguageFlagMarkupByProvider: string;
  interactionLanguageLabelsByProvider: string;
  interactionLanguageSupportedCodesByProvider: string;
  interactionLanguageMacroAreaGroupsByProvider: string;
  translationTargetOptionGroupsByProvider: string;
  sourceLocaleByTargetLanguageByProvider: string;
  runtimeDisclosureDefaultsByLanguage: string;
  logLevelOptions: string;
  initialWizardSection: string;
  initialWizardUiLanguage: string;
}

export function getSetupWizardControlScript(data: SetupWizardControlScriptData): string {
  return [
    getSetupWizardControlCoreScript(data),
    getSetupWizardControlLanguageScript(),
    getSetupWizardControlEnvScript(),
    getSetupWizardControlActionsScript(),
    getSetupWizardControlLicenseScript(),
    getSetupWizardControlBootstrapScript()
  ].join("\n");
}
