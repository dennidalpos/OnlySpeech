import { normalizeSetupWizardUiLanguage, type SetupWizardUiLanguage } from "./localization.js";

const SECTION_SAVE_LABEL_BY_LANGUAGE: Readonly<Record<SetupWizardUiLanguage, string>> = {
  en: "Save",
  it: "Salva",
  es: "Guardar",
  fr: "Sauvegarder",
  de: "Speichern",
  zh: "保存"
};

export function getSetupWizardSectionSaveLabel(
  uiLanguage: SetupWizardUiLanguage = "en"
): string {
  return SECTION_SAVE_LABEL_BY_LANGUAGE[normalizeSetupWizardUiLanguage(uiLanguage)];
}

export function getSetupWizardSectionSaveBarHtml(
  buttonId: string,
  uiLanguage: SetupWizardUiLanguage = "en"
): string {
  const disabledReasonId = `${buttonId}-disabled-reason`;
  return `
        <div class="save-actions-bar section-save-bar">
          <button class="secondary wizard-action" type="button" id="${buttonId}">${getSetupWizardSectionSaveLabel(uiLanguage)}</button>
        </div>
        <div id="${disabledReasonId}" class="notice warn top-gap" aria-live="polite" hidden></div>
  `;
}
