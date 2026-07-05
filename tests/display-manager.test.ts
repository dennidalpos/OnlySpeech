import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAllDisplays, on } = vi.hoisted(() => ({
  getAllDisplays: vi.fn(),
  on: vi.fn()
}));

vi.mock("electron", () => ({
  screen: {
    getAllDisplays,
    on
  }
}));

import { DisplayManager } from "../src/main/display-manager.js";
import type { RuntimeConfig } from "../src/shared/types.js";

function createConfig(overrides = {}) {
  return {
    appMode: "kiosk",
    microphonePttMode: "dual-dedicated",
    demoSlideIntervalSeconds: 8,
    textToSpeechEnabled: true,
    requiredMonitors: 2,
    requiredMicrophones: 2,
    displayAId: null,
    displayBId: null,
    micAId: null,
    micBId: null,
    idleClearSeconds: 60,
    idleHardResetSeconds: 180,
    pttReleaseGraceMs: 400,
    providerRequestTimeoutMs: 45000,
    chatGptSilenceRmsThreshold: 0.02,
    visitorConversationHistoryEnabled: false,
    audioEchoCancellation: true,
    audioNoiseSuppression: true,
    azureSpeechKey: "key",
    azureSpeechRegion: "region",
    translationProvider: "chatgpt",
    chatGptApiKey: "chatgpt-key",
    chatGptModel: "gpt-4o-mini",
    chatGptTranscribeModel: "whisper-1",
    ollamaBaseUrl: "http://localhost:11434/api",
    ollamaModel: "gemma3",
    ollamaRequestTimeoutMs: 45000,
    ollamaStreamingEnabled: false,
    ollamaApiKey: "",
    defaultTargetLangA: "it",
    defaultTargetLangB: "en",
    defaultSourceLangA: "it-IT",
    defaultSourceLangB: "en-US",
    logLevel: "info",
    ...overrides
  } satisfies RuntimeConfig;
}

describe("DisplayManager", () => {
  beforeEach(() => {
    getAllDisplays.mockReset();
    on.mockReset();
  });

  it("assigns displays left-to-right when ids are not configured", () => {
    getAllDisplays.mockReturnValue([
      {
        id: 22,
        label: "Right",
        bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1
      },
      {
        id: 11,
        label: "Left",
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1
      }
    ]);

    const manager = new DisplayManager(createConfig());
    const result = manager.getAssignments();

    expect(result.issues).toHaveLength(0);
    expect(result.assignments).toEqual([
      expect.objectContaining({ side: "A", displayId: 11 }),
      expect.objectContaining({ side: "B", displayId: 22 })
    ]);
  });

  it("raises a blocking issue when fewer displays than required are available", () => {
    getAllDisplays.mockReturnValue([
      {
        id: 11,
        label: "Only",
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1
      }
    ]);

    const manager = new DisplayManager(createConfig());
    const result = manager.getAssignments();

    expect(result.assignments).toEqual([expect.objectContaining({ side: "A", displayId: 11 })]);
    expect(result.issues.map((issue) => issue.code)).toContain("missing-monitor");
  });

  it("falls back to active displays when configured ids are no longer available", () => {
    getAllDisplays.mockReturnValue([
      {
        id: 22,
        label: "Right",
        bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1
      },
      {
        id: 11,
        label: "Left",
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1
      }
    ]);

    const manager = new DisplayManager(createConfig({ displayAId: 999, displayBId: 888 }));
    const result = manager.getAssignments();

    expect(result.issues).toHaveLength(0);
    expect(result.assignments).toEqual([
      expect.objectContaining({ side: "A", displayId: 11 }),
      expect.objectContaining({ side: "B", displayId: 22 })
    ]);
  });
});
