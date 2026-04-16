import { DEFAULT_APP_MODE, DEFAULT_MICROPHONE_PTT_MODE } from "./runtime-profiles.js";
import { normalizeRuntimeEnvValues } from "./runtime-env-normalization.js";

interface RuntimeEnvFieldDefinition {
  key: string;
  defaultValue: string;
  secret?: true;
}

export const RUNTIME_ENV_FIELDS = [
  { key: "APP_MODE", defaultValue: DEFAULT_APP_MODE },
  { key: "MICROPHONE_PTT_MODE", defaultValue: DEFAULT_MICROPHONE_PTT_MODE },
  { key: "SETUP_UI_LANGUAGE", defaultValue: "en" },
  { key: "SELECTOR_UI_LANGUAGE_A", defaultValue: "" },
  { key: "SELECTOR_UI_LANGUAGE_B", defaultValue: "" },
  { key: "DEMO_SLIDE_INTERVAL_SECONDS", defaultValue: "8" },
  { key: "TEXT_TO_SPEECH_ENABLED", defaultValue: "true" },
  { key: "RUNTIME_DISCLOSURE_MODE", defaultValue: "standard" },
  { key: "RUNTIME_DISCLOSURE_CUSTOM_TEXT", defaultValue: "" },
  { key: "REQUIRED_MONITORS", defaultValue: "2" },
  { key: "REQUIRED_MICROPHONES", defaultValue: "2" },
  { key: "DISPLAY_A_ID", defaultValue: "" },
  { key: "DISPLAY_B_ID", defaultValue: "" },
  { key: "MIC_A_ID", defaultValue: "" },
  { key: "MIC_B_ID", defaultValue: "" },
  { key: "IDLE_CLEAR_SECONDS", defaultValue: "60" },
  { key: "IDLE_HARD_RESET_SECONDS", defaultValue: "180" },
  { key: "PTT_RELEASE_GRACE_MS", defaultValue: "400" },
  { key: "PROVIDER_REQUEST_TIMEOUT_MS", defaultValue: "45000" },
  { key: "CHATGPT_SILENCE_RMS_THRESHOLD", defaultValue: "0.02" },
  { key: "VISITOR_CONVERSATION_HISTORY_ENABLED", defaultValue: "false" },
  { key: "AUDIO_ECHO_CANCELLATION", defaultValue: "true" },
  { key: "AUDIO_NOISE_SUPPRESSION", defaultValue: "true" },
  { key: "AZURE_SPEECH_KEY", defaultValue: "", secret: true },
  { key: "AZURE_SPEECH_REGION", defaultValue: "" },
  { key: "AZURE_TRANSLATOR_KEY", defaultValue: "", secret: true },
  { key: "AZURE_TRANSLATOR_REGION", defaultValue: "" },
  { key: "AZURE_TRANSLATOR_ENDPOINT", defaultValue: "" },
  { key: "TRANSLATION_PROVIDER", defaultValue: "chatgpt" },
  { key: "CHATGPT_API_KEY", defaultValue: "", secret: true },
  { key: "CHATGPT_MODEL", defaultValue: "gpt-4.1-mini" },
  { key: "CHATGPT_TRANSCRIBE_MODEL", defaultValue: "gpt-4o-mini-transcribe" },
  { key: "DEFAULT_TARGET_LANG_A", defaultValue: "en" },
  { key: "DEFAULT_TARGET_LANG_B", defaultValue: "en" },
  { key: "LOG_LEVEL", defaultValue: "info" }
] as const satisfies readonly RuntimeEnvFieldDefinition[];

export type RuntimeEnvField = (typeof RUNTIME_ENV_FIELDS)[number];
export type RuntimeEnvKey = RuntimeEnvField["key"];
export type SecureRuntimeEnvKey = Extract<RuntimeEnvField, { secret: true }>["key"];

export const RUNTIME_ENV_KEY_ORDER = RUNTIME_ENV_FIELDS.map((field) => field.key) as RuntimeEnvKey[];

export const RUNTIME_ENV_DEFAULTS = Object.freeze(
  Object.fromEntries(RUNTIME_ENV_FIELDS.map((field) => [field.key, field.defaultValue])) as Record<
    RuntimeEnvKey,
    string
  >
);

export const SECURE_RUNTIME_ENV_KEYS = Object.freeze(
  RUNTIME_ENV_FIELDS.filter(
    (field): field is Extract<RuntimeEnvField, { secret: true }> =>
      "secret" in field && field.secret === true
  ).map((field) => field.key) as SecureRuntimeEnvKey[]
);

const ENV_EXAMPLE_HEADER_COMMENTS = [
  "# OnlySpeech development template.",
  "# Source runs and local bootstrap use .env directly.",
  "# Windows packaged installs keep provider secrets in the local secure store and leave secret fields blank in the saved runtime .env."
] as const;

const ENV_EXAMPLE_INLINE_COMMENTS: Readonly<Partial<Record<RuntimeEnvKey, readonly string[]>>> = Object.freeze({
  SELECTOR_UI_LANGUAGE_A: [
    "# Leave selector UI defaults blank to inherit SETUP_UI_LANGUAGE automatically."
  ],
  RUNTIME_DISCLOSURE_MODE: [
    "# `standard` uses the localized built-in notice, `custom` reuses `RUNTIME_DISCLOSURE_CUSTOM_TEXT`, `disabled` hides the notice."
  ],
  VISITOR_CONVERSATION_HISTORY_ENABLED: [
    "# Keep disabled for privacy-first deployments unless the setup wizard is intentionally used to enable on-screen history."
  ]
});

export function createRuntimeEnvDefaults(
  baseEnv: Partial<Record<RuntimeEnvKey, string>> = {}
): Record<RuntimeEnvKey, string> {
  return normalizeRuntimeEnvValues(baseEnv);
}

export function renderDotEnvExample(): string {
  const lines: string[] = [...ENV_EXAMPLE_HEADER_COMMENTS];

  for (const key of RUNTIME_ENV_KEY_ORDER) {
    const comments = ENV_EXAMPLE_INLINE_COMMENTS[key];
    if (comments) {
      lines.push(...comments);
    }

    lines.push(`${key}=${RUNTIME_ENV_DEFAULTS[key]}`);
  }

  lines.push("");
  return lines.join("\n");
}
