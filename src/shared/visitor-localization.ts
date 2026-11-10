import {
  buildInteractionLanguageChoices as buildRegistryInteractionLanguageChoices,
  resolveInteractionLanguageSourceLocale as resolveRegistryInteractionLanguageSourceLocale
} from "./language-registry.js";
import {
  hasVisitorLocalization,
  resolveVisitorLocalizationState
} from "./visitor-language-readiness.js";
import { VISITOR_LOCALIZATION_LANGUAGE_KEYS } from "./visitor-language-policy.js";
import type { OperatorStatus } from "./types.js";

import rawVisitorUiTexts from "./visitor-ui-texts.json" with { type: "json" };
import rawVisitorStatusLabels from "./visitor-status-labels.json" with { type: "json" };

export { getVisitorCurrentLanguageLabel, getVisitorLocalizedLanguageLabel } from "./visitor-language-labels.js";

export interface VisitorLanguageChoice {
  value: string;
  label: string;
  nativeLabel: string;
  regionCode: string | null;
}

export interface VisitorUiText {
  selectLanguageTitle: string;
  selectLanguageDescription: string;
  whatYouSay: string;
  whatYouSayHint: string;
  operatorTranslation: string;
  operatorTranslationHint: string;
  conversationHistory: string;
  conversationHistoryHint: string;
  sessionContext: string;
  sessionTurns: (count: number) => string;
  holdToSpeak: string;
  pressAndSpeak: string;
  waitingAvailability: string;
  changeLanguage: string;
  closeSession: string;
  currentLanguage: string;
  confirmCloseSession: string;
  confirmCloseSessionDescription: string;
  cancel: string;
  confirm: string;
}

const VISITOR_UI_TEXT = rawVisitorUiTexts as Record<
  string,
  Omit<VisitorUiText, "sessionTurns"> & { sessionTurns: string }
>;

const VISITOR_STATUS_LABELS = rawVisitorStatusLabels as Record<string, Record<OperatorStatus, string>>;

function normalizeLanguageKey(languageCode: string | null | undefined): string {
  return resolveVisitorLocalizationState(languageCode).effectiveLanguageKey;
}

export function getVisitorLocalizationLanguageKeys(): string[] {
  return [...VISITOR_LOCALIZATION_LANGUAGE_KEYS];
}

export function isVisitorLocalizationReady(languageCode: string | null | undefined): boolean {
  return hasVisitorLocalization(languageCode);
}

export function getVisitorRequestedLanguageKey(languageCode: string | null | undefined): string {
  return resolveVisitorLocalizationState(languageCode).requestedLanguageKey;
}

export function getVisitorEffectiveLanguageKey(languageCode: string | null | undefined): string {
  return resolveVisitorLocalizationState(languageCode).effectiveLanguageKey;
}

export function usesVisitorEnglishFallback(languageCode: string | null | undefined): boolean {
  return resolveVisitorLocalizationState(languageCode).usesEnglishFallback;
}

export function resolveInteractionLanguageSourceLocale(languageCode: string | null | undefined): string | null {
  return resolveRegistryInteractionLanguageSourceLocale(languageCode);
}

export function buildVisitorLanguageChoices(): VisitorLanguageChoice[] {
  return buildRegistryInteractionLanguageChoices().map(({ value, label, nativeLabel, regionCode }) => ({
    value,
    label,
    nativeLabel,
    regionCode
  }));
}

export function getVisitorUiText(languageCode: string | null | undefined): VisitorUiText {
  const key = normalizeLanguageKey(languageCode);
  const rawText = VISITOR_UI_TEXT[key] ?? VISITOR_UI_TEXT.en;
  
  return {
    ...rawText,
    sessionTurns: (count: number) => rawText.sessionTurns.replace("{count}", String(count))
  };
}

export function getVisitorStatusLabels(
  languageCode: string | null | undefined
): Record<OperatorStatus, string> {
  const key = normalizeLanguageKey(languageCode);
  return VISITOR_STATUS_LABELS[key] ?? VISITOR_STATUS_LABELS.en;
}
