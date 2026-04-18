import { describe, expect, it } from "vitest";
import {
  buildCommonProviderInteractionLanguageChoices,
  buildCommonProviderInteractionLanguageSourceLocaleMap,
  buildInteractionLanguageChoices,
  buildInteractionLanguageOptionGroups,
  buildInteractionLanguageOptions,
  buildProviderSpeechSourceLanguageChoices,
  buildInteractionLanguageSourceLocaleMap,
  buildSourceLanguageChoices,
  resolveConfiguredSideLanguageState,
  resolveSelectedTargetLanguageState
} from "../src/shared/language-flow.js";
import {
  COMMON_PROVIDER_INTERACTION_LANGUAGE_COUNT,
  COMMON_PROVIDER_TRANSLATION_TARGET_LANGUAGE_COUNT,
  buildCommonProviderTranslationTargetOptionGroups,
  getCommonProviderTranslationTargetLanguageCodes,
  buildTranslationTargetOptionGroups,
  getProviderTargetOnlyLanguageCodes,
  resolveInteractionLanguageSourceLocale,
  resolveProviderTargetLanguageCode,
  getSupportedSpeechToTextLanguageCodes,
  getSupportedTranslationTargetLanguageCodes,
  normalizeInteractionLanguage
} from "../src/shared/language-registry.js";
import {
  AUTO_DETECT_SOURCE_LANGUAGE_CANDIDATES,
  resolveDetectedSourceLanguageOption
} from "../src/shared/language-options.js";

describe("language-flow", () => {
  it("exposes shared interaction language choices with a stable source locale", () => {
    const choices = buildInteractionLanguageChoices();
    expect(choices.find((choice) => choice.value === "it")).toMatchObject({
      nativeLabel: expect.any(String),
      regionCode: "IT",
      sourceLocale: "it-IT"
    });
    expect(choices.every((choice) => choice.regionIds.length > 0)).toBe(true);
    expect(choices.every((choice) => choice.regionIds.includes(choice.primaryRegionId))).toBe(true);
  });

  it("exposes the same centralized source-locale mapping used by the wizard", () => {
    const sourceLocaleMap = buildInteractionLanguageSourceLocaleMap();
    expect(sourceLocaleMap.it).toBe("it-IT");
    expect(sourceLocaleMap.en).toBe("en-US");
    expect(sourceLocaleMap["en-gb"]).toBe("en-GB");
    expect(sourceLocaleMap["en-us"]).toBe("en-US");
    expect(sourceLocaleMap.bn).toBe("bn-IN");
    expect(sourceLocaleMap.ur).toBe("ur-IN");
    expect(sourceLocaleMap.yue).toBe("yue-CN");
    expect(sourceLocaleMap.sl).toBeUndefined();
  });

  it("exposes the centralized source-language catalog without automatic mode", () => {
    const sourceChoices = buildSourceLanguageChoices(true);
    expect(sourceChoices[0]?.value).not.toBe("auto");
    expect(sourceChoices.some((choice) => choice.value === "it-IT")).toBe(true);
  });

  it("keeps the curated interaction language catalog grouped by macro area metadata", () => {
    const options = buildInteractionLanguageOptions();
    const choices = buildInteractionLanguageChoices();
    const groups = buildInteractionLanguageOptionGroups();

    expect(options[0]?.value).toBe("it");
    expect(groups.map((group) => group.macroArea)).toEqual(["europe", "americas", "oceania", "africa", "asia"]);
    expect(choices.find((choice) => choice.value === "es")).toMatchObject({
      macroArea: "americas",
      macroAreaLabel: "Americhe",
      macroAreas: ["americas"]
    });
    expect(choices.find((choice) => choice.value === "en-us")).toMatchObject({
      macroArea: "americas",
      regionCode: "US",
      sourceLocale: "en-US"
    });
    expect(choices.find((choice) => choice.value === "en-gb")).toMatchObject({
      macroArea: "europe",
      regionCode: "GB",
      sourceLocale: "en-GB"
    });
    expect(choices.find((choice) => choice.value === "en")).toMatchObject({
      macroArea: "americas",
      macroAreaLabel: "Americhe",
      macroAreas: ["americas", "oceania"]
    });
    expect(choices.find((choice) => choice.value === "sw")).toMatchObject({
      macroArea: "africa",
      macroAreaLabel: "Africa"
    });
    expect(choices.find((choice) => choice.value === "ar")).toMatchObject({
      macroArea: "asia",
      macroAreaLabel: "Asia",
      macroAreas: ["asia"]
    });
    expect(choices).toHaveLength(56);
  });

  it("keeps a fixed 56-language baseline while filtering provider support and exposing expansions on demand", () => {
    const baselineChoices = buildInteractionLanguageChoices().map((choice) => choice.value);
    const chatGptChoices = buildInteractionLanguageChoices("chatgpt").map((choice) => choice.value);
    const azureChoices = buildInteractionLanguageChoices("azure").map((choice) => choice.value);
    const expandedChoices = buildInteractionLanguageChoices("chatgpt", {
      includeProviderExpansions: true
    }).map((choice) => choice.value);

    expect(baselineChoices).toContain("sq");
    expect(baselineChoices).toContain("yue");
    expect(chatGptChoices).toContain("en-gb");
    expect(chatGptChoices).toContain("pt-pt");
    expect(chatGptChoices).toContain("sq");
    expect(chatGptChoices).not.toContain("yue");
    expect(chatGptChoices).not.toContain("am");
    expect(azureChoices).toContain("sq");
    expect(azureChoices).toContain("yue");
    expect(expandedChoices).toContain("sl");
    expect(expandedChoices).toContain("sq");
    expect(expandedChoices).toContain("be");
    expect(expandedChoices).toContain("fr-ca");
    expect(expandedChoices).toContain("kk");
    expect(expandedChoices).toContain("eu");
    expect(expandedChoices).toContain("gl");
    expect(expandedChoices).toContain("ka");
    expect(expandedChoices).toContain("mk");
    expect(expandedChoices).toContain("mi");
    expect(expandedChoices).toContain("mn");
    expect(expandedChoices).toContain("si");
    expect(expandedChoices).toContain("so");
    expect(expandedChoices).toContain("uz");
    expect(expandedChoices).not.toContain("as");
    expect(expandedChoices).not.toContain("or");
  });

  it("derives one centralized common-provider language surface for user-facing selectors", () => {
    const commonChoices = buildCommonProviderInteractionLanguageChoices("chatgpt").map((choice) => choice.value);
    const commonSourceLocaleMap = buildCommonProviderInteractionLanguageSourceLocaleMap("azure");
    const commonTargetGroups = buildCommonProviderTranslationTargetOptionGroups("azure");

    expect(COMMON_PROVIDER_INTERACTION_LANGUAGE_COUNT).toBe(68);
    expect(COMMON_PROVIDER_TRANSLATION_TARGET_LANGUAGE_COUNT).toBe(69);
    expect(commonChoices).toHaveLength(68);
    expect(getCommonProviderTranslationTargetLanguageCodes()).toHaveLength(69);
    expect(commonChoices).toContain("ka");
    expect(commonChoices).toContain("sl");
    expect(commonChoices).not.toContain("am");
    expect(commonChoices).not.toContain("be");
    expect(commonSourceLocaleMap.ka).toBe("ka-GE");
    expect(commonSourceLocaleMap.be).toBeUndefined();
    expect(commonTargetGroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Europa",
          options: expect.arrayContaining([expect.objectContaining({ value: "sl" })])
        }),
        expect.objectContaining({
          label: "Asia",
          options: expect.arrayContaining([expect.objectContaining({ value: "ka" })])
        })
      ])
    );
    expect(
      commonTargetGroups.flatMap((group) => group.options).some((option) => option.value === "be")
    ).toBe(false);
  });

  it("derives visitor UI metadata from the localized coverage catalog", () => {
    expect(buildInteractionLanguageChoices("chatgpt").find((choice) => choice.value === "sr-Cyrl")).toMatchObject({
      visitorLocalizationKey: "sr-Cyrl",
      hasDedicatedVisitorLocalization: true,
      fallbackUiLanguage: "en",
      fallsBackToEnglish: false
    });
    expect(buildInteractionLanguageChoices("chatgpt").find((choice) => choice.value === "it")).toMatchObject({
      visitorLocalizationKey: "it",
      hasDedicatedVisitorLocalization: true,
      fallbackUiLanguage: "en",
      fallsBackToEnglish: false
    });
    expect(
      buildInteractionLanguageChoices("chatgpt", { includeProviderExpansions: true }).find((choice) => choice.value === "eu")
    ).toMatchObject({
      visitorLocalizationKey: "eu",
      hasDedicatedVisitorLocalization: true,
      fallbackUiLanguage: "en",
      fallsBackToEnglish: false
    });
  });

  it("tracks Azure-only translation targets without exposing them as interaction languages", () => {
    expect(getProviderTargetOnlyLanguageCodes("azure")).toEqual(
      expect.arrayContaining(["fj", "ht", "iu", "ku", "kmr", "lzh", "mg", "mi", "mww", "otq", "prs", "sm", "ti", "tlh-Latn", "tlh-Piqd", "to", "ty", "yua"])
    );
    expect(buildInteractionLanguageChoices("azure", { includeProviderExpansions: true }).map((choice) => choice.value)).not.toEqual(
      expect.arrayContaining(["prs", "fj", "ht", "lzh"])
    );
  });

  it("exposes explicit provider-scoped STT and translation target catalogs", () => {
    expect(getSupportedSpeechToTextLanguageCodes("chatgpt", { includeProviderExpansions: true })).toContain("eu");
    expect(getSupportedSpeechToTextLanguageCodes("chatgpt", { includeProviderExpansions: true })).toContain("be");
    expect(getSupportedSpeechToTextLanguageCodes("chatgpt", { includeProviderExpansions: true })).toContain("mi");
    expect(getSupportedSpeechToTextLanguageCodes("chatgpt", { includeProviderExpansions: true })).not.toContain("am");
    expect(getSupportedSpeechToTextLanguageCodes("azure", { includeProviderExpansions: true })).toContain("am");
    expect(getSupportedTranslationTargetLanguageCodes("azure", { includeProviderExpansions: true })).toContain("prs");
    expect(getSupportedTranslationTargetLanguageCodes("azure", { includeProviderExpansions: true })).toContain("fj");
    expect(getSupportedTranslationTargetLanguageCodes("chatgpt", { includeProviderExpansions: true })).toContain("be");
    expect(getSupportedTranslationTargetLanguageCodes("chatgpt", { includeProviderExpansions: true })).toContain("mi");
    expect(getSupportedTranslationTargetLanguageCodes("chatgpt", { includeProviderExpansions: true })).not.toContain("prs");
  });

  it("builds provider-scoped source-locale and translation-target selectors for the setup wizard", () => {
    expect(buildProviderSpeechSourceLanguageChoices("chatgpt", { includeProviderExpansions: true })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "it-IT" }),
        expect.objectContaining({ value: "eu-ES" }),
        expect.objectContaining({ value: "be-BY" }),
        expect.objectContaining({ value: "mi-NZ" })
      ])
    );
    expect(buildProviderSpeechSourceLanguageChoices("chatgpt", { includeProviderExpansions: true })).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ value: "am-ET" })])
    );
    expect(buildTranslationTargetOptionGroups("azure", { includeProviderExpansions: true })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Oceania",
          options: expect.arrayContaining([expect.objectContaining({ value: "fj" })])
        }),
        expect.objectContaining({
          label: "Americhe",
          options: expect.arrayContaining([expect.objectContaining({ value: "ht" })])
        })
      ])
    );
  });

  it("derives Azure language-identification candidates from one canonical locale per language family", () => {
    const normalizedFamilies = AUTO_DETECT_SOURCE_LANGUAGE_CANDIDATES.map((locale) => {
      const normalized = locale.toLowerCase();

      if (normalized.startsWith("zh-")) {
        return "zh";
      }

      if (normalized.startsWith("sr-")) {
        return "sr";
      }

      if (normalized.startsWith("en-")) {
        return "en";
      }

      if (normalized.startsWith("fr-")) {
        return "fr";
      }

      if (normalized.startsWith("pt-")) {
        return "pt";
      }

      return normalized.split("-")[0] ?? normalized;
    });

    expect(new Set(normalizedFamilies).size).toBe(AUTO_DETECT_SOURCE_LANGUAGE_CANDIDATES.length);
    expect(AUTO_DETECT_SOURCE_LANGUAGE_CANDIDATES).toContain("zh-CN");
    expect(AUTO_DETECT_SOURCE_LANGUAGE_CANDIDATES).not.toContain("zh-HK");
    expect(AUTO_DETECT_SOURCE_LANGUAGE_CANDIDATES).not.toContain("zh-TW");
  });

  it("always synchronizes source language from the selected target language during commissioning", () => {
    expect(
      resolveConfiguredSideLanguageState({
        targetLanguage: "fr",
        fallbackSourceLanguage: "en-US",
        translationProvider: "chatgpt"
      })
    ).toEqual({
      sourceLanguage: "fr-FR"
    });
  });

  it("synchronizes a fixed source language from the selected target language when runtime selection changes", () => {
    expect(resolveSelectedTargetLanguageState("ja", "en-US", "chatgpt")).toEqual({
      sourceLanguage: "ja-JP"
    });
  });

  it("normalizes provider-detected base languages to the preferred canonical speech locale", () => {
    expect(resolveDetectedSourceLanguageOption("it")?.value).toBe("it-IT");
    expect(resolveDetectedSourceLanguageOption("bn")?.value).toBe("bn-IN");
    expect(resolveDetectedSourceLanguageOption("ur")?.value).toBe("ur-IN");
  });

  it("normalizes provider and locale aliases to the canonical product-language codes", () => {
    expect(normalizeInteractionLanguage("zh-CN", "chatgpt", "en")).toBe("zh-Hans");
    expect(normalizeInteractionLanguage("zh-TW", "chatgpt", "en")).toBe("zh-Hant");
    expect(normalizeInteractionLanguage("fr-CA", "chatgpt", "en", { includeProviderExpansions: true })).toBe(
      "fr-ca"
    );
    expect(normalizeInteractionLanguage("pt-PT", "chatgpt", "en")).toBe("pt-pt");
  });

  it("keeps every provider-expanded interaction language selectable without falling back to the wizard defaults", () => {
    for (const provider of ["azure", "chatgpt"] as const) {
      const expandedChoices = buildInteractionLanguageChoices(provider, {
        includeProviderExpansions: true
      });

      for (const choice of expandedChoices) {
        expect(
          normalizeInteractionLanguage(choice.value, provider, "en", {
            includeProviderExpansions: true
          })
        ).toBe(choice.value);
        expect(
          resolveInteractionLanguageSourceLocale(choice.value, provider, {
            includeProviderExpansions: true
          })
        ).toBe(choice.sourceLocale);
        expect(
          resolveProviderTargetLanguageCode(choice.value, provider, {
            includeProviderExpansions: true
          })
        ).toBeTruthy();
      }
    }
  });
});
