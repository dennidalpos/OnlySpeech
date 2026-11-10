import {
  getVisitorStatusLabels,
  getVisitorUiText
} from "./visitor-localization.js";
import { normalizeVisitorLocalizationLanguageKey } from "./visitor-language-readiness.js";
import { getVisitorTechnicalErrorText } from "./visitor-technical-localization.js";
import type { OperatorStatus, SideState, TechnicalIssue, UiLanguage } from "./types.js";

const SHARED_CHINESE_UI_KEYS = new Set(["zh", "zh-Hant", "yue"]);
const SUPPORTED_OPERATOR_UI_LANGUAGES = new Set(["en", "it", "es", "fr", "de", "zh"]);

function normalizeOperatorUiLanguage(value: string | null | undefined): UiLanguage {
  if (!value) {
    return "en";
  }

  const normalized = normalizeVisitorLocalizationLanguageKey(value);
  if (SHARED_CHINESE_UI_KEYS.has(normalized)) {
    return "zh";
  }

  return SUPPORTED_OPERATOR_UI_LANGUAGES.has(normalized) ? normalized : "en";
}

export function hasOperatorLocalization(value: string | null | undefined): boolean {
  if (!value) {
    return true;
  }

  const normalized = normalizeVisitorLocalizationLanguageKey(value);
  return normalized === "en" || normalized === "it" || SUPPORTED_OPERATOR_UI_LANGUAGES.has(normalized) || SHARED_CHINESE_UI_KEYS.has(normalized);
}

export function resolveUiLanguageForSide(side: SideState): UiLanguage {
  return normalizeOperatorUiLanguage(side.effectiveUiLanguage);
}

export function resolveBrowserUiLanguage(language: string | undefined): UiLanguage {
  return normalizeOperatorUiLanguage(language);
}

interface UiTextShape {
  booting: string;
  stationLabel: (side: "A" | "B") => string;
  headerChipConfigured: (configuredLabel: string) => string;
  headerChipUiFallback: string;
  interactionLanguage: string;
  readsOtherIn: string;
  speaksIn: string;
  otherUserLanguage: string;
  sourceLanguage: string;
  readingLanguage: string;
  autoDetectOnFirstPtt: string;
  localTranscript: string;
  remoteTranslation: string;
  localTranscriptHint: string;
  waitingRemoteLanguage: string;
  remoteTranslationHint: string;
  conversationHistory: string;
  conversationHistoryHint: string;
  sessionContext: string;
  sessionTurns: (count: number) => string;
  changeLanguage: string;
  openSetup: string;
  resetSession: string;
  closeApp: string;
  ptt: string;
  pttReady: string;
  pttUnavailable: string;
  technicalError: string;
  retry: string;
  unavailableSystem: string;
  selectInteractionLanguageTitle: string;
  selectInteractionLanguageDescription: string;
  selectLanguageTitle: string;
  selectLanguageDescription: string;
  languageField: string;
  confirmReset: string;
  confirmResetDescription: string;
  confirmClose: string;
  confirmCloseDescription: string;
  confirmShutdown: string;
  confirmShutdownDescription: string;
  shutdownComputer: string;
  setupWizardAccessTitle: string;
  setupWizardAccessDescription: string;
  setupWizardAccessChangeDescription: string;
  setupWizardPasswordLabel: string;
  setupWizardNewPasswordLabel: string;
  setupWizardConfirmPasswordLabel: string;
  setupWizardAccessSubmit: string;
  setupWizardInvalidPassword: string;
  setupWizardPasswordRequired: string;
  setupWizardPasswordTooShort: (minimumLength: number) => string;
  setupWizardPasswordMismatch: string;
  setupWizardTemporaryPasswordTitle: string;
  setupWizardTemporaryPasswordDescription: string;
  setupWizardTemporaryPasswordRevealLabel: string;
  dismiss: string;
  cancel: string;
  confirm: string;
  bridgeUnavailable: string;
  statusLabels: Record<OperatorStatus, string>;
}

interface LocalizedTechnicalIssueCopy {
  message: string;
  recovery?: string;
}

const UI_TEXT: Record<string, UiTextShape> = {
  it: {
    booting: "Avvio OnlySpeech…",
    stationLabel: (side) => `Postazione ${side}`,
    headerChipConfigured: (configuredLabel) => `Configurata: ${configuredLabel}`,
    headerChipUiFallback: "Interfaccia: inglese",
    interactionLanguage: "Lingua operatore",
    readsOtherIn: "Leggi l'altro in",
    speaksIn: "Parli in",
    otherUserLanguage: "Lingua utente impostata",
    sourceLanguage: "Lingua sorgente",
    readingLanguage: "Lingua di lettura",
    autoDetectOnFirstPtt: "rilevamento automatico al primo PTT",
    localTranscript: "Testo operatore",
    remoteTranslation: "Traduzione utente",
    localTranscriptHint: "Il testo dell'operatore apparira qui mentre tiene premuto.",
    waitingRemoteLanguage: "In attesa che l'utente selezioni una lingua.",
    remoteTranslationHint: "La traduzione dell'utente apparira qui.",
    conversationHistory: "Storico conversazione",
    conversationHistoryHint: "I turni confermati della sessione appariranno qui in ordine cronologico.",
    sessionContext: "Contesto sessione",
    sessionTurns: (count) => `${count} turni`,
    changeLanguage: "Cambia lingua",
    openSetup: "Apri configurazione",
    resetSession: "Reimposta sessione",
    closeApp: "Chiudi applicazione",
    ptt: "Tieni premuto per parlare",
    pttReady: "Premi e parla",
    pttUnavailable: "Attendi disponibilita",
    technicalError: "Errore tecnico",
    retry: "Riprova",
    unavailableSystem: "Sistema non disponibile",
    selectInteractionLanguageTitle: "Seleziona la lingua dell'operatore",
    selectInteractionLanguageDescription: "Questa lingua viene usata sia per parlare sia per ricevere la traduzione dell'utente.",
    selectLanguageTitle: "Seleziona la lingua che vuoi leggere",
    selectLanguageDescription: "Seleziona la lingua in cui vuoi leggere la traduzione dell'utente.",
    languageField: "Lingua",
    confirmReset: "Conferma reimpostazione",
    confirmResetDescription: "La sessione verra reimpostata su entrambe le schermate.",
    confirmClose: "Conferma chiusura",
    confirmCloseDescription: "L'applicazione verra chiusa su entrambi i monitor.",
    confirmShutdown: "Conferma spegnimento",
    confirmShutdownDescription: "Il computer verra spento. Salvare tutto il lavoro aperto prima di procedere.",
    shutdownComputer: "Spegni computer",
    setupWizardAccessTitle: "Accesso configurazione",
    setupWizardAccessDescription: "Inserisci la password locale della postazione per riaprire il wizard.",
    setupWizardAccessChangeDescription:
      "Inserisci la password temporanea locale della postazione e scegline subito una nuova per continuare.",
    setupWizardPasswordLabel: "Password configurazione",
    setupWizardNewPasswordLabel: "Nuova password configurazione",
    setupWizardConfirmPasswordLabel: "Conferma nuova password",
    setupWizardAccessSubmit: "Apri configurazione",
    setupWizardInvalidPassword: "Password configurazione non valida.",
    setupWizardPasswordRequired: "Inserisci la nuova password richiesta per continuare.",
    setupWizardPasswordTooShort: (minimumLength) =>
      `La nuova password configurazione deve avere almeno ${minimumLength} caratteri.`,
    setupWizardPasswordMismatch: "La conferma della nuova password non corrisponde.",
    setupWizardTemporaryPasswordTitle: "Password temporanea configurazione attiva",
    setupWizardTemporaryPasswordDescription:
      "Questa postazione ha ancora una password temporanea per riaprire il wizard. Usala una sola volta e cambiala subito al primo accesso autenticato.",
    setupWizardTemporaryPasswordRevealLabel: "Password temporanea",
    dismiss: "Chiudi",
    cancel: "Annulla",
    confirm: "Conferma",
    bridgeUnavailable: "Bridge renderer/main non disponibile. Verifica il preload di Electron.",
    statusLabels: {
      booting: "Avvio",
      "language-selection": "Selezione lingua",
      ready: "Pronto",
      listening: "Ascolto",
      translating: "Traduco",
      error: "Errore"
    }
  },
  en: {
    booting: "Starting OnlySpeech…",
    stationLabel: (side) => `Station ${side}`,
    headerChipConfigured: (configuredLabel) => `Configured: ${configuredLabel}`,
    headerChipUiFallback: "UI: English",
    interactionLanguage: "Operator language",
    readsOtherIn: "Read the other side in",
    speaksIn: "You speak in",
    otherUserLanguage: "Selected user language",
    sourceLanguage: "Source language",
    readingLanguage: "Reading language",
    autoDetectOnFirstPtt: "automatic detection on first PTT",
    localTranscript: "Operator speech",
    remoteTranslation: "User translation",
    localTranscriptHint: "The operator speech will appear here while the button is held.",
    waitingRemoteLanguage: "Waiting for the user to choose a language.",
    remoteTranslationHint: "The user translation will appear here.",
    conversationHistory: "Conversation history",
    conversationHistoryHint: "Confirmed turns from the current session will appear here in chronological order.",
    sessionContext: "Session context",
    sessionTurns: (count) => `${count} turns`,
    changeLanguage: "Change language",
    openSetup: "Open setup",
    resetSession: "Reset session",
    closeApp: "Close application",
    ptt: "Hold to speak",
    pttReady: "Press and speak",
    pttUnavailable: "Waiting for availability",
    technicalError: "Technical error",
    retry: "Retry",
    unavailableSystem: "System unavailable",
    selectInteractionLanguageTitle: "Choose the operator language",
    selectInteractionLanguageDescription: "This language is used both for speaking and for receiving the visitor translation.",
    selectLanguageTitle: "Choose the language you want to read",
    selectLanguageDescription: "Select the language you want to read the user translation in.",
    languageField: "Language",
    confirmReset: "Confirm reset",
    confirmResetDescription: "The session will be reset on both screens.",
    confirmClose: "Confirm close",
    confirmCloseDescription: "The application will close on both monitors.",
    confirmShutdown: "Confirm shutdown",
    confirmShutdownDescription: "The computer will be shut down. Save all open work before proceeding.",
    shutdownComputer: "Shut down computer",
    setupWizardAccessTitle: "Setup access",
    setupWizardAccessDescription: "Enter the workstation-local password to reopen the setup wizard.",
    setupWizardAccessChangeDescription:
      "Enter the workstation-local temporary password and choose a new password before continuing.",
    setupWizardPasswordLabel: "Setup password",
    setupWizardNewPasswordLabel: "New setup password",
    setupWizardConfirmPasswordLabel: "Confirm new password",
    setupWizardAccessSubmit: "Open setup",
    setupWizardInvalidPassword: "The setup password is invalid.",
    setupWizardPasswordRequired: "Enter the required new setup password to continue.",
    setupWizardPasswordTooShort: (minimumLength) =>
      `The new setup password must be at least ${minimumLength} characters long.`,
    setupWizardPasswordMismatch: "The new password confirmation does not match.",
    setupWizardTemporaryPasswordTitle: "Temporary setup password is active",
    setupWizardTemporaryPasswordDescription:
      "This workstation still has a temporary password for reopening setup. Use it once, then replace it at the first authenticated access.",
    setupWizardTemporaryPasswordRevealLabel: "Temporary password",
    dismiss: "Dismiss",
    cancel: "Cancel",
    confirm: "Confirm",
    bridgeUnavailable: "Renderer/main bridge unavailable. Check the Electron preload bridge.",
    statusLabels: {
      booting: "Starting",
      "language-selection": "Language selection",
      ready: "Ready",
      listening: "Listening",
      translating: "Translating",
      error: "Error"
    }
  }
};

const OPERATOR_UI_OVERRIDES: Record<string, Partial<UiTextShape>> = {
  es: {
    booting: "Iniciando OnlySpeech…",
    stationLabel: (side) => `Puesto ${side}`,
    headerChipConfigured: (configuredLabel) => `Configurado: ${configuredLabel}`,
    headerChipUiFallback: "Interfaz: ingles",
    interactionLanguage: "Idioma del operador",
    readsOtherIn: "Lees a la otra parte en",
    speaksIn: "Hablas en",
    otherUserLanguage: "Idioma del usuario",
    sourceLanguage: "Idioma de origen",
    readingLanguage: "Idioma de lectura",
    autoDetectOnFirstPtt: "deteccion automatica al primer PTT",
    localTranscript: "Voz del operador",
    remoteTranslation: "Traduccion del usuario",
    localTranscriptHint: "La voz del operador aparecera aqui mientras mantenga pulsado el boton.",
    waitingRemoteLanguage: "Esperando a que el usuario elija un idioma.",
    remoteTranslationHint: "La traduccion del usuario aparecera aqui.",
    openSetup: "Abrir configuracion",
    resetSession: "Restablecer sesion",
    closeApp: "Cerrar aplicacion",
    ptt: "Mantener pulsado para hablar",
    selectInteractionLanguageTitle: "Elige el idioma del operador",
    selectInteractionLanguageDescription: "Este idioma se usa tanto para hablar como para recibir la traduccion del usuario.",
    confirmReset: "Confirmar reinicio",
    confirmResetDescription: "La sesion se reiniciara en ambas pantallas.",
    confirmClose: "Confirmar cierre",
    confirmCloseDescription: "La aplicacion se cerrara en ambos monitores.",
    confirmShutdown: "Confirmar apagado",
    confirmShutdownDescription: "El ordenador se apagara. Guarda el trabajo abierto antes de continuar.",
    shutdownComputer: "Apagar ordenador",
    setupWizardAccessTitle: "Acceso a configuracion",
    setupWizardAccessDescription: "Introduce la contraseña local para reabrir el asistente.",
    setupWizardAccessChangeDescription: "Introduce la contraseña temporal local y elige una nueva antes de continuar.",
    setupWizardPasswordLabel: "Contraseña de configuracion",
    setupWizardNewPasswordLabel: "Nueva contraseña de configuracion",
    setupWizardConfirmPasswordLabel: "Confirmar nueva contraseña",
    setupWizardAccessSubmit: "Abrir configuracion",
    setupWizardInvalidPassword: "La contraseña de configuracion no es valida.",
    setupWizardPasswordRequired: "Introduce la nueva contraseña obligatoria para continuar.",
    setupWizardPasswordTooShort: (minimumLength) => `La nueva contraseña debe tener al menos ${minimumLength} caracteres.`,
    setupWizardPasswordMismatch: "La confirmacion de la nueva contraseña no coincide.",
    setupWizardTemporaryPasswordTitle: "Hay una contraseña temporal de configuracion activa",
    setupWizardTemporaryPasswordDescription: "Esta estacion todavia usa una contraseña temporal para reabrir la configuracion. Usala una sola vez y cambiala inmediatamente.",
    setupWizardTemporaryPasswordRevealLabel: "Contraseña temporal",
    dismiss: "Cerrar",
    bridgeUnavailable: "El puente renderer/main no esta disponible. Comprueba el preload de Electron."
  },
  fr: {
    booting: "Demarrage de OnlySpeech…",
    stationLabel: (side) => `Poste ${side}`,
    headerChipConfigured: (configuredLabel) => `Configure : ${configuredLabel}`,
    headerChipUiFallback: "Interface : anglais",
    interactionLanguage: "Langue de l'operateur",
    readsOtherIn: "Vous lisez l'autre en",
    speaksIn: "Vous parlez en",
    otherUserLanguage: "Langue de l'utilisateur",
    sourceLanguage: "Langue source",
    readingLanguage: "Langue de lecture",
    autoDetectOnFirstPtt: "detection automatique au premier PTT",
    localTranscript: "Parole operateur",
    remoteTranslation: "Traduction utilisateur",
    localTranscriptHint: "La parole de l'operateur apparait ici pendant l'appui.",
    waitingRemoteLanguage: "En attente du choix de langue de l'utilisateur.",
    remoteTranslationHint: "La traduction de l'utilisateur apparait ici.",
    openSetup: "Ouvrir la configuration",
    resetSession: "Reinitialiser la session",
    closeApp: "Fermer l'application",
    ptt: "Maintenir pour parler",
    selectInteractionLanguageTitle: "Choisissez la langue de l'operateur",
    selectInteractionLanguageDescription: "Cette langue est utilisee pour parler et pour recevoir la traduction de l'utilisateur.",
    confirmReset: "Confirmer la reinitialisation",
    confirmResetDescription: "La session sera reinitialisee sur les deux ecrans.",
    confirmClose: "Confirmer la fermeture",
    confirmCloseDescription: "L'application sera fermee sur les deux moniteurs.",
    confirmShutdown: "Confirmer l'arret",
    confirmShutdownDescription: "L'ordinateur va s'eteindre. Enregistrez le travail ouvert avant de continuer.",
    shutdownComputer: "Eteindre l'ordinateur",
    setupWizardAccessTitle: "Acces configuration",
    setupWizardAccessDescription: "Saisissez le mot de passe local pour rouvrir l'assistant.",
    setupWizardAccessChangeDescription: "Saisissez le mot de passe temporaire local et choisissez-en un nouveau avant de continuer.",
    setupWizardPasswordLabel: "Mot de passe configuration",
    setupWizardNewPasswordLabel: "Nouveau mot de passe configuration",
    setupWizardConfirmPasswordLabel: "Confirmer le nouveau mot de passe",
    setupWizardAccessSubmit: "Ouvrir la configuration",
    setupWizardInvalidPassword: "Le mot de passe de configuration est invalide.",
    setupWizardPasswordRequired: "Saisissez le nouveau mot de passe requis pour continuer.",
    setupWizardPasswordTooShort: (minimumLength) => `Le nouveau mot de passe doit comporter au moins ${minimumLength} caracteres.`,
    setupWizardPasswordMismatch: "La confirmation du nouveau mot de passe ne correspond pas.",
    setupWizardTemporaryPasswordTitle: "Un mot de passe temporaire de configuration est actif",
    setupWizardTemporaryPasswordDescription: "Ce poste utilise encore un mot de passe temporaire pour rouvrir la configuration. Utilisez-le une seule fois puis remplacez-le immediatement.",
    setupWizardTemporaryPasswordRevealLabel: "Mot de passe temporaire",
    dismiss: "Fermer",
    bridgeUnavailable: "Le pont renderer/main n'est pas disponible. Verifiez le preload Electron."
  },
  de: {
    booting: "OnlySpeech wird gestartet…",
    stationLabel: (side) => `Station ${side}`,
    headerChipConfigured: (configuredLabel) => `Konfiguriert: ${configuredLabel}`,
    headerChipUiFallback: "UI: Englisch",
    interactionLanguage: "Operatorsprache",
    readsOtherIn: "Sie lesen die andere Seite auf",
    speaksIn: "Sie sprechen auf",
    otherUserLanguage: "Sprache der anderen Person",
    sourceLanguage: "Quellsprache",
    readingLanguage: "Lesesprache",
    autoDetectOnFirstPtt: "automatische Erkennung beim ersten PTT",
    localTranscript: "Operatorsprache",
    remoteTranslation: "Benutzerubersetzung",
    localTranscriptHint: "Die Sprache des Operators erscheint hier, solange die Taste gehalten wird.",
    waitingRemoteLanguage: "Warten, bis die andere Person eine Sprache auswahlt.",
    remoteTranslationHint: "Die Ubersetzung der anderen Person erscheint hier.",
    openSetup: "Setup offnen",
    resetSession: "Sitzung zurucksetzen",
    closeApp: "Anwendung schliessen",
    ptt: "Gedruckt halten zum Sprechen",
    selectInteractionLanguageTitle: "Operatorsprache auswahlen",
    selectInteractionLanguageDescription: "Diese Sprache wird zum Sprechen und fur die Ubersetzung der anderen Person verwendet.",
    confirmReset: "Zurucksetzen bestatigen",
    confirmResetDescription: "Die Sitzung wird auf beiden Bildschirmen zuruckgesetzt.",
    confirmClose: "Schliessen bestatigen",
    confirmCloseDescription: "Die Anwendung wird auf beiden Monitoren geschlossen.",
    confirmShutdown: "Herunterfahren bestatigen",
    confirmShutdownDescription: "Der Computer wird heruntergefahren. Speichern Sie offene Arbeit vorher.",
    shutdownComputer: "Computer herunterfahren",
    setupWizardAccessTitle: "Setup-Zugang",
    setupWizardAccessDescription: "Geben Sie das lokale Passwort ein, um den Assistenten erneut zu offnen.",
    setupWizardAccessChangeDescription: "Geben Sie das lokale temporare Passwort ein und wahlen Sie anschliessend ein neues.",
    setupWizardPasswordLabel: "Setup-Passwort",
    setupWizardNewPasswordLabel: "Neues Setup-Passwort",
    setupWizardConfirmPasswordLabel: "Neues Passwort bestatigen",
    setupWizardAccessSubmit: "Setup offnen",
    setupWizardInvalidPassword: "Das Setup-Passwort ist ungueltig.",
    setupWizardPasswordRequired: "Geben Sie das erforderliche neue Passwort ein, um fortzufahren.",
    setupWizardPasswordTooShort: (minimumLength) => `Das neue Setup-Passwort muss mindestens ${minimumLength} Zeichen lang sein.`,
    setupWizardPasswordMismatch: "Die Bestatigung des neuen Passworts stimmt nicht uberein.",
    setupWizardTemporaryPasswordTitle: "Temporäres Setup-Passwort ist aktiv",
    setupWizardTemporaryPasswordDescription: "Diese Station verwendet noch ein temporäres Passwort zum erneuten Offnen des Setups. Nutzen Sie es einmal und ersetzen Sie es sofort.",
    setupWizardTemporaryPasswordRevealLabel: "Temporäres Passwort",
    dismiss: "Schliessen",
    bridgeUnavailable: "Die Renderer/Main-Verbindung ist nicht verfugbar. Prufen Sie das Electron-Preload."
  },
  zh: {
    booting: "OnlySpeech 正在启动…",
    stationLabel: (side) => `工作站 ${side}`,
    headerChipConfigured: (configuredLabel) => `已配置：${configuredLabel}`,
    headerChipUiFallback: "界面：英语",
    interactionLanguage: "操作员语言",
    readsOtherIn: "读取对方语言",
    speaksIn: "你说的语言",
    otherUserLanguage: "用户语言",
    sourceLanguage: "源语言",
    readingLanguage: "阅读语言",
    autoDetectOnFirstPtt: "首次 PTT 自动识别",
    localTranscript: "操作员语音",
    remoteTranslation: "用户翻译",
    localTranscriptHint: "按住按钮时，操作员语音会显示在这里。",
    waitingRemoteLanguage: "等待用户选择语言。",
    remoteTranslationHint: "用户翻译会显示在这里。",
    openSetup: "打开设置",
    resetSession: "重置会话",
    closeApp: "关闭应用",
    ptt: "按住说话",
    selectInteractionLanguageTitle: "选择操作员语言",
    selectInteractionLanguageDescription: "此语言同时用于说话和接收用户翻译。",
    confirmReset: "确认重置",
    confirmResetDescription: "两个屏幕上的会话都会被重置。",
    confirmClose: "确认关闭",
    confirmCloseDescription: "应用将在两个显示器上关闭。",
    confirmShutdown: "确认关机",
    confirmShutdownDescription: "电脑将关闭。请先保存所有打开的工作。",
    shutdownComputer: "关闭电脑",
    setupWizardAccessTitle: "设置访问",
    setupWizardAccessDescription: "输入本机密码以重新打开设置向导。",
    setupWizardAccessChangeDescription: "输入本机临时密码，并在继续前设置一个新密码。",
    setupWizardPasswordLabel: "设置密码",
    setupWizardNewPasswordLabel: "新设置密码",
    setupWizardConfirmPasswordLabel: "确认新密码",
    setupWizardAccessSubmit: "打开设置",
    setupWizardInvalidPassword: "设置密码无效。",
    setupWizardPasswordRequired: "请输入要求的新密码后继续。",
    setupWizardPasswordTooShort: (minimumLength) => `新密码长度至少为 ${minimumLength} 个字符。`,
    setupWizardPasswordMismatch: "新密码确认不匹配。",
    setupWizardTemporaryPasswordTitle: "临时设置密码仍然有效",
    setupWizardTemporaryPasswordDescription: "此工作站仍在使用临时密码重新打开设置。请仅使用一次并立即更改。",
    setupWizardTemporaryPasswordRevealLabel: "临时密码",
    dismiss: "关闭",
    bridgeUnavailable: "渲染器/主进程桥接不可用。请检查 Electron preload。"
  }
};

const UI_TEXT_CACHE = new Map<string, UiTextShape>();

function buildDerivedUiText(language: string): UiTextShape {
  if (language === "en" || language === "it") {
    return UI_TEXT[language]!;
  }

  const visitorText = getVisitorUiText(language);
  const technicalText = getVisitorTechnicalErrorText(language);
  const overrides = OPERATOR_UI_OVERRIDES[language] ?? {};

  return {
    ...UI_TEXT.en!,
    booting: technicalText.unavailableSystem === "System unavailable" ? UI_TEXT.en!.booting : overrides.booting ?? UI_TEXT.en!.booting,
    conversationHistory: visitorText.conversationHistory,
    conversationHistoryHint: visitorText.conversationHistoryHint,
    sessionContext: visitorText.sessionContext,
    sessionTurns: visitorText.sessionTurns,
    changeLanguage: visitorText.changeLanguage,
    cancel: visitorText.cancel,
    confirm: visitorText.confirm,
    pttReady: visitorText.pressAndSpeak,
    pttUnavailable: visitorText.waitingAvailability,
    languageField: visitorText.currentLanguage,
    technicalError: technicalText.technicalError,
    retry: technicalText.retry,
    unavailableSystem: technicalText.unavailableSystem,
    statusLabels: getVisitorStatusLabels(language),
    ...overrides
  };
}

const ISSUE_MESSAGES: Record<string, Partial<Record<TechnicalIssue["code"], (issue: TechnicalIssue) => string>>> = {
  it: {
    "missing-monitor": () => "Sono necessari due monitor attivi per avviare la sessione.",
    "missing-microphone-a": () => "Microfono A non rilevato.",
    "missing-microphone-b": (issue) =>
      issue.message.includes("distinti")
        ? "Servono due microfoni distinti."
        : issue.message.includes("condiviso")
          ? "Microfono condiviso non rilevato."
          : "Microfono B non rilevato.",
    "microphone-permission-denied": (issue) =>
      issue.side ? `La postazione ${issue.side} non puo accedere al microfono.` : "L'accesso al microfono e bloccato.",
    "microphone-unavailable": (issue) =>
      issue.side
        ? `Il microfono della postazione ${issue.side} non e disponibile o e occupato.`
        : "Il microfono richiesto non e disponibile o e occupato.",
    "speech-config-missing": () => "Configurazione speech mancante per il provider selezionato.",
    "translation-config-missing": () => "Configurazione traduzione mancante per il provider selezionato.",
    "translation-provider-failure": () => "Richiesta al provider traduzione non riuscita.",
    "speech-stream-failure": () => "Errore nel flusso vocale."
  },
  en: {
    "missing-monitor": () => "Two active monitors are required to start the session.",
    "missing-microphone-a": () => "Microphone A not detected.",
    "missing-microphone-b": (issue) =>
      issue.message.includes("distinti")
        ? "Two distinct microphones are required."
        : issue.message.includes("condiviso")
          ? "The shared microphone was not detected."
          : "Microphone B not detected.",
    "microphone-permission-denied": (issue) =>
      issue.side ? `Station ${issue.side} cannot access its microphone.` : "Microphone access is blocked.",
    "microphone-unavailable": (issue) =>
      issue.side
        ? `Station ${issue.side} microphone is unavailable or busy.`
        : "The required microphone is unavailable or busy.",
    "speech-config-missing": () => "Speech configuration is missing for the selected provider.",
    "translation-config-missing": () => "Translation configuration is missing for the selected provider.",
    "translation-provider-failure": () => "The translation provider request failed.",
    "speech-stream-failure": () => "The speech stream failed."
  }
};

const ISSUE_RECOVERY: Record<string, Partial<Record<TechnicalIssue["code"], (issue: TechnicalIssue) => string>>> = {
  it: {
    "microphone-permission-denied": () =>
        "Apri la configurazione per riabilitare il microfono e salvare di nuovo l'assegnazione sulla postazione.",
    "microphone-unavailable": () =>
      "Apri la configurazione per verificare l'assegnazione, ricollega o sostituisci il device USB, poi riprova."
  },
  en: {
    "microphone-permission-denied": () =>
        "Open setup to re-enable microphone access and save the assignment again on the workstation.",
    "microphone-unavailable": () =>
      "Open setup to verify the assignment, reconnect or replace the USB device, then retry."
  }
};

export function getUiText(language: UiLanguage): UiTextShape {
  const normalized = normalizeOperatorUiLanguage(language);
  const cached = UI_TEXT_CACHE.get(normalized);
  if (cached) {
    return cached;
  }

  const built = buildDerivedUiText(normalized);
  UI_TEXT_CACHE.set(normalized, built);
  return built;
}

export function getTechnicalIssueCopy(issue: TechnicalIssue, language: UiLanguage): LocalizedTechnicalIssueCopy {
  const normalized = normalizeOperatorUiLanguage(language);
  const visitorTechnicalText = normalized !== "en" && normalized !== "it"
    ? getVisitorTechnicalErrorText(normalized)
    : null;

  return {
    message:
      ISSUE_MESSAGES[normalized]?.[issue.code]?.(issue) ??
      visitorTechnicalText?.issueMessages[issue.code]?.(issue) ??
      issue.message,
    recovery: ISSUE_RECOVERY[normalized]?.[issue.code]?.(issue)
  };
}

export function localizeTechnicalIssue(issue: TechnicalIssue, language: UiLanguage): TechnicalIssue {
  const localizedMessage = getTechnicalIssueCopy(issue, language).message;
  return {
    ...issue,
    message: localizedMessage
  };
}
