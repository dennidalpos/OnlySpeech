import type { LanguageOption } from "./types.js";
import {
  AUTO_DETECT_SOURCE_LANGUAGE_CANDIDATES,
  SUPPORTED_SOURCE_LANGUAGE_OPTIONS,
  SUPPORTED_TARGET_LANGUAGE_OPTIONS,
  type SourceLanguageOption
} from "./provider-language-policy.js";
import { CANONICAL_INTERACTION_LANGUAGES } from "./language-registry-data.js";

export type { SourceLanguageOption } from "./provider-language-policy.js";

const ITALIAN_REGION_DISPLAY_NAMES = new Intl.DisplayNames(["it"], {
  type: "region"
});

export const AUTO_SOURCE_LANGUAGE_VALUE = "auto";

export const AUTO_SOURCE_LANGUAGE_OPTION: SourceLanguageOption = {
  value: AUTO_SOURCE_LANGUAGE_VALUE,
  locale: AUTO_SOURCE_LANGUAGE_VALUE,
  label: "Automatico (rileva al primo PTT)"
};

const PREFERRED_SOURCE_LOCALE_BY_LANGUAGE_CODE = Object.freeze(
  Object.fromEntries(
    CANONICAL_INTERACTION_LANGUAGES.map((entry) => [entry.code.toLowerCase(), entry.preferredSourceLocale])
  )
) as Record<string, string>;

const SOURCE_LANGUAGE_VALUE_ALIASES = new Map<string, string>();

for (const entry of CANONICAL_INTERACTION_LANGUAGES) {
  SOURCE_LANGUAGE_VALUE_ALIASES.set(entry.code.toLowerCase(), entry.preferredSourceLocale);
  SOURCE_LANGUAGE_VALUE_ALIASES.set(entry.preferredSourceLocale.toLowerCase(), entry.preferredSourceLocale);
  SOURCE_LANGUAGE_VALUE_ALIASES.set(entry.displayLocale.toLowerCase(), entry.preferredSourceLocale);
}

export const DEFAULT_INTERACTION_LANGUAGE_CODES = CANONICAL_INTERACTION_LANGUAGES.map((entry) =>
  entry.tier === "baseline" ? entry.code : null
).filter((entry): entry is string => entry !== null);

export { AUTO_DETECT_SOURCE_LANGUAGE_CANDIDATES, SUPPORTED_SOURCE_LANGUAGE_OPTIONS, SUPPORTED_TARGET_LANGUAGE_OPTIONS };

function resolveDerivedSourceLanguageOption(value: string): SourceLanguageOption | null {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }

  const lowerValue = normalizedValue.toLowerCase();
  const baseFamily = lowerValue.startsWith("zh-")
    ? "zh"
    : lowerValue.startsWith("sr-")
      ? "sr"
      : lowerValue.split("-")[0] ?? lowerValue;

  const canonicalEntry =
    CANONICAL_INTERACTION_LANGUAGES.find(
      (entry) =>
        entry.code.toLowerCase() === lowerValue ||
        entry.preferredSourceLocale.toLowerCase() === lowerValue ||
        entry.displayLocale.toLowerCase() === lowerValue
    ) ??
    CANONICAL_INTERACTION_LANGUAGES.find((entry) => entry.code.toLowerCase() === baseFamily);

  if (!canonicalEntry) {
    return null;
  }

  const regionCode = normalizedValue.match(/-([A-Z]{2})(?:$|-)/)?.[1] ?? null;
  const regionLabel = regionCode ? ITALIAN_REGION_DISPLAY_NAMES.of(regionCode) : null;
  const resolvedLocale =
    lowerValue === canonicalEntry.code.toLowerCase() || !normalizedValue.includes("-")
      ? canonicalEntry.preferredSourceLocale
      : normalizedValue;

  return {
    value: resolvedLocale,
    locale: resolvedLocale,
    label: regionLabel && !canonicalEntry.label.includes("(")
      ? `${canonicalEntry.label} (${regionLabel})`
      : canonicalEntry.label
  };
}

export function findSourceLanguageOption(value: string | null | undefined): SourceLanguageOption | null {
  if (!value) {
    return null;
  }

  if (value === AUTO_SOURCE_LANGUAGE_VALUE) {
    return AUTO_SOURCE_LANGUAGE_OPTION;
  }

  const normalizedValue = value.trim().toLowerCase();
  const aliasedValue = SOURCE_LANGUAGE_VALUE_ALIASES.get(normalizedValue);
  const lookupValue = aliasedValue ?? value;

  return SUPPORTED_SOURCE_LANGUAGE_OPTIONS.find((option) => option.value === lookupValue) ?? resolveDerivedSourceLanguageOption(lookupValue);
}

export function resolveDetectedSourceLanguageOption(value: string | null | undefined): SourceLanguageOption | null {
  if (!value) {
    return null;
  }

  const exactMatch = findSourceLanguageOption(value);
  if (exactMatch) {
    return exactMatch;
  }

  const normalizedValue = value.trim().toLowerCase();
  const preferredSourceLocale = PREFERRED_SOURCE_LOCALE_BY_LANGUAGE_CODE[normalizedValue];
  if (preferredSourceLocale) {
    return findSourceLanguageOption(preferredSourceLocale);
  }

  return (
    SUPPORTED_SOURCE_LANGUAGE_OPTIONS.find((option) => option.value.split("-")[0].toLowerCase() === normalizedValue) ??
    null
  );
}

export function findTargetLanguageOption(value: string | null | undefined): LanguageOption | null {
  if (!value) {
    return null;
  }

  return SUPPORTED_TARGET_LANGUAGE_OPTIONS.find((option) => option.value === value) ?? null;
}
