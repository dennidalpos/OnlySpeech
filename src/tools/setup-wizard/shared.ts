import {
  classifyAudioDeviceLabel,
  getAudioDeviceCategoryLabel
} from "../../services/audio/audio-device-classification.js";
import { enrichMicrophoneDevices } from "../../services/audio/microphone-device-metadata.js";
import {
  applySelectionsToEnv,
  createDefaultEnvValues,
  renderEnvFile,
  type EnvKey,
  type ProbeDisplayInfo,
  type ProbeMicrophoneInfo
} from "../env-probe-output.js";
import {
  findMatchingPersistedMicrophone,
  getPersistedMicrophoneId
} from "../../services/audio/persisted-microphone-id.js";
import {
  DEFAULT_APP_MODE,
  DEFAULT_MICROPHONE_PTT_MODE,
  type AppMode,
  type MicrophonePttMode
} from "../../shared/runtime-profiles.js";
import type { TranslationProvider } from "../../shared/types.js";
import {
  normalizeSetupWizardUiLanguage,
  type SetupWizardUiLanguage
} from "./localization.js";
import { getProviderAdapter } from "../../services/speech/provider-adapters.js";

export type WizardSide = "A" | "B";

export interface WizardDisplay extends ProbeDisplayInfo {
  assignedSide: WizardSide | null;
}

export interface WizardMicrophone extends ProbeMicrophoneInfo {
  assignedSides: WizardSide[];
}

export interface WizardAutostartState {
  mechanism: "startup-shortcut" | "current-user-run-key";
  scope: "current-user" | "per-machine";
  supported: boolean;
  canModify: boolean;
  currentEnabled: boolean;
  selectedEnabled: boolean;
  requiresElevation?: boolean;
  managementNote?: string;
}

export interface WizardState {
  displays: WizardDisplay[];
  microphones: WizardMicrophone[];
  microphonePermissionGranted: boolean;
  microphoneError: string | null;
  monitorSetupSessionActive?: boolean;
  overlayDisplayIds?: number[];
  envValues: Record<EnvKey, string>;
  signalLevels: Record<WizardSide, number>;
  autostart: WizardAutostartState;
  lastSavedEnvPath: string | null;
  lastSavedPreview: string | null;
}

export interface WizardMicrophoneProbe {
  microphones: ProbeMicrophoneInfo[];
  microphonePermissionGranted: boolean;
  microphoneError: string | null;
}

export interface BuildWizardEnvOptions {
  secureSecretStorage?: boolean;
}

export interface WizardRuntimeProfile {
  appMode: AppMode;
  microphonePttMode: MicrophonePttMode;
  requiredMicrophones: number;
}

export interface WizardSidePresentation {
  stationTitle: string;
  stationSubtitle: string;
  shortTitle: string;
  monitorSummaryLabel: string;
  microphoneSummaryLabel: string;
  languageSummaryLabel: string;
}

export interface WizardConfigurationIssue {
  code:
    | "missing-display-a"
    | "missing-display-b"
    | "missing-microphone-a"
    | "missing-microphone-b"
    | "distinct-microphones-required"
    | "unsupported-provider"
    | "missing-provider-credentials";
  message: string;
  detail?: string;
}

export const WIZARD_SIDE_PRESENTATION: Record<WizardSide, WizardSidePresentation> = {
  A: {
    stationTitle: "OnlySpeech . postazione operatore A",
    stationSubtitle: "Lato operatore",
    shortTitle: "Postazione A",
    monitorSummaryLabel: "monitor operatore A",
    microphoneSummaryLabel: "microfono operatore A",
    languageSummaryLabel: "lingua operatore A"
  },
  B: {
    stationTitle: "OnlySpeech . postazione utente B",
    stationSubtitle: "Lato utente",
    shortTitle: "Postazione B",
    monitorSummaryLabel: "monitor utente B",
    microphoneSummaryLabel: "microfono utente B",
    languageSummaryLabel: "lingua utente B"
  }
};

const WIZARD_SIDE_PRESENTATION_BY_LANGUAGE: Readonly<
  Record<SetupWizardUiLanguage, Record<WizardSide, WizardSidePresentation>>
> = Object.freeze({
  en: {
    A: {
      stationTitle: "OnlySpeech . operator station A",
      stationSubtitle: "Operator side",
      shortTitle: "Station A",
      monitorSummaryLabel: "operator display A",
      microphoneSummaryLabel: "operator microphone A",
      languageSummaryLabel: "operator language A"
    },
    B: {
      stationTitle: "OnlySpeech . visitor station B",
      stationSubtitle: "Visitor side",
      shortTitle: "Station B",
      monitorSummaryLabel: "visitor display B",
      microphoneSummaryLabel: "visitor microphone B",
      languageSummaryLabel: "visitor language B"
    }
  },
  it: {
    A: { ...WIZARD_SIDE_PRESENTATION.A },
    B: { ...WIZARD_SIDE_PRESENTATION.B }
  },
  es: {
    A: {
      stationTitle: "OnlySpeech . puesto operador A",
      stationSubtitle: "Lado operador",
      shortTitle: "Puesto A",
      monitorSummaryLabel: "monitor operador A",
      microphoneSummaryLabel: "microfono operador A",
      languageSummaryLabel: "idioma operador A"
    },
    B: {
      stationTitle: "OnlySpeech . puesto usuario B",
      stationSubtitle: "Lado usuario",
      shortTitle: "Puesto B",
      monitorSummaryLabel: "monitor usuario B",
      microphoneSummaryLabel: "microfono usuario B",
      languageSummaryLabel: "idioma usuario B"
    }
  },
  fr: {
    A: {
      stationTitle: "OnlySpeech . poste operateur A",
      stationSubtitle: "Cote operateur",
      shortTitle: "Poste A",
      monitorSummaryLabel: "ecran operateur A",
      microphoneSummaryLabel: "micro operateur A",
      languageSummaryLabel: "langue operateur A"
    },
    B: {
      stationTitle: "OnlySpeech . poste utilisateur B",
      stationSubtitle: "Cote utilisateur",
      shortTitle: "Poste B",
      monitorSummaryLabel: "ecran utilisateur B",
      microphoneSummaryLabel: "micro utilisateur B",
      languageSummaryLabel: "langue utilisateur B"
    }
  },
  de: {
    A: {
      stationTitle: "OnlySpeech . Operator-Station A",
      stationSubtitle: "Operatorseite",
      shortTitle: "Station A",
      monitorSummaryLabel: "Operator-Monitor A",
      microphoneSummaryLabel: "Operator-Mikrofon A",
      languageSummaryLabel: "Operatorsprache A"
    },
    B: {
      stationTitle: "OnlySpeech . Nutzer-Station B",
      stationSubtitle: "Nutzerseite",
      shortTitle: "Station B",
      monitorSummaryLabel: "Nutzer-Monitor B",
      microphoneSummaryLabel: "Nutzer-Mikrofon B",
      languageSummaryLabel: "Nutzersprache B"
    }
  },
  zh: {
    A: {
      stationTitle: "OnlySpeech . 操作员工作站 A",
      stationSubtitle: "操作员侧",
      shortTitle: "工作站 A",
      monitorSummaryLabel: "操作员显示器 A",
      microphoneSummaryLabel: "操作员麦克风 A",
      languageSummaryLabel: "操作员语言 A"
    },
    B: {
      stationTitle: "OnlySpeech . 用户工作站 B",
      stationSubtitle: "用户侧",
      shortTitle: "工作站 B",
      monitorSummaryLabel: "用户显示器 B",
      microphoneSummaryLabel: "用户麦克风 B",
      languageSummaryLabel: "用户语言 B"
    }
  }
});

export function getWizardSidePresentation(
  uiLanguage: SetupWizardUiLanguage = "it"
): Record<WizardSide, WizardSidePresentation> {
  const normalizedLanguage = normalizeSetupWizardUiLanguage(uiLanguage);
  return {
    A: { ...WIZARD_SIDE_PRESENTATION_BY_LANGUAGE[normalizedLanguage].A },
    B: { ...WIZARD_SIDE_PRESENTATION_BY_LANGUAGE[normalizedLanguage].B }
  };
}

function getAssignedMicrophone(
  microphones: WizardMicrophone[],
  side: WizardSide
): WizardMicrophone | null {
  return microphones.find((microphone) => microphone.assignedSides.includes(side)) ?? null;
}

export function getWizardRuntimeProfile(
  appModeValue: string | null | undefined,
  microphonePttModeValue: string | null | undefined
): WizardRuntimeProfile {
  const appMode: AppMode = appModeValue === "demo" ? "demo" : "kiosk";
  const microphonePttMode: MicrophonePttMode =
    microphonePttModeValue === "single-shared" ? "single-shared" : "dual-dedicated";

  return {
    appMode,
    microphonePttMode,
    requiredMicrophones:
      appMode === "demo" ? 0 : microphonePttMode === "single-shared" ? 1 : 2
  };
}

export function getWizardConfigurationIssues(state: WizardState): WizardConfigurationIssue[] {
  const issues: WizardConfigurationIssue[] = [];
  const supportedWizardProviders = new Set<TranslationProvider>(["azure", "chatgpt", "ollama"]);
  const runtimeProfile = getWizardRuntimeProfile(
    state.envValues.APP_MODE,
    state.envValues.MICROPHONE_PTT_MODE
  );
  const displayA = state.displays.find((display) => display.assignedSide === "A");
  const displayB = state.displays.find((display) => display.assignedSide === "B");
  const microphoneA =
    state.microphones.find((microphone) => microphone.assignedSides.includes("A")) ?? null;
  const microphoneB =
    state.microphones.find((microphone) => microphone.assignedSides.includes("B")) ?? null;

  if (!displayA) {
    issues.push({
      code: "missing-display-a",
      message: "monitor A non assegnato"
    });
  }

  if (!displayB) {
    issues.push({
      code: "missing-display-b",
      message: "monitor B non assegnato"
    });
  }

  if (runtimeProfile.appMode !== "demo") {
    if (!microphoneA) {
      issues.push({
        code: "missing-microphone-a",
        message: "microfono A non assegnato"
      });
    }

    if (!microphoneB) {
      issues.push({
        code: "missing-microphone-b",
        message:
          runtimeProfile.microphonePttMode === "single-shared"
            ? "microfono condiviso non assegnato"
            : "microfono B non assegnato"
      });
    }

    if (
      runtimeProfile.microphonePttMode === "dual-dedicated" &&
      microphoneA &&
      microphoneB &&
      microphoneA.deviceId === microphoneB.deviceId
    ) {
      issues.push({
        code: "distinct-microphones-required",
        message: "servono due microfoni distinti"
      });
    }
  }

  const providerValue = state.envValues.TRANSLATION_PROVIDER.trim();
  if (!providerValue || !supportedWizardProviders.has(providerValue as TranslationProvider)) {
    issues.push({
      code: "unsupported-provider",
      message: "provider non configurato"
    });
    return issues;
  }

  if (runtimeProfile.appMode !== "demo") {
    const providerCredentialIssues =
      providerValue === "azure"
        ? [
            ...(!state.envValues.AZURE_SPEECH_KEY.trim() ? ["Azure Speech key"] : []),
            ...(!state.envValues.AZURE_SPEECH_REGION.trim() ? ["Azure Speech region"] : [])
          ]
        : providerValue === "chatgpt"
          ? [
            ...(!state.envValues.CHATGPT_API_KEY.trim() ? ["ChatGPT API key"] : []),
            ...(!state.envValues.CHATGPT_MODEL.trim() ? ["ChatGPT model"] : []),
            ...(!state.envValues.CHATGPT_TRANSCRIBE_MODEL.trim() ? ["ChatGPT transcribe model"] : [])
            ]
          : [
              ...(!state.envValues.OLLAMA_BASE_URL.trim() ? ["Ollama base URL"] : []),
              ...(!state.envValues.OLLAMA_MODEL.trim() ? ["Ollama model"] : []),
              ...(!getProviderAdapter("ollama").supportsStt || !getProviderAdapter("ollama").supportsTts
                ? ["Ollama supports demo translation only; live kiosk speech still requires STT and TTS."]
                : [])
            ];
    if (providerCredentialIssues.length > 0) {
      issues.push({
        code: "missing-provider-credentials",
        message: "credenziali provider mancanti",
        detail: providerCredentialIssues.join(", ")
      });
    }
  }

  return issues;
}

function clearExistingAssignment<T extends { assignedSide: WizardSide | null }>(items: T[], side: WizardSide): T[] {
  return items.map((item) => (item.assignedSide === side ? { ...item, assignedSide: null } : item));
}

export function createInitialWizardState(
  displays: ProbeDisplayInfo[],
  envValues: Partial<Record<EnvKey, string>>
): WizardState {
  const normalizedEnvValues = createDefaultEnvValues(envValues);

  return {
    displays: displays.map((display) => ({
      ...display,
      assignedSide: null
    })),
    microphones: [],
    microphonePermissionGranted: false,
    microphoneError: null,
    monitorSetupSessionActive: false,
    overlayDisplayIds: [],
    envValues: normalizedEnvValues,
    signalLevels: {
      A: 0,
      B: 0
    },
    autostart: {
      mechanism: "startup-shortcut",
      scope: "current-user",
      supported: false,
      canModify: false,
      currentEnabled: false,
      selectedEnabled: false
    },
    lastSavedEnvPath: null,
    lastSavedPreview: null
  };
}

export function assignDisplay(
  displays: WizardDisplay[],
  side: WizardSide,
  displayId: number | null
): WizardDisplay[] {
  const cleared = clearExistingAssignment(displays, side);
  if (displayId === null) {
    return cleared;
  }

  return cleared.map((display) => ({
    ...display,
    assignedSide: display.displayId === displayId ? side : display.assignedSide
  }));
}

export function assignMicrophone(
  microphones: WizardMicrophone[],
  side: WizardSide,
  deviceId: string | null,
  options: {
    microphonePttMode?: string | null | undefined;
  } = {}
): WizardMicrophone[] {
  const runtimeProfile = getWizardRuntimeProfile(DEFAULT_APP_MODE, options.microphonePttMode);
  const sidesToClear =
    runtimeProfile.microphonePttMode === "single-shared" ? (["A", "B"] as const) : ([side] as const);
  const cleared = microphones.map((microphone) => ({
    ...microphone,
    assignedSides: microphone.assignedSides.filter(
      (assignedSide) => !sidesToClear.includes(assignedSide)
    )
  }));
  if (!deviceId) {
    return cleared;
  }

  return cleared.map((microphone) => ({
    ...microphone,
    assignedSides:
      microphone.deviceId === deviceId
        ? ([
            ...microphone.assignedSides,
            ...(runtimeProfile.microphonePttMode === "single-shared" ? (["A", "B"] as const) : [side])
          ].filter(
            (assignedSide, index, all) => all.indexOf(assignedSide) === index
          ) as WizardSide[])
        : microphone.assignedSides
  }));
}

export function mergeMicrophoneProbe(
  current: WizardMicrophone[],
  probe: WizardMicrophoneProbe
): {
  microphones: WizardMicrophone[];
  microphonePermissionGranted: boolean;
  microphoneError: string | null;
} {
  const nextMicrophones = enrichMicrophoneDevices(probe.microphones).map((microphone) => {
    const existing = current.find((item) => item.deviceId === microphone.deviceId);
    const connectionType = microphone.connectionType ?? classifyAudioDeviceLabel(microphone.label);
    return {
      ...microphone,
      connectionType,
      connectionLabel: microphone.connectionLabel ?? getAudioDeviceCategoryLabel(connectionType),
      assignedSides: existing?.assignedSides ?? []
    };
  });

  return {
    microphones: nextMicrophones,
    microphonePermissionGranted: probe.microphonePermissionGranted,
    microphoneError: probe.microphoneError
  };
}

export function getAssignedDisplayId(displays: WizardDisplay[], side: WizardSide): string {
  const match = displays.find((display) => display.assignedSide === side);
  return match ? String(match.displayId) : "";
}

export function applyWizardSelectionsFromEnv(
  state: WizardState,
  envValues: Partial<Record<EnvKey, string>>
): WizardState {
  const normalizedEnvValues = createDefaultEnvValues(envValues);
  const displayAId = Number(normalizedEnvValues.DISPLAY_A_ID);
  const displayBId = Number(normalizedEnvValues.DISPLAY_B_ID);
  const matchedMicrophoneA = findMatchingPersistedMicrophone(state.microphones, normalizedEnvValues.MIC_A_ID);
  const matchedMicrophoneB = findMatchingPersistedMicrophone(state.microphones, normalizedEnvValues.MIC_B_ID);

  return {
    ...state,
    envValues: normalizedEnvValues,
    displays: state.displays.map((display) => ({
      ...display,
      assignedSide:
        display.displayId === displayAId
          ? "A"
          : display.displayId === displayBId
            ? "B"
            : null
    })),
    microphones: state.microphones.map((microphone) => {
      const assignedSides: WizardSide[] = [];
      if (matchedMicrophoneA && microphone.deviceId === matchedMicrophoneA.deviceId) {
        assignedSides.push("A");
      }
      if (matchedMicrophoneB && microphone.deviceId === matchedMicrophoneB.deviceId) {
        assignedSides.push("B");
      }

      return {
        ...microphone,
        assignedSides
      };
    })
  };
}

export function getAssignedMicrophoneId(microphones: WizardMicrophone[], side: WizardSide): string {
  const match = getAssignedMicrophone(microphones, side);
  return match ? getPersistedMicrophoneId(match, microphones) : "";
}

export function getAssignedMicrophoneLabel(microphones: WizardMicrophone[], side: WizardSide): string {
  return getAssignedMicrophone(microphones, side)?.label ?? "";
}

function resolveWizardUiLanguageFromEnv(
  envValues: Partial<Record<EnvKey, string>>
): SetupWizardUiLanguage {
  return normalizeSetupWizardUiLanguage(envValues.SETUP_UI_LANGUAGE);
}

export function buildWizardEnv(state: WizardState, options: BuildWizardEnvOptions = {}): string {
  const configuredProfile = getWizardRuntimeProfile(
    state.envValues.APP_MODE.trim() || DEFAULT_APP_MODE,
    state.envValues.MICROPHONE_PTT_MODE || DEFAULT_MICROPHONE_PTT_MODE
  );

  // 1-microphone kiosk fallback: when exactly one microphone is available in kiosk
  // mode and the profile is dual-dedicated, automatically persist single-shared so
  // the saved env matches the effective runtime behaviour.
  const oneMicFallbackActive =
    configuredProfile.appMode === "kiosk" &&
    configuredProfile.microphonePttMode === "dual-dedicated" &&
    state.microphones.length === 1;

  const runtimeProfile = oneMicFallbackActive
    ? getWizardRuntimeProfile(configuredProfile.appMode, "single-shared")
    : configuredProfile;

  const uiLanguage = resolveWizardUiLanguageFromEnv(state.envValues);
  const sharedMicrophoneId =
    getAssignedMicrophoneId(state.microphones, "A") ||
    getAssignedMicrophoneId(state.microphones, "B") ||
    (state.microphones[0] ? getPersistedMicrophoneId(state.microphones[0], state.microphones) : "");
  const mergedEnv = applySelectionsToEnv(state.envValues, {
    displayAId: getAssignedDisplayId(state.displays, "A"),
    displayBId: getAssignedDisplayId(state.displays, "B"),
    micAId:
      runtimeProfile.microphonePttMode === "single-shared"
        ? sharedMicrophoneId
        : getAssignedMicrophoneId(state.microphones, "A"),
    micBId:
      runtimeProfile.microphonePttMode === "single-shared"
        ? sharedMicrophoneId
        : getAssignedMicrophoneId(state.microphones, "B")
  });
  mergedEnv.APP_MODE = runtimeProfile.appMode;
  mergedEnv.MICROPHONE_PTT_MODE = runtimeProfile.microphonePttMode;
  mergedEnv.REQUIRED_MICROPHONES = String(runtimeProfile.requiredMicrophones);

  const commentCopyByLanguage: Readonly<Record<SetupWizardUiLanguage, Record<string, string>>> = {
    en: {
      header: "# OnlySpeech environment generated by the setup wizard.",
      providerCredentialScope:
        "# Fill only the settings required by the selected translation provider before production use.",
      chatGptCredentials:
        "# chatgpt requires CHATGPT_API_KEY, CHATGPT_MODEL, and CHATGPT_TRANSCRIBE_MODEL.",
      azureCredentials:
        "# azure requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION; normalized playback diagnostics also use AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_REGION.",
      ollamaCredentials:
        "# ollama requires OLLAMA_BASE_URL and OLLAMA_MODEL; it remains translation-only and cannot unlock live kiosk speech.",
      fewerMicrophones: "# Fewer than two selectable microphones are currently assigned.",
      demoMode:
        "# Demo mode uses the scripted runtime loop and does not require live provider credentials or microphones.",
      sharedMicrophoneMode:
        "# Single shared microphone mode mirrors the selected device to both sides and alternates PTT ownership.",
      visitorHistory: "# Visitor-side conversation history is enabled for the active kiosk session.",
      ttsDisabled:
        "# Runtime TTS playback is disabled; local wizard diagnostics and maintenance remain available.",
      disclosureDisabled: "# Runtime and wizard AI-assisted disclosure are disabled.",
      disclosureCustom: "# Runtime and wizard AI-assisted disclosure use the custom global text.",
      audioFilters: "# Browser audio processing filters were customized for microphone capture.",
      secureStorage: "# Provider secrets are stored in Windows secure local storage for packaged installs."
    },
    it: {
      header: "# Ambiente OnlySpeech generato dal setup wizard.",
      providerCredentialScope:
        "# Compila solo le impostazioni richieste dal provider traduzione selezionato prima dell'uso in produzione.",
      chatGptCredentials:
        "# chatgpt richiede CHATGPT_API_KEY, CHATGPT_MODEL e CHATGPT_TRANSCRIBE_MODEL.",
      azureCredentials:
        "# azure richiede AZURE_SPEECH_KEY e AZURE_SPEECH_REGION; il test playback con normalizzazione testo usa anche AZURE_TRANSLATOR_KEY e AZURE_TRANSLATOR_REGION.",
      ollamaCredentials:
        "# ollama richiede OLLAMA_BASE_URL e OLLAMA_MODEL; resta solo traduzione e non abilita il kiosk live speech.",
      fewerMicrophones: "# Al momento risultano assegnati meno di due microfoni selezionabili.",
      demoMode:
        "# La modalita demo usa il loop runtime scripted e non richiede credenziali provider live o microfoni.",
      sharedMicrophoneMode:
        "# La modalita microfono condiviso replica il dispositivo selezionato su entrambi i lati e alterna la proprieta PTT.",
      visitorHistory: "# La cronologia conversazione lato utente e' abilitata per la sessione kiosk attiva.",
      ttsDisabled:
        "# La riproduzione TTS runtime e' disattivata; diagnostica e manutenzione del wizard restano disponibili.",
      disclosureDisabled: "# Gli avvisi AI runtime e wizard sono disattivati.",
      disclosureCustom: "# Gli avvisi AI runtime e wizard usano il testo personalizzato globale.",
      audioFilters: "# I filtri browser di elaborazione audio sono stati personalizzati per l'acquisizione microfono.",
      secureStorage:
        "# I segreti provider vengono archiviati nello storage locale sicuro di Windows per le installazioni pacchettizzate."
    },
    es: {
      header: "# Entorno de OnlySpeech generado por el asistente de configuracion.",
      providerCredentialScope:
        "# Completa solo la configuracion requerida por el proveedor de traduccion seleccionado antes del uso en produccion.",
      chatGptCredentials:
        "# chatgpt requiere CHATGPT_API_KEY, CHATGPT_MODEL y CHATGPT_TRANSCRIBE_MODEL.",
      azureCredentials:
        "# azure requiere AZURE_SPEECH_KEY y AZURE_SPEECH_REGION; la reproduccion normalizada tambien usa AZURE_TRANSLATOR_KEY y AZURE_TRANSLATOR_REGION.",
      ollamaCredentials:
        "# ollama requiere OLLAMA_BASE_URL y OLLAMA_MODEL; sigue siendo solo de traduccion y no habilita el kiosk live speech.",
      fewerMicrophones: "# Actualmente hay menos de dos microfonos seleccionables asignados.",
      demoMode:
        "# El modo demo usa el bucle runtime guiado y no requiere credenciales live ni microfonos.",
      sharedMicrophoneMode:
        "# El modo de microfono compartido replica el dispositivo seleccionado en ambos lados y alterna el control PTT.",
      visitorHistory: "# El historial del lado usuario esta habilitado para la sesion kiosk activa.",
      ttsDisabled:
        "# La reproduccion TTS runtime esta desactivada; la diagnostica local del asistente sigue disponible.",
      disclosureDisabled: "# Los avisos de IA de runtime y del asistente estan desactivados.",
      disclosureCustom: "# Los avisos de IA de runtime y del asistente usan el texto global personalizado.",
      audioFilters: "# Los filtros del navegador para el audio del microfono fueron personalizados.",
      secureStorage:
        "# Los secretos del proveedor se guardan en el almacenamiento seguro local de Windows para instalaciones empaquetadas."
    },
    fr: {
      header: "# Environnement OnlySpeech genere par l'assistant de configuration.",
      providerCredentialScope:
        "# Renseignez uniquement la configuration requise par le fournisseur de traduction selectionne avant la production.",
      chatGptCredentials:
        "# chatgpt requiert CHATGPT_API_KEY, CHATGPT_MODEL et CHATGPT_TRANSCRIBE_MODEL.",
      azureCredentials:
        "# azure requiert AZURE_SPEECH_KEY et AZURE_SPEECH_REGION ; la lecture normalisee utilise aussi AZURE_TRANSLATOR_KEY et AZURE_TRANSLATOR_REGION.",
      ollamaCredentials:
        "# ollama requiert OLLAMA_BASE_URL et OLLAMA_MODEL ; il reste limite a la traduction et n'active pas le kiosk live speech.",
      fewerMicrophones: "# Moins de deux microphones selectionnables sont actuellement assignes.",
      demoMode:
        "# Le mode demo utilise la boucle runtime scriptée et ne requiert ni identifiants live ni microphones.",
      sharedMicrophoneMode:
        "# Le mode micro partage duplique le peripherique selectionne sur les deux cotes et alterne le controle PTT.",
      visitorHistory: "# L'historique cote utilisateur est active pour la session kiosk en cours.",
      ttsDisabled:
        "# La lecture TTS runtime est desactivee ; les diagnostics locaux de l'assistant restent disponibles.",
      disclosureDisabled: "# Les avis IA runtime et assistant sont desactives.",
      disclosureCustom: "# Les avis IA runtime et assistant utilisent le texte global personnalise.",
      audioFilters: "# Les filtres audio du navigateur ont ete personnalises pour la capture microphone.",
      secureStorage:
        "# Les secrets fournisseur sont stockes dans le stockage local securise de Windows pour les installations packagees."
    },
    de: {
      header: "# OnlySpeech-Umgebung, erzeugt durch den Setup-Assistenten.",
      providerCredentialScope:
        "# Tragen Sie vor dem Produktionseinsatz nur die benoetigten Einstellungen des ausgewaehlten Uebersetzungsanbieters ein.",
      chatGptCredentials:
        "# chatgpt benoetigt CHATGPT_API_KEY, CHATGPT_MODEL und CHATGPT_TRANSCRIBE_MODEL.",
      azureCredentials:
        "# azure benoetigt AZURE_SPEECH_KEY und AZURE_SPEECH_REGION; die normalisierte Wiedergabe nutzt auch AZURE_TRANSLATOR_KEY und AZURE_TRANSLATOR_REGION.",
      ollamaCredentials:
        "# ollama benoetigt OLLAMA_BASE_URL und OLLAMA_MODEL; der Pfad bleibt auf Uebersetzung beschraenkt und aktiviert keinen Live-Kiosk-Speech-Modus.",
      fewerMicrophones: "# Derzeit sind weniger als zwei auswaehlbare Mikrofone zugewiesen.",
      demoMode:
        "# Der Demo-Modus nutzt die geskriptete Runtime-Schleife und benoetigt keine Live-Zugangsdaten oder Mikrofone.",
      sharedMicrophoneMode:
        "# Im Modus fuer ein gemeinsames Mikrofon wird das gewaehlte Geraet auf beide Seiten gespiegelt und die PTT-Steuerung abgewechselt.",
      visitorHistory: "# Der Sitzungsverlauf auf der Nutzerseite ist fuer die aktive Kiosk-Sitzung aktiviert.",
      ttsDisabled:
        "# Die Runtime-TTS-Wiedergabe ist deaktiviert; lokale Assistenten-Diagnose bleibt verfuegbar.",
      disclosureDisabled: "# Die KI-Hinweise fuer Runtime und Assistent sind deaktiviert.",
      disclosureCustom: "# Die KI-Hinweise fuer Runtime und Assistent verwenden den globalen benutzerdefinierten Text.",
      audioFilters: "# Die Browser-Audiofilter fuer die Mikrofonaufnahme wurden angepasst.",
      secureStorage:
        "# Anbieter-Geheimnisse werden bei paketierten Installationen im sicheren lokalen Windows-Speicher abgelegt."
    },
    zh: {
      header: "# 此 OnlySpeech 环境文件由设置向导生成。",
      providerCredentialScope: "# 在生产使用前，只填写所选翻译服务商必需的配置项。",
      chatGptCredentials: "# chatgpt 需要 CHATGPT_API_KEY、CHATGPT_MODEL 和 CHATGPT_TRANSCRIBE_MODEL。",
      azureCredentials:
        "# azure 需要 AZURE_SPEECH_KEY 和 AZURE_SPEECH_REGION；标准化播放诊断还会使用 AZURE_TRANSLATOR_KEY 和 AZURE_TRANSLATOR_REGION。",
      ollamaCredentials:
        "# ollama 需要 OLLAMA_BASE_URL 和 OLLAMA_MODEL；当前仅支持翻译，不会启用 live kiosk speech。",
      fewerMicrophones: "# 当前分配的可选麦克风少于两个。",
      demoMode: "# 演示模式使用脚本化 runtime 循环，不需要实时服务商凭据或麦克风。",
      sharedMicrophoneMode: "# 共享麦克风模式会将所选设备镜像到两侧，并轮换 PTT 控制权。",
      visitorHistory: "# 当前 kiosk 会话已启用用户侧会话历史。",
      ttsDisabled: "# runtime TTS 播放已关闭；向导本地诊断和维护仍可使用。",
      disclosureDisabled: "# runtime 和向导中的 AI 提示已关闭。",
      disclosureCustom: "# runtime 和向导中的 AI 提示使用全局自定义文本。",
      audioFilters: "# 浏览器音频处理过滤器已针对麦克风采集进行自定义。",
      secureStorage: "# 打包安装时，服务商密钥会保存在 Windows 本地安全存储中。"
    }
  };
  const commentCopy = commentCopyByLanguage[uiLanguage];
  const comments = [
    commentCopy.header,
    commentCopy.providerCredentialScope,
    commentCopy.chatGptCredentials,
    commentCopy.azureCredentials,
    commentCopy.ollamaCredentials
  ];

  if (state.microphones.length < 2) {
    comments.push(commentCopy.fewerMicrophones);
  }

  if (runtimeProfile.appMode === "demo") {
    comments.push(commentCopy.demoMode);
  } else if (runtimeProfile.microphonePttMode === "single-shared") {
    comments.push(commentCopy.sharedMicrophoneMode);
  }

  if (state.envValues.VISITOR_CONVERSATION_HISTORY_ENABLED === "true") {
    comments.push(commentCopy.visitorHistory);
  }

  if (state.envValues.TEXT_TO_SPEECH_ENABLED === "false") {
    comments.push(commentCopy.ttsDisabled);
  }

  if (state.envValues.RUNTIME_DISCLOSURE_MODE === "disabled") {
    comments.push(commentCopy.disclosureDisabled);
  } else if (
    state.envValues.RUNTIME_DISCLOSURE_MODE === "custom" &&
    state.envValues.RUNTIME_DISCLOSURE_CUSTOM_TEXT.trim()
  ) {
    comments.push(commentCopy.disclosureCustom);
  }

  if (
    state.envValues.AUDIO_ECHO_CANCELLATION === "false" ||
    state.envValues.AUDIO_NOISE_SUPPRESSION === "false"
  ) {
    comments.push(commentCopy.audioFilters);
  }

  if (options.secureSecretStorage) {
    mergedEnv.AZURE_SPEECH_KEY = "";
    mergedEnv.AZURE_TRANSLATOR_KEY = "";
    mergedEnv.CHATGPT_API_KEY = "";
    mergedEnv.OLLAMA_API_KEY = "";
    comments.push(commentCopy.secureStorage);
  }

  return renderEnvFile(mergedEnv, comments);
}

// ---------------------------------------------------------------------------
// License info (computed and surfaced by the wizard for display only)
// ---------------------------------------------------------------------------

export interface WizardLicenseInfo {
  /** Canonical email the license was issued to. */
  email: string;
  /** Activation plan identifier. */
  plan: "monthly" | "semiannual" | "annual" | "lifetime" | "trial";
  /** ISO 8601 UTC timestamp of issuance. */
  issuedAt: string;
  /** ISO 8601 UTC timestamp of expiry, or null for lifetime licenses. */
  expiresAt: string | null;
  /** ISO 8601 UTC timestamp of local activation. */
  activatedAt: string;
  /**
   * Whole days remaining until expiry (may be negative if expired).
   * null for lifetime licenses.
   */
  daysRemaining: number | null;
  /** True if the license has passed its expiry date. */
  isExpired: boolean;
}
