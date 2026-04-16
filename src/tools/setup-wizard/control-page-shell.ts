import { getSetupWizardStationsShellHtml } from "./shell-stations.js";
import { getSetupWizardProviderShellHtml } from "./shell-provider.js";
import { getSetupWizardLanguagesShellHtml } from "./shell-languages.js";
import { getSetupWizardDiagnosticsShellHtml } from "./shell-diagnostics.js";
import { getSetupWizardReviewShellHtml } from "./shell-review.js";
import { getSetupWizardLicenseShellHtml } from "./shell-license.js";
import {
  SETUP_WIZARD_UI_LANGUAGE_OPTIONS,
  normalizeSetupWizardUiLanguage,
  type SetupWizardUiLanguage
} from "./localization.js";
import {
  getSetupWizardCardHeaderHtml,
  getSetupWizardDisclosureHtml
} from "./shell-primitives.js";

import { getRuntimeDisclosureText } from "../../shared/runtime-disclosure.js";

export function getSetupWizardControlShellHtml(uiLanguage: SetupWizardUiLanguage = "en"): string {
  const normalizedLanguage = normalizeSetupWizardUiLanguage(uiLanguage);
  const disclosure = getRuntimeDisclosureText(normalizedLanguage) ?? {
    title: "",
    paragraphs: []
  };
  const shellCopyByLanguage: Readonly<Record<SetupWizardUiLanguage, {
    eyebrow: string;
    refresh: string;
    overview: string;
    overviewDescription: string;
    runtimeDisclosure: string;
    stations: string;
    provider: string;
    languages: string;
    diagnostics: string;
    license: string;
    save: string;
    uiLabel: string;
    navLabel: string;
  }>> = {
    en: {
      eyebrow: "Guided provisioning",
      refresh: "Refresh status",
      overview: "Setup checklist",
      overviewDescription: "Follow the checklist top to bottom.",
      runtimeDisclosure: "AI-assisted use notice",
      stations: "Stations",
      provider: "Provider",
      languages: "Languages",
      diagnostics: "Diagnostics",
      license: "License",
      save: "Review & Save",
      uiLabel: "Setup UI language",
      navLabel: "Go to setup wizard section"
    },
    it: {
      eyebrow: "Provisioning guidato",
      refresh: "Aggiorna stato",
      overview: "Checklist configurazione",
      overviewDescription: "Segui la checklist dall'alto verso il basso.",
      runtimeDisclosure: "Avviso uso assistito",
      stations: "Postazioni",
      provider: "Provider",
      languages: "Lingue",
      diagnostics: "Diagnostica",
      license: "Licenza",
      save: "Conferma & Salva",
      uiLabel: "Lingua UI setup",
      navLabel: "Vai alla sezione del wizard"
    },
    es: {
      eyebrow: "Provisioning guiado",
      refresh: "Actualizar estado",
      overview: "Checklist de configuracion",
      overviewDescription: "Sigue la checklist de arriba a abajo.",
      runtimeDisclosure: "Aviso de uso asistido",
      stations: "Puestos",
      provider: "Proveedor",
      languages: "Idiomas",
      diagnostics: "Diagnostico",
      license: "Licencia",
      save: "Revisar y Guardar",
      uiLabel: "Idioma UI setup",
      navLabel: "Ir a la seccion del asistente"
    },
    fr: {
      eyebrow: "Provisioning guide",
      refresh: "Actualiser l'etat",
      overview: "Checklist de configuration",
      overviewDescription: "Suivez la checklist de haut en bas.",
      runtimeDisclosure: "Avis d'utilisation assistee",
      stations: "Postes",
      provider: "Fournisseur",
      languages: "Langues",
      diagnostics: "Diagnostic",
      license: "Licence",
      save: "Verifier et Sauvegarder",
      uiLabel: "Langue UI setup",
      navLabel: "Aller a la section de l'assistant"
    },
    de: {
      eyebrow: "Gefuhrte Bereitstellung",
      refresh: "Status aktualisieren",
      overview: "Konfigurationscheckliste",
      overviewDescription: "Folgen Sie der Checkliste von oben nach unten.",
      runtimeDisclosure: "Hinweis zur KI-gestutzten Nutzung",
      stations: "Stationen",
      provider: "Anbieter",
      languages: "Sprachen",
      diagnostics: "Diagnose",
      license: "Lizenz",
      save: "Prufen und Speichern",
      uiLabel: "Setup-UI-Sprache",
      navLabel: "Zum Abschnitt des Setup-Assistenten wechseln"
    },
    zh: {
      eyebrow: "引导式配置",
      refresh: "刷新状态",
      overview: "配置清单",
      overviewDescription: "从上到下按清单操作。",
      runtimeDisclosure: "AI 辅助使用提示",
      stations: "工作站",
      provider: "服务商",
      languages: "语言",
      diagnostics: "诊断",
      license: "许可",
      save: "检查并保存",
      uiLabel: "设置界面语言",
      navLabel: "跳转到设置向导分区"
    }
  };
  const shellCopy = shellCopyByLanguage[normalizedLanguage];
  const languageOptionsHtml = SETUP_WIZARD_UI_LANGUAGE_OPTIONS.map(
    (option) =>
      `<option value="${option.value}"${normalizedLanguage === option.value ? " selected" : ""}>${option.label}</option>`
  ).join("");

  return `
    <div class="shell">
      <section class="hero shell-hero">
        <div class="hero-top">
          <div class="hero-copy">
            <span class="eyebrow">${shellCopy.eyebrow}</span>
            <h1>OnlySpeech Setup Wizard</h1>
          </div>
          <div class="actions hero-actions">
            <label class="inline-select hero-language-select">
              <span>${shellCopy.uiLabel}</span>
              <select id="wizard-ui-language-select">
                ${languageOptionsHtml}
              </select>
            </label>
            <button class="secondary wizard-action" type="button" id="refresh-displays">${shellCopy.refresh}</button>
          </div>
        </div>
        <nav class="section-links" aria-label="${shellCopy.navLabel}">
          <button class="section-link is-active" type="button" data-section="stations" aria-current="true"><span class="section-dot" data-section-dot="stations">&#9675;</span> ${shellCopy.stations}</button>
          <button class="section-link" type="button" data-section="provider" aria-current="false"><span class="section-dot" data-section-dot="provider">&#9675;</span> ${shellCopy.provider}</button>
          <button class="section-link" type="button" data-section="languages" aria-current="false"><span class="section-dot" data-section-dot="languages">&#9675;</span> ${shellCopy.languages}</button>
          <button class="section-link" type="button" data-section="diagnostics" aria-current="false"><span class="section-dot" data-section-dot="diagnostics">&#9675;</span> ${shellCopy.diagnostics}</button>
          <button class="section-link" type="button" data-section="license" aria-current="false"><span class="section-dot" data-section-dot="license">&#9675;</span> ${shellCopy.license}</button>
        </nav>
      </section>
      <section class="panel shell-overview-panel">
${getSetupWizardCardHeaderHtml({
  eyebrow: shellCopy.overview,
  title: shellCopy.overview,
  description: shellCopy.overviewDescription
})}
        <div class="shell-overview-main">
          <div id="wizard-overview-strip" class="review-strip" aria-live="polite"></div>
          <div id="required-config-checklist" class="checklist" aria-live="polite"></div>
          <div class="notice info" id="status-message" aria-live="polite" hidden></div>
        </div>
${getSetupWizardDisclosureHtml({
  id: "runtime-disclosure-notice",
  detailsClass: "wizard-disclosure info-disclosure ai-disclosure-compact",
  summary: shellCopy.runtimeDisclosure,
  bodyHtml: `
          <div role="note">
            <strong>${disclosure.title}</strong>
            ${disclosure.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
          </div>
        `
})}
      </section>
${getSetupWizardStationsShellHtml(normalizedLanguage)}
${getSetupWizardProviderShellHtml(normalizedLanguage)}
${getSetupWizardLanguagesShellHtml(normalizedLanguage)}
${getSetupWizardDiagnosticsShellHtml(normalizedLanguage)}
${getSetupWizardLicenseShellHtml(normalizedLanguage)}
${getSetupWizardReviewShellHtml(normalizedLanguage)}
    </div>
`;
}
