import { createRequire } from "node:module";
import { join } from "node:path";
import process from "node:process";

interface ElectronAppLike {
  isPackaged: boolean;
}

const DEFAULT_APP_PROFILE_NAME = "OnlySpeech";
const DEFAULT_SESSION_DATA_DIRECTORY = "session-data";
const DEFAULT_CONFIG_DIRECTORY = "config";
const DEFAULT_RUNTIME_SECRETS_FILE_NAME = "runtime-secrets.json";
const DEFAULT_SETUP_WIZARD_ACCESS_FILE_NAME = "setup-wizard-access.json";
const DEFAULT_ACTIVATION_STATE_FILE_NAME = "activation-state.json";
const requireFromRuntimePaths = createRequire(import.meta.url);

export interface RuntimeRootSelectionOptions {
  isPackaged: boolean;
  currentWorkingDirectory: string;
  packagedDefaultRoot: string;
}

export interface RuntimeRootResolutionOptions {
  packagedDefaultRoot?: string;
  electronApp?: ElectronAppLike;
}

export interface AppProfilePathOptions {
  platform?: NodeJS.Platform;
  localAppDataPath?: string | null;
  appDataPath?: string | null;
  userProfilePath?: string | null;
  homeDrivePath?: string | null;
  homePath?: string | null;
  appName?: string;
}

export interface AppProfilePaths {
  userDataPath: string;
  sessionDataPath: string;
}

export function getRuntimeEnvFilePath(runtimeRoot: string): string {
  return join(runtimeRoot, ".env");
}

export function getRuntimeExampleEnvPath(runtimeRoot: string): string {
  return join(runtimeRoot, ".env.example");
}

export function getRuntimeSecretsFilePath(userDataPath: string): string {
  return join(userDataPath, DEFAULT_CONFIG_DIRECTORY, DEFAULT_RUNTIME_SECRETS_FILE_NAME);
}

export function getSetupWizardAccessFilePath(userDataPath: string): string {
  return join(userDataPath, DEFAULT_CONFIG_DIRECTORY, DEFAULT_SETUP_WIZARD_ACCESS_FILE_NAME);
}

export function getActivationStateFilePath(userDataPath: string): string {
  return join(userDataPath, DEFAULT_CONFIG_DIRECTORY, DEFAULT_ACTIVATION_STATE_FILE_NAME);
}

export function selectRuntimeRoot(options: RuntimeRootSelectionOptions): string {
  if (!options.isPackaged) {
    return options.currentWorkingDirectory;
  }

  return options.packagedDefaultRoot;
}

export function resolveRuntimeRoot(options: RuntimeRootResolutionOptions = {}): string {
  const explicitRuntimeRoot = process.env.ONLYSPEECH_RUNTIME_ROOT?.trim();
  if (explicitRuntimeRoot) {
    return explicitRuntimeRoot;
  }

  const packagedDefaultRoot = options.packagedDefaultRoot ?? resolveAppProfilePaths().userDataPath;
  const electronApp = options.electronApp ?? loadElectronApp();

  return selectRuntimeRoot({
    isPackaged: electronApp.isPackaged,
    currentWorkingDirectory: process.cwd(),
    packagedDefaultRoot
  });
}

function loadElectronApp(): ElectronAppLike {
  const electronModule = requireElectronModule();
  const electronApp = electronModule?.app;

  if (!electronApp) {
    throw new Error("Electron app is unavailable while resolving the OnlySpeech runtime root.");
  }

  return electronApp;
}

function requireElectronModule(): { app?: ElectronAppLike } | null {
  try {
    // Keep the electron dependency lazy so plain Node test runs do not require a working Electron install.
    return requireFromRuntimePaths("electron") as { app?: ElectronAppLike };
  } catch {
    return null;
  }
}

export function resolveCanonicalWindowsLocalAppDataPath(options: {
  localAppDataPath?: string | null;
  userProfilePath?: string | null;
  homeDrivePath?: string | null;
  homePath?: string | null;
} = {}): string | null {
  const localAppDataPath = options.localAppDataPath === undefined
    ? process.env.LOCALAPPDATA ?? null
    : options.localAppDataPath;
  if (localAppDataPath && !isAppSpecificUserDataPath(localAppDataPath)) {
    return localAppDataPath;
  }

  const userProfilePath = options.userProfilePath === undefined
    ? process.env.USERPROFILE ?? null
    : options.userProfilePath;
  if (userProfilePath) {
    return join(userProfilePath, "AppData", "Local");
  }

  const homeDrivePath = options.homeDrivePath === undefined
    ? process.env.HOMEDRIVE ?? null
    : options.homeDrivePath;
  const homePath = options.homePath === undefined
    ? process.env.HOMEPATH ?? null
    : options.homePath;
  if (homeDrivePath && homePath) {
    return join(`${homeDrivePath}${homePath}`, "AppData", "Local");
  }

  return null;
}

function isAppSpecificUserDataPath(value: string): boolean {
  const segments = value
    .replace(/[\\/]+$/g, "")
    .split(/[\\/]+/)
    .map((segment) => segment.toLowerCase());

  return segments.at(-1) === "userdata" && segments.includes("onlyspeech");
}

export function resolveAppProfilePaths(options: AppProfilePathOptions = {}): AppProfilePaths {
  const platform = options.platform ?? process.platform;
  const appName = options.appName ?? DEFAULT_APP_PROFILE_NAME;
  const localAppDataPath = platform === "win32"
    ? resolveCanonicalWindowsLocalAppDataPath({
        localAppDataPath: options.localAppDataPath,
        userProfilePath: options.userProfilePath,
        homeDrivePath: options.homeDrivePath,
        homePath: options.homePath
      })
    : options.localAppDataPath === undefined
      ? process.env.LOCALAPPDATA ?? null
      : options.localAppDataPath;
  const appDataPath = options.appDataPath === undefined
    ? process.env.APPDATA ?? null
    : options.appDataPath;

  if (platform === "win32" && !localAppDataPath) {
    throw new Error("Unable to resolve the OnlySpeech LocalAppData root on Windows.");
  }

  const preferredRoot = platform === "win32"
    ? localAppDataPath
    : appDataPath ?? localAppDataPath;

  if (!preferredRoot) {
    throw new Error("Unable to resolve an application data root for OnlySpeech.");
  }

  const userDataPath = join(preferredRoot, appName);

  return {
    userDataPath,
    sessionDataPath: join(userDataPath, DEFAULT_SESSION_DATA_DIRECTORY)
  };
}
