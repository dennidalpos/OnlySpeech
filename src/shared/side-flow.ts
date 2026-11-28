import type { AppState, Side } from "./types.js";
import type { SideState } from "./types.js";
import { hasBlockingIssuesThatPreventInterface } from "./runtime-profiles.js";

export type OperatorViewMode =
  | "boot"
  | "technical-error"
  | "operator-language-selection"
  | "visitor-language-selection"
  | "operator-session"
  | "visitor-session";

interface ResolveOperatorViewModeOptions {
  appState: AppState | null;
  side: Side;
  showLanguageSelector: boolean;
  visitorLanguageCommitted: boolean;
}

export function hasCommittedLanguageSelection(sideState: SideState): boolean {
  return sideState.hasCommittedLanguageSelection ?? true;
}

export function shouldResetVisitorLanguageCommitment(side: Side, selectedTargetLanguage: string | null): boolean {
  return side === "B" && !selectedTargetLanguage;
}

export function shouldShowRemoteUserLanguage(side: Side, remoteSelectedTargetLanguage: string | null): boolean {
  return side === "A" && Boolean(remoteSelectedTargetLanguage);
}

export function shouldShowVisitorLanguageSelection(
  side: Side,
  visitorLanguageCommitted: boolean,
  showLanguageSelector: boolean,
  clearTriggeredAt: string | null
): boolean {
  return side === "B" && (Boolean(clearTriggeredAt) || !visitorLanguageCommitted || showLanguageSelector);
}

export function resolveOperatorViewMode({
  appState,
  side,
  showLanguageSelector,
  visitorLanguageCommitted
}: ResolveOperatorViewModeOptions): OperatorViewMode {
  if (!appState) {
    return "boot";
  }

  if (hasBlockingIssuesThatPreventInterface(appState.health.blockingIssues)) {
    return "technical-error";
  }

  if (side === "A" && (!hasCommittedLanguageSelection(appState.sides.A) || showLanguageSelector)) {
    return "operator-language-selection";
  }

  if (shouldShowVisitorLanguageSelection(side, visitorLanguageCommitted, showLanguageSelector, appState.clearTriggeredAt)) {
    return "visitor-language-selection";
  }

  if (showLanguageSelector) {
    return "operator-language-selection";
  }

  return side === "B" ? "visitor-session" : "operator-session";
}

function isRelevantMicrophoneIssueForSide(appState: AppState, side: Side, issueCode: string): boolean {
  const sharedMicrophoneMode = appState.microphonePttMode === "single-shared";

  switch (issueCode) {
    case "missing-microphone-a":
      return side === "A" || sharedMicrophoneMode;
    case "missing-microphone-b":
      return side === "B" || sharedMicrophoneMode;
    case "microphone-permission-denied":
    case "microphone-unavailable":
      return sharedMicrophoneMode;
    default:
      return false;
  }
}

export function getBlockingIssuesForSide(appState: AppState, side: Side) {
  return appState.health.blockingIssues.filter((issue) => {
    switch (issue.code) {
      case "missing-microphone-a":
      case "missing-microphone-b":
        return isRelevantMicrophoneIssueForSide(appState, side, issue.code);
      case "microphone-permission-denied":
      case "microphone-unavailable":
        if (!issue.side) {
          return true;
        }

        return issue.side === side || isRelevantMicrophoneIssueForSide(appState, side, issue.code);
      default:
        return !issue.side || issue.side === side;
    }
  });
}

export function canSideUseSpeech(appState: AppState, side: Side): boolean {
  if (appState.appMode === "demo") {
    return false;
  }

  return (
    getBlockingIssuesForSide(appState, side).length === 0 &&
    hasCommittedLanguageSelection(appState.sides.A) &&
    hasCommittedLanguageSelection(appState.sides.B) &&
    Boolean(appState.sides.A.selectedTargetLanguage) &&
    Boolean(appState.sides.B.selectedTargetLanguage)
  );
}

export function areSidesReadyForSpeech(appState: AppState): boolean {
  return (
    canSideUseSpeech(appState, "A") &&
    canSideUseSpeech(appState, "B")
  );
}

export function resolveRemoteTargetLanguage(appState: AppState, side: Side): string | null {
  const remoteSide = appState.sides[side === "A" ? "B" : "A"];
  if (!hasCommittedLanguageSelection(remoteSide)) {
    return null;
  }

  return remoteSide.normalizedTargetLanguage ?? remoteSide.selectedTargetLanguage;
}
