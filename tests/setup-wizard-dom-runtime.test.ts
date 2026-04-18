import { describe, expect, it, vi } from "vitest";
import { getSetupWizardControlHtml, getSetupWizardOverlayHtml } from "../src/tools/setup-wizard/pages.js";
import type { AzureTextToSpeechCatalogSnapshot } from "../src/shared/types.js";
import {
  click,
  createDeferred,
  createDom,
  createWizardApi,
  createWizardState,
  setInputValue,
  setValue,
  waitForScripts
} from "./setup-wizard-dom-test-helpers.js";

describe("setup wizard executable DOM interactions", () => {
  it("runs the control page buttons, opens monitor setup manually, and keeps primary actions keyboard-focusable", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    expect(window.document.body.textContent).toContain("OnlySpeech . operator station A");
    expect(window.document.body.textContent).toContain("OnlySpeech . visitor station B");
    expect(window.document.querySelector("#provider-speech-notices")?.textContent).toContain(
      "ChatGPT uses final-turn audio upload"
    );
    expect(window.document.querySelector("#env-TEXT_TO_SPEECH_ENABLED")?.getAttribute("data-env-key")).toBe(
      "TEXT_TO_SPEECH_ENABLED"
    );
    expect(window.document.querySelector("#run-provider-speech-test")?.textContent).toContain("Start final-turn test");
    expect(window.document.querySelector("#toggle-monitor-setup")?.textContent).toContain("Open guided display setup");
    expect(window.document.querySelector("#toggle-monitor-setup .window-action-indicator")?.textContent).toContain(
      "Opens windows"
    );
    expect(window.document.querySelector("#open-runtime-logs .window-action-indicator")?.textContent).toContain(
      "Opens folder"
    );
    expect(window.document.querySelector("#toggle-monitor-setup")?.getAttribute("aria-description")).toContain(
      "fullscreen monitor mapping windows"
    );

    const openMonitorButton = window.document.querySelector("#toggle-monitor-setup");
    if (!(openMonitorButton instanceof window.HTMLButtonElement)) {
      throw new Error("Monitor setup button not found.");
    }
    openMonitorButton.focus();
    expect(window.document.activeElement).toBe(openMonitorButton);

    click(window, "#run-provider-test");
    await waitForScripts(window);
    expect(api.testProviderTranslation).toHaveBeenCalledTimes(1);

    click(window, "#toggle-monitor-setup");
    await waitForScripts(window);
    expect(api.openMonitorSetup).toHaveBeenCalledTimes(1);
    expect(window.document.querySelector("#toggle-monitor-setup .window-action-indicator")?.textContent).toContain(
      "Opens windows"
    );

    click(window, "#open-runtime-logs");
    await waitForScripts(window);
    expect(api.openLogsFolder).toHaveBeenCalledTimes(1);

    click(window, "#save-close-wizard");
    await waitForScripts(window);
    expect(api.saveEnv).toHaveBeenCalledTimes(1);
    expect(api.closeWizard).toHaveBeenCalledTimes(1);
    expect(window.document.querySelector("#save-feedback")?.textContent).toContain("Automatic startup enabled.");
    expect(window.document.querySelector("#save-feedback")?.textContent).toContain("TEMP-PASS-01");
    expect((window.document.querySelector("#save-feedback") as HTMLDivElement | null)?.hidden).toBe(false);
    expect(window.document.querySelector("#env-preview")?.textContent).toContain("PREVIEW=ok");

    setValue(window, "#provider-speech-microphone", "mic-a");
    click(window, "#run-provider-speech-test");
    await waitForScripts(window);
    expect(window.document.querySelector("#provider-speech-result")?.textContent).toContain(
      "Recording ChatGPT final-turn audio"
    );

    click(window, "#run-provider-speech-test");
    await waitForScripts(window);
    expect(api.testProviderSpeech).toHaveBeenCalledTimes(1);
    expect(window.document.querySelector("#provider-speech-result")?.textContent).toContain("Mode: final-turn-only");

    setValue(window, "#provider-select", "azure");
    await waitForScripts(window);
    expect(window.document.querySelector("#provider-speech-notices")?.textContent).toContain(
      "Azure supports a live microphone validation path"
    );
    expect(window.document.querySelector("#run-provider-speech-test")?.textContent).toContain("Start Azure live test");
  });

  it("hides provider cards that would otherwise render as empty for the active provider", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    const sharedCredentialsCard = window.document.querySelector("#provider-shared-credentials-card");
    const providerSpecificCard = window.document.querySelector("#provider-specific-settings-card");
    expect((sharedCredentialsCard as HTMLElement | null)?.hidden).toBe(true);
    expect((providerSpecificCard as HTMLElement | null)?.hidden).toBe(false);

    setValue(window, "#provider-select", "azure");
    await waitForScripts(window);

    expect((window.document.querySelector("#provider-shared-credentials-card") as HTMLElement | null)?.hidden).toBe(
      false
    );
    expect((window.document.querySelector("#provider-specific-settings-card") as HTMLElement | null)?.hidden).toBe(
      true
    );
  });

  it("shows the current packaged autostart state when no current-user Run key is present", async () => {
    const state = createWizardState();
    state.autostart.currentEnabled = false;
    state.autostart.selectedEnabled = false;
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    expect((window.document.querySelector("#autostart-enabled") as HTMLInputElement | null)?.checked).toBe(false);
    expect((window.document.querySelector("#autostart-enabled") as HTMLInputElement | null)?.disabled).toBe(false);
    expect(window.document.querySelector("#autostart-config-note")?.textContent).toContain("does not start automatically");
    expect(window.document.querySelector("#save-review-autostart")?.textContent).toContain("Disabled");
  });

  it("lets the operator change the autostart selection from the review section", async () => {
    const state = createWizardState();
    state.autostart.currentEnabled = true;
    state.autostart.selectedEnabled = true;
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    click(window, "#autostart-enabled");
    await waitForScripts(window);

    expect(api.updateAutostart).toHaveBeenCalledWith(false);
    expect(window.document.querySelector("#autostart-config-note")?.textContent).toContain("does not start automatically");
    expect(window.document.querySelector("#save-review-autostart")?.textContent).toContain("Disabled");
  });

  it("disables autostart controls when the current setup session is not running from a packaged install", async () => {
    const state = createWizardState();
    state.autostart.supported = false;
    state.autostart.canModify = false;
    state.autostart.currentEnabled = false;
    state.autostart.selectedEnabled = false;
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    expect((window.document.querySelector("#autostart-enabled") as HTMLInputElement | null)?.disabled).toBe(true);
    expect(window.document.querySelector("#autostart-config-note")?.textContent).toContain("packaged Windows installs");
    expect(window.document.querySelector("#save-review-autostart")?.textContent).toContain("Disabled");
  });

  it("blocks Apply and Close when the live provider credentials are incomplete", async () => {
    const state = createWizardState();
    state.envValues.CHATGPT_MODEL = "";
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    const saveButton = window.document.querySelector("#save-close-wizard") as HTMLButtonElement | null;
    const providerSaveButton = window.document.querySelector("#provider-save-btn") as HTMLButtonElement | null;
    expect(saveButton?.disabled).toBe(true);
    expect(saveButton?.getAttribute("data-disabled-reason")).toBe("save-provider-configuration");
    expect(providerSaveButton?.disabled).toBe(true);
    expect(providerSaveButton?.getAttribute("data-disabled-reason")).toBe("save-provider-configuration");
    expect(window.document.querySelector("#save-close-wizard-disabled-reason")?.textContent).toContain(
      "complete the selected provider"
    );
    expect(window.document.querySelector("#provider-save-btn-disabled-reason")?.textContent).toContain(
      "complete the selected provider"
    );

    click(window, "#save-close-wizard");
    await waitForScripts(window);

    expect(api.saveEnv).not.toHaveBeenCalled();
    expect(window.document.querySelector("#required-config-checklist")?.textContent).toContain(
      "provider credentials are missing"
    );
    expect(window.document.querySelector("#save-review-strip")?.textContent).toContain("Provider");
  });

  it("enables save buttons immediately when the last required provider field is typed without refresh", async () => {
    const state = createWizardState();
    state.envValues.CHATGPT_API_KEY = "";
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    const saveButton = window.document.querySelector("#save-close-wizard") as HTMLButtonElement | null;
    const providerSaveButton = window.document.querySelector("#provider-save-btn") as HTMLButtonElement | null;
    expect(saveButton?.disabled).toBe(true);
    expect(providerSaveButton?.disabled).toBe(true);

    setInputValue(window, "#env-CHATGPT_API_KEY", "chatgpt-live-key");
    await waitForScripts(window);

    expect(api.updateEnvValues).not.toHaveBeenCalled();
    expect(saveButton?.disabled).toBe(false);
    expect(saveButton?.hasAttribute("data-disabled-reason")).toBe(false);
    expect(providerSaveButton?.disabled).toBe(false);
    expect(providerSaveButton?.hasAttribute("data-disabled-reason")).toBe(false);
    expect(window.document.querySelector("#save-close-wizard-disabled-reason")?.hasAttribute("hidden")).toBe(true);
    expect(window.document.querySelector("#provider-save-btn-disabled-reason")?.hasAttribute("hidden")).toBe(true);
  });

  it("flushes typed provider credentials on save even when the field never blurs", async () => {
    const state = createWizardState();
    state.envValues.CHATGPT_API_KEY = "";
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    setInputValue(window, "#env-CHATGPT_API_KEY", "chatgpt-unblurred-key");
    await waitForScripts(window);

    click(window, "#save-close-wizard");
    await waitForScripts(window);

    expect(api.updateEnvValues).toHaveBeenCalledWith({ CHATGPT_API_KEY: "chatgpt-unblurred-key" });
    expect(api.saveEnv).toHaveBeenCalledTimes(1);
    expect(api.closeWizard).toHaveBeenCalledTimes(1);
  });

  it("keeps Apply and Close available in demo mode even when live provider credentials are blank", async () => {
    const state = createWizardState();
    state.envValues.APP_MODE = "demo";
    state.envValues.CHATGPT_API_KEY = "";
    state.envValues.CHATGPT_MODEL = "";
    state.envValues.CHATGPT_TRANSCRIBE_MODEL = "";
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    const saveButton = window.document.querySelector("#save-close-wizard") as HTMLButtonElement | null;
    expect(saveButton?.disabled).toBe(false);

    click(window, "#save-close-wizard");
    await waitForScripts(window);

    expect(api.saveEnv).toHaveBeenCalledTimes(1);
    expect(api.closeWizard).toHaveBeenCalledTimes(1);
  });

  it("exposes a stable disabled reason for provider speech tests when no selectable microphones are available", async () => {
    const state = createWizardState();
    state.microphones = [];
    state.microphonePermissionGranted = false;
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    click(window, "#provider-test-mode-voice");
    await waitForScripts(window);

    const speechButton = window.document.querySelector("#run-provider-speech-test") as HTMLButtonElement | null;
    expect(speechButton?.disabled).toBe(true);
    expect(speechButton?.getAttribute("data-disabled-reason")).toBe("provider-speech-no-microphones");
    expect(window.document.querySelector("#provider-speech-notices")?.textContent).toContain(
      "Grant microphone access before running provider speech tests."
    );
  });

  it("blocks Apply and Close when Azure has no compatible voice for an initial language", async () => {
    const state = createWizardState();
    state.envValues.TRANSLATION_PROVIDER = "azure";
    const api = createWizardApi(state);
    api.getAzureTextToSpeechCatalog.mockResolvedValue({
      region: "westeurope",
      status: "fresh",
      fetchedAt: "2026-04-09T08:00:00.000Z",
      freshUntil: "2026-04-09T08:05:00.000Z",
      voiceCount: 1,
      error: null,
      voices: [
        {
          id: "it-IT-ElsaNeural",
          name: "Elsa",
          language: "it-IT",
          engine: "azure",
          localeName: "Italian (Italy)",
          localName: "Elsa",
          shortName: "it-IT-ElsaNeural",
          gender: "Female"
        }
      ]
    } satisfies AzureTextToSpeechCatalogSnapshot);

    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;
    await waitForScripts(window);

    const saveButton = window.document.querySelector("#save-close-wizard") as HTMLButtonElement | null;
    expect(saveButton?.disabled).toBe(true);
    expect(saveButton?.getAttribute("data-disabled-reason")).toBe("save-azure-tts");
    expect(window.document.querySelector("#save-close-wizard-disabled-reason")?.textContent).toContain(
      "Azure TTS"
    );

    click(window, "#save-close-wizard");
    await waitForScripts(window);

    expect(api.saveEnv).not.toHaveBeenCalled();
    expect(window.document.querySelector("#required-config-checklist")?.textContent).toContain(
      "no compatible Azure voice for initial language B"
    );
    expect(window.document.querySelector("#save-review-strip")?.textContent).toContain("Azure TTS");
  });

  it("keeps Apply and Close available in demo mode when Azure voice coverage is unresolved", async () => {
    const state = createWizardState();
    state.envValues.APP_MODE = "demo";
    state.envValues.TRANSLATION_PROVIDER = "azure";
    state.envValues.AZURE_SPEECH_KEY = "";
    state.envValues.AZURE_SPEECH_REGION = "";
    const api = createWizardApi(state);
    api.getAzureTextToSpeechCatalog.mockResolvedValue({
      region: null,
      status: "unavailable",
      fetchedAt: null,
      freshUntil: null,
      voiceCount: 0,
      error: "Azure text-to-speech credentials are not configured.",
      voices: []
    } satisfies AzureTextToSpeechCatalogSnapshot);

    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;
    await waitForScripts(window);

    const saveButton = window.document.querySelector("#save-close-wizard") as HTMLButtonElement | null;
    expect(saveButton?.disabled).toBe(false);

    click(window, "#save-close-wizard");
    await waitForScripts(window);

    expect(api.saveEnv).toHaveBeenCalledTimes(1);
    expect(api.closeWizard).toHaveBeenCalledTimes(1);
  });

  it("keeps the monitor setup toggle synchronized when the overlay session closes outside the control page", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    expect(window.document.querySelector("#toggle-monitor-setup")?.textContent).toContain("Open guided display setup");

    click(window, "#toggle-monitor-setup");
    await waitForScripts(window);

    expect(window.document.querySelector("#toggle-monitor-setup")?.textContent).toContain("Close display setup");

    api.closeMonitorSetup();
    await waitForScripts(window);

    expect(window.document.querySelector("#toggle-monitor-setup")?.textContent).toContain("Open guided display setup");
  });

  it("persists the runtime TTS toggle and keeps provider playback diagnostics visible", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    setValue(window, "#env-TEXT_TO_SPEECH_ENABLED", "false");
    await waitForScripts(window);

    expect(api.updateEnvValues).toHaveBeenCalledWith({ TEXT_TO_SPEECH_ENABLED: "false" });
    expect(window.document.querySelector("#tts-runtime-disabled-note")?.textContent).toContain(
      "Runtime speech playback is disabled"
    );
    expect(window.document.querySelector("#tts-runtime-disabled-note")?.hasAttribute("hidden")).toBe(false);
    expect(window.document.querySelector("#run-tts-test")?.textContent).toContain("Play test");
    expect(window.document.querySelector("#tts-test-result")).not.toBeNull();
  });

  it("rewrites the provider playback sample when the playback language changes but preserves custom text", async () => {
    const state = createWizardState();
    state.envValues.DEFAULT_TARGET_LANG_A = "en";
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    expect((window.document.querySelector("#tts-test-language") as HTMLSelectElement | null)?.value).toBe("en");
    expect((window.document.querySelector("#tts-test-text") as HTMLTextAreaElement | null)?.value).toBe(
      "Hello, this is a provider speech playback test."
    );

    setValue(window, "#tts-test-language", "it");
    await waitForScripts(window);

    expect((window.document.querySelector("#tts-test-text") as HTMLTextAreaElement | null)?.value).toBe(
      "Buongiorno, questo e' un test di riproduzione provider."
    );

    const playbackText = window.document.querySelector("#tts-test-text");
    if (!(playbackText instanceof window.HTMLTextAreaElement)) {
      throw new Error("Playback sample textarea not found.");
    }
    playbackText.value = "Custom playback text.";

    setValue(window, "#tts-test-language", "en");
    await waitForScripts(window);

    expect(playbackText.value).toBe("Custom playback text.");
  });

  it("keeps collapsed disclosures closed and open disclosure wrappers open, and keeps empty notice shells hidden", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");

    const { window } = dom;

    // These disclosures are intentionally collapsed by default
    expect((window.document.querySelector("#advanced-settings") as HTMLDetailsElement | null)?.open).toBe(false);
    expect((window.document.querySelector("#provider-validation-disclosure") as HTMLDetailsElement | null)?.open).toBe(false);
    expect((window.document.querySelector("#playback-test-disclosure") as HTMLDetailsElement | null)?.open).toBe(false);

    // Technical output disclosures inside provider test panels are open by default
    expect(
      (window.document.querySelector("#provider-test-result")?.closest("details") as HTMLDetailsElement | null)?.open
    ).toBe(true);
    expect(
      (window.document.querySelector("#provider-speech-result")?.closest("details") as HTMLDetailsElement | null)?.open
    ).toBe(true);
    expect((window.document.querySelector("#tts-test-result")?.closest("details") as HTMLDetailsElement | null)?.open).toBe(
      true
    );
    expect((window.document.querySelector("#env-preview")?.closest("details") as HTMLDetailsElement | null)?.open).toBe(
      true
    );
    expect((window.document.querySelector("#tts-runtime-disabled-note") as HTMLDivElement | null)?.hidden).toBe(true);
    expect((window.document.querySelector("#save-close-wizard-disabled-reason") as HTMLDivElement | null)?.hidden).toBe(
      true
    );
  });

  it("renders Italian initial-language notices without undefined placeholders", async () => {
    const state = createWizardState();
    state.envValues.SETUP_UI_LANGUAGE = "it";
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml("it"), api, "http://127.0.0.1/control?uiLanguage=it");
    const { window } = dom;

    expect(window.document.querySelector("#initial-language-notices")?.textContent).toContain(
      "Le lingue iniziali runtime sono pronte"
    );
    expect(window.document.querySelector("#initial-language-notices")?.textContent).not.toContain("undefined");
  });

  it("saves the current wizard configuration from section save actions without closing the wizard", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    click(window, "#stations-save-btn");
    await waitForScripts(window);

    expect(api.saveEnv).toHaveBeenCalledTimes(1);
    expect(api.closeWizard).not.toHaveBeenCalled();
    expect(window.document.querySelector("#save-feedback")?.textContent).toContain("Stations:");

    click(window, "#diagnostics-save-btn");
    await waitForScripts(window);

    expect(api.saveEnv).toHaveBeenCalledTimes(2);
    expect(api.closeWizard).not.toHaveBeenCalled();
    expect(window.document.querySelector("#save-feedback")?.textContent).toContain("Diagnostics:");
  });

  it("updates the full wizard UI in real time when the operator language changes", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control?uiLanguage=en");
    const { window } = dom;

    expect((window.document.querySelector("#wizard-ui-language-select") as HTMLSelectElement | null)?.value).toBe("en");
    expect(window.document.querySelector("#refresh-displays")?.textContent).toContain("Refresh status");
    expect((window.document.querySelector("#provider-test-text") as HTMLTextAreaElement | null)?.value).toBe(
      "Hello, this is a translation test."
    );
    expect((window.document.querySelector("#tts-test-text") as HTMLTextAreaElement | null)?.value).toBe(
      "Hello, this is a provider speech playback test."
    );

    setValue(window, "#wizard-ui-language-select", "it");
    await waitForScripts(window);
    await waitForScripts(window);

    expect(api.updateEnvValues).toHaveBeenCalledWith({ SETUP_UI_LANGUAGE: "it" });
    expect((window.document.querySelector("#wizard-ui-language-select") as HTMLSelectElement | null)?.value).toBe("it");
    expect(window.document.querySelector("#refresh-displays")?.textContent).toContain("Aggiorna stato");
    expect(window.document.querySelector('[data-section="stations"]')?.textContent).toContain("Postazioni");
    expect(window.document.querySelector("#save-close-wizard")?.textContent).toContain("Applica e chiudi wizard");
    expect((window.document.querySelector("#provider-test-text") as HTMLTextAreaElement | null)?.value).toBe(
      "Buongiorno, questo e' un test di traduzione."
    );
    expect((window.document.querySelector("#tts-test-text") as HTMLTextAreaElement | null)?.value).toBe(
      "Buongiorno, questo e' un test di riproduzione provider."
    );
    expect(window.location.search).toContain("uiLanguage=it");
  });

  it("re-localizes the dynamic license panel when the wizard UI language changes", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    api.getLicenseState.mockResolvedValue(null);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control?uiLanguage=en");
    const { window } = dom;

    expect(window.document.querySelector("#license-status-card")?.textContent).toContain("No license installed on this device.");

    setValue(window, "#wizard-ui-language-select", "fr");
    await waitForScripts(window);
    await waitForScripts(window);

    expect(window.document.querySelector("#license-status-card")?.textContent).toContain("Aucune licence");
    expect(window.document.querySelector("#license-status-card")?.textContent).toContain("Aucune licence n'est installee sur ce poste.");
  });

  it("keeps license actions wired after the wizard UI language rebuilds the shell", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    api.getLicenseState.mockResolvedValue(null);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control?uiLanguage=en");
    const { window } = dom;

    setValue(window, "#wizard-ui-language-select", "fr");
    await waitForScripts(window);
    await waitForScripts(window);

    setValue(window, "#license-update-email", "buyer@example.com");
    setValue(window, "#license-update-code", "OS1.payload.signature");
    click(window, "#license-update-submit");
    await waitForScripts(window);

    expect(api.submitNewLicense).toHaveBeenCalledWith({
      email: "buyer@example.com",
      activationCode: "OS1.payload.signature"
    });
  });

  it("refreshes the license status from the dedicated status action", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    api.getLicenseState
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        email: "buyer@example.com",
        plan: "annual",
        activatedAt: "2026-04-08T08:00:00.000Z",
        issuedAt: "2026-04-08T08:00:00.000Z",
        expiresAt: "2027-04-08T08:00:00.000Z",
        daysRemaining: 364,
        isExpired: false
      });

    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    click(window, "#license-refresh-btn");
    await waitForScripts(window);

    expect(api.getLicenseState).toHaveBeenCalledTimes(2);
    expect(window.document.querySelector("#license-status-card")?.textContent).toContain("buyer@example.com");
    expect(window.document.querySelector("#license-status-card")?.textContent).toContain("Annual");
  });

  it("keeps the trial panel hidden while an active license is installed and keeps the license form visible", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    api.getLicenseState.mockResolvedValue({
      email: "buyer@example.com",
      plan: "annual",
      activatedAt: "2026-04-08T08:00:00.000Z",
      issuedAt: "2026-04-08T08:00:00.000Z",
      expiresAt: "2027-04-08T08:00:00.000Z",
      daysRemaining: 364,
      isExpired: false
    });
    api.getTrialAvailability.mockResolvedValue({
      eligible: false,
      exhaustedAt: "2026-04-08T08:00:00.000Z"
    });

    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    expect((window.document.querySelector("#license-trial-panel") as HTMLElement | null)?.hidden).toBe(true);
    expect((window.document.querySelector("#license-update-form-shell") as HTMLElement | null)?.hidden).toBe(false);
    expect((window.document.querySelector("#license-update-warning") as HTMLElement | null)?.hidden).toBe(false);
    expect(window.document.querySelector("#license-update-title")?.textContent).toContain("Replace installed license");
    expect(window.document.querySelector("#license-update-title")?.textContent).toContain("Replace installed license");
    expect(window.document.querySelector("#license-update-submit")?.textContent).toContain("Replace installed license");
    expect(window.document.querySelector("#license-update-warning")?.textContent).toContain("overwrite");
    expect((window.document.querySelector("#license-remove-shell") as HTMLElement | null)?.hidden).toBe(false);
    expect((window.document.querySelector("#license-remove-btn") as HTMLButtonElement | null)?.disabled).toBe(true);
    expect((window.document.querySelector("#license-remove-btn") as HTMLButtonElement | null)?.getAttribute("data-disabled-reason")).toBe("license-remove-unconfirmed");
    expect(window.document.querySelector("#license-remove-disabled-reason")?.textContent).toContain("Select the installed license");
    const statusPanel = window.document.querySelector(".license-status-panel");
    const updateShell = window.document.querySelector("#license-update-form-shell");
    expect(statusPanel?.textContent).toContain("Remove installed license");
    expect(statusPanel?.querySelector("#license-remove-check")).not.toBeNull();
    expect(statusPanel?.querySelector("#license-remove-btn")).not.toBeNull();
    expect(updateShell?.querySelector("#license-remove-btn")).toBeNull();
    expect(updateShell?.querySelector("#license-remove-check")).toBeNull();
    expect(updateShell?.textContent).not.toContain("Remove selected license");
  });

  it("switches the activation card to restore copy when the stored license is expired", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    api.getLicenseState.mockResolvedValue({
      email: "buyer@example.com",
      plan: "annual",
      activatedAt: "2025-04-08T08:00:00.000Z",
      issuedAt: "2025-04-08T08:00:00.000Z",
      expiresAt: "2026-04-08T08:00:00.000Z",
      daysRemaining: -1,
      isExpired: true
    });

    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    expect((window.document.querySelector("#license-update-form-shell") as HTMLElement | null)?.hidden).toBe(false);
    expect((window.document.querySelector("#license-trial-panel") as HTMLElement | null)?.hidden).toBe(true);
    expect(window.document.querySelector("#license-update-title")?.textContent).toContain("Restore access");
    expect(window.document.querySelector("#license-update-submit")?.textContent).toContain("Restore access");
    expect(window.document.querySelector("#license-update-warning")?.textContent).toContain("expired");
  });

  it("removes the installed license only after checkbox selection and confirmation", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    api.getLicenseState.mockResolvedValue({
      email: "buyer@example.com",
      plan: "annual",
      activatedAt: "2026-04-08T08:00:00.000Z",
      issuedAt: "2026-04-08T08:00:00.000Z",
      expiresAt: "2027-04-08T08:00:00.000Z",
      daysRemaining: 364,
      isExpired: false
    });
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    expect((window.document.querySelector("#license-remove-btn") as HTMLButtonElement | null)?.disabled).toBe(true);
    expect((window.document.querySelector("#license-remove-btn") as HTMLButtonElement | null)?.getAttribute("data-disabled-reason")).toBe("license-remove-unconfirmed");
    expect(api.clearLicense).not.toHaveBeenCalled();
    expect(confirmSpy).not.toHaveBeenCalled();

    const removeCheck = window.document.querySelector("#license-remove-check");
    if (!(removeCheck instanceof window.HTMLInputElement)) {
      throw new Error("License remove checkbox not found.");
    }
    removeCheck.checked = true;
    removeCheck.dispatchEvent(new window.Event("change", { bubbles: true }));
    await waitForScripts(window);

    expect((window.document.querySelector("#license-remove-btn") as HTMLButtonElement | null)?.disabled).toBe(false);
    expect((window.document.querySelector("#license-remove-btn") as HTMLButtonElement | null)?.hasAttribute("data-disabled-reason")).toBe(false);

    click(window, "#license-remove-btn");
    await waitForScripts(window);

    expect(api.clearLicense).toHaveBeenCalledTimes(1);
    expect(confirmSpy).toHaveBeenCalledTimes(1);
  });

  it("cancels license removal when the browser confirmation is rejected", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    api.getLicenseState.mockResolvedValue({
      email: "buyer@example.com",
      plan: "annual",
      activatedAt: "2026-04-08T08:00:00.000Z",
      issuedAt: "2026-04-08T08:00:00.000Z",
      expiresAt: "2027-04-08T08:00:00.000Z",
      daysRemaining: 364,
      isExpired: false
    });
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;
    vi.spyOn(window, "confirm").mockReturnValue(false);

    const removeCheck = window.document.querySelector("#license-remove-check");
    if (!(removeCheck instanceof window.HTMLInputElement)) {
      throw new Error("License remove checkbox not found.");
    }
    removeCheck.checked = true;
    removeCheck.dispatchEvent(new window.Event("change", { bubbles: true }));
    await waitForScripts(window);

    click(window, "#license-remove-btn");
    await waitForScripts(window);

    expect(api.clearLicense).not.toHaveBeenCalled();
    expect((window.document.querySelector("#license-remove-check") as HTMLInputElement | null)?.checked).toBe(true);
  });

  it("blocks invalid license replacement input before calling the backend bridge", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    api.getLicenseState.mockResolvedValue(null);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    setValue(window, "#license-update-email", "buyer");
    setValue(window, "#license-update-code", "INVALID");
    click(window, "#license-update-submit");
    await waitForScripts(window);

    expect(api.submitNewLicense).not.toHaveBeenCalled();
    expect(window.document.querySelector("#license-update-feedback")?.textContent).toContain("valid customer email");
  });

  it("hides the trial CTA when the workstation trial is already exhausted", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    api.getTrialAvailability.mockResolvedValue({
      eligible: false,
      exhaustedAt: "2026-04-09T08:00:00.000Z"
    });

    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    expect((window.document.querySelector("#license-trial-btn") as HTMLButtonElement | null)?.hidden).toBe(true);
    expect((window.document.querySelector("#license-trial-btn") as HTMLButtonElement | null)?.getAttribute("data-disabled-reason")).toBe("license-trial-exhausted");
    expect(window.document.querySelector("#license-trial-exhausted")?.hasAttribute("hidden")).toBe(false);
    expect(window.document.querySelector("#license-trial-panel")?.textContent).not.toContain("Available only");
  });

  it("terminates the app after Apply and Close when no license remains and the local trial is exhausted", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    api.getTrialAvailability.mockResolvedValue({
      eligible: false,
      exhaustedAt: "2026-04-09T08:00:00.000Z"
    });

    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    click(window, "#save-close-wizard");
    await waitForScripts(window);

    expect(api.terminateApplication).toHaveBeenCalledTimes(1);
    expect(api.closeWizard).not.toHaveBeenCalled();
    expect(window.document.querySelector("#save-feedback")?.textContent).toContain("Contact your OnlySpeech supplier");
  });

  it("switches the wizard disclosure preview between standard, custom, and disabled modes", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    expect(window.document.querySelector("#runtime-disclosure-notice")?.textContent).toContain(
      "OnlySpeech processes voice and transcript data for the active turn"
    );

    setValue(window, "#env-RUNTIME_DISCLOSURE_MODE", "custom");
    await waitForScripts(window);
    setValue(window, "#env-RUNTIME_DISCLOSURE_CUSTOM_TEXT", "Custom wizard disclosure.\nSecond custom paragraph.");
    await waitForScripts(window);

    expect(api.updateEnvValues).toHaveBeenCalledWith({ RUNTIME_DISCLOSURE_MODE: "custom" });
    expect(api.updateEnvValues).toHaveBeenCalledWith({
      RUNTIME_DISCLOSURE_CUSTOM_TEXT: "Custom wizard disclosure.\nSecond custom paragraph."
    });
    expect(window.document.querySelector("#runtime-disclosure-notice")?.textContent).toContain(
      "Custom wizard disclosure."
    );
    expect(window.document.querySelector("#runtime-disclosure-config-note")?.textContent).toContain(
      "custom notice"
    );

    setValue(window, "#env-RUNTIME_DISCLOSURE_MODE", "disabled");
    await waitForScripts(window);

    expect(window.document.querySelector("#runtime-disclosure-notice")?.hasAttribute("hidden")).toBe(true);
    expect(window.document.querySelector("#save-review-strip")?.textContent).toContain("Notice disabled");
  });

  it("runs the provider playback test with the Azure backend when the active provider exposes an exact voice", async () => {
    const state = createWizardState();
    state.envValues.TRANSLATION_PROVIDER = "azure";
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    click(window, "#run-tts-test");
    await waitForScripts(window);

    expect(api.testTextToSpeech).toHaveBeenCalledWith({
      text: "Hello, this is a provider speech playback test.",
      language: "it",
      translationProvider: "azure"
    });
    expect(window.document.querySelector("#tts-test-result")?.textContent).toContain("Engine: azure");
    expect(window.document.querySelector("#tts-test-result")?.textContent).toContain("Target: it");
    expect(window.document.querySelector("#tts-test-result")?.textContent).toContain("Elsa");
    expect(window.document.querySelector("#tts-test-notices")?.textContent || "").toBe("");

    api.emitTextToSpeechEvent({
      type: "ended",
      side: "A",
      content: "technical",
      requestId: "wizard-tts-1",
      engine: "azure",
      language: "it-IT",
      voiceName: "Elsa"
    });
    await waitForScripts(window);

    expect(window.document.querySelector("#tts-test-result")?.textContent).toContain(
      "Provider playback test completed."
    );
  });

  it("auto-refreshes the env preview on initialize without an explicit button", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    expect(api.previewEnv).toHaveBeenCalledTimes(1);
    expect(window.document.querySelector("#env-preview")?.textContent).toContain("PREVIEW=ok");
    expect(window.document.querySelector("#preview-env")).toBeNull();
  });

  it("shows busy progress while probe, provider test, and save actions are in flight", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const probeDeferred = createDeferred<MediaStream>();
    const providerDeferred = createDeferred<{ provider: string; mode: "translation"; output: string }>();
    const saveDeferred = createDeferred<{
      envPath: string;
      preview: string;
      secretStorageMode: "dotenv";
      storedSecretKeys: string[];
      autostartEnabled: boolean;
      autostartSupported: boolean;
      temporaryWizardPassword: string;
      mustChangeWizardPassword: boolean;
    }>();
    api.testProviderTranslation.mockImplementation(() => providerDeferred.promise);
    api.saveEnv.mockImplementation(() => saveDeferred.promise);

    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control", {
      beforeParse(window) {
        Object.defineProperty(window.navigator, "mediaDevices", {
          configurable: true,
          value: {
            getUserMedia: vi.fn(() => probeDeferred.promise),
            enumerateDevices: vi.fn(async () => [
              { kind: "audioinput", deviceId: "mic-a", groupId: "ga", label: "Microfono A" }
            ])
          }
        });
      }
    });
    const { window } = dom;

    const stationsProgress = window.document.querySelector("#stations-progress") as HTMLDivElement | null;
    const probeButton = window.document.querySelector("#probe-microphones") as HTMLButtonElement | null;
    expect(stationsProgress?.hidden).toBe(true);
    expect(stationsProgress?.getAttribute("aria-busy")).toBe("false");
    expect(probeButton?.disabled).toBe(false);
    expect(probeButton?.textContent).toContain("Probe microphones");

    click(window, "#probe-microphones");
    await waitForScripts(window);

    expect(stationsProgress?.hidden).toBe(false);
    expect(stationsProgress?.getAttribute("aria-busy")).toBe("true");
    expect(probeButton?.disabled).toBe(true);
    expect(probeButton?.getAttribute("data-disabled-reason")).toBe("probe-microphones-busy");
    expect(probeButton?.textContent).toContain("Probing");
    expect(window.document.querySelector("#probe-microphones-disabled-reason")?.textContent).toContain(
      "Wait for the current microphone probe to finish"
    );

    probeDeferred.resolve({
      getTracks: () => [{ stop: vi.fn() }]
    } as unknown as MediaStream);
    await waitForScripts(window);

    click(window, "#run-provider-test");
    const providerProgress = window.document.querySelector("#provider-test-progress") as HTMLDivElement | null;
    const providerButton = window.document.querySelector("#run-provider-test") as HTMLButtonElement | null;
    const providerCard = window.document.querySelector("#provider-test-card");
    expect(providerProgress?.hidden).toBe(false);
    expect(providerProgress?.getAttribute("aria-busy")).toBe("true");
    expect(providerButton?.disabled).toBe(true);
    expect(providerButton?.textContent).toContain("Provider test in progress");
    expect(providerCard?.getAttribute("aria-busy")).toBe("true");

    providerDeferred.resolve({ provider: "chatgpt", mode: "translation", output: "translated output" });
    await waitForScripts(window);

    expect(providerProgress?.hidden).toBe(true);
    expect(providerButton?.disabled).toBe(false);
    expect(providerCard?.getAttribute("aria-busy")).toBe("false");

    expect(window.document.querySelector("#preview-env")).toBeNull();
    expect(window.document.querySelector("#save-progress")).toBeNull();

    click(window, "#save-close-wizard");
    const saveButton = window.document.querySelector("#save-close-wizard") as HTMLButtonElement | null;
    expect(saveButton?.disabled).toBe(true);
    expect(saveButton?.getAttribute("data-disabled-reason")).toBe("save-busy");
    expect(saveButton?.textContent).toContain("Applying");
    expect(window.document.querySelector("#save-close-wizard-disabled-reason")?.textContent).toContain(
      "Wait for the active save operation"
    );

    saveDeferred.resolve({
      envPath: "C:\\OnlySpeech\\.env",
      preview: "PREVIEW=busy",
      secretStorageMode: "dotenv",
      storedSecretKeys: [],
      autostartEnabled: true,
      autostartSupported: true,
      temporaryWizardPassword: "TEMP-PASS-02",
      mustChangeWizardPassword: true
    });
    await waitForScripts(window);

    expect(window.document.querySelector("#save-feedback")?.textContent).toContain("TEMP-PASS-02");
  });

  it("keeps the provider playback failure visible in the test output instead of leaving the in-progress message", async () => {
    const state = createWizardState();
    state.envValues.TRANSLATION_PROVIDER = "azure";
    const api = createWizardApi(state);
    api.testTextToSpeech.mockRejectedValueOnce(new Error("Timed out while starting the provider playback preview."));

    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    click(window, "#run-tts-test");
    await waitForScripts(window);

    expect(window.document.querySelector("#tts-test-result")?.textContent).toContain(
      "Timed out while starting the provider playback preview."
    );
    expect(window.document.querySelector("#status-message")?.textContent).toContain(
      "Timed out while starting the provider playback preview."
    );
  });

  it("resets provider busy progress after translation failures", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const providerDeferred = createDeferred<{ provider: string; mode: "translation"; output: string }>();
    api.testProviderTranslation.mockImplementation(() => providerDeferred.promise);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    click(window, "#run-provider-test");
    await waitForScripts(window);

    const providerProgress = window.document.querySelector("#provider-test-progress") as HTMLDivElement | null;
    const providerButton = window.document.querySelector("#run-provider-test") as HTMLButtonElement | null;
    const providerCard = window.document.querySelector("#provider-test-card");
    expect(providerProgress?.hidden).toBe(false);
    expect(providerButton?.disabled).toBe(true);

    providerDeferred.reject(new Error("Provider translation failed."));
    await waitForScripts(window);

    expect(providerProgress?.hidden).toBe(true);
    expect(providerButton?.disabled).toBe(false);
    expect(providerCard?.getAttribute("aria-busy")).toBe("false");
    expect(window.document.querySelector("#status-message")?.textContent).toContain("Provider translation failed.");
  });

  it("shows provider speech busy progress while Azure live validation is in flight", async () => {
    const state = createWizardState();
    state.envValues.TRANSLATION_PROVIDER = "azure";
    const api = createWizardApi(state);
    const speechDeferred = createDeferred<{ transcript: string; translation: string }>();
    api.testProviderSpeech.mockImplementation(() => speechDeferred.promise);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    setValue(window, "#provider-select", "azure");
    await waitForScripts(window);
    setValue(window, "#provider-speech-microphone", "mic-a");
    await waitForScripts(window);
    click(window, "#run-provider-speech-test");
    await waitForScripts(window);

    const speechProgress = window.document.querySelector("#provider-speech-progress") as HTMLDivElement | null;
    const speechButton = window.document.querySelector("#run-provider-speech-test") as HTMLButtonElement | null;
    const speechCard = window.document.querySelector("#provider-speech-card");
    expect(speechProgress?.hidden).toBe(false);
    expect(speechProgress?.getAttribute("aria-busy")).toBe("true");
    expect(speechButton?.disabled).toBe(true);
    expect(speechButton?.textContent).toContain("Azure live");
    expect(speechCard?.getAttribute("aria-busy")).toBe("true");

    speechDeferred.resolve({ transcript: "ciao", translation: "hello" });
    await waitForScripts(window);

    expect(speechProgress?.hidden).toBe(true);
    expect(window.document.querySelector("#provider-speech-result")?.textContent).toContain("Mode: live-microphone-validation");
  });

  it("resets provider speech busy progress after Azure live validation failures", async () => {
    const state = createWizardState();
    state.envValues.TRANSLATION_PROVIDER = "azure";
    const api = createWizardApi(state);
    const speechDeferred = createDeferred<{ transcript: string; translation: string }>();
    api.testProviderSpeech.mockImplementation(() => speechDeferred.promise);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    setValue(window, "#provider-select", "azure");
    await waitForScripts(window);
    setValue(window, "#provider-speech-microphone", "mic-a");
    await waitForScripts(window);
    click(window, "#run-provider-speech-test");
    await waitForScripts(window);

    const speechProgress = window.document.querySelector("#provider-speech-progress") as HTMLDivElement | null;
    const speechButton = window.document.querySelector("#run-provider-speech-test") as HTMLButtonElement | null;
    const speechCard = window.document.querySelector("#provider-speech-card");
    expect(speechProgress?.hidden).toBe(false);
    expect(speechButton?.disabled).toBe(true);

    speechDeferred.reject(new Error("Azure live validation failed."));
    await waitForScripts(window);

    expect(speechProgress?.hidden).toBe(true);
    expect(speechButton?.disabled).toBe(false);
    expect(speechCard?.getAttribute("aria-busy")).toBe("false");
    expect(window.document.querySelector("#status-message")?.textContent).toContain("Azure live validation failed.");
  });

  it("clears stale provider speech state when the setup state changes during a rerender", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    setValue(window, "#provider-speech-microphone", "mic-a");
    await waitForScripts(window);
    click(window, "#run-provider-speech-test");
    await waitForScripts(window);

    expect(window.document.querySelector("#run-provider-speech-test")?.getAttribute("aria-pressed")).toBe("true");
    expect(window.document.querySelector("#provider-speech-notices")?.textContent).toContain(
      "recording a final-turn clip locally"
    );

    await api.assignMicrophone("A", "mic-c");
    await waitForScripts(window);

    expect(window.document.querySelector("#run-provider-speech-test")?.getAttribute("aria-pressed")).toBe("false");
    expect(window.document.querySelector("#provider-speech-result")?.textContent).toBe("");
    expect(window.document.querySelector("#provider-speech-progress")?.getAttribute("aria-busy")).toBe("false");
    expect(window.document.querySelector("#provider-speech-notices")?.textContent).not.toContain(
      "recording a final-turn clip locally"
    );
  });

  it("renders the centralized checklist with explicit missing configuration messages", async () => {
    const state = createWizardState();
    state.displays = state.displays.map((display) => ({ ...display, assignedSide: null }));
    state.microphones = state.microphones.map((microphone) => ({ ...microphone, assignedSides: [] }));
    state.envValues.TRANSLATION_PROVIDER = "";
    state.envValues.CHATGPT_API_KEY = "";
    state.envValues.CHATGPT_MODEL = "";
    state.envValues.CHATGPT_TRANSCRIBE_MODEL = "";

    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const checklistText = dom.window.document.querySelector("#required-config-checklist")?.textContent || "";

    expect(checklistText).toContain("display A is not assigned");
    expect(checklistText).toContain("display B is not assigned");
    expect(checklistText).toContain("microphone A is not assigned");
    expect(checklistText).toContain("microphone B is not assigned");
    expect(checklistText).toContain("provider is not configured");
  });

  it("runs the overlay buttons with real DOM events and updates enabled state", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardOverlayHtml(), api, "http://127.0.0.1/overlay?displayId=101");
    const { window } = dom;

    expect(window.document.querySelector("#overlay-microphone-profile")?.textContent).toContain("2 dedicated microphones");

    click(window, "#assign-b");
    await waitForScripts(window);
    expect(api.assignDisplay).toHaveBeenCalledWith("B", 101);
    expect(window.document.querySelector("#assign-b")?.classList.contains("is-active")).toBe(true);

    setValue(window, "#overlay-microphone-select", "mic-c");
    await waitForScripts(window);
    expect(api.assignMicrophone).toHaveBeenCalledWith("B", "mic-c");

    click(window, "#clear-display");
    await waitForScripts(window);
    expect(api.assignDisplay).toHaveBeenCalledWith(null, 101);

    click(window, "#close-monitor-setup");
    await waitForScripts(window);
    expect(api.closeMonitorSetup).toHaveBeenCalledTimes(1);
  });

  it("re-localizes the overlay chrome when SETUP_UI_LANGUAGE changes during the session", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardOverlayHtml(), api, "http://127.0.0.1/overlay?displayId=101");
    const { window } = dom;

    expect(window.document.querySelector("#close-monitor-setup")?.textContent).toContain("Close display setup");
    expect(window.document.querySelector("#overlay-badge-a")?.textContent).toContain("operator station A");

    api.emitState({
      ...state,
      envValues: {
        ...state.envValues,
        SETUP_UI_LANGUAGE: "fr"
      }
    });
    await waitForScripts(window);

    expect(window.document.querySelector("#close-monitor-setup")?.textContent).toContain("Fermer le setup ecran");
    expect(window.document.querySelector("#overlay-badge-a")?.textContent).toContain("poste operateur A");
    expect(window.document.querySelector("#overlay-microphone-label")?.textContent).toContain("Microphone");
  });
});
