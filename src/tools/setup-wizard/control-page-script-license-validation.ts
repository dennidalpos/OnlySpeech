import {
  ACTIVATION_CODE_PREFIX,
  EMAIL_FORMAT_PATTERN_SOURCE
} from "../../shared/license-form.js";

export function getSetupWizardControlLicenseValidationScript(): string {
  return `
      // ---------------------------------------------------------------------------
      // License validation
      // ---------------------------------------------------------------------------
      const wizardLicenseEmailPattern = new RegExp(${JSON.stringify(EMAIL_FORMAT_PATTERN_SOURCE)});
      const wizardActivationCodePrefix = ${JSON.stringify(ACTIVATION_CODE_PREFIX)};

      function isWizardLicenseEmailValid(value) {
        const trimmed = String(value || "").trim();
        return trimmed.length > 0 && wizardLicenseEmailPattern.test(trimmed);
      }

      function isWizardActivationCodeValid(value) {
        const trimmed = String(value || "").trim();
        if (!trimmed.startsWith(wizardActivationCodePrefix)) {
          return false;
        }

        const parts = trimmed.split(".");
        return parts.length === 3 && parts[1].length > 0 && parts[2].length > 0;
      }

      function validateLicenseSubmission(email, activationCode, copy) {
        if (!email || !activationCode) {
          return copy.emailAndCodeRequired;
        }
        if (!isWizardLicenseEmailValid(email)) {
          return copy.invalidEmail;
        }
        if (!isWizardActivationCodeValid(activationCode)) {
          return copy.invalidCode;
        }
        return null;
      }
  `;
}
