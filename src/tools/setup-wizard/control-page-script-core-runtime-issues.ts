export function getSetupWizardControlCoreRuntimeIssuesScript(): string {
  return `      function providerValue() {
        return (state.envValues.TRANSLATION_PROVIDER || "").trim();
      }
      function providerDisplayName(value) {
        return translationProviders.find((option) => option.value === value)?.label || value || copy.issueUnsupportedProvider;
      }
      function baseConfigurationIssues() {
        return getWizardConfigurationIssues(state);
      }
      function azureTextToSpeechCatalogRequired() {
        return providerValue() === "azure" && runtimeMode() !== "demo";
      }
      function azureTextToSpeechCatalogKey() {
        const envValues = state?.envValues || {};
        return [
          providerValue(),
          runtimeMode(),
          String(envValues.AZURE_SPEECH_REGION || "").trim(),
          String(envValues.AZURE_SPEECH_KEY || "").trim() ? "configured" : "missing"
        ].join("|");
      }
      function resetAzureTextToSpeechCatalog() {
        azureTextToSpeechCatalog = null;
        azureTextToSpeechCatalogRequestKey = "";
        azureTextToSpeechCatalogInFlight = null;
      }
      async function refreshAzureTextToSpeechCatalog(force = false) {
        if (!azureTextToSpeechCatalogRequired()) {
          resetAzureTextToSpeechCatalog();
          return null;
        }
        const nextKey = azureTextToSpeechCatalogKey();
        if (!force && nextKey === azureTextToSpeechCatalogRequestKey && azureTextToSpeechCatalog && !azureTextToSpeechCatalogInFlight) {
          return azureTextToSpeechCatalog;
        }
        if (!force && nextKey === azureTextToSpeechCatalogRequestKey && azureTextToSpeechCatalogInFlight) {
          return azureTextToSpeechCatalogInFlight;
        }
        azureTextToSpeechCatalogRequestKey = nextKey;
        azureTextToSpeechCatalogInFlight = Promise.resolve()
          .then(() => api?.getAzureTextToSpeechCatalog ? api.getAzureTextToSpeechCatalog() : null)
          .then((snapshot) => {
            azureTextToSpeechCatalog = snapshot || {
              region: String(state?.envValues?.AZURE_SPEECH_REGION || "").trim() || null,
              status: "unavailable",
              fetchedAt: null,
              freshUntil: null,
              voiceCount: 0,
              error: "Azure text-to-speech catalog is unavailable.",
              voices: []
            };
            return azureTextToSpeechCatalog;
          })
          .catch((error) => {
            azureTextToSpeechCatalog = {
              region: String(state?.envValues?.AZURE_SPEECH_REGION || "").trim() || null,
              status: "unavailable",
              fetchedAt: null,
              freshUntil: null,
              voiceCount: 0,
              error: error?.message || String(error),
              voices: []
            };
            return azureTextToSpeechCatalog;
          })
          .finally(() => {
            azureTextToSpeechCatalogInFlight = null;
            if (typeof render === "function") {
              render();
            }
          });
        return azureTextToSpeechCatalogInFlight;
      }
      function normalizeTextToSpeechLocale(value) {
        return String(value || "").trim().replace(/_/g, "-").toLowerCase();
      }
      function azureTextToSpeechCandidateLocales(language) {
        const requestedLanguage = String(language || "").trim();
        const mappedLocale = requestedLanguage
          ? sourceLocaleByTargetLanguageByProvider?.azure?.[requestedLanguage] || null
          : null;
        return [requestedLanguage, mappedLocale]
          .map((candidate) => normalizeTextToSpeechLocale(candidate))
          .filter((candidate, index, all) => Boolean(candidate) && all.indexOf(candidate) === index);
      }
      function pickAzureTextToSpeechVoice(language) {
        const voices = Array.isArray(azureTextToSpeechCatalog?.voices) ? azureTextToSpeechCatalog.voices : [];
        const candidateLocales = azureTextToSpeechCandidateLocales(language);
        const matchingVoices = voices.filter((voice) =>
          candidateLocales.includes(normalizeTextToSpeechLocale(voice.language))
        );
        return [...matchingVoices].sort((left, right) =>
          String(left.name || "").localeCompare(String(right.name || ""), "en")
        )[0] || null;
      }
      function currentTargetLanguageIssues() {
        const provider = providerValue();
        return ["A", "B"].flatMap((side) => {
          const targetKey = "DEFAULT_TARGET_LANG_" + side;
          const resolved = resolveTargetLanguageForProvider(state?.envValues?.[targetKey] || "", provider);
          if (!resolved.supported) {
            return [{
              code: "unsupported-target-language-" + side.toLowerCase(),
              message: "lingua iniziale " + side + " non supportata dal provider",
              detail: resolved.rawValue || "valore mancante"
            }];
          }

          return [];
        });
      }
      function currentConfigurationIssues() {
        const issues = [...baseConfigurationIssues(), ...currentTargetLanguageIssues(), ...azureTextToSpeechMissingEntries()];
        if (initialSetupMode) {
          const pwdInput = document.getElementById("wizard-password");
          const confirmInput = document.getElementById("wizard-confirm-password");
          const pwd = pwdInput ? pwdInput.value.trim() : "";
          const confirm = confirmInput ? confirmInput.value.trim() : "";
          if (!pwd) {
            issues.push({
              code: "missing-wizard-password",
              message: copy.issueMissingWizardPassword || "password del wizard non configurata",
              detail: "Scegli una password per proteggere il wizard in futuro."
            });
          } else if (pwd.length < 12) {
            issues.push({
              code: "wizard-password-too-short",
              message: copy.issueWizardPasswordTooShort || "password troppo corta",
              detail: "La password deve contenere almeno 12 caratteri."
            });
          } else if (pwd !== confirm) {
            issues.push({
              code: "wizard-password-mismatch",
              message: copy.issueWizardPasswordMismatch || "le password non coincidono",
              detail: "Verifica che la password di conferma sia uguale."
            });
          }
        }
        return issues;
      }
      function selectedInitialLanguagesForProvider(selectedProvider = providerValue()) {
        const languages = ["A", "B"]
          .map((side) => resolveTargetLanguageForProvider(state?.envValues?.["DEFAULT_TARGET_LANG_" + side] || "", selectedProvider))
          .filter((resolved) => resolved.supported)
          .map((resolved) => resolved.canonicalValue);
        return languages.filter((language, index, all) => Boolean(language) && all.indexOf(language) === index);
      }
      function targetLanguageSaveBlocked() {
        return saveBlockingIssues().some((issue) => issue.code.startsWith("unsupported-target-language-"));
      }
      function azureTextToSpeechMissingEntries() {
        if (!azureTextToSpeechCatalogRequired()) {
          return [];
        }
        if (baseConfigurationIssues().some((issue) =>
          issue.code === "unsupported-provider" || issue.code === "missing-provider-credentials"
        )) {
          return [];
        }
        if (currentTargetLanguageIssues().length > 0) {
          return [];
        }
        if (!azureTextToSpeechCatalog) {
          return [{
            code: "azure-tts-catalog-unavailable",
            message: "Azure text-to-speech catalog unavailable",
            detail: "catalog loading in progress"
          }];
        }
        if (
          azureTextToSpeechCatalog.status === "unavailable" ||
          !Array.isArray(azureTextToSpeechCatalog.voices) ||
          azureTextToSpeechCatalog.voices.length === 0
        ) {
          return [{
            code: "azure-tts-catalog-unavailable",
            message: "Azure text-to-speech catalog unavailable",
            detail:
              azureTextToSpeechCatalog.error ||
              (azureTextToSpeechCatalog.region ? "region " + azureTextToSpeechCatalog.region : "no voices available")
          }];
        }
        return ["A", "B"].flatMap((side) => {
          const resolved = resolveTargetLanguageForProvider(
            state?.envValues?.["DEFAULT_TARGET_LANG_" + side] || "",
            "azure"
          );
          if (!resolved.supported) {
            return [];
          }
          return pickAzureTextToSpeechVoice(resolved.canonicalValue)
            ? []
            : [{
                code: "unresolved-target-tts-" + side.toLowerCase(),
                message: "no compatible Azure voice for initial language " + side,
                detail: resolved.canonicalValue
              }];
        });
      }
      function azureTextToSpeechSaveBlocked() {
        return saveBlockingIssues().some((issue) =>
          issue.code === "azure-tts-catalog-unavailable" ||
          issue.code.startsWith("unsupported-chatgpt-tts-language-") ||
          issue.code.startsWith("unresolved-target-tts-")
        );
      }
      function providerConfigurationSaveBlocked() {
        return saveBlockingIssues().some((issue) =>
          issue.code === "unsupported-provider" || issue.code === "missing-provider-credentials"
        );
      }
      function saveBlockingIssues() {
        return currentConfigurationIssues().filter((issue) => {
          if (issue.code === "unsupported-provider" || issue.code === "missing-provider-credentials") {
            return true;
          }
          if (issue.code.startsWith("unsupported-target-language-")) {
            return true;
          }
          if (
            issue.code === "azure-tts-catalog-unavailable" ||
            issue.code.startsWith("unsupported-chatgpt-tts-language-") ||
            issue.code.startsWith("unresolved-target-tts-")
          ) {
            return true;
          }
          if (
            issue.code === "missing-wizard-password" ||
            issue.code === "wizard-password-too-short" ||
            issue.code === "wizard-password-mismatch"
          ) {
            return true;
          }
          return false;
        });
      }
      function saveBlockingReasonCode(blockingIssues = saveBlockingIssues()) {
        if (blockingIssues.some((issue) =>
          issue.code === "unsupported-provider" || issue.code === "missing-provider-credentials"
        )) {
          return "save-provider-configuration";
        }
        if (blockingIssues.some((issue) =>
          issue.code === "azure-tts-catalog-unavailable" ||
          issue.code.startsWith("unsupported-chatgpt-tts-language-") ||
          issue.code.startsWith("unresolved-target-tts-")
        )) {
          return "save-azure-tts";
        }
        if (blockingIssues.some((issue) => issue.code.startsWith("unsupported-target-language-"))) {
          return "save-target-languages";
        }
        if (blockingIssues.some((issue) =>
          issue.code === "missing-wizard-password" ||
          issue.code === "wizard-password-too-short" ||
          issue.code === "wizard-password-mismatch"
        )) {
          return "save-wizard-password";
        }
        return "";
      }
      function issuesByCode(codePrefix) {
        return currentConfigurationIssues().filter((issue) => issue.code.startsWith(codePrefix));
      }
      function issueSectionAndFieldId(code) {
        if (code.startsWith("missing-display") || code.startsWith("missing-microphone")) {
          const side = code.slice(-1).toUpperCase();
          return { section: "stations", fieldId: code.startsWith("missing-display") ? "station-monitor-" + side : "microphone-select-" + side };
        }
        if (code.startsWith("unsupported-target-language-")) {
          const side = code.slice(-1).toUpperCase();
          return { section: "languages", fieldId: "setup-language-choice-" + side };
        }
        if (
          code === "azure-tts-catalog-unavailable" ||
          code.startsWith("unsupported-chatgpt-tts-language-") ||
          code.startsWith("unresolved-target-tts-")
        ) {
          if (code === "azure-tts-catalog-unavailable") {
            return { section: "provider", fieldId: "provider-select" };
          }
          const side = code.slice(-1).toUpperCase();
          return { section: "languages", fieldId: "setup-language-choice-" + side };
        }
        if (code === "unsupported-provider" || code === "missing-provider-credentials") {
          return { section: "provider", fieldId: "provider-select" };
        }
        if (
          code === "missing-wizard-password" ||
          code === "wizard-password-too-short" ||
          code === "wizard-password-mismatch"
        ) {
          return { section: "save", fieldId: "wizard-password" };
        }
        return { section: "stations", fieldId: null };
      }
`;
}
