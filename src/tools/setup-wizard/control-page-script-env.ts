export function getSetupWizardControlEnvScript(): string {
  return `      const envCopyByLanguage = {
        it: {
            runtimeDisclosureHidden: "L'avviso AI e' nascosto in runtime e setup.",
            runtimeDisclosureCustom: "Lo stesso avviso personalizzato viene riutilizzato in setup, interfaccia operatore e interfaccia visitatore.",
            runtimeDisclosureStandard: "L'avviso localizzato predefinito segue la lingua UI visibile.",
            waitActiveProviderTest: "Attendi la fine del test provider attivo prima di cambiare provider.",
            translationProviderUpdatedPrefix: "Provider traduzione aggiornato a ",
            translationProviderUpdateFailed: "Impossibile aggiornare il provider traduzione",
            demoProfileSummary: "La modalita demo esegue il loop scripted senza provider live o microfoni obbligatori.",
            sharedProfileSummary: "Microfono condiviso singolo: entrambe le postazioni usano lo stesso dispositivo mentre il controllo PTT si alterna.",
            dedicatedProfileSummary: "Due microfoni dedicati: ogni postazione mantiene il proprio microfono dedicato.",
            demoProfileActive: "Modalita demo attiva: le scelte microfono restano salvate per la prossima sessione kiosk.",
            sharedProfileActive: "Profilo attivo: un microfono condiviso replicato su entrambe le postazioni.",
            dedicatedProfileActive: "Profilo attivo: due microfoni dedicati, uno per postazione.",
            runtimeTtsDisabled: "La riproduzione vocale runtime e' disattivata. Il test di riproduzione provider resta disponibile nel setup.",
            initialLanguagesSharedCatalog: "Le lingue runtime vengono scelte direttamente dalle due postazioni durante l'uso.",
            providerSpeechGrantPermission: "Concedi il permesso microfono prima del test provider vocale.",
            providerSpeechNoMicrophone: "Nessun microfono disponibile per il test provider vocale.",
            providerSpeechAzureListening: "Azure live STT e traduzione stanno ascoltando dal microfono selezionato.",
            providerSpeechAzureReady: "Azure supporta un percorso di validazione live sul microfono selezionato.",
            providerSpeechChatGptRecording: "ChatGPT sta registrando localmente un clip final-turn. Premi di nuovo per inviarlo.",
            providerSpeechChatGptReady: "ChatGPT usa il caricamento audio final-turn invece dello streaming live nel setup wizard.",
            providerSpeechOllamaUnavailable: "Ollama e' disponibile solo per traduzione testuale e diagnostica modello. I test vocali live non sono supportati.",
            providerCapabilityNote: "Disponibilita STT / traduzione / TTS verificata sulle lingue selezionate nel registry del provider."
          },
        en: {
            runtimeDisclosureHidden: "The AI notice is hidden in runtime and setup.",
            runtimeDisclosureCustom: "The same custom notice is reused across setup, operator, and visitor UI.",
            runtimeDisclosureStandard: "The default localized notice follows the visible UI language.",
            waitActiveProviderTest: "Wait for the active provider test to finish before changing provider.",
            translationProviderUpdatedPrefix: "Translation provider updated to ",
            translationProviderUpdateFailed: "Unable to update the translation provider",
            demoProfileSummary: "Demo mode runs the scripted loop without live providers or mandatory microphones.",
            sharedProfileSummary: "Single shared microphone: both stations use the same device while PTT ownership alternates.",
            dedicatedProfileSummary: "Dual dedicated microphones: each station keeps its own dedicated microphone.",
            demoProfileActive: "Demo mode active: microphone choices are kept for the next kiosk session.",
            sharedProfileActive: "Active profile: one shared microphone mirrored to both stations.",
            dedicatedProfileActive: "Active profile: two dedicated microphones, one per station.",
            runtimeTtsDisabled: "Runtime speech playback is disabled. Provider test playback remains available inside setup.",
            initialLanguagesSharedCatalog: "Runtime languages are chosen directly on the two stations during use.",
            providerSpeechGrantPermission: "Grant microphone access before running provider speech tests.",
            providerSpeechNoMicrophone: "No microphone is currently available for provider speech tests.",
            providerSpeechAzureListening: "Azure live STT and translation are listening on the selected microphone.",
            providerSpeechAzureReady: "Azure supports a live microphone validation path on the selected microphone.",
            providerSpeechChatGptRecording: "ChatGPT is recording a final-turn clip locally. Press again to upload it.",
            providerSpeechChatGptReady: "ChatGPT uses final-turn audio upload instead of live streaming in the setup wizard.",
            providerSpeechOllamaUnavailable: "Ollama is available for text translation and model diagnostics only. Live speech tests are not supported.",
            providerCapabilityNote: "STT / translation / TTS availability is checked against the selected provider language registry."
          }
      };
      envCopyByLanguage.es = {
        ...envCopyByLanguage.en,
        runtimeDisclosureHidden: "El aviso de IA esta oculto en runtime y setup.",
        runtimeDisclosureCustom: "El mismo aviso personalizado se reutiliza en setup, UI del operador y UI del usuario.",
        runtimeDisclosureStandard: "El aviso localizado sigue el idioma UI visible.",
        waitActiveProviderTest: "Espera a que termine la prueba del proveedor activa antes de cambiarlo.",
        translationProviderUpdatedPrefix: "Proveedor de traduccion actualizado a ",
        translationProviderUpdateFailed: "No se pudo actualizar el proveedor de traduccion",
        demoProfileSummary: "El modo demo ejecuta el bucle guiado sin proveedores live ni microfonos obligatorios.",
        sharedProfileSummary: "Microfono compartido unico: ambos puestos usan el mismo dispositivo y alternan el control PTT.",
        dedicatedProfileSummary: "Dos microfonos dedicados: cada puesto conserva su propio microfono.",
        demoProfileActive: "Modo demo activo: las elecciones de microfono se guardan para la siguiente sesion kiosk.",
        sharedProfileActive: "Perfil activo: un microfono compartido replicado en ambos puestos.",
        dedicatedProfileActive: "Perfil activo: dos microfonos dedicados, uno por puesto.",
        runtimeTtsDisabled: "La reproduccion vocal runtime esta desactivada. La prueba de reproduccion sigue disponible en setup.",
        initialLanguagesSharedCatalog: "Los idiomas runtime se eligen directamente en los dos puestos durante el uso.",
        providerSpeechGrantPermission: "Concede el acceso al microfono antes de ejecutar la prueba de voz del proveedor.",
        providerSpeechNoMicrophone: "No hay ningun microfono disponible para la prueba de voz del proveedor.",
        providerSpeechAzureListening: "Azure live STT y traduccion estan escuchando en el microfono seleccionado.",
        providerSpeechAzureReady: "Azure admite una validacion live en el microfono seleccionado.",
        providerSpeechChatGptRecording: "ChatGPT esta grabando localmente un clip final-turn. Pulsa otra vez para enviarlo.",
        providerSpeechChatGptReady: "ChatGPT usa la carga de audio final-turn en lugar de streaming live en el setup wizard."
      };
      envCopyByLanguage.fr = {
        ...envCopyByLanguage.en,
        runtimeDisclosureHidden: "L'avis IA est masque dans runtime et setup.",
        runtimeDisclosureCustom: "Le meme avis personnalise est reutilise dans setup, UI operateur et UI utilisateur.",
        runtimeDisclosureStandard: "L'avis localise par defaut suit la langue UI visible.",
        waitActiveProviderTest: "Attendez la fin du test fournisseur actif avant de changer de fournisseur.",
        translationProviderUpdatedPrefix: "Fournisseur de traduction mis a jour vers ",
        translationProviderUpdateFailed: "Impossible de mettre a jour le fournisseur de traduction",
        demoProfileSummary: "Le mode demo execute la boucle scriptée sans fournisseur live ni microphone obligatoire.",
        sharedProfileSummary: "Micro partage unique : les deux postes utilisent le meme peripherique avec alternance du controle PTT.",
        dedicatedProfileSummary: "Deux microphones dedies : chaque poste conserve son propre microphone.",
        demoProfileActive: "Mode demo actif : les choix de microphone sont conserves pour la prochaine session kiosk.",
        sharedProfileActive: "Profil actif : un microphone partage reproduit sur les deux postes.",
        dedicatedProfileActive: "Profil actif : deux microphones dedies, un par poste.",
        runtimeTtsDisabled: "La lecture vocale runtime est desactivee. Le test de lecture fournisseur reste disponible dans setup.",
        initialLanguagesSharedCatalog: "Les langues runtime sont choisies directement sur les deux postes pendant l'usage.",
        providerSpeechGrantPermission: "Accordez l'acces microphone avant de lancer le test vocal du fournisseur.",
        providerSpeechNoMicrophone: "Aucun microphone n'est disponible pour le test vocal du fournisseur.",
        providerSpeechAzureListening: "Azure live STT et traduction ecoutent sur le microphone selectionne.",
        providerSpeechAzureReady: "Azure propose une validation live sur le microphone selectionne.",
        providerSpeechChatGptRecording: "ChatGPT enregistre localement un clip final-turn. Appuyez encore pour l'envoyer.",
        providerSpeechChatGptReady: "ChatGPT utilise l'envoi audio final-turn au lieu du streaming live dans le setup wizard."
      };
      envCopyByLanguage.de = {
        ...envCopyByLanguage.en,
        runtimeDisclosureHidden: "Der KI-Hinweis ist in Runtime und Setup ausgeblendet.",
        runtimeDisclosureCustom: "Derselbe benutzerdefinierte Hinweis wird in Setup, Operator-UI und Nutzer-UI wiederverwendet.",
        runtimeDisclosureStandard: "Der standardmaessige lokalisierte Hinweis folgt der sichtbaren UI-Sprache.",
        waitActiveProviderTest: "Warten Sie, bis der aktive Anbieter-Test beendet ist, bevor Sie den Anbieter wechseln.",
        translationProviderUpdatedPrefix: "Uebersetzungsanbieter aktualisiert auf ",
        translationProviderUpdateFailed: "Uebersetzungsanbieter konnte nicht aktualisiert werden",
        demoProfileSummary: "Der Demo-Modus fuehrt die geskriptete Schleife ohne Live-Anbieter oder Pflichtmikrofone aus.",
        sharedProfileSummary: "Gemeinsames Mikrofon: Beide Stationen verwenden dasselbe Geraet bei wechselnder PTT-Steuerung.",
        dedicatedProfileSummary: "Zwei dedizierte Mikrofone: Jede Station behaelt ihr eigenes Mikrofon.",
        demoProfileActive: "Demo-Modus aktiv: Mikrofonauswahlen bleiben fuer die naechste Kiosk-Sitzung erhalten.",
        sharedProfileActive: "Aktives Profil: Ein gemeinsames Mikrofon wird auf beide Stationen gespiegelt.",
        dedicatedProfileActive: "Aktives Profil: Zwei dedizierte Mikrofone, eines pro Station.",
        runtimeTtsDisabled: "Die Runtime-Sprachausgabe ist deaktiviert. Der Anbieter-Wiedergabetest bleibt im Setup verfuegbar.",
        initialLanguagesSharedCatalog: "Die Runtime-Sprachen werden waehrend der Nutzung direkt an beiden Stationen gewaehlt.",
        providerSpeechGrantPermission: "Erteilen Sie Mikrofonzugriff, bevor Sie Sprachtests mit dem Anbieter starten.",
        providerSpeechNoMicrophone: "Derzeit ist kein Mikrofon fuer Anbieter-Sprachtests verfuegbar.",
        providerSpeechAzureListening: "Azure live STT und Uebersetzung hoeren am ausgewaehlten Mikrofon zu.",
        providerSpeechAzureReady: "Azure unterstuetzt einen Live-Mikrofontest auf dem ausgewaehlten Mikrofon.",
        providerSpeechChatGptRecording: "ChatGPT zeichnet lokal einen Final-Turn-Clip auf. Druecken Sie erneut zum Hochladen.",
        providerSpeechChatGptReady: "ChatGPT verwendet im Setup-Wizard den Final-Turn-Audio-Upload statt Live-Streaming."
      };
      envCopyByLanguage.zh = {
        ...envCopyByLanguage.en,
        runtimeDisclosureHidden: "AI 提示在 runtime 和 setup 中均已隐藏。",
        runtimeDisclosureCustom: "同一段自定义提示会在 setup、操作员界面和用户界面中复用。",
        runtimeDisclosureStandard: "默认本地化提示会跟随当前可见界面语言。",
        waitActiveProviderTest: "请等待当前服务商测试结束后再切换服务商。",
        translationProviderUpdatedPrefix: "翻译服务商已更新为 ",
        translationProviderUpdateFailed: "无法更新翻译服务商",
        demoProfileSummary: "演示模式会运行脚本化循环，不需要 live 服务商或必需麦克风。",
        sharedProfileSummary: "单共享麦克风：两侧工作站使用同一个设备，并轮换 PTT 控制权。",
        dedicatedProfileSummary: "双独立麦克风：每侧工作站保留各自专用麦克风。",
        demoProfileActive: "演示模式已启用：麦克风选择会保留到下一次 kiosk 会话。",
        sharedProfileActive: "当前配置：一个共享麦克风同步到两侧工作站。",
        dedicatedProfileActive: "当前配置：两个独立麦克风，每侧一个。",
        runtimeTtsDisabled: "runtime 语音播放已关闭。服务商播放测试仍可在 setup 中使用。",
        initialLanguagesSharedCatalog: "runtime 语言会在使用时直接在两侧工作站上选择。",
        providerSpeechGrantPermission: "运行服务商语音测试前请先授予麦克风权限。",
        providerSpeechNoMicrophone: "当前没有可用于服务商语音测试的麦克风。",
        providerSpeechAzureListening: "Azure live STT 和翻译正在监听所选麦克风。",
        providerSpeechAzureReady: "Azure 支持在所选麦克风上进行 live 验证。",
        providerSpeechChatGptRecording: "ChatGPT 正在本地录制 final-turn 片段。再次点击即可上传。",
        providerSpeechChatGptReady: "在 setup wizard 中，ChatGPT 使用 final-turn 音频上传而不是 live 流式传输。"
      };
      let envCopy = envCopyByLanguage[wizardUiLanguage] || envCopyByLanguage.en;
      let pendingEnvPatch = {};
      const selectorUiLanguageOptions = [
        { value: "en", label: "English" },
        { value: "it", label: "Italiano" },
        { value: "es", label: "Espanol" },
        { value: "fr", label: "Francais" },
        { value: "de", label: "Deutsch" },
        { value: "zh", label: "中文" }
      ];
      function getCanonicalControl(id) {
        const matches = [...document.querySelectorAll('[id="' + id + '"]')];
        if (matches.length !== 1) {
          throw new Error('Expected exactly one canonical setup control for "' + id + '", found ' + matches.length + ".");
        }
        return matches[0];
      }
      function getCanonicalSelect(id) {
        const element = getCanonicalControl(id);
        if (!(element instanceof HTMLSelectElement)) {
          throw new Error('Canonical setup control "' + id + '" is not a select element.');
        }
        return element;
      }
      function refreshValidationDependentUi() {
        if (!state) {
          return;
        }
        renderHeroSummary();
        renderChecklist();
        renderMonitorNotices();
        renderMicrophoneNotices();
        renderProviderValidationNotices();
        renderSaveReview();
        renderAutostartControls();
        renderProviderSpeechNotices();
        renderAsyncUi();
      }
      function renderAutostartControls() {
        const toggle = document.getElementById("autostart-enabled");
        const enableBtn = document.getElementById("autostart-enable-btn");
        const disableBtn = document.getElementById("autostart-disable-btn");
        const note = document.getElementById("autostart-config-note");
        const review = document.getElementById("save-review-autostart");
        if (!(toggle instanceof HTMLInputElement) || !(note instanceof HTMLElement) || !(review instanceof HTMLElement)) {
          return;
        }
        const autostartState = state?.autostart || {
          supported: false,
          canModify: false,
          currentEnabled: false,
          selectedEnabled: false
        };
        const saveBusy = isActionBusy("saveSection") || isActionBusy("saveAndClose");
        const controlsDisabled = !autostartState.supported || !autostartState.canModify || saveBusy;
        const selectedEnabled = Boolean(autostartState.selectedEnabled);
        toggle.checked = selectedEnabled;
        toggle.disabled = controlsDisabled;
        if (enableBtn instanceof HTMLButtonElement) {
          enableBtn.classList.toggle("is-active", selectedEnabled);
          enableBtn.setAttribute("aria-pressed", selectedEnabled ? "true" : "false");
          enableBtn.disabled = controlsDisabled;
        }
        if (disableBtn instanceof HTMLButtonElement) {
          disableBtn.classList.toggle("is-active", !selectedEnabled);
          disableBtn.setAttribute("aria-pressed", (!selectedEnabled) ? "true" : "false");
          disableBtn.disabled = controlsDisabled;
        }

        let noteText = copy.autostartUnavailable;
        let noteTone = "warn";
        let reviewText = copy.reviewAutostartDisabled;
        let reviewChipClass = "review-chip autostart-review-chip";

        if (autostartState.supported) {
          const currentEnabled = Boolean(autostartState.currentEnabled);
          if (currentEnabled !== selectedEnabled) {
            noteText = selectedEnabled ? copy.autostartWillEnableOnSave : copy.autostartWillDisableOnSave;
            reviewText = selectedEnabled
              ? copy.reviewAutostartPendingEnable
              : copy.reviewAutostartPendingDisable;
            noteTone = "info";
            reviewChipClass += " is-warn";
          } else if (selectedEnabled) {
            noteText = copy.autostartEnabledNote;
            reviewText = copy.reviewAutostartEnabled;
            noteTone = "info";
            reviewChipClass += " is-ok";
          } else {
            noteText = copy.autostartDisabledNote;
            reviewText = copy.reviewAutostartDisabled;
            noteTone = "info";
          }
        }

        review.textContent = copy.reviewAutostart + ": " + reviewText;
        review.className = reviewChipClass;
        note.textContent = noteText;
        note.className = "notice " + noteTone;
        note.hidden = false;
      }
      function stageEnvValue(values = {}) {
        if (!values || Object.keys(values).length === 0) {
          return state?.envValues || {};
        }
        pendingEnvPatch = {
          ...pendingEnvPatch,
          ...values
        };
        const nextEnvValues = applyLocalEnvValues(values);
        refreshValidationDependentUi();
        return nextEnvValues;
      }
      async function persistEnvValuePatch(values = {}) {
        if (!values || Object.keys(values).length === 0) {
          return state;
        }
        stageEnvValue(values);
        const nextState = syncStateFromApi(await api.updateEnvValues(values));
        pendingEnvPatch = Object.keys(pendingEnvPatch).reduce((accumulator, key) => {
          if ((nextState?.envValues?.[key] || "") !== pendingEnvPatch[key]) {
            accumulator[key] = pendingEnvPatch[key];
          }
          return accumulator;
        }, {});
        return nextState;
      }
      function currentProviderSelection() {
        const providerSelect = document.getElementById("provider-select");
        if (providerSelect instanceof HTMLSelectElement && providerSelect.value.trim()) {
          return providerSelect.value.trim();
        }
        return providerValue() || "chatgpt";
      }
      function collectPendingEnvValuesFromDom() {
        const pendingValues = {};
        document.querySelectorAll("[data-env-key]").forEach((element) => {
          if (
            !(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) ||
            element.disabled
          ) {
            return;
          }
          const envKey = element.getAttribute("data-env-key");
          if (!envKey) {
            return;
          }
          pendingValues[envKey] = element.value;
        });
        const providerSelect = document.getElementById("provider-select");
        if (providerSelect instanceof HTMLSelectElement && !providerSelect.disabled) {
          pendingValues.TRANSLATION_PROVIDER = providerSelect.value;
        }
        const selectedProvider = pendingValues.TRANSLATION_PROVIDER || currentProviderSelection();
        ["A", "B"].forEach((side) => {
          const languageSelect = document.getElementById("setup-language-choice-" + side);
          if (!(languageSelect instanceof HTMLSelectElement) || languageSelect.disabled || !languageSelect.value) {
            return;
          }
          pendingValues["DEFAULT_TARGET_LANG_" + side] = normalizeTargetLanguageForProvider(
            languageSelect.value,
            selectedProvider
          );
        });
        return pendingValues;
      }
      function flushPendingEnvValues() {
        const liveEnvValues = collectPendingEnvValuesFromDom();
        const pendingValues = Object.keys(pendingEnvPatch).reduce((accumulator, key) => {
          accumulator[key] = Object.prototype.hasOwnProperty.call(liveEnvValues, key)
            ? liveEnvValues[key]
            : pendingEnvPatch[key];
          return accumulator;
        }, {});
        if (Object.keys(pendingValues).length === 0) {
          return state;
        }
        return persistEnvValuePatch(pendingValues);
      }
      function renderEnvForm() {
        const container = document.getElementById("env-form");
        container.innerHTML = envFields().map(([key,label]) => {
          return \`<label>\${escapeHtml(label)}<input id="env-\${escapeHtml(key)}" data-env-key="\${escapeHtml(key)}" value="\${escapeHtml(state.envValues[key] || "")}" /></label>\`;
        }).join("");
        container.querySelectorAll("input[data-env-key], select[data-env-key]").forEach((input) => {
          input.addEventListener("input", () => {
            stageEnvValue({ [input.getAttribute("data-env-key")]: input.value });
          });
          input.addEventListener("change", async () => {
            await persistEnvValuePatch({ [input.getAttribute("data-env-key")]: input.value });
            await refreshPreview();
          });
        });
      }
      function renderRuntimeDisclosureControls() {
        const modeSelect = document.getElementById("env-RUNTIME_DISCLOSURE_MODE");
        const customField = document.getElementById("runtime-disclosure-custom-field");
        const customTextArea = document.getElementById("env-RUNTIME_DISCLOSURE_CUSTOM_TEXT");
        const configNote = document.getElementById("runtime-disclosure-config-note");
        const runtimeNotice = document.getElementById("runtime-disclosure-notice");
        const runtimeNoticeBody = runtimeNotice?.querySelector(".wizard-disclosure-body");
        const runtimeOverviewNote = document.querySelector(".shell-overview-note");
        const mode = runtimeDisclosureMode();
        const preview = currentRuntimeDisclosurePreview();
        modeSelect.innerHTML = genericOptionsHtml(runtimeDisclosureModeOptions(), mode);
        modeSelect.value = mode;
        customTextArea.value = state.envValues.RUNTIME_DISCLOSURE_CUSTOM_TEXT || "";
        customField.classList.toggle("field-hidden", mode !== "custom");
        if (configNote) {
          configNote.textContent =
            mode === "disabled"
              ? envCopy.runtimeDisclosureHidden
              : mode === "custom"
                ? envCopy.runtimeDisclosureCustom
                : envCopy.runtimeDisclosureStandard;
        }
        if (runtimeNotice) {
          if (!preview) {
            runtimeNotice.hidden = true;
            if (runtimeNoticeBody) {
              runtimeNoticeBody.innerHTML = "";
            }
            if (runtimeOverviewNote) {
              runtimeOverviewNote.innerHTML = "";
            }
          } else {
            runtimeNotice.hidden = false;
            if (runtimeOverviewNote) {
              runtimeOverviewNote.innerHTML =
                '<strong>' + escapeHtml(preview.title) + '</strong>'
                + (preview.paragraphs[0] ? '<span>' + escapeHtml(preview.paragraphs[0]) + '</span>' : "");
            }
            if (runtimeNoticeBody) {
              runtimeNoticeBody.innerHTML =
                '<div role="note">'
                + '<strong>' + escapeHtml(preview.title) + '</strong>'
                + preview.paragraphs.map((paragraph) => '<p>' + escapeHtml(paragraph) + '</p>').join("")
                + '</div>';
            } else {
              runtimeNotice.innerHTML =
              '<strong>' + escapeHtml(preview.title) + '</strong>'
                + preview.paragraphs.map((paragraph) => '<span>' + escapeHtml(paragraph) + '</span>').join("");
            }
          }
        }
        modeSelect.oninput = () => {
          stageEnvValue({ RUNTIME_DISCLOSURE_MODE: modeSelect.value });
        };
        modeSelect.onchange = async () => {
          await persistEnvValuePatch({ RUNTIME_DISCLOSURE_MODE: modeSelect.value });
          await refreshPreview();
        };
        customTextArea.oninput = () => {
          stageEnvValue({ RUNTIME_DISCLOSURE_CUSTOM_TEXT: customTextArea.value });
        };
        customTextArea.onchange = async () => {
          await persistEnvValuePatch({ RUNTIME_DISCLOSURE_CUSTOM_TEXT: customTextArea.value });
          await refreshPreview();
        };
      }
      function renderProviderValidationNotices() {
        const providerNotices = [];
        const configurationIssues = currentConfigurationIssues();
        const providerStateIssue = configurationIssues.find((issue) => issue.code === "unsupported-provider");
        const providerCredentialIssue = configurationIssues.find((issue) => issue.code === "missing-provider-credentials");
        providerNotices.push('<div class="notice info">' + escapeHtml(envCopy.providerCapabilityNote) + '</div>');
        if (providerStateIssue) {
          providerNotices.push('<div class="notice warn">' + escapeHtml(localizeWizardIssue(providerStateIssue).message) + '</div>');
        }
        if (providerCredentialIssue) {
          const localizedCredentialIssue = localizeWizardIssue(providerCredentialIssue);
          providerNotices.push('<div class="notice warn">' + escapeHtml(localizedCredentialIssue.message) + ': ' + escapeHtml(localizedCredentialIssue.detail || "") + '</div>');
        }
        document.getElementById("provider-config-notices").innerHTML = providerNotices.join("");
      }
      function renderProviderControls() {
        const providerSelect = document.getElementById("provider-select");
        const selectorUiLanguageASelect = getCanonicalSelect("env-SELECTOR_UI_LANGUAGE_A");
        const selectorUiLanguageBSelect = getCanonicalSelect("env-SELECTOR_UI_LANGUAGE_B");
        const visitorHistorySelect = getCanonicalSelect("env-VISITOR_CONVERSATION_HISTORY_ENABLED");
        const textToSpeechSelect = getCanonicalSelect("env-TEXT_TO_SPEECH_ENABLED");
        const echoCancellationSelect = getCanonicalSelect("env-AUDIO_ECHO_CANCELLATION");
        const noiseSuppressionSelect = getCanonicalSelect("env-AUDIO_NOISE_SUPPRESSION");
        const providerLanguageContractModeSelect = getCanonicalSelect("env-PROVIDER_LANGUAGE_CONTRACT_MODE");
        const chatGptSttLanguagePromptSelect = getCanonicalSelect("env-CHATGPT_STT_LANGUAGE_PROMPT_ENABLED");
        const chatGptDetectedLanguageModeSelect = getCanonicalSelect("env-CHATGPT_TRANSLATION_DETECTED_LANGUAGE_MODE");
        const openAiTtsLanguageInstructionsSelect = getCanonicalSelect("env-OPENAI_TTS_LANGUAGE_INSTRUCTIONS_ENABLED");
        const azureTtsLangElementSelect = getCanonicalSelect("env-AZURE_TTS_LANG_ELEMENT_ENABLED");
        const audioCaptureSettingsDiagnosticsSelect = getCanonicalSelect("env-AUDIO_CAPTURE_SETTINGS_DIAGNOSTICS_ENABLED");
        const logLevelSelect = getCanonicalSelect("env-LOG_LEVEL");
        const sharedCredentialsCard = document.getElementById("provider-shared-credentials-card");
        const providerSpecificCard = document.getElementById("provider-specific-settings-card");
        const visitorHistoryReview = document.getElementById("save-review-visitor-history");
        const currentRuntimeMode = runtimeMode();
        const currentMicrophonePttMode = microphonePttMode();
        const runtimeProfile = currentRuntimeProfile();
        const configuredProvider = providerValue();
        const providerTestBusy = isActionBusy("providerTest");
        const providerSpeechBusy = isActionBusy("providerSpeech");
        const providerControlsBusy = providerTestBusy || providerSpeechBusy || Boolean(providerSpeechTestState.recorder);
        const selectedProvider = translationProviders.some((option) => option.value === configuredProvider)
          ? configuredProvider
          : "chatgpt";
        renderSetupLanguageSelector("A", selectedProvider);
        renderSetupLanguageSelector("B", selectedProvider);
        renderInitialLanguageNotices(selectedProvider);
        providerSelect.innerHTML = translationProviderOptionsHtml(configuredProvider);
        providerSelect.value = configuredProvider;
        providerSelect.disabled = providerControlsBusy;
        providerSelect.onchange = async () => {
          if (providerControlsBusy) {
            setStatus(envCopy.waitActiveProviderTest, "warn");
            providerSelect.value = selectedProvider;
            return;
          }
          if (providerSpeechTestState.recorder) {
            await stopProviderSpeechRecorder();
            document.getElementById("provider-speech-result").textContent = "";
          }
          await runAction(
            () => persistEnvValuePatch({ TRANSLATION_PROVIDER: providerSelect.value }),
            envCopy.translationProviderUpdatedPrefix + providerSelect.value + ".",
            envCopy.translationProviderUpdateFailed
          );
          renderProviderControls();
          await refreshPreview();
        };

        document.getElementById("env-APP_MODE").innerHTML = genericOptionsHtml(appModeOptions(), currentRuntimeMode);
        document.getElementById("env-APP_MODE").value = currentRuntimeMode;
        document.getElementById("env-MICROPHONE_PTT_MODE").innerHTML = genericOptionsHtml(
          microphonePttModeOptions(),
          currentMicrophonePttMode
        );
        document.getElementById("env-MICROPHONE_PTT_MODE").value = currentMicrophonePttMode;
        document.getElementById("env-DEMO_SLIDE_INTERVAL_SECONDS").value =
          state.envValues.DEMO_SLIDE_INTERVAL_SECONDS || "8";
        document.getElementById("demo-slide-interval-field").classList.toggle(
          "field-hidden",
          currentRuntimeMode !== "demo"
        );
        const profileSummaryEl = document.getElementById("setup-profile-summary");
        if (profileSummaryEl) {
          profileSummaryEl.textContent =
            currentRuntimeMode === "demo"
              ? envCopy.demoProfileSummary
              : currentMicrophonePttMode === "single-shared"
                ? envCopy.sharedProfileSummary
                : envCopy.dedicatedProfileSummary;
        }
        const dedicatedProfileButton = document.getElementById("stations-microphone-profile-dedicated");
        const sharedProfileButton = document.getElementById("stations-microphone-profile-shared");
        const stationsProfileNote = document.getElementById("stations-microphone-profile-note");
        const profileControlsBusy = providerControlsBusy || anyActionBusy(["probingMicrophones", "save", "saveAndClose"]);
        const profileUpdateMessage =
          runtimeProfile.appMode === "demo"
            ? envCopy.demoProfileActive
            : runtimeProfile.microphonePttMode === "single-shared"
              ? envCopy.sharedProfileActive
              : envCopy.dedicatedProfileActive;
        dedicatedProfileButton.classList.toggle("is-active", currentMicrophonePttMode === "dual-dedicated");
        sharedProfileButton.classList.toggle("is-active", currentMicrophonePttMode === "single-shared");
        dedicatedProfileButton.setAttribute("aria-pressed", currentMicrophonePttMode === "dual-dedicated" ? "true" : "false");
        sharedProfileButton.setAttribute("aria-pressed", currentMicrophonePttMode === "single-shared" ? "true" : "false");
        dedicatedProfileButton.disabled = profileControlsBusy;
        sharedProfileButton.disabled = profileControlsBusy;
        stationsProfileNote.textContent = profileUpdateMessage;
        dedicatedProfileButton.onclick = async () => {
          if (profileControlsBusy || currentMicrophonePttMode === "dual-dedicated") {
            return;
          }
          await persistEnvValuePatch(normalizedRuntimeEnvPatch(currentRuntimeMode, "dual-dedicated"));
          await refreshPreview();
        };
        sharedProfileButton.onclick = async () => {
          if (profileControlsBusy || currentMicrophonePttMode === "single-shared") {
            return;
          }
          await persistEnvValuePatch(normalizedRuntimeEnvPatch(currentRuntimeMode, "single-shared"));
          await refreshPreview();
        };

        document.getElementById("env-AZURE_SPEECH_KEY").value = state.envValues.AZURE_SPEECH_KEY || "";
        document.getElementById("env-AZURE_SPEECH_REGION").value = state.envValues.AZURE_SPEECH_REGION || "";
        document.getElementById("env-CHATGPT_MODEL").innerHTML = genericOptionsHtml(chatGptModelOptions, state.envValues.CHATGPT_MODEL || "gpt-4o-mini");
        document.getElementById("env-CHATGPT_TRANSCRIBE_MODEL").innerHTML = genericOptionsHtml(chatGptTranscribeModelOptions, state.envValues.CHATGPT_TRANSCRIBE_MODEL || "whisper-1");
        document.getElementById("env-CHATGPT_MODEL").value = state.envValues.CHATGPT_MODEL || "gpt-4o-mini";
        document.getElementById("env-CHATGPT_TRANSCRIBE_MODEL").value = state.envValues.CHATGPT_TRANSCRIBE_MODEL || "whisper-1";
        document.getElementById("env-OLLAMA_BASE_URL").value = state.envValues.OLLAMA_BASE_URL || "http://localhost:11434/api";
        document.getElementById("env-OLLAMA_MODEL").value = state.envValues.OLLAMA_MODEL || "gemma3";
        document.getElementById("env-OLLAMA_REQUEST_TIMEOUT_MS").value = state.envValues.OLLAMA_REQUEST_TIMEOUT_MS || "45000";
        document.getElementById("env-OLLAMA_STREAMING_ENABLED").innerHTML = booleanOptionsHtml(
          normalizeBooleanEnv(state.envValues.OLLAMA_STREAMING_ENABLED, "false")
        );
        document.getElementById("env-OLLAMA_STREAMING_ENABLED").value = normalizeBooleanEnv(
          state.envValues.OLLAMA_STREAMING_ENABLED,
          "false"
        );
        document.getElementById("env-OLLAMA_API_KEY").value = state.envValues.OLLAMA_API_KEY || "";
        syncWizardUiLanguageControls(state.envValues.SETUP_UI_LANGUAGE || wizardUiLanguage);
        selectorUiLanguageASelect.innerHTML = genericOptionsHtml(
          selectorUiLanguageOptions,
          state.envValues.SELECTOR_UI_LANGUAGE_A || state.envValues.SETUP_UI_LANGUAGE || "en"
        );
        selectorUiLanguageASelect.value =
          state.envValues.SELECTOR_UI_LANGUAGE_A || state.envValues.SETUP_UI_LANGUAGE || "en";
        selectorUiLanguageBSelect.innerHTML = genericOptionsHtml(
          selectorUiLanguageOptions,
          state.envValues.SELECTOR_UI_LANGUAGE_B || state.envValues.SETUP_UI_LANGUAGE || "en"
        );
        selectorUiLanguageBSelect.value =
          state.envValues.SELECTOR_UI_LANGUAGE_B || state.envValues.SETUP_UI_LANGUAGE || "en";
        visitorHistorySelect.innerHTML = booleanOptionsHtml(state.envValues.VISITOR_CONVERSATION_HISTORY_ENABLED || "false");
        visitorHistorySelect.value = normalizeBooleanEnv(state.envValues.VISITOR_CONVERSATION_HISTORY_ENABLED, "false");
        textToSpeechSelect.innerHTML = booleanOptionsHtml(state.envValues.TEXT_TO_SPEECH_ENABLED || "true");
        textToSpeechSelect.value = normalizeBooleanEnv(state.envValues.TEXT_TO_SPEECH_ENABLED, "true");
        echoCancellationSelect.innerHTML = booleanOptionsHtml(state.envValues.AUDIO_ECHO_CANCELLATION || "true");
        echoCancellationSelect.value = normalizeBooleanEnv(state.envValues.AUDIO_ECHO_CANCELLATION, "true");
        noiseSuppressionSelect.innerHTML = booleanOptionsHtml(state.envValues.AUDIO_NOISE_SUPPRESSION || "true");
        noiseSuppressionSelect.value = normalizeBooleanEnv(state.envValues.AUDIO_NOISE_SUPPRESSION, "true");
        providerLanguageContractModeSelect.innerHTML = genericOptionsHtml(providerLanguageContractModeOptions, state.envValues.PROVIDER_LANGUAGE_CONTRACT_MODE || "strict");
        providerLanguageContractModeSelect.value = state.envValues.PROVIDER_LANGUAGE_CONTRACT_MODE || "strict";
        chatGptSttLanguagePromptSelect.innerHTML = booleanOptionsHtml(state.envValues.CHATGPT_STT_LANGUAGE_PROMPT_ENABLED || "true");
        chatGptSttLanguagePromptSelect.value = normalizeBooleanEnv(state.envValues.CHATGPT_STT_LANGUAGE_PROMPT_ENABLED, "true");
        chatGptDetectedLanguageModeSelect.innerHTML = genericOptionsHtml(chatGptTranslationDetectedLanguageModeOptions, state.envValues.CHATGPT_TRANSLATION_DETECTED_LANGUAGE_MODE || "diagnostic");
        chatGptDetectedLanguageModeSelect.value = state.envValues.CHATGPT_TRANSLATION_DETECTED_LANGUAGE_MODE || "diagnostic";
        openAiTtsLanguageInstructionsSelect.innerHTML = booleanOptionsHtml(state.envValues.OPENAI_TTS_LANGUAGE_INSTRUCTIONS_ENABLED || "true");
        openAiTtsLanguageInstructionsSelect.value = normalizeBooleanEnv(state.envValues.OPENAI_TTS_LANGUAGE_INSTRUCTIONS_ENABLED, "true");
        azureTtsLangElementSelect.innerHTML = booleanOptionsHtml(state.envValues.AZURE_TTS_LANG_ELEMENT_ENABLED || "true");
        azureTtsLangElementSelect.value = normalizeBooleanEnv(state.envValues.AZURE_TTS_LANG_ELEMENT_ENABLED, "true");
        audioCaptureSettingsDiagnosticsSelect.innerHTML = booleanOptionsHtml(state.envValues.AUDIO_CAPTURE_SETTINGS_DIAGNOSTICS_ENABLED || "false");
        audioCaptureSettingsDiagnosticsSelect.value = normalizeBooleanEnv(state.envValues.AUDIO_CAPTURE_SETTINGS_DIAGNOSTICS_ENABLED, "false");
        logLevelSelect.innerHTML = genericOptionsHtml(logLevelOptions, state.envValues.LOG_LEVEL || "info");
        logLevelSelect.value = state.envValues.LOG_LEVEL || "info";
        if (visitorHistoryReview) {
          visitorHistoryReview.textContent =
            normalizeBooleanEnv(state.envValues.VISITOR_CONVERSATION_HISTORY_ENABLED, "false") === "true"
              ? copy.booleanEnabled
              : copy.booleanDisabled;
        }
        const autostartToggle = document.getElementById("autostart-enabled");
        if (autostartToggle instanceof HTMLInputElement) {
          autostartToggle.onchange = async () => {
            const selectedEnabled = autostartToggle.checked;
            await runAction(
              () => api.updateAutostart(selectedEnabled),
              selectedEnabled ? actionsCopy.autostartEnabled : actionsCopy.autostartDisabled,
              actionsCopy.autostartUpdateFailed
            );
          };
        }
        const autostartEnableBtn = document.getElementById("autostart-enable-btn");
        const autostartDisableBtn = document.getElementById("autostart-disable-btn");
        if (autostartEnableBtn instanceof HTMLButtonElement) {
          autostartEnableBtn.onclick = async () => {
            if (autostartToggle instanceof HTMLInputElement && !autostartToggle.checked) {
              autostartToggle.checked = true;
              autostartToggle.dispatchEvent(new Event("change"));
            }
          };
        }
        if (autostartDisableBtn instanceof HTMLButtonElement) {
          autostartDisableBtn.onclick = async () => {
            if (autostartToggle instanceof HTMLInputElement && autostartToggle.checked) {
              autostartToggle.checked = false;
              autostartToggle.dispatchEvent(new Event("change"));
            }
          };
        }
        renderAutostartControls();
        renderRuntimeDisclosureControls();
        const ttsRuntimeDisabledNote = document.getElementById("tts-runtime-disabled-note");
        const textToSpeechEnabled = normalizeBooleanEnv(state.envValues.TEXT_TO_SPEECH_ENABLED, "true") === "true";
        ttsRuntimeDisabledNote.hidden = textToSpeechEnabled;
        ttsRuntimeDisabledNote.textContent = textToSpeechEnabled
          ? ""
          : envCopy.runtimeTtsDisabled;
        document.getElementById("idle-clear-enabled").innerHTML = booleanOptionsHtml(isEnabledBySeconds(state.envValues.IDLE_CLEAR_SECONDS) ? "true" : "false");
        document.getElementById("idle-clear-enabled").value = isEnabledBySeconds(state.envValues.IDLE_CLEAR_SECONDS) ? "true" : "false";
        document.getElementById("idle-hard-reset-enabled").innerHTML = booleanOptionsHtml(isEnabledBySeconds(state.envValues.IDLE_HARD_RESET_SECONDS) ? "true" : "false");
        document.getElementById("idle-hard-reset-enabled").value = isEnabledBySeconds(state.envValues.IDLE_HARD_RESET_SECONDS) ? "true" : "false";
        document.getElementById("env-IDLE_CLEAR_SECONDS").value = state.envValues.IDLE_CLEAR_SECONDS || idleDefaults.IDLE_CLEAR_SECONDS;
        document.getElementById("env-IDLE_HARD_RESET_SECONDS").value = state.envValues.IDLE_HARD_RESET_SECONDS || idleDefaults.IDLE_HARD_RESET_SECONDS;
        document.getElementById("env-IDLE_CLEAR_SECONDS").disabled = !isEnabledBySeconds(state.envValues.IDLE_CLEAR_SECONDS);
        document.getElementById("env-IDLE_HARD_RESET_SECONDS").disabled = !isEnabledBySeconds(state.envValues.IDLE_HARD_RESET_SECONDS);
        document.getElementById("azure-key-field").classList.toggle("field-hidden", selectedProvider !== "azure");
        document.getElementById("azure-region-field").classList.toggle("field-hidden", selectedProvider !== "azure");
        document.getElementById("azure-translator-key-field").classList.toggle("field-hidden", selectedProvider !== "azure");
        document.getElementById("azure-translator-region-field").classList.toggle("field-hidden", selectedProvider !== "azure");
        document.getElementById("azure-translator-endpoint-field").classList.toggle("field-hidden", selectedProvider !== "azure");
        if (sharedCredentialsCard instanceof HTMLElement) {
          const sharedCredentialsVisible = selectedProvider === "azure";
          sharedCredentialsCard.classList.toggle("field-hidden", !sharedCredentialsVisible);
          sharedCredentialsCard.hidden = !sharedCredentialsVisible;
        }

        renderProviderValidationNotices();

        ["SELECTOR_UI_LANGUAGE_A","SELECTOR_UI_LANGUAGE_B","LOG_LEVEL","AZURE_SPEECH_KEY","AZURE_SPEECH_REGION","AZURE_TRANSLATOR_KEY","AZURE_TRANSLATOR_REGION","AZURE_TRANSLATOR_ENDPOINT","TEXT_TO_SPEECH_ENABLED","VISITOR_CONVERSATION_HISTORY_ENABLED","AUDIO_ECHO_CANCELLATION","AUDIO_NOISE_SUPPRESSION","AUDIO_CAPTURE_SETTINGS_DIAGNOSTICS_ENABLED","PROVIDER_LANGUAGE_CONTRACT_MODE","CHATGPT_STT_LANGUAGE_PROMPT_ENABLED","CHATGPT_TRANSLATION_DETECTED_LANGUAGE_MODE","OPENAI_TTS_LANGUAGE_INSTRUCTIONS_ENABLED","AZURE_TTS_LANG_ELEMENT_ENABLED","CHATGPT_MODEL","CHATGPT_TRANSCRIBE_MODEL","OLLAMA_BASE_URL","OLLAMA_MODEL","OLLAMA_REQUEST_TIMEOUT_MS","OLLAMA_STREAMING_ENABLED","OLLAMA_API_KEY","DEMO_SLIDE_INTERVAL_SECONDS"].forEach((key) => {
          const element = document.getElementById("env-" + key);
          element.oninput = () => {
            const nextValue =
              key === "DEMO_SLIDE_INTERVAL_SECONDS"
                ? (element.value.trim() || "8")
                : element.value;
            stageEnvValue({ [key]: nextValue });
          };
          element.onchange = async () => {
            await persistEnvValuePatch({
              [key]:
                key === "DEMO_SLIDE_INTERVAL_SECONDS"
                  ? (element.value.trim() || "8")
                  : element.value
            });
            await refreshPreview();
          };
        });
        [
          ["env-APP_MODE", "APP_MODE"],
          ["env-MICROPHONE_PTT_MODE", "MICROPHONE_PTT_MODE"]
        ].forEach(([elementId, key]) => {
          const element = document.getElementById(elementId);
          element.onchange = async () => {
            const nextRuntimeMode = key === "APP_MODE" ? resolveSupportedAppMode(element.value) : currentRuntimeMode;
            const nextMicrophonePttMode =
              key === "MICROPHONE_PTT_MODE" ? resolveMicrophonePttMode(element.value) : currentMicrophonePttMode;
            await persistEnvValuePatch(normalizedRuntimeEnvPatch(nextRuntimeMode, nextMicrophonePttMode));
            await refreshPreview();
          };
        });
        [
          ["idle-clear-enabled", "IDLE_CLEAR_SECONDS"],
          ["idle-hard-reset-enabled", "IDLE_HARD_RESET_SECONDS"]
        ].forEach(([toggleId, key]) => {
          const toggle = document.getElementById(toggleId);
          const idleInput = document.getElementById("env-" + key);
          toggle.onchange = async () => {
            const nextValue = toggle.value === "true"
              ? (isEnabledBySeconds(state.envValues[key]) ? state.envValues[key] : idleDefaults[key])
              : "0";
            await persistEnvValuePatch({ [key]: nextValue });
            await refreshPreview();
          };
          idleInput.oninput = () => {
            const trimmedValue = idleInput.value.trim();
            stageEnvValue({ [key]: trimmedValue || idleDefaults[key] });
          };
          idleInput.onchange = async () => {
            const trimmedValue = idleInput.value.trim();
            await persistEnvValuePatch({ [key]: trimmedValue || idleDefaults[key] });
            await refreshPreview();
          };
        });
        const providerKeys = {
          chatgpt: ["CHATGPT_API_KEY", "CHATGPT_MODEL", "CHATGPT_TRANSCRIBE_MODEL"],
          ollama: ["OLLAMA_BASE_URL", "OLLAMA_MODEL", "OLLAMA_REQUEST_TIMEOUT_MS", "OLLAMA_STREAMING_ENABLED", "OLLAMA_API_KEY"]
        };
        let visibleProviderCardCount = 0;
        Object.entries(providerKeys).forEach(([provider, keys]) => {
          const card = document.querySelector('[data-provider-card="' + provider + '"]');
          const cardVisible = provider === selectedProvider;
          if (card) {
            card.classList.toggle("hidden", !cardVisible);
            if (cardVisible) {
              visibleProviderCardCount += 1;
            }
          }
          keys.forEach((key) => {
            const input = document.getElementById("env-" + key);
            if (input) {
              if (key === "OLLAMA_STREAMING_ENABLED") {
                input.innerHTML = booleanOptionsHtml(normalizeBooleanEnv(state.envValues[key], "false"));
                input.value = normalizeBooleanEnv(state.envValues[key], "false");
              } else if (key === "OLLAMA_BASE_URL") {
                input.value = state.envValues[key] || "http://localhost:11434/api";
              } else if (key === "OLLAMA_MODEL") {
                input.value = state.envValues[key] || "gemma3";
              } else if (key === "OLLAMA_REQUEST_TIMEOUT_MS") {
                input.value = state.envValues[key] || "45000";
              } else {
                input.value = state.envValues[key] || "";
              }
              input.oninput = () => {
                stageEnvValue({ [key]: input.value });
              };
              input.onchange = async () => {
                await persistEnvValuePatch({ [key]: input.value });
                await refreshPreview();
              };
            }
          });
        });
        if (providerSpecificCard instanceof HTMLElement) {
          const providerSpecificVisible = visibleProviderCardCount > 0;
          providerSpecificCard.classList.toggle("field-hidden", !providerSpecificVisible);
          providerSpecificCard.hidden = !providerSpecificVisible;
        }

        const sourceLanguageA = resolveSourceLocaleFromTarget(
          state.envValues.DEFAULT_TARGET_LANG_A || "en",
          selectedProvider,
          "en-US"
        );
        const sourceSelect = document.getElementById("provider-test-source");
        const targetSelect = document.getElementById("provider-test-target");
        sourceSelect.innerHTML = sourceLanguageOptionsHtml(selectedProvider, sourceSelect.value || sourceLanguageA);
        targetSelect.innerHTML = targetLanguageOptionsHtml(targetSelect.value || "en", selectedProvider);
        sourceSelect.value = supportedSourceLanguageOptions(selectedProvider).some((option) => option.value === sourceLanguageA)
          ? sourceLanguageA
          : supportedSourceLanguageOptions(selectedProvider)[0]?.value || sourceLanguageA;
        targetSelect.value = normalizeTranslationTargetLanguageForProvider(targetSelect.value || "en", selectedProvider);
        const speechSourceSelect = document.getElementById("provider-speech-source");
        const speechTargetSelect = document.getElementById("provider-speech-target");
        const speechMicrophoneSelect = document.getElementById("provider-speech-microphone");
        speechSourceSelect.innerHTML = sourceLanguageOptionsHtml(selectedProvider, speechSourceSelect.value || sourceLanguageA);
        speechTargetSelect.innerHTML = targetLanguageOptionsHtml(speechTargetSelect.value || "en", selectedProvider);
        speechSourceSelect.value = supportedSourceLanguageOptions(selectedProvider).some((option) => option.value === speechSourceSelect.value)
          ? speechSourceSelect.value
          : supportedSourceLanguageOptions(selectedProvider).find((option) => option.value === sourceLanguageA)?.value
            || supportedSourceLanguageOptions(selectedProvider)[0]?.value
            || sourceLanguageA;
        speechTargetSelect.value = normalizeTranslationTargetLanguageForProvider(speechTargetSelect.value || "en", selectedProvider);
        speechMicrophoneSelect.innerHTML = microphoneSelectOptionsHtml(providerSpeechTestState.activeDeviceId || speechMicrophoneSelect.value || "", true);
        if (!state.microphones.some((microphone) => microphone.deviceId === speechMicrophoneSelect.value)) {
          speechMicrophoneSelect.value = "";
        }
        document.getElementById("provider-test-text").disabled = providerTestBusy || providerSpeechBusy;
        const ttsLanguageSelect = document.getElementById("tts-test-language");
        const ttsSelectedLanguage = resolveTargetLanguageForProvider(
          ttsLanguageSelect.value || state.envValues.DEFAULT_TARGET_LANG_A || "en",
          selectedProvider
        ).canonicalValue;
        ttsLanguageSelect.innerHTML = interactionLanguageOptionsHtml(ttsSelectedLanguage, selectedProvider);
        ttsLanguageSelect.value = ttsSelectedLanguage;
        const previousPlaybackSampleLanguage = ttsLanguageSelect.getAttribute("data-sample-language") || ttsSelectedLanguage;
        ttsLanguageSelect.setAttribute("data-sample-language", ttsSelectedLanguage);
        ttsLanguageSelect.onchange = () => {
          const nextPlaybackLanguage = resolveTargetLanguageForProvider(
            ttsLanguageSelect.value || ttsSelectedLanguage,
            selectedProvider
          ).canonicalValue;
          syncProviderPlaybackSampleForLanguage(
            ttsLanguageSelect.getAttribute("data-sample-language") || previousPlaybackSampleLanguage,
            nextPlaybackLanguage
          );
          ttsLanguageSelect.value = nextPlaybackLanguage;
          ttsLanguageSelect.setAttribute("data-sample-language", nextPlaybackLanguage);
        };
        renderProviderSpeechNotices();
        renderAsyncUi();
      }
      function renderProviderSpeechNotices() {
        const notices = [];
        const selectedProvider = state.envValues.TRANSLATION_PROVIDER || "chatgpt";
        const disabledState = currentProviderSpeechDisabledState();
        notices.push('<div class="notice info">' + escapeHtml(envCopy.providerCapabilityNote) + '</div>');
        if (selectedProvider === "ollama") {
          notices.push('<div class="notice info">' + escapeHtml(envCopy.providerSpeechOllamaUnavailable) + '</div>');
        } else if (!state.microphonePermissionGranted) {
          notices.push('<div class="notice warn">' + escapeHtml(envCopy.providerSpeechGrantPermission) + '</div>');
        } else if (state.microphones.length === 0) {
          notices.push('<div class="notice warn">' + escapeHtml(envCopy.providerSpeechNoMicrophone) + '</div>');
        } else if (providerSpeechTestState.inFlight && selectedProvider === "azure") {
          notices.push('<div class="notice info">' + escapeHtml(envCopy.providerSpeechAzureListening) + '</div>');
        } else if (selectedProvider === "azure") {
          notices.push('<div class="notice info">' + escapeHtml(envCopy.providerSpeechAzureReady) + '</div>');
        } else if (providerSpeechTestState.recorder) {
          notices.push('<div class="notice info">' + escapeHtml(envCopy.providerSpeechChatGptRecording) + '</div>');
        } else {
          notices.push('<div class="notice info">' + escapeHtml(envCopy.providerSpeechChatGptReady) + '</div>');
        }
        if (
          disabledState &&
          disabledState.message &&
          !notices.some((notice) => notice.includes(escapeHtml(disabledState.message)))
        ) {
          notices.push('<div id="provider-speech-disabled-reason" class="notice ' + escapeHtml(disabledState.tone) + '">' + escapeHtml(disabledState.message) + '</div>');
        }
        document.getElementById("provider-speech-notices").innerHTML = notices.join("");
      }
`;
}
