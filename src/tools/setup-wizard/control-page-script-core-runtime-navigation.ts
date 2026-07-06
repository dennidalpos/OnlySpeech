export function getSetupWizardControlCoreRuntimeNavigationScript(): string {
  return `      function reconcileTransientWizardUi(previousState, nextState, options = {}) {
        if (options.forceFullReset) {
          resetUiActionState();
          resetProviderSpeechTestState();
          clearTransientResultPanels();
          return;
        }
        if (!previousState || !nextState) {
          return;
        }
        const providerChanged =
          (previousState.envValues.TRANSLATION_PROVIDER || "").trim() !==
          (nextState.envValues.TRANSLATION_PROVIDER || "").trim();
        const microphoneModeChanged =
          resolveMicrophonePttMode(previousState.envValues.MICROPHONE_PTT_MODE) !==
          resolveMicrophonePttMode(nextState.envValues.MICROPHONE_PTT_MODE);
        const setupStateChanged = buildSetupStateSignature(previousState) !== buildSetupStateSignature(nextState);
        if (!providerChanged && !microphoneModeChanged && !setupStateChanged) {
          return;
        }
        resetUiActionState(["providerTest", "providerSpeech"]);
        resetProviderSpeechTestState();
        clearTransientResultPanels();
      }
      function isSectionUnlocked(section) {
        if (!initialSetupMode) {
          return true;
        }
        if (section === "license") {
          return true;
        }
        const hasLicense = licenseInfo !== null && !licenseInfo.isExpired;
        if (!hasLicense) {
          return false;
        }
        if (section === "stations") {
          return true;
        }
        if (sectionHasIssues("stations")) {
          return false;
        }
        if (section === "provider") {
          return true;
        }
        if (sectionHasIssues("provider")) {
          return false;
        }
        if (section === "languages") {
          return true;
        }
        if (sectionHasIssues("languages")) {
          return false;
        }
        if (section === "diagnostics") {
          return true;
        }
        if (section === "save") {
          return true;
        }
        return false;
      }
      function getSectionTarget(nextSection) {
        return document.querySelector('[data-section-target="' + nextSection + '"]');
      }
      function focusSection(nextSection, options = {}) {
        const target = getSectionTarget(nextSection);
        if (!(target instanceof HTMLElement)) {
          return;
        }
        if (options.scroll !== false && typeof target.scrollIntoView === "function" && !initialSetupMode) {
          target.scrollIntoView({ behavior: options.behavior || "smooth", block: "start" });
        }
        if (options.focus !== false && typeof target.focus === "function") {
          window.setTimeout(() => {
            target.focus({ preventScroll: true });
          }, options.behavior === "smooth" ? 180 : 0);
        }
      }
      function setActiveSection(nextSection, options = {}) {
        if (!supportedSections.includes(nextSection)) {
          return;
        }
        if (initialSetupMode && !isSectionUnlocked(nextSection)) {
          return;
        }
        activeSection = nextSection;
        document.querySelectorAll("[data-section]").forEach((button) => {
          const sectionName = button.getAttribute("data-section");
          const isActive = sectionName === nextSection;
          button.classList.toggle("is-active", isActive);
          button.setAttribute("aria-current", isActive ? "true" : "false");
          
          if (initialSetupMode) {
            const unlocked = isSectionUnlocked(sectionName);
            button.disabled = !unlocked;
            button.style.opacity = unlocked ? "1" : "0.4";
            button.style.pointerEvents = unlocked ? "auto" : "none";
          } else {
            button.disabled = false;
            button.style.opacity = "1";
            button.style.pointerEvents = "auto";
          }
        });
        document.querySelectorAll("[data-section-target]").forEach((section) => {
          const targetName = section.getAttribute("data-section-target");
          if (initialSetupMode) {
            section.hidden = targetName !== nextSection;
          } else {
            section.hidden = false;
          }
          section.classList.toggle("section-emphasis", targetName === nextSection);
        });
        focusSection(nextSection, options);
      }
`;
}
