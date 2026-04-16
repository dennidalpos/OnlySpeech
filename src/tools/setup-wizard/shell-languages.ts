import { normalizeSetupWizardUiLanguage, type SetupWizardUiLanguage } from "./localization.js";
import { getSetupWizardSectionSaveBarHtml } from "./shell-section-save-bar.js";
import {
  getSetupWizardCardHeaderHtml,
  getSetupWizardSectionHeaderHtml
} from "./shell-primitives.js";

export function getSetupWizardLanguagesShellHtml(uiLanguage: SetupWizardUiLanguage = "en"): string {
  const normalizedLanguage = normalizeSetupWizardUiLanguage(uiLanguage);
  const copyByLanguage: Readonly<Record<SetupWizardUiLanguage, Record<string, string>>> = {
    en: {
      eyebrow: "Languages",
      title: "Initial languages and runtime playback",
      initialLanguages: "Initial runtime languages",
      runtimeSettings: "Selector, playback and session",
      operatorSelectorUi: "Operator selector zone & language",
      visitorSelectorUi: "Visitor selector zone & language",
      runtimePlayback: "Runtime speech playback",
      visitorHistory: "Visitor-side history"
    },
    it: {
      eyebrow: "Lingue",
      title: "Lingue iniziali e riproduzione runtime",
      initialLanguages: "Lingue iniziali runtime",
      runtimeSettings: "Selector, riproduzione e sessione",
      operatorSelectorUi: "Zona e lingua selector operatore",
      visitorSelectorUi: "Zona e lingua selector utente",
      runtimePlayback: "Riproduzione TTS runtime",
      visitorHistory: "Storico lato utente"
    },
    es: {
      eyebrow: "Idiomas",
      title: "Idiomas iniciales y reproduccion runtime",
      initialLanguages: "Idiomas iniciales runtime",
      runtimeSettings: "Selector, reproduccion y sesion",
      operatorSelectorUi: "Zona e idioma selector operador",
      visitorSelectorUi: "Zona e idioma selector usuario",
      runtimePlayback: "Reproduccion TTS runtime",
      visitorHistory: "Historial del lado usuario"
    },
    fr: {
      eyebrow: "Langues",
      title: "Langues initiales et lecture runtime",
      initialLanguages: "Langues initiales runtime",
      runtimeSettings: "Selecteur, lecture et session",
      operatorSelectorUi: "Zone et langue selecteur operateur",
      visitorSelectorUi: "Zone et langue selecteur utilisateur",
      runtimePlayback: "Lecture TTS runtime",
      visitorHistory: "Historique cote utilisateur"
    },
    de: {
      eyebrow: "Sprachen",
      title: "Initialsprachen und Runtime-Sprachausgabe",
      initialLanguages: "Initiale Runtime-Sprachen",
      runtimeSettings: "Selector, Wiedergabe und Sitzung",
      operatorSelectorUi: "Operator-Selector Zone & Sprache",
      visitorSelectorUi: "Nutzer-Selector Zone & Sprache",
      runtimePlayback: "Runtime-TTS-Wiedergabe",
      visitorHistory: "Verlauf auf der Nutzerseite"
    },
    zh: {
      eyebrow: "语言",
      title: "初始语言与 runtime 播放",
      initialLanguages: "初始 runtime 语言",
      runtimeSettings: "selector、播放与会话",
      operatorSelectorUi: "操作员 selector 区域 & 语言",
      visitorSelectorUi: "用户 selector 区域 & 语言",
      runtimePlayback: "runtime TTS 播放",
      visitorHistory: "用户侧会话历史"
    }
  };
  const copy = copyByLanguage[normalizedLanguage];
  return `
      <section class="panel section-panel" data-section-target="languages" data-accent="languages" tabindex="-1">
${getSetupWizardSectionHeaderHtml({
  eyebrow: copy.eyebrow,
  title: copy.title
})}
        <article class="card settings-card">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.initialLanguages,
  title: copy.initialLanguages
})}
          <div class="wizard-grid wizard-grid-2">
            <div class="setup-language-side-card side-A">
              <div id="setup-language-selector-A"></div>
            </div>
            <div class="setup-language-side-card side-B">
              <div id="setup-language-selector-B"></div>
            </div>
          </div>
          <select id="env-DEFAULT_TARGET_LANG_A" data-env-key="DEFAULT_TARGET_LANG_A" class="field-hidden" tabindex="-1" aria-hidden="true"></select>
          <select id="env-DEFAULT_TARGET_LANG_B" data-env-key="DEFAULT_TARGET_LANG_B" class="field-hidden" tabindex="-1" aria-hidden="true"></select>
          <div id="initial-language-notices" class="notice-stack" aria-live="polite"></div>
        </article>
        <article class="card settings-card">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.runtimeSettings,
  title: copy.runtimeSettings
})}
          <div class="form-grid">
            <label>${copy.operatorSelectorUi}
              <select id="env-SELECTOR_UI_LANGUAGE_A" data-env-key="SELECTOR_UI_LANGUAGE_A"></select>
            </label>
            <label>${copy.visitorSelectorUi}
              <select id="env-SELECTOR_UI_LANGUAGE_B" data-env-key="SELECTOR_UI_LANGUAGE_B"></select>
            </label>
            <label>${copy.runtimePlayback}
              <select id="env-TEXT_TO_SPEECH_ENABLED" data-env-key="TEXT_TO_SPEECH_ENABLED"></select>
            </label>
            <label>${copy.visitorHistory}
              <select id="env-VISITOR_CONVERSATION_HISTORY_ENABLED" data-env-key="VISITOR_CONVERSATION_HISTORY_ENABLED"></select>
            </label>
          </div>
          <div id="tts-runtime-disabled-note" class="notice info" hidden aria-live="polite"></div>
        </article>
${getSetupWizardSectionSaveBarHtml("languages-save-btn", normalizedLanguage)}
      </section>
  `;
}
