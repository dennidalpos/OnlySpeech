import { describe, expect, it } from "vitest";
import {
  enrichMicrophoneDevices,
  getAudioInputRole,
  isLoopbackLikeAudioInput
} from "../../src/services/audio/microphone-device-metadata.js";

describe("microphone device metadata", () => {
  it("classifies onboard and pci analog inputs without relying on usb-centric labels", () => {
    expect(getAudioInputRole("Rear Mic (Realtek(R) Audio)")).toBe("rear-mic");
    expect(getAudioInputRole("Line In (Sound Blaster Audigy PCIe)")).toBe("line-in");
  });

  it("builds readable labels for generic audioinput endpoints and keeps similar endpoints distinct", () => {
    const devices = enrichMicrophoneDevices([
      { deviceId: "pci-rear", groupId: "sb-g1", label: "HD Audio Input" },
      { deviceId: "pci-front", groupId: "sb-g2", label: "HD Audio Input" }
    ]);

    expect(devices[0].displayLabel).toBe("HD Audio Input · sb-g1");
    expect(devices[1].displayLabel).toBe("HD Audio Input · sb-g2");
  });

  it("flags obvious loopback endpoints without hiding analog capture inputs", () => {
    expect(isLoopbackLikeAudioInput({ label: "Stereo Mix (Realtek(R) Audio)", displayLabel: "" })).toBe(true);
    expect(isLoopbackLikeAudioInput({ label: "Line In (Realtek(R) Audio)", displayLabel: "" })).toBe(false);
  });
});
