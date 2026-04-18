import type { WizardAutostartState } from "../tools/setup-wizard/shared.js";
import { execFileSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Wizard-managed autostart (packaged installs)
// ---------------------------------------------------------------------------
// The setup wizard owns the current user's Run entry for packaged builds.
// HKCU does not require elevation, so the operator can enable/disable startup
// from the wizard without relying on the elevated installer or regedit.
//
// Source-mode (dev) sessions report autostart as unsupported because no
// packaged executable path is present to launch at sign-in.
// ---------------------------------------------------------------------------

const RUN_KEY_PATH = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
const RUN_VALUE_NAME = "OnlySpeech";

interface ResolveWizardAutostartStateOptions {
  isPackaged: boolean;
  currentUserRunValue?: string | null;
}

export function resolveWizardAutostartState(
  options: ResolveWizardAutostartStateOptions
): WizardAutostartState {
  if (!options.isPackaged) {
    // Source-mode / dev session: the packaged Run-key contract stays canonical,
    // but no packaged executable exists yet to register it.
    return {
      mechanism: "current-user-run-key",
      scope: "current-user",
      supported: false,
      canModify: false,
      currentEnabled: false,
      selectedEnabled: false
    };
  }

  const currentEnabled = Boolean(options.currentUserRunValue?.trim());

  return {
    mechanism: "current-user-run-key",
    scope: "current-user",
    supported: true,
    canModify: true,
    currentEnabled,
    selectedEnabled: currentEnabled
  };
}

function normalizeRunValue(executablePath: string): string {
  return `"${executablePath}"`;
}

export function readCurrentUserAutostartValue(): string | null {
  try {
    const output = execFileSync("reg.exe", ["query", RUN_KEY_PATH, "/v", RUN_VALUE_NAME], {
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"]
    });
    const match = output.match(/OnlySpeech\s+REG_\w+\s+(.+)/);
    return match?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

export function getWizardAutostartState(options: {
  isPackaged: boolean;
}): WizardAutostartState {
  return resolveWizardAutostartState({
    isPackaged: options.isPackaged,
    currentUserRunValue: options.isPackaged ? readCurrentUserAutostartValue() : null
  });
}

export function applyWizardAutostartSelection(options: {
  enabled: boolean;
  executablePath: string;
}): WizardAutostartState {
  if (options.enabled) {
    execFileSync(
      "reg.exe",
      ["add", RUN_KEY_PATH, "/v", RUN_VALUE_NAME, "/t", "REG_SZ", "/d", normalizeRunValue(options.executablePath), "/f"],
      {
        encoding: "utf8",
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
  } else {
    try {
      execFileSync("reg.exe", ["delete", RUN_KEY_PATH, "/v", RUN_VALUE_NAME, "/f"], {
        encoding: "utf8",
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"]
      });
    } catch {
      // Deleting an already-absent HKCU Run value exits non-zero; the requested
      // state is still disabled.
    }
  }

  return resolveWizardAutostartState({
    isPackaged: true,
    currentUserRunValue: options.enabled ? normalizeRunValue(options.executablePath) : null
  });
}
