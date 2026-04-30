import { describe, expect, it } from "vitest";
import { resolveSpeechStartParameters } from "../src/shared/speech-flow.js";

describe("resolveSpeechStartParameters", () => {
  it("falls back to a deterministic source locale when no runtime source language is available", () => {
    expect(
      resolveSpeechStartParameters({
        translationProvider: "chatgpt",
        sourceLanguage: null
      })
    ).toEqual({
      sourceLanguage: "en-GB"
    });
  });

  it("keeps the configured source language for azure runtime sessions", () => {
    expect(
      resolveSpeechStartParameters({
        translationProvider: "azure",
        sourceLanguage: "it-IT"
      })
    ).toEqual({
      sourceLanguage: "it-IT"
    });
  });

  it("preserves a fixed source language", () => {
    expect(
      resolveSpeechStartParameters({
        translationProvider: "chatgpt",
        sourceLanguage: "it-IT"
      })
    ).toEqual({
      sourceLanguage: "it-IT"
    });
  });

  it("ignores the provider when the runtime source is missing", () => {
    expect(
      resolveSpeechStartParameters({
        translationProvider: "azure",
        sourceLanguage: null
      })
    ).toEqual({
      sourceLanguage: "en-GB"
    });
  });
});
