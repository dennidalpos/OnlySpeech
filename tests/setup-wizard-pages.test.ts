import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { getSetupWizardControlHtml, getSetupWizardOverlayHtml } from "../src/tools/setup-wizard/pages.js";
import { ENV_KEY_ORDER } from "../src/tools/env-probe-output.js";

function createStaticWizardDocument(html: string): Document {
  const dom = new JSDOM(html);
  dom.window.document.querySelectorAll("script").forEach((script) => script.remove());
  return dom.window.document;
}

describe("setup wizard page contracts", () => {
  it("renders the one-page control flow with the setup UI language selector and provider-owned diagnostics", () => {
    const html = getSetupWizardControlHtml();
    const document = createStaticWizardDocument(html);
    const visibleText = document.body.textContent || "";
    const styleText = document.querySelector("style")?.textContent || "";

    expect(html).toContain("OnlySpeech Setup Wizard");
    expect(html).toContain('data-section="stations"');
    expect(html).toContain('data-section="provider"');
    expect(html).toContain('data-section="languages"');
    expect(html).toContain('data-section="diagnostics"');
    expect(html).not.toContain('data-section="save"');
    expect(html).toContain('id="wizard-ui-language-select"');
    expect(html).toContain('id="setup-language-selector-A"');
    expect(html).toContain('id="setup-language-selector-B"');
    expect(html).toContain('id="env-DEFAULT_TARGET_LANG_A"');
    expect(html).toContain('id="env-DEFAULT_TARGET_LANG_B"');
    expect(html).toContain('id="env-SELECTOR_UI_LANGUAGE_A"');
    expect(html).toContain('id="env-SELECTOR_UI_LANGUAGE_B"');
    expect(html).toContain('id="env-TEXT_TO_SPEECH_ENABLED"');
    expect(html).toContain('id="env-VISITOR_CONVERSATION_HISTORY_ENABLED"');
    expect(html).toContain('id="save-review-visitor-history"');
    expect(html).toContain('id="autostart-enabled"');
    expect(html).toContain('id="autostart-config-note"');
    expect(html).toContain('id="save-review-autostart"');
    expect(html).toContain('id="run-provider-speech-test"');
    expect(html).toContain('id="run-tts-test"');
    expect(html).toContain('id="provider-shared-credentials-card"');
    expect(html).toContain('id="provider-specific-settings-card"');
    expect(html).toContain('id="stations-save-btn"');
    expect(html).toContain('id="provider-save-btn"');
    expect(html).toContain('id="languages-save-btn"');
    expect(html).toContain('id="diagnostics-save-btn"');
    expect(html).toContain('id="license-save-btn"');
    expect(html).toContain('id="save-section-save-btn"');
    expect(html).toContain('id="save-close-wizard"');
    expect(html).toContain('id="save-close-wizard-disabled-reason"');
    expect(html).toContain('id="stations-save-btn-disabled-reason"');
    expect(html).toContain('id="license-remove-check"');
    expect(html).toContain('id="license-remove-btn"');
    expect(html).toContain('id="license-remove-disabled-reason"');
    expect(html.indexOf('id="license-remove-check"')).toBeGreaterThan(html.indexOf('id="license-status-card"'));
    expect(html.indexOf('id="license-remove-check"')).toBeLessThan(html.indexOf('id="license-trial-panel"'));
    expect(html.indexOf('id="license-remove-btn"')).toBeGreaterThan(html.indexOf('id="license-status-card"'));
    expect(html.indexOf('id="license-remove-btn"')).toBeLessThan(html.indexOf('id="license-trial-panel"'));
    expect(html.indexOf('id="license-remove-check"')).toBeLessThan(html.indexOf('id="license-update-form-shell"'));
    expect(visibleText).toContain("Setup UI language");
    expect(visibleText).toContain("Initial runtime languages");
    expect(visibleText).toContain("Selector, playback and session");
    expect(visibleText).toContain("Provider speech playback test");
    expect(visibleText).toContain("Automatic startup");
    expect(visibleText).toContain("Opens windows");
    expect(visibleText).toContain("Opens folder");
    expect(visibleText).toContain("OnlySpeech . operator station A");
    expect(visibleText).toContain("OnlySpeech . visitor station B");
    expect(visibleText).toContain("Microphone signal A");
    expect(visibleText).toContain("Run provider test");
    expect(visibleText).not.toContain("OnlySpeech . postazione operatore A");
    expect(visibleText).not.toContain("OnlySpeech . postazione utente B");
    expect(html).not.toContain("Installa eSpeak NG");
    expect(html).not.toContain('id="tts-install"');
    expect(html).not.toContain('id="tts-coverage-grid"');
    expect(html).not.toContain('id="license-back-btn"');
    expect(html).not.toContain('id="license-next-btn"');
    expect(html).not.toContain('id="license-remove-confirm-btn"');
    expect(html).not.toContain('id="license-remove-cancel-btn"');
    expect(html).not.toContain('id="license-update-launcher"');
    expect(document.querySelector("#runtime-disclosure-notice")).toBeTruthy();
    expect(document.querySelector("#provider-validation-disclosure")).toBeTruthy();
    expect(document.querySelector("#playback-test-disclosure")).toBeTruthy();
    expect(document.querySelectorAll('[id="env-VISITOR_CONVERSATION_HISTORY_ENABLED"]')).toHaveLength(1);
    expect(styleText).toContain(".wizard-disclosure");
    expect(styleText).toContain(".shell-overview-grid");
  });

  it("keeps the persisted runtime and provider env fields wired in the control page", () => {
    const html = getSetupWizardControlHtml();
    const directlyEditableKeys = ENV_KEY_ORDER.filter(
      (key) =>
        ![
          "DISPLAY_A_ID",
          "DISPLAY_B_ID",
          "MIC_A_ID",
          "MIC_B_ID",
          "DEFAULT_TARGET_LANG_A",
          "DEFAULT_TARGET_LANG_B"
        ].includes(key)
    );

    for (const key of directlyEditableKeys) {
      expect(html).toContain(key);
    }

    expect(html).toContain("SETUP_UI_LANGUAGE");
    expect(html).toContain("RUNTIME_DISCLOSURE_MODE");
    expect(html).toContain("CHATGPT_TRANSCRIBE_MODEL");
    expect(html).toContain('id="save-close-wizard-disabled-reason"');
    expect(html).toContain('id="license-remove-disabled-reason"');
  });

  it("renders the overlay page with explicit station labels", () => {
    const html = getSetupWizardOverlayHtml();

    expect(html).toContain("OnlySpeech Display Wizard");
    expect(html).toContain("OnlySpeech . operator station A");
    expect(html).toContain("OnlySpeech . visitor station B");
    expect(html).toContain('id="assign-a"');
    expect(html).toContain('id="assign-b"');
    expect(html).toContain('id="close-monitor-setup"');
  });

  it("renders the Italian shell copy when the setup wizard is requested in Italian", () => {
    const html = getSetupWizardControlHtml("it");
    const document = createStaticWizardDocument(html);
    const visibleText = document.body.textContent || "";

    expect(visibleText).toContain("OnlySpeech . postazione operatore A");
    expect(visibleText).toContain("OnlySpeech . postazione utente B");
    expect(visibleText).toContain("Segnale microfono A");
    expect(visibleText).toContain("Riepilogo finale");
    expect(visibleText).toContain("Avvio automatico");
    expect(visibleText).toContain("Lingue iniziali e riproduzione runtime");
    expect(visibleText).toContain("Apri setup guidato monitor");
    expect(visibleText).toContain("Apre finestre");
    expect(visibleText).toContain("Rileva microfoni");
    expect(visibleText).toContain("Esegui test provider");
    expect(visibleText).toContain("Avvia test");
    expect(html).toContain('let wizardUiLanguage = "it";');
  });
});
