import { useEffect, useRef } from "react";
import { findSourceLanguageOption } from "../../../shared/language-options.js";
import { getInteractionLanguageLabel } from "../../../shared/language-registry.js";
import { getVisitorLocalizedLanguageLabel } from "../../../shared/visitor-localization.js";
import type { ConversationTurn, Side } from "../../../shared/types.js";

interface ConversationHistoryProps {
  title: string;
  emptyHint: string;
  speakerLabels: Record<Side, string>;
  entries: ConversationTurn[];
  viewerSide: Side;
  field: "transcript" | "translation";
  languageDisplayLocale?: string | null;
  automaticSourceLanguageLabel?: string | null;
}

function sourceLanguageLabel(
  languageCode: string | null,
  languageDisplayLocale?: string | null,
  automaticSourceLanguageLabel: string | null = "Auto"
): string | null {
  if (!languageCode) {
    return automaticSourceLanguageLabel;
  }

  if (languageDisplayLocale) {
    return getVisitorLocalizedLanguageLabel(languageCode, languageDisplayLocale);
  }

  return findSourceLanguageOption(languageCode)?.label ?? languageCode;
}

function targetLanguageLabel(languageCode: string | null, languageDisplayLocale?: string | null): string {
  if (languageDisplayLocale) {
    return getVisitorLocalizedLanguageLabel(languageCode, languageDisplayLocale);
  }

  return getInteractionLanguageLabel(languageCode);
}

export function ConversationHistory({
  title,
  emptyHint,
  speakerLabels,
  entries,
  viewerSide,
  field,
  languageDisplayLocale,
  automaticSourceLanguageLabel
}: ConversationHistoryProps) {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = listRef.current;
    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [entries.length]);

  return (
    <section className="conversation-history">
      <header className="conversation-history-header">
        <span className="conversation-history-title">{title}</span>
        <span className="conversation-history-count">{entries.length}</span>
      </header>

      <div className="conversation-history-list" ref={listRef}>
        {entries.length === 0 ? <p className="conversation-history-empty">{emptyHint}</p> : null}

        {entries.map((entry) => {
          const isOwnTurn = entry.speakerSide === viewerSide;
          const value = field === "transcript" ? entry.transcript : entry.translation;
          const resolvedSourceLanguage = sourceLanguageLabel(
            entry.sourceLanguage,
            languageDisplayLocale,
            automaticSourceLanguageLabel
          );
          const resolvedTargetLanguage = targetLanguageLabel(entry.targetLanguage, languageDisplayLocale);
          const className = [
            "history-bubble",
            isOwnTurn ? "history-bubble-own" : "history-bubble-other"
          ].join(" ");

          return (
            <article className={className} key={entry.id}>
              <header className="history-bubble-header">
                <div className="history-bubble-labels">
                  <span className="history-bubble-sequence">#{entry.sequence}</span>
                  <strong>{speakerLabels[entry.speakerSide]}</strong>
                </div>
                <span className="history-bubble-meta">
                  {resolvedSourceLanguage ? `${resolvedSourceLanguage} -> ${resolvedTargetLanguage}` : resolvedTargetLanguage}
                </span>
              </header>
              <p className={`history-bubble-text${value ? "" : " is-empty"}`}>{value || "-"}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
