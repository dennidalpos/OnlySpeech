export function getSetupWizardControlLicenseViewScript(): string {
  return `
      // ---------------------------------------------------------------------------
      // License UI mapping and rendering
      // ---------------------------------------------------------------------------
      function getLicenseElements() {
        return {
          detailsPanel: document.getElementById("license-update-feedback-details"),
          detailsToggleButton: document.getElementById("license-update-feedback-details-toggle"),
          detailsToggleWrap: document.getElementById("license-update-feedback-actions"),
          emailInput: document.getElementById("license-update-email"),
          feedback: document.getElementById("license-update-feedback"),
          refreshButton: document.getElementById("license-refresh-btn"),
          removeButton: document.getElementById("license-remove-btn"),
          removeCheck: document.getElementById("license-remove-check"),
          removeCheckLabel: document.getElementById("license-remove-check-label"),
          removeShell: document.getElementById("license-remove-shell"),
          statusCard: document.getElementById("license-status-card"),
          statusMessage: document.getElementById("license-status-message"),
          trialButton: document.getElementById("license-trial-btn"),
          trialExhausted: document.getElementById("license-trial-exhausted"),
          trialPanel: document.getElementById("license-trial-panel"),
          updateForm: document.getElementById("license-update-form"),
          updateTitle: document.getElementById("license-update-title"),
          updateWarning: document.getElementById("license-update-warning"),
          codeInput: document.getElementById("license-update-code"),
          submitButton: document.getElementById("license-update-submit")
        };
      }

      function setLicenseNoticeElement(element, notice) {
        if (!element) {
          return;
        }
        if (!notice || !notice.message) {
          element.textContent = "";
          element.className = "notice";
          element.hidden = true;
          return;
        }
        element.textContent = notice.message;
        element.className = "notice " + notice.tone;
        element.hidden = false;
      }

      function clearLicenseInputs(refs) {
        if (refs.emailInput instanceof HTMLInputElement) {
          refs.emailInput.value = "";
        }
        if (refs.codeInput instanceof HTMLTextAreaElement) {
          refs.codeInput.value = "";
        }
        if (refs.removeCheck instanceof HTMLInputElement) {
          refs.removeCheck.checked = false;
        }
        clearLicenseFeedbackState();
      }

      function renderLicenseStatusCard(refs, copy, lang) {
        if (!refs.statusCard) {
          return;
        }

        if (!licenseInfo) {
          refs.statusCard.innerHTML = ''
            + '<div class="license-status-empty">'
            + '<span class="license-status-badge">' + escapeHtml(copy.noLicense) + '</span>'
            + '<p>' + escapeHtml(copy.noLicenseBody) + '</p>'
            + '</div>';
          return;
        }

        const badgeLabel = licenseInfo.isExpired ? copy.expired : copy.active;
        const badgeClass = licenseInfo.isExpired ? "state-expired" : "state-active";

        refs.statusCard.innerHTML = ''
          + '<div class="license-status-summary">'
          + '  <div class="license-status-identity">'
          + '    <strong>' + escapeHtml(licenseInfo.email) + '</strong>'
          + '    <span>' + escapeHtml(formatLicensePlan(licenseInfo.plan, lang)) + '</span>'
          + '  </div>'
          + '  <span class="license-status-badge ' + badgeClass + '">' + escapeHtml(badgeLabel) + '</span>'
          + '</div>'
          + '<div class="license-metadata-grid">'
          + '  <div class="license-metadata-item"><span>' + escapeHtml(copy.plan) + '</span><strong>' + escapeHtml(formatLicensePlan(licenseInfo.plan, lang)) + '</strong></div>'
          + '  <div class="license-metadata-item"><span>' + escapeHtml(copy.activatedOn) + '</span><strong>' + escapeHtml(formatUtcDate(licenseInfo.activatedAt, lang)) + '</strong></div>'
          + '  <div class="license-metadata-item"><span>' + escapeHtml(copy.issuedOn) + '</span><strong>' + escapeHtml(formatUtcDate(licenseInfo.issuedAt, lang)) + '</strong></div>'
          + '  <div class="license-metadata-item"><span>' + escapeHtml(copy.expiry) + '</span><strong>' + escapeHtml(licenseInfo.expiresAt ? formatUtcDate(licenseInfo.expiresAt, lang) : copy.noExpiry) + '</strong></div>'
          + '</div>'
          + '<div class="license-status-timing">' + escapeHtml(formatLicenseDaysRemaining(licenseInfo, lang)) + '</div>';
      }

      function renderLicenseNotices(refs, copy) {
        setLicenseNoticeElement(refs.statusMessage, licenseUiState.statusNotice);
        setLicenseNoticeElement(refs.feedback, licenseUiState.feedbackNotice);

        const hasFeedbackDetail = Boolean(licenseUiState.feedbackNotice && licenseUiState.feedbackNotice.detail);
        if (refs.detailsToggleWrap) {
          refs.detailsToggleWrap.hidden = !hasFeedbackDetail;
        }
        if (refs.detailsToggleButton instanceof HTMLButtonElement) {
          refs.detailsToggleButton.textContent = licenseUiState.feedbackNotice?.expanded
            ? copy.detailsHideLabel
            : copy.detailsShowLabel;
        }
        if (refs.detailsPanel) {
          refs.detailsPanel.textContent = licenseUiState.feedbackNotice?.detail || "";
          refs.detailsPanel.hidden = !hasFeedbackDetail || !licenseUiState.feedbackNotice?.expanded;
        }
      }

      function renderLicenseControls(refs, copy) {
        const licensePresent = Boolean(licenseInfo);
        const activeLicensePresent = Boolean(licenseInfo && !licenseInfo.isExpired);
        const expiredLicensePresent = Boolean(licenseInfo && licenseInfo.isExpired);
        const shouldShowTrial = !licensePresent && !licenseHistoryPresent;
        const removeSelectionChecked = refs.removeCheck instanceof HTMLInputElement
          ? refs.removeCheck.checked
          : false;
        const removeDisabledState = !licensePresent
          ? {
              code: "license-remove-unavailable",
              message: copy.removeDisabledUnavailable
            }
          : !removeSelectionChecked
            ? {
                code: "license-remove-unconfirmed",
                message: copy.removeDisabledUnconfirmed
              }
            : null;
        const trialDisabledState = shouldShowTrial && !trialAvailability.eligible
          ? {
              code: "license-trial-exhausted",
              message: copy.trialDisabledExhausted
            }
          : null;

        if (refs.updateTitle) {
          refs.updateTitle.textContent = activeLicensePresent
            ? copy.replaceTitle
            : expiredLicensePresent
              ? copy.restoreTitle
              : copy.activateTitle;
        }

        if (refs.updateWarning) {
          if (expiredLicensePresent) {
            refs.updateWarning.textContent = copy.warningExpired;
            refs.updateWarning.hidden = false;
          } else if (activeLicensePresent) {
            refs.updateWarning.textContent = copy.warningActive;
            refs.updateWarning.hidden = false;
          } else {
            refs.updateWarning.hidden = true;
            refs.updateWarning.textContent = "";
          }
        }

        if (refs.submitButton instanceof HTMLButtonElement) {
          refs.submitButton.textContent = activeLicensePresent
            ? copy.replaceSubmitLabel
            : expiredLicensePresent
              ? copy.restoreSubmitLabel
              : copy.activateSubmitLabel;
        }

        if (refs.removeShell) {
          refs.removeShell.hidden = !licensePresent;
        }
        if (refs.removeCheck instanceof HTMLInputElement && !licensePresent) {
          refs.removeCheck.checked = false;
        }
        if (refs.removeCheckLabel) {
          refs.removeCheckLabel.textContent = copy.removeSelectionLabel;
        }
        if (refs.removeButton instanceof HTMLButtonElement) {
          refs.removeButton.disabled = Boolean(removeDisabledState);
          if (removeDisabledState) {
            refs.removeButton.setAttribute("data-disabled-reason", removeDisabledState.code);
            refs.removeButton.setAttribute("aria-describedby", "license-remove-disabled-reason");
          } else {
            refs.removeButton.removeAttribute("data-disabled-reason");
            if (refs.removeButton.getAttribute("aria-describedby") === "license-remove-disabled-reason") {
              refs.removeButton.removeAttribute("aria-describedby");
            }
          }
        }
        setNoticeState(
          "license-remove-disabled-reason",
          removeDisabledState ? { message: removeDisabledState.message, tone: "warn" } : null
        );

        if (refs.trialPanel) {
          refs.trialPanel.hidden = !shouldShowTrial;
        }
        if (refs.trialExhausted) {
          refs.trialExhausted.hidden = trialAvailability.eligible;
        }
        if (refs.trialButton instanceof HTMLButtonElement) {
          refs.trialButton.hidden = !shouldShowTrial || !trialAvailability.eligible;
          refs.trialButton.disabled = !trialAvailability.eligible;
          if (trialDisabledState) {
            refs.trialButton.setAttribute("data-disabled-reason", trialDisabledState.code);
            refs.trialButton.setAttribute("aria-describedby", "license-trial-exhausted");
          } else {
            refs.trialButton.removeAttribute("data-disabled-reason");
            if (refs.trialButton.getAttribute("aria-describedby") === "license-trial-exhausted") {
              refs.trialButton.removeAttribute("aria-describedby");
            }
          }
        }
      }

      function renderLicenseSection() {
        const lang = wizardUiLanguage;
        const copy = licenseCopy(lang);
        const refs = getLicenseElements();

        renderLicenseStatusCard(refs, copy, lang);
        renderLicenseNotices(refs, copy);
        renderLicenseControls(refs, copy);
        bindLicenseEventHandlers();
      }
  `;
}
