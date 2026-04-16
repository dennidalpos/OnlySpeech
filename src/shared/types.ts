import type { AppMode, MicrophonePttMode } from "./runtime-profiles.js";

export type Side = "A" | "B";
export type UiLanguage = string;

export type TranslationProvider = "azure" | "chatgpt";
export type RuntimeDisclosureMode = "standard" | "custom" | "disabled";
export type TextToSpeechEngine = "openai" | "azure";
export type TextToSpeechContent = "transcript" | "translation" | "technical";
export type TextToSpeechStatus = "idle" | "starting" | "playing" | "error" | "unavailable";

export interface RuntimeDisclosureSettings {
  mode: RuntimeDisclosureMode;
  customText: string | null;
}

export interface AzureTextToSpeechVoice {
  id: string;
  name: string;
  language: string;
  engine: "azure";
  localeName: string | null;
  localName: string | null;
  shortName: string;
  gender: string | null;
}

export interface AzureTextToSpeechCatalogSnapshot {
  region: string | null;
  status: "fresh" | "stale" | "unavailable";
  fetchedAt: string | null;
  freshUntil: string | null;
  voiceCount: number;
  error: string | null;
  voices: AzureTextToSpeechVoice[];
}

export interface SetupWizardTextToSpeechPreviewResult {
  requestId: string;
  engine: TextToSpeechEngine;
  language: string | null;
  voiceName: string | null;
  normalizedText: string;
  requestedLanguage: string;
  translated: boolean;
}

export interface TextToSpeechSynthesisResult {
  audioBase64: string;
  audioMimeType: string;
  engine: TextToSpeechEngine;
  language: string | null;
  voiceName: string | null;
}

export type TextToSpeechSynthesisResponse =
  | {
      ok: true;
      synthesis: TextToSpeechSynthesisResult;
    }
  | {
      ok: false;
      engine: TextToSpeechEngine;
      eventType: Extract<TextToSpeechEventPayload["type"], "error" | "unavailable">;
      message: string;
      errorCode?: string;
    };

export type ProviderTextToSpeechEngine = TextToSpeechEngine;

export interface ProviderTextToSpeechPolicy {
  primaryEngine: ProviderTextToSpeechEngine;
  fallbackEngine: ProviderTextToSpeechEngine | null;
  blockOnMissing: boolean;
}

export interface ResolveProviderTextToSpeechPolicyOptions {
  systemFallbackAvailable?: boolean;
  azureBackendAvailable?: boolean;
}

export interface SetupWizardAccessState {
  requiresPassword: boolean;
  mustChangePassword: boolean;
  temporaryPassword: string | null;
}

export interface SetupWizardAccessRequest {
  password: string;
  nextPassword?: string;
}

export interface ActivationSubmissionRequest {
  email: string;
  activationCode: string;
}

export type ActivationGateStatusCode =
  | "required"
  | "invalid-code"
  | "email-mismatch"
  | "expired-license"
  | "clock-rollback"
  | "invalid-state"
  | "trial-exhausted"
  | "success";

export interface ActivationGateState {
  status: Exclude<ActivationGateStatusCode, "success">;
  message: string;
}

export interface TrialAvailabilityState {
  eligible: boolean;
  exhaustedAt: string | null;
}

export type ActivationSubmissionResult =
  | {
      ok: true;
      status: "success";
      message: string;
    }
  | {
      ok: false;
      status: Exclude<ActivationGateStatusCode, "success">;
      message: string;
    };

export type ShutdownComputerResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export type SetupWizardAccessFailureCode =
  | "invalid-password"
  | "new-password-required"
  | "new-password-too-short";

export type SetupWizardAccessResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      code: SetupWizardAccessFailureCode;
      message: string;
    };

export interface TranslationProviderLanguageCapabilities {
  speechToText: boolean;
  translationTarget: boolean;
  preferredSourceLocale: string | null;
  targetCode: string | null;
}

export type OperatorStatus =
  | "booting"
  | "language-selection"
  | "ready"
  | "listening"
  | "translating"
  | "error";

export type BlockingIssueCode =
  | "missing-monitor"
  | "missing-microphone-a"
  | "missing-microphone-b"
  | "microphone-permission-denied"
  | "microphone-unavailable"
  | "speech-config-missing"
  | "translation-config-missing"
  | "translation-provider-failure"
  | "speech-stream-failure";

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LanguageOption {
  value: string;
  label: string;
}

export interface DetectedLanguage {
  code: string;
  label: string;
  confidence: string | null;
}

export interface DisplayAssignment {
  side: Side;
  displayId: number;
  label: string;
  bounds: Bounds;
  scaleFactor: number;
}

export interface MicrophoneDevice {
  deviceId: string;
  groupId: string;
  label: string;
  displayLabel?: string;
  normalizedLabel?: string;
  audioInputRole?: string;
  connectionType?: "usb" | "analog" | "bluetooth" | "hdmi" | "virtual" | "network" | "other";
  connectionLabel?: string;
}

export interface MicrophoneAssignment {
  side: Side;
  deviceId: string;
  label: string;
}

export interface TechnicalIssue {
  code: BlockingIssueCode;
  message: string;
  retryable: boolean;
  side?: Side;
  details?: string;
}

export interface HealthState {
  displaysReady: boolean;
  microphonesReady: boolean;
  speechReady: boolean;
  translationReady: boolean;
  blockingIssues: TechnicalIssue[];
  displayAssignments: DisplayAssignment[];
  microphoneAssignments: MicrophoneAssignment[];
}

export interface SideState {
  side: Side;
  selectedInteractionLanguage: string | null;
  normalizedTargetLanguage: string | null;
  sourceLanguage: string | null;
  hasCommittedLanguageSelection?: boolean;
  detectedSourceLanguage?: string | null;
  wizardDefaultUiLanguage?: string | null;
  requestedUiLanguage: string | null;
  effectiveUiLanguage: string;
  usesEnglishUiFallback: boolean;
  selectedTargetLanguage: string | null;
  localTranscript: string;
  remoteTranslation: string;
  status: OperatorStatus;
  error: TechnicalIssue | null;
  isActiveSpeaker: boolean;
}

export interface ConversationTurn {
  id: string;
  sequence: number;
  speakerSide: Side;
  transcript: string;
  translation: string;
  sourceLanguage: string | null;
  targetLanguage: string | null;
}

export interface AppState {
  sessionId: string;
  appMode: AppMode;
  microphonePttMode: MicrophonePttMode;
  translationProvider: TranslationProvider;
  runtimeDisclosure?: RuntimeDisclosureSettings;
  textToSpeechEnabled: boolean;
  activeSide: Side | null;
  lastActivityAt: string;
  clearTriggeredAt: string | null;
  sessionResetReason?: "idle-clear" | "hard-reset" | "language-change" | null;
  sessionResetSide?: Side | null;
  visitorConversationHistoryEnabled: boolean;
  conversationHistory: ConversationTurn[];
  textToSpeech: TextToSpeechState;
  sides: Record<Side, SideState>;
  health: HealthState;
}

export interface TextToSpeechState {
  side: Side | null;
  content: TextToSpeechContent | null;
  requestId: string | null;
  status: TextToSpeechStatus;
  engine: TextToSpeechEngine | null;
  language: string | null;
  voiceName: string | null;
  error: string | null;
}

export interface LogRecord {
  timestamp: string;
  session_id: string;
  side?: Side;
  event: string;
  selected_interaction_language?: string | null;
  normalized_target_language?: string | null;
  source_language?: string | null;
  target_language?: string | null;
  requested_ui_language?: string | null;
  effective_ui_language?: string | null;
  english_ui_fallback?: boolean | null;
  text?: string | null;
  details?: Record<string, unknown>;
  error?: string | null;
}

export interface OperatorAction {
  type:
    | "renderer-ready"
    | "activity"
    | "select-target-language"
    | "request-ptt-down"
    | "request-ptt-up"
    | "request-reset"
    | "request-close"
    | "retry-health-check";
  side: Side;
  targetLanguage?: string;
  sourceLanguage?: string;
}

export interface DeviceProbePayload {
  side: Side;
  devices: MicrophoneDevice[];
  permissionGranted: boolean;
  failureKind?: "permission-denied" | "device-unavailable";
  error?: string;
}

export interface SpeechStartCommand {
  type: "start-speech";
  side: Side;
  sessionId: string;
  translationProvider: TranslationProvider;
  sourceLanguage: string;
  targetLanguage: string;
  microphoneDeviceId: string;
  azureKey: string;
  azureRegion: string;
  chatGptSilenceRmsThreshold: number;
  audioEchoCancellation: boolean;
  audioNoiseSuppression: boolean;
}

export interface SpeechStopCommand {
  type: "stop-speech";
  side: Side;
}

export interface ProbeDevicesCommand {
  type: "probe-devices";
}

export interface StartTextToSpeechCommand {
  type: "start-tts";
  side: Side;
  content: TextToSpeechContent;
  requestId: string;
  text: string;
  language: string | null;
  engine: TextToSpeechEngine;
  translationProvider?: TranslationProvider | null;
  azureSpeechKey?: string | null;
  azureSpeechRegion?: string | null;
  chatGptApiKey?: string | null;
  chatGptTextToSpeechModel?: string | null;
  chatGptTextToSpeechVoice?: string | null;
}

export interface StopTextToSpeechCommand {
  type: "stop-tts";
  side: Side;
  requestId: string | null;
  reason?: string;
}

export type RendererCommand =
  | SpeechStartCommand
  | SpeechStopCommand
  | ProbeDevicesCommand
  | StartTextToSpeechCommand
  | StopTextToSpeechCommand;

export interface SpeechEventPayload {
  type:
    | "speech-started"
    | "speech-stopped"
    | "recognizing"
    | "recognized"
    | "partial-degraded"
    | "partial-failed"
    | "canceled"
    | "error";
  sessionId: string;
  side: Side;
  transcript?: string;
  translation?: string;
  error?: string;
  detectedLanguage?: string;
  detectedLanguageConfidence?: string | null;
  details?: Record<string, unknown>;
}

export interface TextToSpeechRequest {
  side: Side;
  content: TextToSpeechContent;
  text: string;
  language: string | null;
}

export interface StopTextToSpeechRequest {
  side?: Side;
  content?: TextToSpeechContent;
}

export interface TextToSpeechEventPayload {
  type: "started" | "ended" | "stopped" | "error" | "unavailable";
  side: Side;
  content: TextToSpeechContent;
  requestId: string;
  engine: TextToSpeechEngine;
  language: string | null;
  voiceName?: string | null;
  error?: string;
  errorCode?: string;
}

export interface RuntimeConfig {
  appMode: AppMode;
  microphonePttMode: MicrophonePttMode;
  setupUiLanguage?: UiLanguage;
  selectorUiLanguageA?: UiLanguage;
  selectorUiLanguageB?: UiLanguage;
  demoSlideIntervalSeconds: number;
  runtimeDisclosure?: RuntimeDisclosureSettings;
  textToSpeechEnabled: boolean;
  requiredMonitors: number;
  requiredMicrophones: number;
  displayAId: number | null;
  displayBId: number | null;
  micAId: string | null;
  micBId: string | null;
  idleClearSeconds: number;
  idleHardResetSeconds: number;
  pttReleaseGraceMs: number;
  providerRequestTimeoutMs: number;
  chatGptSilenceRmsThreshold: number;
  visitorConversationHistoryEnabled: boolean;
  audioEchoCancellation: boolean;
  audioNoiseSuppression: boolean;
  azureSpeechKey: string;
  azureSpeechRegion: string;
  azureTranslatorKey?: string;
  azureTranslatorRegion?: string;
  azureTranslatorEndpoint?: string | null;
  translationProvider: TranslationProvider;
  chatGptApiKey: string;
  chatGptModel: string;
  chatGptTranscribeModel: string;
  defaultTargetLangA: string;
  defaultTargetLangB: string;
  defaultSourceLangA: string;
  defaultSourceLangB: string;
  logLevel: string;
}

export interface TranslationRequest {
  provider: TranslationProvider;
  sourceLanguage: string;
  targetLanguage: string;
  text: string;
}

export interface SpeechTurnRequest {
  provider: TranslationProvider;
  sourceLanguage: string;
  targetLanguage: string;
  audioBase64: string;
  audioMimeType: string;
  isPartial?: boolean;
}

export interface SpeechTurnPartialDiagnostic {
  code: "partial-audio-unsupported";
  message: string;
  disableFurtherPartialUpdates: boolean;
}

export interface SpeechTurnResult {
  transcript: string;
  translation: string;
  detectedLanguage?: string;
  partialDiagnostic?: SpeechTurnPartialDiagnostic;
}
