import type { SetupWizardControlScriptData } from "./control-page-script.js";
import { getSetupWizardControlCoreRuntimeFoundationScript } from "./control-page-script-core-runtime-foundation.js";
import { getSetupWizardControlCoreRuntimeIssuesScript } from "./control-page-script-core-runtime-issues.js";
import { getSetupWizardControlCoreRuntimeNavigationScript } from "./control-page-script-core-runtime-navigation.js";

export function getSetupWizardControlCoreRuntimeScript(data: SetupWizardControlScriptData): string {
  return [
    getSetupWizardControlCoreRuntimeFoundationScript(data),
    getSetupWizardControlCoreRuntimeNavigationScript(),
    getSetupWizardControlCoreRuntimeIssuesScript()
  ].join("\n");
}
