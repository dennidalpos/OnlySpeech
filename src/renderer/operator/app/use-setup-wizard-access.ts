import { useEffect, useState } from "react";
import { MIN_SETUP_WIZARD_PASSWORD_LENGTH } from "../../../shared/constants.js";
import type { OnlySpeechRendererApi } from "../../../shared/onlyspeech-api.js";
import type { AppMode, SetupWizardAccessState, Side } from "../../../shared/types.js";

interface SetupWizardAccessLabels {
  setupWizardInvalidPassword: string;
  setupWizardPasswordMismatch: string;
  setupWizardPasswordRequired: string;
  setupWizardPasswordTooShort: (minimumLength: number) => string;
}

interface UseSetupWizardAccessOptions {
  appMode: AppMode | null | undefined;
  labels: SetupWizardAccessLabels;
  onlySpeechApi: OnlySpeechRendererApi | null;
  side: Side;
}

interface SubmitSetupAccessPayload {
  password: string;
  nextPassword?: string;
  confirmPassword?: string;
}

export function useSetupWizardAccess(options: UseSetupWizardAccessOptions) {
  const { appMode, labels, onlySpeechApi, side } = options;
  const [setupAccessState, setSetupAccessState] = useState<SetupWizardAccessState | null>(null);
  const [setupAccessError, setSetupAccessError] = useState<string | null>(null);
  const [setupAccessBusy, setSetupAccessBusy] = useState(false);
  const [setupAccessPauseHeld, setSetupAccessPauseHeld] = useState(false);
  const [setupTemporaryPassword, setSetupTemporaryPassword] = useState<string | null>(null);
  const [dismissedTemporaryPassword, setDismissedTemporaryPassword] = useState<string | null>(null);

  useEffect(() => {
    if (side !== "A" || !onlySpeechApi?.getSetupWizardAccessState) {
      return;
    }

    let cancelled = false;

    void onlySpeechApi.getSetupWizardAccessState()
      .then((accessState) => {
        if (cancelled) {
          return;
        }

        if (accessState.requiresPassword && accessState.mustChangePassword && accessState.temporaryPassword) {
          setSetupTemporaryPassword(accessState.temporaryPassword);
          return;
        }

        setSetupTemporaryPassword(null);
        setDismissedTemporaryPassword(null);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [onlySpeechApi, side]);

  const openSetupWizard = async (): Promise<void> => {
    if (!onlySpeechApi) {
      return;
    }

    setSetupAccessError(null);

    if (appMode === "demo" && onlySpeechApi.setDemoPaused && !setupAccessPauseHeld) {
      await onlySpeechApi.setDemoPaused(true);
      setSetupAccessPauseHeld(true);
    }

    if (!onlySpeechApi.getSetupWizardAccessState || !onlySpeechApi.requestSetupWizardAccess) {
      onlySpeechApi.openSetupWizard();
      return;
    }

    try {
      const accessState = await onlySpeechApi.getSetupWizardAccessState();
      if (!accessState.requiresPassword) {
        onlySpeechApi.openSetupWizard();
        return;
      }

      setSetupAccessState(accessState);
    } catch (error) {
      setSetupAccessState({
        requiresPassword: true,
        mustChangePassword: false,
        temporaryPassword: null
      });
      setSetupAccessError(error instanceof Error ? error.message : String(error));
    }
  };

  const submitSetupAccess = async (payload: SubmitSetupAccessPayload): Promise<void> => {
    if (!onlySpeechApi?.requestSetupWizardAccess || !setupAccessState) {
      return;
    }

    if (setupAccessState.mustChangePassword) {
      if (!payload.nextPassword?.trim()) {
        setSetupAccessError(labels.setupWizardPasswordRequired);
        return;
      }

      if (payload.nextPassword.trim().length < MIN_SETUP_WIZARD_PASSWORD_LENGTH) {
        setSetupAccessError(labels.setupWizardPasswordTooShort(MIN_SETUP_WIZARD_PASSWORD_LENGTH));
        return;
      }

      if (payload.nextPassword !== payload.confirmPassword) {
        setSetupAccessError(labels.setupWizardPasswordMismatch);
        return;
      }
    }

    setSetupAccessBusy(true);
    setSetupAccessError(null);

    try {
      const result = await onlySpeechApi.requestSetupWizardAccess({
        password: payload.password,
        nextPassword: setupAccessState.mustChangePassword ? payload.nextPassword?.trim() : undefined
      });

      if (result.ok) {
        setSetupAccessState(null);
        setSetupTemporaryPassword(null);
        setDismissedTemporaryPassword(null);
        return;
      }

      switch (result.code) {
        case "invalid-password":
          setSetupAccessError(labels.setupWizardInvalidPassword);
          break;
        case "new-password-required":
          setSetupAccessError(labels.setupWizardPasswordRequired);
          break;
        case "new-password-too-short":
          setSetupAccessError(labels.setupWizardPasswordTooShort(MIN_SETUP_WIZARD_PASSWORD_LENGTH));
          break;
        default:
          setSetupAccessError(result.message);
          break;
      }
    } catch (error) {
      setSetupAccessError(error instanceof Error ? error.message : String(error));
    } finally {
      setSetupAccessBusy(false);
    }
  };

  const cancelSetupAccess = (): void => {
    if (setupAccessBusy) {
      return;
    }

    if (setupAccessPauseHeld) {
      void onlySpeechApi?.setDemoPaused?.(false);
      setSetupAccessPauseHeld(false);
    }

    setSetupAccessState(null);
    setSetupAccessError(null);
  };

  return {
    cancelSetupAccess,
    dismissTemporaryPassword: () => setDismissedTemporaryPassword(setupTemporaryPassword),
    dismissedTemporaryPassword,
    openSetupWizard,
    setupAccessBusy,
    setupAccessError,
    setupAccessState,
    setupTemporaryPassword,
    submitSetupAccess
  };
}
