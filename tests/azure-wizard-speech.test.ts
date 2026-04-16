import { afterEach, describe, expect, it, vi } from "vitest";
import { runAzureWizardSpeechTest } from "../src/tools/setup-wizard/azure-speech-test.js";

const mockState = vi.hoisted(() => ({
  recognizedResult: {
    text: "ciao mondo",
    translations: new Map([["en", "hello world"]])
  },
  detectedLanguage: "it-IT",
  startError: null as string | null,
  cancelDetails: null as string | null,
  lastConfig: null as { speechRecognitionLanguage?: string; targetLanguages: string[] } | null,
  lastMicrophoneDeviceId: "",
  lastWarmupAudio: null as MediaTrackConstraints | null
}));

vi.mock("microsoft-cognitiveservices-speech-sdk", () => {
  class MockTranslationRecognizer {
    recognized?: ((sender: unknown, event: { result: typeof mockState.recognizedResult }) => void) | undefined;
    canceled?: ((sender: unknown, event: { errorDetails?: string; reason?: string }) => void) | undefined;

    startContinuousRecognitionAsync(success?: () => void, error?: (message: string) => void): void {
      if (mockState.startError) {
        error?.(mockState.startError);
        return;
      }

      success?.();
      if (mockState.cancelDetails) {
        this.canceled?.(null, { errorDetails: mockState.cancelDetails });
        return;
      }

      this.recognized?.(null, { result: mockState.recognizedResult });
    }

    stopContinuousRecognitionAsync(success?: () => void): void {
      success?.();
    }

    close(): void {}
  }

  return {
    SpeechTranslationConfig: {
      fromSubscription: () => {
        const config = {
          targetLanguages: [] as string[],
          addTargetLanguage(language: string) {
            this.targetLanguages.push(language);
          },
          speechRecognitionLanguage: undefined as string | undefined
        };
        mockState.lastConfig = config;
        return config;
      }
    },
    AudioConfig: {
      fromMicrophoneInput: (deviceId: string) => {
        mockState.lastMicrophoneDeviceId = deviceId;
        return { deviceId };
      }
    },
    TranslationRecognizer: MockTranslationRecognizer
  };
});

describe("runAzureWizardSpeechTest", () => {
  afterEach(() => {
    mockState.startError = null;
    mockState.cancelDetails = null;
    mockState.detectedLanguage = "it-IT";
    mockState.lastConfig = null;
    mockState.lastMicrophoneDeviceId = "";
    mockState.lastWarmupAudio = null;
    vi.unstubAllGlobals();
  });

  it("runs a fixed-language azure microphone roundtrip in the renderer flow", async () => {
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn().mockImplementation(async (constraints: MediaStreamConstraints) => {
          mockState.lastWarmupAudio = constraints.audio as MediaTrackConstraints;
          return {
            getTracks: () => [{ stop: vi.fn() }]
          };
        })
      }
    });

    await expect(
      runAzureWizardSpeechTest({
        azureSpeechKey: "azure-key",
        azureSpeechRegion: "westeurope",
        sourceLanguage: "it-IT",
        targetLanguage: "en",
        microphoneDeviceId: "mic-a"
      })
    ).resolves.toEqual({
      transcript: "ciao mondo",
      translation: "hello world",
      detectedLanguage: undefined
    });

    expect(mockState.lastConfig?.speechRecognitionLanguage).toBe("it-IT");
    expect(mockState.lastConfig?.targetLanguages).toEqual(["en"]);
    expect(mockState.lastMicrophoneDeviceId).toBe("mic-a");
    expect(mockState.lastWarmupAudio).toEqual({
      deviceId: { exact: "mic-a" },
      echoCancellation: true,
      noiseSuppression: true
    });
  });

  it("surfaces azure recognizer cancellation details", async () => {
    mockState.cancelDetails = "Azure Speech recognizer canceled the request.";
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn().mockImplementation(async (constraints: MediaStreamConstraints) => {
          mockState.lastWarmupAudio = constraints.audio as MediaTrackConstraints;
          return {
            getTracks: () => [{ stop: vi.fn() }]
          };
        })
      }
    });

    await expect(
      runAzureWizardSpeechTest({
        azureSpeechKey: "azure-key",
        azureSpeechRegion: "westeurope",
        sourceLanguage: "it-IT",
        targetLanguage: "en",
        microphoneDeviceId: "mic-a"
      })
    ).rejects.toThrow("Azure Speech recognizer canceled the request.");
  });

  it("passes customized browser audio filters to the warmup capture", async () => {
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn().mockImplementation(async (constraints: MediaStreamConstraints) => {
          mockState.lastWarmupAudio = constraints.audio as MediaTrackConstraints;
          return {
            getTracks: () => [{ stop: vi.fn() }]
          };
        })
      }
    });

    await runAzureWizardSpeechTest({
      azureSpeechKey: "azure-key",
      azureSpeechRegion: "westeurope",
      sourceLanguage: "it-IT",
      targetLanguage: "en",
      microphoneDeviceId: "mic-a",
      audioEchoCancellation: false,
      audioNoiseSuppression: false
    });

    expect(mockState.lastWarmupAudio).toEqual({
      deviceId: { exact: "mic-a" },
      echoCancellation: false,
      noiseSuppression: false
    });
  });
});
