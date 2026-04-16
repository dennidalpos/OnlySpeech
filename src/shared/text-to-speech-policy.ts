import { resolveInteractionLanguageSourceLocale } from "./language-registry.js";
import type {
  ProviderTextToSpeechPolicy,
  ResolveProviderTextToSpeechPolicyOptions,
  TranslationProvider
} from "./types.js";

export function resolveProviderTextToSpeechPolicy(
  provider: TranslationProvider,
  _language: string | null,
  options: ResolveProviderTextToSpeechPolicyOptions = {}
): ProviderTextToSpeechPolicy {
  if (provider === "chatgpt") {
    return {
      primaryEngine: "openai",
      fallbackEngine: null,
      blockOnMissing: true
    };
  }

  void options;

  // provider === "azure": runtime playback stays Azure-only. Save gating in the wizard
  // already blocks unsupported A/B selections, but the runtime must still refuse local
  // system fallback if configuration drifts or a stale setup reaches playback.
  return {
    primaryEngine: "azure",
    fallbackEngine: null,
    blockOnMissing: true
  };
}

const SPECIAL_LANGUAGE_CANDIDATES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "zh-hans": ["zh-Hans-CN", "cmn-Hans-CN", "cmn-CN", "cmn"],
  "zh-hant": ["zh-Hant-TW", "cmn-Hant-TW"],
  yue: ["yue-HK"]
});

const PRIMARY_LANGUAGE_SUBTAG_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  cmn: "zh",
  fil: "fil",
  he: "he",
  id: "id",
  in: "id",
  iw: "he",
  nb: "no",
  nn: "no",
  no: "no",
  tl: "fil",
  zh: "zh"
});

function normalizeLanguageKey(language: string): string {
  return language.trim().replace(/_/g, "-");
}

function normalizePrimaryLanguageSubtag(language: string): string {
  return PRIMARY_LANGUAGE_SUBTAG_ALIASES[language] ?? language;
}

function normalizeLanguageLookupKey(language: string): string {
  const [primarySubtag, ...rest] = normalizeLanguageKey(language).toLowerCase().split("-");
  if (!primarySubtag) {
    return "";
  }

  return [normalizePrimaryLanguageSubtag(primarySubtag), ...rest].join("-");
}

export interface TextToSpeechVoiceCandidate {
  id: string;
  name: string;
  locale: string;
}

export function resolveTextToSpeechLanguageCandidates(language: string | null | undefined): string[] {
  if (!language?.trim()) {
    return [];
  }

  const requestedLanguage = normalizeLanguageKey(language);
  const requestedLookupKey = normalizeLanguageLookupKey(requestedLanguage);
  const resolvedInteractionSourceLocale =
    resolveInteractionLanguageSourceLocale(requestedLanguage, undefined, {
      includeProviderExpansions: true
    }) ?? null;

  const candidates = new Set<string>();
  const addCandidate = (value: string | null | undefined) => {
    if (!value?.trim()) {
      return;
    }

    candidates.add(normalizeLanguageKey(value));
  };

  addCandidate(requestedLanguage);
  addCandidate(resolvedInteractionSourceLocale);

  for (const candidate of SPECIAL_LANGUAGE_CANDIDATES[requestedLookupKey] ?? []) {
    addCandidate(candidate);
  }

  if (resolvedInteractionSourceLocale) {
    for (const candidate of SPECIAL_LANGUAGE_CANDIDATES[normalizeLanguageLookupKey(resolvedInteractionSourceLocale)] ?? []) {
      addCandidate(candidate);
    }
  }

  return [...candidates];
}

export function normalizeTextToSpeechVoiceLocale(language: string | null | undefined): string {
  return normalizeLanguageLookupKey(language ?? "");
}

export function pickBestMatchingTextToSpeechVoice<T extends TextToSpeechVoiceCandidate>(
  voices: T[],
  language: string | null
): T | null {
  const exactCandidates = resolveTextToSpeechLanguageCandidates(language).map((candidate) =>
    normalizeTextToSpeechVoiceLocale(candidate)
  );

  const choosePreferredVoice = (candidates: T[]): T | null => {
    if (candidates.length === 0) {
      return null;
    }

    return [...candidates].sort((left, right) => left.name.localeCompare(right.name, "en"))[0] ?? null;
  };

  const exactVoice = choosePreferredVoice(
    voices.filter((voice) => exactCandidates.includes(normalizeTextToSpeechVoiceLocale(voice.locale)))
  );
  if (exactVoice) {
    return exactVoice;
  }

  return null;
}
