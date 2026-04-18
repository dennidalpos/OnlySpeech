import { describe, expect, it } from "vitest";
import { buildProviderLanguageMatrixSummary } from "../src/shared/provider-language-matrix.js";
import { getSupportedTranslationTargetLanguageCodes } from "../src/shared/language-registry.js";

describe("provider-language-matrix", () => {
  it("covers the full provider catalogs and exposes the expected ChatGPT transcription policy split", () => {
    const matrix = buildProviderLanguageMatrixSummary();

    expect(matrix.azure.interaction).toHaveLength(83);
    expect(getSupportedTranslationTargetLanguageCodes("azure", { includeProviderExpansions: true })).toHaveLength(101);
    expect(matrix.chatgpt.interaction).toHaveLength(70);
    expect(getSupportedTranslationTargetLanguageCodes("chatgpt", { includeProviderExpansions: true })).toHaveLength(70);
    expect(matrix.ollama.interaction).toHaveLength(
      getSupportedTranslationTargetLanguageCodes("ollama", { includeProviderExpansions: true }).length
    );

    expect(
      matrix.chatgpt.interaction
        .filter((entry) => entry.chatGptTranscriptionCatalogStatus === "prompt-fallback")
        .map((entry) => entry.code)
    ).toEqual(expect.arrayContaining(["sq", "eu", "ka", "mn", "si", "so", "uz"]));
  });

  it("keeps visitor UI ready for every interaction language while documenting technical english fallbacks explicitly", () => {
    const matrix = buildProviderLanguageMatrixSummary();

    for (const entry of matrix.chatgpt.interaction) {
      expect(entry.usesVisitorEnglishFallback).toBe(false);
    }

    expect(matrix.azure.interaction.some((entry) => entry.usesVisitorEnglishFallback)).toBe(true);
    expect(matrix.azure.interaction.find((entry) => entry.code === "as")).toMatchObject({
      usesVisitorEnglishFallback: true
    });

    expect(matrix.chatgpt.interaction.find((entry) => entry.code === "kk")).toMatchObject({
      hasDedicatedTechnicalLocalization: false,
      usesTechnicalEnglishFallback: true
    });
    expect(matrix.chatgpt.interaction.find((entry) => entry.code === "sr-Cyrl")).toMatchObject({
      hasDedicatedTechnicalLocalization: false,
      usesTechnicalEnglishFallback: true
    });
    expect(matrix.chatgpt.interaction.find((entry) => entry.code === "sq")).toMatchObject({
      hasDedicatedTechnicalLocalization: true,
      usesTechnicalEnglishFallback: false
    });
    expect(matrix.chatgpt.interaction.find((entry) => entry.code === "zh-Hant")).toMatchObject({
      hasDedicatedTechnicalLocalization: true,
      usesTechnicalEnglishFallback: false
    });
  });
});
