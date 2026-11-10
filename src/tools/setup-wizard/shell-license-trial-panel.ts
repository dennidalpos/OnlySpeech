import type { SetupWizardLicenseShellCopy } from "./license-shell-copy.js";
import { getSetupWizardCardHeaderHtml } from "./shell-primitives.js";

export function getSetupWizardLicenseTrialPanelHtml(copy: SetupWizardLicenseShellCopy): string {
  return `
          <article id="license-trial-panel" class="card settings-card license-card">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.trialTitle,
  title: copy.trialTitle
})}
            <div id="license-trial-exhausted" class="notice warn" hidden>${copy.trialExhausted}</div>
            <div class="actions license-trial-actions">
              <button id="license-trial-btn" type="button" class="secondary wizard-action">${copy.trialBtn}</button>
            </div>
          </article>
  `;
}
