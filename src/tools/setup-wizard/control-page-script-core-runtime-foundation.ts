import type { SetupWizardControlScriptData } from "./control-page-script.js";

export function getSetupWizardControlCoreRuntimeFoundationScript(data: SetupWizardControlScriptData): string {
  const {
    wizardSidePresentationByLanguage,
    wizardConfigurationIssuesFunction,
    wizardRuntimeProfileFunction,
    sourceLanguageOptionsByProvider,
    chatGptModelOptions,
    chatGptTranscribeModelOptions,
    translationProviders,
    interactionLanguageChoicesByProvider,
    interactionLanguageOptionGroupsByProvider,
    interactionLanguageFlagMarkupByProvider,
    interactionLanguageLabelsByProvider,
    interactionLanguageSupportedCodesByProvider,
    interactionLanguageMacroAreaGroupsByProvider,
    translationTargetOptionGroupsByProvider,
    sourceLocaleByTargetLanguageByProvider,
    runtimeDisclosureDefaultsByLanguage,
    providerLanguageContractModeOptions,
    chatGptTranslationDetectedLanguageModeOptions,
    logLevelOptions,
    initialWizardSection
  } = data;
  return `      function envFields() {
        return [["REQUIRED_MONITORS",copy.envRequiredMonitors],["PTT_RELEASE_GRACE_MS",copy.envPttRelease],["PROVIDER_REQUEST_TIMEOUT_MS",copy.envProviderTimeout],["CHATGPT_SILENCE_RMS_THRESHOLD",copy.envChatGptSilence]];
      }
      const idleDefaults = { IDLE_CLEAR_SECONDS: "60", IDLE_HARD_RESET_SECONDS: "180" };
      function appModeOptions() {
        return [
          { value: "kiosk", label: copy.appModeKiosk },
          { value: "demo", label: copy.appModeDemo }
        ];
      }
      function microphonePttModeOptions() {
        return [
          { value: "dual-dedicated", label: copy.microphoneProfileDedicated },
          { value: "single-shared", label: copy.microphoneProfileShared }
        ];
      }
      const defaultAppMode = "kiosk";
      const defaultMicrophonePttMode = "dual-dedicated";
      const wizardSidePresentationByLanguage = ${wizardSidePresentationByLanguage};
      let wizardSidePresentation = wizardSidePresentationByLanguage[wizardUiLanguage] || wizardSidePresentationByLanguage.en;
      const getWizardConfigurationIssues = ${wizardConfigurationIssuesFunction};
      const getWizardRuntimeProfile = ${wizardRuntimeProfileFunction};
      const sourceLanguageOptionsByProvider = ${sourceLanguageOptionsByProvider};
      const chatGptModelOptions = ${chatGptModelOptions};
      const chatGptTranscribeModelOptions = ${chatGptTranscribeModelOptions};
      const translationProviders = ${translationProviders};
      const runtimeDisclosureDefaultsByLanguage = ${runtimeDisclosureDefaultsByLanguage};
      let runtimeDisclosureDefaults = runtimeDisclosureDefaultsByLanguage[wizardUiLanguage] || runtimeDisclosureDefaultsByLanguage.en;
      function runtimeDisclosureModeOptions() {
        return [
          { value: "standard", label: copy.disclosureStandard },
          { value: "custom", label: copy.disclosureCustom },
          { value: "disabled", label: copy.disclosureDisabled }
        ];
      }
      const interactionLanguageChoicesByProvider = ${interactionLanguageChoicesByProvider};
      const interactionLanguageOptionGroupsByProvider = ${interactionLanguageOptionGroupsByProvider};
      const interactionLanguageFlagMarkupByProvider = ${interactionLanguageFlagMarkupByProvider};
      const interactionLanguageLabelsByProvider = ${interactionLanguageLabelsByProvider};
      const interactionLanguageSupportedCodesByProvider = ${interactionLanguageSupportedCodesByProvider};
      const interactionLanguageMacroAreaGroupsByProvider = ${interactionLanguageMacroAreaGroupsByProvider};
      const translationTargetOptionGroupsByProvider = ${translationTargetOptionGroupsByProvider};
      const sourceLocaleByTargetLanguageByProvider = ${sourceLocaleByTargetLanguageByProvider};
      const providerLanguageContractModeOptions = ${providerLanguageContractModeOptions};
      const chatGptTranslationDetectedLanguageModeOptions = ${chatGptTranslationDetectedLanguageModeOptions};
      const logLevelOptions = ${logLevelOptions};
      const initialWizardSection = ${initialWizardSection};
      const microphoneCategoryOrder = ["usb","analog","bluetooth","hdmi","virtual","network","other"];
      const nonSelectableIds = new Set(["default","communications"]);
      const activeTests = { A: null, B: null };
      const uiActionState = {
        probingMicrophones: false,
        providerTest: false,
        providerSpeech: false,
        saveSection: false,
        saveAndClose: false
      };
      const signalReportThrottleMs = 120;
      const providerSpeechTestState = { recorder: null, stream: null, chunks: [], mimeType: "", activeDeviceId: "", inFlight: false };
      const providerPlaybackTestState = {
        requestId: "",
        playing: false,
        engine: null,
        voiceName: null,
        language: null,
        normalizedText: "",
        requestedLanguage: null
      };
      let azureTextToSpeechCatalog = null;
      let azureTextToSpeechCatalogRequestKey = "";
      let azureTextToSpeechCatalogInFlight = null;
      let monitorSetupSessionActive = false;
      const supportedSections = ["license", "stations", "provider", "languages", "diagnostics", "save"];
      let state = null;
      let statusTone = "info";
      const sectionMap = { monitors: "stations", microphones: "stations", tests: "diagnostics", technical: "diagnostics" };
      let activeSection = sectionMap[initialWizardSection] || (supportedSections.includes(initialWizardSection) ? initialWizardSection : "license");
      let initialSetupMode = false;
      function normalizeBooleanEnv(value, fallback = "false") {
        const normalized = String(value || fallback).trim().toLowerCase();
        return normalized === "true" ? "true" : "false";
      }
      function resolveSupportedAppMode(value) {
        return getWizardRuntimeProfile(value, defaultMicrophonePttMode).appMode;
      }
      function resolveMicrophonePttMode(value) {
        return getWizardRuntimeProfile(defaultAppMode, value).microphonePttMode;
      }
      function runtimeDisclosureMode() {
        const value = String(state?.envValues?.RUNTIME_DISCLOSURE_MODE || "standard").trim().toLowerCase();
        if (value === "custom" || value === "disabled") {
          return value;
        }
        return "standard";
      }
      function runtimeDisclosureCustomText() {
        return String(state?.envValues?.RUNTIME_DISCLOSURE_CUSTOM_TEXT || "").trim();
      }
      function currentRuntimeProfile() {
        return getWizardRuntimeProfile(state?.envValues?.APP_MODE, state?.envValues?.MICROPHONE_PTT_MODE);
      }
      function computeNextEnvValues(values = {}) {
        const nextEnvValues = {
          ...(state?.envValues || {}),
          ...values
        };
        const runtimeProfile = getWizardRuntimeProfile(
          nextEnvValues.APP_MODE,
          nextEnvValues.MICROPHONE_PTT_MODE
        );
        nextEnvValues.APP_MODE = runtimeProfile.appMode;
        nextEnvValues.MICROPHONE_PTT_MODE = runtimeProfile.microphonePttMode;
        nextEnvValues.REQUIRED_MICROPHONES = String(runtimeProfile.requiredMicrophones);
        return nextEnvValues;
      }
      function applyLocalEnvValues(values = {}) {
        if (!state || !values || Object.keys(values).length === 0) {
          return state?.envValues || {};
        }
        state = {
          ...state,
          envValues: computeNextEnvValues(values)
        };
        return state.envValues;
      }
      function syncStateFromApi(nextState) {
        if (!nextState) {
          return state;
        }
        reconcileTransientWizardUi(state, nextState);
        state = nextState;
        initialSetupMode = state.lastSavedEnvPath === null;
        const passwordCard = document.getElementById("wizard-password-setup-card");
        if (passwordCard) {
          passwordCard.hidden = !initialSetupMode;
        }
        return state;
      }
      function runtimeMode() {
        return currentRuntimeProfile().appMode;
      }
      function microphonePttMode() {
        return currentRuntimeProfile().microphonePttMode;
      }
      function requiredMicrophones() {
        return currentRuntimeProfile().requiredMicrophones;
      }
      function normalizedRuntimeEnvPatch(appModeValue, microphonePttModeValue) {
        const normalized = getWizardRuntimeProfile(appModeValue, microphonePttModeValue);
        return {
          APP_MODE: normalized.appMode,
          MICROPHONE_PTT_MODE: normalized.microphonePttMode,
          REQUIRED_MICROPHONES: String(normalized.requiredMicrophones)
        };
      }
      function booleanOptionsHtml(selectedValue) {
        const normalized = normalizeBooleanEnv(selectedValue, "false");
        return [
          '<option value="false"' + (normalized === "false" ? " selected" : "") + '>' + escapeHtml(copy.booleanDisabled) + '</option>',
          '<option value="true"' + (normalized === "true" ? " selected" : "") + '>' + escapeHtml(copy.booleanEnabled) + '</option>'
        ].join("");
      }
      function isEnabledBySeconds(value) {
        return Number(value || "0") > 0;
      }
      function currentAudioCaptureConstraints(deviceId) {
        const audio = {
          echoCancellation: normalizeBooleanEnv(state.envValues.AUDIO_ECHO_CANCELLATION, "true") === "true",
          noiseSuppression: normalizeBooleanEnv(state.envValues.AUDIO_NOISE_SUPPRESSION, "true") === "true"
        };
        if (deviceId) {
          audio.deviceId = { exact: deviceId };
        }
        return audio;
      }
      function escapeHtml(value) {
        return String(value)
          .replace(/&/g,"&amp;")
          .replace(/</g,"&lt;")
          .replace(/>/g,"&gt;")
          .replace(/"/g,"&quot;")
          .replace(/'/g,"&#39;");
      }
      function disclosureParagraphsFromText(value) {
        return String(value || "")
          .split(/\\r?\\n+/)
          .map((paragraph) => paragraph.trim())
          .filter((paragraph) => paragraph.length > 0);
      }
      function currentRuntimeDisclosurePreview() {
        const mode = runtimeDisclosureMode();
        if (mode === "disabled") {
          return null;
        }
        const customParagraphs = mode === "custom"
          ? disclosureParagraphsFromText(runtimeDisclosureCustomText())
          : [];
        return {
          title: runtimeDisclosureDefaults.title,
          paragraphs: customParagraphs.length > 0 ? customParagraphs : runtimeDisclosureDefaults.paragraphs
        };
      }
      function runtimeDisclosureModeLabel(mode) {
        switch (mode) {
          case "custom":
            return copy.disclosureCustom;
          case "disabled":
            return copy.disclosureDisabledLabel;
          default:
            return copy.disclosureStandard;
        }
      }
      function setStatus(message, tone = "info") {
        statusTone = tone;
        const element = document.getElementById("status-message");
        if (!element) {
          return;
        }
        element.className = "notice " + tone;
        element.textContent = message;
        element.hidden = !message;
      }
      async function runAction(action, successMessage, errorPrefix) {
        try {
          const result = await action();
          if (successMessage) {
            setStatus(successMessage, "info");
          }
          return result;
        } catch (error) {
          const message = error && error.message ? error.message : String(error);
          setStatus(errorPrefix + ": " + message, "error");
          throw error;
        }
      }
      function isActionBusy(actionKey) {
        return Boolean(uiActionState[actionKey]);
      }
      function anyActionBusy(actionKeys) {
        return actionKeys.some((actionKey) => isActionBusy(actionKey));
      }
      function setUiActionState(actionKey, isBusy) {
        if (!Object.prototype.hasOwnProperty.call(uiActionState, actionKey)) {
          return;
        }
        uiActionState[actionKey] = Boolean(isBusy);
        renderAsyncUi();
        if (actionKey === "probingMicrophones" && typeof renderMicrophoneNotices === "function") {
          renderMicrophoneNotices();
        }
        if (
          (actionKey === "providerTest" || actionKey === "providerSpeech") &&
          typeof renderProviderSpeechNotices === "function"
        ) {
          renderProviderSpeechNotices();
        }
      }
      function resetUiActionState(actionKeys) {
        const keys = Array.isArray(actionKeys) && actionKeys.length > 0
          ? actionKeys
          : Object.keys(uiActionState);
        let changed = false;
        keys.forEach((actionKey) => {
          if (!Object.prototype.hasOwnProperty.call(uiActionState, actionKey) || !uiActionState[actionKey]) {
            return;
          }
          uiActionState[actionKey] = false;
          changed = true;
        });
        if (changed) {
          renderAsyncUi();
        }
      }
      async function withUiActionState(actionKey, action) {
        setUiActionState(actionKey, true);
        try {
          return await action();
        } finally {
          setUiActionState(actionKey, false);
        }
      }
      function setNoticeState(elementId, notice) {
        const element = document.getElementById(elementId);
        if (!(element instanceof HTMLElement)) {
          return;
        }
        if (!notice || !notice.message) {
          element.textContent = "";
          element.className = "notice";
          element.hidden = true;
          return;
        }
        element.textContent = notice.message;
        element.className = "notice " + (notice.tone || "warn");
        element.hidden = false;
      }
      function updateButtonState(buttonId, options = {}) {
        const button = document.getElementById(buttonId);
        const disabled = Boolean(options.disabled);
        const disabledReasonCode = disabled ? String(options.disabledReasonCode || "").trim() : "";
        const disabledReasonText = disabled ? String(options.disabledReasonText || "").trim() : "";
        const disabledReasonNoticeId = String(options.disabledReasonNoticeId || "").trim();
        if (!(button instanceof HTMLButtonElement)) {
          if (disabledReasonNoticeId) {
            setNoticeState(disabledReasonNoticeId, null);
          }
          return;
        }
        const busy = Boolean(options.busy);
        button.disabled = disabled;
        button.classList.toggle("is-busy", busy);
        button.classList.toggle("is-active", Boolean(options.active));
        button.setAttribute("aria-busy", busy ? "true" : "false");
        if (disabledReasonCode) {
          button.setAttribute("data-disabled-reason", disabledReasonCode);
        } else {
          button.removeAttribute("data-disabled-reason");
        }
        if (disabledReasonNoticeId) {
          setNoticeState(
            disabledReasonNoticeId,
            disabledReasonText
              ? { message: disabledReasonText, tone: options.disabledReasonTone || "warn" }
              : null
          );
          if (disabledReasonText) {
            button.setAttribute("aria-describedby", disabledReasonNoticeId);
          } else if (button.getAttribute("aria-describedby") === disabledReasonNoticeId) {
            button.removeAttribute("aria-describedby");
          }
        }
        if (typeof options.ariaPressed === "boolean") {
          button.setAttribute("aria-pressed", options.ariaPressed ? "true" : "false");
        } else if (button.hasAttribute("aria-pressed")) {
          button.removeAttribute("aria-pressed");
        }
        if (busy && options.busyText) {
          button.textContent = options.busyText;
          return;
        }
        if (options.idleText) {
          button.textContent = options.idleText;
        }
      }
      function setBusyRegion(prefix, options = {}) {
        const region = document.getElementById(prefix + "-progress");
        if (!(region instanceof HTMLElement)) {
          return;
        }
        const busy = Boolean(options.busy);
        region.hidden = !busy;
        region.setAttribute("aria-busy", busy ? "true" : "false");
        const label = document.getElementById(prefix + "-progress-label");
        const detail = document.getElementById(prefix + "-progress-detail");
        if (label) {
          label.textContent = options.label || "";
        }
        if (detail) {
          detail.textContent = options.detail || "";
        }
      }
      function setElementBusy(elementId, busy) {
        const element = document.getElementById(elementId);
        if (element) {
          element.setAttribute("aria-busy", busy ? "true" : "false");
        }
      }
      function assignedMicrophoneDeviceId(currentState, side) {
        return currentState?.microphones?.find((microphone) => microphone.assignedSides.includes(side))?.deviceId || "";
      }
      function buildSetupStateSignature(currentState) {
        if (!currentState) {
          return "";
        }
        return JSON.stringify({
          provider: (currentState.envValues.TRANSLATION_PROVIDER || "").trim(),
          runtimeMode: resolveSupportedAppMode(currentState.envValues.APP_MODE),
          microphonePttMode: resolveMicrophonePttMode(currentState.envValues.MICROPHONE_PTT_MODE),
          displayAId: currentState.envValues.DISPLAY_A_ID || "",
          displayBId: currentState.envValues.DISPLAY_B_ID || "",
          micAId: currentState.envValues.MIC_A_ID || "",
          micBId: currentState.envValues.MIC_B_ID || "",
          assignedMicA: assignedMicrophoneDeviceId(currentState, "A"),
          assignedMicB: assignedMicrophoneDeviceId(currentState, "B"),
          microphoneCount: currentState.microphones?.length || 0,
          microphonePermissionGranted: Boolean(currentState.microphonePermissionGranted)
        });
      }
      function clearTransientResultPanels() {
        ["provider-test-result", "provider-speech-result"].forEach((elementId) => {
          const element = document.getElementById(elementId);
          if (element) {
            element.textContent = "";
          }
        });
      }
      function selectedDisplay(side) {
        return state.displays.find((item) => item.assignedSide === side) || null;
      }
      function selectedDisplayId(side) {
        const display = selectedDisplay(side);
        return display ? String(display.displayId) : "";
      }
      function selectedMicrophone(side) {
        return state.microphones.find((item) => item.assignedSides.includes(side)) || null;
      }
      function microphoneDisplayName(microphone) {
        return microphone?.displayLabel || microphone?.label || copy.unnamedMicrophone;
      }
      function normalizeMicrophoneLabel(value) {
        return String(value || "")
          .trim()
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[\\u0300-\\u036f]/g, "")
          .replace(/[()]/g, " ")
          .replace(/[^a-z0-9]+/g, " ")
          .replace(/\\b(?:audio|device|input|capture|endpoint)\\b/g, " ")
          .replace(/\\s+/g, " ")
          .trim();
      }
      function microphoneRole(microphone) {
        return microphone?.audioInputRole || "generic-input";
      }
      function parsePersistedEndpointId(configuredValue) {
        if (!configuredValue || !configuredValue.startsWith("endpoint:")) {
          return null;
        }
        const parts = configuredValue.slice("endpoint:".length).split(":");
        if (parts.length !== 2 && parts.length !== 3) {
          return null;
        }
        try {
          if (parts.length === 2) {
            return {
              groupId: null,
              role: decodeURIComponent(parts[0]),
              normalizedLabel: decodeURIComponent(parts[1])
            };
          }
          return {
            groupId: decodeURIComponent(parts[0]),
            role: decodeURIComponent(parts[1]),
            normalizedLabel: decodeURIComponent(parts[2])
          };
        } catch {
          return null;
        }
      }
      function parsePersistedLabelId(configuredValue) {
        if (!configuredValue || !configuredValue.startsWith("label:")) {
          return null;
        }
        try {
          return decodeURIComponent(configuredValue.slice("label:".length));
        } catch {
          return null;
        }
      }
      function configuredMicrophoneId(side) {
        return side === "A" ? (state.envValues.MIC_A_ID || "").trim() : (state.envValues.MIC_B_ID || "").trim();
      }
      function matchesConfiguredMicrophone(microphone, configuredValue) {
        if (!configuredValue) {
          return false;
        }
        if (microphone.deviceId === configuredValue || microphone.label === configuredValue) {
          return true;
        }
        const endpoint = parsePersistedEndpointId(configuredValue);
        if (endpoint) {
          return Boolean(
            (!endpoint.groupId || (microphone.groupId && microphone.groupId === endpoint.groupId)) &&
            microphoneRole(microphone) === endpoint.role &&
            normalizeMicrophoneLabel(microphone.label) === endpoint.normalizedLabel
          );
        }
        const labelId = parsePersistedLabelId(configuredValue);
        if (labelId) {
          return normalizeMicrophoneLabel(microphone.label) === labelId;
        }
        return microphone.groupId && configuredValue === "group:" + microphone.groupId;
      }
      function findConfiguredMicrophone(side) {
        const configuredValue = configuredMicrophoneId(side);
        if (!configuredValue) {
          return null;
        }
        const directMatch = state.microphones.find((microphone) => matchesConfiguredMicrophone(microphone, configuredValue));
        if (directMatch) {
          return directMatch;
        }
        const endpoint = parsePersistedEndpointId(configuredValue);
        if (endpoint) {
          if (endpoint.groupId) {
            const sameGroup = state.microphones.filter((microphone) => microphone.groupId === endpoint.groupId);
            const sameGroupRole = sameGroup.filter((microphone) => microphoneRole(microphone) === endpoint.role);
            if (sameGroupRole.length === 1) {
              return sameGroupRole[0];
            }
            if (sameGroup.length === 1) {
              return sameGroup[0];
            }
          }
          const sameRoleAndLabel = state.microphones.filter(
            (microphone) =>
              microphoneRole(microphone) === endpoint.role &&
              normalizeMicrophoneLabel(microphone.label) === endpoint.normalizedLabel
          );
          if (sameRoleAndLabel.length === 1) {
            return sameRoleAndLabel[0];
          }
          const sameNormalizedLabel = state.microphones.filter(
            (microphone) => normalizeMicrophoneLabel(microphone.label) === endpoint.normalizedLabel
          );
          if (sameNormalizedLabel.length === 1) {
            return sameNormalizedLabel[0];
          }
          const sameRole = state.microphones.filter((microphone) => microphoneRole(microphone) === endpoint.role);
          if (sameRole.length === 1) {
            return sameRole[0];
          }
        }
        const labelId = parsePersistedLabelId(configuredValue);
        if (labelId) {
          const matches = state.microphones.filter((microphone) => normalizeMicrophoneLabel(microphone.label) === labelId);
          if (matches.length === 1) {
            return matches[0];
          }
        }
        if (configuredValue.startsWith("group:")) {
          const groupId = configuredValue.slice("group:".length);
          const matches = state.microphones.filter((microphone) => microphone.groupId && microphone.groupId === groupId);
          if (matches.length === 1) {
            return matches[0];
          }
        }
        return null;
      }
      function sidePresentation(side) {
        return wizardSidePresentation[side];
      }
`;
}

