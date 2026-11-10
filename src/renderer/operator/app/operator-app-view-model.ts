import { findSourceLanguageOption } from "../../../shared/language-options.js";
import {
  getInteractionLanguageLabel
} from "../../../shared/language-registry.js";
import { getVisitorEffectiveLanguageKey } from "../../../shared/visitor-localization.js";
import type { Side } from "../../../shared/types.js";

const RTL_LANGUAGE_CODES = new Set(["ar", "fa", "he", "prs", "ps", "ur", "yi"]);

export function resolveSideFromLocation(search: string): Side {
  const side = new URLSearchParams(search).get("side");
  return side === "B" ? "B" : "A";
}

export function getInteractionLanguageFallbackLabel(languageCode: string | null): string {
  return getInteractionLanguageLabel(languageCode);
}

export function getSourceLanguageLabel(languageCode: string | null): string {
  if (!languageCode) {
    return "-";
  }

  return findSourceLanguageOption(languageCode)?.label ?? languageCode;
}

export function getLocalizedRoleLabels(language: string): { A: string; B: string } {
  switch (language) {
    case "it":
      return { A: "Operatore", B: "Utente" };
    case "es":
      return { A: "Operador", B: "Usuario" };
    case "fr":
      return { A: "Operateur", B: "Utilisateur" };
    case "de":
      return { A: "Operator", B: "Benutzer" };
    case "zh":
      return { A: "操作员", B: "用户" };
    default:
      return { A: "Operator", B: "User" };
  }
}

export function normalizeDocumentLanguage(language: string | null | undefined): string {
  return getVisitorEffectiveLanguageKey(language);
}

export function resolveDocumentDirection(language: string): "ltr" | "rtl" {
  return RTL_LANGUAGE_CODES.has(normalizeDocumentLanguage(language).split("-")[0] ?? "") ? "rtl" : "ltr";
}
