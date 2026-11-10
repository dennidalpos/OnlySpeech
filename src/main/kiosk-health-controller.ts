import { selectMicrophoneAssignments } from "../services/audio/microphone-selection.js";
import { JsonlLogger } from "../services/logging/jsonl-logger.js";
import { SessionStore } from "../services/session/session-store.js";
import type {
  DeviceProbePayload,
  DisplayAssignment,
  HealthState,
  MicrophoneAssignment,
  MicrophoneDevice,
  RuntimeConfig,
  TechnicalIssue
} from "../shared/types.js";
import { buildHealthState, getBlockingIssueSignature } from "./kiosk-health.js";

interface KioskHealthControllerOptions {
  config: RuntimeConfig;
  sessionStore: SessionStore;
  logger: JsonlLogger;
}

export class KioskHealthController {
  private readonly latestDeviceReports = new Map<"A" | "B", DeviceProbePayload>();

  private readonly latestDeviceIssues = new Map<"A" | "B", TechnicalIssue[]>();

  private latestDisplayAssignments: DisplayAssignment[] = [];

  private latestDisplayIssues: TechnicalIssue[] = [];

  private latestMicrophoneAssignments: MicrophoneAssignment[] = [];

  private latestMicrophoneIssues: TechnicalIssue[] = [];

  private transientIssues: TechnicalIssue[] = [];

  private lastBlockingIssueSignature = "";

  constructor(private readonly options: KioskHealthControllerOptions) {}

  setDisplayState(assignments: DisplayAssignment[], issues: TechnicalIssue[]): void {
    this.latestDisplayAssignments = assignments;
    this.latestDisplayIssues = issues;
    this.rebuildHealthState();
  }

  clearTransientIssues(): void {
    this.transientIssues = [];
    this.rebuildHealthState();
  }

  clearTransientIssuesMatching(predicate: (issue: TechnicalIssue) => boolean): void {
    const nextIssues = this.transientIssues.filter((issue) => !predicate(issue));
    if (nextIssues.length === this.transientIssues.length) {
      return;
    }

    this.transientIssues = nextIssues;
    this.rebuildHealthState();
  }

  setTransientIssues(issues: TechnicalIssue[]): void {
    this.transientIssues = issues;
    this.rebuildHealthState();
  }

  handleDeviceProbe(payload: DeviceProbePayload): void {
    this.latestDeviceReports.set(payload.side, payload);
    this.latestDeviceIssues.set(payload.side, this.createProbeIssues(payload));

    const mergedDevices = this.mergeReportedDevices();
    const selected = selectMicrophoneAssignments(mergedDevices, this.options.config);
    this.latestMicrophoneAssignments = selected.assignments;
    this.latestMicrophoneIssues = this.deduplicateIssues([
      ...this.filterSelectionIssues(selected.issues),
      ...[...this.latestDeviceIssues.values()].flat()
    ]);

    this.logDeviceProbe(payload, mergedDevices, selected.assignments);

    this.rebuildHealthState();
  }

  getMicrophoneAssignments(): MicrophoneAssignment[] {
    return this.options.sessionStore.getState().health.microphoneAssignments;
  }

  private mergeReportedDevices(): MicrophoneDevice[] {
    const devices = [...this.latestDeviceReports.values()].flatMap((report) => report.devices);
    return devices.filter(
      (device, index, all) => all.findIndex((candidate) => candidate.deviceId === device.deviceId) === index
    );
  }

  private createProbeIssues(payload: DeviceProbePayload): TechnicalIssue[] {
    const failureKind = payload.failureKind ?? (!payload.permissionGranted ? "permission-denied" : undefined);

    switch (failureKind) {
      case "permission-denied":
        return [
          {
            code: "microphone-permission-denied",
            message: "Accesso al microfono bloccato per la postazione.",
            retryable: true,
            side: payload.side
          }
        ];
      case "device-unavailable":
        return [
          {
            code: "microphone-unavailable",
            message: "Il microfono assegnato non e disponibile o non e acquisibile.",
            retryable: true,
            side: payload.side
          }
        ];
      default:
        return [];
    }
  }

  private deduplicateIssues(issues: TechnicalIssue[]): TechnicalIssue[] {
    return issues.filter(
      (issue, index, all) =>
        all.findIndex((candidate) =>
          candidate.code === issue.code &&
          candidate.side === issue.side &&
          candidate.message === issue.message
        ) === index
    );
  }

  private filterSelectionIssues(issues: TechnicalIssue[]): TechnicalIssue[] {
    return issues.filter((issue) => {
      if (!issue.side) {
        return true;
      }

      if (!this.latestDeviceReports.has(issue.side)) {
        return false;
      }

      return (this.latestDeviceIssues.get(issue.side) ?? []).length === 0;
    });
  }

  private logDeviceProbe(
    payload: DeviceProbePayload,
    devices: MicrophoneDevice[],
    assignments: MicrophoneAssignment[]
  ): void {
    const failureKind = payload.failureKind ?? (!payload.permissionGranted ? "permission-denied" : undefined);

    if (failureKind === "permission-denied") {
      this.options.logger.log({
        session_id: this.options.sessionStore.getState().sessionId,
        side: payload.side,
        event: "microphone_permission_denied",
        details: {
          permissionGranted: payload.permissionGranted,
          error: payload.error ?? null
        }
      });
      return;
    }

    if (failureKind === "device-unavailable") {
      this.options.logger.log({
        session_id: this.options.sessionStore.getState().sessionId,
        side: payload.side,
        event: "microphone_device_unavailable",
        details: {
          error: payload.error ?? null
        }
      });
    }

    this.options.logger.log({
      session_id: this.options.sessionStore.getState().sessionId,
      event: "microphone_detection",
      details: {
        devices,
        assignments
      }
    });
  }

  private rebuildHealthState(): void {
    const health: HealthState = buildHealthState({
      config: this.options.config,
      displayIssues: this.latestDisplayIssues,
      microphoneIssues: this.latestMicrophoneIssues,
      transientIssues: this.transientIssues,
      displayAssignments: this.latestDisplayAssignments,
      microphoneAssignments: this.latestMicrophoneAssignments
    });

    this.options.sessionStore.setHealth(health);
    this.logBlockingIssuesIfChanged(health.blockingIssues);
  }

  private logBlockingIssuesIfChanged(blockingIssues: TechnicalIssue[]): void {
    const signature = getBlockingIssueSignature(blockingIssues);

    if (signature === this.lastBlockingIssueSignature) {
      return;
    }

    this.lastBlockingIssueSignature = signature;

    for (const issue of blockingIssues) {
      this.options.logger.log({
        session_id: this.options.sessionStore.getState().sessionId,
        side: issue.side,
        event: "technical_error",
        details: {
          code: issue.code,
          retryable: issue.retryable,
          details: issue.details ?? null
        },
        error: issue.message
      });
    }
  }
}
