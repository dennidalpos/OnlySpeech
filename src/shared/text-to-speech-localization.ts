import { normalizeVisitorLocalizationLanguageKey } from "./visitor-language-readiness.js";
import type { UiLanguage } from "./types.js";

export interface TextToSpeechUiText {
  playButton: string;
  stopButton: string;
  playingState: string;
  unavailableState: string;
  errorState: string;
  busyState: string;
  playPanelLabel: (panelTitle: string) => string;
  stopPanelLabel: (panelTitle: string) => string;
}

const ENGLISH_TEXT: TextToSpeechUiText = {
  playButton: "Play",
  stopButton: "Stop",
  playingState: "Reading aloud",
  unavailableState: "Audio unavailable",
  errorState: "Audio error",
  busyState: "Microphone active",
  playPanelLabel: (panelTitle) => `Play audio for ${panelTitle}`,
  stopPanelLabel: (panelTitle) => `Stop audio for ${panelTitle}`
};

const OPERATOR_TEXT: Record<UiLanguage, TextToSpeechUiText> = {
  en: ENGLISH_TEXT,
  it: {
    playButton: "Audio",
    stopButton: "Stop",
    playingState: "Riproduzione attiva",
    unavailableState: "Audio non disponibile",
    errorState: "Errore audio",
    busyState: "Microfono attivo",
    playPanelLabel: (panelTitle) => `Riproduci audio per ${panelTitle}`,
    stopPanelLabel: (panelTitle) => `Ferma audio per ${panelTitle}`
  },
  es: {
    playButton: "Audio",
    stopButton: "Detener",
    playingState: "Reproduciendo",
    unavailableState: "Audio no disponible",
    errorState: "Error de audio",
    busyState: "Microfono activo",
    playPanelLabel: (panelTitle) => `Reproducir audio para ${panelTitle}`,
    stopPanelLabel: (panelTitle) => `Detener audio para ${panelTitle}`
  },
  fr: {
    playButton: "Audio",
    stopButton: "Arreter",
    playingState: "Lecture audio",
    unavailableState: "Audio indisponible",
    errorState: "Erreur audio",
    busyState: "Micro actif",
    playPanelLabel: (panelTitle) => `Lire l'audio pour ${panelTitle}`,
    stopPanelLabel: (panelTitle) => `Arreter l'audio pour ${panelTitle}`
  },
  de: {
    playButton: "Audio",
    stopButton: "Stopp",
    playingState: "Wiedergabe aktiv",
    unavailableState: "Audio nicht verfugbar",
    errorState: "Audiofehler",
    busyState: "Mikrofon aktiv",
    playPanelLabel: (panelTitle) => `Audio fur ${panelTitle} abspielen`,
    stopPanelLabel: (panelTitle) => `Audio fur ${panelTitle} stoppen`
  },
  zh: {
    playButton: "语音",
    stopButton: "停止",
    playingState: "正在朗读",
    unavailableState: "语音不可用",
    errorState: "语音错误",
    busyState: "麦克风正在使用",
    playPanelLabel: (panelTitle) => `播放${panelTitle}语音`,
    stopPanelLabel: (panelTitle) => `停止${panelTitle}语音`
  }
};

const VISITOR_TEXT: Record<string, TextToSpeechUiText> = {
  en: ENGLISH_TEXT,
  it: OPERATOR_TEXT.it,
  es: {
    playButton: "Audio",
    stopButton: "Parar",
    playingState: "Reproduciendo",
    unavailableState: "Audio no disponible",
    errorState: "Error de audio",
    busyState: "Microfono activo",
    playPanelLabel: (panelTitle) => `Reproducir audio para ${panelTitle}`,
    stopPanelLabel: (panelTitle) => `Detener audio para ${panelTitle}`
  },
  fr: {
    playButton: "Audio",
    stopButton: "Arreter",
    playingState: "Lecture audio",
    unavailableState: "Audio indisponible",
    errorState: "Erreur audio",
    busyState: "Micro actif",
    playPanelLabel: (panelTitle) => `Lire l'audio pour ${panelTitle}`,
    stopPanelLabel: (panelTitle) => `Arreter l'audio pour ${panelTitle}`
  },
  de: {
    playButton: "Audio",
    stopButton: "Stopp",
    playingState: "Wiedergabe aktiv",
    unavailableState: "Audio nicht verfugbar",
    errorState: "Audiofehler",
    busyState: "Mikrofon aktiv",
    playPanelLabel: (panelTitle) => `Audio fur ${panelTitle} abspielen`,
    stopPanelLabel: (panelTitle) => `Audio fur ${panelTitle} stoppen`
  },
  pt: {
    playButton: "Audio",
    stopButton: "Parar",
    playingState: "Reproducao ativa",
    unavailableState: "Audio indisponivel",
    errorState: "Erro de audio",
    busyState: "Microfone ativo",
    playPanelLabel: (panelTitle) => `Reproduzir audio para ${panelTitle}`,
    stopPanelLabel: (panelTitle) => `Parar audio para ${panelTitle}`
  },
  ar: {
    playButton: "صوت",
    stopButton: "إيقاف",
    playingState: "جارٍ التشغيل",
    unavailableState: "الصوت غير متاح",
    errorState: "خطأ في الصوت",
    busyState: "الميكروفون نشط",
    playPanelLabel: (panelTitle) => `تشغيل الصوت لـ ${panelTitle}`,
    stopPanelLabel: (panelTitle) => `إيقاف الصوت لـ ${panelTitle}`
  },
  zh: {
    playButton: "语音",
    stopButton: "停止",
    playingState: "正在朗读",
    unavailableState: "语音不可用",
    errorState: "语音错误",
    busyState: "麦克风正在使用",
    playPanelLabel: (panelTitle) => `播放${panelTitle}的语音`,
    stopPanelLabel: (panelTitle) => `停止${panelTitle}的语音`
  },
  ja: {
    playButton: "音声",
    stopButton: "停止",
    playingState: "読み上げ中",
    unavailableState: "音声を利用できません",
    errorState: "音声エラー",
    busyState: "マイク使用中",
    playPanelLabel: (panelTitle) => `${panelTitle}を読み上げる`,
    stopPanelLabel: (panelTitle) => `${panelTitle}の読み上げを止める`
  },
  ko: {
    playButton: "음성",
    stopButton: "중지",
    playingState: "읽는 중",
    unavailableState: "음성을 사용할 수 없음",
    errorState: "음성 오류",
    busyState: "마이크 사용 중",
    playPanelLabel: (panelTitle) => `${panelTitle} 음성 재생`,
    stopPanelLabel: (panelTitle) => `${panelTitle} 음성 중지`
  },
  ru: {
    playButton: "Аудио",
    stopButton: "Стоп",
    playingState: "Озвучивание",
    unavailableState: "Аудио недоступно",
    errorState: "Ошибка аудио",
    busyState: "Микрофон активен",
    playPanelLabel: (panelTitle) => `Воспроизвести ${panelTitle}`,
    stopPanelLabel: (panelTitle) => `Остановить ${panelTitle}`
  },
  uk: {
    playButton: "Аудіо",
    stopButton: "Стоп",
    playingState: "Озвучення",
    unavailableState: "Аудіо недоступне",
    errorState: "Помилка аудіо",
    busyState: "Мікрофон активний",
    playPanelLabel: (panelTitle) => `Відтворити ${panelTitle}`,
    stopPanelLabel: (panelTitle) => `Зупинити ${panelTitle}`
  },
  pl: {
    playButton: "Audio",
    stopButton: "Stop",
    playingState: "Odtwarzanie",
    unavailableState: "Audio niedostepne",
    errorState: "Blad audio",
    busyState: "Mikrofon aktywny",
    playPanelLabel: (panelTitle) => `Odtworz audio dla ${panelTitle}`,
    stopPanelLabel: (panelTitle) => `Zatrzymaj audio dla ${panelTitle}`
  },
  nl: {
    playButton: "Audio",
    stopButton: "Stop",
    playingState: "Wordt voorgelezen",
    unavailableState: "Audio niet beschikbaar",
    errorState: "Audiofout",
    busyState: "Microfoon actief",
    playPanelLabel: (panelTitle) => `Audio afspelen voor ${panelTitle}`,
    stopPanelLabel: (panelTitle) => `Audio stoppen voor ${panelTitle}`
  },
  tr: {
    playButton: "Ses",
    stopButton: "Durdur",
    playingState: "Ses oynatiliyor",
    unavailableState: "Ses kullanilamiyor",
    errorState: "Ses hatasi",
    busyState: "Mikrofon aktif",
    playPanelLabel: (panelTitle) => `${panelTitle} icin ses oynat`,
    stopPanelLabel: (panelTitle) => `${panelTitle} icin sesi durdur`
  },
  hi: {
    playButton: "ऑडियो",
    stopButton: "रोकें",
    playingState: "पढ़कर सुनाया जा रहा है",
    unavailableState: "ऑडियो उपलब्ध नहीं है",
    errorState: "ऑडियो त्रुटि",
    busyState: "माइक्रोफोन सक्रिय है",
    playPanelLabel: (panelTitle) => `${panelTitle} के लिए ऑडियो चलाएं`,
    stopPanelLabel: (panelTitle) => `${panelTitle} के लिए ऑडियो रोकें`
  }
};

export function getOperatorTextToSpeechText(language: UiLanguage): TextToSpeechUiText {
  return OPERATOR_TEXT[language] ?? ENGLISH_TEXT;
}

export function getVisitorTextToSpeechText(languageCode: string | null | undefined): TextToSpeechUiText {
  const normalized = normalizeVisitorLocalizationLanguageKey(languageCode);
  if (normalized === "zh-Hant" || normalized === "yue") {
    return VISITOR_TEXT.zh;
  }

  return VISITOR_TEXT[normalized] ?? ENGLISH_TEXT;
}
