import { describe, expect, it } from "vitest";
import { filterSelectableMicrophones } from "../src/services/audio/selectable-microphones.js";

describe("filterSelectableMicrophones", () => {
  it("removes default aliases and duplicate device ids", () => {
    const result = filterSelectableMicrophones([
      { deviceId: "default", groupId: "g0", label: "Default - Mic A" },
      { deviceId: "communications", groupId: "g0", label: "Communications - Mic A" },
      { deviceId: "mic-a", groupId: "g1", label: "Mic A" },
      { deviceId: "mic-a", groupId: "g1", label: "Mic A duplicate" },
      { deviceId: "mic-b", groupId: "g2", label: "Mic B" }
    ]);

    expect(result).toEqual([
      { deviceId: "mic-a", groupId: "g1", label: "Mic A" },
      { deviceId: "mic-b", groupId: "g2", label: "Mic B" }
    ]);
  });

  it("falls back to alias ids when no concrete device ids are available", () => {
    const result = filterSelectableMicrophones([
      { deviceId: "default", groupId: "g0", label: "Default - Mic A" },
      { deviceId: "communications", groupId: "g0", label: "Communications - Mic A" }
    ]);

    expect(result).toEqual([
      { deviceId: "default", groupId: "g0", label: "Default - Mic A" },
      { deviceId: "communications", groupId: "g0", label: "Communications - Mic A" }
    ]);
  });

  it("keeps analog line-in style capture inputs while excluding obvious loopback endpoints", () => {
    const result = filterSelectableMicrophones([
      { deviceId: "line-in", groupId: "g1", label: "Line In (Realtek(R) Audio)" },
      { deviceId: "rear-mic", groupId: "g1", label: "Rear Mic (Realtek(R) Audio)" },
      { deviceId: "stereo-mix", groupId: "g1", label: "Stereo Mix (Realtek(R) Audio)" }
    ]);

    expect(result).toEqual([
      { deviceId: "line-in", groupId: "g1", label: "Line In (Realtek(R) Audio)" },
      { deviceId: "rear-mic", groupId: "g1", label: "Rear Mic (Realtek(R) Audio)" }
    ]);
  });
});
