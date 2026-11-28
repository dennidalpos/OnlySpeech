import type { MicrophoneDevice } from "../../shared/types.js";
import { isLoopbackLikeAudioInput } from "./microphone-device-metadata.js";

const NON_SELECTABLE_DEVICE_IDS = new Set(["default", "communications"]);

export function isSelectableMicrophoneDevice(device: MicrophoneDevice): boolean {
  return !NON_SELECTABLE_DEVICE_IDS.has(device.deviceId) && !isLoopbackLikeAudioInput(device);
}

export function filterSelectableMicrophones(devices: MicrophoneDevice[]): MicrophoneDevice[] {
  const concreteDevices = devices.filter(isSelectableMicrophoneDevice).filter(
    (device, index, all) => all.findIndex((candidate) => candidate.deviceId === device.deviceId) === index
  );

  if (concreteDevices.length > 0) {
    return concreteDevices;
  }

  // Some Windows/Electron environments expose only browser alias ids.
  // Fall back to those entries so the wizard can still show selectable inputs.
  const aliasDevices = devices
    .filter((device) => NON_SELECTABLE_DEVICE_IDS.has(device.deviceId) && !isLoopbackLikeAudioInput(device))
    .filter((device, index, all) => all.findIndex((candidate) => candidate.deviceId === device.deviceId) === index);

  return aliasDevices;
}
