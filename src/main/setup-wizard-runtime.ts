import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { app, session } from "electron";
import { parse as parseEnv } from "dotenv";
import { loadRuntimeConfig } from "../shared/config.js";
import type { RuntimeConfig } from "../shared/types.js";
import type { EnvKey, ProbeDisplayInfo } from "../tools/env-probe-output.js";
import {
  createInitialWizardState,
  assignDisplay,
  type WizardAutostartState,
  type WizardState
} from "../tools/setup-wizard/shared.js";
import { getRuntimeEnvFilePath, getRuntimeExampleEnvPath, getRuntimeSecretsFilePath } from "./runtime-paths.js";
import { getAvailableDisplays } from "./display-source.js";
import { isSecureRuntimeSecretStorageEnabled, loadStoredRuntimeSecrets } from "./runtime-secrets.js";
import { applyMediaPermissionPolicy } from "./media-permission-policy.js";

export function readBaseEnv(runtimeRoot: string): Partial<Record<EnvKey, string>> {
  const secureSecretValues = isSecureRuntimeSecretStorageEnabled({ isPackaged: app.isPackaged })
    ? loadStoredRuntimeSecrets({
      runtimeRoot,
      secretsFilePath: getRuntimeSecretsFilePath(app.getPath("userData")),
      secureStorageEnabled: true
    })
    : {};

  try {
    return {
      ...(parseEnv(readFileSync(getRuntimeEnvFilePath(runtimeRoot), "utf8")) as Partial<Record<EnvKey, string>>),
      ...secureSecretValues
    };
  } catch {
    try {
      return {
        ...(parseEnv(readFileSync(getRuntimeExampleEnvPath(runtimeRoot), "utf8")) as Partial<Record<EnvKey, string>>),
        ...secureSecretValues
      };
    } catch {
      return secureSecretValues;
    }
  }
}

export function collectDisplays(): ProbeDisplayInfo[] {
  return getAvailableDisplays().map((display) => ({
    displayId: display.id,
    label: display.label,
    bounds: display.bounds,
    scaleFactor: display.scaleFactor
  }));
}

export function configureWizardPermissions(): void {
  applyMediaPermissionPolicy(session.defaultSession);
}

export function createRuntimeConfigFromWizardEnv(envValues: Partial<Record<EnvKey, string>>): RuntimeConfig {
  return loadRuntimeConfig(envValues as NodeJS.ProcessEnv);
}

export function getRuntimeLogsDirectory(): string {
  return join(app.getPath("userData"), "logs");
}

export function applyStoredDisplayAssignments(state: WizardState): WizardState {
  let nextState = { ...state };
  const displayA = Number(nextState.envValues.DISPLAY_A_ID);
  const displayB = Number(nextState.envValues.DISPLAY_B_ID);

  if (Number.isFinite(displayA) && nextState.displays.some((display) => display.displayId === displayA)) {
    nextState = {
      ...nextState,
      displays: assignDisplay(nextState.displays, "A", displayA)
    };
  }

  if (Number.isFinite(displayB) && nextState.displays.some((display) => display.displayId === displayB)) {
    nextState = {
      ...nextState,
      displays: assignDisplay(nextState.displays, "B", displayB)
    };
  }

  return nextState;
}

export function createInitialWizardRuntimeState(runtimeRoot: string): WizardState {
  return createInitialWizardRuntimeStateWithAutostart(runtimeRoot, {
    mechanism: "startup-shortcut",
    scope: "current-user",
    supported: false,
    canModify: false,
    currentEnabled: false,
    selectedEnabled: false
  });
}

export function createInitialWizardRuntimeStateWithAutostart(
  runtimeRoot: string,
  autostart: WizardAutostartState
): WizardState {
  return {
    ...applyStoredDisplayAssignments(createInitialWizardState(collectDisplays(), readBaseEnv(runtimeRoot))),
    autostart
  };
}

export function hasRuntimeEnvFile(runtimeRoot: string): boolean {
  return existsSync(getRuntimeEnvFilePath(runtimeRoot));
}
