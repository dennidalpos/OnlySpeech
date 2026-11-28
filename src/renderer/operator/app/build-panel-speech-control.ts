import type { Side, TextToSpeechState } from "../../../shared/types.js";

interface PanelSpeechControlText {
  busyState: string;
  errorState: string;
  playButton: string;
  playPanelLabel: (panelTitle: string) => string;
  playingState: string;
  stopButton: string;
  stopPanelLabel: (panelTitle: string) => string;
  unavailableState: string;
}

interface BuildPanelSpeechControlOptions {
  activeSide: Side | null;
  activeTextToSpeech: TextToSpeechState;
  language: string | null;
  panelText: PanelSpeechControlText;
  panelTitle: string;
  requestTextToSpeech: (request: {
    side: Side;
    content: "transcript" | "translation";
    text: string;
    language: string | null;
  }) => void;
  side: Side;
  stopTextToSpeech: (request: {
    side: Side;
    content: "transcript" | "translation";
  }) => void;
  text: string;
  content: "transcript" | "translation";
}

export function buildPanelSpeechControl(options: BuildPanelSpeechControlOptions) {
  const {
    activeSide,
    activeTextToSpeech,
    content,
    language,
    panelText,
    panelTitle,
    requestTextToSpeech,
    side,
    stopTextToSpeech,
    text
  } = options;
  const isCurrentPanel = activeTextToSpeech.side === side && activeTextToSpeech.content === content;
  const isPlaying =
    isCurrentPanel &&
    (activeTextToSpeech.status === "playing" || activeTextToSpeech.status === "starting");
  const hasText = text.trim().length > 0;
  const blockedBySpeechCapture = activeSide !== null;
  const disabled = (!hasText && !isPlaying) || (blockedBySpeechCapture && !isPlaying);

  let status: string | null = null;
  if (isPlaying) {
    status = panelText.playingState;
  } else if (isCurrentPanel && activeTextToSpeech.status === "unavailable") {
    status = panelText.unavailableState;
  } else if (isCurrentPanel && activeTextToSpeech.status === "error") {
    status = panelText.errorState;
  } else if (blockedBySpeechCapture && hasText) {
    status = panelText.busyState;
  }

  return {
    active: isPlaying,
    disabled,
    label: isPlaying ? panelText.stopButton : panelText.playButton,
    status,
    title: isPlaying ? panelText.stopPanelLabel(panelTitle) : panelText.playPanelLabel(panelTitle),
    onClick: () => {
      if (isPlaying) {
        stopTextToSpeech({
          side,
          content
        });
        return;
      }

      if (disabled) {
        return;
      }

      requestTextToSpeech({
        side,
        content,
        text,
        language
      });
    }
  };
}
