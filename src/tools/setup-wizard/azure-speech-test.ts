import * as SpeechSdk from "microsoft-cognitiveservices-speech-sdk";
import { resolveProviderTargetLanguageCode } from "../../shared/language-registry.js";
import type { SpeechTurnResult } from "../../shared/types.js";

const DEFAULT_AZURE_WIZARD_TIMEOUT_MS = 15000;

export interface AzureWizardSpeechTestRequest {
  azureSpeechKey: string;
  azureSpeechRegion: string;
  sourceLanguage: string;
  targetLanguage: string;
  microphoneDeviceId: string;
  audioEchoCancellation?: boolean;
  audioNoiseSuppression?: boolean;
  timeoutMs?: number;
}

function buildWarmupConstraints(request: AzureWizardSpeechTestRequest): MediaTrackConstraints {
  return {
    deviceId: { exact: request.microphoneDeviceId },
    echoCancellation: request.audioEchoCancellation ?? true,
    noiseSuppression: request.audioNoiseSuppression ?? true
  };
}

function stopRecognizer(recognizer: SpeechSdk.TranslationRecognizer): Promise<void> {
  return new Promise((resolve) => {
    recognizer.stopContinuousRecognitionAsync(
      () => {
        recognizer.close();
        resolve();
      },
      () => {
        recognizer.close();
        resolve();
      }
    );
  });
}

function createRecognizer(request: AzureWizardSpeechTestRequest): SpeechSdk.TranslationRecognizer {
  const config = SpeechSdk.SpeechTranslationConfig.fromSubscription(
    request.azureSpeechKey,
    request.azureSpeechRegion
  );
  const azureTargetLanguage =
    resolveProviderTargetLanguageCode(request.targetLanguage, "azure", {
      includeProviderExpansions: true
    }) ?? request.targetLanguage;
  config.addTargetLanguage(azureTargetLanguage);
  config.speechRecognitionLanguage = request.sourceLanguage;

  const audioConfig = SpeechSdk.AudioConfig.fromMicrophoneInput(request.microphoneDeviceId);
  return new SpeechSdk.TranslationRecognizer(config, audioConfig);
}

export async function runAzureWizardSpeechTest(
  request: AzureWizardSpeechTestRequest
): Promise<SpeechTurnResult> {
  if (!request.azureSpeechKey.trim()) {
    throw new Error("Azure Speech test requires AZURE_SPEECH_KEY.");
  }

  if (!request.azureSpeechRegion.trim()) {
    throw new Error("Azure Speech test requires AZURE_SPEECH_REGION.");
  }

  if (!request.microphoneDeviceId.trim()) {
    throw new Error("Azure Speech test requires a microphone device id.");
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Browser media capture is not available in this Electron renderer.");
  }

  const warmupStream = await navigator.mediaDevices.getUserMedia({
    audio: buildWarmupConstraints(request),
    video: false
  });
  warmupStream.getTracks().forEach((track) => track.stop());

  const recognizer = createRecognizer(request);
  const azureTargetLanguage =
    resolveProviderTargetLanguageCode(request.targetLanguage, "azure", {
      includeProviderExpansions: true
    }) ?? request.targetLanguage;
  const timeoutMs = Math.max(1000, request.timeoutMs ?? DEFAULT_AZURE_WIZARD_TIMEOUT_MS);

  return await new Promise<SpeechTurnResult>((resolve, reject) => {
    let settled = false;

    const finish = async (
      action: "resolve" | "reject",
      value: SpeechTurnResult | Error
    ): Promise<void> => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutHandle);
      await stopRecognizer(recognizer);

      if (action === "resolve") {
        resolve(value as SpeechTurnResult);
        return;
      }

      reject(value);
    };

    const timeoutHandle = globalThis.setTimeout(() => {
      void finish(
        "reject",
        new Error(`Azure microphone test timed out after ${timeoutMs}ms without a recognized utterance.`)
      );
    }, timeoutMs);

    recognizer.recognized = (_sender, event) => {
      if (!event.result.text?.trim()) {
        return;
      }

      void finish("resolve", {
        transcript: event.result.text,
        translation: event.result.translations.get(azureTargetLanguage) || ""
      });
    };

    recognizer.canceled = (_sender, event) => {
      const details = event.errorDetails || String(event.reason || "Azure Speech recognition canceled.");
      void finish("reject", new Error(details));
    };

    recognizer.startContinuousRecognitionAsync(
      () => undefined,
      (error) => {
        void finish("reject", new Error(error));
      }
    );
  });
}
