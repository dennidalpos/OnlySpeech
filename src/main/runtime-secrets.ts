import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import process from "node:process";
import { parse as parseEnv } from "dotenv";
import type { EnvKey } from "../tools/env-probe-output.js";
import {
  SECURE_RUNTIME_ENV_KEYS,
  type SecureRuntimeEnvKey
} from "../shared/runtime-env-contract.js";
import { getRuntimeEnvFilePath } from "./runtime-paths.js";

export const SECURE_RUNTIME_SECRET_KEYS = SECURE_RUNTIME_ENV_KEYS;
export type SecureRuntimeSecretKey = SecureRuntimeEnvKey;
const requireFromRuntimeSecrets = createRequire(import.meta.url);

interface SecureSecretFile {
  schemaVersion: 1;
  encryptedWith: "electron.safeStorage";
  secrets: Partial<Record<SecureRuntimeSecretKey, string>>;
}

export interface RuntimeSecretStorageAdapter {
  isEncryptionAvailable(): boolean;
  encryptString(value: string): Buffer;
  decryptString(value: Buffer): string;
}

export interface RuntimeSecretContext {
  runtimeRoot: string;
  secretsFilePath: string;
  secureStorageEnabled: boolean;
  safeStorageAdapter?: RuntimeSecretStorageAdapter;
}

function getSafeStorageAdapter(adapter?: RuntimeSecretStorageAdapter): RuntimeSecretStorageAdapter {
  return adapter ?? loadElectronSafeStorage();
}

export function isSecureRuntimeSecretStorageEnabled(options: {
  isPackaged: boolean;
  platform?: NodeJS.Platform;
}): boolean {
  return options.isPackaged && (options.platform ?? process.platform) === "win32";
}

export function getSecureRuntimeSecretKeys(): readonly SecureRuntimeSecretKey[] {
  return SECURE_RUNTIME_SECRET_KEYS;
}

export function redactSecureRuntimeSecrets<T extends Partial<Record<EnvKey, string>>>(envValues: T): T {
  const nextValues = { ...envValues };

  for (const key of SECURE_RUNTIME_SECRET_KEYS) {
    if (key in nextValues) {
      nextValues[key] = "";
    }
  }

  return nextValues;
}

export function loadRuntimeEnvironment(context: RuntimeSecretContext): Partial<Record<EnvKey, string>> {
  const envValues = existsSync(context.runtimeRoot)
    ? readRuntimeEnvFile(context.runtimeRoot)
    : {};

  if (!context.secureStorageEnabled) {
    return envValues;
  }

  return {
    ...envValues,
    ...loadStoredRuntimeSecrets(context)
  };
}

export function loadStoredRuntimeSecrets(context: RuntimeSecretContext): Partial<Record<SecureRuntimeSecretKey, string>> {
  if (!context.secureStorageEnabled || !existsSync(context.secretsFilePath)) {
    return {};
  }

  const adapter = getSafeStorageAdapter(context.safeStorageAdapter);
  if (!adapter.isEncryptionAvailable()) {
    throw new Error("Windows secure storage is not available for OnlySpeech release secrets.");
  }

  const parsedFile = JSON.parse(readFileSync(context.secretsFilePath, "utf8")) as SecureSecretFile;
  const nextSecrets: Partial<Record<SecureRuntimeSecretKey, string>> = {};

  for (const key of SECURE_RUNTIME_SECRET_KEYS) {
    const encryptedValue = parsedFile.secrets?.[key];
    if (!encryptedValue) {
      continue;
    }

    nextSecrets[key] = adapter.decryptString(Buffer.from(encryptedValue, "base64"));
  }

  return nextSecrets;
}

export function persistRuntimeSecrets(
  envValues: Partial<Record<EnvKey, string>>,
  context: RuntimeSecretContext
): { storedKeys: SecureRuntimeSecretKey[] } {
  if (!context.secureStorageEnabled) {
    return { storedKeys: [] };
  }

  const adapter = getSafeStorageAdapter(context.safeStorageAdapter);
  if (!adapter.isEncryptionAvailable()) {
    throw new Error("Windows secure storage is not available for OnlySpeech release secrets.");
  }

  const secretsToPersist = Object.fromEntries(
    SECURE_RUNTIME_SECRET_KEYS
      .map((key) => [key, envValues[key]?.trim() ?? ""] as const)
      .filter(([, value]) => value.length > 0)
      .map(([key, value]) => [key, adapter.encryptString(value).toString("base64")])
  ) as Partial<Record<SecureRuntimeSecretKey, string>>;

  const storedKeys = Object.keys(secretsToPersist) as SecureRuntimeSecretKey[];
  if (storedKeys.length === 0) {
    rmSync(context.secretsFilePath, { force: true });
    return { storedKeys: [] };
  }

  mkdirSync(dirname(context.secretsFilePath), { recursive: true });
  writeFileSync(
    context.secretsFilePath,
    JSON.stringify(
      {
        schemaVersion: 1,
        encryptedWith: "electron.safeStorage",
        secrets: secretsToPersist
      } satisfies SecureSecretFile,
      null,
      2
    ) + "\n",
    "utf8"
  );

  return { storedKeys };
}

function readRuntimeEnvFile(runtimeRoot: string): Partial<Record<EnvKey, string>> {
  try {
    return parseEnv(readFileSync(getRuntimeEnvFilePath(runtimeRoot), "utf8")) as Partial<Record<EnvKey, string>>;
  } catch {
    return {};
  }
}

function loadElectronSafeStorage(): RuntimeSecretStorageAdapter {
  const electronModule = requireElectronModule();
  const electronSafeStorage = electronModule?.safeStorage;

  if (!electronSafeStorage) {
    throw new Error("Electron safeStorage is unavailable for OnlySpeech secure runtime secrets.");
  }

  return electronSafeStorage;
}

function requireElectronModule(): { safeStorage?: RuntimeSecretStorageAdapter } | null {
  try {
    // Keep the electron dependency lazy so Node-side tests can import this module without a packaged runtime.
    return requireFromRuntimeSecrets("electron") as { safeStorage?: RuntimeSecretStorageAdapter };
  } catch {
    return null;
  }
}
