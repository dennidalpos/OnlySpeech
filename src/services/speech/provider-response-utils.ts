export interface TranslationResponseShape {
  choices?: Array<{ message?: { content?: string } }>;
}

export interface OpenAiTranscriptionShape { text?: string; language?: string }
export interface ChatGptSpeechTurnTranslationShape { translation: string; detectedLanguage?: string }
export interface AzureTranslatorResponseShape {
  detectedLanguage?: { language?: string };
  translations?: Array<{ text?: string; to?: string }>;
}
export interface OllamaChatResponseShape { message?: { content?: string }; done?: boolean }
export interface OllamaTagsResponseShape { models?: Array<{ name?: string; model?: string }> }
export interface OllamaVersionResponseShape { version?: string }

interface RemoteErrorShape {
  error?: { code?: string; type?: string };
  code?: string;
  type?: string;
}

function extractRemoteErrorCode(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as RemoteErrorShape;
    const candidate = parsed.error?.code ?? parsed.error?.type ?? parsed.code ?? parsed.type ?? null;
    return typeof candidate === "string" && /^[A-Za-z0-9_.:-]{1,80}$/.test(candidate) ? candidate : null;
  } catch {
    return /could not be decoded|unsupported|invalid file format/i.test(trimmed) ? "unsupported-audio" : null;
  }
}

export async function parseProviderError(response: Response): Promise<string> {
  let code: string | null;
  try { code = extractRemoteErrorCode(await response.text()); } catch { code = null; }
  const statusLabel = `${response.status} ${response.statusText}`.trim();
  return code ? `${statusLabel} (${code})` : statusLabel;
}

export function decodeBase64Audio(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

export function inferAudioExtension(audioMimeType: string): string {
  if (audioMimeType.includes("webm")) return "webm";
  if (audioMimeType.includes("ogg")) return "ogg";
  if (audioMimeType.includes("mp4") || audioMimeType.includes("mpeg") || audioMimeType.includes("aac")) return "m4a";
  return "wav";
}

export function isRecoverableChatGptPartialTranscriptionFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /corrupt|corrupted|unsupported|unsupported-audio|could not be decoded|invalid file format/i.test(message);
}

export function buildProviderTransportFailureMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Provider request failed before receiving a response.";
  const message = error.message.trim();
  return message ? `Provider request failed before receiving a response: ${message}` : "Provider request failed before receiving a response.";
}

export function readChatCompletionContent(payload: TranslationResponseShape): string {
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

export function parseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  for (const candidate of fencedMatch ? [fencedMatch[1] ?? "", trimmed] : [trimmed]) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch { /* malformed model output falls back to plain text */ }
  }
  return null;
}

export function normalizeDetectedLanguageCode(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const trimmed = value.trim();
  return /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(trimmed) ? trimmed : undefined;
}
