import { describe, expect, it } from "vitest";
import { classifyAudioDeviceLabel, getAudioDeviceCategoryLabel } from "../../src/services/audio/audio-device-classification.js";

describe("audio device classification", () => {
  it("classifies integrated analog devices", () => {
    expect(classifyAudioDeviceLabel("Microfono (Realtek(R) Audio)")).toBe("analog");
    expect(classifyAudioDeviceLabel("Rear Mic (Sound Blaster Audigy PCIe)")).toBe("analog");
    expect(classifyAudioDeviceLabel("Line In (C-Media PCI Audio Device)")).toBe("analog");
    expect(getAudioDeviceCategoryLabel("analog")).toBe("Audio analogico / integrato");
  });

  it("classifies usb devices", () => {
    expect(classifyAudioDeviceLabel("USB Microphone")).toBe("usb");
  });

  it("classifies obvious loopback inputs as virtual", () => {
    expect(classifyAudioDeviceLabel("Stereo Mix (Realtek(R) Audio)")).toBe("virtual");
  });
});
