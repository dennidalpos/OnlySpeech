import { describe, expect, it } from "vitest";
import { getPersistedMicrophoneId } from "../src/services/audio/persisted-microphone-id.js";
import { buildProbeSummary, buildSuggestedEnv } from "../src/tools/env-probe-output.js";

describe("buildSuggestedEnv", () => {
  it("maps displays left-to-right and picks two distinct microphones", () => {
    const microphones = [
      { deviceId: "mic-b", groupId: "g2", label: "Mic B" },
      { deviceId: "mic-a", groupId: "g1", label: "Mic A" },
      { deviceId: "mic-a", groupId: "g1", label: "Mic A" }
    ];
    const envText = buildSuggestedEnv(
      {
        AZURE_SPEECH_KEY: "existing-key",
        AZURE_SPEECH_REGION: "westeurope"
      },
      {
        displays: [
          {
            displayId: 30,
            label: "Right",
            bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
            scaleFactor: 1
          },
          {
            displayId: 10,
            label: "Left",
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            scaleFactor: 1
          }
        ],
        microphones,
        microphonePermissionGranted: true,
        microphoneError: null
      }
    );

    expect(envText).toContain("DISPLAY_A_ID=10");
    expect(envText).toContain("DISPLAY_B_ID=30");
    expect(envText).toContain(`MIC_A_ID=${getPersistedMicrophoneId(microphones[1], microphones)}`);
    expect(envText).toContain(`MIC_B_ID=${getPersistedMicrophoneId(microphones[0], microphones)}`);
    expect(envText).toContain("AZURE_SPEECH_KEY=existing-key");
    expect(envText).toContain("TRANSLATION_PROVIDER=chatgpt");
    expect(envText).toContain("DEMO_SLIDE_INTERVAL_SECONDS=8");
    expect(envText).toContain("PROVIDER_REQUEST_TIMEOUT_MS=45000");
    expect(envText).toContain("CHATGPT_SILENCE_RMS_THRESHOLD=0.02");
    expect(envText).toContain("VISITOR_CONVERSATION_HISTORY_ENABLED=false");
    expect(envText).toContain("AUDIO_ECHO_CANCELLATION=true");
    expect(envText).toContain("AUDIO_NOISE_SUPPRESSION=true");
    expect(envText).toContain("# chatgpt requires CHATGPT_API_KEY, CHATGPT_MODEL, and CHATGPT_TRANSCRIBE_MODEL.");
    expect(envText).toContain(
      "# azure requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION; normalized playback diagnostics also use AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_REGION."
    );
  });

  it("adds warnings when probe is incomplete", () => {
    const envText = buildSuggestedEnv(
      {},
      {
        displays: [],
        microphones: [],
        microphonePermissionGranted: false,
        microphoneError: "Permission denied"
      }
    );

    expect(envText).toContain("# Microphone probe did not complete successfully: Permission denied");
    expect(envText).toContain("# Fewer than two displays were detected on this PC.");
    expect(envText).toContain("# Fewer than two distinct microphones were detected in the Electron probe.");
  });

  it("drops default and communications aliases from suggested microphone ids", () => {
    const microphones = [
      { deviceId: "default", groupId: "g0", label: "Default - Mic A" },
      { deviceId: "communications", groupId: "g0", label: "Communications - Mic A" },
      { deviceId: "mic-a", groupId: "g1", label: "Mic A" }
    ];
    const envText = buildSuggestedEnv(
      {},
      {
        displays: [
          {
            displayId: 10,
            label: "Left",
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            scaleFactor: 1
          },
          {
            displayId: 30,
            label: "Right",
            bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
            scaleFactor: 1
          }
        ],
        microphones,
        microphonePermissionGranted: true,
        microphoneError: null
      }
    );

    expect(envText).toContain(`MIC_A_ID=${getPersistedMicrophoneId(microphones[2], microphones)}`);
    expect(envText).toContain("MIC_B_ID=");
  });
});

describe("buildProbeSummary", () => {
  it("returns sorted displays and deduplicated microphones", () => {
    const summary = buildProbeSummary({
      displays: [
        {
          displayId: 30,
          label: "Right",
          bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
          scaleFactor: 1
        },
        {
          displayId: 10,
          label: "Left",
          bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          scaleFactor: 1
        }
      ],
      microphones: [
        { deviceId: "mic-b", groupId: "g2", label: "Mic B" },
        { deviceId: "mic-a", groupId: "g1", label: "Mic A" },
        { deviceId: "mic-a", groupId: "g1", label: "Mic A" }
      ],
      microphonePermissionGranted: true,
      microphoneError: null
    });

    expect(summary).toEqual({
      displays: [
        expect.objectContaining({ displayId: 10 }),
        expect.objectContaining({ displayId: 30 })
      ],
      microphones: [
        expect.objectContaining({ deviceId: "mic-a" }),
        expect.objectContaining({ deviceId: "mic-b" })
      ],
      microphonePermissionGranted: true,
      microphoneError: null
    });
  });
});
