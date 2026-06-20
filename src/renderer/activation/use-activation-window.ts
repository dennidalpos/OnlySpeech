import { useCallback, useEffect, useState } from "react";
import { getOnlySpeechRendererApi } from "../../shared/onlyspeech-api.js";
import {
  ACTIVATION_COPY,
  getActivationStatusDescriptor,
  resolveActivationUiLanguage,
  type ActivationStatusTone,
  type ActivationUiLanguage
} from "./activation-copy.js";
import {
  canCopyActivationStatus,
  createAcceptedActivationState,
  createActivationStatusSuggestion,
  createActivationStatusTitle,
  createFallbackActivationState,
  createRequiredActivationState
} from "./activation-ui-state.js";
import {
  isActivationCodeFormatValid,
  isEmailFormatValid
} from "./activation-validation.js";

export function useActivationWindow() {
  const [language] = useState<ActivationUiLanguage>(resolveActivationUiLanguage);
  const [email, setEmail] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [status, setStatus] = useState(createRequiredActivationState(language));
  const [statusTone, setStatusTone] = useState<ActivationStatusTone>("required");
  const [statusDetail, setStatusDetail] = useState<string | null>(null);
  const [statusDetailVisible, setStatusDetailVisible] = useState(false);
  const [isCopyingStatus, setIsCopyingStatus] = useState(false);
  const [isStatusRefreshing, setIsStatusRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTrialSubmitting, setIsTrialSubmitting] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);
  const api = getOnlySpeechRendererApi();
  const text = ACTIVATION_COPY[language];

  const applyStatus = useCallback((
    nextStatus: typeof status,
    nextTone: ActivationStatusTone = nextStatus.status,
    nextDetail: string | null = null
  ) => {
    setStatus(nextStatus);
    setStatusTone(nextTone);
    setStatusDetail(nextDetail);
    setStatusDetailVisible(false);
  }, []);

  const readGateState = useCallback(async () => {
    if (!api?.getActivationGateState) {
      return {
        detail: null,
        state: createFallbackActivationState(language)
      };
    }

    try {
      return {
        detail: null,
        state: await api.getActivationGateState()
      };
    } catch (error) {
      return {
        detail: error instanceof Error ? error.message : String(error),
        state: createFallbackActivationState(language)
      };
    }
  }, [api, language]);

  async function refreshStatus() {
    setIsStatusRefreshing(true);
    setCopiedStatus(false);
    try {
      const nextGateState = await readGateState();
      applyStatus(nextGateState.state, nextGateState.state.status, nextGateState.detail);
    } finally {
      setIsStatusRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    setIsStatusRefreshing(true);
    void readGateState().then((nextGateState) => {
      if (!cancelled) {
        applyStatus(nextGateState.state, nextGateState.state.status, nextGateState.detail);
      }
    }).finally(() => {
      if (!cancelled) {
        setIsStatusRefreshing(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [applyStatus, readGateState]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!api?.submitActivation) {
      applyStatus(createFallbackActivationState(language));
      return;
    }

    setIsSubmitting(true);
    setCopiedStatus(false);
    try {
      const result = await api.submitActivation({
        email,
        activationCode
      });

      if (result.ok) {
        applyStatus(createAcceptedActivationState(language), "success");
        return;
      }

      applyStatus({
        status: result.status,
        message: result.message
      });
    } catch (error) {
      applyStatus(
        createFallbackActivationState(language),
        "invalid-state",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTrial() {
    if (!api?.submitTrial) {
      applyStatus(createFallbackActivationState(language));
      return;
    }

    setIsTrialSubmitting(true);
    setCopiedStatus(false);
    try {
      const result = await api.submitTrial();

      if (result.ok) {
        applyStatus(createAcceptedActivationState(language), "success");
        return;
      }

      applyStatus({
        status: result.status,
        message: result.message
      });
    } catch (error) {
      applyStatus(
        createFallbackActivationState(language),
        "invalid-state",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setIsTrialSubmitting(false);
    }
  }

  function clearEmail() {
    setEmail("");
  }

  function clearActivationCode() {
    setActivationCode("");
  }

  function clearFields() {
    clearEmail();
    clearActivationCode();
  }

  async function copyStatus() {
    if (!canCopyActivationStatus(status) || !navigator.clipboard?.writeText) {
      return;
    }

    setIsCopyingStatus(true);
    try {
      await navigator.clipboard.writeText(
        [
          createActivationStatusTitle(statusTone, language),
          status.message,
          statusDetailVisible ? statusDetail : null
        ].filter(Boolean).join("\n")
      );
      setCopiedStatus(true);
    } finally {
      setIsCopyingStatus(false);
    }
  }

  function toggleStatusDetails() {
    if (!statusDetail) {
      return;
    }
    setStatusDetailVisible((current) => !current);
  }

  return {
    text,
    email,
    activationCode,
    statusTone,
    statusTitle: createActivationStatusTitle(statusTone, language),
    statusSummary: status.message || getActivationStatusDescriptor(statusTone, language).summary,
    statusSuggestion: createActivationStatusSuggestion(statusTone, language),
    statusDetail: statusDetailVisible ? statusDetail : null,
    hasStatusDetails: Boolean(statusDetail),
    statusDetailVisible,
    emailValid: isEmailFormatValid(email),
    codeValid: isActivationCodeFormatValid(activationCode),
    canCopyStatus: canCopyActivationStatus(status) && Boolean(navigator.clipboard?.writeText),
    copiedStatus,
    copyStatus,
    isCopyingStatus,
    isStatusRefreshing,
    isSubmitting,
    isTrialSubmitting,
    refreshStatus,
    setEmail,
    setActivationCode,
    clearEmail,
    clearActivationCode,
    handleSubmit,
    handleTrial,
    clearFields,
    toggleStatusDetails
  };
}
