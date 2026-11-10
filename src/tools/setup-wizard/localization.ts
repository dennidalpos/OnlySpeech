import { resolveBrowserUiLanguage } from "../../shared/ui-localization.js";

export const SUPPORTED_SETUP_WIZARD_UI_LANGUAGES = [
  "en",
  "it",
  "es",
  "fr",
  "de",
  "zh"
] as const;

export type SetupWizardUiLanguage = (typeof SUPPORTED_SETUP_WIZARD_UI_LANGUAGES)[number];

export const SETUP_WIZARD_UI_LANGUAGE_OPTIONS = Object.freeze([
  { value: "en", label: "English" },
  { value: "it", label: "Italiano" },
  { value: "es", label: "Espanol" },
  { value: "fr", label: "Francais" },
  { value: "de", label: "Deutsch" },
  { value: "zh", label: "中文" }
]) satisfies ReadonlyArray<{
  value: SetupWizardUiLanguage;
  label: string;
}>;

export function normalizeSetupWizardUiLanguage(
  value: string | null | undefined
): SetupWizardUiLanguage {
  const normalized = resolveBrowserUiLanguage(value ?? undefined);
  return SUPPORTED_SETUP_WIZARD_UI_LANGUAGES.includes(normalized as SetupWizardUiLanguage)
    ? (normalized as SetupWizardUiLanguage)
    : "en";
}
