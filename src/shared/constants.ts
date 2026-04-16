import { SUPPORTED_TARGET_LANGUAGE_OPTIONS } from "./language-options.js";
import type { LanguageOption, Side } from "./types.js";

export const SIDES: Side[] = ["A", "B"];

export const MIN_SETUP_WIZARD_PASSWORD_LENGTH = 8;

export const DEFAULT_LANGUAGE_OPTIONS: LanguageOption[] = SUPPORTED_TARGET_LANGUAGE_OPTIONS.map((option) => ({
  ...option
}));

export const IPC_CHANNELS = {
  getActivationGateState: "onlyspeech:get-activation-gate-state",
  submitActivation: "onlyspeech:submit-activation",
  submitTrial: "onlyspeech:submit-trial",
  operatorAction: "onlyspeech:operator-action",
  openSetupWizard: "onlyspeech:open-setup-wizard",
  setDemoPaused: "onlyspeech:set-demo-paused",
  getSetupWizardAccessState: "onlyspeech:get-setup-wizard-access-state",
  requestSetupWizardAccess: "onlyspeech:request-setup-wizard-access",
  getAzureTextToSpeechCatalogSnapshot: "onlyspeech:get-azure-text-to-speech-catalog-snapshot",
  getShutdownCapability: "onlyspeech:get-shutdown-capability",
  deviceProbe: "onlyspeech:device-probe",
  speechEvent: "onlyspeech:speech-event",
  processSpeechTurn: "onlyspeech:process-speech-turn",
  synthesizeTextToSpeech: "onlyspeech:synthesize-text-to-speech",
  textToSpeechRequest: "onlyspeech:text-to-speech-request",
  textToSpeechStop: "onlyspeech:text-to-speech-stop",
  textToSpeechEvent: "onlyspeech:text-to-speech-event",
  shutdownComputer: "onlyspeech:shutdown-computer",
  state: "onlyspeech:state",
  command: "onlyspeech:command"
} as const;
