import type {
  TranslationProvider,
  TranslationProviderLanguageCapabilities
} from "./types.js";

export type LanguageMacroArea =
  | "europe"
  | "americas"
  | "oceania"
  | "africa"
  | "asia";

export type InteractionLanguageTier = "baseline" | "provider-expansion";

type SeedProvider = Exclude<TranslationProvider, "ollama">;

interface SeedProviderDefinition {
  enabled: boolean;
  targetCode: string | null;
  speechToText?: boolean;
  translationTarget?: boolean;
  preferredSourceLocale?: string | null;
}

export interface CanonicalInteractionLanguageDefinition {
  code: string;
  label: string;
  tier: InteractionLanguageTier;
  macroArea: LanguageMacroArea;
  displayLocale: string;
  preferredSourceLocale: string;
  providers: Record<SeedProvider, SeedProviderDefinition>;
}

interface CanonicalInteractionLanguageSeed
  extends Omit<CanonicalInteractionLanguageDefinition, "tier"> {}

export interface ProviderTargetOnlyLanguageDefinition {
  code: string;
  label: string;
  macroAreas: readonly LanguageMacroArea[];
  displayLocale: string | null;
  flagRegionCode: string | null;
  providers: Record<SeedProvider, TranslationProviderLanguageCapabilities>;
}

export const CANONICAL_INTERACTION_LANGUAGE_BASELINE_COUNT = 53;

const CANONICAL_INTERACTION_LANGUAGE_SEEDS = Object.freeze([
  {
    code: "it",
    label: "Italiano",
    macroArea: "europe",
    displayLocale: "it-IT",
    preferredSourceLocale: "it-IT",
    providers: {
      azure: { enabled: true, targetCode: "it" },
      chatgpt: { enabled: true, targetCode: "it" }
    }
  },
  {
    code: "en",
    label: "Inglese",
    macroArea: "europe",
    displayLocale: "en-GB",
    preferredSourceLocale: "en-GB",
    providers: {
      azure: { enabled: true, targetCode: "en" },
      chatgpt: { enabled: true, targetCode: "en" }
    }
  },
  {
    code: "fr",
    label: "Francese",
    macroArea: "europe",
    displayLocale: "fr-FR",
    preferredSourceLocale: "fr-FR",
    providers: {
      azure: { enabled: true, targetCode: "fr" },
      chatgpt: { enabled: true, targetCode: "fr" }
    }
  },
  {
    code: "de",
    label: "Tedesco",
    macroArea: "europe",
    displayLocale: "de-DE",
    preferredSourceLocale: "de-DE",
    providers: {
      azure: { enabled: true, targetCode: "de" },
      chatgpt: { enabled: true, targetCode: "de" }
    }
  },
  {
    code: "es",
    label: "Spagnolo",
    macroArea: "americas",
    displayLocale: "es-MX",
    preferredSourceLocale: "es-MX",
    providers: {
      azure: { enabled: true, targetCode: "es" },
      chatgpt: { enabled: true, targetCode: "es" }
    }
  },
  {
    code: "pt",
    label: "Portoghese",
    macroArea: "americas",
    displayLocale: "pt-BR",
    preferredSourceLocale: "pt-BR",
    providers: {
      azure: { enabled: true, targetCode: "pt" },
      chatgpt: { enabled: true, targetCode: "pt" }
    }
  },
  {
    code: "nl",
    label: "Olandese",
    macroArea: "europe",
    displayLocale: "nl-NL",
    preferredSourceLocale: "nl-NL",
    providers: {
      azure: { enabled: true, targetCode: "nl" },
      chatgpt: { enabled: true, targetCode: "nl" }
    }
  },
  {
    code: "pl",
    label: "Polacco",
    macroArea: "europe",
    displayLocale: "pl-PL",
    preferredSourceLocale: "pl-PL",
    providers: {
      azure: { enabled: true, targetCode: "pl" },
      chatgpt: { enabled: true, targetCode: "pl" }
    }
  },
  {
    code: "ro",
    label: "Rumeno",
    macroArea: "europe",
    displayLocale: "ro-RO",
    preferredSourceLocale: "ro-RO",
    providers: {
      azure: { enabled: true, targetCode: "ro" },
      chatgpt: { enabled: true, targetCode: "ro" }
    }
  },
  {
    code: "ru",
    label: "Russo",
    macroArea: "europe",
    displayLocale: "ru-RU",
    preferredSourceLocale: "ru-RU",
    providers: {
      azure: { enabled: true, targetCode: "ru" },
      chatgpt: { enabled: true, targetCode: "ru" }
    }
  },
  {
    code: "uk",
    label: "Ucraino",
    macroArea: "europe",
    displayLocale: "uk-UA",
    preferredSourceLocale: "uk-UA",
    providers: {
      azure: { enabled: true, targetCode: "uk" },
      chatgpt: { enabled: true, targetCode: "uk" }
    }
  },
  {
    code: "af",
    label: "Afrikaans",
    macroArea: "africa",
    displayLocale: "af-ZA",
    preferredSourceLocale: "af-ZA",
    providers: {
      azure: { enabled: true, targetCode: "af" },
      chatgpt: { enabled: true, targetCode: "af" }
    }
  },
  {
    code: "am",
    label: "Amarico",
    macroArea: "africa",
    displayLocale: "am-ET",
    preferredSourceLocale: "am-ET",
    providers: {
      azure: { enabled: true, targetCode: "am" },
      chatgpt: { enabled: true, targetCode: "am" }
    }
  },
  {
    code: "sw",
    label: "Swahili",
    macroArea: "africa",
    displayLocale: "sw-KE",
    preferredSourceLocale: "sw-KE",
    providers: {
      azure: { enabled: true, targetCode: "sw" },
      chatgpt: { enabled: true, targetCode: "sw" }
    }
  },
  {
    code: "ar",
    label: "Arabo",
    macroArea: "asia",
    displayLocale: "ar-SA",
    preferredSourceLocale: "ar-SA",
    providers: {
      azure: { enabled: true, targetCode: "ar" },
      chatgpt: { enabled: true, targetCode: "ar" }
    }
  },
  {
    code: "he",
    label: "Ebraico",
    macroArea: "asia",
    displayLocale: "he-IL",
    preferredSourceLocale: "he-IL",
    providers: {
      azure: { enabled: true, targetCode: "he" },
      chatgpt: { enabled: true, targetCode: "he" }
    }
  },
  {
    code: "fa",
    label: "Persiano",
    macroArea: "asia",
    displayLocale: "fa-IR",
    preferredSourceLocale: "fa-IR",
    providers: {
      azure: { enabled: true, targetCode: "fa" },
      chatgpt: { enabled: true, targetCode: "fa" }
    }
  },
  {
    code: "ur",
    label: "Urdu",
    macroArea: "asia",
    displayLocale: "ur-PK",
    preferredSourceLocale: "ur-IN",
    providers: {
      azure: { enabled: true, targetCode: "ur" },
      chatgpt: { enabled: true, targetCode: "ur" }
    }
  },
  {
    code: "tr",
    label: "Turco",
    macroArea: "asia",
    displayLocale: "tr-TR",
    preferredSourceLocale: "tr-TR",
    providers: {
      azure: { enabled: true, targetCode: "tr" },
      chatgpt: { enabled: true, targetCode: "tr" }
    }
  },
  {
    code: "ps",
    label: "Pashto",
    macroArea: "asia",
    displayLocale: "ps-AF",
    preferredSourceLocale: "ps-AF",
    providers: {
      azure: { enabled: true, targetCode: "ps" },
      chatgpt: { enabled: true, targetCode: "ps" }
    }
  },
  {
    code: "hi",
    label: "Hindi",
    macroArea: "asia",
    displayLocale: "hi-IN",
    preferredSourceLocale: "hi-IN",
    providers: {
      azure: { enabled: true, targetCode: "hi" },
      chatgpt: { enabled: true, targetCode: "hi" }
    }
  },
  {
    code: "bn",
    label: "Bangla",
    macroArea: "asia",
    displayLocale: "bn-BD",
    preferredSourceLocale: "bn-IN",
    providers: {
      azure: { enabled: true, targetCode: "bn" },
      chatgpt: { enabled: true, targetCode: "bn" }
    }
  },
  {
    code: "ta",
    label: "Tamil",
    macroArea: "asia",
    displayLocale: "ta-IN",
    preferredSourceLocale: "ta-IN",
    providers: {
      azure: { enabled: true, targetCode: "ta" },
      chatgpt: { enabled: true, targetCode: "ta" }
    }
  },
  {
    code: "te",
    label: "Telugu",
    macroArea: "asia",
    displayLocale: "te-IN",
    preferredSourceLocale: "te-IN",
    providers: {
      azure: { enabled: true, targetCode: "te" },
      chatgpt: { enabled: true, targetCode: "te" }
    }
  },
  {
    code: "th",
    label: "Thai",
    macroArea: "asia",
    displayLocale: "th-TH",
    preferredSourceLocale: "th-TH",
    providers: {
      azure: { enabled: true, targetCode: "th" },
      chatgpt: { enabled: true, targetCode: "th" }
    }
  },
  {
    code: "vi",
    label: "Vietnamita",
    macroArea: "asia",
    displayLocale: "vi-VN",
    preferredSourceLocale: "vi-VN",
    providers: {
      azure: { enabled: true, targetCode: "vi" },
      chatgpt: { enabled: true, targetCode: "vi" }
    }
  },
  {
    code: "ms",
    label: "Malese",
    macroArea: "asia",
    displayLocale: "ms-MY",
    preferredSourceLocale: "ms-MY",
    providers: {
      azure: { enabled: true, targetCode: "ms" },
      chatgpt: { enabled: true, targetCode: "ms" }
    }
  },
  {
    code: "id",
    label: "Indonesiano",
    macroArea: "asia",
    displayLocale: "id-ID",
    preferredSourceLocale: "id-ID",
    providers: {
      azure: { enabled: true, targetCode: "id" },
      chatgpt: { enabled: true, targetCode: "id" }
    }
  },
  {
    code: "zh-Hans",
    label: "Cinese semplificato",
    macroArea: "asia",
    displayLocale: "zh-CN",
    preferredSourceLocale: "zh-CN",
    providers: {
      azure: { enabled: true, targetCode: "zh-Hans" },
      chatgpt: { enabled: true, targetCode: "zh-Hans" }
    }
  },
  {
    code: "zh-Hant",
    label: "Cinese tradizionale",
    macroArea: "asia",
    displayLocale: "zh-TW",
    preferredSourceLocale: "zh-TW",
    providers: {
      azure: { enabled: true, targetCode: "zh-Hant" },
      chatgpt: { enabled: true, targetCode: "zh-Hant" }
    }
  },
  {
    code: "yue",
    label: "Cantonese",
    macroArea: "asia",
    displayLocale: "zh-HK",
    preferredSourceLocale: "yue-CN",
    providers: {
      azure: { enabled: true, targetCode: "yue" },
      chatgpt: { enabled: true, targetCode: "yue" }
    }
  },
  {
    code: "ja",
    label: "Giapponese",
    macroArea: "asia",
    displayLocale: "ja-JP",
    preferredSourceLocale: "ja-JP",
    providers: {
      azure: { enabled: true, targetCode: "ja" },
      chatgpt: { enabled: true, targetCode: "ja" }
    }
  },
  {
    code: "ko",
    label: "Coreano",
    macroArea: "asia",
    displayLocale: "ko-KR",
    preferredSourceLocale: "ko-KR",
    providers: {
      azure: { enabled: true, targetCode: "ko" },
      chatgpt: { enabled: true, targetCode: "ko" }
    }
  },
  {
    code: "sq",
    label: "Albanese",
    macroArea: "europe",
    displayLocale: "sq-AL",
    preferredSourceLocale: "sq-AL",
    providers: {
      azure: { enabled: true, targetCode: "sq" },
      chatgpt: { enabled: true, targetCode: "sq" }
    }
  },
  {
    code: "bs",
    label: "Bosniaco (latino)",
    macroArea: "europe",
    displayLocale: "bs-BA",
    preferredSourceLocale: "bs-BA",
    providers: {
      azure: { enabled: true, targetCode: "bs" },
      chatgpt: { enabled: true, targetCode: "bs" }
    }
  },
  {
    code: "bg",
    label: "Bulgaro",
    macroArea: "europe",
    displayLocale: "bg-BG",
    preferredSourceLocale: "bg-BG",
    providers: {
      azure: { enabled: true, targetCode: "bg" },
      chatgpt: { enabled: true, targetCode: "bg" }
    }
  },
  {
    code: "ca",
    label: "Catalano",
    macroArea: "europe",
    displayLocale: "ca-ES",
    preferredSourceLocale: "ca-ES",
    providers: {
      azure: { enabled: true, targetCode: "ca" },
      chatgpt: { enabled: true, targetCode: "ca" }
    }
  },
  {
    code: "cs",
    label: "Ceco",
    macroArea: "europe",
    displayLocale: "cs-CZ",
    preferredSourceLocale: "cs-CZ",
    providers: {
      azure: { enabled: true, targetCode: "cs" },
      chatgpt: { enabled: true, targetCode: "cs" }
    }
  },
  {
    code: "hr",
    label: "Croato",
    macroArea: "europe",
    displayLocale: "hr-HR",
    preferredSourceLocale: "hr-HR",
    providers: {
      azure: { enabled: true, targetCode: "hr" },
      chatgpt: { enabled: true, targetCode: "hr" }
    }
  },
  {
    code: "da",
    label: "Danese",
    macroArea: "europe",
    displayLocale: "da-DK",
    preferredSourceLocale: "da-DK",
    providers: {
      azure: { enabled: true, targetCode: "da" },
      chatgpt: { enabled: true, targetCode: "da" }
    }
  },
  {
    code: "et",
    label: "Estone",
    macroArea: "europe",
    displayLocale: "et-EE",
    preferredSourceLocale: "et-EE",
    providers: {
      azure: { enabled: true, targetCode: "et" },
      chatgpt: { enabled: true, targetCode: "et" }
    }
  },
  {
    code: "fi",
    label: "Finlandese",
    macroArea: "europe",
    displayLocale: "fi-FI",
    preferredSourceLocale: "fi-FI",
    providers: {
      azure: { enabled: true, targetCode: "fi" },
      chatgpt: { enabled: true, targetCode: "fi" }
    }
  },
  {
    code: "cy",
    label: "Gallese",
    macroArea: "europe",
    displayLocale: "cy-GB",
    preferredSourceLocale: "cy-GB",
    providers: {
      azure: { enabled: true, targetCode: "cy" },
      chatgpt: { enabled: true, targetCode: "cy" }
    }
  },
  {
    code: "el",
    label: "Greco",
    macroArea: "europe",
    displayLocale: "el-GR",
    preferredSourceLocale: "el-GR",
    providers: {
      azure: { enabled: true, targetCode: "el" },
      chatgpt: { enabled: true, targetCode: "el" }
    }
  },
  {
    code: "ga",
    label: "Irlandese",
    macroArea: "europe",
    displayLocale: "ga-IE",
    preferredSourceLocale: "ga-IE",
    providers: {
      azure: { enabled: true, targetCode: "ga" },
      chatgpt: { enabled: true, targetCode: "ga" }
    }
  },
  {
    code: "is",
    label: "Islandese",
    macroArea: "europe",
    displayLocale: "is-IS",
    preferredSourceLocale: "is-IS",
    providers: {
      azure: { enabled: true, targetCode: "is" },
      chatgpt: { enabled: true, targetCode: "is" }
    }
  },
  {
    code: "lv",
    label: "Lettone",
    macroArea: "europe",
    displayLocale: "lv-LV",
    preferredSourceLocale: "lv-LV",
    providers: {
      azure: { enabled: true, targetCode: "lv" },
      chatgpt: { enabled: true, targetCode: "lv" }
    }
  },
  {
    code: "lt",
    label: "Lituano",
    macroArea: "europe",
    displayLocale: "lt-LT",
    preferredSourceLocale: "lt-LT",
    providers: {
      azure: { enabled: true, targetCode: "lt" },
      chatgpt: { enabled: true, targetCode: "lt" }
    }
  },
  {
    code: "mt",
    label: "Maltese",
    macroArea: "europe",
    displayLocale: "mt-MT",
    preferredSourceLocale: "mt-MT",
    providers: {
      azure: { enabled: true, targetCode: "mt" },
      chatgpt: { enabled: true, targetCode: "mt" }
    }
  },
  {
    code: "nb",
    label: "Norvegese",
    macroArea: "europe",
    displayLocale: "nb-NO",
    preferredSourceLocale: "nb-NO",
    providers: {
      azure: { enabled: true, targetCode: "nb" },
      chatgpt: { enabled: true, targetCode: "nb" }
    }
  },
  {
    code: "sr-Cyrl",
    label: "Serbo (cirillico)",
    macroArea: "europe",
    displayLocale: "sr-RS",
    preferredSourceLocale: "sr-RS",
    providers: {
      azure: { enabled: true, targetCode: "sr-Cyrl" },
      chatgpt: { enabled: true, targetCode: "sr-Cyrl" }
    }
  },
  {
    code: "sr-Latn",
    label: "Serbo (latino)",
    macroArea: "europe",
    displayLocale: "sr-RS",
    preferredSourceLocale: "sr-RS",
    providers: {
      azure: { enabled: true, targetCode: "sr-Latn" },
      chatgpt: { enabled: true, targetCode: "sr-Latn" }
    }
  },
  {
    code: "sk",
    label: "Slovacco",
    macroArea: "europe",
    displayLocale: "sk-SK",
    preferredSourceLocale: "sk-SK",
    providers: {
      azure: { enabled: true, targetCode: "sk" },
      chatgpt: { enabled: true, targetCode: "sk" }
    }
  },
  {
    code: "sl",
    label: "Sloveno",
    macroArea: "europe",
    displayLocale: "sl-SI",
    preferredSourceLocale: "sl-SI",
    providers: {
      azure: { enabled: true, targetCode: "sl" },
      chatgpt: { enabled: true, targetCode: "sl" }
    }
  },
  {
    code: "sv",
    label: "Svedese",
    macroArea: "europe",
    displayLocale: "sv-SE",
    preferredSourceLocale: "sv-SE",
    providers: {
      azure: { enabled: true, targetCode: "sv" },
      chatgpt: { enabled: true, targetCode: "sv" }
    }
  },
  {
    code: "hu",
    label: "Ungherese",
    macroArea: "europe",
    displayLocale: "hu-HU",
    preferredSourceLocale: "hu-HU",
    providers: {
      azure: { enabled: true, targetCode: "hu" },
      chatgpt: { enabled: true, targetCode: "hu" }
    }
  },
  {
    code: "hy",
    label: "Armeno",
    macroArea: "asia",
    displayLocale: "hy-AM",
    preferredSourceLocale: "hy-AM",
    providers: {
      azure: { enabled: true, targetCode: "hy" },
      chatgpt: { enabled: true, targetCode: "hy" }
    }
  },
  {
    code: "as",
    label: "Assamese",
    macroArea: "asia",
    displayLocale: "as-IN",
    preferredSourceLocale: "as-IN",
    providers: {
      azure: { enabled: true, targetCode: "as" },
      chatgpt: { enabled: true, targetCode: "as" }
    }
  },
  {
    code: "az",
    label: "Azero",
    macroArea: "asia",
    displayLocale: "az-AZ",
    preferredSourceLocale: "az-AZ",
    providers: {
      azure: { enabled: true, targetCode: "az" },
      chatgpt: { enabled: true, targetCode: "az" }
    }
  },
  {
    code: "fil",
    label: "Filippino",
    macroArea: "asia",
    displayLocale: "fil-PH",
    preferredSourceLocale: "fil-PH",
    providers: {
      azure: { enabled: true, targetCode: "fil" },
      chatgpt: { enabled: true, targetCode: "fil" }
    }
  },
  {
    code: "gu",
    label: "Gujarati",
    macroArea: "asia",
    displayLocale: "gu-IN",
    preferredSourceLocale: "gu-IN",
    providers: {
      azure: { enabled: true, targetCode: "gu" },
      chatgpt: { enabled: true, targetCode: "gu" }
    }
  },
  {
    code: "kn",
    label: "Kannada",
    macroArea: "asia",
    displayLocale: "kn-IN",
    preferredSourceLocale: "kn-IN",
    providers: {
      azure: { enabled: true, targetCode: "kn" },
      chatgpt: { enabled: true, targetCode: "kn" }
    }
  },
  {
    code: "kk",
    label: "Kazako",
    macroArea: "asia",
    displayLocale: "kk-KZ",
    preferredSourceLocale: "kk-KZ",
    providers: {
      azure: { enabled: true, targetCode: "kk" },
      chatgpt: { enabled: true, targetCode: "kk" }
    }
  },
  {
    code: "km",
    label: "Khmer",
    macroArea: "asia",
    displayLocale: "km-KH",
    preferredSourceLocale: "km-KH",
    providers: {
      azure: { enabled: true, targetCode: "km" },
      chatgpt: { enabled: true, targetCode: "km" }
    }
  },
  {
    code: "lo",
    label: "Lao",
    macroArea: "asia",
    displayLocale: "lo-LA",
    preferredSourceLocale: "lo-LA",
    providers: {
      azure: { enabled: true, targetCode: "lo" },
      chatgpt: { enabled: true, targetCode: "lo" }
    }
  },
  {
    code: "ml",
    label: "Malayalam",
    macroArea: "asia",
    displayLocale: "ml-IN",
    preferredSourceLocale: "ml-IN",
    providers: {
      azure: { enabled: true, targetCode: "ml" },
      chatgpt: { enabled: true, targetCode: "ml" }
    }
  },
  {
    code: "mr",
    label: "Marathi",
    macroArea: "asia",
    displayLocale: "mr-IN",
    preferredSourceLocale: "mr-IN",
    providers: {
      azure: { enabled: true, targetCode: "mr" },
      chatgpt: { enabled: true, targetCode: "mr" }
    }
  },
  {
    code: "my",
    label: "Myanmar",
    macroArea: "asia",
    displayLocale: "my-MM",
    preferredSourceLocale: "my-MM",
    providers: {
      azure: { enabled: true, targetCode: "my" },
      chatgpt: { enabled: true, targetCode: "my" }
    }
  },
  {
    code: "ne",
    label: "Nepalese",
    macroArea: "asia",
    displayLocale: "ne-NP",
    preferredSourceLocale: "ne-NP",
    providers: {
      azure: { enabled: true, targetCode: "ne" },
      chatgpt: { enabled: true, targetCode: "ne" }
    }
  },
  {
    code: "or",
    label: "Odia",
    macroArea: "asia",
    displayLocale: "or-IN",
    preferredSourceLocale: "or-IN",
    providers: {
      azure: { enabled: true, targetCode: "or" },
      chatgpt: { enabled: true, targetCode: "or" }
    }
  },
  {
    code: "pa",
    label: "Punjabi",
    macroArea: "asia",
    displayLocale: "pa-IN",
    preferredSourceLocale: "pa-IN",
    providers: {
      azure: { enabled: true, targetCode: "pa" },
      chatgpt: { enabled: true, targetCode: "pa" }
    }
  },
  {
    code: "eu",
    label: "Basco",
    macroArea: "europe",
    displayLocale: "eu-ES",
    preferredSourceLocale: "eu-ES",
    providers: {
      azure: { enabled: true, targetCode: "eu" },
      chatgpt: { enabled: true, targetCode: "eu" }
    }
  },
  {
    code: "gl",
    label: "Galiziano",
    macroArea: "europe",
    displayLocale: "gl-ES",
    preferredSourceLocale: "gl-ES",
    providers: {
      azure: { enabled: true, targetCode: "gl" },
      chatgpt: { enabled: true, targetCode: "gl" }
    }
  },
  {
    code: "ka",
    label: "Georgiano",
    macroArea: "asia",
    displayLocale: "ka-GE",
    preferredSourceLocale: "ka-GE",
    providers: {
      azure: { enabled: true, targetCode: "ka" },
      chatgpt: { enabled: true, targetCode: "ka" }
    }
  },
  {
    code: "mk",
    label: "Macedone",
    macroArea: "europe",
    displayLocale: "mk-MK",
    preferredSourceLocale: "mk-MK",
    providers: {
      azure: { enabled: true, targetCode: "mk" },
      chatgpt: { enabled: true, targetCode: "mk" }
    }
  },
  {
    code: "mn",
    label: "Mongolo",
    macroArea: "asia",
    displayLocale: "mn-MN",
    preferredSourceLocale: "mn-MN",
    providers: {
      azure: { enabled: true, targetCode: "mn" },
      chatgpt: { enabled: true, targetCode: "mn" }
    }
  },
  {
    code: "si",
    label: "Singalese",
    macroArea: "asia",
    displayLocale: "si-LK",
    preferredSourceLocale: "si-LK",
    providers: {
      azure: { enabled: true, targetCode: "si" },
      chatgpt: { enabled: true, targetCode: "si" }
    }
  },
  {
    code: "so",
    label: "Somalo",
    macroArea: "africa",
    displayLocale: "so-SO",
    preferredSourceLocale: "so-SO",
    providers: {
      azure: { enabled: true, targetCode: "so" },
      chatgpt: { enabled: true, targetCode: "so" }
    }
  },
  {
    code: "uz",
    label: "Uzbeko",
    macroArea: "asia",
    displayLocale: "uz-UZ",
    preferredSourceLocale: "uz-UZ",
    providers: {
      azure: { enabled: true, targetCode: "uz" },
      chatgpt: { enabled: true, targetCode: "uz" }
    }
  },
  {
    code: "be",
    label: "Bielorusso",
    macroArea: "europe",
    displayLocale: "be-BY",
    preferredSourceLocale: "be-BY",
    providers: {
      azure: { enabled: false, targetCode: null },
      chatgpt: { enabled: true, targetCode: "be" }
    }
  },
  {
    code: "mi",
    label: "Maori",
    macroArea: "oceania",
    displayLocale: "mi-NZ",
    preferredSourceLocale: "mi-NZ",
    providers: {
      azure: {
        enabled: false,
        speechToText: false,
        translationTarget: true,
        targetCode: "mi"
      },
      chatgpt: { enabled: true, targetCode: "mi" }
    }
  }
]) satisfies readonly CanonicalInteractionLanguageSeed[];

export const CANONICAL_INTERACTION_LANGUAGES: readonly CanonicalInteractionLanguageDefinition[] = Object.freeze(
  CANONICAL_INTERACTION_LANGUAGE_SEEDS.map((entry, index) =>
    Object.freeze({
      ...entry,
      tier: index < CANONICAL_INTERACTION_LANGUAGE_BASELINE_COUNT ? "baseline" : "provider-expansion"
    })
  )
);

export const INTERACTION_LANGUAGE_MACRO_AREA_MEMBERSHIPS = Object.freeze({
  en: ["europe", "oceania"]
}) satisfies Readonly<Record<string, readonly LanguageMacroArea[]>>;

export const INTERACTION_LANGUAGE_FLAG_REGION_CODES = Object.freeze({
  ar: "SA",
  az: "AZ",
  en: "GB",
  es: "MX",
  eu: "ES",
  fr: "FR",
  gl: "ES",
  hy: "AM",
  ka: "GE",
  kk: "KZ",
  mk: "MK",
  mn: "MN",
  pt: "BR",
  ru: "RU",
  si: "LK",
  so: "SO",
  "sr-Cyrl": "RS",
  "sr-Latn": "RS",
  tr: "TR",
  uz: "UZ",
  yue: "HK",
  "zh-Hans": "CN",
  "zh-Hant": "TW"
}) satisfies Readonly<Record<string, string>>;

export const CHATGPT_SPEECH_TO_TEXT_SUPPORTED_LANGUAGE_CODES = Object.freeze([
  "af",
  "ar",
  "az",
  "be",
  "bg",
  "bs",
  "ca",
  "cs",
  "cy",
  "da",
  "de",
  "el",
  "en",
  "es",
  "et",
  "eu",
  "fa",
  "fi",
  "fil",
  "fr",
  "gl",
  "he",
  "hi",
  "hr",
  "hu",
  "hy",
  "id",
  "is",
  "it",
  "ja",
  "ka",
  "kk",
  "kn",
  "ko",
  "lt",
  "lv",
  "mk",
  "mi",
  "mn",
  "mr",
  "ms",
  "nb",
  "ne",
  "nl",
  "pl",
  "pt",
  "ro",
  "ru",
  "sq",
  "si",
  "sk",
  "sl",
  "so",
  "sr-Cyrl",
  "sr-Latn",
  "sv",
  "sw",
  "ta",
  "th",
  "tr",
  "uk",
  "ur",
  "uz",
  "vi",
  "zh-Hans",
  "zh-Hant"
]) satisfies readonly string[];

export const CANONICAL_AZURE_TARGET_ONLY_LANGUAGES: readonly ProviderTargetOnlyLanguageDefinition[] = Object.freeze([
  {
    code: "fj",
    label: "Fijiano",
    macroAreas: ["oceania"],
    displayLocale: null,
    flagRegionCode: "FJ",
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "fj"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "ht",
    label: "Creolo haitiano",
    macroAreas: ["americas"],
    displayLocale: null,
    flagRegionCode: "HT",
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "ht"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "iu",
    label: "Inuktitut",
    macroAreas: ["americas"],
    displayLocale: null,
    flagRegionCode: "CA",
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "iu"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "ku",
    label: "Curdo (centrale)",
    macroAreas: ["asia"],
    displayLocale: null,
    flagRegionCode: "IQ",
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "ku"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "kmr",
    label: "Curdo (settentrionale)",
    macroAreas: ["asia"],
    displayLocale: null,
    flagRegionCode: "TR",
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "kmr"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "lzh",
    label: "Cinese letterario",
    macroAreas: ["asia"],
    displayLocale: null,
    flagRegionCode: "CN",
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "lzh"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "mg",
    label: "Malgascio",
    macroAreas: ["africa"],
    displayLocale: null,
    flagRegionCode: "MG",
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "mg"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "mww",
    label: "Hmong Daw",
    macroAreas: ["asia"],
    displayLocale: null,
    flagRegionCode: null,
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "mww"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "otq",
    label: "Otomi di Queretaro",
    macroAreas: ["americas"],
    displayLocale: null,
    flagRegionCode: "MX",
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "otq"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "prs",
    label: "Dari",
    macroAreas: ["asia"],
    displayLocale: null,
    flagRegionCode: "AF",
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "prs"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "sm",
    label: "Samoano",
    macroAreas: ["oceania"],
    displayLocale: null,
    flagRegionCode: "WS",
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "sm"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "ti",
    label: "Tigrino",
    macroAreas: ["africa"],
    displayLocale: null,
    flagRegionCode: "ET",
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "ti"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "tlh-Latn",
    label: "Klingon (latino)",
    macroAreas: [],
    displayLocale: null,
    flagRegionCode: null,
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "tlh-Latn"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "tlh-Piqd",
    label: "Klingon (plqaD)",
    macroAreas: [],
    displayLocale: null,
    flagRegionCode: null,
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "tlh-Piqd"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "to",
    label: "Tongano",
    macroAreas: ["oceania"],
    displayLocale: null,
    flagRegionCode: "TO",
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "to"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "ty",
    label: "Tahitiano",
    macroAreas: ["oceania"],
    displayLocale: null,
    flagRegionCode: "PF",
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "ty"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  },
  {
    code: "yua",
    label: "Maya yucateco",
    macroAreas: ["americas"],
    displayLocale: null,
    flagRegionCode: "MX",
    providers: {
      azure: {
        speechToText: false,
        translationTarget: true,
        preferredSourceLocale: null,
        targetCode: "yua"
      },
      chatgpt: {
        speechToText: false,
        translationTarget: false,
        preferredSourceLocale: null,
        targetCode: null
      }
    }
  }
]);

function resolveCanonicalProviderCapabilities(
  entry: CanonicalInteractionLanguageDefinition,
  provider: TranslationProvider
): TranslationProviderLanguageCapabilities {
  if (provider === "ollama") {
    return {
      speechToText: false,
      translationTarget: true,
      preferredSourceLocale: entry.preferredSourceLocale,
      targetCode: entry.code
    };
  }

  const providerConfig = entry.providers[provider];
  const speechToText = providerConfig.speechToText ?? providerConfig.enabled;
  const translationTarget = providerConfig.translationTarget ?? providerConfig.enabled;
  const enabledCapabilities: TranslationProviderLanguageCapabilities = {
    speechToText,
    translationTarget,
    preferredSourceLocale:
      providerConfig.preferredSourceLocale ?? (speechToText ? entry.preferredSourceLocale : null),
    targetCode: translationTarget ? providerConfig.targetCode : null
  };

  if (provider !== "chatgpt") {
    return enabledCapabilities;
  }

  const supportedByChatGpt = CHATGPT_SPEECH_TO_TEXT_SUPPORTED_LANGUAGE_CODES.includes(entry.code);
  return {
    speechToText: enabledCapabilities.speechToText && supportedByChatGpt,
    translationTarget: enabledCapabilities.translationTarget && supportedByChatGpt,
    preferredSourceLocale:
      enabledCapabilities.speechToText && supportedByChatGpt
        ? enabledCapabilities.preferredSourceLocale
        : null,
    targetCode: enabledCapabilities.translationTarget && supportedByChatGpt ? providerConfig.targetCode : null
  };
}

export const PROVIDER_INTERACTION_LANGUAGE_CATALOGS = Object.freeze({
  azure: Object.freeze(
    CANONICAL_INTERACTION_LANGUAGES.filter((entry) => {
      const capabilities = resolveCanonicalProviderCapabilities(entry, "azure");
      return capabilities.speechToText && capabilities.translationTarget;
    })
  ),
  chatgpt: Object.freeze(
    CANONICAL_INTERACTION_LANGUAGES.filter((entry) => {
      const capabilities = resolveCanonicalProviderCapabilities(entry, "chatgpt");
      return capabilities.speechToText && capabilities.translationTarget;
    })
  ),
  ollama: Object.freeze([] as CanonicalInteractionLanguageDefinition[])
}) satisfies Readonly<Record<TranslationProvider, readonly CanonicalInteractionLanguageDefinition[]>>;

export const PROVIDER_SPEECH_TO_TEXT_LANGUAGE_CODES = Object.freeze({
  azure: Object.freeze(PROVIDER_INTERACTION_LANGUAGE_CATALOGS.azure.map((entry) => entry.code)),
  chatgpt: Object.freeze(PROVIDER_INTERACTION_LANGUAGE_CATALOGS.chatgpt.map((entry) => entry.code)),
  ollama: Object.freeze([] as string[])
}) satisfies Readonly<Record<TranslationProvider, readonly string[]>>;

export const PROVIDER_TRANSLATION_TARGET_LANGUAGE_CODES = Object.freeze({
  azure: Object.freeze([
    ...CANONICAL_INTERACTION_LANGUAGES.filter(
      (entry) => resolveCanonicalProviderCapabilities(entry, "azure").translationTarget
    ).map((entry) => entry.code),
    ...CANONICAL_AZURE_TARGET_ONLY_LANGUAGES.filter(
      (entry) => entry.providers.azure.translationTarget && entry.providers.azure.targetCode
    ).map((entry) => entry.code)
  ]),
  chatgpt: Object.freeze(
    CANONICAL_INTERACTION_LANGUAGES.filter(
      (entry) => resolveCanonicalProviderCapabilities(entry, "chatgpt").translationTarget
    ).map((entry) => entry.code)
  ),
  ollama: Object.freeze(CANONICAL_INTERACTION_LANGUAGES.map((entry) => entry.code))
}) satisfies Readonly<Record<TranslationProvider, readonly string[]>>;

export const PROVIDER_LANGUAGE_CAPABILITIES_BY_CODE = Object.freeze({
  azure: Object.freeze(
    Object.fromEntries([
      ...CANONICAL_INTERACTION_LANGUAGES.map((entry) => [
        entry.code.toLowerCase(),
        resolveCanonicalProviderCapabilities(entry, "azure")
      ]),
      ...CANONICAL_AZURE_TARGET_ONLY_LANGUAGES.map((entry) => [entry.code.toLowerCase(), { ...entry.providers.azure }])
    ])
  ),
  chatgpt: Object.freeze(
    Object.fromEntries([
      ...CANONICAL_INTERACTION_LANGUAGES.map((entry) => [
        entry.code.toLowerCase(),
        resolveCanonicalProviderCapabilities(entry, "chatgpt")
      ]),
      ...CANONICAL_AZURE_TARGET_ONLY_LANGUAGES.map((entry) => [entry.code.toLowerCase(), { ...entry.providers.chatgpt }])
    ])
  ),
  ollama: Object.freeze(
    Object.fromEntries(
      CANONICAL_INTERACTION_LANGUAGES.map((entry) => [
        entry.code.toLowerCase(),
        resolveCanonicalProviderCapabilities(entry, "ollama")
      ])
    )
  )
}) satisfies Readonly<
  Record<TranslationProvider, Readonly<Record<string, TranslationProviderLanguageCapabilities>>>
>;
