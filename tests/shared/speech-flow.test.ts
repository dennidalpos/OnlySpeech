import { describe, expect, it } from "vitest";
import { buildInteractionLanguageChoices } from "../../src/shared/language-flow.js";
import { resolveProviderLanguageContract } from "../../src/shared/provider-language-contract.js";
import { resolveChatGptTranscriptionLanguagePolicy } from "../../src/shared/provider-language-policy.js";
import {
  resolveChatGptTranscriptionPrompt,
  resolveChatGptTranscriptionLanguageHint,
  resolveSideSpeechStartParameters,
  resolveSpeechTurnSourceLanguage,
  resolveTextToSpeechLanguageInstructions
} from "../../src/shared/speech-flow.js";
import type { SideState } from "../../src/shared/types.js";

function createSideState(partial: Partial<SideState>): SideState {
  return {
    side: "A",
    selectedInteractionLanguage: "en",
    normalizedTargetLanguage: "en",
    sourceLanguage: "it-IT",
    requestedUiLanguage: "en",
    effectiveUiLanguage: "en",
    usesEnglishUiFallback: false,
    selectedTargetLanguage: "en",
    localTranscript: "",
    remoteTranslation: "",
    status: "ready",
    error: null,
    isActiveSpeaker: false,
    ...partial
  };
}

describe("speech-flow", () => {
  it("omits the ChatGPT transcription language hint when no source language is available", () => {
    expect(resolveChatGptTranscriptionLanguageHint(undefined)).toBeUndefined();
    expect(resolveChatGptTranscriptionLanguageHint(null)).toBeUndefined();
  });

  it("reduces fixed locale codes to the ChatGPT transcription language hint", () => {
    expect(resolveChatGptTranscriptionLanguageHint("it-IT")).toBe("it");
    expect(resolveChatGptTranscriptionLanguageHint("en-US")).toBe("en");
  });

  it("avoids unsupported ChatGPT language hints and falls back to a transcription prompt", () => {
    expect(resolveChatGptTranscriptionLanguageHint("te-IN")).toBeUndefined();
    expect(resolveChatGptTranscriptionLanguageHint("sq-AL")).toBeUndefined();
    expect(resolveChatGptTranscriptionPrompt("sq-AL")).toContain("Albanian");
    expect(resolveChatGptTranscriptionPrompt("te-IN")).toContain("Telugu");
  });

  it("does not add a fallback prompt when the ChatGPT language hint is supported", () => {
    expect(resolveChatGptTranscriptionPrompt("it-IT")).toBeUndefined();
    expect(resolveChatGptTranscriptionPrompt("zh-TW")).toBeUndefined();
  });

  it("adds a ChatGPT transcription prompt for supported hints when language prompts are enabled", () => {
    expect(resolveChatGptTranscriptionPrompt("it-IT", { alwaysInclude: true })).toContain("Italian");
    expect(resolveChatGptTranscriptionPrompt("zh-TW", { alwaysInclude: true })).toContain("Chinese");
  });

  it("uses prompt fallback for every ChatGPT interaction language whose base code is not safe for the STT language parameter", () => {
    expect(resolveChatGptTranscriptionLanguageHint("eu-ES")).toBeUndefined();
    expect(resolveChatGptTranscriptionLanguageHint("ka-GE")).toBeUndefined();
    expect(resolveChatGptTranscriptionLanguageHint("mn-MN")).toBeUndefined();
    expect(resolveChatGptTranscriptionLanguageHint("si-LK")).toBeUndefined();
    expect(resolveChatGptTranscriptionLanguageHint("so-SO")).toBeUndefined();
    expect(resolveChatGptTranscriptionLanguageHint("uz-UZ")).toBeUndefined();
    expect(resolveChatGptTranscriptionLanguageHint("yue-CN")).toBeUndefined();

    expect(resolveChatGptTranscriptionPrompt("eu-ES")).toContain("Basque");
    expect(resolveChatGptTranscriptionPrompt("ka-GE")).toContain("Georgian");
    expect(resolveChatGptTranscriptionPrompt("mn-MN")).toContain("Mongolian");
    expect(resolveChatGptTranscriptionPrompt("si-LK")).toContain("Sinhala");
    expect(resolveChatGptTranscriptionPrompt("so-SO")).toContain("Somali");
    expect(resolveChatGptTranscriptionPrompt("uz-UZ")).toContain("Uzbek");
    expect(resolveChatGptTranscriptionPrompt("yue-CN")).toContain("Cantonese");
  });

  it("keeps documented locale variants mapped to a valid ChatGPT STT hint", () => {
    expect(resolveChatGptTranscriptionLanguageHint("en-GB")).toBe("en");
    expect(resolveChatGptTranscriptionLanguageHint("fr-CA")).toBe("fr");
    expect(resolveChatGptTranscriptionLanguageHint("pt-PT")).toBe("pt");
    expect(resolveChatGptTranscriptionLanguageHint("sr-RS")).toBe("sr");
    expect(resolveChatGptTranscriptionLanguageHint("zh-TW")).toBe("zh");
    expect(resolveChatGptTranscriptionLanguageHint("fil-PH")).toBe("tl");
    expect(resolveChatGptTranscriptionLanguageHint("nb-NO")).toBe("no");
  });

  it("keeps the full ChatGPT interaction catalog aligned with the canonical transcription policy", () => {
    for (const choice of buildInteractionLanguageChoices("chatgpt", { includeProviderExpansions: true })) {
      const policy = resolveChatGptTranscriptionLanguagePolicy(choice.sourceLocale);
      const hint = resolveChatGptTranscriptionLanguageHint(choice.sourceLocale);
      const prompt = resolveChatGptTranscriptionPrompt(choice.sourceLocale);

      expect(policy).toBeTruthy();

      if (policy?.usesPromptFallback) {
        expect(hint).toBeUndefined();
        expect(prompt).toBeTruthy();
      } else {
        expect(hint).toBe(policy?.languageHint ?? undefined);
        expect(prompt).toBeUndefined();
      }
    }
  });

  it("keeps the configured speech language even when providers report a detected one", () => {
    expect(resolveSpeechTurnSourceLanguage("it-IT", "en-US")).toBe("it-IT");
    expect(resolveSpeechTurnSourceLanguage("it-IT", "   ")).toBe("it-IT");
    expect(resolveSpeechTurnSourceLanguage("it-IT", undefined)).toBe("it-IT");
  });

  it("uses detected language only when ChatGPT translation detection is adaptive", () => {
    expect(resolveSpeechTurnSourceLanguage("it-IT", "en-US", "diagnostic")).toBe("it-IT");
    expect(resolveSpeechTurnSourceLanguage("it-IT", "en-US", "off")).toBe("it-IT");
    expect(resolveSpeechTurnSourceLanguage("it-IT", "en-US", "adaptive")).toBe("en-US");
  });

  it("resolves one provider language contract for representative language pairs", () => {
    for (const provider of ["azure", "chatgpt", "ollama"] as const) {
      for (const language of ["it", "en", "fr", "de", "es", "pt", "zh-Hans", "ja", "sq"]) {
        const contract = resolveProviderLanguageContract({ provider, language });
        expect(contract.selectedLanguage).toBeTruthy();
        expect(contract.sourceLocale).toBeTruthy();
        expect(contract.targetCode).toBeTruthy();
        expect(contract.ttsLocale).toBeTruthy();
        expect(contract.canonicalBcp47).toBeTruthy();
        expect(contract.displayLabel).toBeTruthy();
        expect(contract.capability).toEqual(
          expect.objectContaining({
            translation: expect.any(Boolean)
          })
        );
      }
    }
  });

  it("builds TTS language instructions from the selected provider language contract", () => {
    expect(resolveTextToSpeechLanguageInstructions("chatgpt", "it")).toContain("Italian");
    expect(resolveTextToSpeechLanguageInstructions("chatgpt", "ja")).toContain("Japanese");
  });

  it("uses the configured source language for runtime speech start parameters", () => {
    expect(resolveSideSpeechStartParameters("chatgpt", createSideState({ sourceLanguage: "en-US" }))).toEqual({
      sourceLanguage: "en-US"
    });
    expect(resolveSideSpeechStartParameters("azure", createSideState({ sourceLanguage: "it-IT" }))).toEqual({
      sourceLanguage: "it-IT"
    });
    expect(resolveSideSpeechStartParameters("chatgpt", createSideState({ sourceLanguage: null }))).toEqual({
      sourceLanguage: "en-GB"
    });
  });
});
