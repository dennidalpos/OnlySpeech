import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { ActivationClaims, ActivationPlan } from "./activation-types.js";

export type PersistedActivationClaims = ActivationClaims;

export interface PersistedActivationState {
  schemaVersion: 1;
  activationToken: string | null;
  claims: PersistedActivationClaims;
  activatedAt: string;
  lastValidatedAt: string;
  lastTrustedUtc: string;
}

export interface ActivationStorageEncryptionAdapter {
  isEncryptionAvailable(): boolean;
  encryptString(value: string): Buffer;
  decryptString(value: Buffer): string;
}

interface EncryptedActivationStateFile {
  schemaVersion: 1;
  encryptedWith: "electron.safeStorage";
  data: string;
}

const ACTIVATION_STATE_SCHEMA_VERSION = 1;
const ACTIVATION_PLANS = new Set<ActivationPlan>(["monthly", "semiannual", "annual", "lifetime", "trial"]);

export function createPersistedActivationState(input: {
  activationToken: string | null;
  claims: PersistedActivationClaims;
  activatedAt: string;
  lastValidatedAt?: string;
  lastTrustedUtc?: string;
}): PersistedActivationState {
  return {
    schemaVersion: ACTIVATION_STATE_SCHEMA_VERSION,
    activationToken: input.activationToken,
    claims: {
      ...input.claims
    },
    activatedAt: input.activatedAt,
    lastValidatedAt: input.lastValidatedAt ?? input.activatedAt,
    lastTrustedUtc: input.lastTrustedUtc ?? input.lastValidatedAt ?? input.activatedAt
  };
}

export function loadPersistedActivationState(
  activationStateFilePath: string,
  adapter?: ActivationStorageEncryptionAdapter
): PersistedActivationState | null {
  if (!existsSync(activationStateFilePath)) {
    return null;
  }

  const raw = JSON.parse(readFileSync(activationStateFilePath, "utf8")) as unknown;

  if (isEncryptedFile(raw)) {
    if (!adapter || !adapter.isEncryptionAvailable()) {
      throw new Error("Activation state is encrypted but no decryption adapter is available.");
    }
    const decrypted = adapter.decryptString(Buffer.from(raw.data, "base64"));
    const parsed = JSON.parse(decrypted) as unknown;
    assertActivationStateRecord(parsed);
    return parsed;
  }

  assertActivationStateRecord(raw);
  return raw;
}

export function persistActivationState(
  activationStateFilePath: string,
  state: PersistedActivationState,
  adapter?: ActivationStorageEncryptionAdapter
): PersistedActivationState {
  assertActivationStateRecord(state);
  mkdirSync(dirname(activationStateFilePath), { recursive: true });

  if (adapter && adapter.isEncryptionAvailable()) {
    const plainJson = JSON.stringify(state, null, 2) + "\n";
    const encryptedFile: EncryptedActivationStateFile = {
      schemaVersion: ACTIVATION_STATE_SCHEMA_VERSION,
      encryptedWith: "electron.safeStorage",
      data: adapter.encryptString(plainJson).toString("base64")
    };
    writeFileSync(activationStateFilePath, JSON.stringify(encryptedFile, null, 2) + "\n", "utf8");
  } else {
    writeFileSync(activationStateFilePath, JSON.stringify(state, null, 2) + "\n", "utf8");
  }

  return state;
}

export function clearPersistedActivationState(activationStateFilePath: string): void {
  rmSync(activationStateFilePath, { force: true });
}

function isEncryptedFile(value: unknown): value is EncryptedActivationStateFile {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).encryptedWith === "electron.safeStorage" &&
    typeof (value as Record<string, unknown>).data === "string"
  );
}

function assertActivationStateRecord(value: unknown): asserts value is PersistedActivationState {
  if (!isObjectRecord(value)) {
    throw new Error("Activation state must be an object.");
  }

  if (value.schemaVersion !== ACTIVATION_STATE_SCHEMA_VERSION) {
    throw new Error("Unsupported activation state schema.");
  }

  if (!isObjectRecord(value.claims)) {
    throw new Error("Activation state must include persisted claims.");
  }

  // For trial plans, activationToken can be null. For other plans, it must be a non-empty string.
  if ((value.claims as Record<string, unknown>).plan === "trial") {
    // Trial: activationToken is expected to be null
    if (value.activationToken !== null) {
      throw new Error("Trial activation state must have null activationToken.");
    }
  } else {
    // Non-trial: activationToken must be a non-empty string
    if (typeof value.activationToken !== "string" || value.activationToken.trim().length === 0) {
      throw new Error("Activation state must include a non-empty activation token.");
    }
  }

  if (typeof value.claims.keyId !== "string" || value.claims.keyId.trim().length === 0) {
    throw new Error("Activation state must include a non-empty keyId.");
  }

  if (typeof value.claims.email !== "string" || value.claims.email.trim().length === 0) {
    throw new Error("Activation state must include a non-empty canonical email.");
  }

  if (!ACTIVATION_PLANS.has(value.claims.plan as ActivationPlan)) {
    throw new Error("Activation state must include a supported plan.");
  }

  assertUtcTimestamp(value.claims.issuedAt, "Activation state must include a valid issuedAt timestamp.");

  if (value.claims.plan === "lifetime") {
    if (value.claims.expiresAt !== null) {
      throw new Error("Lifetime activation state must persist expiresAt as null.");
    }
  } else {
    // Trial, monthly, semiannual, annual: all must have a valid expiresAt
    assertUtcTimestamp(value.claims.expiresAt, "Activation state must include a valid expiresAt timestamp.");
  }

  assertUtcTimestamp(value.activatedAt, "Activation state must include a valid activatedAt timestamp.");
  assertUtcTimestamp(value.lastValidatedAt, "Activation state must include a valid lastValidatedAt timestamp.");
  assertUtcTimestamp(value.lastTrustedUtc, "Activation state must include a valid lastTrustedUtc timestamp.");
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assertUtcTimestamp(value: unknown, errorMessage: string): void {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(errorMessage);
  }

  const parsedTime = Date.parse(value);
  if (Number.isNaN(parsedTime) || !value.endsWith("Z")) {
    throw new Error(errorMessage);
  }
}
