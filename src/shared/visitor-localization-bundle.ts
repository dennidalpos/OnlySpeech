import {
  getVisitorCurrentLanguageLabel,
  getVisitorEffectiveLanguageKey,
  getVisitorStatusLabels,
  getVisitorUiText,
  getVisitorRequestedLanguageKey,
  isVisitorLocalizationReady,
  usesVisitorEnglishFallback
} from "./visitor-localization.js";
import {
  getVisitorTechnicalErrorText,
  localizeVisitorTechnicalIssue
} from "./visitor-technical-localization.js";
import type { TechnicalIssue } from "./types.js";

export interface VisitorLocalizationBundle {
  currentLanguageLabel: string;
  effectiveLanguageKey: string;
  hasDedicatedLocalization: boolean;
  requestedLanguageKey: string;
  statusLabels: ReturnType<typeof getVisitorStatusLabels>;
  technicalText: ReturnType<typeof getVisitorTechnicalErrorText>;
  uiText: ReturnType<typeof getVisitorUiText>;
  usesEnglishFallback: boolean;
}

export function getVisitorLocalizationBundle(languageCode: string | null | undefined): VisitorLocalizationBundle {
  return {
    currentLanguageLabel: getVisitorCurrentLanguageLabel(languageCode),
    effectiveLanguageKey: getVisitorEffectiveLanguageKey(languageCode),
    hasDedicatedLocalization: isVisitorLocalizationReady(languageCode),
    requestedLanguageKey: getVisitorRequestedLanguageKey(languageCode),
    statusLabels: getVisitorStatusLabels(languageCode),
    technicalText: getVisitorTechnicalErrorText(languageCode),
    uiText: getVisitorUiText(languageCode),
    usesEnglishFallback: usesVisitorEnglishFallback(languageCode)
  };
}

export function localizeVisitorTechnicalIssues(
  issues: TechnicalIssue[],
  languageCode: string | null | undefined
): TechnicalIssue[] {
  return issues.map((issue) => localizeVisitorTechnicalIssue(issue, languageCode));
}
