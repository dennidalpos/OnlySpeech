import type { SetupWizardLicenseShellCopy } from "./license-shell-copy.js";
import { getSetupWizardCardHeaderHtml } from "./shell-primitives.js";

export function getSetupWizardLicenseUpdatePanelHtml(copy: SetupWizardLicenseShellCopy): string {
  return `
          <article class="card settings-card license-card">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.activateTitle,
  title: `<span id="license-update-title">${copy.activateTitle}</span>`
})}
            <div id="license-update-warning" class="notice warn" hidden></div>
            <div id="license-update-form-shell" class="license-form-shell">
              <form id="license-update-form" class="license-form" novalidate>
                <div class="license-form-grid">
                  <label class="license-field-row">
                    <span>${copy.emailLabel}</span>
                    <input id="license-update-email" type="email" autocomplete="email" placeholder="${copy.emailPlaceholder}" />
                  </label>
                  <label class="license-field-row license-code-field">
                    <span>${copy.codeLabel}</span>
                    <textarea id="license-update-code" rows="4" placeholder="${copy.codePlaceholder}" spellcheck="false"></textarea>
                  </label>
                </div>
                <div class="actions license-form-actions">
                  <button id="license-update-submit" type="submit" class="primary wizard-action">${copy.activateSubmitLabel}</button>
                </div>
              </form>
            </div>
            <div class="license-feedback-stack">
              <div id="license-status-message" class="notice info" aria-live="polite" hidden></div>
              <div id="license-update-feedback" class="notice" aria-live="polite" hidden></div>
              <div id="license-update-feedback-actions" class="actions license-inline-actions" hidden>
                <button id="license-update-feedback-details-toggle" type="button" class="secondary wizard-action">${copy.detailsShowLabel}</button>
              </div>
              <pre id="license-update-feedback-details" class="output license-feedback-details" hidden></pre>
            </div>
          </article>
  `;
}
