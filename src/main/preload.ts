import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/constants.js";
import type { OnlySpeechRendererApi } from "../shared/onlyspeech-api.js";
import type {
  ActivationGateState,
  ActivationSubmissionRequest,
  ActivationSubmissionResult,
  AppState,
  RendererCommand,
  SetupWizardAccessRequest,
  SetupWizardAccessResult,
  SetupWizardAccessState,
  ShutdownComputerResult,
  StopTextToSpeechRequest,
  SpeechTurnResult,
  TextToSpeechEventPayload,
  TextToSpeechRequest,
} from "../shared/types.js";

const api: OnlySpeechRendererApi = {
  getActivationGateState(): Promise<ActivationGateState> {
    return ipcRenderer.invoke(IPC_CHANNELS.getActivationGateState);
  },
  submitActivation(request: ActivationSubmissionRequest): Promise<ActivationSubmissionResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.submitActivation, request);
  },
  submitTrial(): Promise<ActivationSubmissionResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.submitTrial);
  },
  sendOperatorAction(action) {
    ipcRenderer.send(IPC_CHANNELS.operatorAction, action);
  },
  openSetupWizard() {
    ipcRenderer.send(IPC_CHANNELS.openSetupWizard);
  },
  setDemoPaused(paused: boolean): Promise<void> {
    return ipcRenderer.invoke(IPC_CHANNELS.setDemoPaused, paused);
  },
  getSetupWizardAccessState(): Promise<SetupWizardAccessState> {
    return ipcRenderer.invoke(IPC_CHANNELS.getSetupWizardAccessState);
  },
  requestSetupWizardAccess(request: SetupWizardAccessRequest): Promise<SetupWizardAccessResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.requestSetupWizardAccess, request);
  },
  getShutdownCapability(): Promise<boolean> {
    return ipcRenderer.invoke(IPC_CHANNELS.getShutdownCapability);
  },
  sendDeviceProbe(payload) {
    ipcRenderer.send(IPC_CHANNELS.deviceProbe, payload);
  },
  sendSpeechEvent(payload) {
    ipcRenderer.send(IPC_CHANNELS.speechEvent, payload);
  },
  processSpeechTurn(request): Promise<SpeechTurnResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.processSpeechTurn, request);
  },
  synthesizeTextToSpeech(request) {
    return ipcRenderer.invoke(IPC_CHANNELS.synthesizeTextToSpeech, request);
  },
  requestTextToSpeech(request: TextToSpeechRequest) {
    ipcRenderer.send(IPC_CHANNELS.textToSpeechRequest, request);
  },
  stopTextToSpeech(request?: StopTextToSpeechRequest) {
    ipcRenderer.send(IPC_CHANNELS.textToSpeechStop, request);
  },
  sendTextToSpeechEvent(payload: TextToSpeechEventPayload) {
    ipcRenderer.send(IPC_CHANNELS.textToSpeechEvent, payload);
  },
  shutdownComputer(): Promise<ShutdownComputerResult> {
    return ipcRenderer.invoke(IPC_CHANNELS.shutdownComputer);
  },
  onState(listener: (state: AppState) => void) {
    const wrapped = (_event: Electron.IpcRendererEvent, state: AppState) => listener(state);
    ipcRenderer.on(IPC_CHANNELS.state, wrapped);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.state, wrapped);
  },
  onCommand(listener: (command: RendererCommand) => void) {
    const wrapped = (_event: Electron.IpcRendererEvent, command: RendererCommand) => listener(command);
    ipcRenderer.on(IPC_CHANNELS.command, wrapped);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.command, wrapped);
  }
};

contextBridge.exposeInMainWorld("onlySpeech", api);
