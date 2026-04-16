import type { ComponentProps, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import type { AppState, ConversationTurn, Side, SideState } from "../../../shared/types.js";
import type { InteractionLanguageChoice } from "../../../shared/language-flow.js";
import { resolveBrowserUiLanguage } from "../../../shared/ui-localization.js";
import { ConversationHistory } from "./ConversationHistory.js";
import { LanguageHeaderChip } from "./LanguageHeaderChip.js";
import { StatusBadge } from "./StatusBadge.js";
import { TextPanel } from "./TextPanel.js";

interface VisitorSessionScreenProps {
  appState: AppState;
  canTalk: boolean;
  isRemoteSpeaking: boolean;
  localHistoryEntries: ConversationTurn[];
  localInteractionChoice: InteractionLanguageChoice | null;
  localConfiguredInteractionLabel?: string | null;
  localSide: SideState;
  onChangeLanguage: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event?: ReactPointerEvent<HTMLButtonElement>) => void;
  pttButtonClassName: string;
  remoteHistoryEntries: ConversationTurn[];
  remoteTranslationSpeechControl: ComponentProps<typeof TextPanel>["speechControl"];
  side: Side;
  startPtt: () => void;
  endPtt: () => void;
  transcriptSpeechControl: ComponentProps<typeof TextPanel>["speechControl"];
  uiFallback?: boolean;
  visibleStatusLabel: string;
  visitorCurrentLanguage: string;
  disclosure: ReactNode;
  visitorLabels: {
    changeLanguage: string;
    conversationHistory: string;
    conversationHistoryHint: string;
    currentLanguage: string;
    holdToSpeak: string;
    operatorTranslation: string;
    operatorTranslationHint: string;
    pressAndSpeak: string;
    waitingAvailability: string;
    whatYouSay: string;
    whatYouSayHint: string;
  };
  visitorStatusLabels: Record<SideState["status"], string>;
}

export function VisitorSessionScreen(props: VisitorSessionScreenProps) {
  const {
    appState,
    canTalk,
    endPtt,
    isRemoteSpeaking,
    localHistoryEntries,
    localInteractionChoice,
    localConfiguredInteractionLabel,
    localSide,
    onChangeLanguage,
    onPointerDown,
    onPointerUp,
    pttButtonClassName,
    remoteHistoryEntries,
    remoteTranslationSpeechControl,
    side,
    startPtt,
    transcriptSpeechControl,
    uiFallback,
    visibleStatusLabel,
    visitorCurrentLanguage,
    disclosure,
    visitorLabels,
    visitorStatusLabels
  } = props;

  return (
    <div className="visitor-screen">
      <header className="visitor-header">
        <div className="header-copy">
          <span className="eyebrow">OnlySpeech</span>
          <div className="header-chip-row">
            <LanguageHeaderChip
              title={visitorLabels.currentLanguage}
              choice={localInteractionChoice}
              fallbackLabel={visitorCurrentLanguage}
              language={resolveBrowserUiLanguage(localSide.effectiveUiLanguage)}
              configuredLabel={localConfiguredInteractionLabel}
              showMeta={false}
              uiFallback={uiFallback}
            />
          </div>
        </div>
        <StatusBadge status={localSide.status} labels={visitorStatusLabels} />
      </header>

      <main className="visitor-content-grid">
        <TextPanel
          title={visitorLabels.whatYouSay}
          value={localSide.localTranscript}
          hint={visitorLabels.whatYouSayHint}
          accent="warm"
          speechControl={transcriptSpeechControl}
          history={
            appState.visitorConversationHistoryEnabled ? (
              <ConversationHistory
                title={visitorLabels.conversationHistory}
                emptyHint={visitorLabels.conversationHistoryHint}
                speakerLabels={{ A: "A", B: "B" }}
                entries={localHistoryEntries}
                viewerSide={side}
                field="transcript"
                languageDisplayLocale={localSide.effectiveUiLanguage}
                automaticSourceLanguageLabel={null}
              />
            ) : undefined
          }
        />
        <TextPanel
          title={visitorLabels.operatorTranslation}
          value={localSide.remoteTranslation}
          hint={visitorLabels.operatorTranslationHint}
          accent="cool"
          speechControl={remoteTranslationSpeechControl}
          history={
            appState.visitorConversationHistoryEnabled ? (
              <ConversationHistory
                title={visitorLabels.conversationHistory}
                emptyHint={visitorLabels.conversationHistoryHint}
                speakerLabels={{ A: "A", B: "B" }}
                entries={remoteHistoryEntries}
                viewerSide={side}
                field="translation"
                languageDisplayLocale={localSide.effectiveUiLanguage}
                automaticSourceLanguageLabel={null}
              />
            ) : undefined
          }
        />
      </main>

      <div className="session-bottom-stack">
        {disclosure}

        <footer className="visitor-actions">
          <button
            className={pttButtonClassName}
            type="button"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onMouseDown={() => startPtt()}
            onMouseUp={() => endPtt()}
            onTouchStart={() => startPtt()}
            onTouchEnd={() => endPtt()}
            onLostPointerCapture={() => endPtt()}
          >
            <span>{visitorLabels.holdToSpeak}</span>
            <strong>
              {canTalk
                ? visitorLabels.pressAndSpeak
                : isRemoteSpeaking
                  ? visibleStatusLabel
                  : visitorLabels.waitingAvailability}
            </strong>
          </button>
          <div className="inline-actions inline-actions-single">
            <button className="secondary-button" type="button" onClick={onChangeLanguage}>
              {visitorLabels.changeLanguage}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
