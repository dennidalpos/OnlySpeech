import { beforeEach, describe, expect, it, vi } from "vitest";

const preloadMocks = vi.hoisted(() => {
  const invoke = vi.fn();
  const send = vi.fn();
  const on = vi.fn();
  const removeListener = vi.fn();
  const exposeInMainWorld = vi.fn();

  const reset = () => {
    invoke.mockReset();
    send.mockReset();
    on.mockReset();
    removeListener.mockReset();
    exposeInMainWorld.mockReset();
  };

  return {
    invoke,
    send,
    on,
    removeListener,
    exposeInMainWorld,
    reset
  };
});

vi.mock("electron", () => ({
  contextBridge: {
    exposeInMainWorld: preloadMocks.exposeInMainWorld
  },
  ipcRenderer: {
    invoke: preloadMocks.invoke,
    send: preloadMocks.send,
    on: preloadMocks.on,
    removeListener: preloadMocks.removeListener
  }
}));

describe("main preload", () => {
  beforeEach(() => {
    vi.resetModules();
    preloadMocks.reset();
  });

  it("exposes the renderer bridge without the legacy managed-TTS helpers", async () => {
    await import("../src/main/preload.js");
    const api = preloadMocks.exposeInMainWorld.mock.calls[0]?.[1] as Record<string, unknown>;

    expect(preloadMocks.exposeInMainWorld).toHaveBeenCalledWith("onlySpeech", expect.any(Object));
    expect(api.getActivationGateState).toBeTypeOf("function");
    expect(api.submitActivation).toBeTypeOf("function");
    expect(api.getManagedTextToSpeechStatus).toBeUndefined();
    expect(api.getTextToSpeechCoverageSnapshot).toBeUndefined();
    expect(api.manageManagedTextToSpeech).toBeUndefined();
    expect(api.synthesizeManagedTextToSpeech).toBeUndefined();
    expect(api.releaseManagedTextToSpeech).toBeUndefined();
  });
});
