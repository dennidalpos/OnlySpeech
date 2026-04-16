import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as fsModule from "node:fs";

const loggerMocks = vi.hoisted(() => ({
  getPath: vi.fn(() => "C:\\OnlySpeechUserData"),
  writes: new Map<string, string[]>()
}));

vi.mock("electron", () => ({
  app: {
    getPath: loggerMocks.getPath
  }
}));

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");

  return {
    ...actual,
    mkdirSync: vi.fn(),
    appendFileSync: vi.fn((filePath: string, content: string) => {
      const entries = loggerMocks.writes.get(filePath) ?? [];
      entries.push(content);
      loggerMocks.writes.set(filePath, entries);
    })
  };
});

import { JsonlLogger } from "../src/services/logging/jsonl-logger.js";

function readLastRecord(): { filePath: string; record: Record<string, unknown> } {
  const [filePath = ""] = [...loggerMocks.writes.keys()];
  const lines = loggerMocks.writes.get(filePath) ?? [];
  const payload = lines.at(-1) ?? "";
  return {
    filePath,
    record: JSON.parse(payload)
  };
}

describe("JsonlLogger", () => {
  beforeEach(() => {
    loggerMocks.writes.clear();
  });

  it("redacts runtime text and sensitive detail fields at info level", () => {
    const logger = new JsonlLogger({ logLevel: "info" });

    logger.log({
      session_id: "session-1",
      event: "translation_final",
      text: "hello world",
      details: {
        transcript: "ciao mondo",
        api_key: "secret",
        devices: [{ label: "Mic A" }]
      }
    });

    const { filePath, record } = readLastRecord();

    expect(filePath).toBe(join("C:\\OnlySpeechUserData", "logs", `${new Date().toISOString().slice(0, 10)}.jsonl`));
    expect(record.text).toBe("[redacted]");
    expect(record.details).toEqual({
      transcript: "[redacted]",
      api_key: "[redacted]",
      devices: [{ label: "Mic A" }]
    });
  });

  it("redacts the persisted top-level error field too", () => {
    const logger = new JsonlLogger({ logLevel: "info" });

    logger.log({
      session_id: "session-err-1",
      event: "technical_error",
      error: "provider request failed with transcript=ciao and token=secret"
    });

    const { record } = readLastRecord();
    expect(record.error).toBe("[redacted]");
  });

  it("redacts runtime text at debug level too", () => {
    const logger = new JsonlLogger({ logLevel: "debug" });

    logger.log({
      session_id: "session-2",
      event: "translation_final",
      text: "hello world",
      details: {
        transcript: "ciao mondo"
      }
    });

    const { record } = readLastRecord();

    expect(record.text).toBe("[redacted]");
    expect(record.details).toEqual({
      transcript: "[redacted]"
    });
  });

  it("sanitizes the fallback console error when log persistence fails", () => {
    const appendFileSyncMock = vi.mocked(fsModule.appendFileSync);
    appendFileSyncMock.mockImplementationOnce(() => {
      throw new Error("token=secret");
    });
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      const logger = new JsonlLogger({ logLevel: "info" });

      logger.log({
        session_id: "session-fallback",
        event: "technical_error"
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith("OnlySpeech logging is unavailable.", "[redacted]");
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
