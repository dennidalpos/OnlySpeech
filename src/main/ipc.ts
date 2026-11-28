import { ipcMain, type IpcMainEvent } from "electron";
import { IPC_CHANNELS } from "../shared/constants.js";
import { getAzureTextToSpeechCatalogSnapshotFromEnvironment } from "./azure-text-to-speech-catalog.js";
import { synthesizeTextToSpeech } from "./provider-text-to-speech-synthesizer.js";
import type {
  ActivationGateState,
  ActivationSubmissionRequest,
  ActivationSubmissionResult,
  DeviceProbePayload,
  OperatorAction,
  SetupWizardAccessRequest,
  SetupWizardAccessResult,
  SetupWizardAccessState,
  ShutdownComputerResult,
  StartTextToSpeechCommand,
  StopTextToSpeechRequest,
  SpeechTurnRequest,
  SpeechEventPayload,
  TextToSpeechEventPayload,
  TextToSpeechRequest
} from "../shared/types.js";
import type { KioskManager } from "./kiosk-manager.js";
import type { TranslationProviderService } from "../services/speech/translation-provider-service.js";
import {
  activationSubmissionRequestSchema,
  deviceProbePayloadSchema,
  operatorActionSchema,
  parsePayload,
  setupWizardAccessRequestSchema,
  speechEventPayloadSchema,
  speechTurnRequestSchema,
  startTextToSpeechCommandSchema,
  stopTextToSpeechRequestSchema,
  textToSpeechEventPayloadSchema,
  textToSpeechRequestSchema
} from "./ipc-payloads.js";

interface RuntimeBindings {
  getActivationGateState?: () => Promise<ActivationGateState> | ActivationGateState;
  submitActivation?: (
    request: ActivationSubmissionRequest
  ) => Promise<ActivationSubmissionResult> | ActivationSubmissionResult;
  submitTrial?: () => Promise<ActivationSubmissionResult> | ActivationSubmissionResult;
  getKioskManager: () => KioskManager | null;
  getTranslationProviderService: () => TranslationProviderService | null;
  openSetupWizard: () => Promise<void> | void;
  setDemoPaused?: (paused: boolean) => Promise<void> | void;
  getSetupWizardAccessState?: () => Promise<SetupWizardAccessState> | SetupWizardAccessState;
  requestSetupWizardAccess?: (
    request: SetupWizardAccessRequest
  ) => Promise<SetupWizardAccessResult> | SetupWizardAccessResult;
  shutdownComputer?: () => Promise<void> | void;
  canShutdownComputer?: () => boolean;
}

export function registerIpcHandlers(
  bindings: RuntimeBindings
): void {
  ipcMain.handle(IPC_CHANNELS.getActivationGateState, () => {
    if (!bindings.getActivationGateState) {
      return {
        status: "required",
        message: "Activation is required before startup can continue."
      } satisfies ActivationGateState;
    }

    return bindings.getActivationGateState();
  });

  ipcMain.handle(IPC_CHANNELS.submitActivation, (_event, request: ActivationSubmissionRequest) => {
    const parsedRequest = parsePayload(
      activationSubmissionRequestSchema,
      request,
      IPC_CHANNELS.submitActivation
    );

    if (!bindings.submitActivation) {
      return {
        ok: false,
        status: "invalid-state",
        message: "Activation is unavailable in this runtime."
      } satisfies ActivationSubmissionResult;
    }

    return bindings.submitActivation(parsedRequest);
  });

  ipcMain.handle(IPC_CHANNELS.submitTrial, () => {
    if (!bindings.submitTrial) {
      return {
        ok: false,
        status: "invalid-state",
        message: "Trial activation is unavailable in this runtime."
      } satisfies ActivationSubmissionResult;
    }

    return bindings.submitTrial();
  });

  ipcMain.on(IPC_CHANNELS.operatorAction, (_event: IpcMainEvent, action: OperatorAction) => {
    const parsedAction = parsePayload(operatorActionSchema, action, IPC_CHANNELS.operatorAction);
    bindings.getKioskManager()?.handleOperatorAction(parsedAction);
  });

  ipcMain.on(IPC_CHANNELS.openSetupWizard, () => {
    void bindings.openSetupWizard();
  });

  ipcMain.handle(IPC_CHANNELS.setDemoPaused, (_event, paused: boolean) => {
    if (typeof paused !== "boolean") {
      throw new Error(`Invalid ${IPC_CHANNELS.setDemoPaused} payload.`);
    }

    return bindings.setDemoPaused?.(paused);
  });

  ipcMain.handle(IPC_CHANNELS.getSetupWizardAccessState, () => {
    if (!bindings.getSetupWizardAccessState) {
      return {
        requiresPassword: false,
        mustChangePassword: false,
        temporaryPassword: null
      } satisfies SetupWizardAccessState;
    }

    return bindings.getSetupWizardAccessState();
  });

  ipcMain.handle(IPC_CHANNELS.requestSetupWizardAccess, async (_event, request: SetupWizardAccessRequest) => {
    const parsedRequest = parsePayload(
      setupWizardAccessRequestSchema,
      request,
      IPC_CHANNELS.requestSetupWizardAccess
    );

    if (bindings.requestSetupWizardAccess) {
      return bindings.requestSetupWizardAccess(parsedRequest);
    }

    await bindings.openSetupWizard();
    return { ok: true } satisfies SetupWizardAccessResult;
  });

  ipcMain.handle(IPC_CHANNELS.getAzureTextToSpeechCatalogSnapshot, async () => {
    return await getAzureTextToSpeechCatalogSnapshotFromEnvironment(process.env);
  });

  ipcMain.on(IPC_CHANNELS.deviceProbe, (_event: IpcMainEvent, payload: DeviceProbePayload) => {
    const parsedPayload = parsePayload(deviceProbePayloadSchema, payload, IPC_CHANNELS.deviceProbe);
    bindings.getKioskManager()?.handleDeviceProbe(parsedPayload);
  });

  ipcMain.on(IPC_CHANNELS.speechEvent, (_event: IpcMainEvent, payload: SpeechEventPayload) => {
    const parsedPayload = parsePayload(speechEventPayloadSchema, payload, IPC_CHANNELS.speechEvent);
    bindings.getKioskManager()?.handleSpeechEvent(parsedPayload);
  });

  ipcMain.handle(IPC_CHANNELS.processSpeechTurn, (_event, request: SpeechTurnRequest) => {
    const parsedRequest = parsePayload(speechTurnRequestSchema, request, IPC_CHANNELS.processSpeechTurn);
    const translationProviderService = bindings.getTranslationProviderService();
    if (!translationProviderService) {
      throw new Error("Translation provider service is not ready.");
    }

    return translationProviderService.processSpeechTurn(parsedRequest);
  });

  ipcMain.handle(IPC_CHANNELS.synthesizeTextToSpeech, (_event, request: StartTextToSpeechCommand) => {
    const parsedRequest = parsePayload(
      startTextToSpeechCommandSchema,
      request,
      IPC_CHANNELS.synthesizeTextToSpeech
    );
    return synthesizeTextToSpeech(parsedRequest);
  });

  ipcMain.on(IPC_CHANNELS.textToSpeechRequest, (_event: IpcMainEvent, request: TextToSpeechRequest) => {
    const parsedRequest = parsePayload(textToSpeechRequestSchema, request, IPC_CHANNELS.textToSpeechRequest);
    bindings.getKioskManager()?.handleTextToSpeechRequest(parsedRequest);
  });

  ipcMain.on(IPC_CHANNELS.textToSpeechStop, (_event: IpcMainEvent, request?: StopTextToSpeechRequest) => {
    const parsedRequest = request === undefined
      ? undefined
      : parsePayload(stopTextToSpeechRequestSchema, request, IPC_CHANNELS.textToSpeechStop);
    bindings.getKioskManager()?.handleTextToSpeechStop(parsedRequest);
  });

  ipcMain.on(IPC_CHANNELS.textToSpeechEvent, (_event: IpcMainEvent, payload: TextToSpeechEventPayload) => {
    const parsedPayload = parsePayload(
      textToSpeechEventPayloadSchema,
      payload,
      IPC_CHANNELS.textToSpeechEvent
    );
    bindings.getKioskManager()?.handleTextToSpeechEvent(parsedPayload);
  });

  ipcMain.handle(IPC_CHANNELS.getShutdownCapability, () => {
    return Boolean(bindings.canShutdownComputer?.());
  });

  ipcMain.handle(IPC_CHANNELS.shutdownComputer, async (_event, request?: unknown) => {
    if (request !== undefined) {
      throw new Error(`Invalid ${IPC_CHANNELS.shutdownComputer} payload.`);
    }

    if (!bindings.shutdownComputer || !bindings.canShutdownComputer?.()) {
      return {
        ok: false,
        message: "Shutdown command is disabled in this runtime."
      } satisfies ShutdownComputerResult;
    }

    try {
      await bindings.shutdownComputer();
      return {
        ok: true
      } satisfies ShutdownComputerResult;
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : String(error)
      } satisfies ShutdownComputerResult;
    }
  });
}
