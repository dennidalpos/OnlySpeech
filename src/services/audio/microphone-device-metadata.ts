import type { MicrophoneDevice } from "../../shared/types.js";
import {
  classifyAudioDeviceLabel,
  getAudioDeviceCategoryLabel,
  type AudioDeviceTransport
} from "./audio-device-classification.js";

export const UNNAMED_MICROPHONE_LABEL = "Microfono senza nome";

export type AudioInputRole =
  | "front-mic"
  | "rear-mic"
  | "line-in"
  | "microphone-array"
  | "headset-mic"
  | "microphone"
  | "hd-audio-input"
  | "virtual-loopback"
  | "generic-input";

interface MicrophoneMetadata {
  connectionType: AudioDeviceTransport;
  connectionLabel: string;
  displayLabel: string;
  normalizedLabel: string;
  audioInputRole: AudioInputRole;
}

const VENDOR_TOKENS = [
  "realtek",
  "conexant",
  "via",
  "c-media",
  "cmedia",
  "sound blaster",
  "x-fi",
  "creative",
  "intel smart sound",
  "nahimic",
  "ess sabre"
] as const;

const LOOPBACK_PATTERNS = [
  "stereo mix",
  "loopback",
  "what u hear",
  "what you hear",
  "mixage stereo",
  "mixage stéréo",
  "monitor of",
  "cable output",
  "voicemeter",
  "vb-audio",
  "wave out mix"
] as const;

const GENERIC_LABEL_PATTERNS = [
  "microfono",
  "microphone",
  "audio input",
  "hd audio input",
  "high definition audio input",
  "input",
  "ingresso audio"
] as const;

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function sanitizeMicrophoneLabel(label: string): string {
  const sanitized = collapseWhitespace(label);
  return sanitized.length > 0 ? sanitized : UNNAMED_MICROPHONE_LABEL;
}

export function normalizeMicrophoneLabel(label: string): string {
  return sanitizeMicrophoneLabel(label)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getAudioInputRole(label: string): AudioInputRole {
  const normalized = ` ${normalizeMicrophoneLabel(label)} `;

  if (LOOPBACK_PATTERNS.some((pattern) => normalized.includes(` ${pattern} `))) {
    return "virtual-loopback";
  }

  if (normalized.includes(" front mic ") || normalized.includes(" front microphone ") || normalized.includes(" front panel mic ")) {
    return "front-mic";
  }

  if (normalized.includes(" rear mic ") || normalized.includes(" rear microphone ")) {
    return "rear-mic";
  }

  if (normalized.includes(" line in ") || normalized.includes(" linein ") || normalized.includes(" aux in ")) {
    return "line-in";
  }

  if (normalized.includes(" microphone array ") || normalized.includes(" mic array ") || normalized.includes(" array microphone ")) {
    return "microphone-array";
  }

  if (normalized.includes(" headset mic ") || normalized.includes(" headset microphone ") || normalized.includes(" hands free ")) {
    return "headset-mic";
  }

  if (normalized.includes(" hd audio input ") || normalized.includes(" high definition audio input ")) {
    return "hd-audio-input";
  }

  if (
    normalized.includes(" microphone ") ||
    normalized.includes(" microfono ") ||
    normalized.includes(" mic in ") ||
    normalized.includes(" mic input ") ||
    /\bmic\b/.test(normalized)
  ) {
    return "microphone";
  }

  return "generic-input";
}

export function isLoopbackLikeAudioInput(device: Pick<MicrophoneDevice, "label" | "displayLabel">): boolean {
  const normalized = ` ${normalizeMicrophoneLabel(device.displayLabel || device.label)} `;
  return LOOPBACK_PATTERNS.some((pattern) => normalized.includes(` ${pattern} `));
}

function getVendorToken(label: string): string | null {
  const normalized = ` ${normalizeMicrophoneLabel(label)} `;
  const token = VENDOR_TOKENS.find((candidate) => normalized.includes(` ${candidate} `));
  return token ?? null;
}

function getRoleDisplayLabel(role: AudioInputRole, transport: AudioDeviceTransport): string {
  switch (role) {
    case "front-mic":
      return "Front mic";
    case "rear-mic":
      return "Rear mic";
    case "line-in":
      return "Line in";
    case "microphone-array":
      return "Microphone array";
    case "headset-mic":
      return "Microfono headset";
    case "microphone":
      return transport === "analog" ? "Microfono analogico" : "Microfono";
    case "hd-audio-input":
      return "HD Audio input";
    case "virtual-loopback":
      return "Loopback virtuale";
    default:
      return transport === "analog" ? "Ingresso audio analogico" : "Ingresso audio";
  }
}

function isGenericDisplayCandidate(label: string): boolean {
  const normalized = normalizeMicrophoneLabel(label);
  return GENERIC_LABEL_PATTERNS.includes(normalized as (typeof GENERIC_LABEL_PATTERNS)[number]);
}

function buildBaseDisplayLabel(device: Pick<MicrophoneDevice, "deviceId" | "groupId" | "label">): string {
  const label = sanitizeMicrophoneLabel(device.label);
  const transport = classifyAudioDeviceLabel(label);
  const role = getAudioInputRole(label);
  const vendor = getVendorToken(label);
  const generic = label === UNNAMED_MICROPHONE_LABEL || isGenericDisplayCandidate(label);

  if (!generic) {
    return label;
  }

  const roleLabel = getRoleDisplayLabel(role, transport);
  if (vendor) {
    return `${roleLabel} (${vendor})`;
  }

  if (label !== UNNAMED_MICROPHONE_LABEL) {
    return label;
  }

  return roleLabel;
}

function shortStableHandle(device: Pick<MicrophoneDevice, "deviceId" | "groupId">): string {
  const source = device.groupId.trim() || device.deviceId.trim();
  if (source.length <= 6) {
    return source || "input";
  }

  return source.slice(-6);
}

export function getMicrophoneMetadata(
  device: Pick<MicrophoneDevice, "deviceId" | "groupId" | "label">,
  devices: ReadonlyArray<Pick<MicrophoneDevice, "deviceId" | "groupId" | "label">> = []
): MicrophoneMetadata {
  const sanitizedLabel = sanitizeMicrophoneLabel(device.label);
  const connectionType = classifyAudioDeviceLabel(sanitizedLabel);
  const baseDisplayLabel = buildBaseDisplayLabel(device);
  const duplicateCount = devices.filter((candidate) => buildBaseDisplayLabel(candidate) === baseDisplayLabel).length;
  const displayLabel =
    duplicateCount > 1 ? `${baseDisplayLabel} · ${shortStableHandle(device)}` : baseDisplayLabel;

  return {
    connectionType,
    connectionLabel: getAudioDeviceCategoryLabel(connectionType),
    displayLabel,
    normalizedLabel: normalizeMicrophoneLabel(sanitizedLabel),
    audioInputRole: getAudioInputRole(sanitizedLabel)
  };
}

export function enrichMicrophoneDevices<T extends Pick<MicrophoneDevice, "deviceId" | "groupId" | "label">>(
  devices: readonly T[]
): Array<T & MicrophoneMetadata> {
  return devices.map((device) => ({
    ...device,
    ...getMicrophoneMetadata(device, devices)
  }));
}
