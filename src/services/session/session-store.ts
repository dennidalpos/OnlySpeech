import { v4 as uuidv4 } from "uuid";
import { findSourceLanguageOption, resolveDetectedSourceLanguageOption } from "../../shared/language-options.js";
import {
  normalizeInteractionLanguage,
  resolveProviderTargetLanguageCode
} from "../../shared/language-registry.js";
import { DEFAULT_RUNTIME_DISCLOSURE_SETTINGS } from "../../shared/runtime-disclosure.js";
import {
  resolveSynchronizedSourceLanguage,
} from "../../shared/language-flow.js";
import { hasOperatorLocalization } from "../../shared/ui-localization.js";
import {
  normalizeVisitorLocalizationLanguageKey,
  resolveVisitorLocalizationState
} from "../../shared/visitor-language-readiness.js";
import { getBlockingIssuesForSide, hasCommittedLanguageSelection } from "../../shared/side-flow.js";
import type {
  AppState,
  ConversationTurn,
  HealthState,
  RuntimeConfig,
  Side,
  SideState,
  TextToSpeechState
} from "../../shared/types.js";

const COMMON_PROVIDER_FALLBACK_LANGUAGE = "en";

function resolveOperatorRuntimeLocalizationState(interactionLanguage: string | null | undefined): {
  requestedUiLanguage: string;
  effectiveUiLanguage: string;
  usesEnglishUiFallback: boolean;
} {
  const requestedUiLanguage = normalizeVisitorLocalizationLanguageKey(interactionLanguage);
  const effectiveUiLanguage =
    hasOperatorLocalization(requestedUiLanguage)
      ? requestedUiLanguage === "zh-Hant" || requestedUiLanguage === "yue"
        ? "zh"
        : requestedUiLanguage
      : "en";

  return {
    requestedUiLanguage,
    effectiveUiLanguage,
    usesEnglishUiFallback: effectiveUiLanguage === "en" && requestedUiLanguage !== "en"
  };
}

function createLocalizedSideState(
  side: Side,
  interactionLanguage: string,
  wizardDefaultUiLanguage: string,
  config: RuntimeConfig,
  hasCommittedLanguageSelection = false
): SideState {
  const effectiveTargetLanguage = normalizeInteractionLanguage(
    interactionLanguage,
    config.translationProvider,
    COMMON_PROVIDER_FALLBACK_LANGUAGE,
    { includeProviderExpansions: true }
  );
  const sourceState = {
    sourceLanguage: resolveSynchronizedSourceLanguage(
      effectiveTargetLanguage,
      "en-US",
      config.translationProvider
    )
  };
  const visitorLocalization = resolveVisitorLocalizationState(effectiveTargetLanguage);
  const normalizedTargetLanguage =
    resolveProviderTargetLanguageCode(effectiveTargetLanguage, config.translationProvider) ?? effectiveTargetLanguage;
  const operatorLocalization = resolveOperatorRuntimeLocalizationState(effectiveTargetLanguage);
  const requestedUiLanguage =
    side === "A" ? operatorLocalization.requestedUiLanguage : visitorLocalization.requestedLanguageKey;
  const effectiveUiLanguage =
    side === "A" ? operatorLocalization.effectiveUiLanguage : visitorLocalization.effectiveLanguageKey;
  const usesEnglishUiFallback =
    side === "A" ? operatorLocalization.usesEnglishUiFallback : visitorLocalization.usesEnglishFallback;

  return {
    side,
    selectedInteractionLanguage: effectiveTargetLanguage,
    normalizedTargetLanguage,
    sourceLanguage: sourceState.sourceLanguage,
    hasCommittedLanguageSelection,
    detectedSourceLanguage: null,
    wizardDefaultUiLanguage,
    requestedUiLanguage,
    effectiveUiLanguage,
    usesEnglishUiFallback,
    selectedTargetLanguage: effectiveTargetLanguage,
    localTranscript: "",
    remoteTranslation: "",
    status: "booting",
    error: null,
    isActiveSpeaker: false
  };
}

function createOperatorSideState(config: RuntimeConfig): SideState {
  return createLocalizedSideState("A", config.defaultTargetLangA, resolveWizardDefaultUiLanguage("A", config), config);
}

function createVisitorSideState(config: RuntimeConfig): SideState {
  return createLocalizedSideState("B", config.defaultTargetLangB, resolveWizardDefaultUiLanguage("B", config), config);
}

function createSideState(side: Side, config: RuntimeConfig): SideState {
  if (side === "A") {
    return createOperatorSideState(config);
  }

  return createVisitorSideState(config);
}

function createDefaultSides(config: RuntimeConfig): Record<Side, SideState> {
  return {
    A: createSideState("A", config),
    B: createSideState("B", config)
  };
}

function normalizeRestartLanguage(side: Side, targetLanguage: string, config: RuntimeConfig): string {
  return normalizeInteractionLanguage(
    targetLanguage,
    config.translationProvider,
    side === "A" ? config.defaultTargetLangA : config.defaultTargetLangB,
    { includeProviderExpansions: true }
  );
}

function createLocalizedSidesFromTargets(
  targets: Record<Side, string>,
  committedSelections: Record<Side, boolean>,
  config: RuntimeConfig
): Record<Side, SideState> {
  return {
    A: createLocalizedSideState("A", targets.A, resolveWizardDefaultUiLanguage("A", config), config, committedSelections.A),
    B: createLocalizedSideState("B", targets.B, resolveWizardDefaultUiLanguage("B", config), config, committedSelections.B)
  };
}

function resolveWizardDefaultUiLanguage(side: Side, config: RuntimeConfig): string {
  if (side === "A") {
    return config.selectorUiLanguageA ?? config.setupUiLanguage ?? "en";
  }

  return config.selectorUiLanguageB ?? config.setupUiLanguage ?? "en";
}

function createInitialHealth(): HealthState {
  return {
    displaysReady: false,
    microphonesReady: false,
    speechReady: false,
    translationReady: false,
    blockingIssues: [],
    displayAssignments: [],
    microphoneAssignments: []
  };
}

function createInitialTextToSpeechState(): TextToSpeechState {
  return {
    side: null,
    content: null,
    requestId: null,
    status: "idle",
    engine: null,
    language: null,
    voiceName: null,
    error: null
  };
}

function normalizeLanguageFamily(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return normalized.split("-")[0] ?? normalized;
}

function resolveCompatibleDetectedSourceLanguage(
  configuredSourceLanguage: string | null | undefined,
  detectedLanguage: string | null | undefined
): string | null {
  if (typeof detectedLanguage !== "string") {
    return null;
  }

  const resolvedDetectedLanguage = resolveDetectedSourceLanguageOption(detectedLanguage)?.value ?? null;
  if (!resolvedDetectedLanguage) {
    return null;
  }

  const configuredFamily = normalizeLanguageFamily(configuredSourceLanguage);
  const detectedFamily = normalizeLanguageFamily(resolvedDetectedLanguage);

  if (!configuredFamily || !detectedFamily || configuredFamily !== detectedFamily) {
    return null;
  }

  return resolvedDetectedLanguage;
}

export class SessionStore {
  private state: AppState;

  private nextConversationTurnSequence = 1;

  constructor(private readonly config: RuntimeConfig) {
    const runtimeDisclosure = config.runtimeDisclosure ?? DEFAULT_RUNTIME_DISCLOSURE_SETTINGS;

    this.state = {
      sessionId: uuidv4(),
      appMode: config.appMode,
      microphonePttMode: config.microphonePttMode,
      translationProvider: config.translationProvider,
      runtimeDisclosure,
      textToSpeechEnabled: config.textToSpeechEnabled,
      activeSide: null,
      lastActivityAt: new Date().toISOString(),
      clearTriggeredAt: null,
      sessionResetReason: null,
      sessionResetSide: null,
      visitorConversationHistoryEnabled: config.visitorConversationHistoryEnabled,
      conversationHistory: [],
      textToSpeech: createInitialTextToSpeechState(),
      sides: createDefaultSides(config),
      health: createInitialHealth()
    };

    this.refreshStatuses();
  }

  getState(): AppState {
    return structuredClone(this.state);
  }

  setHealth(health: HealthState): void {
    this.state.health = structuredClone(health);
    this.refreshStatuses();
  }

  setTextToSpeechState(textToSpeech: TextToSpeechState): void {
    this.state.textToSpeech = structuredClone(textToSpeech);
  }

  clearTextToSpeechState(): void {
    this.state.textToSpeech = createInitialTextToSpeechState();
  }

  setTargetLanguage(side: Side, targetLanguage: string): void {
    const previousLanguage = this.state.sides[side].selectedTargetLanguage;
    const normalizedTargetLanguage = normalizeInteractionLanguage(
      targetLanguage,
      this.config.translationProvider,
      this.state.sides[side].selectedTargetLanguage ?? this.state.sides[side].selectedInteractionLanguage ?? "en",
      { includeProviderExpansions: true }
    );
    const effectiveTargetLanguage = normalizedTargetLanguage;
    const visitorLocalization = resolveVisitorLocalizationState(effectiveTargetLanguage);
    const normalizedProviderTargetLanguage =
      resolveProviderTargetLanguageCode(effectiveTargetLanguage, this.config.translationProvider) ??
      effectiveTargetLanguage;
    const operatorLocalization = resolveOperatorRuntimeLocalizationState(effectiveTargetLanguage);
    this.state.sides[side].selectedTargetLanguage = effectiveTargetLanguage;
    this.state.sides[side].selectedInteractionLanguage = effectiveTargetLanguage;
    if (effectiveTargetLanguage !== previousLanguage) {
      this.state.sides[side].detectedSourceLanguage = null;
    }
    this.state.sides[side].normalizedTargetLanguage = normalizedProviderTargetLanguage;
    this.state.sides[side].hasCommittedLanguageSelection = true;
    this.state.sides[side].requestedUiLanguage =
      side === "A" ? operatorLocalization.requestedUiLanguage : visitorLocalization.requestedLanguageKey;
    this.state.sides[side].effectiveUiLanguage =
      side === "A" ? operatorLocalization.effectiveUiLanguage : visitorLocalization.effectiveLanguageKey;
    this.state.sides[side].usesEnglishUiFallback =
      side === "A" ? operatorLocalization.usesEnglishUiFallback : visitorLocalization.usesEnglishFallback;
    const synchronizedState = {
      sourceLanguage: resolveSynchronizedSourceLanguage(
        effectiveTargetLanguage,
        "en-US",
        this.config.translationProvider
      )
    };
    this.state.sides[side].sourceLanguage = synchronizedState.sourceLanguage;
    this.touchActivity();
    this.refreshStatuses();
  }

  getSourceLanguageLabel(side: Side): string {
    const state = this.state.sides[side];
    if (!state.sourceLanguage) {
      return "-";
    }

    return findSourceLanguageOption(state.sourceLanguage)?.label ?? state.sourceLanguage;
  }

  setActiveSide(side: Side | null): void {
    this.state.activeSide = side;
    this.state.sides.A.isActiveSpeaker = side === "A";
    this.state.sides.B.isActiveSpeaker = side === "B";
    this.touchActivity();
    this.refreshStatuses();
  }

  updateSpeech(
    side: Side,
    transcript: string | undefined,
    translation: string | undefined,
    detectedLanguage?: string | null
  ): void {
    if (typeof transcript === "string") {
      this.state.sides[side].localTranscript = transcript;
    }

    this.state.sides[side].detectedSourceLanguage = resolveCompatibleDetectedSourceLanguage(
      this.state.sides[side].sourceLanguage,
      detectedLanguage
    );

    const remoteSide: Side = side === "A" ? "B" : "A";
    if (typeof translation === "string") {
      this.state.sides[remoteSide].remoteTranslation = translation;
    }

    this.touchActivity();
  }

  appendConversationTurn(
    side: Side,
    transcript: string,
    translation: string | undefined,
    detectedLanguage?: string | null
  ): void {
    const normalizedTranscript = transcript.trim();
    const normalizedTranslation = translation?.trim() ?? "";
    if (!normalizedTranscript && !normalizedTranslation) {
      return;
    }

    const remoteSide: Side = side === "A" ? "B" : "A";
    const resolvedDetectedSourceLanguage = resolveCompatibleDetectedSourceLanguage(
      this.state.sides[side].sourceLanguage,
      detectedLanguage
    );
    const entry: ConversationTurn = {
      id: `turn-${this.nextConversationTurnSequence}`,
      sequence: this.nextConversationTurnSequence,
      speakerSide: side,
      transcript: normalizedTranscript,
      translation: normalizedTranslation,
      sourceLanguage: resolvedDetectedSourceLanguage ?? this.state.sides[side].detectedSourceLanguage ?? this.state.sides[side].sourceLanguage,
      targetLanguage: this.state.sides[remoteSide].selectedTargetLanguage
    };

    this.nextConversationTurnSequence += 1;
    this.state.conversationHistory = [...this.state.conversationHistory, entry];
    this.touchActivity();
  }

  idleReset(): void {
    this.state.sessionId = uuidv4();
    this.state.activeSide = null;
    this.state.lastActivityAt = new Date().toISOString();
    this.state.clearTriggeredAt = new Date().toISOString();
    this.state.sessionResetReason = "idle-clear";
    this.state.sessionResetSide = null;
    this.state.conversationHistory = [];
    this.state.textToSpeech = createInitialTextToSpeechState();
    this.state.sides = createDefaultSides(this.config);
    this.nextConversationTurnSequence = 1;
    this.refreshStatuses();
  }

  hardReset(): void {
    this.state.sessionId = uuidv4();
    this.state.activeSide = null;
    this.state.clearTriggeredAt = null;
    this.state.sessionResetReason = "hard-reset";
    this.state.sessionResetSide = null;
    this.state.conversationHistory = [];
    this.state.textToSpeech = createInitialTextToSpeechState();
    this.state.sides = createDefaultSides(this.config);
    this.nextConversationTurnSequence = 1;
    this.touchActivity(false);
    this.refreshStatuses();
  }

  restartForLanguageChange(side: Side, targetLanguage: string): void {
    const nextTargets: Record<Side, string> = {
      A: normalizeRestartLanguage(
        "A",
        this.state.sides.A.selectedTargetLanguage ?? this.config.defaultTargetLangA,
        this.config
      ),
      B: normalizeRestartLanguage(
        "B",
        this.state.sides.B.selectedTargetLanguage ?? this.config.defaultTargetLangB,
        this.config
      )
    };

    nextTargets[side] = normalizeRestartLanguage(side, targetLanguage, this.config);

    this.state.sessionId = uuidv4();
    this.state.activeSide = null;
    this.state.clearTriggeredAt = null;
    this.state.sessionResetReason = "language-change";
    this.state.sessionResetSide = side;
    this.state.conversationHistory = [];
    this.state.textToSpeech = createInitialTextToSpeechState();
    this.state.sides = createLocalizedSidesFromTargets(nextTargets, { A: true, B: true }, this.config);
    this.nextConversationTurnSequence = 1;
    this.touchActivity(false);
    this.refreshStatuses();
  }

  clearSoftResetMarker(): void {
    this.state.clearTriggeredAt = null;
  }

  setVisitorConversationHistoryEnabled(enabled: boolean): void {
    this.state.visitorConversationHistoryEnabled = enabled;
  }

  private touchActivity(updateTimestamp = true): void {
    if (updateTimestamp) {
      this.state.lastActivityAt = new Date().toISOString();
    }

    this.state.clearTriggeredAt = null;
  }

  private refreshStatuses(): void {
    const languagesCommittedOnBothSides =
      hasCommittedLanguageSelection(this.state.sides.A) &&
      hasCommittedLanguageSelection(this.state.sides.B) &&
      Boolean(this.state.sides.A.selectedTargetLanguage) &&
      Boolean(this.state.sides.B.selectedTargetLanguage);

    for (const side of ["A", "B"] as const) {
      const current = this.state.sides[side];
      const sideBlockingIssues = getBlockingIssuesForSide(this.state, side);

      if (sideBlockingIssues.length > 0) {
        current.status = "error";
        current.error = sideBlockingIssues[0] ?? null;
        continue;
      }

      current.error = null;

      if (!current.selectedTargetLanguage || !hasCommittedLanguageSelection(current)) {
        current.status = "language-selection";
        continue;
      }

      if (!languagesCommittedOnBothSides) {
        current.status = "ready";
        continue;
      }

      if (this.state.activeSide === side) {
        current.status = "listening";
      } else if (this.state.activeSide && this.state.activeSide !== side) {
        current.status = "translating";
      } else {
        current.status = "ready";
      }
    }
  }
}
