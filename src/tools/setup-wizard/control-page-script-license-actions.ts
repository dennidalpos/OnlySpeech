export function getSetupWizardControlLicenseActionsScript(): string {
  return `
      // ---------------------------------------------------------------------------
      // License actions and wiring
      // ---------------------------------------------------------------------------
      async function reloadLicenseData() {
        licenseInfo = await api.getLicenseState();
        syncLicenseHistory();
        trialAvailability = await api.getTrialAvailability();
      }

      async function handleLicenseRefresh() {
        const refs = getLicenseElements();
        const copy = licenseCopy(wizardUiLanguage);

        if (!(refs.refreshButton instanceof HTMLButtonElement)) {
          return;
        }

        refs.refreshButton.disabled = true;
        try {
          await reloadLicenseData();
          clearLicenseStatusNoticeState();
          renderLicenseSection();
        } catch (error) {
          const detail = error?.message || String(error);
          setLicenseStatusNotice(copy.statusRefreshFailed, "error", detail);
          renderLicenseSection();
          setStatus(copy.statusRefreshFailed + " " + detail, "error");
        } finally {
          const nextRefs = getLicenseElements();
          if (nextRefs.refreshButton instanceof HTMLButtonElement) {
            nextRefs.refreshButton.disabled = false;
          }
        }
      }

      async function handleLicenseRemoval() {
        const refs = getLicenseElements();
        const copy = licenseCopy(wizardUiLanguage);

        if (!(refs.removeButton instanceof HTMLButtonElement)) {
          return;
        }

        if (!(refs.removeCheck instanceof HTMLInputElement) || !refs.removeCheck.checked) {
          setLicenseFeedbackNotice(copy.removeSelectionRequired, "warn");
          renderLicenseSection();
          return;
        }

        if (typeof window.confirm === "function" && !window.confirm(copy.removeConfirmPrompt)) {
          return;
        }

        refs.removeButton.disabled = true;
        try {
          await api.clearLicense();
          await reloadLicenseData();
          clearLicenseInputs(getLicenseElements());
          setLicenseStatusNotice(copy.licenseRemovedMessage, "info");
          renderLicenseSection();
          setStatus(copy.licenseRemovedStatus, "info");
        } catch (error) {
          const detail = error?.message || String(error);
          setLicenseStatusNotice(copy.operationFailed, "error", detail);
          renderLicenseSection();
          setStatus(copy.licenseRemovedError + detail, "error");
        } finally {
          const nextRefs = getLicenseElements();
          if (nextRefs.removeButton instanceof HTMLButtonElement) {
            nextRefs.removeButton.disabled = !(nextRefs.removeCheck instanceof HTMLInputElement) || !nextRefs.removeCheck.checked;
          }
        }
      }

      async function handleLicenseSubmit(event) {
        event.preventDefault();
        const refs = getLicenseElements();
        const copy = licenseCopy(wizardUiLanguage);

        if (!(refs.emailInput instanceof HTMLInputElement) || !(refs.codeInput instanceof HTMLTextAreaElement)) {
          return;
        }

        const email = refs.emailInput.value.trim();
        const activationCode = refs.codeInput.value.trim();
        const validationMessage = validateLicenseSubmission(email, activationCode, copy);

        if (validationMessage) {
          setLicenseFeedbackNotice(validationMessage, "error");
          renderLicenseSection();
          return;
        }

        if (refs.submitButton instanceof HTMLButtonElement) {
          refs.submitButton.disabled = true;
        }
        setLicenseFeedbackNotice(copy.validating, "info");
        renderLicenseSection();

        try {
          const result = await api.submitNewLicense({ email, activationCode });
          if (result.ok) {
            await reloadLicenseData();
            clearLicenseInputs(getLicenseElements());
            clearLicenseFeedbackState();
            setLicenseStatusNotice(copy.newLicenseAppliedMessage, "info");
            renderLicenseSection();
            setStatus(copy.newLicenseAppliedStatus, "info");
            return;
          }

          setLicenseFeedbackNotice(result.message || copy.validationFailed, "error");
          renderLicenseSection();
        } catch (error) {
          const detail = error?.message || String(error);
          setLicenseFeedbackNotice(copy.operationFailed, "error", detail);
          renderLicenseSection();
        } finally {
          const nextRefs = getLicenseElements();
          if (nextRefs.submitButton instanceof HTMLButtonElement) {
            nextRefs.submitButton.disabled = false;
          }
        }
      }

      async function handleTrialStart() {
        const refs = getLicenseElements();
        const copy = licenseCopy(wizardUiLanguage);

        if (!(refs.trialButton instanceof HTMLButtonElement)) {
          return;
        }

        refs.trialButton.disabled = true;
        setLicenseFeedbackNotice(copy.activatingTrial, "info");
        renderLicenseSection();

        try {
          const result = await api.submitTrial();
          if (result.ok) {
            await reloadLicenseData();
            clearLicenseFeedbackState();
            setLicenseStatusNotice(copy.trialActivatedMessage, "info");
            renderLicenseSection();
            setStatus(copy.trialActivatedStatus, "info");
            return;
          }

          setLicenseFeedbackNotice(result.message || copy.activationFailed, "error");
          renderLicenseSection();
        } catch (error) {
          const detail = error?.message || String(error);
          setLicenseFeedbackNotice(copy.operationFailed, "error", detail);
          renderLicenseSection();
        } finally {
          const nextRefs = getLicenseElements();
          if (nextRefs.trialButton instanceof HTMLButtonElement) {
            nextRefs.trialButton.disabled = !trialAvailability.eligible;
          }
        }
      }

      function bindLicenseEventHandlers() {
        const refs = getLicenseElements();

        if (refs.refreshButton instanceof HTMLButtonElement) {
          refs.refreshButton.onclick = () => {
            void handleLicenseRefresh();
          };
        }

        if (refs.removeCheck instanceof HTMLInputElement) {
          refs.removeCheck.onchange = () => {
            renderLicenseSection();
          };
        }

        if (refs.removeButton instanceof HTMLButtonElement) {
          refs.removeButton.onclick = () => {
            void handleLicenseRemoval();
          };
        }

        if (refs.updateForm instanceof HTMLFormElement) {
          refs.updateForm.onsubmit = (event) => {
            void handleLicenseSubmit(event);
          };
        }

        if (refs.detailsToggleButton instanceof HTMLButtonElement) {
          refs.detailsToggleButton.onclick = () => {
            toggleLicenseFeedbackDetails();
            renderLicenseSection();
          };
        }

        if (refs.trialButton instanceof HTMLButtonElement) {
          refs.trialButton.onclick = () => {
            void handleTrialStart();
          };
        }
      }

      async function initializeLicenseSection() {
        await reloadLicenseData();
        renderLicenseSection();
      }
  `;
}
