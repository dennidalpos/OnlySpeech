import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../shared/constants.js";
import { TextToSpeechClient } from "../../services/speech/text-to-speech-client.js";
import type { ProbeMicrophoneInfo } from "../env-probe-output.js";
import type { EnvKey } from "../env-probe-output.js";
import type { WizardLicenseInfo, WizardSide, WizardState } from "./shared.js";
import type {
  AzureTextToSpeechCatalogSnapshot,
  SetupWizardTextToSpeechPreviewResult,
  SpeechTurnResult,
  TrialAvailabilityState,
  TextToSpeechEventPayload,
  TranslationProvider
} from "../../shared/types.js";

interface SaveEnvResult {
  envPath: string;
  preview: string;
  secretStorageMode: "dotenv" | "windows-secure-store";
  storedSecretKeys: string[];
  autostartEnabled: boolean;
  autostartSupported: boolean;
  temporaryWizardPassword: string | null;
  mustChangeWizardPassword: boolean;
}

interface OpenLogsFolderResult {
  path: string;
}

interface ProviderTranslationTestRequest {
  provider: TranslationProvider;
  sourceLanguage: string;
  targetLanguage: string;
  text: string;
}

interface ProviderTranslationTestResult {
  provider: TranslationProvider;
  mode: "translation" | "validation";
  output: string;
}

interface ProviderSpeechTestRequest {
  provider: TranslationProvider;
  sourceLanguage: string;
  targetLanguage: string;
  audioBase64?: string;
  audioMimeType?: string;
  microphoneDeviceId?: string;
  azureSpeechKey?: string;
  azureSpeechRegion?: string;
  audioEchoCancellation?: boolean;
  audioNoiseSuppression?: boolean;
  timeoutMs?: number;
}

interface ProviderPlaybackNormalizationRequest {
  provider: TranslationProvider;
  targetLanguage: string;
  text: string;
}

interface ProviderPlaybackNormalizationResult {
  outputText: string;
  targetLanguage: string;
  mode: "translated" | "passthrough";
}

interface TextToSpeechTestRequest {
  requestId?: string;
  text: string;
  language: string;
  voiceId?: string | null;
  translationProvider?: TranslationProvider | null;
  azureSpeechKey?: string | null;
  azureSpeechRegion?: string | null;
  chatGptApiKey?: string | null;
}

const wizardTextToSpeechEventListeners = new Set<(event: TextToSpeechEventPayload) => void>();
const wizardTextToSpeechClient = new TextToSpeechClient({
  synthesizeTextToSpeech: (command) => ipcRenderer.invoke(IPC_CHANNELS.synthesizeTextToSpeech, command)
});

let wizardTextToSpeechSequence = 0;

function emitWizardTextToSpeechEvent(event: TextToSpeechEventPayload): void {
  for (const listener of wizardTextToSpeechEventListeners) {
    listener(event);
  }
}

async function runProviderTextToSpeechPreview(
  request: TextToSpeechTestRequest
): Promise<SetupWizardTextToSpeechPreviewResult> {
  const translationProvider = request.translationProvider ?? "chatgpt";
  const normalization = (await ipcRenderer.invoke("wizard:normalize-provider-playback-text", {
    provider: translationProvider,
    targetLanguage: request.language,
    text: request.text
  } satisfies ProviderPlaybackNormalizationRequest)) as ProviderPlaybackNormalizationResult;
  const normalizedText = normalization.outputText.trim();
  if (!normalizedText) {
    throw new Error("Provider playback normalization returned no text to synthesize.");
  }
  const requestId = `wizard-tts-${Date.now()}-${++wizardTextToSpeechSequence}`;
  const command = {
    type: "start-tts" as const,
    side: "A" as const,
    content: "technical" as const,
    requestId: request.requestId?.trim() || requestId,
    text: normalizedText,
    language: normalization.targetLanguage,
    engine: translationProvider === "azure" ? ("azure" as const) : ("openai" as const),
    translationProvider,
    azureSpeechKey: request.azureSpeechKey ?? null,
    azureSpeechRegion: request.azureSpeechRegion ?? null,
    chatGptApiKey: request.chatGptApiKey ?? null
  };
  const initialEvent = await new Promise<TextToSpeechEventPayload>((resolve, reject) => {
    let settled = false;
    const timeoutHandle = window.setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      reject(new Error("Timed out while starting the provider playback preview."));
    }, 2000);
    const maybeResolve = (event: TextToSpeechEventPayload) => {
      if (
        settled ||
        event.requestId !== command.requestId ||
        !["started", "error", "unavailable"].includes(event.type)
      ) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutHandle);
      resolve(event);
    };

    void wizardTextToSpeechClient
      .start(command, {
        onEvent: (event) => {
          emitWizardTextToSpeechEvent(event);
          maybeResolve(event);
        }
      })
      .catch((error) => {
        if (settled) {
          return;
        }

        settled = true;
        window.clearTimeout(timeoutHandle);
        reject(error);
      });
  });

  if (initialEvent.type !== "started") {
    throw new Error(initialEvent.error || "Provider playback preview is unavailable.");
  }

  return {
    requestId: command.requestId,
    engine: initialEvent.engine,
    language: initialEvent.language,
    voiceName: initialEvent.voiceName ?? null,
    normalizedText,
    requestedLanguage: request.language,
    translated: normalization.mode === "translated"
  };
}

async function runAzureWizardSpeechTestOnDemand(request: ProviderSpeechTestRequest): Promise<SpeechTurnResult> {
  const { runAzureWizardSpeechTest } = await import("./azure-speech-test.js");

  return runAzureWizardSpeechTest({
    azureSpeechKey: request.azureSpeechKey ?? "",
    azureSpeechRegion: request.azureSpeechRegion ?? "",
    sourceLanguage: request.sourceLanguage,
    targetLanguage: request.targetLanguage,
    microphoneDeviceId: request.microphoneDeviceId ?? "",
    audioEchoCancellation: request.audioEchoCancellation,
    audioNoiseSuppression: request.audioNoiseSuppression,
    timeoutMs: request.timeoutMs
  });
}

const api = {
  getState(): Promise<WizardState> {
    return ipcRenderer.invoke("wizard:get-state");
  },
  assignDisplay(side: WizardSide | null, displayId: number): Promise<WizardState> {
    return ipcRenderer.invoke("wizard:assign-display", { side, displayId });
  },
  assignMicrophone(side: WizardSide, deviceId: string | null): Promise<WizardState> {
    return ipcRenderer.invoke("wizard:assign-microphone", { side, deviceId });
  },
  updateMicrophones(payload: {
    microphones: ProbeMicrophoneInfo[];
    microphonePermissionGranted: boolean;
    microphoneError: string | null;
  }): Promise<WizardState> {
    return ipcRenderer.invoke("wizard:update-microphones", payload);
  },
  updateSignalLevel(side: WizardSide, level: number): Promise<WizardState> {
    return ipcRenderer.invoke("wizard:update-signal-level", { side, level });
  },
  updateEnvValues(values: Partial<Record<EnvKey, string>>): Promise<WizardState> {
    return ipcRenderer.invoke("wizard:update-env-values", values);
  },
  updateAutostart(selectedEnabled: boolean): Promise<WizardState> {
    return ipcRenderer.invoke("wizard:update-autostart", { selectedEnabled });
  },
  previewEnv(): Promise<string> {
    return ipcRenderer.invoke("wizard:preview-env");
  },
  saveEnv(): Promise<SaveEnvResult> {
    return ipcRenderer.invoke("wizard:save-env");
  },
  getAzureTextToSpeechCatalog(): Promise<AzureTextToSpeechCatalogSnapshot> {
    return ipcRenderer.invoke("wizard:get-azure-text-to-speech-catalog");
  },
  testTextToSpeech(
    request: TextToSpeechTestRequest
  ): Promise<SetupWizardTextToSpeechPreviewResult> {
    return ipcRenderer.invoke("wizard:get-state").then((currentState: WizardState) =>
      runProviderTextToSpeechPreview({
        ...request,
        azureSpeechKey:
          request.azureSpeechKey ?? currentState?.envValues?.AZURE_SPEECH_KEY ?? "",
        azureSpeechRegion:
          request.azureSpeechRegion ?? currentState?.envValues?.AZURE_SPEECH_REGION ?? "",
        chatGptApiKey:
          request.chatGptApiKey ?? currentState?.envValues?.CHATGPT_API_KEY ?? ""
      })
    );
  },
  releaseTextToSpeech(requestId: string): Promise<void> {
    return wizardTextToSpeechClient.stop(
      {
        type: "stop-tts",
        side: "A",
        requestId
      },
      {
        onEvent: emitWizardTextToSpeechEvent
      }
    );
  },
  onTextToSpeechEvent(listener: (event: TextToSpeechEventPayload) => void): () => void {
    wizardTextToSpeechEventListeners.add(listener);
    return () => wizardTextToSpeechEventListeners.delete(listener);
  },
  openLogsFolder(): Promise<OpenLogsFolderResult> {
    return ipcRenderer.invoke("wizard:open-logs-folder");
  },
  testProviderTranslation(
    request: ProviderTranslationTestRequest
  ): Promise<ProviderTranslationTestResult> {
    return ipcRenderer.invoke("wizard:test-provider-translation", request);
  },
  testProviderSpeech(
    request: ProviderSpeechTestRequest
  ): Promise<SpeechTurnResult> {
    if (request.provider === "azure") {
      return runAzureWizardSpeechTestOnDemand(request);
    }

    return ipcRenderer.invoke("wizard:test-provider-speech", request);
  },
  openMonitorSetup(): Promise<void> {
    return ipcRenderer.invoke("wizard:open-monitor-setup");
  },
  closeMonitorSetup(): void {
    ipcRenderer.send("wizard:close-monitor-setup");
  },
  closeCurrentOverlay(): void {
    ipcRenderer.send("wizard:close-current-overlay");
  },
  closeWizard(): void {
    ipcRenderer.send("wizard:close");
  },
  onState(listener: (state: WizardState) => void): () => void {
    const wrapped = (_event: Electron.IpcRendererEvent, state: WizardState) => listener(state);
    ipcRenderer.on("wizard:state", wrapped);
    return () => ipcRenderer.removeListener("wizard:state", wrapped);
  },
  getLicenseState(): Promise<WizardLicenseInfo | null> {
    return ipcRenderer.invoke("wizard:get-license-state");
  },
  getTrialAvailability(): Promise<TrialAvailabilityState> {
    return ipcRenderer.invoke("wizard:get-trial-availability");
  },
  submitNewLicense(request: { email: string; activationCode: string }): Promise<{ ok: boolean; message?: string }> {
    return ipcRenderer.invoke("wizard:submit-new-license", request);
  },
  clearLicense(): Promise<{ ok: boolean }> {
    return ipcRenderer.invoke("wizard:clear-license");
  },
  submitTrial(): Promise<{ ok: boolean; message?: string }> {
    return ipcRenderer.invoke("wizard:submit-trial");
  },
  terminateApplication(): Promise<{ ok: boolean }> {
    return ipcRenderer.invoke("wizard:terminate-application");
  }
};

contextBridge.exposeInMainWorld("onlySpeechWizard", api);
