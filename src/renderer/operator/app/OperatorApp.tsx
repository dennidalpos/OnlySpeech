import { useEffect, useMemo, useState } from "react";
import { findSourceLanguageOption } from "../../../shared/language-options.js";
import type { OnlySpeechRendererApi } from "../../../shared/onlyspeech-api.js";
import { buildCommonProviderInteractionLanguageChoices } from "../../../shared/language-flow.js";
import {
  getInteractionLanguageCurrentLabel,
  getInteractionLanguageEnglishLabel,
  getInteractionLanguageLabel
} from "../../../shared/language-registry.js";
import {
  getOperatorTextToSpeechText,
  getVisitorTextToSpeechText
} from "../../../shared/text-to-speech-localization.js";
import { getUiText, resolveUiLanguageForSide } from "../../../shared/ui-localization.js";
import {
  DEFAULT_RUNTIME_DISCLOSURE_SETTINGS,
  getRuntimeDisclosureText
} from "../../../shared/runtime-disclosure.js";
import { getVisitorLocalizationBundle } from "../../../shared/visitor-localization-bundle.js";
import type { Side } from "../../../shared/types.js";
import { ConfirmDialog } from "../components/ConfirmDialog.js";
import { LanguageSelection } from "../components/LanguageSelection.js";
import { OperatorSessionScreen } from "../components/OperatorSessionScreen.js";
import { SetupWizardAccessDialog } from "../components/SetupWizardAccessDialog.js";
import { SetupWizardTemporaryPasswordNotice } from "../components/SetupWizardTemporaryPasswordNotice.js";
import { TechnicalErrorView } from "../components/TechnicalErrorView.js";
import { RuntimeIssueBanner } from "../components/RuntimeIssueBanner.js";
import { RuntimeDisclosureCard } from "../components/RuntimeDisclosureCard.js";
import { VisitorLanguageSelection } from "../components/VisitorLanguageSelection.js";
import { VisitorSessionScreen } from "../components/VisitorSessionScreen.js";
import {
  canSideUseSpeech,
  hasCommittedLanguageSelection,
  resolveOperatorViewMode,
  shouldShowRemoteUserLanguage
} from "../../../shared/side-flow.js";
import { buildPanelSpeechControl } from "./build-panel-speech-control.js";
import { useSetupWizardAccess } from "./use-setup-wizard-access.js";
import { useOnlySpeechRuntime } from "./use-onlyspeech-runtime.js";
import { usePushToTalk } from "./use-push-to-talk.js";

function resolveSide(): Side {
  const side = new URLSearchParams(window.location.search).get("side");
  return side === "B" ? "B" : "A";
}

function languageLabel(languageCode: string | null): string {
  return getInteractionLanguageLabel(languageCode);
}

function sourceLanguageLabel(languageCode: string | null): string {
  if (!languageCode) {
    return "-";
  }

  return findSourceLanguageOption(languageCode)?.label ?? languageCode;
}

function getLocalizedRoleLabels(language: string): { A: string; B: string } {
  switch (language) {
    case "it":
      return { A: "Operatore", B: "Utente" };
    case "es":
      return { A: "Operador", B: "Usuario" };
    case "fr":
      return { A: "Operateur", B: "Utilisateur" };
    case "de":
      return { A: "Operator", B: "Benutzer" };
    case "zh":
      return { A: "操作员", B: "用户" };
    default:
      return { A: "Operator", B: "User" };
  }
}

export function OperatorApp() {
  const side = useMemo(resolveSide, []);
  const fallbackUiLanguage = "en";
  const onlySpeechApi: OnlySpeechRendererApi | null = window.onlySpeech ?? null;
  const appState = useOnlySpeechRuntime(side, onlySpeechApi);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"reset" | "close" | "shutdown" | null>(null);
  const [canShutdownComputer, setCanShutdownComputer] = useState(false);
  const [shutdownFeedback, setShutdownFeedback] = useState<string | null>(null);
  const preloadedLocalSide = appState?.sides[side] ?? null;
  const preloadedRemoteSide = appState?.sides[side === "A" ? "B" : "A"] ?? null;
  const isVisitorStation = side === "B";
  const uiLanguage = preloadedLocalSide ? resolveUiLanguageForSide(preloadedLocalSide) : fallbackUiLanguage;
  const operatorSelectorLanguage = preloadedLocalSide?.wizardDefaultUiLanguage ?? uiLanguage;
  const localizedRoleLabels = getLocalizedRoleLabels(uiLanguage);
  const labels = getUiText(uiLanguage);
  const operatorSelectorLabels = getUiText(operatorSelectorLanguage);
  const visitorRuntimeLocalization = getVisitorLocalizationBundle(preloadedLocalSide?.effectiveUiLanguage ?? uiLanguage);
  const visitorLanguageLocalization = getVisitorLocalizationBundle(
    preloadedLocalSide?.selectedTargetLanguage ?? null
  );
  const visitorStatusLabels = visitorRuntimeLocalization.statusLabels;
  const visitorCurrentLanguage = visitorLanguageLocalization.currentLanguageLabel;
  const visitorLabels = visitorRuntimeLocalization.uiText;
  const operatorTextToSpeechText = getOperatorTextToSpeechText(uiLanguage);
  const visitorTextToSpeechText = getVisitorTextToSpeechText(preloadedLocalSide?.effectiveUiLanguage ?? uiLanguage);
  const visitorSelectorLanguage =
    preloadedLocalSide?.wizardDefaultUiLanguage ?? preloadedLocalSide?.effectiveUiLanguage ?? uiLanguage;
  const visitorSelectorLabels = getVisitorLocalizationBundle(visitorSelectorLanguage).uiText;
  const runtimeDisclosure = appState?.runtimeDisclosure ?? DEFAULT_RUNTIME_DISCLOSURE_SETTINGS;
  const operatorDisclosureText = getRuntimeDisclosureText(uiLanguage, runtimeDisclosure);
  const visitorDisclosureText = getRuntimeDisclosureText(
    preloadedLocalSide?.effectiveUiLanguage ?? visitorSelectorLanguage,
    runtimeDisclosure
  );
  const operatorDisclosure = operatorDisclosureText ? (
    <RuntimeDisclosureCard
      title={operatorDisclosureText.title}
      paragraphs={operatorDisclosureText.paragraphs}
    />
  ) : null;
  const visitorDisclosure = visitorDisclosureText ? (
    <RuntimeDisclosureCard
      title={visitorDisclosureText.title}
      paragraphs={visitorDisclosureText.paragraphs}
    />
  ) : null;
  const interactionLanguageChoices = buildCommonProviderInteractionLanguageChoices(appState?.translationProvider);
  const interactionLanguageChoicesByValue = new Map(
    interactionLanguageChoices.map((choice) => [choice.value, choice] as const)
  );
  const localInteractionChoice =
    preloadedLocalSide?.selectedTargetLanguage
      ? interactionLanguageChoicesByValue.get(preloadedLocalSide.selectedTargetLanguage) ?? null
      : null;
  const localInteractionEnglishLabel = getInteractionLanguageEnglishLabel(
    preloadedLocalSide?.selectedTargetLanguage ?? null
  );
  const preloadedLocalConfiguredInteractionLabel =
    preloadedLocalSide?.selectedInteractionLanguage &&
    preloadedLocalSide.selectedInteractionLanguage !== preloadedLocalSide.selectedTargetLanguage
      ? getInteractionLanguageCurrentLabel(preloadedLocalSide.selectedInteractionLanguage, appState?.translationProvider, {
          includeProviderExpansions: true
        })
      : null;
  const preloadedBlockingIssues = appState?.health.blockingIssues ?? [];
  const preloadedLocalLanguageCommitted = preloadedLocalSide ? hasCommittedLanguageSelection(preloadedLocalSide) : false;
  const preloadedRemoteLanguageCommitted = preloadedRemoteSide
    ? hasCommittedLanguageSelection(preloadedRemoteSide)
    : false;
  const preloadedCanTalk =
    appState !== null &&
    canSideUseSpeech(appState, side) &&
    preloadedLocalLanguageCommitted &&
    preloadedRemoteLanguageCommitted &&
    (appState.activeSide === null || appState.activeSide === side);
  const { isPttPressed, startPtt, endPtt, onPointerDown, onPointerUp } = usePushToTalk({
    side,
    canTalk: preloadedCanTalk,
    sendOperatorAction: onlySpeechApi?.sendOperatorAction ?? (() => undefined)
  });
  const {
    cancelSetupAccess,
    dismissTemporaryPassword,
    dismissedTemporaryPassword,
    openSetupWizard,
    setupAccessBusy,
    setupAccessError,
    setupAccessState,
    setupTemporaryPassword,
    submitSetupAccess
  } = useSetupWizardAccess({
    appMode: appState?.appMode,
    labels,
    onlySpeechApi,
    side
  });

  useEffect(() => {
    let cancelled = false;

    if (!onlySpeechApi?.getShutdownCapability) {
      setCanShutdownComputer(false);
      return () => {
        cancelled = true;
      };
    }

    void onlySpeechApi.getShutdownCapability()
      .then((available) => {
        if (!cancelled) {
          setCanShutdownComputer(available);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCanShutdownComputer(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onlySpeechApi]);

  if (!appState) {
    return <div className="boot-screen">{getUiText(fallbackUiLanguage).booting}</div>;
  }

  if (!onlySpeechApi) {
    return (
      <TechnicalErrorView
        language={fallbackUiLanguage}
        issues={[
          {
            code: "speech-stream-failure",
            message: getUiText(fallbackUiLanguage).bridgeUnavailable,
            retryable: true
          }
        ]}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const localSide = appState.sides[side];
  const remoteSide = appState.sides[side === "A" ? "B" : "A"];
  const localHistoryEntries = appState.conversationHistory.filter((entry) => entry.speakerSide === side);
  const remoteHistoryEntries = appState.conversationHistory.filter((entry) => entry.speakerSide !== side);
  const remoteInteractionChoice =
    remoteSide.selectedTargetLanguage
      ? interactionLanguageChoicesByValue.get(remoteSide.selectedTargetLanguage) ?? null
      : null;
  const remoteInteractionEnglishLabel = getInteractionLanguageEnglishLabel(remoteSide.selectedTargetLanguage ?? null);
  const remoteConfiguredInteractionLabel =
    remoteSide.selectedInteractionLanguage &&
    remoteSide.selectedInteractionLanguage !== remoteSide.selectedTargetLanguage
      ? getInteractionLanguageCurrentLabel(remoteSide.selectedInteractionLanguage, appState.translationProvider, {
          includeProviderExpansions: true
        })
      : null;
  const blockingIssues = appState.health.blockingIssues;
  const localLanguageCommitted = hasCommittedLanguageSelection(localSide);
  const remoteLanguageCommitted = hasCommittedLanguageSelection(remoteSide);
  const waitingForRemoteLanguage = localLanguageCommitted && !remoteLanguageCommitted;
  const shouldShowRemoteLanguageLine = shouldShowRemoteUserLanguage(
    side,
    remoteLanguageCommitted ? remoteSide.selectedTargetLanguage ?? null : null
  );
  const isRemoteSpeaking = remoteSide.isActiveSpeaker;
  const localStatusLabel = labels.statusLabels[localSide.status];
  const visibleStatusLabel = isVisitorStation ? visitorStatusLabels[localSide.status] : localStatusLabel;
  const activeTextToSpeech = appState.textToSpeech;
  const textToSpeechEnabled = appState.textToSpeechEnabled;
  const textToSpeechText = isVisitorStation ? visitorTextToSpeechText : operatorTextToSpeechText;
  const demoMode = appState.appMode === "demo";
  const canTalk =
    !demoMode &&
    canSideUseSpeech(appState, side) &&
    localLanguageCommitted &&
    remoteLanguageCommitted &&
    (appState.activeSide === null || appState.activeSide === side);
  const viewMode = resolveOperatorViewMode({
    appState,
    side,
    showLanguageSelector,
    visitorLanguageCommitted: side === "B" ? localLanguageCommitted : true
  });

  const selectLanguage = (language: string) => {
    onlySpeechApi.sendOperatorAction({
      type: "select-target-language",
      side,
      targetLanguage: language
    });
    setShowLanguageSelector(false);
  };

  const pttButtonClassName = [
    "ptt-button",
    canTalk ? "" : "disabled",
    canTalk && (isPttPressed || localSide.isActiveSpeaker) ? "active" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const transcriptSpeechControl = textToSpeechEnabled
    ? buildPanelSpeechControl({
        activeSide: appState.activeSide,
        activeTextToSpeech,
        content: "transcript",
        language: localSide.detectedSourceLanguage ?? localSide.sourceLanguage ?? null,
        panelText: textToSpeechText,
        panelTitle: isVisitorStation ? visitorLabels.whatYouSay : labels.localTranscript,
        requestTextToSpeech: onlySpeechApi.requestTextToSpeech,
        side,
        stopTextToSpeech: onlySpeechApi.stopTextToSpeech,
        text: localSide.localTranscript
      })
    : undefined;

  const translationSpeechControl = textToSpeechEnabled
    ? buildPanelSpeechControl({
        activeSide: appState.activeSide,
        activeTextToSpeech,
        content: "translation",
        language: localSide.selectedTargetLanguage ?? null,
        panelText: textToSpeechText,
        panelTitle: isVisitorStation ? visitorLabels.operatorTranslation : labels.remoteTranslation,
        requestTextToSpeech: onlySpeechApi.requestTextToSpeech,
        side,
        stopTextToSpeech: onlySpeechApi.stopTextToSpeech,
        text: localSide.remoteTranslation
      })
    : undefined;

  const setupAccessDialog = setupAccessState?.requiresPassword ? (
    <SetupWizardAccessDialog
      title={labels.setupWizardAccessTitle}
      description={
        setupAccessState.mustChangePassword
          ? labels.setupWizardAccessChangeDescription
          : labels.setupWizardAccessDescription
      }
      passwordLabel={labels.setupWizardPasswordLabel}
      newPasswordLabel={labels.setupWizardNewPasswordLabel}
      confirmPasswordLabel={labels.setupWizardConfirmPasswordLabel}
      submitLabel={labels.setupWizardAccessSubmit}
      cancelLabel={labels.cancel}
      mustChangePassword={setupAccessState.mustChangePassword}
      busy={setupAccessBusy}
      errorMessage={setupAccessError}
      onCancel={cancelSetupAccess}
      onSubmit={submitSetupAccess}
    />
  ) : null;

  const setupTemporaryPasswordNotice =
    side === "A" &&
    setupTemporaryPassword &&
    dismissedTemporaryPassword !== setupTemporaryPassword ? (
      <SetupWizardTemporaryPasswordNotice
        title={labels.setupWizardTemporaryPasswordTitle}
        description={labels.setupWizardTemporaryPasswordDescription}
        passwordLabel={labels.setupWizardTemporaryPasswordRevealLabel}
        temporaryPassword={setupTemporaryPassword}
        dismissLabel={labels.dismiss}
        onDismiss={dismissTemporaryPassword}
      />
    ) : null;
  const setupWizardOverlays = (
    <>
      {setupTemporaryPasswordNotice}
      {setupAccessDialog}
    </>
  );
  const runtimeIssueBanner =
    blockingIssues.length > 0 && viewMode !== "technical-error" ? (
      <RuntimeIssueBanner
        issues={blockingIssues}
        language={uiLanguage}
        visitorLanguageCode={isVisitorStation ? localSide.effectiveUiLanguage : undefined}
        onRetry={() => {
          onlySpeechApi.sendOperatorAction({ type: "retry-health-check", side });
        }}
        onOpenSetup={openSetupWizard}
      />
    ) : null;
  const shutdownNotice = shutdownFeedback ? (
    <div className="notice warn" role="alert">{shutdownFeedback}</div>
  ) : null;

  if (viewMode === "technical-error") {
    return (
      <>
        {setupWizardOverlays}
        <TechnicalErrorView
          language={uiLanguage}
          visitorLanguageCode={isVisitorStation ? localSide.effectiveUiLanguage : undefined}
          issues={blockingIssues}
          onRetry={() => {
            onlySpeechApi.sendOperatorAction({ type: "retry-health-check", side });
          }}
          onOpenSetup={openSetupWizard}
        />
      </>
    );
  }

  if (viewMode === "operator-language-selection") {
    return (
      <>
        {setupWizardOverlays}
        {runtimeIssueBanner}
        {shutdownNotice}
        <LanguageSelection
          language={operatorSelectorLanguage}
          title={operatorSelectorLabels.selectInteractionLanguageTitle}
          description={operatorSelectorLabels.selectInteractionLanguageDescription}
          selectedLanguage={null}
          initialMacroAreaLanguage={operatorSelectorLanguage}
          appearance="tiles"
          choices={interactionLanguageChoices}
          confirmSelection={false}
          preselectLanguage={false}
          runtimeDisclosureSettings={runtimeDisclosure}
          onSelect={selectLanguage}
          onCancel={showLanguageSelector ? () => setShowLanguageSelector(false) : undefined}
        />
      </>
    );
  }

  if (viewMode === "visitor-language-selection") {
    return (
      <>
        {setupWizardOverlays}
        {runtimeIssueBanner}
        {shutdownNotice}
        <VisitorLanguageSelection
          languageCode={visitorSelectorLanguage}
          title={visitorSelectorLabels.selectLanguageTitle}
          description={visitorSelectorLabels.selectLanguageDescription}
          selectedLanguage={localSide.selectedTargetLanguage}
          choices={interactionLanguageChoices}
          runtimeDisclosureSettings={runtimeDisclosure}
          onSelect={selectLanguage}
        />
      </>
    );
  }

  if (isVisitorStation) {
    return (
      <>
        {setupWizardOverlays}
        {runtimeIssueBanner}
        <VisitorSessionScreen
          appState={appState}
          canTalk={canTalk}
          isRemoteSpeaking={isRemoteSpeaking}
          localHistoryEntries={localHistoryEntries}
          localInteractionChoice={localInteractionChoice}
          localConfiguredInteractionLabel={preloadedLocalConfiguredInteractionLabel}
          localSide={localSide}
          onChangeLanguage={() => setShowLanguageSelector(true)}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          pttButtonClassName={pttButtonClassName}
          remoteHistoryEntries={remoteHistoryEntries}
          remoteTranslationSpeechControl={translationSpeechControl}
          side={side}
          startPtt={startPtt}
          endPtt={endPtt}
          transcriptSpeechControl={transcriptSpeechControl}
          disclosure={visitorDisclosure}
          uiFallback={localSide.usesEnglishUiFallback}
          visibleStatusLabel={visibleStatusLabel}
          visitorCurrentLanguage={visitorCurrentLanguage}
          visitorLabels={visitorLabels}
          visitorStatusLabels={visitorStatusLabels}
        />
      </>
    );
  }

  return (
    <>
      {setupWizardOverlays}
      {runtimeIssueBanner}
      {shutdownNotice}
      <OperatorSessionScreen
        canShutdownComputer={canShutdownComputer}
        canTalk={canTalk}
        isRemoteSpeaking={isRemoteSpeaking}
        labels={labels}
        language={uiLanguage}
        localizedRoleLabels={localizedRoleLabels}
        localHistoryEntries={localHistoryEntries}
        localInteractionChoice={localInteractionChoice}
        localInteractionEnglishLabel={localInteractionEnglishLabel}
        localInteractionFallbackLabel={languageLabel(localSide.selectedTargetLanguage)}
        localConfiguredInteractionLabel={preloadedLocalConfiguredInteractionLabel}
        localSide={localSide}
        localStatusLabel={localStatusLabel}
        onChangeLanguage={() => setShowLanguageSelector(true)}
        onCloseApp={() => setConfirmAction("close")}
        onOpenSetupWizard={openSetupWizard}
        onShutdownComputer={() => {
          setShutdownFeedback(null);
          setConfirmAction("shutdown");
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onResetSession={() => setConfirmAction("reset")}
        pttButtonClassName={pttButtonClassName}
        readingLanguageLabel={languageLabel(localSide.selectedTargetLanguage)}
        remoteHistoryEntries={remoteHistoryEntries}
        remoteTranslationSpeechControl={translationSpeechControl}
        remoteInteractionChoice={remoteInteractionChoice}
        remoteInteractionEnglishLabel={remoteInteractionEnglishLabel}
        remoteInteractionFallbackLabel={languageLabel(remoteSide.selectedTargetLanguage)}
        remoteConfiguredInteractionLabel={remoteConfiguredInteractionLabel}
        remoteUiFallback={remoteSide.usesEnglishUiFallback}
        shouldShowRemoteLanguageLine={shouldShowRemoteLanguageLine}
        side={side}
        sourceLanguageFooter={
          <span>{labels.sourceLanguage}: {sourceLanguageLabel(localSide.detectedSourceLanguage ?? localSide.sourceLanguage)}</span>
        }
        startPtt={startPtt}
        transcriptSpeechControl={transcriptSpeechControl}
        endPtt={endPtt}
        waitingForRemoteLanguage={waitingForRemoteLanguage}
        disclosure={operatorDisclosure}
      />
      {confirmAction === "reset" ? (
        <ConfirmDialog
          title={labels.confirmReset}
          description={labels.confirmResetDescription}
          confirmLabel={labels.confirm}
          cancelLabel={labels.cancel}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            setConfirmAction(null);
            setShutdownFeedback(null);
            onlySpeechApi.sendOperatorAction({ type: "request-reset", side });
          }}
        />
      ) : null}
      {confirmAction === "close" ? (
        <ConfirmDialog
          title={labels.confirmClose}
          description={labels.confirmCloseDescription}
          confirmLabel={labels.confirm}
          cancelLabel={labels.cancel}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            setConfirmAction(null);
            setShutdownFeedback(null);
            onlySpeechApi.sendOperatorAction({ type: "request-close", side });
          }}
        />
      ) : null}
      {confirmAction === "shutdown" ? (
        <ConfirmDialog
          title={labels.confirmShutdown}
          description={labels.confirmShutdownDescription}
          confirmLabel={labels.confirm}
          cancelLabel={labels.cancel}
          onCancel={() => setConfirmAction(null)}
          onConfirm={async () => {
            setConfirmAction(null);
            try {
              const result = await onlySpeechApi.shutdownComputer();
              if (!result.ok) {
                setShutdownFeedback(result.message);
              }
            } catch (error) {
              setShutdownFeedback(error instanceof Error ? error.message : String(error));
            }
          }}
        />
      ) : null}
    </>
  );
}
