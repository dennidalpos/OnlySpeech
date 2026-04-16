import { normalizeVisitorLocalizationLanguageKey } from "./visitor-language-readiness.js";
import type { RuntimeDisclosureMode, RuntimeDisclosureSettings } from "./types.js";

export interface RuntimeDisclosureText {
  title: string;
  paragraphs: string[];
}

const RUNTIME_DISCLOSURE_TEXT: Record<string, RuntimeDisclosureText> = {
  it: {
    title: "Avviso uso assistito da AI",
    paragraphs: [
      "OnlySpeech elabora voce e trascrizioni del turno attivo per fornire supporto alla comunicazione.",
      "L'output puo contenere errori e non deve essere l'unica base per decisioni critiche, mediche, legali o di sicurezza."
    ]
  },
  en: {
    title: "AI-assisted use notice",
    paragraphs: [
      "OnlySpeech processes voice and transcript data for the active turn to support communication.",
      "Output may contain errors and must not be the sole basis for critical, medical, legal, or safety decisions."
    ]
  },
  es: {
    title: "Aviso de uso asistido por IA",
    paragraphs: [
      "OnlySpeech procesa voz y transcripciones del turno activo para apoyar la comunicacion.",
      "La salida puede contener errores y no debe ser la unica base para decisiones criticas, medicas, legales o de seguridad."
    ]
  },
  fr: {
    title: "Avis d'utilisation assistee par IA",
    paragraphs: [
      "OnlySpeech traite la voix et les transcriptions du tour actif pour faciliter la communication.",
      "La sortie peut contenir des erreurs et ne doit pas etre l'unique base pour des decisions critiques, medicales, juridiques ou de securite."
    ]
  },
  de: {
    title: "Hinweis zur KI-unterstutzten Nutzung",
    paragraphs: [
      "OnlySpeech verarbeitet Sprache und Transkripte des aktiven Sprechturns zur Kommunikationsunterstutzung.",
      "Die Ausgabe kann Fehler enthalten und darf nicht die alleinige Grundlage fur kritische, medizinische, rechtliche oder sicherheitsrelevante Entscheidungen sein."
    ]
  },
  zh: {
    title: "AI 辅助使用提示",
    paragraphs: [
      "OnlySpeech 会处理当前轮次的语音和转写内容，以支持沟通。",
      "输出可能包含错误，不得作为关键、医疗、法律或安全决策的唯一依据。"
    ]
  }
};

export const DEFAULT_RUNTIME_DISCLOSURE_SETTINGS: RuntimeDisclosureSettings = Object.freeze({
  mode: "standard" as RuntimeDisclosureMode,
  customText: null
});

function normalizeDisclosureLanguage(languageCode: string | null | undefined): string {
  const normalized = normalizeVisitorLocalizationLanguageKey(languageCode);

  if (normalized === "zh-Hant" || normalized === "yue") {
    return "zh";
  }

  return normalized in RUNTIME_DISCLOSURE_TEXT ? normalized : "en";
}

export function normalizeRuntimeDisclosureMode(
  value: string | RuntimeDisclosureMode | null | undefined
): RuntimeDisclosureMode {
  switch (value?.trim().toLowerCase()) {
    case "custom":
      return "custom";
    case "disabled":
      return "disabled";
    default:
      return "standard";
  }
}

export function normalizeRuntimeDisclosureSettings(
  settings: Partial<RuntimeDisclosureSettings> | null | undefined
): RuntimeDisclosureSettings {
  const customText = settings?.customText?.trim();

  return {
    mode: normalizeRuntimeDisclosureMode(settings?.mode),
    customText: customText && customText.length > 0 ? customText : null
  };
}

function resolveCustomDisclosureParagraphs(customText: string | null): string[] {
  if (!customText) {
    return [];
  }

  return customText
    .split(/\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

export function getRuntimeDisclosureText(
  languageCode: string | null | undefined,
  settings: Partial<RuntimeDisclosureSettings> | null | undefined = DEFAULT_RUNTIME_DISCLOSURE_SETTINGS
): RuntimeDisclosureText | null {
  const localized = RUNTIME_DISCLOSURE_TEXT[normalizeDisclosureLanguage(languageCode)];
  const normalizedSettings = normalizeRuntimeDisclosureSettings(settings);

  if (normalizedSettings.mode === "disabled") {
    return null;
  }

  if (normalizedSettings.mode === "custom") {
    const paragraphs = resolveCustomDisclosureParagraphs(normalizedSettings.customText);
    if (paragraphs.length > 0) {
      return {
        title: localized.title,
        paragraphs
      };
    }
  }

  return localized;
}
