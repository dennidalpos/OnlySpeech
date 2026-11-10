import type { SetupWizardControlScriptData } from "./control-page-script.js";
import { getSetupWizardControlCoreLocalizationCopyScript } from "./control-page-script-core-localization-copy.js";
import { getSetupWizardControlCoreLocalizationIssuesScript } from "./control-page-script-core-localization-issues.js";
import { getSetupWizardControlCoreLocalizationLanguageScript } from "./control-page-script-core-localization-language.js";

export function getSetupWizardControlCoreLocalizationScript(data: SetupWizardControlScriptData): string {
  return [
    getSetupWizardControlCoreLocalizationCopyScript(data.initialWizardUiLanguage),
    getSetupWizardControlCoreLocalizationLanguageScript(),
    getSetupWizardControlCoreLocalizationIssuesScript()
  ].join("\n");
}
