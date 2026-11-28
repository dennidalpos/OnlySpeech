import { getSetupWizardControlLicenseActionsScript } from "./control-page-script-license-actions.js";
import { getSetupWizardControlLicenseCopyScript } from "./control-page-script-license-copy.js";
import { getSetupWizardControlLicenseStateScript } from "./control-page-script-license-state.js";
import { getSetupWizardControlLicenseValidationScript } from "./control-page-script-license-validation.js";
import { getSetupWizardControlLicenseViewScript } from "./control-page-script-license-view.js";

export function getSetupWizardControlLicenseScript(): string {
  return [
    getSetupWizardControlLicenseStateScript(),
    getSetupWizardControlLicenseCopyScript(),
    getSetupWizardControlLicenseValidationScript(),
    getSetupWizardControlLicenseViewScript(),
    getSetupWizardControlLicenseActionsScript()
  ].join("\n");
}
