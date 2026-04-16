import type { SetupWizardLicenseShellCopy } from "./license-shell-copy.js";
import { getSetupWizardCardHeaderHtml } from "./shell-primitives.js";

export function getSetupWizardLicenseStatusPanelHtml(copy: SetupWizardLicenseShellCopy): string {
  return `
          <article class="card settings-card license-card license-status-panel">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.statusTitle,
  title: copy.statusTitle,
  actionsHtml: `<button id="license-refresh-btn" type="button" class="secondary wizard-action">${copy.refreshBtn}</button>`
})}
            <div class="license-status-card" id="license-status-card">
              <p>${copy.loadingLicense}</p>
            </div>
            <div id="license-remove-shell" class="license-remove-inline license-danger-zone" hidden>
              <div class="license-remove-copy">
                <span class="eyebrow danger-eyebrow">${copy.removeTitle}</span>
                <strong>${copy.removeTitle}</strong>
              </div>
              <label class="license-checkbox" for="license-remove-check">
                <input type="checkbox" id="license-remove-check" />
                <span id="license-remove-check-label">${copy.removeSelectionLabel}</span>
              </label>
              <div class="actions license-remove-actions">
                <button id="license-remove-btn" type="button" class="danger wizard-action">${copy.removeBtn}</button>
              </div>
              <div id="license-remove-disabled-reason" class="notice warn" aria-live="polite" hidden></div>
            </div>
          </article>
  `;
}
