export function getSetupWizardControlCoreRenderScript(): string {
  return `      function sectionHasIssues(section) {
        const issues = currentConfigurationIssues();
        return issues.some((issue) => issueSectionAndFieldId(issue.code).section === section);
      }
      function renderSectionDots() {
        supportedSections.forEach((section) => {
          const dot = document.querySelector('[data-section-dot="' + section + '"]');
          if (!dot) { return; }
          const hasIssues = sectionHasIssues(section);
          dot.innerHTML = hasIssues ? "&#9675;" : "&#9679;";
          dot.setAttribute("aria-label", hasIssues ? copy.sectionNeedsAttention : copy.sectionComplete);
        });
      }
      function currentProbeMicrophonesDisabledState() {
        if (!isActionBusy("probingMicrophones")) {
          return null;
        }
        return {
          code: "probe-microphones-busy",
          message: copy.probeMicrophonesDisabledReason,
          tone: "info"
        };
      }
      function currentSaveDisabledState() {
        if (isActionBusy("saveSection") || isActionBusy("saveAndClose")) {
          return {
            code: "save-busy",
            message: copy.saveDisabledBusy,
            tone: "info"
          };
        }
        const blockingIssues = saveBlockingIssues();
        const reasonCode = saveBlockingReasonCode(blockingIssues);
        if (!reasonCode) {
          return null;
        }
        return {
          code: reasonCode,
          message: buildSaveBlockingMessage(blockingIssues),
          tone: "warn"
        };
      }
      function currentProviderSpeechDisabledState() {
        if (providerValue() === "ollama") {
          return {
            code: "provider-speech-unsupported-provider",
            message: copy.providerSpeechDisabledUnsupported,
            tone: "warn"
          };
        }
        if (isActionBusy("providerSpeech")) {
          return {
            code: "provider-speech-busy",
            message: copy.providerSpeechDisabledBusy,
            tone: "info"
          };
        }
        if (isActionBusy("providerTest")) {
          return {
            code: "provider-speech-provider-test-busy",
            message: copy.providerSpeechDisabledProviderTest,
            tone: "warn"
          };
        }
        if ((state?.microphones?.length || 0) === 0) {
          return {
            code: "provider-speech-no-microphones",
            message: state?.microphonePermissionGranted
              ? envCopy.providerSpeechNoMicrophone
              : envCopy.providerSpeechGrantPermission,
            tone: "warn"
          };
        }
        if (providerSpeechTestState.inFlight) {
          return {
            code: "provider-speech-live-in-flight",
            message: copy.providerSpeechDisabledInFlight,
            tone: "info"
          };
        }
        return null;
      }
      function renderChecklist() {
        const issues = currentConfigurationIssues();
        const checklist = document.getElementById("required-config-checklist");
        if (!checklist) {
          return;
        }
        if (issues.length === 0) {
          checklist.innerHTML = '<div class="checklist-item checklist-item-ok"><strong>' + escapeHtml(copy.checklistReadyTitle) + '</strong><span>' + escapeHtml(copy.checklistReadyBody) + '</span></div>';
          return;
        }
        checklist.innerHTML = issues.map((issue) => {
          const target = issueSectionAndFieldId(issue.code);
          const localizedIssue = localizeWizardIssue(issue);
          return '<button type="button" class="checklist-item checklist-item-warn" data-checklist-section="' + escapeHtml(target.section) + '"' + (target.fieldId ? ' data-checklist-field="' + escapeHtml(target.fieldId) + '"' : '') + '><strong>' + escapeHtml(localizedIssue.message) + '</strong>'
          + (localizedIssue.detail ? '<span>' + escapeHtml(localizedIssue.detail) + '</span>' : '')
          + '</button>';
        }).join("");
        checklist.querySelectorAll("[data-checklist-section]").forEach((button) => {
          button.addEventListener("click", () => {
            const section = button.getAttribute("data-checklist-section");
            const fieldId = button.getAttribute("data-checklist-field");
            if (section) {
              setActiveSection(section, { scroll: true, focus: false });
            }
            if (fieldId) {
              const field = document.getElementById(fieldId);
              if (field && typeof field.scrollIntoView === "function") {
                field.scrollIntoView({ behavior: "smooth", block: "center" });
              }
              if (field && typeof field.focus === "function") {
                window.setTimeout(() => { field.focus({ preventScroll: true }); }, 180);
              }
            }
          });
        });
      }
      function sideSummaryCardHtml(side, kind) {
        const presentation = sidePresentation(side);
        const themeClass = "side-card side-" + side;
        if (kind === "display") {
          const display = selectedDisplay(side);
          return '<article class="' + themeClass + '"><div class="side-card-head"><span class="side-badge side-' + side + '">' + escapeHtml(presentation.stationTitle) + '</span><span class="side-caption">' + escapeHtml(presentation.stationSubtitle) + '</span></div><strong>' + escapeHtml(display ? display.label : copy.displayPending) + '</strong><span>' + escapeHtml(display ? copy.displayIdLabel + " " + display.displayId : formatCopy(copy.displayUnassignedSide, { side })) + '</span></article>';
        }
        const microphone = selectedMicrophone(side);
        return '<article class="' + themeClass + '"><div class="side-card-head"><span class="side-badge side-' + side + '">' + escapeHtml(presentation.stationTitle) + '</span><span class="side-caption">' + escapeHtml(presentation.stationSubtitle) + '</span></div><strong>' + escapeHtml(microphone ? microphoneDisplayName(microphone) : copy.microphonePending) + '</strong><span>' + escapeHtml(microphone ? formatCopy(copy.microphoneAssignedToSide, { side }) : formatCopy(copy.microphoneUnassignedSide, { side })) + '</span></article>';
      }
      function renderOverviewStrip() {
        const container = document.getElementById("wizard-overview-strip");
        if (!container) {
          return;
        }
        const issues = currentConfigurationIssues();
        const azureSaveBlocked = azureTextToSpeechSaveBlocked();
        const targetLanguageBlocked = targetLanguageSaveBlocked();
        const autostartState = state?.autostart;
        const autostartReviewLabel = !autostartState?.supported
          ? copy.reviewAutostartDisabled
          : autostartState.currentEnabled !== autostartState.selectedEnabled
            ? (autostartState.selectedEnabled ? copy.reviewAutostartPendingEnable : copy.reviewAutostartPendingDisable)
            : (autostartState.selectedEnabled ? copy.reviewAutostartEnabled : copy.reviewAutostartDisabled);
        container.innerHTML = [
          '<div class="review-chip ' + (issues.length === 0 ? "is-ok" : "is-warn") + '"><strong>' + escapeHtml(copy.reviewChecklist) + '</strong><span>' + escapeHtml(issues.length === 0 ? copy.reviewReadyToSave : formatCopy(copy.reviewOpenItems, { count: issues.length })) + '</span></div>',
          '<div class="review-chip"><strong>' + escapeHtml(copy.reviewProvider) + '</strong><span>' + escapeHtml(providerDisplayName(providerValue())) + '</span></div>',
          '<div class="review-chip"><strong>' + escapeHtml(copy.reviewAiNotice) + '</strong><span>' + escapeHtml(runtimeDisclosureModeLabel(runtimeDisclosureMode())) + '</span></div>',
          '<div class="review-chip"><strong>' + escapeHtml(copy.reviewAutostart) + '</strong><span>' + escapeHtml(autostartReviewLabel) + '</span></div>',
          '<div class="review-chip ' + (targetLanguageBlocked ? "is-error" : "is-ok") + '"><strong>' + escapeHtml(copy.reviewInitialLanguages) + '</strong><span>' + escapeHtml(targetLanguageBlocked ? copy.reviewInitialLanguagesFix : copy.reviewInitialLanguagesReady) + '</span></div>',
          providerValue() === "azure"
            ? '<div class="review-chip ' + (azureSaveBlocked ? "is-error" : "is-ok") + '"><strong>' + escapeHtml(copy.reviewAzureTts) + '</strong><span>' + escapeHtml(azureSaveBlocked ? copy.reviewAzureTtsFix : copy.reviewAzureTtsReady) + '</span></div>'
            : ""
        ].join("");
      }
      function renderHeroSummary() {
        renderSectionDots();
        renderOverviewStrip();
      }
      function renderStationsSummary() {
        const container = document.getElementById("stations-summary-grid");
        if (!container) {
          return;
        }
        container.innerHTML = [
          sideSummaryCardHtml("A", "display"),
          sideSummaryCardHtml("B", "display"),
          sideSummaryCardHtml("A", "microphone"),
          sideSummaryCardHtml("B", "microphone")
        ].join("");
      }
      function renderSaveReview() {
        const container = document.getElementById("save-review-strip");
        if (!container) {
          return;
        }
        const issues = currentConfigurationIssues();
        const selectedProviderLabel = providerDisplayName(providerValue());
        const azureSaveBlocked = azureTextToSpeechSaveBlocked();
        const targetLanguageBlocked = targetLanguageSaveBlocked();
        const displayReady = Boolean(selectedDisplay("A")) && Boolean(selectedDisplay("B"));
        const microphoneReady = runtimeMode() === "demo"
          ? true
          : microphonePttMode() === "single-shared"
            ? Boolean(selectedMicrophone("A") || selectedMicrophone("B"))
            : Boolean(selectedMicrophone("A")) && Boolean(selectedMicrophone("B"));
        const autostartState = state?.autostart;
        const autostartReviewLabel = !autostartState?.supported
          ? copy.reviewAutostartDisabled
          : autostartState.currentEnabled !== autostartState.selectedEnabled
            ? (autostartState.selectedEnabled ? copy.reviewAutostartPendingEnable : copy.reviewAutostartPendingDisable)
            : (autostartState.selectedEnabled ? copy.reviewAutostartEnabled : copy.reviewAutostartDisabled);
        container.innerHTML = [
          '<div class="review-chip ' + (issues.length === 0 ? "is-ok" : "is-warn") + '"><strong>' + escapeHtml(copy.reviewChecklist) + '</strong><span>' + escapeHtml(issues.length === 0 ? copy.reviewReadyToSave : formatCopy(copy.reviewOpenItems, { count: issues.length })) + '</span></div>',
          '<div class="review-chip ' + (displayReady ? "is-ok" : "is-warn") + '"><strong>' + escapeHtml(copy.reviewDisplays) + '</strong><span>' + escapeHtml(displayReady ? copy.reviewDisplayReady : copy.reviewDisplayMissing) + '</span></div>',
          '<div class="review-chip ' + (microphoneReady ? "is-ok" : "is-warn") + '"><strong>' + escapeHtml(copy.reviewMicrophones) + '</strong><span>' + escapeHtml(microphoneReady ? copy.reviewMicrophoneReady : copy.reviewMicrophoneMissing) + '</span></div>',
          '<div class="review-chip"><strong>' + escapeHtml(copy.reviewProvider) + '</strong><span>' + escapeHtml(selectedProviderLabel) + '</span></div>',
          '<div class="review-chip"><strong>' + escapeHtml(copy.reviewAiNotice) + '</strong><span>' + escapeHtml(runtimeDisclosureModeLabel(runtimeDisclosureMode())) + '</span></div>',
          '<div class="review-chip"><strong>' + escapeHtml(copy.reviewAutostart) + '</strong><span>' + escapeHtml(autostartReviewLabel) + '</span></div>',
          '<div class="review-chip ' + (targetLanguageBlocked ? "is-error" : "is-ok") + '"><strong>' + escapeHtml(copy.reviewInitialLanguages) + '</strong><span>' + escapeHtml(targetLanguageBlocked ? copy.reviewInitialLanguagesFix : copy.reviewInitialLanguagesReady) + '</span></div>',
          providerValue() === "azure"
            ? '<div class="review-chip ' + (azureSaveBlocked ? "is-error" : "is-ok") + '"><strong>' + escapeHtml(copy.reviewAzureTts) + '</strong><span>' + escapeHtml(azureSaveBlocked ? copy.reviewAzureTtsFix : copy.reviewAzureTtsReady) + '</span></div>'
            : ''
        ].join("");
      }
      function renderMonitorNotices() {
        const issues = issuesByCode("missing-display");
        const notices = [];
        issues.forEach((issue) => {
          notices.push('<div class="notice warn">' + escapeHtml(localizeWizardIssue(issue).message) + '</div>');
        });
        if (issues.length === 0) {
          notices.push('<div class="notice info">' + escapeHtml(copy.bothDisplaysAssigned) + '</div>');
        }
        document.getElementById("monitor-notices").innerHTML = notices.join("");
      }
      function renderDisplays() {
        const displayGrid = document.getElementById("display-grid");
        if (!displayGrid) { return; }
        displayGrid.innerHTML = state.displays.map((display) => {
          const assignedText = display.assignedSide
            ? '<span class="side-badge side-' + display.assignedSide + '">' + escapeHtml(sidePresentation(display.assignedSide).stationTitle) + '</span>'
            : '<span class="side-badge">' + escapeHtml(copy.displayUnassignedBadge) + '</span>';
          const isASelected = display.assignedSide === "A";
          const isBSelected = display.assignedSide === "B";
          return '<article class="card display-card">'
            + assignedText
            + '<h3>' + escapeHtml(display.label) + '</h3>'
            + '<div class="meta">' + escapeHtml(copy.displayIdLabel) + ' <strong>' + escapeHtml(display.displayId) + '</strong><br />'
            + escapeHtml(display.bounds.width) + 'x' + escapeHtml(display.bounds.height) + '<br />'
            + escapeHtml(display.bounds.x) + ',' + escapeHtml(display.bounds.y) + '</div>'
            + '<div class="actions">'
            + '<button class="secondary wizard-action side-A' + (isASelected ? ' is-active' : '') + '" type="button" aria-pressed="' + isASelected + '" data-display="' + escapeHtml(display.displayId) + '" data-side="A">' + escapeHtml(isASelected ? copy.stationASelected : copy.assignStationA) + '</button>'
            + '<button class="secondary wizard-action side-B' + (isBSelected ? ' is-active' : '') + '" type="button" aria-pressed="' + isBSelected + '" data-display="' + escapeHtml(display.displayId) + '" data-side="B">' + escapeHtml(isBSelected ? copy.stationBSelected : copy.assignStationB) + '</button>'
            + '<button class="ghost danger wizard-action" type="button" data-display="' + escapeHtml(display.displayId) + '" data-side="">' + escapeHtml(copy.removeAssignment) + '</button>'
            + '</div></article>';
        }).join("");
        displayGrid.querySelectorAll("button[data-display]").forEach((button) => {
          button.addEventListener("click", async () => {
            const displayId = Number(button.getAttribute("data-display"));
            const side = button.getAttribute("data-side");
            await runAction(
              () => api.assignDisplay(side || null, displayId),
              side ? formatCopy(copy.displayAssignedStatus, { id: displayId, side }) : copy.displayAssignmentRemoved,
              copy.displayAssignmentUpdateFailed
            );
          });
        });
      }
      function renderMicrophoneNotices() {
        const notices = [];
        const probeDisabledState = currentProbeMicrophonesDisabledState();
        const currentRuntimeMode = runtimeMode();
        const currentMicrophonePttMode = microphonePttMode();
        if (probeDisabledState) {
          notices.push('<div id="probe-microphones-disabled-reason" class="notice ' + escapeHtml(probeDisabledState.tone) + '">' + escapeHtml(probeDisabledState.message) + '</div>');
        }
        if (!state.microphonePermissionGranted) {
          const message = state.microphoneError ? formatCopy(copy.microphonePermissionDenied, { detail: state.microphoneError }) : copy.grantMicrophonePermission;
          notices.push('<div class="notice warn">' + escapeHtml(message) + '</div>');
        }
        if (currentRuntimeMode !== "demo" && currentMicrophonePttMode === "dual-dedicated" && state.microphones.length < requiredMicrophones() && state.microphonePermissionGranted) {
          notices.push('<div class="notice warn">' + escapeHtml(copy.twoDistinctMicrophonesRequired) + '</div>');
        } else if (currentRuntimeMode !== "demo" && currentMicrophonePttMode === "single-shared" && state.microphones.length < 1 && state.microphonePermissionGranted) {
          notices.push('<div class="notice warn">' + escapeHtml(copy.selectOneSharedMicrophone) + '</div>');
        } else if (currentRuntimeMode === "demo") {
          notices.push('<div class="notice info">' + escapeHtml(copy.demoNeedsNoMicrophones) + '</div>');
        }
        ["A","B"].forEach((side) => {
          const configuredValue = configuredMicrophoneId(side);
          if (!configuredValue || findConfiguredMicrophone(side)) {
            return;
          }
          const selectedReplacement = selectedMicrophone(side);
          if (selectedReplacement) {
            notices.push('<div class="notice info">' + escapeHtml(formatCopy(copy.savedMicrophoneUnavailableReplace, { side, label: selectedReplacement.label })) + '</div>');
            return;
          }
          notices.push('<div class="notice warn">' + escapeHtml(formatCopy(copy.savedMicrophoneUnavailableSelect, { side })) + '</div>');
        });
        document.getElementById("microphone-notices").innerHTML = notices.join("");
      }
      function groupMicrophones() {
        const grouped = new Map();
        for (const microphone of state.microphones) {
          const key = microphone.connectionType || "other";
          if (!grouped.has(key)) {
            grouped.set(key, { label: microphone.connectionLabel || copy.uncategorizedMicrophoneGroup, items: [] });
          }
          grouped.get(key).items.push(microphone);
        }
        return grouped;
      }
      function renderMicrophoneGroups() {
        const grouped = groupMicrophones();
        const groups = [];
        for (const key of microphoneCategoryOrder) {
          const group = grouped.get(key);
          if (!group || group.items.length === 0) {
            continue;
          }
          groups.push('<div class="device-group"><h3>' + escapeHtml(group.label) + '</h3><ul class="device-list">' + group.items.map((microphone) => '<li>' + escapeHtml(microphoneDisplayName(microphone)) + '</li>').join("") + '</ul></div>');
        }
        return groups.length ? '<div class="device-groups">' + groups.join("") + '</div>' : "";
      }
      function renderMicrophoneInventory() {
        const container = document.getElementById("microphone-inventory");
        if (!container) {
          return;
        }
        container.innerHTML = renderMicrophoneGroups() || '<div class="notice info">' + escapeHtml(copy.noMicrophonesDetected) + '</div>';
      }
      function microphoneOptions(selectedId) {
        const options = ['<option value="">' + escapeHtml(copy.selectMicrophone) + '</option>'];
        const grouped = groupMicrophones();
        for (const key of microphoneCategoryOrder) {
          const group = grouped.get(key);
          if (!group || group.items.length === 0) {
            continue;
          }
          options.push('<optgroup label="' + escapeHtml(group.label) + '">');
          for (const microphone of group.items) {
            const selected = microphone.deviceId === selectedId ? " selected" : "";
            options.push('<option value="' + escapeHtml(microphone.deviceId) + '"' + selected + '>' + escapeHtml(microphoneDisplayName(microphone)) + '</option>');
          }
          options.push("</optgroup>");
        }
        return options.join("");
      }
      function renderMonitorAssignments() {
        ["A","B"].forEach((side) => {
          const container = document.getElementById("station-monitor-" + side);
          if (!container) { return; }
          const display = selectedDisplay(side);
          container.innerHTML = '<div class="side-card side-' + side + '">'
            + '<strong>' + escapeHtml(display ? display.label : copy.displayPending) + '</strong>'
            + '<span>' + escapeHtml(display ? copy.displayIdLabel + " " + display.displayId + " · " + display.bounds.width + "×" + display.bounds.height : copy.monitorUnassigned) + '</span>'
            + '</div>';
        });
      }
      function renderMicrophoneAssignments() {
        ["A","B"].forEach((side) => {
          const container = document.getElementById("station-mic-" + side);
          if (!container) { return; }
          const currentMic = selectedMicrophone(side);
          container.innerHTML = '<label>' + escapeHtml(copy.assignedMicrophoneLabel)
            + '<select id="microphone-select-' + side + '">'
            + microphoneOptions(currentMic?.deviceId || "")
            + '</select></label>'
            + (microphonePttMode() === "single-shared"
              ? '<small>' + escapeHtml(copy.sharedProfileHint) + '</small>'
              : '')
            + '<button class="ghost danger wizard-action" type="button" id="microphone-clear-' + side + '" aria-label="' + escapeHtml(formatCopy(copy.clearMicrophoneAssignmentAria, { side })) + '">' + escapeHtml(copy.clearMicrophoneAssignment) + '</button>';
          document.getElementById("microphone-select-" + side).addEventListener("change", async (event) => {
            const deviceId = event.target.value || null;
            await stopMicTest(side);
            await runAction(
              () => api.assignMicrophone(side, deviceId),
              deviceId ? formatCopy(copy.microphoneUpdated, { side }) : formatCopy(copy.microphoneRemoved, { side }),
              copy.microphoneUpdateFailed
            );
          });
          document.getElementById("microphone-clear-" + side).addEventListener("click", async () => {
            await stopMicTest(side);
            await runAction(
              () => api.assignMicrophone(side, null),
              formatCopy(copy.microphoneRemoved, { side }),
              copy.microphoneRemoveFailed
            );
          });
        });
      }
      function renderMicrophoneTests() {
        ["A","B"].forEach((side) => {
          const button = document.getElementById("microphone-test-" + side);
          const meter = document.getElementById("microphone-meter-" + side);
          if (!button || !meter) { return; }
          const isRunning = Boolean(activeTests[side]);
          const isStopping = Boolean(activeTests[side] && activeTests[side].stopping);
          button.textContent = isStopping ? copy.microphoneTestStopping : isRunning ? copy.microphoneTestStop : copy.microphoneTestStart;
          button.disabled = isStopping;
          button.classList.toggle("is-active", isRunning && !isStopping);
          button.classList.toggle("is-busy", isStopping);
          button.setAttribute("aria-busy", isStopping ? "true" : "false");
          const level = Math.round((state.signalLevels[side] || 0) * 100);
          meter.style.width = level + "%";
          const signal = document.getElementById("microphone-signal-" + side);
          if (signal) { signal.setAttribute("aria-valuenow", String(level)); }
        });
      }
      function renderAsyncUi() {
        const probingMicrophones = isActionBusy("probingMicrophones");
        const providerTestBusy = isActionBusy("providerTest");
        const providerSpeechBusy = isActionBusy("providerSpeech");
        const saveSectionBusy = isActionBusy("saveSection");
        const saveAndCloseBusy = isActionBusy("saveAndClose");
        const probeDisabledState = currentProbeMicrophonesDisabledState();
        const saveDisabledState = currentSaveDisabledState();
        const providerSpeechDisabledState = currentProviderSpeechDisabledState();
        const saveDisabled = Boolean(saveDisabledState);
        if (typeof renderAutostartControls === "function") {
          renderAutostartControls();
        }
        setBusyRegion("stations", {
          busy: probingMicrophones,
          label: copy.stationsProbeLabel,
          detail: copy.stationsProbeDetail
        });
        setBusyRegion("provider-test", {
          busy: providerTestBusy,
          label: copy.providerTestLabel,
          detail: copy.providerTestDetail
        });
        setBusyRegion("provider-speech", {
          busy: providerSpeechBusy,
          label:
            providerValue() === "azure"
              ? copy.providerSpeechAzureLabel
              : providerValue() === "ollama"
                ? copy.providerSpeechOllamaLabel
                : copy.providerSpeechChatGptLabel,
          detail:
            providerValue() === "azure"
              ? copy.providerSpeechAzureDetail
              : providerValue() === "ollama"
                ? copy.providerSpeechOllamaDetail
                : copy.providerSpeechChatGptDetail
        });
        updateButtonState("probe-microphones", {
          busy: probingMicrophones,
          disabled: probingMicrophones,
          disabledReasonCode: probeDisabledState?.code,
          disabledReasonText: probeDisabledState?.message,
          disabledReasonTone: probeDisabledState?.tone,
          idleText: copy.probeMicrophonesIdle,
          busyText: copy.probeMicrophonesBusy
        });
        updateButtonState("save-close-wizard", {
          busy: saveAndCloseBusy,
          disabled: saveDisabled,
          disabledReasonCode: saveDisabledState?.code,
          disabledReasonText: saveDisabledState?.message,
          disabledReasonTone: saveDisabledState?.tone,
          disabledReasonNoticeId: "save-close-wizard-disabled-reason",
          idleText: copy.saveAndCloseIdle,
          busyText: copy.saveAndCloseBusy
        });
        [
          "stations-save-btn",
          "provider-save-btn",
          "languages-save-btn",
          "diagnostics-save-btn",
          "license-save-btn"
        ].forEach((buttonId) => {
          updateButtonState(buttonId, {
            busy: saveSectionBusy,
            disabled: saveDisabled,
            disabledReasonCode: saveDisabledState?.code,
            disabledReasonText: saveDisabledState?.message,
            disabledReasonTone: saveDisabledState?.tone,
            disabledReasonNoticeId: buttonId + "-disabled-reason",
            idleText: copy.saveSectionIdle,
            busyText: copy.saveSectionBusy
          });
        });
        updateButtonState("run-provider-test", {
          busy: providerTestBusy,
          disabled: providerTestBusy || providerSpeechBusy,
          idleText: copy.providerTestIdle,
          busyText: copy.providerTestBusy
        });
        setElementBusy("provider-test-card", providerTestBusy);
        setElementBusy("provider-speech-card", providerSpeechBusy);
        const speechButton = document.getElementById("run-provider-speech-test");
        if (speechButton instanceof HTMLButtonElement) {
          const provider = providerValue() || "chatgpt";
          const idleText = provider === "azure"
            ? (providerSpeechTestState.inFlight ? copy.azureLiveBusy : copy.azureLiveStart)
            : provider === "ollama"
              ? copy.providerSpeechOllamaLabel
            : providerSpeechTestState.recorder
              ? copy.finalTurnStopAndSend
              : copy.finalTurnStart;
          updateButtonState("run-provider-speech-test", {
            busy: providerSpeechBusy,
            active: Boolean(providerSpeechTestState.recorder),
            disabled: Boolean(providerSpeechDisabledState),
            disabledReasonCode: providerSpeechDisabledState?.code,
            disabledReasonText: providerSpeechDisabledState?.message,
            disabledReasonTone: providerSpeechDisabledState?.tone,
            idleText,
            busyText: provider === "azure" ? copy.azureLiveBusy : copy.finalTurnSending
          });
          speechButton.setAttribute("aria-pressed", providerSpeechTestState.recorder ? "true" : "false");
        }
      }
`;
}
