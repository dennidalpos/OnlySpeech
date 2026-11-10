export type VisitorTechnicalLocalizationMode =
  | "dedicated"
  | "english-fallback"
  | "shared-zh";

export interface VisitorLanguagePolicy {
  technicalLocalization: VisitorTechnicalLocalizationMode;
}

// Reviewed target state: languages without dedicated technical copy fall back to explicit
// English until customer-driven copy is added and verified in this repository.
export const VISITOR_LANGUAGE_POLICY_BY_KEY: Readonly<Record<string, VisitorLanguagePolicy>> = Object.freeze({
  af: { technicalLocalization: "dedicated" },
  am: { technicalLocalization: "dedicated" },
  ar: { technicalLocalization: "dedicated" },
  az: { technicalLocalization: "english-fallback" },
  be: { technicalLocalization: "dedicated" },
  bg: { technicalLocalization: "dedicated" },
  bn: { technicalLocalization: "dedicated" },
  bs: { technicalLocalization: "english-fallback" },
  ca: { technicalLocalization: "english-fallback" },
  cs: { technicalLocalization: "english-fallback" },
  cy: { technicalLocalization: "english-fallback" },
  da: { technicalLocalization: "english-fallback" },
  de: { technicalLocalization: "dedicated" },
  el: { technicalLocalization: "dedicated" },
  en: { technicalLocalization: "dedicated" },
  es: { technicalLocalization: "dedicated" },
  et: { technicalLocalization: "english-fallback" },
  eu: { technicalLocalization: "english-fallback" },
  fa: { technicalLocalization: "dedicated" },
  fi: { technicalLocalization: "english-fallback" },
  fil: { technicalLocalization: "english-fallback" },
  fr: { technicalLocalization: "dedicated" },
  ga: { technicalLocalization: "english-fallback" },
  gl: { technicalLocalization: "english-fallback" },
  he: { technicalLocalization: "dedicated" },
  hi: { technicalLocalization: "dedicated" },
  hr: { technicalLocalization: "english-fallback" },
  hu: { technicalLocalization: "english-fallback" },
  hy: { technicalLocalization: "english-fallback" },
  id: { technicalLocalization: "dedicated" },
  is: { technicalLocalization: "english-fallback" },
  it: { technicalLocalization: "dedicated" },
  ja: { technicalLocalization: "dedicated" },
  ka: { technicalLocalization: "english-fallback" },
  kk: { technicalLocalization: "english-fallback" },
  kn: { technicalLocalization: "english-fallback" },
  ko: { technicalLocalization: "dedicated" },
  lt: { technicalLocalization: "english-fallback" },
  lv: { technicalLocalization: "english-fallback" },
  mi: { technicalLocalization: "dedicated" },
  mk: { technicalLocalization: "english-fallback" },
  mn: { technicalLocalization: "english-fallback" },
  mr: { technicalLocalization: "english-fallback" },
  ms: { technicalLocalization: "dedicated" },
  mt: { technicalLocalization: "english-fallback" },
  nb: { technicalLocalization: "english-fallback" },
  ne: { technicalLocalization: "english-fallback" },
  nl: { technicalLocalization: "dedicated" },
  pl: { technicalLocalization: "dedicated" },
  ps: { technicalLocalization: "dedicated" },
  pt: { technicalLocalization: "dedicated" },
  ro: { technicalLocalization: "dedicated" },
  ru: { technicalLocalization: "dedicated" },
  si: { technicalLocalization: "english-fallback" },
  sk: { technicalLocalization: "english-fallback" },
  sl: { technicalLocalization: "english-fallback" },
  so: { technicalLocalization: "english-fallback" },
  sq: { technicalLocalization: "dedicated" },
  "sr-Cyrl": { technicalLocalization: "english-fallback" },
  "sr-Latn": { technicalLocalization: "english-fallback" },
  sv: { technicalLocalization: "english-fallback" },
  sw: { technicalLocalization: "dedicated" },
  ta: { technicalLocalization: "dedicated" },
  te: { technicalLocalization: "dedicated" },
  th: { technicalLocalization: "dedicated" },
  tr: { technicalLocalization: "dedicated" },
  uk: { technicalLocalization: "dedicated" },
  ur: { technicalLocalization: "dedicated" },
  uz: { technicalLocalization: "english-fallback" },
  vi: { technicalLocalization: "dedicated" },
  yue: { technicalLocalization: "shared-zh" },
  zh: { technicalLocalization: "dedicated" },
  "zh-Hant": { technicalLocalization: "shared-zh" }
});

export const VISITOR_LOCALIZATION_LANGUAGE_KEYS = Object.freeze(
  Object.keys(VISITOR_LANGUAGE_POLICY_BY_KEY)
) satisfies readonly string[];

function getLanguageKeysByTechnicalLocalizationMode(
  technicalLocalization: VisitorTechnicalLocalizationMode
): readonly string[] {
  return Object.freeze(
    Object.entries(VISITOR_LANGUAGE_POLICY_BY_KEY)
      .filter(([, policy]) => policy.technicalLocalization === technicalLocalization)
      .map(([languageKey]) => languageKey)
  );
}

export const VISITOR_TECHNICAL_LOCALIZATION_REVIEW = Object.freeze({
  dedicated: getLanguageKeysByTechnicalLocalizationMode("dedicated"),
  englishFallback: getLanguageKeysByTechnicalLocalizationMode("english-fallback"),
  sharedZh: getLanguageKeysByTechnicalLocalizationMode("shared-zh")
}) satisfies Readonly<{
  dedicated: readonly string[];
  englishFallback: readonly string[];
  sharedZh: readonly string[];
}>;

export function getVisitorLanguagePolicy(
  languageKey: string | null | undefined
): VisitorLanguagePolicy | null {
  if (!languageKey) {
    return null;
  }

  return VISITOR_LANGUAGE_POLICY_BY_KEY[languageKey] ?? null;
}
