import type { SetupWizardControlScriptData } from "./control-page-script.js";
import { getSetupWizardControlCoreLocalizationScript } from "./control-page-script-core-localization.js";
import { getSetupWizardControlCoreRenderScript } from "./control-page-script-core-render.js";
import { getSetupWizardControlCoreRuntimeScript } from "./control-page-script-core-runtime.js";

export function getSetupWizardControlCoreScript(data: SetupWizardControlScriptData): string {
  const { wizardShellByLanguage } = data;

  return [
    `      const api = window.onlySpeechWizard;
      const wizardShellByLanguage = ${wizardShellByLanguage};`,
    getSetupWizardControlCoreLocalizationScript(data),
    getSetupWizardControlCoreRuntimeScript(data),
    getSetupWizardControlCoreRenderScript()
  ].join("\n");
}
