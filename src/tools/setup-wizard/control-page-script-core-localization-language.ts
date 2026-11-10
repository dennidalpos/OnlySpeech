export function getSetupWizardControlCoreLocalizationLanguageScript(): string {
  return `      function normalizeWizardUiLanguage(value) {
        const normalized = String(value || "").trim().toLowerCase();
        if (normalized.startsWith("zh") || normalized.startsWith("yue")) {
          return "zh";
        }
        if (normalized.startsWith("it")) {
          return "it";
        }
        if (normalized.startsWith("es")) {
          return "es";
        }
        if (normalized.startsWith("fr")) {
          return "fr";
        }
        if (normalized.startsWith("de")) {
          return "de";
        }
        return "en";
      }
      function applyLocalizedResources(nextLanguage) {
        wizardUiLanguage = normalizeWizardUiLanguage(nextLanguage);
        copy = copyByLanguage[wizardUiLanguage] || copyByLanguage.en;
        wizardSidePresentation = wizardSidePresentationByLanguage[wizardUiLanguage] || wizardSidePresentationByLanguage.en;
        runtimeDisclosureDefaults = runtimeDisclosureDefaultsByLanguage[wizardUiLanguage] || runtimeDisclosureDefaultsByLanguage.en;
        if (typeof syncLocalizedCopies === "function") {
          syncLocalizedCopies(wizardUiLanguage);
        }
        document.documentElement.lang = wizardUiLanguage;
      }
      function currentWizardShellHtml() {
        return wizardShellByLanguage[wizardUiLanguage] || wizardShellByLanguage.en || "";
      }
      function translateDefaultSample(value, previousLanguage, nextLanguage, sampleKey) {
        const previousDefaults = sampleTextDefaultsByLanguage[previousLanguage] || sampleTextDefaultsByLanguage.en;
        const nextDefaults = sampleTextDefaultsByLanguage[nextLanguage] || sampleTextDefaultsByLanguage.en;
        return value === previousDefaults[sampleKey] ? nextDefaults[sampleKey] : value;
      }
      function providerPlaybackSampleLanguageKey(value) {
        return normalizeWizardUiLanguage(value);
      }
      function defaultProviderPlaybackSampleForLanguage(value) {
        const languageKey = providerPlaybackSampleLanguageKey(value);
        return (sampleTextDefaultsByLanguage[languageKey] || sampleTextDefaultsByLanguage.en).providerPlayback;
      }
      function syncProviderPlaybackSampleForLanguage(previousLanguage, nextLanguage) {
        const ttsTestText = document.getElementById("tts-test-text");
        if (!(ttsTestText instanceof HTMLTextAreaElement)) {
          return;
        }
        const currentText = ttsTestText.value.trim();
        const previousDefault = defaultProviderPlaybackSampleForLanguage(previousLanguage);
        if (currentText && currentText !== previousDefault) {
          return;
        }
        ttsTestText.value = defaultProviderPlaybackSampleForLanguage(nextLanguage);
      }
      function translateDefaultStatus(value, previousLanguage, nextLanguage) {
        const previousDefault = statusDefaultsByLanguage[previousLanguage] || statusDefaultsByLanguage.en;
        const nextDefault = statusDefaultsByLanguage[nextLanguage] || statusDefaultsByLanguage.en;
        return value === previousDefault ? nextDefault : value;
      }
      function captureUiSnapshot(nextLanguage) {
        const previousLanguage = wizardUiLanguage;
        const advancedSettings = document.getElementById("advanced-settings");
        const saveFeedback = document.getElementById("save-feedback");
        return {
          previousLanguage,
          nextLanguage,
          statusMessage: document.getElementById("status-message")?.textContent || "",
          statusTone,
          saveFeedbackText: saveFeedback?.textContent || "",
          saveFeedbackHidden: saveFeedback ? saveFeedback.hidden : true,
          previewText: document.getElementById("env-preview")?.textContent || "",
          providerTestResult: document.getElementById("provider-test-result")?.textContent || "",
          providerSpeechResult: document.getElementById("provider-speech-result")?.textContent || "",
          ttsTestResult: document.getElementById("tts-test-result")?.textContent || "",
          providerTestText: document.getElementById("provider-test-text")?.value || "",
          ttsTestText: document.getElementById("tts-test-text")?.value || "",
          providerTestMode:
            document.querySelector('[data-provider-test-mode].is-active')?.getAttribute("data-provider-test-mode") || "text",
          providerTestSource: document.getElementById("provider-test-source")?.value || "",
          providerTestTarget: document.getElementById("provider-test-target")?.value || "",
          providerSpeechSource: document.getElementById("provider-speech-source")?.value || "",
          providerSpeechTarget: document.getElementById("provider-speech-target")?.value || "",
          providerSpeechMicrophone: document.getElementById("provider-speech-microphone")?.value || "",
          ttsTestLanguage: document.getElementById("tts-test-language")?.value || "",
          advancedOpen: advancedSettings instanceof HTMLDetailsElement ? advancedSettings.open : false
        };
      }
      function setSelectValueIfPresent(elementId, value) {
        const element = document.getElementById(elementId);
        if (!(element instanceof HTMLSelectElement) || !value) {
          return;
        }
        if (Array.from(element.options).some((option) => option.value === value)) {
          element.value = value;
        }
      }
      function applyProviderTestPanelMode(mode) {
        const normalizedMode = mode === "voice" ? "voice" : "text";
        document.querySelectorAll("[data-provider-test-mode]").forEach((button) => {
          const isActive = button.getAttribute("data-provider-test-mode") === normalizedMode;
          button.classList.toggle("is-active", isActive);
          button.setAttribute("aria-pressed", isActive ? "true" : "false");
          button.setAttribute("aria-checked", isActive ? "true" : "false");
        });
        document.querySelectorAll("[data-provider-test-panel]").forEach((panel) => {
          panel.hidden = panel.getAttribute("data-provider-test-panel") !== normalizedMode;
        });
      }
      function restoreUiSnapshot(snapshot) {
        const providerTestText = document.getElementById("provider-test-text");
        if (providerTestText instanceof HTMLTextAreaElement) {
          providerTestText.value = translateDefaultSample(
            snapshot.providerTestText,
            snapshot.previousLanguage,
            snapshot.nextLanguage,
            "providerTranslation"
          );
        }
        const ttsTestText = document.getElementById("tts-test-text");
        if (ttsTestText instanceof HTMLTextAreaElement) {
          ttsTestText.value = translateDefaultSample(
            snapshot.ttsTestText,
            snapshot.previousLanguage,
            snapshot.nextLanguage,
            "providerPlayback"
          );
        }
        setSelectValueIfPresent("provider-test-source", snapshot.providerTestSource);
        setSelectValueIfPresent("provider-test-target", snapshot.providerTestTarget);
        setSelectValueIfPresent("provider-speech-source", snapshot.providerSpeechSource);
        setSelectValueIfPresent("provider-speech-target", snapshot.providerSpeechTarget);
        setSelectValueIfPresent("provider-speech-microphone", snapshot.providerSpeechMicrophone);
        setSelectValueIfPresent("tts-test-language", snapshot.ttsTestLanguage);
        applyProviderTestPanelMode(snapshot.providerTestMode);
        const saveFeedback = document.getElementById("save-feedback");
        if (saveFeedback) {
          saveFeedback.textContent = snapshot.saveFeedbackText;
          saveFeedback.hidden = snapshot.saveFeedbackHidden;
        }
        const envPreview = document.getElementById("env-preview");
        if (envPreview) {
          envPreview.textContent = snapshot.previewText;
        }
        const providerTestResult = document.getElementById("provider-test-result");
        if (providerTestResult) {
          providerTestResult.textContent = snapshot.providerTestResult;
        }
        const providerSpeechResult = document.getElementById("provider-speech-result");
        if (providerSpeechResult) {
          providerSpeechResult.textContent = snapshot.providerSpeechResult;
        }
        const ttsTestResult = document.getElementById("tts-test-result");
        if (ttsTestResult) {
          ttsTestResult.textContent = snapshot.ttsTestResult;
        }
        const advancedSettings = document.getElementById("advanced-settings");
        if (advancedSettings instanceof HTMLDetailsElement) {
          advancedSettings.open = snapshot.advancedOpen;
        }
        if (snapshot.statusMessage) {
          setStatus(
            translateDefaultStatus(snapshot.statusMessage, snapshot.previousLanguage, snapshot.nextLanguage),
            snapshot.statusTone
          );
        }
      }
      function syncWizardUiLanguageControls(nextLanguage = state?.envValues?.SETUP_UI_LANGUAGE || wizardUiLanguage) {
        const normalizedLanguage = normalizeWizardUiLanguage(nextLanguage);
        ["wizard-ui-language-select", "env-SETUP_UI_LANGUAGE"].forEach((elementId) => {
          const select = document.getElementById(elementId);
          if (select instanceof HTMLSelectElement) {
            select.value = normalizedLanguage;
          }
        });
      }
      async function applyWizardUiLanguage(nextLanguage) {
        const normalizedLanguage = normalizeWizardUiLanguage(nextLanguage);
        if (normalizedLanguage === wizardUiLanguage) {
          syncWizardUiLanguageControls(normalizedLanguage);
          return;
        }
        const snapshot = captureUiSnapshot(normalizedLanguage);
        applyLocalizedResources(normalizedLanguage);
        document.body.innerHTML = currentWizardShellHtml();
        const url = new URL(window.location.href);
        url.searchParams.set("uiLanguage", normalizedLanguage);
        window.history.replaceState({}, "", url.toString());
        wireShellEventHandlers();
        render();
        if (typeof renderLicenseSection === "function") {
          renderLicenseSection();
        }
        restoreUiSnapshot(snapshot);
        syncWizardUiLanguageControls(normalizedLanguage);
      }
`;
}
