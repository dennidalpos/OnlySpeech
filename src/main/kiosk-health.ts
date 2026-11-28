import { hasSpeechRecognitionConfig, hasTranslationProviderConfig } from "../shared/config.js";
import type { HealthState, RuntimeConfig, TechnicalIssue } from "../shared/types.js";
import { getProviderAdapter } from "../services/speech/provider-adapters.js";

export function getSpeechIssues(config: RuntimeConfig): TechnicalIssue[] {
  const provider = getProviderAdapter(config.translationProvider);
  if (!provider.supportsStt) {
    return [
      {
        code: "speech-config-missing",
        message: `${provider.label} does not expose speech-to-text for the live kiosk path.`,
        retryable: false
      }
    ];
  }

  if (hasSpeechRecognitionConfig(config)) {
    return [];
  }

  return [
    {
      code: "speech-config-missing",
      message:
        config.translationProvider === "chatgpt"
          ? "Configurazione ChatGPT mancante per il riconoscimento vocale del provider selezionato."
          : "Configurazione Azure Speech mancante per il riconoscimento live.",
      retryable: false
    }
  ];
}

export function getTranslationIssues(config: RuntimeConfig): TechnicalIssue[] {
  const provider = getProviderAdapter(config.translationProvider);
  if (!provider.supportsTranslation) {
    return [
      {
        code: "translation-config-missing",
        message: `${provider.label} does not expose translation for the active runtime path.`,
        retryable: false
      }
    ];
  }

  if (hasTranslationProviderConfig(config)) {
    return [];
  }

  return [
    {
      code: "translation-config-missing",
      message: `Configurazione provider traduzione mancante: ${config.translationProvider}.`,
      retryable: false
    }
  ];
}

export function buildHealthState(params: {
  config: RuntimeConfig;
  displayIssues: TechnicalIssue[];
  microphoneIssues: TechnicalIssue[];
  transientIssues: TechnicalIssue[];
  displayAssignments: HealthState["displayAssignments"];
  microphoneAssignments: HealthState["microphoneAssignments"];
}): HealthState {
  const microphoneIssues = params.config.appMode === "demo" ? [] : params.microphoneIssues;
  const speechIssues = params.config.appMode === "demo" ? [] : getSpeechIssues(params.config);
  const translationIssues = params.config.appMode === "demo" ? [] : getTranslationIssues(params.config);
  const blockingIssues = [
    ...params.displayIssues,
    ...microphoneIssues,
    ...speechIssues,
    ...translationIssues,
    ...params.transientIssues
  ];

  return {
    displaysReady: params.displayIssues.length === 0,
    microphonesReady: microphoneIssues.length === 0,
    speechReady: speechIssues.length === 0,
    translationReady: translationIssues.length === 0,
    blockingIssues,
    displayAssignments: params.displayAssignments,
    microphoneAssignments: params.microphoneAssignments
  };
}

export function getBlockingIssueSignature(blockingIssues: TechnicalIssue[]): string {
  return JSON.stringify(
    blockingIssues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      side: issue.side,
      details: issue.details ?? null
    }))
  );
}
