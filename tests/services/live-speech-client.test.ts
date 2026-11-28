import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveSpeechClient } from "../../src/services/speech/live-speech-client.js";
import type { SpeechEventPayload, SpeechStartCommand } from "../../src/shared/types.js";

function createCommand(): SpeechStartCommand {
  return {
    type: "start-speech",
    side: "A",
    sessionId: "session-1",
    translationProvider: "chatgpt",
    sourceLanguage: "it-IT",
    targetLanguage: "en-US",
    microphoneDeviceId: "mic-a",
    azureKey: "azure-key",
    azureRegion: "westeurope",
    chatGptSilenceRmsThreshold: 0.02,
    audioEchoCancellation: true,
    audioNoiseSuppression: true
  };
}

describe("LiveSpeechClient internals", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("finalizes a chatgpt turn and emits transcript plus translation", async () => {
    const processSpeechTurn = vi.fn().mockResolvedValue({
      transcript: "ciao mondo",
      translation: "hello world",
      detectedLanguage: "it"
    });
    vi.stubGlobal("window", { onlySpeech: { processSpeechTurn } });
    const client = new LiveSpeechClient() as any;
    client.activeSessionId = "session-1";
    client.generation = 1;
    client.peakInputLevel = 0.1;
    client.recordedChunks = [new Blob(["audio-bytes"], { type: "audio/webm" })];
    client.audioStream = { getTracks: () => [{ stop: vi.fn() }] };
    client.mediaRecorder = {
      mimeType: "audio/webm",
      stop: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === "stop") {
          handler();
        }
      })
    };
    client.blobToBase64 = vi.fn().mockResolvedValue("YXVkaW8=");

    const command = createCommand();
    client.activeCommand = command;
    const emitted: SpeechEventPayload[] = [];
    const emitIfCurrent = (event: Omit<SpeechEventPayload, "sessionId">) => {
      emitted.push({ sessionId: command.sessionId, ...event });
    };

    await client.finalizeTurn({ onEvent: emitIfCurrent });

    expect(processSpeechTurn).toHaveBeenCalled();
    expect(emitted).toEqual([
      {
        sessionId: "session-1",
        type: "recognized",
        side: "A",
        transcript: "ciao mondo",
        translation: "hello world",
        detectedLanguage: "it"
      },
      {
        sessionId: "session-1",
        type: "speech-stopped",
        side: "A"
      }
    ]);
  });

  it("fails fast when the recorded turn is empty", async () => {
    const processSpeechTurn = vi.fn();
    vi.stubGlobal("window", { onlySpeech: { processSpeechTurn } });
    const client = new LiveSpeechClient() as any;
    client.activeSessionId = "session-1";
    client.generation = 1;
    client.recordedChunks = [];
    client.audioStream = { getTracks: () => [{ stop: vi.fn() }] };
    client.mediaRecorder = {
      mimeType: "audio/webm",
      stop: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === "stop") {
          handler();
        }
      })
    };

    const command = createCommand();
    client.activeCommand = command;
    const emitted: SpeechEventPayload[] = [];
    const emitIfCurrent = (event: Omit<SpeechEventPayload, "sessionId">) => {
      emitted.push({ sessionId: command.sessionId, ...event });
    };

    await client.finalizeTurn({ onEvent: emitIfCurrent });

    expect(processSpeechTurn).not.toHaveBeenCalled();
    expect(emitted).toEqual([
      {
        sessionId: "session-1",
        type: "error",
        side: "A",
        error: "PTT capture produced an empty audio payload."
      }
    ]);
  });

  it("does not call the provider for a silent final turn", async () => {
    const processSpeechTurn = vi.fn();
    vi.stubGlobal("window", { onlySpeech: { processSpeechTurn } });
    const client = new LiveSpeechClient() as any;
    client.activeSessionId = "session-1";
    client.generation = 1;
    client.peakInputLevel = 0;
    client.recordedChunks = [new Blob(["audio-bytes"], { type: "audio/webm" })];
    client.audioStream = { getTracks: () => [{ stop: vi.fn() }] };
    client.mediaRecorder = {
      mimeType: "audio/webm",
      stop: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === "stop") {
          handler();
        }
      })
    };

    const command = createCommand();
    client.activeCommand = command;
    const emitted: SpeechEventPayload[] = [];
    const emitIfCurrent = (event: Omit<SpeechEventPayload, "sessionId">) => {
      emitted.push({ sessionId: command.sessionId, ...event });
    };

    await client.finalizeTurn({ onEvent: emitIfCurrent });

    expect(processSpeechTurn).not.toHaveBeenCalled();
    expect(emitted).toEqual([
      {
        sessionId: "session-1",
        type: "speech-stopped",
        side: "A"
      }
    ]);
  });

  it("fails fast when the speech bridge is unavailable", async () => {
    vi.stubGlobal("window", {});
    const client = new LiveSpeechClient() as any;
    client.activeSessionId = "session-1";
    client.generation = 1;
    client.peakInputLevel = 0.1;
    client.recordedChunks = [new Blob(["audio-bytes"], { type: "audio/webm" })];
    client.audioStream = { getTracks: () => [{ stop: vi.fn() }] };
    client.mediaRecorder = {
      mimeType: "audio/webm",
      stop: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === "stop") {
          handler();
        }
      })
    };

    const command = createCommand();
    client.activeCommand = command;
    const emitted: SpeechEventPayload[] = [];
    const emitIfCurrent = (event: Omit<SpeechEventPayload, "sessionId">) => {
      emitted.push({ sessionId: command.sessionId, ...event });
    };

    await client.finalizeTurn({ onEvent: emitIfCurrent });

    expect(emitted).toEqual([
      {
        sessionId: "session-1",
        type: "error",
        side: "A",
        error: "Speech bridge is not available in this renderer."
      }
    ]);
  });

  it("disables incremental partial uploads before the provider call and emits a stable diagnostic", async () => {
    const processSpeechTurn = vi.fn();
    vi.stubGlobal("window", {
      onlySpeech: { processSpeechTurn },
      setTimeout: (handler: () => void) => {
        handler();
        return 1;
      },
      clearTimeout: vi.fn()
    });

    const client = new LiveSpeechClient() as any;
    client.activeSessionId = "session-1";
    client.activeCommand = createCommand();
    client.generation = 1;
    client.peakInputLevel = 0.1;
    client.recordedChunks = [new Blob(["audio-bytes"], { type: "audio/webm" })];
    client.pendingPartialChunks = [new Blob(["audio-bytes"], { type: "audio/webm" })];
    client.pendingPartialBytes = client.pendingPartialChunks[0].size;
    client.mediaRecorder = { mimeType: "audio/webm" };
    client.blobToBase64 = vi.fn().mockResolvedValue("YXVkaW8=");

    const emitted: SpeechEventPayload[] = [];
    await client.flushPartialUpdate(client.activeCommand, {
      onEvent: (event: SpeechEventPayload) => {
        emitted.push(event);
      }
    }, 1);

    expect(processSpeechTurn).not.toHaveBeenCalled();
    expect(emitted).toEqual([
      {
        sessionId: "session-1",
        type: "partial-degraded",
        side: "A",
        error:
          "ChatGPT partial transcription is disabled for live incremental captures because MediaRecorder chunks are not finalized upload containers. OnlySpeech will continue with the final turn only.",
        details: {
          code: "partial-audio-unsupported",
          disableFurtherPartialUpdates: true
        }
      }
    ]);
  });

  it("skips partial provider calls when buffered audio growth is still too small", async () => {
    const processSpeechTurn = vi.fn();
    vi.stubGlobal("window", {
      onlySpeech: { processSpeechTurn },
      setTimeout: vi.fn(),
      clearTimeout: vi.fn()
    });

    const client = new LiveSpeechClient() as any;
    client.activeSessionId = "session-1";
    client.activeCommand = createCommand();
    client.generation = 1;
    client.recordedChunks = [new Blob([new Uint8Array(5000)], { type: "audio/webm" })];
    client.pendingPartialChunks = [new Blob([new Uint8Array(500)], { type: "audio/webm" })];
    client.pendingPartialBytes = client.pendingPartialChunks[0].size;
    client.mediaRecorder = { mimeType: "audio/webm" };
    client.lastPartialSentAt = Date.now();

    const emitted: SpeechEventPayload[] = [];
    await client.flushPartialUpdate(client.activeCommand, {
      onEvent: (event: SpeechEventPayload) => {
        emitted.push(event);
      }
    }, 1);

    expect(processSpeechTurn).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it("skips partial provider calls while the captured turn is still silent", async () => {
    const processSpeechTurn = vi.fn();
    vi.stubGlobal("window", {
      onlySpeech: { processSpeechTurn },
      setTimeout: vi.fn(),
      clearTimeout: vi.fn()
    });

    const client = new LiveSpeechClient() as any;
    client.activeSessionId = "session-1";
    client.activeCommand = createCommand();
    client.generation = 1;
    client.peakInputLevel = 0;
    client.recordedChunks = [new Blob([new Uint8Array(6000)], { type: "audio/webm" })];
    client.pendingPartialChunks = [new Blob([new Uint8Array(6000)], { type: "audio/webm" })];
    client.pendingPartialBytes = client.pendingPartialChunks[0].size;
    client.mediaRecorder = { mimeType: "audio/webm" };

    const emitted: SpeechEventPayload[] = [];
    await client.flushPartialUpdate(client.activeCommand, {
      onEvent: (event: SpeechEventPayload) => {
        emitted.push(event);
      }
    }, 1);

    expect(processSpeechTurn).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it("suppresses duplicate partial diagnostics once live incremental uploads have been disabled", async () => {
    vi.stubGlobal("window", {
      onlySpeech: { processSpeechTurn: vi.fn() },
      setTimeout: vi.fn(),
      clearTimeout: vi.fn()
    });

    const client = new LiveSpeechClient() as any;
    client.activeSessionId = "session-1";
    client.activeCommand = createCommand();
    client.generation = 1;
    client.peakInputLevel = 0.1;
    client.pendingPartialChunks = [new Blob([new Uint8Array(6000)], { type: "audio/webm" })];
    client.pendingPartialBytes = client.pendingPartialChunks[0].size;

    const emitted: SpeechEventPayload[] = [];
    const onEvent = (event: SpeechEventPayload) => {
      emitted.push(event);
    };

    await client.flushPartialUpdate(client.activeCommand, { onEvent }, 1);
    client.pendingPartialChunks = [new Blob([new Uint8Array(6000)], { type: "audio/webm" })];
    client.pendingPartialBytes = client.pendingPartialChunks[0].size;
    await client.flushPartialUpdate(client.activeCommand, { onEvent }, 1);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toMatchObject({
      type: "partial-degraded",
      side: "A"
    });
  });

  it("disables incremental partial retries after an unsupported-audio diagnostic and still finalizes the turn", async () => {
    const processSpeechTurn = vi
      .fn()
      .mockResolvedValueOnce({
        transcript: "ciao finale",
        translation: "final hello",
        detectedLanguage: "it"
      });
    vi.stubGlobal("window", {
      onlySpeech: { processSpeechTurn },
      setTimeout: vi.fn(),
      clearTimeout: vi.fn()
    });

    const client = new LiveSpeechClient() as any;
    client.activeSessionId = "session-1";
    client.activeCommand = createCommand();
    client.generation = 1;
    client.peakInputLevel = 0.1;
    client.recordedChunks = [new Blob([new Uint8Array(6000)], { type: "audio/webm" })];
    client.pendingPartialChunks = [new Blob([new Uint8Array(6000)], { type: "audio/webm" })];
    client.pendingPartialBytes = client.pendingPartialChunks[0].size;
    client.mediaRecorder = {
      mimeType: "audio/webm",
      stop: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === "stop") {
          handler();
        }
      })
    };
    client.audioStream = { getTracks: () => [{ stop: vi.fn() }] };
    client.blobToBase64 = vi.fn().mockResolvedValue("YXVkaW8=");

    const emitted: SpeechEventPayload[] = [];
    const onEvent = (event: SpeechEventPayload) => {
      emitted.push(event);
    };

    await client.flushPartialUpdate(client.activeCommand, { onEvent }, 1);
    client.pendingPartialChunks = [new Blob([new Uint8Array(6000)], { type: "audio/webm" })];
    client.pendingPartialBytes = client.pendingPartialChunks[0].size;
    await client.flushPartialUpdate(client.activeCommand, { onEvent }, 1);
    await client.finalizeTurn({
      onEvent: (event: Omit<SpeechEventPayload, "sessionId">) => emitted.push({ sessionId: "session-1", ...event })
    });

    expect(processSpeechTurn).toHaveBeenCalledTimes(1);
    expect(processSpeechTurn.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        isPartial: false
      })
    );
    expect(emitted).toEqual([
      {
        sessionId: "session-1",
        type: "partial-degraded",
        side: "A",
        error:
          "ChatGPT partial transcription is disabled for live incremental captures because MediaRecorder chunks are not finalized upload containers. OnlySpeech will continue with the final turn only.",
        details: {
          code: "partial-audio-unsupported",
          disableFurtherPartialUpdates: true
        }
      },
      {
        sessionId: "session-1",
        type: "recognized",
        side: "A",
        transcript: "ciao finale",
        translation: "final hello",
        detectedLanguage: "it"
      },
      {
        sessionId: "session-1",
        type: "speech-stopped",
        side: "A"
      }
    ]);
  });

});

describe("ChatGPT PTT full flow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function buildChatGptMocks({ includeAudioContext = true }: { includeAudioContext?: boolean } = {}) {
    const trackStop = vi.fn();
    const stream = { getTracks: () => [{ stop: trackStop }] };

    const listeners: Record<string, any[]> = {};

    class MockMediaRecorder {
      state = "inactive";
      mimeType = "audio/webm";
      start(_timeslice?: number) {}
      stop() {
        const chunk = new Blob([new Uint8Array(1000)], { type: "audio/webm" });
        (listeners["dataavailable"] ?? []).forEach((h) => h({ data: chunk }));
        (listeners["stop"] ?? []).forEach((h) => h());
      }
      addEventListener(event: string, handler: any) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(handler);
      }
      static isTypeSupported(_type: string) { return true; }
    }

    // analyser that reports non-silent audio (~0.16 RMS, well above 0.02 threshold)
    const analyserBuffer = new Uint8Array(2048).fill(148);
    const analyserNode = {
      fftSize: 2048,
      getByteTimeDomainData(buf: Uint8Array) { buf.set(analyserBuffer); }
    };

    let silenceCallback: (() => void) | null = null;

    const processSpeechTurn = vi.fn().mockResolvedValue({
      transcript: "ciao",
      translation: "hello",
      detectedLanguage: "it"
    });

    // AudioContext must be a real constructor (not an arrow function) since code does `new AudioContextConstructor()`
    function MockAudioContext(this: any) {
      this.createMediaStreamSource = () => ({ connect() {} });
      this.createAnalyser = () => analyserNode;
      this.close = () => Promise.resolve();
    }

    vi.stubGlobal("MediaRecorder", MockMediaRecorder as any);
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) }
    });
    vi.stubGlobal("window", {
      AudioContext: includeAudioContext ? MockAudioContext : undefined,
      setInterval(cb: () => void) {
        silenceCallback = cb;
        return 1;
      },
      clearInterval() {},
      setTimeout() {},
      clearTimeout() {},
      onlySpeech: { processSpeechTurn }
    });

    return {
      processSpeechTurn,
      triggerSilenceSample: () => silenceCallback?.()
    };
  }

  it("emits recognized when AudioContext reports non-silent audio", async () => {
    const { processSpeechTurn, triggerSilenceSample } = buildChatGptMocks({ includeAudioContext: true });
    const client = new LiveSpeechClient();
    const command = createCommand();
    const emitted: SpeechEventPayload[] = [];
    const handlers = { onEvent: (e: SpeechEventPayload) => emitted.push(e) };

    await client.start(command, handlers);
    triggerSilenceSample(); // peakInputLevel > threshold
    await client.finish(handlers);

    expect(processSpeechTurn).toHaveBeenCalledOnce();
    expect(emitted).toContainEqual(expect.objectContaining({ type: "recognized", transcript: "ciao", side: "A" }));
    expect(emitted).toContainEqual(expect.objectContaining({ type: "speech-stopped", side: "A" }));
  });

  it("still calls the API when AudioContext is unavailable and the silence monitor never started", async () => {
    const { processSpeechTurn } = buildChatGptMocks({ includeAudioContext: false });
    const client = new LiveSpeechClient();
    const command = createCommand();
    const emitted: SpeechEventPayload[] = [];
    const handlers = { onEvent: (e: SpeechEventPayload) => emitted.push(e) };

    await client.start(command, handlers);
    await client.finish(handlers);

    expect(processSpeechTurn).toHaveBeenCalledOnce();
    expect(emitted).toContainEqual(expect.objectContaining({ type: "recognized", transcript: "ciao", side: "A" }));
  });

  it("emits only speech-stopped without calling the API when silence monitor is active but detects only silence", async () => {
    const { processSpeechTurn } = buildChatGptMocks({ includeAudioContext: true });
    // do NOT call triggerSilenceSample → peakInputLevel stays 0
    const client = new LiveSpeechClient();
    const command = createCommand();
    const emitted: SpeechEventPayload[] = [];
    const handlers = { onEvent: (e: SpeechEventPayload) => emitted.push(e) };

    await client.start(command, handlers);
    await client.finish(handlers);

    expect(processSpeechTurn).not.toHaveBeenCalled();
    expect(emitted).toEqual([
      expect.objectContaining({ type: "speech-started", side: "A" }),
      expect.objectContaining({ type: "speech-stopped", side: "A" })
    ]);
  });
});
