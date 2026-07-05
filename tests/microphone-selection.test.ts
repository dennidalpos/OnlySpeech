import { describe, expect, it } from "vitest";
import { getPersistedMicrophoneId } from "../src/services/audio/persisted-microphone-id.js";
import { selectMicrophoneAssignments } from "../src/services/audio/microphone-selection.js";
import type { RuntimeConfig } from "../src/shared/types.js";

function createConfig(overrides: Partial<RuntimeConfig> = {}): RuntimeConfig {
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
  };
}

describe("selectMicrophoneAssignments", () => {
  it("keeps configured microphone ids mapped to the correct side", () => {
    const result = selectMicrophoneAssignments(
      [
        { deviceId: "mic-b", groupId: "g2", label: "Mic B" },
        { deviceId: "mic-a", groupId: "g1", label: "Mic A" }
      ],
      createConfig({
        micAId: "mic-a",
        micBId: "mic-b"
      })
    );

    expect(result.issues).toHaveLength(0);
    expect(result.assignments).toEqual([
      { side: "A", deviceId: "mic-a", label: "Mic A" },
      { side: "B", deviceId: "mic-b", label: "Mic B" }
    ]);
  });

  it("matches persisted group-based microphone ids across sessions", () => {
    const result = selectMicrophoneAssignments(
      [
        { deviceId: "session-a", groupId: "g1", label: "Mic A" },
        { deviceId: "session-b", groupId: "g2", label: "Mic B" }
      ],
      createConfig({
        micAId: "group:g1",
        micBId: "group:g2"
      })
    );

    expect(result.issues).toHaveLength(0);
    expect(result.assignments).toEqual([
      { side: "A", deviceId: "session-a", label: "Mic A" },
      { side: "B", deviceId: "session-b", label: "Mic B" }
    ]);
  });

  it("matches endpoint-based persisted ids when the device id changes but the analog source stays on the same endpoint", () => {
    const persistedAnalogA = getPersistedMicrophoneId(
      { deviceId: "session-a", groupId: "realtek-g1", label: "Rear Mic (Realtek(R) Audio)" },
      [
        { deviceId: "session-a", groupId: "realtek-g1", label: "Rear Mic (Realtek(R) Audio)" },
        { deviceId: "session-b", groupId: "realtek-g1", label: "Line In (Realtek(R) Audio)" }
      ]
    );
    const persistedAnalogB = getPersistedMicrophoneId(
      { deviceId: "session-b", groupId: "realtek-g1", label: "Line In (Realtek(R) Audio)" },
      [
        { deviceId: "session-a", groupId: "realtek-g1", label: "Rear Mic (Realtek(R) Audio)" },
        { deviceId: "session-b", groupId: "realtek-g1", label: "Line In (Realtek(R) Audio)" }
      ]
    );

    const result = selectMicrophoneAssignments(
      [
        { deviceId: "renamed-a", groupId: "realtek-g1", label: "Rear Mic (Realtek HD Audio)" },
        { deviceId: "renamed-b", groupId: "realtek-g1", label: "Line In (Realtek HD Audio)" }
      ],
      createConfig({
        micAId: persistedAnalogA,
        micBId: persistedAnalogB
      })
    );

    expect(result.issues).toHaveLength(0);
    expect(result.assignments).toEqual([
      { side: "A", deviceId: "renamed-a", label: "Rear Mic (Realtek HD Audio)" },
      { side: "B", deviceId: "renamed-b", label: "Line In (Realtek HD Audio)" }
    ]);
  });

  it("does not silently remap a dedicated side when the configured microphone id is no longer present", () => {
    const result = selectMicrophoneAssignments(
      [
        { deviceId: "mic-b", groupId: "g2", label: "Mic B" },
        { deviceId: "mic-c", groupId: "g3", label: "Mic C" }
      ],
      createConfig({
        micAId: "missing-a",
        micBId: "mic-b"
      })
    );

    expect(result.assignments).toEqual([{ side: "B", deviceId: "mic-b", label: "Mic B" }]);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "missing-microphone-a",
        side: "A"
      })
    );
  });

  it("raises an issue when only one distinct microphone is available in demo mode (no kiosk fallback)", () => {
    const result = selectMicrophoneAssignments(
      [{ deviceId: "mic-a", groupId: "g1", label: "Only mic" }],
      createConfig({ appMode: "demo" })
    );

    // Demo mode does not trigger the kiosk fallback; the assignment still
    // covers only side A and side B remains missing.
    expect(result.assignments).toEqual([{ side: "A", deviceId: "mic-a", label: "Only mic" }]);
    expect(result.issues.map((issue) => issue.code)).toContain("missing-microphone-b");
  });

  describe("1-microphone kiosk fallback", () => {
    it("auto-shares the single microphone to both sides in kiosk mode with dual-dedicated config", () => {
      const result = selectMicrophoneAssignments(
        [{ deviceId: "mic-only", groupId: "g1", label: "Solo mic" }],
        createConfig()
      );

      expect(result.issues).toHaveLength(0);
      expect(result.assignments).toEqual([
        { side: "A", deviceId: "mic-only", label: "Solo mic" },
        { side: "B", deviceId: "mic-only", label: "Solo mic" }
      ]);
    });

    it("uses the single available microphone even when a different mic id was previously configured", () => {
      const result = selectMicrophoneAssignments(
        [{ deviceId: "new-mic", groupId: "g2", label: "New mic" }],
        createConfig({ micAId: "old-mic-a", micBId: "old-mic-b" })
      );

      expect(result.issues).toHaveLength(0);
      expect(result.assignments).toEqual([
        { side: "A", deviceId: "new-mic", label: "New mic" },
        { side: "B", deviceId: "new-mic", label: "New mic" }
      ]);
    });

    it("does not activate the fallback when two microphones are available", () => {
      const result = selectMicrophoneAssignments(
        [
          { deviceId: "mic-a", groupId: "g1", label: "Mic A" },
          { deviceId: "mic-b", groupId: "g2", label: "Mic B" }
        ],
        createConfig()
      );

      expect(result.issues).toHaveLength(0);
      expect(result.assignments).toEqual([
        { side: "A", deviceId: "mic-a", label: "Mic A" },
        { side: "B", deviceId: "mic-b", label: "Mic B" }
      ]);
    });

    it("does not activate the fallback outside of kiosk mode", () => {
      const result = selectMicrophoneAssignments(
        [{ deviceId: "mic-only", groupId: "g1", label: "Solo mic" }],
        createConfig({ appMode: "demo" })
      );

      // demo mode bypasses the fallback; microphone issues are suppressed by demo
      // mode itself since no mics are required — but no shared assignment either.
      expect(result.assignments.filter((a) => a.side === "B")).toHaveLength(0);
    });
  });

  it("ignores default and communications aliases", () => {
    // After filtering aliases the only real mic is "mic-a".  With kiosk mode and
    // one selectable mic the 1-mic fallback activates, sharing it to both sides.
    const result = selectMicrophoneAssignments(
      [
        { deviceId: "default", groupId: "g0", label: "Default - Mic A" },
        { deviceId: "communications", groupId: "g0", label: "Communications - Mic A" },
        { deviceId: "mic-a", groupId: "g1", label: "Mic A" }
      ],
      createConfig()
    );

    expect(result.issues).toHaveLength(0);
    expect(result.assignments).toEqual([
      { side: "A", deviceId: "mic-a", label: "Mic A" },
      { side: "B", deviceId: "mic-a", label: "Mic A" }
    ]);
  });

  it("ignores default and communications aliases with two real microphones (no fallback)", () => {
    const result = selectMicrophoneAssignments(
      [
        { deviceId: "default", groupId: "g0", label: "Default - Mic A" },
        { deviceId: "communications", groupId: "g0", label: "Communications - Mic A" },
        { deviceId: "mic-a", groupId: "g1", label: "Mic A" },
        { deviceId: "mic-b", groupId: "g2", label: "Mic B" }
      ],
      createConfig()
    );

    expect(result.issues).toHaveLength(0);
    expect(result.assignments).toEqual([
      { side: "A", deviceId: "mic-a", label: "Mic A" },
      { side: "B", deviceId: "mic-b", label: "Mic B" }
    ]);
  });

  it("allows both sides to share the same microphone in single-shared mode", () => {
    const result = selectMicrophoneAssignments(
      [{ deviceId: "mic-shared", groupId: "g1", label: "Shared mic" }],
      createConfig({
        microphonePttMode: "single-shared",
        requiredMicrophones: 1,
        micAId: "mic-shared",
        micBId: "mic-shared"
      })
    );

    expect(result.issues).toHaveLength(0);
    expect(result.assignments).toEqual([
      { side: "A", deviceId: "mic-shared", label: "Shared mic" },
      { side: "B", deviceId: "mic-shared", label: "Shared mic" }
    ]);
  });

  it("does not silently replace the configured shared microphone when its persisted id is missing", () => {
    const result = selectMicrophoneAssignments(
      [{ deviceId: "mic-backup", groupId: "g9", label: "Backup mic" }],
      createConfig({
        microphonePttMode: "single-shared",
        requiredMicrophones: 1,
        micAId: "missing-shared",
        micBId: "missing-shared"
      })
    );

    expect(result.assignments).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "missing-microphone-b",
        side: "B"
      })
    ]);
  });

  it("keeps the configured shared microphone when the browser changes its origin-scoped group id", () => {
    const persistedShared = getPersistedMicrophoneId(
      {
        deviceId: "origin-a-device",
        groupId: "origin-a-group",
        label: "Microfono generale Webcam 1B3F 2247"
      },
      [
        {
          deviceId: "origin-a-device",
          groupId: "origin-a-group",
          label: "Microfono generale Webcam 1B3F 2247"
        }
      ]
    );

    const result = selectMicrophoneAssignments(
      [
        {
          deviceId: "origin-b-device",
          groupId: "origin-b-group",
          label: "Microfono generale Webcam 1B3F 2247"
        }
      ],
      createConfig({
        microphonePttMode: "single-shared",
        requiredMicrophones: 1,
        micAId: persistedShared,
        micBId: persistedShared
      })
    );

    expect(result.issues).toHaveLength(0);
    expect(result.assignments).toEqual([
      { side: "A", deviceId: "origin-b-device", label: "Microfono generale Webcam 1B3F 2247" },
      { side: "B", deviceId: "origin-b-device", label: "Microfono generale Webcam 1B3F 2247" }
    ]);
  });
});
