import { describe, expect, it } from "vitest";
import {
  findMatchingPersistedMicrophone,
  getPersistedMicrophoneId
} from "../../src/services/audio/persisted-microphone-id.js";

describe("persisted microphone ids", () => {
  it("prefers endpoint-based ids for stable analog inputs", () => {
    const persistedId = getPersistedMicrophoneId(
      { deviceId: "realtek-rear-1", groupId: "realtek-g1", label: "Rear Mic (Realtek(R) Audio)" },
      [
        { deviceId: "realtek-rear-1", groupId: "realtek-g1", label: "Rear Mic (Realtek(R) Audio)" },
        { deviceId: "realtek-line-1", groupId: "realtek-g1", label: "Line In (Realtek(R) Audio)" }
      ]
    );

    expect(persistedId).toMatch(/^endpoint:/);
  });

  it("falls back from an endpoint id to the only matching group endpoint when the driver renames the same source", () => {
    const persistedId = getPersistedMicrophoneId(
      { deviceId: "pci-mic-1", groupId: "sb-g1", label: "Rear Mic (Sound Blaster PCIe)" },
      [{ deviceId: "pci-mic-1", groupId: "sb-g1", label: "Rear Mic (Sound Blaster PCIe)" }]
    );

    const match = findMatchingPersistedMicrophone(
      [{ deviceId: "pci-mic-2", groupId: "sb-g1", label: "Microphone (Sound Blaster Audigy Rx)" }],
      persistedId
    );

    expect(match).toEqual({
      deviceId: "pci-mic-2",
      groupId: "sb-g1",
      label: "Microphone (Sound Blaster Audigy Rx)"
    });
  });

  it("does not collapse two distinct analog inputs on the same card when both are still present", () => {
    const persistedRear = getPersistedMicrophoneId(
      { deviceId: "rear-1", groupId: "realtek-g1", label: "Rear Mic (Realtek(R) Audio)" },
      [
        { deviceId: "rear-1", groupId: "realtek-g1", label: "Rear Mic (Realtek(R) Audio)" },
        { deviceId: "front-1", groupId: "realtek-g1", label: "Front Mic (Realtek(R) Audio)" }
      ]
    );

    const match = findMatchingPersistedMicrophone(
      [
        { deviceId: "rear-2", groupId: "realtek-g1", label: "Rear Mic (Realtek HD Audio)" },
        { deviceId: "front-2", groupId: "realtek-g1", label: "Front Mic (Realtek HD Audio)" }
      ],
      persistedRear
    );

    expect(match).toEqual({
      deviceId: "rear-2",
      groupId: "realtek-g1",
      label: "Rear Mic (Realtek HD Audio)"
    });
  });

  it("matches the same single shared microphone even when Chromium exposes a different group id on the next origin", () => {
    const persistedId = getPersistedMicrophoneId(
      { deviceId: "usb-webcam-1", groupId: "origin-a-group", label: "Microfono generale Webcam 1B3F 2247" },
      [{ deviceId: "usb-webcam-1", groupId: "origin-a-group", label: "Microfono generale Webcam 1B3F 2247" }]
    );

    const match = findMatchingPersistedMicrophone(
      [{ deviceId: "usb-webcam-2", groupId: "origin-b-group", label: "Microfono generale Webcam 1B3F 2247" }],
      persistedId
    );

    expect(match).toEqual({
      deviceId: "usb-webcam-2",
      groupId: "origin-b-group",
      label: "Microfono generale Webcam 1B3F 2247"
    });
  });
});
