export function getSetupWizardControlLanguageScript(): string {
  return `      const languageCopyByLanguage = {
        it: {
            configuredLanguageOptgroup: "Lingua gia' configurata",
            selectSupportedLanguage: "Seleziona una lingua supportata",
            managedLanguageLabelPrefix: "Lingua gestita · ",
            managedLanguageDescriptionPrefix: "Seleziona una delle lingue gestite dall'app per ",
            configuredLabelPrefix: "Configurata: ",
            activeUiLanguageEnglish: "UI attiva: English",
            areaLabel: "Area",
            sourceLocaleLabel: "Locale sorgente",
            unsupportedCurrentConfigurationPrefix: "Configurazione corrente non supportata dal provider: ",
            missingValue: "valore mancante",
            continueBySelectingManagedLanguage: "Seleziona una lingua gestita per continuare.",
            unsupportedProviderSuffix: " (non supportato)",
            providerNotConfigured: "Provider non configurato",
            customOptionSuffix: " (custom)",
            selectMicrophone: "Seleziona microfono",
            assignedSidesPrefix: " [lati ",
            microphoneRecordingFailed: "Registrazione microfono fallita.",
            initialLanguagesReady: "Le lingue iniziali runtime sono pronte per il provider attivo.",
            initialLanguagesAttention: "La copertura lingue runtime iniziale richiede attenzione prima di Applica e chiudi in live mode.",
            languageCoverageSharedCatalog: "Il provider attivo controlla il catalogo condiviso usato per setup live iniziale e validazione playback.",
            azureCoverageMissing: "La copertura voce Azure non e' ancora risolta per questa lingua.",
            azureCoverageReady: "Voce Azure pronta: ",
            azureCoverageCatalogLoading: "Il catalogo voci Azure e' ancora in caricamento o non disponibile."
          },
        en: {
            configuredLanguageOptgroup: "Configured language",
            selectSupportedLanguage: "Select a supported language",
            managedLanguageLabelPrefix: "Managed language · ",
            managedLanguageDescriptionPrefix: "Select one of the app-managed languages for ",
            configuredLabelPrefix: "Configured: ",
            activeUiLanguageEnglish: "Active UI: English",
            areaLabel: "Area",
            sourceLocaleLabel: "Source locale",
            unsupportedCurrentConfigurationPrefix: "The current configuration is not supported by the provider: ",
            missingValue: "missing value",
            continueBySelectingManagedLanguage: "Select a managed language to continue.",
            unsupportedProviderSuffix: " (unsupported)",
            providerNotConfigured: "Provider not configured",
            customOptionSuffix: " (custom)",
            selectMicrophone: "Select microphone",
            assignedSidesPrefix: " [sides ",
            microphoneRecordingFailed: "Microphone recording failed.",
            initialLanguagesReady: "Initial runtime languages are ready for the active provider.",
            initialLanguagesAttention: "Initial runtime language coverage needs attention before live Apply and Close.",
            languageCoverageSharedCatalog: "The active provider controls the shared language catalog used for initial live setup and playback validation.",
            azureCoverageMissing: "Azure voice coverage is still unresolved for this language.",
            azureCoverageReady: "Azure voice ready: ",
            azureCoverageCatalogLoading: "Azure voice catalog is still loading or unavailable."
          }
      };
      languageCopyByLanguage.es = {
        ...languageCopyByLanguage.en,
        configuredLanguageOptgroup: "Idioma configurado",
        selectSupportedLanguage: "Selecciona un idioma compatible",
        managedLanguageLabelPrefix: "Idioma gestionado · ",
        managedLanguageDescriptionPrefix: "Selecciona uno de los idiomas gestionados por la app para ",
        configuredLabelPrefix: "Configurado: ",
        activeUiLanguageEnglish: "UI activa: English",
        areaLabel: "Area",
        sourceLocaleLabel: "Locale de origen",
        unsupportedCurrentConfigurationPrefix: "La configuracion actual no es compatible con el proveedor: ",
        missingValue: "valor faltante",
        continueBySelectingManagedLanguage: "Selecciona un idioma gestionado para continuar.",
        unsupportedProviderSuffix: " (no compatible)",
        providerNotConfigured: "Proveedor no configurado",
        customOptionSuffix: " (custom)",
        selectMicrophone: "Selecciona microfono",
        assignedSidesPrefix: " [lados ",
        microphoneRecordingFailed: "La grabacion del microfono fallo.",
        initialLanguagesReady: "Los idiomas iniciales runtime estan listos para el proveedor activo.",
        initialLanguagesAttention: "La cobertura de idiomas runtime inicial requiere atencion antes de Aplicar y cerrar en live mode.",
        languageCoverageSharedCatalog: "El proveedor activo controla el catalogo compartido usado para el setup live inicial y la validacion de reproduccion.",
        azureCoverageMissing: "La cobertura de voz Azure todavia no esta resuelta para este idioma.",
        azureCoverageReady: "Voz Azure lista: ",
        azureCoverageCatalogLoading: "El catalogo de voces Azure sigue cargando o no esta disponible."
      };
      languageCopyByLanguage.fr = {
        ...languageCopyByLanguage.en,
        configuredLanguageOptgroup: "Langue configuree",
        selectSupportedLanguage: "Selectionnez une langue prise en charge",
        managedLanguageLabelPrefix: "Langue geree · ",
        managedLanguageDescriptionPrefix: "Selectionnez une des langues gerees par l'application pour ",
        configuredLabelPrefix: "Configuree : ",
        activeUiLanguageEnglish: "UI active : English",
        areaLabel: "Zone",
        sourceLocaleLabel: "Locale source",
        unsupportedCurrentConfigurationPrefix: "La configuration actuelle n'est pas prise en charge par le fournisseur : ",
        missingValue: "valeur manquante",
        continueBySelectingManagedLanguage: "Selectionnez une langue geree pour continuer.",
        unsupportedProviderSuffix: " (non pris en charge)",
        providerNotConfigured: "Fournisseur non configure",
        customOptionSuffix: " (custom)",
        selectMicrophone: "Selectionnez le microphone",
        assignedSidesPrefix: " [cotes ",
        microphoneRecordingFailed: "L'enregistrement du microphone a echoue.",
        initialLanguagesReady: "Les langues initiales runtime sont pretes pour le fournisseur actif.",
        initialLanguagesAttention: "La couverture des langues runtime initiales demande une action avant Appliquer et fermer en mode live.",
        languageCoverageSharedCatalog: "Le fournisseur actif controle le catalogue partage utilise pour le setup live initial et la validation de lecture.",
        azureCoverageMissing: "La couverture vocale Azure n'est pas encore resolue pour cette langue.",
        azureCoverageReady: "Voix Azure prete : ",
        azureCoverageCatalogLoading: "Le catalogue vocal Azure est encore en chargement ou indisponible."
      };
      languageCopyByLanguage.de = {
        ...languageCopyByLanguage.en,
        configuredLanguageOptgroup: "Konfigurierte Sprache",
        selectSupportedLanguage: "Waehlen Sie eine unterstuetzte Sprache",
        managedLanguageLabelPrefix: "Verwaltete Sprache · ",
        managedLanguageDescriptionPrefix: "Waehlen Sie eine der von der App verwalteten Sprachen fuer ",
        configuredLabelPrefix: "Konfiguriert: ",
        activeUiLanguageEnglish: "Aktive UI: English",
        areaLabel: "Bereich",
        sourceLocaleLabel: "Quell-Locale",
        unsupportedCurrentConfigurationPrefix: "Die aktuelle Konfiguration wird vom Anbieter nicht unterstuetzt: ",
        missingValue: "fehlender Wert",
        continueBySelectingManagedLanguage: "Waehlen Sie eine verwaltete Sprache, um fortzufahren.",
        unsupportedProviderSuffix: " (nicht unterstuetzt)",
        providerNotConfigured: "Anbieter nicht konfiguriert",
        customOptionSuffix: " (custom)",
        selectMicrophone: "Mikrofon auswaehlen",
        assignedSidesPrefix: " [Seiten ",
        microphoneRecordingFailed: "Mikrofonaufnahme fehlgeschlagen.",
        initialLanguagesReady: "Die initialen Runtime-Sprachen sind fuer den aktiven Anbieter bereit.",
        initialLanguagesAttention: "Die initiale Runtime-Sprachabdeckung braucht Aufmerksamkeit, bevor im Live-Modus Anwenden und schliessen moeglich ist.",
        languageCoverageSharedCatalog: "Der aktive Anbieter steuert den gemeinsamen Katalog fuer initiales Live-Setup und Wiedergabevalidierung.",
        azureCoverageMissing: "Die Azure-Sprachabdeckung ist fuer diese Sprache noch nicht aufgeloest.",
        azureCoverageReady: "Azure-Stimme bereit: ",
        azureCoverageCatalogLoading: "Der Azure-Stimmenkatalog wird noch geladen oder ist nicht verfuegbar."
      };
      languageCopyByLanguage.zh = {
        ...languageCopyByLanguage.en,
        configuredLanguageOptgroup: "已配置语言",
        selectSupportedLanguage: "选择受支持的语言",
        managedLanguageLabelPrefix: "受管语言 · ",
        managedLanguageDescriptionPrefix: "为以下工作站选择应用已管理的语言：",
        configuredLabelPrefix: "已配置：",
        activeUiLanguageEnglish: "当前 UI：English",
        areaLabel: "区域",
        sourceLocaleLabel: "源 locale",
        unsupportedCurrentConfigurationPrefix: "当前配置不受该服务商支持：",
        missingValue: "缺失值",
        continueBySelectingManagedLanguage: "请选择受管语言后继续。",
        unsupportedProviderSuffix: "（不支持）",
        providerNotConfigured: "服务商未配置",
        customOptionSuffix: "（custom）",
        selectMicrophone: "选择麦克风",
        assignedSidesPrefix: " [侧别 ",
        microphoneRecordingFailed: "麦克风录音失败。",
        initialLanguagesReady: "初始 runtime 语言已对当前服务商就绪。",
        initialLanguagesAttention: "初始 runtime 语言覆盖在 live 模式下执行“应用并关闭”前仍需处理。",
        languageCoverageSharedCatalog: "当前服务商控制着用于初始 live setup 和播放校验的共享语言目录。",
        azureCoverageMissing: "该语言的 Azure 语音覆盖仍未解决。",
        azureCoverageReady: "Azure 语音已就绪：",
        azureCoverageCatalogLoading: "Azure 语音目录仍在加载中或当前不可用。"
      };
      let languageCopy = languageCopyByLanguage[wizardUiLanguage] || languageCopyByLanguage.en;
      function syncLocalizedCopies(nextLanguage) {
        languageCopy = languageCopyByLanguage[nextLanguage] || languageCopyByLanguage.en;
        envCopy = envCopyByLanguage[nextLanguage] || envCopyByLanguage.en;
        actionsCopy = actionsCopyByLanguage[nextLanguage] || actionsCopyByLanguage.en;
      }
      function supportedSourceLanguageOptions(provider) {
        return sourceLanguageOptionsByProvider[provider] || sourceLanguageOptionsByProvider.chatgpt;
      }
      function sourceLanguageOptionsHtml(provider, selectedValue) {
        return supportedSourceLanguageOptions(provider).map((option) => {
          const selected = option.value === selectedValue ? " selected" : "";
          return '<option value="' + escapeHtml(option.value) + '"' + selected + '>' + escapeHtml(option.label) + '</option>';
        }).join("");
      }
      function supportedInteractionLanguageChoices(provider) {
        return interactionLanguageChoicesByProvider[provider] || interactionLanguageChoicesByProvider.chatgpt;
      }
      function resolveTargetLanguageForProvider(value, provider) {
        const rawValue = String(value || "").trim();
        if (!rawValue) {
          return { rawValue, canonicalValue: "", supported: false, choice: null, selectable: false };
        }
        const loweredValue = rawValue.toLowerCase();
        const choices = supportedInteractionLanguageChoices(provider);
        const directChoice = choices.find((choice) => choice.value.toLowerCase() === loweredValue) || null;
        if (directChoice) {
          return {
            rawValue,
            canonicalValue: directChoice.value,
            supported: true,
            choice: directChoice,
            selectable: supportedInteractionLanguageCodes(provider).includes(directChoice.value)
          };
        }
        const sourceLocaleChoice =
          choices.find((choice) => String(choice.sourceLocale || "").trim().toLowerCase() === loweredValue) || null;
        if (sourceLocaleChoice) {
          return {
            rawValue,
            canonicalValue: sourceLocaleChoice.value,
            supported: true,
            choice: sourceLocaleChoice,
            selectable: supportedInteractionLanguageCodes(provider).includes(sourceLocaleChoice.value)
          };
        }
        return { rawValue, canonicalValue: rawValue, supported: false, choice: null, selectable: false };
      }
      function supportedInteractionLanguageCodes(provider) {
        return interactionLanguageSupportedCodesByProvider[provider] || interactionLanguageSupportedCodesByProvider.chatgpt;
      }
      function supportedInteractionLanguageGroups(provider) {
        return interactionLanguageOptionGroupsByProvider[provider] || interactionLanguageOptionGroupsByProvider.chatgpt;
      }
      function interactionLanguageLabel(provider, value) {
        const labels = interactionLanguageLabelsByProvider[provider] || interactionLanguageLabelsByProvider.chatgpt;
        return labels[value] || value;
      }
      function interactionLanguageFlagMarkup(provider, value) {
        const flags = interactionLanguageFlagMarkupByProvider[provider] || interactionLanguageFlagMarkupByProvider.chatgpt;
        return flags[value] || "";
      }
      function supportedTranslationTargetGroups(provider) {
        return translationTargetOptionGroupsByProvider[provider] || translationTargetOptionGroupsByProvider.chatgpt;
      }
      function supportedSourceLocaleMap(provider) {
        return sourceLocaleByTargetLanguageByProvider[provider] || sourceLocaleByTargetLanguageByProvider.chatgpt;
      }
      function normalizeTargetLanguageForProvider(value, provider, fallback = "en") {
        const resolved = resolveTargetLanguageForProvider(value, provider);
        if (resolved.supported) {
          return resolved.canonicalValue;
        }
        return fallback;
      }
      function interactionLanguageOptionsHtml(selectedValue, provider) {
        const resolvedSelection = resolveTargetLanguageForProvider(selectedValue, provider);
        const normalizedValue = resolvedSelection.supported ? resolvedSelection.canonicalValue : "";
        const selectableOptions = supportedInteractionLanguageGroups(provider).map((group) => {
          const optionsHtml = group.options.map((option) => {
            const selected = option.value === normalizedValue ? " selected" : "";
            return '<option value="' + escapeHtml(option.value) + '"' + selected + '>' + escapeHtml(option.label) + '</option>';
          }).join("");
          return '<optgroup label="' + escapeHtml(group.label) + '">' + optionsHtml + '</optgroup>';
        }).join("");
        if (resolvedSelection.supported && !resolvedSelection.selectable && resolvedSelection.choice) {
          return '<optgroup label="' + escapeHtml(languageCopy.configuredLanguageOptgroup) + '">'
            + '<option value="' + escapeHtml(resolvedSelection.choice.value) + '" selected>'
            + escapeHtml(resolvedSelection.choice.nativeLabel || resolvedSelection.choice.label || resolvedSelection.choice.value)
            + "</option></optgroup>"
            + selectableOptions;
        }
        if (!resolvedSelection.supported && resolvedSelection.rawValue) {
          return '<option value="" selected>' + escapeHtml(languageCopy.selectSupportedLanguage) + '</option>' + selectableOptions;
        }
        return selectableOptions;
      }
      function normalizeTranslationTargetLanguageForProvider(value, provider) {
        const groups = supportedTranslationTargetGroups(provider);
        const options = groups.flatMap((group) => group.options);
        if (options.some((option) => option.value === value)) {
          return value;
        }
        return options.find((option) => option.value === "en")?.value || options[0]?.value || "en";
      }
      function targetLanguageOptionsHtml(selectedValue, provider) {
        const normalizedValue = normalizeTranslationTargetLanguageForProvider(selectedValue, provider);
        return supportedTranslationTargetGroups(provider).map((group) => {
          const optionsHtml = group.options.map((option) => {
            const selected = option.value === normalizedValue ? " selected" : "";
            return '<option value="' + escapeHtml(option.value) + '"' + selected + '>' + escapeHtml(option.label) + '</option>';
          }).join("");
          return '<optgroup label="' + escapeHtml(group.label) + '">' + optionsHtml + '</optgroup>';
        }).join("");
      }
      function resolveSourceLocaleFromTarget(targetLanguage, provider, fallback = "en-US") {
        const resolvedTarget = resolveTargetLanguageForProvider(targetLanguage, provider);
        if (!resolvedTarget.supported) {
          return fallback;
        }
        return supportedSourceLocaleMap(provider)[resolvedTarget.canonicalValue] || fallback;
      }
      function displayLanguageChoiceLabel(choice) {
        if (!choice) {
          return "";
        }
        return choice.label || choice.nativeLabel || choice.value || "";
      }
      function displayLanguageChoiceNativeLabel(choice) {
        if (!choice) {
          return "";
        }
        const nativeLabel = choice.nativeLabel || "";
        const primaryLabel = displayLanguageChoiceLabel(choice);
        return nativeLabel && nativeLabel !== primaryLabel && nativeLabel !== choice.label ? nativeLabel : "";
      }
      function renderSetupLanguageSelector(side, provider) {
        const targetKey = "DEFAULT_TARGET_LANG_" + side;
        const presentation = wizardSidePresentation[side];
        const configuredValue = String(state.envValues[targetKey] || "en").trim();
        const resolvedSelection = resolveTargetLanguageForProvider(configuredValue, provider);
        const selectedValue = resolvedSelection.supported ? resolvedSelection.canonicalValue : "";
        const selectedChoice = resolvedSelection.choice;
        const sourceLocale = resolveSourceLocaleFromTarget(selectedValue, provider, "en-US");
        const sourceLocaleLabel = supportedSourceLanguageOptions(provider).find((item) => item.value === sourceLocale)?.label || sourceLocale;
        const configuredLabel = configuredValue && resolvedSelection.supported && configuredValue !== selectedValue
          ? interactionLanguageLabel(provider, configuredValue)
          : "";
        const selector = document.getElementById("setup-language-selector-" + side);
        const hiddenSelect = document.getElementById("env-" + targetKey);
        if (!selector || !hiddenSelect) {
          return;
        }
        hiddenSelect.innerHTML = interactionLanguageOptionsHtml(selectedValue, provider);
        hiddenSelect.value = selectedValue;
        const selectedChoiceLabel = selectedChoice ? displayLanguageChoiceLabel(selectedChoice) : "";
        const selectedChoiceNativeLabel = displayLanguageChoiceNativeLabel(selectedChoice);
        selector.innerHTML = '<div class="setup-language-selector-simple">'
          + '<div class="setup-language-select-card">'
          + '<label>' + escapeHtml(languageCopy.managedLanguageLabelPrefix + presentation.stationSubtitle) + '<select id="setup-language-choice-' + side + '" class="setup-language-select">' + interactionLanguageOptionsHtml(selectedValue, provider) + '</select></label>'
          + '<p class="setup-language-description">' + escapeHtml(languageCopy.managedLanguageDescriptionPrefix + presentation.stationTitle) + '.</p>'
          + '</div>'
          + (selectedChoice ? '<div class="setup-language-info-card">'
            + '<div class="setup-language-selected">'
            + '<span class="setup-language-flag-badge" aria-hidden="true">' + interactionLanguageFlagMarkup(provider, selectedChoice.value) + '</span>'
            + '<div><strong>' + escapeHtml(selectedChoiceLabel) + '</strong>'
            + (selectedChoiceNativeLabel ? '<span>' + escapeHtml(selectedChoiceNativeLabel) + '</span>' : '')
            + (configuredLabel ? '<span class="setup-language-fallback-note">' + escapeHtml(languageCopy.configuredLabelPrefix + configuredLabel) + '</span>' : '')
            + (selectedChoice.fallsBackToEnglish ? '<span class="setup-language-fallback-note">' + escapeHtml(languageCopy.activeUiLanguageEnglish) + '</span>' : '')
            + '</div>'
            + '</div>'
              + '<div class="setup-language-meta"><span>' + escapeHtml(languageCopy.areaLabel) + ': ' + escapeHtml((selectedChoice.macroAreaLabels || [selectedChoice.macroAreaLabel]).join(", ")) + '</span><span>' + escapeHtml(languageCopy.sourceLocaleLabel) + ': ' + escapeHtml(sourceLocaleLabel) + '</span></div>'
            + '</div>' : '<div class="setup-language-info-card"><div class="notice warn">' + escapeHtml(languageCopy.unsupportedCurrentConfigurationPrefix + (configuredValue || languageCopy.missingValue) + ". " + languageCopy.continueBySelectingManagedLanguage) + '</div></div>')
          + '</div>';
        const languageSelect = document.getElementById("setup-language-choice-" + side);
        if (languageSelect) {
          languageSelect.addEventListener("change", async () => {
            if (!languageSelect.value) {
              return;
            }
            const nextValue = normalizeTargetLanguageForProvider(languageSelect.value, provider);
            await persistEnvValuePatch({ [targetKey]: nextValue });
            await refreshPreview();
          });
        }
      }
      function renderInitialLanguageNotices(provider) {
        const noticesContainer = document.getElementById("initial-language-notices");
        const guidanceContainer = document.getElementById("initial-language-guidance-content");
        const guidanceDisclosure = document.getElementById("initial-language-guidance");
        if (!noticesContainer) {
          return;
        }
        const targetIssues = currentTargetLanguageIssues();
        const azureIssues = azureTextToSpeechMissingEntries();
        const notices = [];
        if (targetIssues.length === 0 && azureIssues.length === 0) {
          notices.push('<div class="notice info">' + escapeHtml(languageCopy.initialLanguagesReady) + '</div>');
        } else {
          notices.push('<div class="notice warn"><strong>' + escapeHtml(languageCopy.initialLanguagesAttention) + '</strong></div>');
          [...targetIssues, ...azureIssues].forEach((issue) => {
            const localizedIssue = localizeWizardIssue(issue);
            notices.push('<div class="notice ' + escapeHtml(issue.code.startsWith("unresolved-target-tts-") || issue.code === "azure-tts-catalog-unavailable" ? "warn" : "info") + '"><strong>' + escapeHtml(localizedIssue.message) + '</strong>' + (localizedIssue.detail ? '<span>' + escapeHtml(localizedIssue.detail) + '</span>' : "") + '</div>');
          });
        }
        noticesContainer.innerHTML = notices.join("");
        noticesContainer.hidden = notices.length === 0;

        const guidance = ['<div class="notice info">' + escapeHtml(languageCopy.languageCoverageSharedCatalog) + '</div>'];
        if (provider === "azure") {
          if (!azureTextToSpeechCatalog || azureTextToSpeechCatalog.status === "unavailable") {
            guidance.push('<div class="notice warn">' + escapeHtml(languageCopy.azureCoverageCatalogLoading) + '</div>');
          } else {
            ["A", "B"].forEach((side) => {
              const resolved = resolveTargetLanguageForProvider(state?.envValues?.["DEFAULT_TARGET_LANG_" + side] || "", provider);
              if (!resolved.supported) {
                return;
              }
              const voice = pickAzureTextToSpeechVoice(resolved.canonicalValue);
              guidance.push(
                '<div class="notice ' + (voice ? "info" : "warn") + '"><strong>' + escapeHtml(sidePresentation(side).stationTitle) + '</strong><span>' +
                escapeHtml(
                  voice
                    ? languageCopy.azureCoverageReady + resolved.canonicalValue + " · " + (voice.name || voice.shortName || voice.id || "")
                    : resolved.canonicalValue + " · " + languageCopy.azureCoverageMissing
                ) +
                '</span></div>'
              );
            });
          }
        }
        if (guidanceContainer) {
          guidanceContainer.innerHTML = guidance.join("");
          guidanceContainer.hidden = guidance.length === 0;
        }
        if (guidanceDisclosure) {
          guidanceDisclosure.hidden = guidance.length === 0;
        }
      }
      function translationProviderOptionsHtml(selectedValue) {
        const normalizedOptions = [...translationProviders];
        if (!normalizedOptions.some((option) => option.value === selectedValue)) {
          normalizedOptions.unshift({
            value: selectedValue,
            label: selectedValue ? selectedValue + languageCopy.unsupportedProviderSuffix : languageCopy.providerNotConfigured
          });
        }
        return normalizedOptions.map((option) => {
          const selected = option.value === selectedValue ? " selected" : "";
          return '<option value="' + escapeHtml(option.value) + '"' + selected + '>' + escapeHtml(option.label) + '</option>';
        }).join("");
      }
      function genericOptionsHtml(options, selectedValue) {
        const normalizedOptions = [...options];
        if (selectedValue && !normalizedOptions.some((option) => option.value === selectedValue)) {
          normalizedOptions.unshift({ value: selectedValue, label: selectedValue + languageCopy.customOptionSuffix });
        }
        return normalizedOptions.map((option) => {
          const selected = option.value === selectedValue ? " selected" : "";
          return '<option value="' + escapeHtml(option.value) + '"' + selected + '>' + escapeHtml(option.label) + '</option>';
        }).join("");
      }
      function microphoneSelectOptionsHtml(selectedValue, includeUnassigned = true) {
        const options = [includeUnassigned ? '<option value="">' + escapeHtml(languageCopy.selectMicrophone) + "</option>" : ""];
        const grouped = groupMicrophones();
        for (const key of microphoneCategoryOrder) {
          const group = grouped.get(key);
          if (!group || group.items.length === 0) { continue; }
          options.push('<optgroup label="' + escapeHtml(group.label) + '">');
          for (const microphone of group.items) {
            const sideLabel = microphone.assignedSides.length > 0 ? languageCopy.assignedSidesPrefix + microphone.assignedSides.join("+") + "]" : "";
            const selected = microphone.deviceId === selectedValue ? " selected" : "";
            options.push('<option value="' + escapeHtml(microphone.deviceId) + '"' + selected + '>' + escapeHtml(microphoneDisplayName(microphone) + sideLabel) + '</option>');
          }
          options.push("</optgroup>");
        }
        return options.join("");
      }
      function toBase64(arrayBuffer) {
        let binary = "";
        const bytes = new Uint8Array(arrayBuffer);
        const chunkSize = 0x8000;
        for (let index = 0; index < bytes.length; index += chunkSize) {
          const chunk = bytes.subarray(index, index + chunkSize);
          binary += String.fromCharCode(...chunk);
        }
        return btoa(binary);
      }
      function pickSupportedRecordingMimeType() {
        const candidates = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/mp4",
          "audio/ogg;codecs=opus"
        ];
        return candidates.find((candidate) => window.MediaRecorder && MediaRecorder.isTypeSupported(candidate)) || "";
      }
      function resetProviderSpeechTestState() {
        const recorder = providerSpeechTestState.recorder;
        if (recorder) {
          try {
            recorder.ondataavailable = null;
            recorder.onstop = null;
            recorder.onerror = null;
            if (typeof recorder.state !== "string" || recorder.state !== "inactive") {
              recorder.stop();
            }
          } catch {}
        }
        try {
          providerSpeechTestState.stream?.getTracks?.().forEach((track) => track.stop());
        } catch {}
        providerSpeechTestState.stream = null;
        providerSpeechTestState.recorder = null;
        providerSpeechTestState.mimeType = "";
        providerSpeechTestState.activeDeviceId = "";
        providerSpeechTestState.chunks = [];
        providerSpeechTestState.inFlight = false;
      }
      async function stopProviderSpeechRecorder() {
        const recorder = providerSpeechTestState.recorder;
        if (!recorder) {
          return null;
        }
        return await new Promise((resolve, reject) => {
          recorder.onstop = async () => {
            try {
              const blob = new Blob(providerSpeechTestState.chunks, { type: providerSpeechTestState.mimeType || "audio/webm" });
              providerSpeechTestState.stream?.getTracks().forEach((track) => track.stop());
              providerSpeechTestState.stream = null;
              providerSpeechTestState.recorder = null;
              providerSpeechTestState.mimeType = "";
              providerSpeechTestState.activeDeviceId = "";
              providerSpeechTestState.chunks = [];
              const audioBase64 = toBase64(await blob.arrayBuffer());
              resolve({
                audioBase64,
                audioMimeType: blob.type || providerSpeechTestState.mimeType || "audio/webm"
              });
            } catch (error) {
              reject(error);
            }
          };
          recorder.onerror = (event) => {
            resetProviderSpeechTestState();
            reject(event.error || new Error(languageCopy.microphoneRecordingFailed));
          };
          recorder.stop();
        });
      }
`;
}
