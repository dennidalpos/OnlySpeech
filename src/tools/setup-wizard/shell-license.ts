import type { SetupWizardUiLanguage } from "./localization.js";
import { getSetupWizardLicenseShellCopy } from "./license-shell-copy.js";
import { getSetupWizardSectionSaveBarHtml } from "./shell-section-save-bar.js";
import { getSetupWizardLicenseStatusPanelHtml } from "./shell-license-status-panel.js";
import { getSetupWizardLicenseTrialPanelHtml } from "./shell-license-trial-panel.js";
import { getSetupWizardLicenseUpdatePanelHtml } from "./shell-license-update-panel.js";
import { getSetupWizardSectionHeaderHtml } from "./shell-primitives.js";

export function getSetupWizardLicenseShellHtml(uiLanguage: SetupWizardUiLanguage = "en"): string {
  const copy = getSetupWizardLicenseShellCopy(uiLanguage);

  return `
      <section class="panel section-panel license-section" data-section-target="license" data-accent="license" tabindex="-1">
${getSetupWizardSectionHeaderHtml({
  eyebrow: copy.eyebrow,
  title: copy.title
})}

        <div class="license-overview-grid">
${getSetupWizardLicenseStatusPanelHtml(copy)}
${getSetupWizardLicenseTrialPanelHtml(copy)}
        </div>
${getSetupWizardLicenseUpdatePanelHtml(copy)}
${getSetupWizardSectionSaveBarHtml("license-save-btn", uiLanguage)}
      </section>
  `;
}
