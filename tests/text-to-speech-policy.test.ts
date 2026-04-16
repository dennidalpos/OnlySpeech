import { describe, expect, it } from "vitest";
import { resolveProviderTextToSpeechPolicy } from "../src/shared/text-to-speech-policy.js";

describe("resolveProviderTextToSpeechPolicy", () => {
  it("picks the provider-owned OpenAI engine for chatgpt", () => {
    const policy = resolveProviderTextToSpeechPolicy("chatgpt", "it", {
      systemFallbackAvailable: true
    });

    expect(policy).toEqual({
      primaryEngine: "openai",
      fallbackEngine: null,
      blockOnMissing: true
    });
  });

  it("keeps chatgpt provider-owned even when no local fallback is available", () => {
    const policy = resolveProviderTextToSpeechPolicy("chatgpt", "pt-PT", {
      systemFallbackAvailable: false
    });

    expect(policy).toEqual({
      primaryEngine: "openai",
      fallbackEngine: null,
      blockOnMissing: true
    });
  });

  it("blocks chatgpt when provider-owned playback is unavailable", () => {
    const policy = resolveProviderTextToSpeechPolicy("chatgpt", "ko", {});

    expect(policy.primaryEngine).toBe("openai");
    expect(policy.blockOnMissing).toBe(true);
    expect(policy.fallbackEngine).toBeNull();
  });

  it("prefers Azure with no fallback when the Azure catalog covers the requested language", () => {
    const policy = resolveProviderTextToSpeechPolicy("azure", "en-US", {
      systemFallbackAvailable: true,
      azureBackendAvailable: true
    });

    expect(policy).toEqual({
      primaryEngine: "azure",
      fallbackEngine: null,
      blockOnMissing: true
    });
  });

  it("does not fall back to system voices for azure when no compatible Azure voice is known yet", () => {
    const policy = resolveProviderTextToSpeechPolicy("azure", "en-US", {
      systemFallbackAvailable: true,
      azureBackendAvailable: false
    });

    expect(policy).toEqual({
      primaryEngine: "azure",
      fallbackEngine: null,
      blockOnMissing: true
    });
  });

  it("blocks azure when neither the Azure backend nor a system fallback is available", () => {
    const policy = resolveProviderTextToSpeechPolicy("azure", "yue", {
      systemFallbackAvailable: false,
      azureBackendAvailable: false
    });

    expect(policy).toEqual({
      primaryEngine: "azure",
      fallbackEngine: null,
      blockOnMissing: true
    });
  });
});
