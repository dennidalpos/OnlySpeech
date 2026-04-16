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
      function getSectionTarget(nextSection) {
        return document.querySelector('[data-section-target="' + nextSection + '"]');
      }
      function focusSection(nextSection, options = {}) {
        const target = getSectionTarget(nextSection);
        if (!(target instanceof HTMLElement)) {
          return;
        }
        if (options.scroll !== false && typeof target.scrollIntoView === "function") {
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
        activeSection = nextSection;
        document.querySelectorAll("[data-section]").forEach((button) => {
          const isActive = button.getAttribute("data-section") === nextSection;
          button.classList.toggle("is-active", isActive);
          button.setAttribute("aria-current", isActive ? "true" : "false");
        });
        document.querySelectorAll("[data-section-target]").forEach((section) => {
          section.classList.toggle("section-emphasis", section.getAttribute("data-section-target") === nextSection);
        });
        focusSection(nextSection, options);
      }
`;
}
