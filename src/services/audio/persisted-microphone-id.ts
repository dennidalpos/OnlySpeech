import type { MicrophoneDevice } from "../../shared/types.js";
import { getMicrophoneMetadata, normalizeMicrophoneLabel } from "./microphone-device-metadata.js";

export const PERSISTED_MICROPHONE_GROUP_PREFIX = "group:";
export const PERSISTED_MICROPHONE_ENDPOINT_PREFIX = "endpoint:";
export const PERSISTED_MICROPHONE_LABEL_PREFIX = "label:";

type PersistableMicrophone = Pick<MicrophoneDevice, "deviceId" | "groupId" | "label">;

interface ParsedEndpointId {
  groupId: string | null;
  role: string;
  normalizedLabel: string;
}

function encodeSegment(value: string): string {
  return encodeURIComponent(value);
}

function decodeSegment(value: string): string {
  return decodeURIComponent(value);
}

function parseEndpointId(configuredValue: string): ParsedEndpointId | null {
  if (!configuredValue.startsWith(PERSISTED_MICROPHONE_ENDPOINT_PREFIX)) {
    return null;
  }

  const parts = configuredValue.slice(PERSISTED_MICROPHONE_ENDPOINT_PREFIX.length).split(":");
  if (parts.length !== 2 && parts.length !== 3) {
    return null;
  }

  if (parts.length === 2) {
    return {
      groupId: null,
      role: decodeSegment(parts[0]),
      normalizedLabel: decodeSegment(parts[1])
    };
  }

  return {
    groupId: decodeSegment(parts[0]),
    role: decodeSegment(parts[1]),
    normalizedLabel: decodeSegment(parts[2])
  };
}

function parseLabelId(configuredValue: string): string | null {
  if (!configuredValue.startsWith(PERSISTED_MICROPHONE_LABEL_PREFIX)) {
    return null;
  }

  return decodeSegment(configuredValue.slice(PERSISTED_MICROPHONE_LABEL_PREFIX.length));
}

function buildEndpointId(device: PersistableMicrophone): string | null {
  const groupId = device.groupId.trim();
  if (!groupId) {
    return null;
  }

  const metadata = getMicrophoneMetadata(device);
  return [
    PERSISTED_MICROPHONE_ENDPOINT_PREFIX,
    encodeSegment(groupId),
    ":",
    encodeSegment(metadata.audioInputRole),
    ":",
    encodeSegment(metadata.normalizedLabel || "input")
  ].join("");
}

function buildLabelId(device: PersistableMicrophone): string | null {
  const normalizedLabel = normalizeMicrophoneLabel(device.label);
  if (!normalizedLabel) {
    return null;
  }

  return `${PERSISTED_MICROPHONE_LABEL_PREFIX}${encodeSegment(normalizedLabel)}`;
}

function hasUniqueNormalizedLabel(
  device: PersistableMicrophone,
  devices: ReadonlyArray<PersistableMicrophone>
): boolean {
  const normalizedLabel = normalizeMicrophoneLabel(device.label);
  if (!normalizedLabel) {
    return false;
  }

  return (
    devices.filter(
      (candidate) =>
        candidate.deviceId !== device.deviceId && normalizeMicrophoneLabel(candidate.label) === normalizedLabel
    ).length === 0
  );
}

function endpointMatchesDevice(device: PersistableMicrophone, endpointId: ParsedEndpointId): boolean {
  if (endpointId.groupId && (!device.groupId || device.groupId !== endpointId.groupId)) {
    return false;
  }

  const metadata = getMicrophoneMetadata(device);
  return metadata.audioInputRole === endpointId.role && metadata.normalizedLabel === endpointId.normalizedLabel;
}

export function getPersistedMicrophoneId(
  device: PersistableMicrophone,
  devices: ReadonlyArray<PersistableMicrophone> = []
): string {
  const endpointId = buildEndpointId(device);
  if (endpointId) {
    return endpointId;
  }

  if (hasUniqueNormalizedLabel(device, devices)) {
    return buildLabelId(device) ?? device.label;
  }

  return device.deviceId;
}

export function findMatchingPersistedMicrophone<T extends PersistableMicrophone>(
  devices: ReadonlyArray<T>,
  configuredValue: string | null
): T | null {
  if (!configuredValue) {
    return null;
  }

  const directDeviceIdMatch = devices.find((device) => device.deviceId === configuredValue);
  if (directDeviceIdMatch) {
    return directDeviceIdMatch;
  }

  const directLabelMatch = devices.find((device) => device.label === configuredValue);
  if (directLabelMatch) {
    return directLabelMatch;
  }

  const endpointId = parseEndpointId(configuredValue);
  if (endpointId) {
    const exactEndpointMatch = devices.find((device) => endpointMatchesDevice(device, endpointId));
    if (exactEndpointMatch) {
      return exactEndpointMatch;
    }

    if (endpointId.groupId) {
      const sameGroup = devices.filter((device) => device.groupId === endpointId.groupId);
      const sameGroupRole = sameGroup.filter(
        (device) => getMicrophoneMetadata(device).audioInputRole === endpointId.role
      );

      if (sameGroupRole.length === 1) {
        return sameGroupRole[0];
      }

      if (sameGroup.length === 1) {
        return sameGroup[0];
      }
    }

    const sameRoleAndLabel = devices.filter((device) => {
      const metadata = getMicrophoneMetadata(device);
      return metadata.audioInputRole === endpointId.role && metadata.normalizedLabel === endpointId.normalizedLabel;
    });
    if (sameRoleAndLabel.length === 1) {
      return sameRoleAndLabel[0];
    }

    const sameNormalizedLabel = devices.filter(
      (device) => getMicrophoneMetadata(device).normalizedLabel === endpointId.normalizedLabel
    );
    if (sameNormalizedLabel.length === 1) {
      return sameNormalizedLabel[0];
    }

    const sameRole = devices.filter(
      (device) => getMicrophoneMetadata(device).audioInputRole === endpointId.role
    );
    if (sameRole.length === 1) {
      return sameRole[0];
    }

    return null;
  }

  const labelId = parseLabelId(configuredValue);
  if (labelId) {
    const labelMatches = devices.filter((device) => normalizeMicrophoneLabel(device.label) === labelId);
    return labelMatches.length === 1 ? labelMatches[0] : null;
  }

  if (configuredValue.startsWith(PERSISTED_MICROPHONE_GROUP_PREFIX)) {
    const groupId = configuredValue.slice(PERSISTED_MICROPHONE_GROUP_PREFIX.length);
    const matches = devices.filter((device) => device.groupId.length > 0 && device.groupId === groupId);
    return matches.length === 1 ? matches[0] : null;
  }

  return null;
}

export function matchesPersistedMicrophoneId(
  device: PersistableMicrophone,
  configuredValue: string | null
): boolean {
  return findMatchingPersistedMicrophone([device], configuredValue) !== null;
}
