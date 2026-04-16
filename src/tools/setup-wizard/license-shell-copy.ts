import type { SetupWizardUiLanguage } from "./localization.js";
import { getSetupWizardLicenseCopy, type SetupWizardLicenseCopy } from "./license-copy.js";

export const LICENSE_SHELL_COPY_FIELDS = [
  "eyebrow",
  "title",
  "statusTitle",
  "loadingLicense",
  "refreshBtn",
  "activateTitle",
  "emailLabel",
  "emailPlaceholder",
  "codeLabel",
  "codePlaceholder",
  "activateSubmitLabel",
  "detailsShowLabel",
  "trialTitle",
  "trialBtn",
  "trialExhausted",
  "removeTitle",
  "removeBtn",
  "removeSelectionLabel"
] as const satisfies ReadonlyArray<keyof SetupWizardLicenseCopy>;

export type SetupWizardLicenseShellCopy = Pick<
  SetupWizardLicenseCopy,
  (typeof LICENSE_SHELL_COPY_FIELDS)[number]
>;

export function getSetupWizardLicenseShellCopy(
  uiLanguage: SetupWizardUiLanguage = "en"
): SetupWizardLicenseShellCopy {
  const copy = getSetupWizardLicenseCopy(uiLanguage);

  return Object.fromEntries(
    LICENSE_SHELL_COPY_FIELDS.map((field) => [field, copy[field]])
  ) as SetupWizardLicenseShellCopy;
}
