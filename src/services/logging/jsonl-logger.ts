import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import type { LogRecord } from "../../shared/types.js";
import { reportRuntimeDiagnostic } from "../../shared/runtime-diagnostics.js";

interface JsonlLoggerOptions {
  logLevel?: string;
}

const SENSITIVE_DETAIL_KEY_PATTERN =
  /(^|_)(api_?key|authorization|env|preview|secret|token|transcript|translation|text)($|_)/i;

function redactString(value: string): string {
  return value.length === 0 ? value : "[redacted]";
}

function sanitizeDetails(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDetails(item));
  }

  if (typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => {
      if (typeof entryValue === "string" && SENSITIVE_DETAIL_KEY_PATTERN.test(key)) {
        return [key, redactString(entryValue)];
      }

      return [key, sanitizeDetails(entryValue)];
    })
  );
}

export class JsonlLogger {
  private readonly logDirectory: string;

  private writeFailed = false;

  constructor(_options: JsonlLoggerOptions = {}) {
    this.logDirectory = join(app.getPath("userData"), "logs");
    try {
      mkdirSync(this.logDirectory, { recursive: true });
    } catch (error) {
      this.reportFailure(error);
    }
  }

  log(record: Omit<LogRecord, "timestamp">): void {
    const now = new Date();
    const filePath = join(this.logDirectory, `${now.toISOString().slice(0, 10)}.jsonl`);
    const payload: LogRecord = {
      timestamp: now.toISOString(),
      ...record,
      details: sanitizeDetails(record.details) as LogRecord["details"],
      text: record.text === undefined || record.text === null ? record.text : redactString(record.text),
      error: record.error === undefined || record.error === null ? record.error : redactString(record.error)
    };

    try {
      appendFileSync(
        filePath,
        `${JSON.stringify(payload, (_key, value) => {
          if (value instanceof Error) {
            return {
              name: value.name,
              message: value.message,
              stack: value.stack
            };
          }

          return value;
        })}\n`,
        "utf8"
      );
    } catch (error) {
      this.reportFailure(error);
    }
  }

  private reportFailure(error: unknown): void {
    if (this.writeFailed) {
      return;
    }

    this.writeFailed = true;
    reportRuntimeDiagnostic("error", "OnlySpeech logging is unavailable.", error);
  }
}
