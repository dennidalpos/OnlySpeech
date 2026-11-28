import type {
  ComponentProps,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode
} from "react";
import type { ConversationTurn, Side, SideState, UiLanguage } from "../../../shared/types.js";
import type { InteractionLanguageChoice } from "../../../shared/language-flow.js";
import { ConversationHistory } from "./ConversationHistory.js";
import { LanguageHeaderChip } from "./LanguageHeaderChip.js";
import { StatusBadge } from "./StatusBadge.js";
import { TextPanel } from "./TextPanel.js";

interface OperatorSessionScreenProps {
  canShutdownComputer: boolean;
  canTalk: boolean;
  isRemoteSpeaking: boolean;
  labels: {
    changeLanguage: string;
    closeApp: string;
    confirmClose: string;
    confirmCloseDescription: string;
    confirmReset: string;
    confirmResetDescription: string;
    confirmShutdown: string;
    confirmShutdownDescription: string;
    conversationHistory: string;
    conversationHistoryHint: string;
    interactionLanguage: string;
    localTranscript: string;
    localTranscriptHint: string;
    openSetup: string;
    otherUserLanguage: string;
    ptt: string;
    pttReady: string;
    pttUnavailable: string;
    readingLanguage: string;
    remoteTranslation: string;
    remoteTranslationHint: string;
    resetSession: string;
    shutdownComputer: string;
    sourceLanguage: string;
    stationLabel: (side: Side) => string;
    waitingRemoteLanguage: string;
  };
  language: UiLanguage;
  localizedRoleLabels: { A: string; B: string };
  localHistoryEntries: ConversationTurn[];
  localInteractionChoice: InteractionLanguageChoice | null;
  localInteractionEnglishLabel: string | null;
  localInteractionFallbackLabel: string;
  localConfiguredInteractionLabel?: string | null;
  localSide: SideState;
  localStatusLabel: string;
  onChangeLanguage: () => void;
  onCloseApp: () => void;
  onOpenSetupWizard: () => void;
  onShutdownComputer: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event?: ReactPointerEvent<HTMLButtonElement>) => void;
  onResetSession: () => void;
  pttButtonClassName: string;
  readingLanguageLabel: string;
  remoteHistoryEntries: ConversationTurn[];
  remoteTranslationSpeechControl: ComponentProps<typeof TextPanel>["speechControl"];
  remoteInteractionChoice: InteractionLanguageChoice | null;
  remoteInteractionEnglishLabel: string | null;
  remoteInteractionFallbackLabel: string;
  remoteConfiguredInteractionLabel?: string | null;
  remoteUiFallback?: boolean;
  shouldShowRemoteLanguageLine: boolean;
  side: Side;
  sourceLanguageFooter: ReactNode;
  startPtt: () => void;
  transcriptSpeechControl: ComponentProps<typeof TextPanel>["speechControl"];
  endPtt: () => void;
  waitingForRemoteLanguage: boolean;
  disclosure: ReactNode;
}

export function OperatorSessionScreen(props: OperatorSessionScreenProps) {
  const {
    canShutdownComputer,
    canTalk,
    endPtt,
    isRemoteSpeaking,
    labels,
    language,
    localizedRoleLabels,
    localHistoryEntries,
    localInteractionChoice,
    localInteractionEnglishLabel,
    localInteractionFallbackLabel,
    localConfiguredInteractionLabel,
    localSide,
    localStatusLabel,
    onChangeLanguage,
    onCloseApp,
    onOpenSetupWizard,
    onShutdownComputer,
    onPointerDown,
    onPointerUp,
    onResetSession,
    pttButtonClassName,
    readingLanguageLabel,
    remoteHistoryEntries,
    remoteTranslationSpeechControl,
    remoteInteractionChoice,
    remoteInteractionEnglishLabel,
    remoteInteractionFallbackLabel,
    remoteConfiguredInteractionLabel,
    remoteUiFallback,
    shouldShowRemoteLanguageLine,
    side,
    sourceLanguageFooter,
    startPtt,
    transcriptSpeechControl,
    waitingForRemoteLanguage,
    disclosure
  } = props;

  const handlePttKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if ((event.code !== "Space" && event.code !== "Enter" && event.code !== "NumpadEnter") || event.repeat) {
      return;
    }

    event.preventDefault();
    startPtt();
  };

  const handlePttKeyUp = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.code !== "Space" && event.code !== "Enter" && event.code !== "NumpadEnter") {
      return;
    }

    event.preventDefault();
    endPtt();
  };

  return (
    <div className="operator-screen">
      <header className="top-bar">
        <div className="header-copy">
          <span className="eyebrow">OnlySpeech · {labels.stationLabel(side)}</span>
          <div className="header-chip-row">
            <LanguageHeaderChip
              title={labels.interactionLanguage}
              choice={localInteractionChoice}
              fallbackLabel={localInteractionFallbackLabel}
              language={language}
              englishLabel={localInteractionEnglishLabel}
              configuredLabel={localConfiguredInteractionLabel}
              uiFallback={localSide.usesEnglishUiFallback}
            />
            {shouldShowRemoteLanguageLine ? (
              <LanguageHeaderChip
                title={labels.otherUserLanguage}
                choice={remoteInteractionChoice}
                fallbackLabel={remoteInteractionFallbackLabel}
                language={language}
                englishLabel={remoteInteractionEnglishLabel}
                configuredLabel={remoteConfiguredInteractionLabel}
                uiFallback={remoteUiFallback}
              />
            ) : null}
          </div>
        </div>
        <div className="header-actions">
          <button
            className="icon-button"
            type="button"
            onClick={onOpenSetupWizard}
            aria-label={labels.openSetup}
            title={labels.openSetup}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.08 7.08 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.49-.42h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.58.22-1.12.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.51.41 1.05.72 1.63.94l.36 2.54c.04.24.25.42.49.42h3.84c.24 0 .45-.18.49-.42l.36-2.54c.58-.22 1.12-.53 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z" />
            </svg>
          </button>
          {canShutdownComputer ? (
            <button
              className="icon-button icon-button-danger"
              type="button"
              onClick={onShutdownComputer}
              aria-label={labels.shutdownComputer}
              title={labels.shutdownComputer}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13 3h-2v10h2V3zm4.83 2.17-1.42 1.42A6.92 6.92 0 0 1 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.28 1.09-4.3 2.79-5.61L6.38 5.17A8.93 8.93 0 0 0 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9a8.93 8.93 0 0 0-3.17-6.83z" />
              </svg>
            </button>
          ) : null}
          <StatusBadge status={localSide.status} language={language} />
        </div>
      </header>

      <main className="content-grid">
        <TextPanel
          title={labels.localTranscript}
          value={localSide.localTranscript}
          hint={labels.localTranscriptHint}
          accent="warm"
          speechControl={transcriptSpeechControl}
          footer={sourceLanguageFooter}
          history={
            <ConversationHistory
              title={labels.conversationHistory}
              emptyHint={labels.conversationHistoryHint}
              speakerLabels={localizedRoleLabels}
              entries={localHistoryEntries}
              viewerSide={side}
              field="transcript"
            />
          }
        />
        <TextPanel
          title={labels.remoteTranslation}
          value={localSide.remoteTranslation}
          hint={waitingForRemoteLanguage ? labels.waitingRemoteLanguage : labels.remoteTranslationHint}
          accent="cool"
          speechControl={remoteTranslationSpeechControl}
          footer={<span>{labels.readingLanguage}: {readingLanguageLabel}</span>}
          history={
            <ConversationHistory
              title={labels.conversationHistory}
              emptyHint={labels.conversationHistoryHint}
              speakerLabels={localizedRoleLabels}
              entries={remoteHistoryEntries}
              viewerSide={side}
              field="translation"
            />
          }
        />
      </main>

      <div className="session-bottom-stack">
        {disclosure}

        <footer className="action-area">
          <button
            className={pttButtonClassName}
            type="button"
            disabled={!canTalk}
            aria-disabled={!canTalk}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={handlePttKeyDown}
            onKeyUp={handlePttKeyUp}
            onMouseDown={() => startPtt()}
            onMouseUp={() => endPtt()}
            onTouchStart={() => startPtt()}
            onTouchEnd={() => endPtt()}
            onLostPointerCapture={() => endPtt()}
          >
            <span>{labels.ptt}</span>
            <strong>{canTalk ? labels.pttReady : isRemoteSpeaking ? localStatusLabel : labels.pttUnavailable}</strong>
          </button>

          <div className="inline-actions inline-actions-operator">
            <button className="secondary-button" type="button" onClick={onChangeLanguage}>
              {labels.changeLanguage}
            </button>
            <button className="secondary-button" type="button" onClick={onResetSession}>
              {labels.resetSession}
            </button>
            <button className="danger-button" type="button" onClick={onCloseApp}>
              {labels.closeApp}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
