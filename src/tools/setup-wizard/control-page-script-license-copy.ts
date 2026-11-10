import { SETUP_WIZARD_LICENSE_COPY_BY_LANGUAGE } from "./license-copy.js";

export function getSetupWizardControlLicenseCopyScript(): string {
  const serializedCopy = JSON.stringify(SETUP_WIZARD_LICENSE_COPY_BY_LANGUAGE);

  return `
      // ---------------------------------------------------------------------------
      // License localized resources
      // ---------------------------------------------------------------------------
      const licenseCopyByLanguage = ${serializedCopy};

      function licenseCopy(lang) {
        return licenseCopyByLanguage[lang] || licenseCopyByLanguage.en;
      }

      function formatLicenseMessage(template, values = {}) {
        return String(template).replace(/\\{(\\w+)\\}/g, (_match, key) => String(values[key] ?? ""));
      }

      function formatLicensePlan(plan, lang) {
        return licenseCopy(lang).plans[plan] || plan;
      }

      function formatLicenseDaysRemaining(info, lang) {
        const copy = licenseCopy(lang);
        if (info.daysRemaining === null) {
          return copy.noExpiry;
        }
        if (info.isExpired) {
          const daysAgo = Math.abs(info.daysRemaining);
          return formatLicenseMessage(daysAgo === 1 ? copy.expiredDay : copy.expiredDays, { count: daysAgo });
        }
        return formatLicenseMessage(
          info.daysRemaining === 1 ? copy.remainingDay : copy.remainingDays,
          { count: info.daysRemaining }
        );
      }

      function formatUtcDate(isoString, lang) {
        if (!isoString) { return "-"; }
        try {
          return new Date(isoString).toLocaleDateString(licenseCopy(lang).locale, {
            year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
          });
        } catch {
          return isoString;
        }
      }
  `;
}
