import { describe, expect, it } from "vitest";
import { resolveProviderTextToSpeechPolicy } from "../src/shared/text-to-speech-policy.js";

describe("resolveProviderTextToSpeechPolicy", () => {
  it("picks the provider-owned OpenAI engine for chatgpt", () => {
    const policy = resolveProviderTextToSpeechPolicy("chatgpt", "it");

    expect(policy).toEqual({
      primaryEngine: "openai",
      blockOnMissing: true
    });
  });

  it("keeps chatgpt provider-owned without exposing a fallback contract", () => {
    const policy = resolveProviderTextToSpeechPolicy("chatgpt", "pt-PT");

    expect(policy).toEqual({
      primaryEngine: "openai",
      blockOnMissing: true
    });
  });

  it("blocks chatgpt when provider-owned playback is unavailable", () => {
    const policy = resolveProviderTextToSpeechPolicy("chatgpt", "ko");

    expect(policy.primaryEngine).toBe("openai");
    expect(policy.blockOnMissing).toBe(true);
  });

  it("keeps Azure provider-owned when the Azure catalog covers the requested language", () => {
    const policy = resolveProviderTextToSpeechPolicy("azure", "en-US");

    expect(policy).toEqual({
      primaryEngine: "azure",
      blockOnMissing: true
    });
  });

  it("does not expose a local fallback path for azure", () => {
    const policy = resolveProviderTextToSpeechPolicy("azure", "en-US");

    expect(policy).toEqual({
      primaryEngine: "azure",
      blockOnMissing: true
    });
  });

  it("blocks azure when the runtime cannot satisfy provider-owned playback", () => {
    const policy = resolveProviderTextToSpeechPolicy("azure", "yue");

    expect(policy).toEqual({
      primaryEngine: "azure",
      blockOnMissing: true
    });
  });
});
