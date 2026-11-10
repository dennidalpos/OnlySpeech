import type { DeviceProbePayload, MicrophoneDevice, Side } from "../../shared/types.js";
import { enrichMicrophoneDevices, UNNAMED_MICROPHONE_LABEL } from "./microphone-device-metadata.js";
import { filterSelectableMicrophones } from "./selectable-microphones.js";

function stopStream(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function stringifyError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function classifyProbeFailure(error: unknown): NonNullable<DeviceProbePayload["failureKind"]> {
  const errorName =
    typeof error === "object" && error && "name" in error && typeof error.name === "string"
      ? error.name
      : "";
  const normalized = `${errorName} ${stringifyError(error)}`.toLowerCase();

  if (
    normalized.includes("notallowederror") ||
    normalized.includes("permissiondeniederror") ||
    normalized.includes("securityerror") ||
    normalized.includes("permission denied") ||
    normalized.includes("access is denied")
  ) {
    return "permission-denied";
  }

  return "device-unavailable";
}

async function enumerateAudioInputDevices(): Promise<MicrophoneDevice[]> {
  const rawDevices = await navigator.mediaDevices?.enumerateDevices?.();
  if (!rawDevices) {
    return [];
  }

  return filterSelectableMicrophones(
    enrichMicrophoneDevices(
      rawDevices
        .filter((device) => device.kind === "audioinput")
        .map<MicrophoneDevice>((device) => ({
          deviceId: device.deviceId,
          groupId: device.groupId,
          label: device.label || UNNAMED_MICROPHONE_LABEL
        }))
    )
  );
}

export async function probeAudioInputDevices(side: Side): Promise<DeviceProbePayload> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    stopStream(stream);
    const devices = await enumerateAudioInputDevices();

    return {
      side,
      devices,
      permissionGranted: true
    };
  } catch (error) {
    const failureKind = classifyProbeFailure(error);
    const devices = await enumerateAudioInputDevices().catch(() => []);

    return {
      side,
      devices,
      permissionGranted: failureKind !== "permission-denied",
      failureKind,
      error: stringifyError(error)
    };
  }
}
