// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { probeAudioInputDevices } from "../src/services/audio/media-device-probe.js";

function setMediaDevicesMock(mock: {
  getUserMedia: ReturnType<typeof vi.fn>;
  enumerateDevices: ReturnType<typeof vi.fn>;
}) {
  Object.defineProperty(window.navigator, "mediaDevices", {
    configurable: true,
    value: mock
  });
}

describe("probeAudioInputDevices", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("classifies a busy or non-acquirable microphone as device-unavailable while keeping enumerated devices", async () => {
    setMediaDevicesMock({
      getUserMedia: vi.fn(async () => {
        const error = new Error("The requested device is busy.");
        error.name = "NotReadableError";
        throw error;
      }),
      enumerateDevices: vi.fn(async () => [
        {
          kind: "audioinput",
          deviceId: "mic-a",
          groupId: "group-a",
          label: "USB Microphone A"
        }
      ])
    });

    await expect(probeAudioInputDevices("A")).resolves.toEqual(
      expect.objectContaining({
        side: "A",
        devices: [
          expect.objectContaining({
            deviceId: "mic-a",
            groupId: "group-a",
            label: "USB Microphone A",
            displayLabel: "USB Microphone A"
          })
        ],
        permissionGranted: true,
        failureKind: "device-unavailable",
        error: "The requested device is busy."
      })
    );
  });

  it("classifies a denied permission probe without exposing phantom microphone assignments", async () => {
    setMediaDevicesMock({
      getUserMedia: vi.fn(async () => {
        const error = new Error("Permission denied by the user.");
        error.name = "NotAllowedError";
        throw error;
      }),
      enumerateDevices: vi.fn(async () => [])
    });

    await expect(probeAudioInputDevices("B")).resolves.toEqual({
      side: "B",
      devices: [],
      permissionGranted: false,
      failureKind: "permission-denied",
      error: "Permission denied by the user."
    });
  });

  it("keeps generic analog audioinput devices even when they are not labelled as usb or microphone", async () => {
    setMediaDevicesMock({
      getUserMedia: vi.fn(async () => ({
        getTracks: () => [{ stop: vi.fn() }]
      })),
      enumerateDevices: vi.fn(async () => [
        {
          kind: "audioinput",
          deviceId: "analog-line-in",
          groupId: "realtek-g1",
          label: "HD Audio Input"
        }
      ])
    });

    const result = await probeAudioInputDevices("A");

    expect(result.permissionGranted).toBe(true);
    expect(result.devices).toEqual([
      expect.objectContaining({
        deviceId: "analog-line-in",
        groupId: "realtek-g1",
        label: "HD Audio Input",
        displayLabel: "HD Audio Input",
        audioInputRole: "hd-audio-input"
      })
    ]);
  });

  it("excludes obvious loopback-only inputs from the selectable microphone list", async () => {
    setMediaDevicesMock({
      getUserMedia: vi.fn(async () => ({
        getTracks: () => [{ stop: vi.fn() }]
      })),
      enumerateDevices: vi.fn(async () => [
        {
          kind: "audioinput",
          deviceId: "stereo-mix",
          groupId: "realtek-g1",
          label: "Stereo Mix (Realtek(R) Audio)"
        }
      ])
    });

    const result = await probeAudioInputDevices("A");

    expect(result.devices).toEqual([]);
  });
});
