export function getSetupWizardControlActionsScript(): string {
  return `      const actionsCopyByLanguage = {
        it: {
            microphoneTestStopped: "Test microfono lato {side} fermato.",
            selectMicrophoneForSideFirst: "Seleziona prima un microfono per il lato {side}.",
            microphoneTestStarted: "Test microfono lato {side} avviato.",
            unableStartMicrophoneTest: "Impossibile avviare il test microfono per il lato {side}: {detail}",
            mediaDevicesUnavailable: "MediaDevices non e' disponibile in questa finestra Electron.",
            mediaDevicesApiUnavailable: "API MediaDevices non disponibile",
            unnamedMicrophone: "Microfono senza nome",
            detectedMicrophones: "Microfoni rilevati: {count}.",
            noSelectableMicrophonesDetected: "Nessun microfono selezionabile rilevato.",
            microphonePermissionNotGranted: "Permesso microfono non concesso. Dispositivi visibili senza accesso completo: {count}.",
            unableDetectMicrophones: "Impossibile rilevare i microfoni: {detail}",
            environmentSavedAndApplied: "File ambiente salvato e applicato all'app in esecuzione.",
            unableSaveEnvironment: "Impossibile salvare il file ambiente",
            fileWrittenAndApplied: "File scritto in {path} e configurazione applicata immediatamente.",
            fileWrittenSecureAndApplied: "File scritto in {path}, credenziali provider archiviate nello storage sicuro di Windows e configurazione applicata immediatamente.",
            autostartEnabled: "Avvio automatico attivato.",
            autostartDisabled: "Avvio automatico disattivato.",
            autostartUpdateFailed: "Impossibile aggiornare l'avvio automatico",
            temporaryPassword: "Password temporanea setup: {password}.",
            saveBlockedInitialLanguages: "Salvataggio bloccato: le lingue iniziali selezionate non sono valide per il catalogo condiviso attivo ({detail}).",
            saveBlockedProviderConfiguration: "Salvataggio bloccato: completa il provider selezionato e le relative credenziali runtime ({detail}).",
            saveBlockedAzureTextToSpeech: "Salvataggio bloccato: completa la copertura Azure TTS per le lingue iniziali A/B ({detail}).",
            saveBlockedPassword: "Salvataggio bloccato: configura la password del wizard ({detail}).",
            configurationAppliedClosing: "Configurazione applicata. Chiusura setup wizard.",
            providerTestInProgress: "Test provider in corso...",
            providerTestCompleted: "Test provider completato.",
            providerTestFailed: "Test provider fallito",
            providerLabel: "Provider",
            modeLabel: "Modalita",
            sourceLabel: "Sorgente",
            targetLabel: "Target",
            noOutputReturned: "(nessun output restituito)",
            selectMicrophoneForProviderSpeechTest: "Seleziona un microfono per il test provider vocale.",
            azureListeningSelectedMicrophone: "Azure Speech e' in ascolto sul microfono selezionato.",
            providerSpeechUnsupported: "Ollama non supporta test vocali live in OnlySpeech.",
            providerSpeechTestCompleted: "Test provider vocale completato.",
            providerSpeechTestFailed: "Test provider vocale fallito",
            microphoneLabel: "Microfono",
            liveMicrophoneValidationMode: "validazione-microfono-live",
            finalTurnOnlyMode: "solo-turno-finale",
            transcriptLabel: "Trascrizione",
            noTranscript: "(nessuna trascrizione)",
            translationLabel: "Traduzione",
            noTranslation: "(nessuna traduzione)",
            uploadingAudioToProvider: "Caricamento audio al provider...",
            mediaRecorderIncompatible: "MediaRecorder non supporta un formato audio compatibile.",
            recordingChatGptFinalTurn: "Registrazione audio final-turn ChatGPT. Premi di nuovo per fermare e inviare.",
            finalTurnRecordingStarted: "Registrazione provider final-turn avviata.",
            engineLabel: "Motore",
            languageLabel: "Lingua",
            voiceLabel: "Voce",
            notAvailable: "(non disponibile)",
            providerPlaybackStarted: "Riproduzione avviata tramite backend vocale del provider attivo.",
            providerPlaybackCompleted: "Test riproduzione provider completato.",
            providerPlaybackStopped: "Test riproduzione provider fermato.",
            providerPlaybackUnavailable: "Il test di riproduzione provider non e' disponibile.",
            enterSampleTextForPlayback: "Inserisci un testo di esempio per il test di riproduzione provider.",
            startingProviderPlayback: "Avvio test riproduzione provider...",
            providerPlaybackStartedStatus: "Test riproduzione provider avviato.",
            providerPlaybackFailed: "Test riproduzione provider fallito",
            nextStep: "Avanti",
            pwdRequired: "La password del setup wizard è obbligatoria.",
            pwdTooShort: "La password deve contenere almeno 12 caratteri.",
            pwdMismatch: "Le password non coincidono.",
            licenseRequiredToProceed: "Attiva una licenza o la prova gratuita per procedere."
          },
        en: {
            microphoneTestStopped: "Microphone test for side {side} stopped.",
            selectMicrophoneForSideFirst: "Select a microphone for side {side} first.",
            microphoneTestStarted: "Microphone test for side {side} started.",
            unableStartMicrophoneTest: "Unable to start microphone test for side {side}: {detail}",
            mediaDevicesUnavailable: "MediaDevices is unavailable in this Electron window.",
            mediaDevicesApiUnavailable: "MediaDevices API unavailable",
            unnamedMicrophone: "Unnamed microphone",
            detectedMicrophones: "Detected microphones: {count}.",
            noSelectableMicrophonesDetected: "No selectable microphones detected.",
            microphonePermissionNotGranted: "Microphone permission was not granted. Visible devices without full access: {count}.",
            unableDetectMicrophones: "Unable to detect microphones: {detail}",
            environmentSavedAndApplied: "Environment file saved and applied to the running app.",
            unableSaveEnvironment: "Unable to save the environment file",
            fileWrittenAndApplied: "File written to {path} and configuration applied immediately.",
            fileWrittenSecureAndApplied: "File written to {path}, provider credentials stored in Windows secure storage, and configuration applied immediately.",
            autostartEnabled: "Automatic startup enabled.",
            autostartDisabled: "Automatic startup disabled.",
            autostartUpdateFailed: "Unable to update automatic startup",
            temporaryPassword: "Temporary setup password: {password}.",
            saveBlockedInitialLanguages: "Save blocked: the selected initial languages are not valid for the active provider language registry ({detail}).",
            saveBlockedProviderConfiguration: "Save blocked: complete the selected provider and its runtime credentials ({detail}).",
            saveBlockedAzureTextToSpeech: "Save blocked: complete Azure TTS coverage for the initial A/B languages ({detail}).",
            saveBlockedPassword: "Save blocked: configure the setup wizard password ({detail}).",
            configurationAppliedClosing: "Configuration applied. Closing setup wizard.",
            providerTestInProgress: "Provider test in progress...",
            providerTestCompleted: "Provider test completed.",
            providerTestFailed: "Provider test failed",
            providerLabel: "Provider",
            modeLabel: "Mode",
            sourceLabel: "Source",
            targetLabel: "Target",
            noOutputReturned: "(no output returned)",
            selectMicrophoneForProviderSpeechTest: "Select a microphone for the provider speech test.",
            azureListeningSelectedMicrophone: "Azure Speech is listening on the selected microphone.",
            providerSpeechUnsupported: "Ollama does not support live speech tests in OnlySpeech.",
            providerSpeechTestCompleted: "Provider speech test completed.",
            providerSpeechTestFailed: "Provider speech test failed",
            microphoneLabel: "Microphone",
            liveMicrophoneValidationMode: "live-microphone-validation",
            finalTurnOnlyMode: "final-turn-only",
            transcriptLabel: "Transcript",
            noTranscript: "(no transcript)",
            translationLabel: "Translation",
            noTranslation: "(no translation)",
            uploadingAudioToProvider: "Uploading audio to the provider...",
            mediaRecorderIncompatible: "MediaRecorder does not support a compatible audio format.",
            recordingChatGptFinalTurn: "Recording ChatGPT final-turn audio. Press again to stop and upload.",
            finalTurnRecordingStarted: "Final-turn provider recording started.",
            engineLabel: "Engine",
            languageLabel: "Language",
            voiceLabel: "Voice",
            notAvailable: "(not available)",
            providerPlaybackStarted: "Playback started through the active provider-owned speech backend.",
            providerPlaybackCompleted: "Provider playback test completed.",
            providerPlaybackStopped: "Provider playback test stopped.",
            providerPlaybackUnavailable: "Provider playback test is unavailable.",
            enterSampleTextForPlayback: "Enter sample text for the provider playback test.",
            startingProviderPlayback: "Starting provider playback test...",
            providerPlaybackStartedStatus: "Provider playback test started.",
            providerPlaybackFailed: "Provider playback test failed",
            nextStep: "Next",
            pwdRequired: "The setup wizard password is required.",
            pwdTooShort: "The password must be at least 12 characters long.",
            pwdMismatch: "Passwords do not match.",
            licenseRequiredToProceed: "Activate a license or start the trial to proceed."
          }
      };
      let actionsCopy = actionsCopyByLanguage[wizardUiLanguage] || actionsCopyByLanguage.en;
      const supplierContactMessage =
        "No active license remains on this workstation. Contact your OnlySpeech supplier to continue. The application will now close.";
      function setDiagnosticSummary(elementId, message, tone = "info") {
        const element = document.getElementById(elementId);
        if (!element) {
          return;
        }
        element.className = "notice " + tone + " top-gap";
        element.textContent = message;
      }
      async function refreshPreview(options = {}) {
        const performRefresh = async () => {
          document.getElementById("env-preview").textContent = await api.previewEnv();
        };
        if (options.showBusy) {
          await withUiActionState("preview", performRefresh);
          return;
        }
        await performRefresh();
      }
      async function stopMicTest(side) {
        const running = activeTests[side];
        if (!running) {
          await api.updateSignalLevel(side, 0);
          return;
        }
        running.stopping = true;
        renderMicrophoneTests();
        cancelAnimationFrame(running.rafId);
        running.stopped = true;
        running.stream.getTracks().forEach((track) => track.stop());
        try {
          await running.audioContext.close();
        } catch {}
        activeTests[side] = null;
        document.getElementById("microphone-meter-" + side).style.width = "0%";
        const signal = document.getElementById("microphone-signal-" + side);
        if (signal) { signal.setAttribute("aria-valuenow", "0"); }
        await api.updateSignalLevel(side, 0);
        renderMicrophoneTests();
        setStatus(formatCopy(actionsCopy.microphoneTestStopped, { side }), "info");
      }
      async function startMicTest(side) {
        const microphone = selectedMicrophone(side);
        if (!microphone) {
          setStatus(formatCopy(actionsCopy.selectMicrophoneForSideFirst, { side }), "warn");
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: currentAudioCaptureConstraints(microphone.deviceId), video: false });
          const audioContext = new AudioContext();
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 1024;
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          const samples = new Float32Array(analyser.fftSize);
          const testState = {
            stream,
            audioContext,
            analyser,
            rafId: 0,
            stopping: false,
            stopped: false,
            lastReportedAt: 0,
            lastReportedLevel: -1
          };
          const tick = () => {
            if (!activeTests[side] || activeTests[side] !== testState || testState.stopped) {
              return;
            }
            analyser.getFloatTimeDomainData(samples);
            let sum = 0;
            for (const sample of samples) { sum += sample * sample; }
            const level = Math.max(0, Math.min(1, Math.sqrt(sum / samples.length) * 5));
            const meter = document.getElementById("microphone-meter-" + side);
            if (meter) {
              meter.style.width = Math.round(level * 100) + "%";
            }
            const now = Date.now();
            if (
              now - testState.lastReportedAt >= signalReportThrottleMs &&
              Math.abs(level - testState.lastReportedLevel) >= 0.03
            ) {
              testState.lastReportedAt = now;
              testState.lastReportedLevel = level;
              void api.updateSignalLevel(side, level);
            }
            testState.rafId = requestAnimationFrame(tick);
          };
          activeTests[side] = testState;
          testState.rafId = requestAnimationFrame(tick);
          renderMicrophoneTests();
          setStatus(formatCopy(actionsCopy.microphoneTestStarted, { side }), "info");
        } catch (error) {
          setStatus(formatCopy(actionsCopy.unableStartMicrophoneTest, { side, detail: error?.message || String(error) }), "error");
        }
      }
      async function probeMicrophones() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          setStatus(actionsCopy.mediaDevicesUnavailable, "error");
          await api.updateMicrophones({ microphones: [], microphonePermissionGranted: false, microphoneError: actionsCopy.mediaDevicesApiUnavailable });
          return;
        }
        await withUiActionState("probingMicrophones", async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            stream.getTracks().forEach((track) => track.stop());
            const microphones = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "audioinput").map((device) => ({ deviceId: device.deviceId, groupId: device.groupId, label: device.label || actionsCopy.unnamedMicrophone })).filter((device) => !nonSelectableIds.has(device.deviceId));
            await api.updateMicrophones({ microphones, microphonePermissionGranted: true, microphoneError: null });
            setStatus(microphones.length > 0 ? formatCopy(actionsCopy.detectedMicrophones, { count: microphones.length }) : actionsCopy.noSelectableMicrophonesDetected, microphones.length > 0 ? "info" : "warn");
          } catch (error) {
            try {
              const fallback = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "audioinput").map((device) => ({ deviceId: device.deviceId, groupId: device.groupId, label: device.label || actionsCopy.unnamedMicrophone })).filter((device) => !nonSelectableIds.has(device.deviceId));
              await api.updateMicrophones({ microphones: fallback, microphonePermissionGranted: false, microphoneError: error?.message || String(error) });
              setStatus(formatCopy(actionsCopy.microphonePermissionNotGranted, { count: fallback.length }), "warn");
            } catch (enumerateError) {
              await api.updateMicrophones({ microphones: [], microphonePermissionGranted: false, microphoneError: error?.message || String(error) });
              setStatus(formatCopy(actionsCopy.unableDetectMicrophones, { detail: enumerateError?.message || error?.message || String(error) }), "error");
            }
          }
        });
      }
      async function autoApplySingleMicrophoneIfNeeded() {
        if (
          !state ||
          state.microphones.length !== 1 ||
          microphonePttMode() !== "dual-dedicated" ||
          runtimeMode() === "demo"
        ) {
          return;
        }
        const singleMic = state.microphones[0];
        await persistEnvValuePatch(normalizedRuntimeEnvPatch(runtimeMode(), "single-shared"));
        syncStateFromApi(await api.assignMicrophone("A", singleMic.deviceId));
        syncStateFromApi(await api.assignMicrophone("B", singleMic.deviceId));
      }
      async function proceedToNextSection(currentSection) {
        const flushResult = flushPendingEnvValues();
        if (flushResult && typeof flushResult.then === "function") {
          await flushResult;
        }
        if (currentSection === "license") {
          const hasLicense = licenseInfo !== null && !licenseInfo.isExpired;
          if (!hasLicense) {
            setStatus(actionsCopy.licenseRequiredToProceed, "error");
            return;
          }
        }
        if (currentSection === "stations") {
          const issues = currentConfigurationIssues().filter((issue) => 
            issue.code.startsWith("missing-display") || issue.code.startsWith("missing-microphone") || issue.code === "distinct-microphones-required"
          );
          if (issues.length > 0) {
            const localized = localizeWizardIssue(issues[0]);
            setStatus(localized.message + (localized.detail ? ": " + localized.detail : ""), "error");
            return;
          }
        }
        if (currentSection === "provider") {
          const issues = currentConfigurationIssues().filter((issue) =>
            issue.code === "unsupported-provider" || issue.code === "missing-provider-credentials"
          );
          if (issues.length > 0) {
            const localized = localizeWizardIssue(issues[0]);
            setStatus(localized.message + (localized.detail ? ": " + localized.detail : ""), "error");
            return;
          }
        }
        if (currentSection === "languages") {
          const issues = currentConfigurationIssues().filter((issue) =>
            issue.code.startsWith("unsupported-target-language-") || issue.code.startsWith("unresolved-target-tts-")
          );
          if (issues.length > 0) {
            const localized = localizeWizardIssue(issues[0]);
            setStatus(localized.message + (localized.detail ? ": " + localized.detail : ""), "error");
            return;
          }
        }
        const currentIndex = supportedSections.indexOf(currentSection);
        if (currentIndex !== -1 && currentIndex < supportedSections.length - 1) {
          const nextSection = supportedSections[currentIndex + 1];
          setActiveSection(nextSection);
          setStatus("", "info");
        }
      }
      async function persistEnv(actionKey, wizardPassword = "") {
        const payload = wizardPassword ? { wizardPassword } : undefined;
        const result = await withUiActionState(actionKey, () => runAction(
          () => api.saveEnv(payload),
          actionsCopy.environmentSavedAndApplied,
          actionsCopy.unableSaveEnvironment
        ));
        let feedbackMessage = result.secretStorageMode === "windows-secure-store"
          ? formatCopy(actionsCopy.fileWrittenSecureAndApplied, { path: result.envPath })
          : formatCopy(actionsCopy.fileWrittenAndApplied, { path: result.envPath });
        if (result.autostartSupported) {
          feedbackMessage += " " + (result.autostartEnabled ? actionsCopy.autostartEnabled : actionsCopy.autostartDisabled);
        }
        if (result.temporaryWizardPassword) {
          feedbackMessage += " " + formatCopy(actionsCopy.temporaryPassword, { password: result.temporaryWizardPassword });
        }
        return {
          ...result,
          feedbackMessage
        };
      }
      function updateSaveFeedback(feedbackMessage, previewText) {
        const saveFeedback = document.getElementById("save-feedback");
        if (saveFeedback) {
          saveFeedback.textContent = feedbackMessage;
          saveFeedback.hidden = false;
        }
        const envPreview = document.getElementById("env-preview");
        if (envPreview) {
          envPreview.textContent = previewText;
        }
      }
      function sectionNavigationLabel(sectionId) {
        return document.querySelector('[data-section="' + sectionId + '"]')?.textContent?.trim() || "";
      }
      function buildSaveBlockingMessage(blockingIssues) {
        const detail = blockingIssues.map((issue) => issue.detail || issue.message).join(", ");
        if (blockingIssues.some((issue) =>
          issue.code === "missing-wizard-password" ||
          issue.code === "wizard-password-too-short" ||
          issue.code === "wizard-password-mismatch"
        )) {
          return formatCopy(actionsCopy.saveBlockedPassword, { detail });
        }
        return blockingIssues.some(
          (issue) => issue.code === "unsupported-provider" || issue.code === "missing-provider-credentials"
        )
          ? formatCopy(actionsCopy.saveBlockedProviderConfiguration, { detail })
          : blockingIssues.some(
              (issue) => issue.code === "azure-tts-catalog-unavailable" || issue.code.startsWith("unresolved-target-tts-")
            )
          ? formatCopy(actionsCopy.saveBlockedAzureTextToSpeech, { detail })
          : formatCopy(actionsCopy.saveBlockedInitialLanguages, { detail });
      }
      async function saveWizardConfiguration(options = {}) {
        const {
          actionKey = "saveSection",
          closeWizard = false,
          sectionId = null
        } = options;
        const flushResult = flushPendingEnvValues();
        if (flushResult && typeof flushResult.then === "function") {
          await flushResult;
        }
        let wizardPassword = "";
        if (initialSetupMode) {
          const pwdInput = document.getElementById("wizard-password");
          const confirmInput = document.getElementById("wizard-confirm-password");
          const pwd = pwdInput ? pwdInput.value.trim() : "";
          const confirm = confirmInput ? confirmInput.value.trim() : "";
          if (!pwd) {
            setStatus(actionsCopy.pwdRequired, "error");
            pwdInput?.focus();
            return false;
          }
          if (pwd.length < 12) {
            setStatus(actionsCopy.pwdTooShort, "error");
            pwdInput?.focus();
            return false;
          }
          if (pwd !== confirm) {
            setStatus(actionsCopy.pwdMismatch, "error");
            confirmInput?.focus();
            return false;
          }
          wizardPassword = pwd;
        }
        const blockingIssues = saveBlockingIssues();
        if (blockingIssues.length > 0) {
          const firstIssueTarget = issueSectionAndFieldId(blockingIssues[0].code);
          setStatus(buildSaveBlockingMessage(blockingIssues), "error");
          setActiveSection(firstIssueTarget.section, { scroll: true, focus: false });
          return false;
        }
        const result = await persistEnv(actionKey, wizardPassword);
        const sectionLabel = sectionId ? sectionNavigationLabel(sectionId) : "";
        const feedbackMessage = sectionLabel
          ? sectionLabel + ": " + result.feedbackMessage
          : result.feedbackMessage;
        updateSaveFeedback(feedbackMessage, result.preview);
        if (sectionLabel && !closeWizard) {
          setStatus(sectionLabel + ": " + actionsCopy.environmentSavedAndApplied, "info");
        }
        if (!closeWizard) {
          return true;
        }
        const persistedLicense = await api.getLicenseState();
        const trialAvailability = await api.getTrialAvailability();
        if (!persistedLicense && !trialAvailability.eligible) {
          updateSaveFeedback(supplierContactMessage, result.preview);
          setStatus(supplierContactMessage, "warn");
          await api.terminateApplication();
          return false;
        }
        setStatus(actionsCopy.configurationAppliedClosing, "info");
        api.closeWizard();
        return result;
      }
      async function saveWizardSection(sectionId) {
        if (initialSetupMode) {
          await proceedToNextSection(sectionId);
          return true;
        }
        return saveWizardConfiguration({ actionKey: "saveSection", sectionId, closeWizard: false });
      }
      async function saveEnvAndCloseWizard() {
        await saveWizardConfiguration({ actionKey: "saveAndClose", sectionId: "save", closeWizard: true });
      }
      async function runProviderTest() {
        const provider = document.getElementById("provider-select").value;
        const sourceLanguage = document.getElementById("provider-test-source").value;
        const targetLanguage = document.getElementById("provider-test-target").value;
        const text = document.getElementById("provider-test-text").value;
        const resultElement = document.getElementById("provider-test-result");
        resultElement.textContent = actionsCopy.providerTestInProgress;
        setDiagnosticSummary("provider-test-summary", actionsCopy.providerTestInProgress, "info");
        const result = await withUiActionState("providerTest", () => runAction(
          () => api.testProviderTranslation({ provider, sourceLanguage, targetLanguage, text }),
          actionsCopy.providerTestCompleted,
          actionsCopy.providerTestFailed
        ));
        resultElement.textContent = [
          actionsCopy.providerLabel + ": " + result.provider,
          actionsCopy.modeLabel + ": " + result.mode,
          actionsCopy.sourceLabel + ": " + sourceLanguage,
          actionsCopy.targetLabel + ": " + targetLanguage,
          "",
          result.output || actionsCopy.noOutputReturned
        ].join("\\n");
        setDiagnosticSummary("provider-test-summary", actionsCopy.providerTestCompleted, "info");
      }
      async function runProviderSpeechTest() {
        const provider = document.getElementById("provider-select").value;
        const microphoneDeviceId = document.getElementById("provider-speech-microphone").value;
        const sourceLanguage = document.getElementById("provider-speech-source").value;
        const targetLanguage = document.getElementById("provider-speech-target").value;
        const resultElement = document.getElementById("provider-speech-result");
        if (provider === "ollama") {
          resultElement.textContent = actionsCopy.providerSpeechUnsupported;
          setStatus(actionsCopy.providerSpeechUnsupported, "warn");
          setDiagnosticSummary("provider-speech-summary", actionsCopy.providerSpeechUnsupported, "warn");
          return;
        }
        if (!microphoneDeviceId) {
          setStatus(actionsCopy.selectMicrophoneForProviderSpeechTest, "warn");
          setDiagnosticSummary("provider-speech-summary", actionsCopy.selectMicrophoneForProviderSpeechTest, "warn");
          return;
        }
        if (provider === "azure") {
          providerSpeechTestState.inFlight = true;
          renderProviderControls();
          resultElement.textContent = actionsCopy.azureListeningSelectedMicrophone;
          setDiagnosticSummary("provider-speech-summary", actionsCopy.azureListeningSelectedMicrophone, "info");
          try {
            const result = await withUiActionState("providerSpeech", () => runAction(
              () => api.testProviderSpeech({
                provider,
                sourceLanguage,
                targetLanguage,
                microphoneDeviceId,
                azureSpeechKey: state.envValues.AZURE_SPEECH_KEY || "",
                azureSpeechRegion: state.envValues.AZURE_SPEECH_REGION || "",
                audioEchoCancellation: normalizeBooleanEnv(state.envValues.AUDIO_ECHO_CANCELLATION, "true") === "true",
                audioNoiseSuppression: normalizeBooleanEnv(state.envValues.AUDIO_NOISE_SUPPRESSION, "true") === "true"
              }),
              actionsCopy.providerSpeechTestCompleted,
              actionsCopy.providerSpeechTestFailed
            ));
            resultElement.textContent = [
              actionsCopy.providerLabel + ": " + provider,
              actionsCopy.microphoneLabel + ": " + (microphoneDisplayName(state.microphones.find((item) => item.deviceId === microphoneDeviceId)) || microphoneDeviceId),
              actionsCopy.sourceLabel + ": " + sourceLanguage,
              actionsCopy.targetLabel + ": " + targetLanguage,
              actionsCopy.modeLabel + ": " + actionsCopy.liveMicrophoneValidationMode,
              "",
              actionsCopy.transcriptLabel + ":",
              result.transcript || actionsCopy.noTranscript,
              "",
              actionsCopy.translationLabel + ":",
              result.translation || actionsCopy.noTranslation
            ].join("\\n");
            setDiagnosticSummary("provider-speech-summary", actionsCopy.providerSpeechTestCompleted, "info");
          } finally {
            providerSpeechTestState.inFlight = false;
            renderProviderControls();
          }
          return;
        }
        if (providerSpeechTestState.recorder) {
          resultElement.textContent = actionsCopy.uploadingAudioToProvider;
          setDiagnosticSummary("provider-speech-summary", actionsCopy.uploadingAudioToProvider, "info");
          const payload = await stopProviderSpeechRecorder();
          const result = await withUiActionState("providerSpeech", () => runAction(
            () => api.testProviderSpeech({
              provider,
              sourceLanguage,
              targetLanguage,
              audioBase64: payload.audioBase64,
              audioMimeType: payload.audioMimeType
            }),
            actionsCopy.providerSpeechTestCompleted,
            actionsCopy.providerSpeechTestFailed
          ));
          renderProviderControls();
          resultElement.textContent = [
            actionsCopy.providerLabel + ": " + provider,
            actionsCopy.microphoneLabel + ": " + (microphoneDisplayName(state.microphones.find((item) => item.deviceId === microphoneDeviceId)) || microphoneDeviceId),
            actionsCopy.sourceLabel + ": " + sourceLanguage,
            actionsCopy.targetLabel + ": " + targetLanguage,
            actionsCopy.modeLabel + ": " + actionsCopy.finalTurnOnlyMode,
            "",
            actionsCopy.transcriptLabel + ":",
            result.transcript || actionsCopy.noTranscript,
            "",
            actionsCopy.translationLabel + ":",
            result.translation || actionsCopy.noTranslation
          ].join("\\n");
          setDiagnosticSummary("provider-speech-summary", actionsCopy.providerSpeechTestCompleted, "info");
          return;
        }
        const mimeType = pickSupportedRecordingMimeType();
        if (!mimeType) {
          throw new Error(actionsCopy.mediaRecorderIncompatible);
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: currentAudioCaptureConstraints(microphoneDeviceId), video: false });
        const recorder = new MediaRecorder(stream, { mimeType });
        providerSpeechTestState.recorder = recorder;
        providerSpeechTestState.stream = stream;
        providerSpeechTestState.chunks = [];
        providerSpeechTestState.mimeType = mimeType;
        providerSpeechTestState.activeDeviceId = microphoneDeviceId;
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            providerSpeechTestState.chunks.push(event.data);
          }
        };
        recorder.start();
        renderProviderControls();
        resultElement.textContent = actionsCopy.recordingChatGptFinalTurn;
        setStatus(actionsCopy.finalTurnRecordingStarted, "info");
        setDiagnosticSummary("provider-speech-summary", actionsCopy.recordingChatGptFinalTurn, "info");
      }
      function resetProviderPlaybackTestState() {
        providerPlaybackTestState.requestId = "";
        providerPlaybackTestState.playing = false;
        providerPlaybackTestState.engine = null;
        providerPlaybackTestState.voiceName = null;
        providerPlaybackTestState.language = null;
        providerPlaybackTestState.normalizedText = "";
        providerPlaybackTestState.requestedLanguage = null;
      }
      function formatProviderPlaybackPreviewMessage(preview) {
        return [
          actionsCopy.engineLabel + ": " + preview.engine,
          actionsCopy.languageLabel + ": " + (preview.language || actionsCopy.notAvailable),
          actionsCopy.targetLabel + ": " + (preview.requestedLanguage || actionsCopy.notAvailable),
          actionsCopy.voiceLabel + ": " + (preview.voiceName || actionsCopy.notAvailable),
          actionsCopy.translationLabel + ":",
          preview.normalizedText || actionsCopy.notAvailable,
          "",
          actionsCopy.providerPlaybackStarted
        ].join("\\n");
      }
      function handleProviderPlaybackEvent(event) {
        if (!event || !providerPlaybackTestState.requestId || event.requestId !== providerPlaybackTestState.requestId) {
          return;
        }
        const resultElement = document.getElementById("tts-test-result");
        if (event.type === "ended") {
          resultElement.textContent = actionsCopy.providerPlaybackCompleted;
          setDiagnosticSummary("tts-test-summary", actionsCopy.providerPlaybackCompleted, "info");
          resetProviderPlaybackTestState();
          renderProviderControls();
          return;
        }
        if (event.type === "stopped") {
          resultElement.textContent = actionsCopy.providerPlaybackStopped;
          setDiagnosticSummary("tts-test-summary", actionsCopy.providerPlaybackStopped, "info");
          resetProviderPlaybackTestState();
          renderProviderControls();
          return;
        }
        if (event.type === "error" || event.type === "unavailable") {
          resultElement.textContent = event.error || actionsCopy.providerPlaybackUnavailable;
          setDiagnosticSummary(
            "tts-test-summary",
            resultElement.textContent,
            event.type === "unavailable" ? "warn" : "error"
          );
          resetProviderPlaybackTestState();
          renderProviderControls();
          setStatus(resultElement.textContent, event.type === "unavailable" ? "warn" : "error");
        }
      }
      async function stopProviderPlaybackTest() {
        if (!providerPlaybackTestState.requestId) {
          resetProviderPlaybackTestState();
          renderProviderControls();
          return;
        }
        const requestId = providerPlaybackTestState.requestId;
        try {
          await api.releaseTextToSpeech(requestId);
        } finally {
          if (providerPlaybackTestState.requestId === requestId) {
            resetProviderPlaybackTestState();
          }
        }
        renderProviderControls();
      }
      async function runProviderPlaybackTest() {
        const language = document.getElementById("tts-test-language").value;
        const text = document.getElementById("tts-test-text").value.trim();
        await stopProviderPlaybackTest();
        const resultElement = document.getElementById("tts-test-result");
        if (!text) {
          setStatus(actionsCopy.enterSampleTextForPlayback, "warn");
          setDiagnosticSummary("tts-test-summary", actionsCopy.enterSampleTextForPlayback, "warn");
          return;
        }
        resultElement.textContent = actionsCopy.startingProviderPlayback;
        setDiagnosticSummary("tts-test-summary", actionsCopy.startingProviderPlayback, "info");
        let preview;
        try {
          preview = await runAction(
            () => api.testTextToSpeech({ text, language, translationProvider: (state.envValues.TRANSLATION_PROVIDER || "").trim() || null }),
            actionsCopy.providerPlaybackStartedStatus,
            actionsCopy.providerPlaybackFailed
          );
        } catch (error) {
          const message = error && error.message ? error.message : String(error);
          resultElement.textContent = message;
          setDiagnosticSummary("tts-test-summary", message, "error");
          resetProviderPlaybackTestState();
          renderProviderControls();
          throw error;
        }
        providerPlaybackTestState.requestId = preview.requestId;
        providerPlaybackTestState.playing = true;
        providerPlaybackTestState.engine = preview.engine;
        providerPlaybackTestState.voiceName = preview.voiceName;
        providerPlaybackTestState.language = preview.language;
        providerPlaybackTestState.normalizedText = preview.normalizedText || "";
        providerPlaybackTestState.requestedLanguage = preview.requestedLanguage || null;
        resultElement.textContent = formatProviderPlaybackPreviewMessage(preview);
        setDiagnosticSummary("tts-test-summary", actionsCopy.providerPlaybackStartedStatus, "info");
        renderProviderControls();
      }
`;
}
