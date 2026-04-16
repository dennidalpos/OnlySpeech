import { z } from "zod";
import type {
  ActivationSubmissionRequest,
  DeviceProbePayload,
  OperatorAction,
  SetupWizardAccessRequest,
  SpeechEventPayload,
  SpeechTurnRequest,
  StartTextToSpeechCommand,
  StopTextToSpeechRequest,
  TextToSpeechEventPayload,
  TextToSpeechRequest
} from "../shared/types.js";

const sideSchema = z.enum(["A", "B"]);
const translationProviderSchema = z.enum(["azure", "chatgpt"]);
const textToSpeechEngineSchema = z.enum(["openai", "azure"]);
const textToSpeechContentSchema = z.enum(["transcript", "translation", "technical"]);

export const activationSubmissionRequestSchema = z.object({
  email: z.string(),
  activationCode: z.string()
}).strict() satisfies z.ZodType<ActivationSubmissionRequest>;

export const operatorActionSchema = z.object({
  type: z.enum([
    "renderer-ready",
    "activity",
    "select-target-language",
    "request-ptt-down",
    "request-ptt-up",
    "request-reset",
    "request-close",
    "retry-health-check"
  ]),
  side: sideSchema,
  targetLanguage: z.string().optional(),
  sourceLanguage: z.string().optional()
}).strict().superRefine((value, ctx) => {
  if (value.type === "select-target-language" && (!value.targetLanguage || !value.targetLanguage.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "targetLanguage is required when selecting a target language."
    });
  }
}) satisfies z.ZodType<OperatorAction>;

export const setupWizardAccessRequestSchema = z.object({
  password: z.string(),
  nextPassword: z.string().optional()
}).strict() satisfies z.ZodType<SetupWizardAccessRequest>;

const microphoneDeviceSchema = z.object({
  deviceId: z.string(),
  groupId: z.string(),
  label: z.string(),
  displayLabel: z.string().optional(),
  normalizedLabel: z.string().optional(),
  audioInputRole: z.string().optional(),
  connectionType: z.enum(["usb", "analog", "bluetooth", "hdmi", "virtual", "network", "other"]).optional(),
  connectionLabel: z.string().optional()
}).strict();

export const deviceProbePayloadSchema = z.object({
  side: sideSchema,
  devices: z.array(microphoneDeviceSchema),
  permissionGranted: z.boolean(),
  failureKind: z.enum(["permission-denied", "device-unavailable"]).optional(),
  error: z.string().optional()
}).strict() satisfies z.ZodType<DeviceProbePayload>;

export const speechEventPayloadSchema = z.object({
  type: z.enum([
    "speech-started",
    "speech-stopped",
    "recognizing",
    "recognized",
    "partial-degraded",
    "partial-failed",
    "canceled",
    "error"
  ]),
  sessionId: z.string(),
  side: sideSchema,
  transcript: z.string().optional(),
  translation: z.string().optional(),
  error: z.string().optional(),
  detectedLanguage: z.string().optional(),
  detectedLanguageConfidence: z.string().nullable().optional(),
  details: z.record(z.string(), z.unknown()).optional()
}).strict() satisfies z.ZodType<SpeechEventPayload>;

export const speechTurnRequestSchema = z.object({
  provider: translationProviderSchema,
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  audioBase64: z.string(),
  audioMimeType: z.string(),
  isPartial: z.boolean().optional()
}).strict() satisfies z.ZodType<SpeechTurnRequest>;

export const startTextToSpeechCommandSchema = z.object({
  type: z.literal("start-tts"),
  side: sideSchema,
  content: textToSpeechContentSchema,
  requestId: z.string(),
  text: z.string(),
  language: z.string().nullable(),
  engine: textToSpeechEngineSchema,
  translationProvider: translationProviderSchema.nullable().optional(),
  azureSpeechKey: z.string().nullable().optional(),
  azureSpeechRegion: z.string().nullable().optional(),
  chatGptApiKey: z.string().nullable().optional(),
  chatGptTextToSpeechModel: z.string().nullable().optional(),
  chatGptTextToSpeechVoice: z.string().nullable().optional()
}).strict() satisfies z.ZodType<StartTextToSpeechCommand>;

export const textToSpeechRequestSchema = z.object({
  side: sideSchema,
  content: textToSpeechContentSchema,
  text: z.string(),
  language: z.string().nullable()
}).strict() satisfies z.ZodType<TextToSpeechRequest>;

export const stopTextToSpeechRequestSchema = z.object({
  side: sideSchema.optional(),
  content: textToSpeechContentSchema.optional()
}).strict().superRefine((value, ctx) => {
  const hasSide = value.side !== undefined;
  const hasContent = value.content !== undefined;
  if (hasSide !== hasContent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "side and content must be provided together."
    });
  }
}) satisfies z.ZodType<StopTextToSpeechRequest>;

export const textToSpeechEventPayloadSchema = z.object({
  type: z.enum(["started", "ended", "stopped", "error", "unavailable"]),
  side: sideSchema,
  content: textToSpeechContentSchema,
  requestId: z.string(),
  engine: textToSpeechEngineSchema,
  language: z.string().nullable(),
  voiceName: z.string().nullable().optional(),
  error: z.string().optional(),
  errorCode: z.string().optional()
}).strict() satisfies z.ZodType<TextToSpeechEventPayload>;

export function parsePayload<T>(schema: z.ZodType<T>, payload: unknown, surface: string): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid ${surface} payload.`);
  }

  return parsed.data;
}
