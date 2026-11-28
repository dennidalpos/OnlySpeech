export function getSetupWizardControlLicenseStateScript(): string {
  return `
      // ---------------------------------------------------------------------------
      // License section state
      // ---------------------------------------------------------------------------
      let licenseInfo = null;
      let trialAvailability = { eligible: true, exhaustedAt: null };
      let licenseHistoryPresent = false;
      const licenseUiState = {
        feedbackNotice: null,
        statusNotice: null
      };

      function setLicenseStatusNotice(message = "", tone = "info", detail = "") {
        licenseUiState.statusNotice = message
          ? { message, tone, detail: detail || "", expanded: false }
          : null;
      }

      function clearLicenseStatusNoticeState() {
        licenseUiState.statusNotice = null;
      }

      function setLicenseFeedbackNotice(message = "", tone = "info", detail = "") {
        licenseUiState.feedbackNotice = message
          ? { message, tone, detail: detail || "", expanded: false }
          : null;
      }

      function clearLicenseFeedbackState() {
        licenseUiState.feedbackNotice = null;
      }

      function toggleLicenseFeedbackDetails() {
        if (!licenseUiState.feedbackNotice || !licenseUiState.feedbackNotice.detail) {
          return;
        }
        licenseUiState.feedbackNotice.expanded = !licenseUiState.feedbackNotice.expanded;
      }

      function syncLicenseHistory() {
        if (licenseInfo) {
          licenseHistoryPresent = true;
        }
      }
  `;
}
