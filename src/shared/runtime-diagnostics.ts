const SENSITIVE_DIAGNOSTIC_PATTERN =
  /(?:api[_ -]?key|authorization|bearer\s+\S+|secret|token|transcript|translation|audio[_ -]?(?:base64|payload)?)/i;

const LONG_BASE64_PATTERN = /^[A-Za-z0-9+/=]{80,}$/;
const REDACTED_DIAGNOSTIC = "[redacted]";

export function sanitizeDiagnosticText(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (
    trimmed.length > 200 ||
    /[\r\n]/.test(trimmed) ||
    LONG_BASE64_PATTERN.test(trimmed) ||
    SENSITIVE_DIAGNOSTIC_PATTERN.test(trimmed)
  ) {
    return REDACTED_DIAGNOSTIC;
  }

  return trimmed.replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
}

export function formatRuntimeDiagnosticError(error: unknown): string | null {
  if (error instanceof Error) {
    const sanitizedMessage = sanitizeDiagnosticText(error.message);
    if (sanitizedMessage) {
      return sanitizedMessage;
    }

    return error.name || null;
  }

  if (typeof error === "string") {
    const sanitizedMessage = sanitizeDiagnosticText(error);
    return sanitizedMessage || null;
  }

  return null;
}

export function reportRuntimeDiagnostic(
  level: "warn" | "error",
  message: string,
  error?: unknown
): void {
  const formattedError = error === undefined ? null : formatRuntimeDiagnosticError(error);
  if (formattedError) {
    console[level](message, formattedError);
    return;
  }

  console[level](message);
}
