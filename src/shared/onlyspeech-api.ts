import type {
  ActivationGateState,
  ActivationSubmissionRequest,
  ActivationSubmissionResult,
  AppState,
  DeviceProbePayload,
  OperatorAction,
  RendererCommand,
  SetupWizardAccessRequest,
  SetupWizardAccessResult,
  SetupWizardAccessState,
  ShutdownComputerResult,
  SpeechEventPayload,
  StopTextToSpeechRequest,
  TextToSpeechEventPayload,
  TextToSpeechRequest,
  TextToSpeechSynthesisResponse,
  StartTextToSpeechCommand,
  SpeechTurnRequest,
  SpeechTurnResult
} from "./types.js";

export interface OnlySpeechRendererApi {
  getActivationGateState?(): Promise<ActivationGateState>;
  submitActivation?(request: ActivationSubmissionRequest): Promise<ActivationSubmissionResult>;
  submitTrial?(): Promise<ActivationSubmissionResult>;
  sendOperatorAction(action: OperatorAction): void;
  openSetupWizard(): void;
  setDemoPaused?(paused: boolean): Promise<void>;
  getSetupWizardAccessState?(): Promise<SetupWizardAccessState>;
  requestSetupWizardAccess?(request: SetupWizardAccessRequest): Promise<SetupWizardAccessResult>;
  getShutdownCapability?(): Promise<boolean>;
  sendDeviceProbe(payload: DeviceProbePayload): void;
  sendSpeechEvent(payload: SpeechEventPayload): void;
  processSpeechTurn(request: SpeechTurnRequest): Promise<SpeechTurnResult>;
  synthesizeTextToSpeech(request: StartTextToSpeechCommand): Promise<TextToSpeechSynthesisResponse>;
  requestTextToSpeech(request: TextToSpeechRequest): void;
  stopTextToSpeech(request?: StopTextToSpeechRequest): void;
  sendTextToSpeechEvent(payload: TextToSpeechEventPayload): void;
  shutdownComputer(): Promise<ShutdownComputerResult>;
  onState(listener: (state: AppState) => void): () => void;
  onCommand(listener: (command: RendererCommand) => void): () => void;
}

declare global {
  interface Window {
    onlySpeech?: OnlySpeechRendererApi;
  }
}

export function getOnlySpeechRendererApi(): OnlySpeechRendererApi | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.onlySpeech ?? null;
}

export {};
