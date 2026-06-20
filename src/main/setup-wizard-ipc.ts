import { z } from "zod";
import { RUNTIME_ENV_KEY_ORDER, type RuntimeEnvKey } from "../shared/runtime-env-contract.js";

const sideSchema = z.enum(["A", "B"]);
const providerSchema = z.enum(["azure", "chatgpt"]);
const microphoneSchema = z.object({
  deviceId: z.string(),
  groupId: z.string(),
  label: z.string(),
  displayLabel: z.string().optional(),
  normalizedLabel: z.string().optional(),
  audioInputRole: z.string().optional(),
  connectionType: z.enum(["usb", "analog", "bluetooth", "hdmi", "virtual", "network", "other"]).optional(),
  connectionLabel: z.string().optional()
}).strict();
const runtimeEnvKeySchema = z.string().refine(
  (key): key is RuntimeEnvKey => RUNTIME_ENV_KEY_ORDER.includes(key as RuntimeEnvKey),
  "Unknown runtime environment key."
);

export const wizardPayloadSchemas: Readonly<Record<string, z.ZodType>> = Object.freeze({
  "wizard:assign-display": z.object({ side: sideSchema.nullable(), displayId: z.number().int() }).strict(),
  "wizard:assign-microphone": z.object({ side: sideSchema, deviceId: z.string().nullable() }).strict(),
  "wizard:update-microphones": z.object({
    microphones: z.array(microphoneSchema),
    microphonePermissionGranted: z.boolean(),
    microphoneError: z.string().nullable()
  }).strict(),
  "wizard:update-signal-level": z.object({ side: sideSchema, level: z.number().min(0).max(1) }).strict(),
  "wizard:update-env-values": z.record(runtimeEnvKeySchema, z.string()),
  "wizard:update-autostart": z.object({ selectedEnabled: z.boolean() }).strict(),
  "wizard:test-provider-translation": z.object({
    provider: providerSchema,
    sourceLanguage: z.string().min(1),
    targetLanguage: z.string().min(1),
    text: z.string().min(1)
  }).strict(),
  "wizard:normalize-provider-playback-text": z.object({
    provider: providerSchema,
    targetLanguage: z.string().min(1),
    text: z.string().min(1)
  }).strict(),
  "wizard:test-provider-speech": z.object({
    provider: providerSchema,
    sourceLanguage: z.string().min(1),
    targetLanguage: z.string().min(1),
    audioBase64: z.string().min(1),
    audioMimeType: z.string().min(1)
  }).strict(),
  "wizard:submit-new-license": z.object({ email: z.string(), activationCode: z.string() }).strict()
});

export const overlayWizardChannels = new Set([
  "wizard:get-state",
  "wizard:assign-display",
  "wizard:assign-microphone",
  "wizard:update-microphones",
  "wizard:update-signal-level",
  "wizard:close-monitor-setup",
  "wizard:close-current-overlay"
]);

export function parseWizardPayload(channel: string, payload: unknown): unknown {
  const schema = wizardPayloadSchemas[channel];
  if (!schema) {
    if (payload !== undefined) {
      throw new Error(`Invalid ${channel} payload.`);
    }
    return undefined;
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new Error(`Invalid ${channel} payload.`);
  }
  return result.data;
}
