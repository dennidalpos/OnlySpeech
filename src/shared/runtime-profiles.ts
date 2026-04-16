export type AppMode = "kiosk" | "demo";
export type MicrophonePttMode = "dual-dedicated" | "single-shared";

export const SUPPORTED_APP_MODES = ["kiosk", "demo"] as const;
export const SUPPORTED_MICROPHONE_PTT_MODES = [
  "dual-dedicated",
  "single-shared"
] as const;

export const DEFAULT_APP_MODE: AppMode = "kiosk";
export const DEFAULT_MICROPHONE_PTT_MODE: MicrophonePttMode = "dual-dedicated";

export function resolveSupportedAppMode(value: string | null | undefined): AppMode {
  return value === "demo" ? "demo" : "kiosk";
}

export function resolveMicrophonePttMode(value: string | null | undefined): MicrophonePttMode {
  return value === "single-shared" ? "single-shared" : "dual-dedicated";
}

export function isRuntimeHardwareIssue(code: string): boolean {
  return (
    code === "missing-monitor" ||
    code === "missing-microphone-a" ||
    code === "missing-microphone-b" ||
    code === "microphone-permission-denied" ||
    code === "microphone-unavailable"
  );
}

export function hasBlockingIssuesThatPreventInterface(
  issues: Array<{
    code: string;
  }>
): boolean {
  return issues.some((issue) => !isRuntimeHardwareIssue(issue.code));
}
