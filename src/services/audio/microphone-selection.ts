import type { RuntimeConfig, MicrophoneAssignment, MicrophoneDevice, TechnicalIssue } from "../../shared/types.js";
import { findMatchingPersistedMicrophone } from "./persisted-microphone-id.js";
import { filterSelectableMicrophones } from "./selectable-microphones.js";

function sortDevices(devices: MicrophoneDevice[]): MicrophoneDevice[] {
  return [...devices].sort((left, right) => {
    const leftKey = `${left.label}|${left.deviceId}`;
    const rightKey = `${right.label}|${right.deviceId}`;
    return leftKey.localeCompare(rightKey, "it");
  });
}

function findConfiguredDevice(devices: MicrophoneDevice[], configuredValue: string | null): MicrophoneDevice | null {
  if (!configuredValue) {
    return null;
  }

  return findMatchingPersistedMicrophone(devices, configuredValue);
}

export function selectMicrophoneAssignments(
  devices: MicrophoneDevice[],
  config: RuntimeConfig
): {
  assignments: MicrophoneAssignment[];
  issues: TechnicalIssue[];
} {
  const uniqueDevices = sortDevices(
    filterSelectableMicrophones(devices).filter(
      (device, index, all) =>
        all.findIndex((candidate) => candidate.deviceId === device.deviceId) === index
    )
  );

  const issues: TechnicalIssue[] = [];

  // 1-microphone kiosk fallback: when the runtime is in kiosk mode with a
  // dual-dedicated profile but only one selectable microphone is present,
  // treat the session as single-shared so the kiosk can start without manual
  // reconfiguration.  Two or more microphones keep the configured profile.
  const oneMicFallbackActive =
    config.appMode === "kiosk" &&
    config.microphonePttMode === "dual-dedicated" &&
    uniqueDevices.length === 1;

  const sharedMicrophoneMode = oneMicFallbackActive || config.microphonePttMode === "single-shared";

  const configuredSharedMicrophone = sharedMicrophoneMode
    ? findConfiguredDevice(uniqueDevices, config.micAId ?? config.micBId)
    : null;
  const requiresConfiguredMicA = !sharedMicrophoneMode && Boolean(config.micAId);
  const requiresConfiguredMicB = !sharedMicrophoneMode && Boolean(config.micBId);
  // When the 1-mic kiosk fallback is active we always accept the available device
  // regardless of previously configured mic IDs, so we never block on a missing
  // persisted ID during the fallback.
  const requiresConfiguredSharedMicrophone =
    sharedMicrophoneMode && !oneMicFallbackActive && Boolean(config.micAId ?? config.micBId);

  let micA = sharedMicrophoneMode ? configuredSharedMicrophone : findConfiguredDevice(uniqueDevices, config.micAId);
  let micB = sharedMicrophoneMode ? configuredSharedMicrophone : findConfiguredDevice(uniqueDevices, config.micBId);

  if (!micA && !requiresConfiguredMicA && !requiresConfiguredSharedMicrophone) {
    micA = uniqueDevices[0] ?? null;
  }

  if (!micB && !requiresConfiguredMicB && !requiresConfiguredSharedMicrophone) {
    micB = sharedMicrophoneMode
      ? micA ?? uniqueDevices[0] ?? null
      : uniqueDevices.find((device) => device.deviceId !== micA?.deviceId) ?? null;
  }

  if (!sharedMicrophoneMode && !micA) {
    issues.push({
      code: "missing-microphone-a",
      message: "Microfono A non rilevato.",
      retryable: true,
      side: "A"
    });
  }

  if (!micB) {
    issues.push({
      code: "missing-microphone-b",
      message: sharedMicrophoneMode ? "Microfono condiviso non rilevato." : "Microfono B non rilevato.",
      retryable: true,
      side: "B"
    });
  }

  if (!sharedMicrophoneMode && micA && micB && micA.deviceId === micB.deviceId) {
    issues.push({
      code: "missing-microphone-b",
      message: "Servono due microfoni distinti.",
      retryable: true,
      side: "B"
    });
    micB = null;
  }

  const assignments: MicrophoneAssignment[] = [];

  if (micA) {
    assignments.push({ side: "A", deviceId: micA.deviceId, label: micA.displayLabel ?? micA.label });
  }

  if (micB) {
    assignments.push({ side: "B", deviceId: micB.deviceId, label: micB.displayLabel ?? micB.label });
  }

  return { assignments, issues };
}
