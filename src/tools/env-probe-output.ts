import type { AudioDeviceTransport } from "../services/audio/audio-device-classification.js";
import { enrichMicrophoneDevices } from "../services/audio/microphone-device-metadata.js";
import { getPersistedMicrophoneId } from "../services/audio/persisted-microphone-id.js";
import { createRuntimeEnvDefaults } from "../shared/runtime-env-normalization.js";
import {
  RUNTIME_ENV_KEY_ORDER,
  type RuntimeEnvKey
} from "../shared/runtime-env-contract.js";

export interface ProbeDisplayInfo {
  displayId: number;
  label: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor: number;
}

export interface ProbeMicrophoneInfo {
  deviceId: string;
  groupId: string;
  label: string;
  displayLabel?: string;
  normalizedLabel?: string;
  audioInputRole?: string;
  connectionType?: AudioDeviceTransport;
  connectionLabel?: string;
}

export interface EnvProbeResult {
  displays: ProbeDisplayInfo[];
  microphones: ProbeMicrophoneInfo[];
  microphonePermissionGranted: boolean;
  microphoneError: string | null;
}

export type EnvKey = RuntimeEnvKey;

export interface EnvSelections {
  displayAId: string;
  displayBId: string;
  micAId: string;
  micBId: string;
}

const NON_SELECTABLE_DEVICE_IDS = new Set(["default", "communications"]);

export const ENV_KEY_ORDER = [...RUNTIME_ENV_KEY_ORDER] as const;

function sortDisplays(displays: ProbeDisplayInfo[]): ProbeDisplayInfo[] {
  return [...displays].sort((left, right) => {
    if (left.bounds.x !== right.bounds.x) {
      return left.bounds.x - right.bounds.x;
    }

    return left.bounds.y - right.bounds.y;
  });
}

function sortMicrophones(microphones: ProbeMicrophoneInfo[]): ProbeMicrophoneInfo[] {
  return enrichMicrophoneDevices([...microphones])
    .filter((microphone) => !NON_SELECTABLE_DEVICE_IDS.has(microphone.deviceId))
    .filter(
      (microphone, index, all) =>
        all.findIndex((candidate) => candidate.deviceId === microphone.deviceId) === index
    )
    .sort((left, right) =>
      `${left.displayLabel ?? left.label}|${left.deviceId}`.localeCompare(
        `${right.displayLabel ?? right.label}|${right.deviceId}`,
        "it"
      )
    );
}

function normalizeBaseEnv(baseEnv: Partial<Record<EnvKey, string>>): Record<EnvKey, string> {
  return createRuntimeEnvDefaults(baseEnv);
}

export function createDefaultEnvValues(
  baseEnv: Partial<Record<EnvKey, string>>
): Record<EnvKey, string> {
  return normalizeBaseEnv(baseEnv);
}

export function normalizeProbeResult(probeResult: EnvProbeResult): EnvProbeResult {
  return {
    displays: sortDisplays(probeResult.displays),
    microphones: sortMicrophones(probeResult.microphones),
    microphonePermissionGranted: probeResult.microphonePermissionGranted,
    microphoneError: probeResult.microphoneError
  };
}

export function applySelectionsToEnv(
  baseEnv: Partial<Record<EnvKey, string>>,
  selections: EnvSelections
): Record<EnvKey, string> {
  const env = createDefaultEnvValues(baseEnv);
  env.DISPLAY_A_ID = selections.displayAId.trim();
  env.DISPLAY_B_ID = selections.displayBId.trim();
  env.MIC_A_ID = selections.micAId.trim();
  env.MIC_B_ID = selections.micBId.trim();
  return env;
}

export function renderEnvFile(values: Partial<Record<EnvKey, string>>, comments: string[] = []): string {
  const env = createDefaultEnvValues(values);
  const envLines = ENV_KEY_ORDER.map((key) => `${key}=${env[key]}`);
  return [...comments, ...(comments.length > 0 ? [""] : []), ...envLines, ""].join("\n");
}

export function buildSuggestedEnv(
  baseEnv: Partial<Record<EnvKey, string>>,
  probeResult: EnvProbeResult
): string {
  const normalizedProbeResult = normalizeProbeResult(probeResult);
  const displays = normalizedProbeResult.displays;
  const microphones = normalizedProbeResult.microphones;
  const env = applySelectionsToEnv(baseEnv, {
    displayAId: displays[0] ? String(displays[0].displayId) : "",
    displayBId: displays[1] ? String(displays[1].displayId) : "",
    micAId: microphones[0] ? getPersistedMicrophoneId(microphones[0], microphones) : "",
    micBId: microphones[1] ? getPersistedMicrophoneId(microphones[1], microphones) : ""
  });

  const comments = [
    "# Suggested OnlySpeech .env for this PC",
    "# Display IDs are mapped left-to-right as A then B.",
    "# Microphone IDs prefer endpoint fingerprints based on stable Windows audio-input metadata, then normalized labels, then raw device IDs.",
    "# TRANSLATION_PROVIDER defaults to chatgpt. Fill only the matching provider settings before production use.",
    "# chatgpt requires CHATGPT_API_KEY, CHATGPT_MODEL, and CHATGPT_TRANSCRIBE_MODEL.",
    "# azure requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION; normalized playback diagnostics also use AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_REGION.",
    "# ollama requires OLLAMA_BASE_URL and OLLAMA_MODEL; it remains translation-only and cannot unlock live kiosk speech."
  ];

  if (!normalizedProbeResult.microphonePermissionGranted) {
    comments.push(
      `# Microphone probe did not complete successfully: ${normalizedProbeResult.microphoneError ?? "unknown error"}`
    );
  }

  if (displays.length < 2) {
    comments.push("# Fewer than two displays were detected on this PC.");
  }

  if (microphones.length < 2) {
    comments.push("# Fewer than two distinct microphones were detected in the Electron probe.");
  }

  return renderEnvFile(env, comments);
}

export function buildProbeSummary(probeResult: EnvProbeResult): EnvProbeResult {
  return normalizeProbeResult(probeResult);
}
