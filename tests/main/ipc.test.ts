import { beforeEach, describe, expect, it, vi } from "vitest";
import { IPC_CHANNELS } from "../../src/shared/constants.js";
import type {
  ActivationSubmissionRequest,
  OperatorAction,
  SetupWizardAccessRequest,
  SpeechTurnRequest,
  StartTextToSpeechCommand,
  TextToSpeechEventPayload,
  TextToSpeechRequest
} from "../../src/shared/types.js";

const ipcMocks = vi.hoisted(() => {
  const onHandlers = new Map<string, (...args: unknown[]) => unknown>();
  const handleHandlers = new Map<string, (...args: unknown[]) => unknown>();

  const on = vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
    onHandlers.set(channel, handler);
  });
  const handle = vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
    handleHandlers.set(channel, handler);
  });

  const reset = () => {
    on.mockClear();
    handle.mockClear();
    onHandlers.clear();
    handleHandlers.clear();
  };

  return {
    on,
    handle,
    onHandlers,
    handleHandlers,
    reset
  };
});

vi.mock("electron", () => ({
  ipcMain: {
    on: ipcMocks.on,
    handle: ipcMocks.handle
  }
}));

import { registerIpcHandlers } from "../../src/main/ipc.js";

describe("registerIpcHandlers", () => {
  beforeEach(() => {
    ipcMocks.reset();
  });

  it("routes the dedicated open-setup-wizard channel to the binding", async () => {
    const kioskManager = {
      handleOperatorAction: vi.fn(),
      handleDeviceProbe: vi.fn(),
      handleSpeechEvent: vi.fn(),
      setDemoPaused: vi.fn()
    };
    const openSetupWizard = vi.fn(async () => undefined);

    registerIpcHandlers({
      getKioskManager: () => kioskManager as never,
      getTranslationProviderService: () => null,
      openSetupWizard,
      setDemoPaused: kioskManager.setDemoPaused
    });

    const handler = ipcMocks.onHandlers.get(IPC_CHANNELS.openSetupWizard);
    await handler?.(undefined);

    expect(openSetupWizard).toHaveBeenCalledTimes(1);
    expect(kioskManager.handleOperatorAction).not.toHaveBeenCalled();
  });

  it("rejects malformed activation payloads before they reach the runtime bindings", async () => {
    const submitActivation = vi.fn();

    registerIpcHandlers({
      submitActivation,
      getKioskManager: () => null,
      getTranslationProviderService: () => null,
      openSetupWizard: vi.fn()
    });

    const submitHandler = ipcMocks.handleHandlers.get(IPC_CHANNELS.submitActivation);

    expect(() => submitHandler?.(undefined, { email: "buyer@example.com" })).toThrow(
      "Invalid onlyspeech:submit-activation payload."
    );
    expect(submitActivation).not.toHaveBeenCalled();
  });

  it("exposes activation gate state and activation submission through typed ipc handlers", async () => {
    const getActivationGateState = vi.fn(() => ({
      status: "required" as const,
      message: "Activation required."
    }));
    const submitActivation = vi.fn(() => ({
      ok: true as const,
      status: "success" as const,
      message: "Activation successful."
    }));

    registerIpcHandlers({
      getActivationGateState,
      submitActivation,
      getKioskManager: () => null,
      getTranslationProviderService: () => null,
      openSetupWizard: vi.fn()
    });

    const stateHandler = ipcMocks.handleHandlers.get(IPC_CHANNELS.getActivationGateState);
    const submitHandler = ipcMocks.handleHandlers.get(IPC_CHANNELS.submitActivation);
    const request: ActivationSubmissionRequest = {
      email: "buyer@example.com",
      activationCode: "OS1.payload.signature"
    };

    expect(await stateHandler?.(undefined)).toEqual({
      status: "required",
      message: "Activation required."
    });
    expect(await submitHandler?.(undefined, request)).toEqual({
      ok: true,
      status: "success",
      message: "Activation successful."
    });

    expect(getActivationGateState).toHaveBeenCalledTimes(1);
    expect(submitActivation).toHaveBeenCalledWith(request);
  });

  it("forwards non-wizard operator actions to the kiosk manager", () => {
    const kioskManager = {
      handleOperatorAction: vi.fn(),
      handleDeviceProbe: vi.fn(),
      handleSpeechEvent: vi.fn(),
      setDemoPaused: vi.fn()
    };

    registerIpcHandlers({
      getKioskManager: () => kioskManager as never,
      getTranslationProviderService: () => null,
      openSetupWizard: vi.fn(),
      setDemoPaused: kioskManager.setDemoPaused
    });

    const handler = ipcMocks.onHandlers.get(IPC_CHANNELS.operatorAction);
    const action: OperatorAction = { type: "request-reset", side: "B" };

    handler?.(undefined, action);

    expect(kioskManager.handleOperatorAction).toHaveBeenCalledWith(action);
  });

  it("rejects malformed operator actions before they reach the kiosk manager", () => {
    const kioskManager = {
      handleOperatorAction: vi.fn(),
      handleDeviceProbe: vi.fn(),
      handleSpeechEvent: vi.fn(),
      setDemoPaused: vi.fn()
    };

    registerIpcHandlers({
      getKioskManager: () => kioskManager as never,
      getTranslationProviderService: () => null,
      openSetupWizard: vi.fn(),
      setDemoPaused: kioskManager.setDemoPaused
    });

    const handler = ipcMocks.onHandlers.get(IPC_CHANNELS.operatorAction);

    expect(() => handler?.(undefined, { type: "select-target-language", side: "A" })).toThrow(
      "Invalid onlyspeech:operator-action payload."
    );
    expect(kioskManager.handleOperatorAction).not.toHaveBeenCalled();
  });

  it("accepts enriched device-probe payloads emitted by the renderer microphone probe", () => {
    const kioskManager = {
      handleOperatorAction: vi.fn(),
      handleDeviceProbe: vi.fn(),
      handleSpeechEvent: vi.fn(),
      setDemoPaused: vi.fn()
    };

    registerIpcHandlers({
      getKioskManager: () => kioskManager as never,
      getTranslationProviderService: () => null,
      openSetupWizard: vi.fn(),
      setDemoPaused: kioskManager.setDemoPaused
    });

    const handler = ipcMocks.onHandlers.get(IPC_CHANNELS.deviceProbe);
    const payload = {
      side: "A",
      devices: [
        {
          deviceId: "mic-a",
          groupId: "group-a",
          label: "USB Microphone",
          displayLabel: "USB Microphone",
          normalizedLabel: "usb microphone",
          audioInputRole: "microphone",
          connectionType: "usb",
          connectionLabel: "Audio USB"
        }
      ],
      permissionGranted: true
    };

    expect(() => handler?.(undefined, payload)).not.toThrow();
    expect(kioskManager.handleDeviceProbe).toHaveBeenCalledWith(payload);
  });

  it("delegates speech-turn requests to the translation provider service", async () => {
    const processSpeechTurn = vi.fn(async () => ({ transcript: "ciao", translation: "hello" }));

    registerIpcHandlers({
      getKioskManager: () => null,
      getTranslationProviderService: () => ({ processSpeechTurn }) as never,
      openSetupWizard: vi.fn()
    });

    const handler = ipcMocks.handleHandlers.get(IPC_CHANNELS.processSpeechTurn);
    const request: SpeechTurnRequest = {
      provider: "chatgpt",
      sourceLanguage: "it-IT",
      targetLanguage: "en",
      audioBase64: "ZmFrZQ==",
      audioMimeType: "audio/webm"
    };

    const result = await handler?.(undefined, request);

    expect(processSpeechTurn).toHaveBeenCalledWith(request);
    expect(result).toEqual({ transcript: "ciao", translation: "hello" });
  });

  it("rejects malformed speech-turn payloads before they reach the translation provider service", async () => {
    const processSpeechTurn = vi.fn(async () => ({ transcript: "ciao", translation: "hello" }));

    registerIpcHandlers({
      getKioskManager: () => null,
      getTranslationProviderService: () => ({ processSpeechTurn }) as never,
      openSetupWizard: vi.fn()
    });

    const handler = ipcMocks.handleHandlers.get(IPC_CHANNELS.processSpeechTurn);

    expect(() => handler?.(undefined, {
      provider: "chatgpt",
      sourceLanguage: "it-IT",
      targetLanguage: "en-US",
      audioMimeType: "audio/webm"
    })).toThrow("Invalid onlyspeech:process-speech-turn payload.");
    expect(processSpeechTurn).not.toHaveBeenCalled();
  });

  it("synthesizes provider-owned text-to-speech through the main process and returns structured audio metadata", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      json: async () => []
    }));

    vi.stubGlobal("fetch", fetchMock);

    registerIpcHandlers({
      getKioskManager: () => null,
      getTranslationProviderService: () => null,
      openSetupWizard: vi.fn()
    });

    const handler = ipcMocks.handleHandlers.get(IPC_CHANNELS.synthesizeTextToSpeech);
    const request: StartTextToSpeechCommand = {
      type: "start-tts",
      side: "A",
      content: "technical",
      requestId: "tts-1",
      text: "Hello",
      language: "en",
      engine: "openai",
      translationProvider: "chatgpt",
      chatGptApiKey: "openai-key"
    };

    const result = await handler?.(undefined, request);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/audio/speech",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer openai-key"
        })
      })
    );
    expect(result).toEqual({
      ok: true,
      synthesis: expect.objectContaining({
        audioBase64: "AQID",
        audioMimeType: "audio/mpeg",
        engine: "openai"
      })
    });
  });

  it("forwards explicit demo pause requests to the kiosk binding", async () => {
    const setDemoPaused = vi.fn();

    registerIpcHandlers({
      getKioskManager: () => null,
      getTranslationProviderService: () => null,
      openSetupWizard: vi.fn(),
      setDemoPaused
    });

    const handler = ipcMocks.handleHandlers.get(IPC_CHANNELS.setDemoPaused);
    await handler?.(undefined, true);

    expect(setDemoPaused).toHaveBeenCalledWith(true);
  });

  it("exposes setup-wizard access state and authorization through typed ipc handlers", async () => {
    const getSetupWizardAccessState = vi.fn(() => ({
      requiresPassword: true,
      mustChangePassword: true,
      temporaryPassword: "TEMP-PASS-01"
    }));
    const requestSetupWizardAccess = vi.fn(() => ({ ok: true as const }));

    registerIpcHandlers({
      getKioskManager: () => null,
      getTranslationProviderService: () => null,
      openSetupWizard: vi.fn(),
      getSetupWizardAccessState,
      requestSetupWizardAccess
    });

    const stateHandler = ipcMocks.handleHandlers.get(IPC_CHANNELS.getSetupWizardAccessState);
    const requestHandler = ipcMocks.handleHandlers.get(IPC_CHANNELS.requestSetupWizardAccess);
    const request: SetupWizardAccessRequest = {
      password: "TEMP-PASS-01",
      nextPassword: "OperatorPass42"
    };

    expect(await stateHandler?.(undefined)).toEqual({
      requiresPassword: true,
      mustChangePassword: true,
      temporaryPassword: "TEMP-PASS-01"
    });
    await expect(Promise.resolve(requestHandler?.(undefined, request))).resolves.toEqual({
      ok: true
    });

    expect(getSetupWizardAccessState).toHaveBeenCalledTimes(1);
    expect(requestSetupWizardAccess).toHaveBeenCalledWith(request);
  });

  it("rejects malformed setup-wizard access payloads before they reach authorization", async () => {
    const requestSetupWizardAccess = vi.fn(() => ({ ok: true as const }));

    registerIpcHandlers({
      getKioskManager: () => null,
      getTranslationProviderService: () => null,
      openSetupWizard: vi.fn(),
      requestSetupWizardAccess
    });

    const requestHandler = ipcMocks.handleHandlers.get(IPC_CHANNELS.requestSetupWizardAccess);

    await expect(
      Promise.resolve(requestHandler?.(undefined, { nextPassword: "OperatorPass42" }))
    ).rejects.toThrow("Invalid onlyspeech:request-setup-wizard-access payload.");
    expect(requestSetupWizardAccess).not.toHaveBeenCalled();
  });

  it("returns the azure text-to-speech catalog from the main-process environment", async () => {
    const originalAzureSpeechKey = process.env.AZURE_SPEECH_KEY;
    const originalAzureSpeechRegion = process.env.AZURE_SPEECH_REGION;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          ShortName: "en-US-AvaNeural",
          DisplayName: "Microsoft Ava Online (Natural) - English (United States)",
          LocalName: "Ava",
          Locale: "en-US",
          LocaleName: "English (United States)",
          Gender: "Female"
        }
      ]
    });

    vi.stubGlobal("fetch", fetchMock);
    process.env.AZURE_SPEECH_KEY = "azure-key";
    process.env.AZURE_SPEECH_REGION = "westeurope";

    try {
      registerIpcHandlers({
        getKioskManager: () => null,
        getTranslationProviderService: () => null,
        openSetupWizard: vi.fn()
      });

      const handler = ipcMocks.handleHandlers.get(IPC_CHANNELS.getAzureTextToSpeechCatalogSnapshot);
      const snapshot = await handler?.(undefined);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://westeurope.tts.speech.microsoft.com/cognitiveservices/voices/list",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "Ocp-Apim-Subscription-Key": "azure-key"
          })
        })
      );
      expect(snapshot).toEqual(
        expect.objectContaining({
          region: "westeurope",
          voiceCount: 1,
          status: "fresh"
        })
      );
    } finally {
      if (originalAzureSpeechKey === undefined) {
        delete process.env.AZURE_SPEECH_KEY;
      } else {
        process.env.AZURE_SPEECH_KEY = originalAzureSpeechKey;
      }

      if (originalAzureSpeechRegion === undefined) {
        delete process.env.AZURE_SPEECH_REGION;
      } else {
        process.env.AZURE_SPEECH_REGION = originalAzureSpeechRegion;
      }
    }
  });

  it("forwards text-to-speech requests and events to the kiosk manager", () => {
    const kioskManager = {
      handleOperatorAction: vi.fn(),
      handleDeviceProbe: vi.fn(),
      handleSpeechEvent: vi.fn(),
      handleTextToSpeechRequest: vi.fn(),
      handleTextToSpeechStop: vi.fn(),
      handleTextToSpeechEvent: vi.fn(),
      setDemoPaused: vi.fn()
    };

    registerIpcHandlers({
      getKioskManager: () => kioskManager as never,
      getTranslationProviderService: () => null,
      openSetupWizard: vi.fn(),
      setDemoPaused: kioskManager.setDemoPaused
    });

    const requestHandler = ipcMocks.onHandlers.get(IPC_CHANNELS.textToSpeechRequest);
    const stopHandler = ipcMocks.onHandlers.get(IPC_CHANNELS.textToSpeechStop);
    const eventHandler = ipcMocks.onHandlers.get(IPC_CHANNELS.textToSpeechEvent);
    const request: TextToSpeechRequest = {
      side: "A",
      content: "translation",
      text: "hello",
      language: "en-US"
    };
    const event: TextToSpeechEventPayload = {
      type: "started",
      side: "A",
      content: "translation",
      requestId: "tts-1",
      engine: "openai",
      language: "en-US",
      voiceName: "English Voice"
    };

    requestHandler?.(undefined, request);
    stopHandler?.(undefined, { side: "A", content: "translation" });
    eventHandler?.(undefined, event);

    expect(kioskManager.handleTextToSpeechRequest).toHaveBeenCalledWith(request);
    expect(kioskManager.handleTextToSpeechStop).toHaveBeenCalledWith({
      side: "A",
      content: "translation"
    });
    expect(kioskManager.handleTextToSpeechEvent).toHaveBeenCalledWith(event);
  });

  it("does not register removed managed text-to-speech ipc handlers", async () => {
    registerIpcHandlers({
      getKioskManager: () => null,
      getTranslationProviderService: () => null,
      openSetupWizard: vi.fn()
    });

    expect(ipcMocks.handleHandlers.has("onlyspeech:get-managed-text-to-speech-status")).toBe(false);
    expect(ipcMocks.handleHandlers.has("onlyspeech:manage-managed-text-to-speech")).toBe(false);
    expect(ipcMocks.handleHandlers.has("onlyspeech:synthesize-managed-text-to-speech")).toBe(false);
    expect(ipcMocks.handleHandlers.has("onlyspeech:release-managed-text-to-speech")).toBe(false);
  });

  it("gates the shutdown command when the runtime does not explicitly allow it", async () => {
    const shutdownComputer = vi.fn();

    registerIpcHandlers({
      getKioskManager: () => null,
      getTranslationProviderService: () => null,
      openSetupWizard: vi.fn(),
      shutdownComputer,
      canShutdownComputer: () => false
    });

    const handler = ipcMocks.handleHandlers.get(IPC_CHANNELS.shutdownComputer);

    await expect(Promise.resolve(handler?.(undefined))).resolves.toEqual({
      ok: false,
      message: "Shutdown command is disabled in this runtime."
    });
    expect(shutdownComputer).not.toHaveBeenCalled();
  });

  it("exposes the shutdown capability separately from command execution", async () => {
    registerIpcHandlers({
      getKioskManager: () => null,
      getTranslationProviderService: () => null,
      openSetupWizard: vi.fn(),
      canShutdownComputer: () => true
    });

    const handler = ipcMocks.handleHandlers.get(IPC_CHANNELS.getShutdownCapability);

    await expect(Promise.resolve(handler?.(undefined))).resolves.toBe(true);
  });

  it("executes the shutdown command only when the runtime explicitly allows it", async () => {
    const shutdownComputer = vi.fn();

    registerIpcHandlers({
      getKioskManager: () => null,
      getTranslationProviderService: () => null,
      openSetupWizard: vi.fn(),
      shutdownComputer,
      canShutdownComputer: () => true
    });

    const handler = ipcMocks.handleHandlers.get(IPC_CHANNELS.shutdownComputer);

    await expect(Promise.resolve(handler?.(undefined))).resolves.toEqual({
      ok: true
    });
    expect(shutdownComputer).toHaveBeenCalledTimes(1);
  });

  it("returns a structured shutdown failure result when the command throws", async () => {
    const shutdownComputer = vi.fn(async () => {
      throw new Error("Shutdown command failed: Access is denied.");
    });

    registerIpcHandlers({
      getKioskManager: () => null,
      getTranslationProviderService: () => null,
      openSetupWizard: vi.fn(),
      shutdownComputer,
      canShutdownComputer: () => true
    });

    const handler = ipcMocks.handleHandlers.get(IPC_CHANNELS.shutdownComputer);

    await expect(Promise.resolve(handler?.(undefined))).resolves.toEqual({
      ok: false,
      message: "Shutdown command failed: Access is denied."
    });
    expect(shutdownComputer).toHaveBeenCalledTimes(1);
  });
});
