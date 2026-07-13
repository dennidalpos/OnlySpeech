import {
  DEFAULT_APP_MODE,
  DEFAULT_MICROPHONE_PTT_MODE,
  SUPPORTED_APP_MODES,
  SUPPORTED_MICROPHONE_PTT_MODES,
  type AppMode,
  type MicrophonePttMode
} from "./runtime-profiles.js";
import { RUNTIME_ENV_FIELDS, type RuntimeEnvKey } from "./runtime-env-contract.js";

const RUNTIME_ENV_DEFAULTS = Object.freeze(
  Object.fromEntries(
    RUNTIME_ENV_FIELDS.map((field) => [field.key, field.defaultValue])
  )
) as Record<RuntimeEnvKey, string>;

interface NumericRule {
  fallback: string;
  integer?: boolean;
  min?: number;
  max?: number;
}

const NUMERIC_ENV_RULES: Readonly<Partial<Record<RuntimeEnvKey, NumericRule>>> = Object.freeze({
  DEMO_SLIDE_INTERVAL_SECONDS: {
    fallback: RUNTIME_ENV_DEFAULTS.DEMO_SLIDE_INTERVAL_SECONDS,
    integer: true,
    min: 1
  },
  REQUIRED_MONITORS: {
    fallback: RUNTIME_ENV_DEFAULTS.REQUIRED_MONITORS,
    integer: true,
    min: 1,
    max: 2
  },
  REQUIRED_MICROPHONES: {
    fallback: RUNTIME_ENV_DEFAULTS.REQUIRED_MICROPHONES,
    integer: true,
    min: 0,
    max: 2
  },
  IDLE_CLEAR_SECONDS: {
    fallback: RUNTIME_ENV_DEFAULTS.IDLE_CLEAR_SECONDS,
    integer: true,
    min: 0
  },
  IDLE_HARD_RESET_SECONDS: {
    fallback: RUNTIME_ENV_DEFAULTS.IDLE_HARD_RESET_SECONDS,
    integer: true,
    min: 0
  },
  PTT_RELEASE_GRACE_MS: {
    fallback: RUNTIME_ENV_DEFAULTS.PTT_RELEASE_GRACE_MS,
    integer: true,
    min: 0
  },
  PROVIDER_REQUEST_TIMEOUT_MS: {
    fallback: RUNTIME_ENV_DEFAULTS.PROVIDER_REQUEST_TIMEOUT_MS,
    integer: true,
    min: 1
  },
  OLLAMA_REQUEST_TIMEOUT_MS: {
    fallback: RUNTIME_ENV_DEFAULTS.OLLAMA_REQUEST_TIMEOUT_MS,
    integer: true,
    min: 1
  },
  CHATGPT_SILENCE_RMS_THRESHOLD: {
    fallback: RUNTIME_ENV_DEFAULTS.CHATGPT_SILENCE_RMS_THRESHOLD,
    min: 0,
    max: 1
  }
});

function normalizeBoundedNumber(value: string, rule: NumericRule): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return rule.fallback;
  }

  const normalized = rule.integer ? Math.trunc(parsed) : parsed;
  if ((rule.min !== undefined && normalized < rule.min) || (rule.max !== undefined && normalized > rule.max)) {
    return rule.fallback;
  }

  return String(normalized);
}

function normalizeAppMode(value: string | undefined): AppMode {
  return SUPPORTED_APP_MODES.includes(value as AppMode)
    ? (value as AppMode)
    : DEFAULT_APP_MODE;
}

function normalizeMicrophonePttMode(value: string | undefined): MicrophonePttMode {
  return SUPPORTED_MICROPHONE_PTT_MODES.includes(value as MicrophonePttMode)
    ? (value as MicrophonePttMode)
    : DEFAULT_MICROPHONE_PTT_MODE;
}

function normalizeEnumValue<T extends string>(value: string, supported: readonly T[], fallback: T): T {
  return supported.includes(value as T) ? (value as T) : fallback;
}

function normalizeRequiredMicrophones(
  value: string,
  appMode: AppMode,
  microphonePttMode: MicrophonePttMode
): string {
  const normalized = normalizeBoundedNumber(
    value,
    NUMERIC_ENV_RULES.REQUIRED_MICROPHONES ?? {
      fallback: RUNTIME_ENV_DEFAULTS.REQUIRED_MICROPHONES
    }
  );

  if (appMode === "demo") {
    return normalized === "0" ? normalized : "0";
  }

  if (normalized === "0") {
    return microphonePttMode === "single-shared" ? "1" : "2";
  }

  return normalized;
}

export function normalizeRuntimeEnvValues(
  values: Partial<Record<RuntimeEnvKey, string>>
): Record<RuntimeEnvKey, string> {
  const normalized = {} as Record<RuntimeEnvKey, string>;

  for (const [key, defaultValue] of Object.entries(RUNTIME_ENV_DEFAULTS) as Array<[RuntimeEnvKey, string]>) {
    normalized[key] = (values[key] ?? defaultValue).trim();
  }

  normalized.APP_MODE = normalizeAppMode(normalized.APP_MODE);
  normalized.MICROPHONE_PTT_MODE = normalizeMicrophonePttMode(normalized.MICROPHONE_PTT_MODE);
  normalized.PROVIDER_LANGUAGE_CONTRACT_MODE = normalizeEnumValue(
    normalized.PROVIDER_LANGUAGE_CONTRACT_MODE,
    ["strict", "compatible"],
    "strict"
  );
  normalized.CHATGPT_TRANSLATION_DETECTED_LANGUAGE_MODE = normalizeEnumValue(
    normalized.CHATGPT_TRANSLATION_DETECTED_LANGUAGE_MODE,
    ["off", "diagnostic", "adaptive"],
    "diagnostic"
  );

  for (const [key, rule] of Object.entries(NUMERIC_ENV_RULES) as Array<[RuntimeEnvKey, NumericRule]>) {
    if (key === "REQUIRED_MICROPHONES") {
      continue;
    }

    normalized[key] = normalizeBoundedNumber(normalized[key], rule);
  }

  normalized.REQUIRED_MICROPHONES = normalizeRequiredMicrophones(
    normalized.REQUIRED_MICROPHONES,
    normalized.APP_MODE as AppMode,
    normalized.MICROPHONE_PTT_MODE as MicrophonePttMode
  );

  return normalized;
}

export function createRuntimeEnvDefaults(
  baseEnv: Partial<Record<RuntimeEnvKey, string>> = {}
): Record<RuntimeEnvKey, string> {
  return normalizeRuntimeEnvValues(baseEnv);
}
