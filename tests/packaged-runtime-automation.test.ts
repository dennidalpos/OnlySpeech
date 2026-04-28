import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { createPersistedActivationState, persistActivationState } from "../src/main/activation-storage.js";
import { getActivationStateFilePath } from "../src/main/runtime-paths.js";

const packagedExecutable = process.env.ONLYSPEECH_PACKAGED_EXECUTABLE ?? "";
const describeWindowsPackaged =
  process.platform === "win32" && packagedExecutable.length > 0 && existsSync(packagedExecutable) ? describe : describe.skip;
const tempDirectories: string[] = [];
const childProcesses = new Set<ChildProcessWithoutNullStreams>();

function createTempDirectory(name: string): string {
  const directory = mkdtempSync(join(tmpdir(), `${name}-`));
  tempDirectories.push(directory);
  return directory;
}

function waitForCondition<T>(factory: () => T | null | Promise<T | null>, timeoutMs = 30000): Promise<T> {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const value = await factory();
        if (value !== null) {
          resolve(value);
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out after ${timeoutMs} ms.`));
          return;
        }

        setTimeout(tick, 250);
      } catch (error) {
        reject(error);
      }
    };

    void tick();
  });
}

async function waitForAutomationPort(portFilePath: string): Promise<number> {
  return waitForCondition(() => {
    try {
      const value = readFileSync(portFilePath, "utf8").trim();
      const port = Number(value);
      return Number.isFinite(port) && port > 0 ? port : null;
    } catch {
      return null;
    }
  });
}

async function fetchJson<T>(port: number, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, init);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

function terminateChildProcess(process: ChildProcessWithoutNullStreams): void {
  if (process.exitCode !== null || process.killed) {
    return;
  }

  spawnSync("taskkill.exe", ["/PID", String(process.pid), "/T", "/F"], {
    stdio: "ignore"
  });
}

function spawnPackagedApp(runtimeRoot: string) {
  const automationRoot = createTempDirectory("onlyspeech-packaged-automation");
  const portFilePath = join(automationRoot, "automation-port.txt");
  const appDataRoot = createTempDirectory("onlyspeech-packaged-appdata");
  const localAppDataRoot = createTempDirectory("onlyspeech-packaged-localappdata");
  seedPackagedActivationState(localAppDataRoot);

  const child = spawn(packagedExecutable, [], {
    cwd: dirname(packagedExecutable),
    env: {
      ...process.env,
      ONLYSPEECH_TEST_AUTOMATION: "1",
      ONLYSPEECH_ALLOW_PACKAGED_TEST_AUTOMATION: "1",
      ONLYSPEECH_AUTOMATION_PORT_FILE: portFilePath,
      ONLYSPEECH_RUNTIME_ROOT: runtimeRoot,
      ONLYSPEECH_DISPLAY_FIXTURE: JSON.stringify([
        {
          id: 101,
          label: "Fixture A",
          bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          scaleFactor: 1
        },
        {
          id: 202,
          label: "Fixture B",
          bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
          scaleFactor: 1
        }
      ]),
      APPDATA: appDataRoot,
      LOCALAPPDATA: localAppDataRoot
    },
    stdio: "pipe"
  });

  childProcesses.add(child);

  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  return {
    child,
    portFilePath,
    getOutput: () => output
  };
}

function seedPackagedActivationState(localAppDataRoot: string): void {
  persistActivationState(
    getActivationStateFilePath(join(localAppDataRoot, "OnlySpeech")),
    createPersistedActivationState({
      activationToken: null,
      claims: {
        keyId: "trial",
        email: "trial@onlyspeech.local",
        plan: "trial",
        issuedAt: "2026-04-07T10:30:00.000Z",
        expiresAt: "2027-04-22T10:30:00.000Z"
      },
      activatedAt: "2026-04-07T10:35:00.000Z",
      lastValidatedAt: "2026-04-07T10:35:00.000Z",
      lastTrustedUtc: "2026-04-07T10:35:00.000Z"
    })
  );
}

afterEach(() => {
  for (const child of childProcesses) {
    terminateChildProcess(child);
  }
  childProcesses.clear();

  for (const directory of tempDirectories.splice(0)) {
    try {
      rmSync(directory, { recursive: true, force: true });
    } catch {
      // Packaged app can keep profile files open briefly after taskkill on Windows.
    }
  }
});

describeWindowsPackaged("Packaged runtime automation", () => {
  it(
    "opens the setup wizard without monitor overlays when the packaged runtime env is missing",
    async () => {
      const runtimeRoot = createTempDirectory("onlyspeech-packaged-runtime-empty");
      const app = spawnPackagedApp(runtimeRoot);
      const port = await waitForAutomationPort(app.portFilePath);

      const snapshot = await waitForCondition(async () => {
        const current = await fetchJson<{
          setupWizard: { controlWindowOpen: boolean; overlayDisplayIds: number[] };
        }>(port, "/snapshot");

        return current.setupWizard.controlWindowOpen && current.setupWizard.overlayDisplayIds.length === 0
          ? current
          : null;
      }, 40000);

      expect(snapshot.setupWizard.controlWindowOpen).toBe(true);
      expect(snapshot.setupWizard.overlayDisplayIds).toEqual([]);
    },
    45000
  );

  it(
    "starts kiosk mode, exposes blocking state, and reopens the wizard as packaged recovery flow",
    async () => {
      const runtimeRoot = createTempDirectory("onlyspeech-packaged-runtime-kiosk");
      writeFileSync(
        join(runtimeRoot, ".env"),
        [
          "APP_MODE=kiosk",
          "REQUIRED_MONITORS=2",
          "TRANSLATION_PROVIDER=chatgpt",
          "DEFAULT_TARGET_LANG_A=en",
          "DEFAULT_TARGET_LANG_B=it"
        ].join("\n"),
        "utf8"
      );

      const app = spawnPackagedApp(runtimeRoot);
      const port = await waitForAutomationPort(app.portFilePath);

      const initialSnapshot = await waitForCondition(async () => {
        const current = await fetchJson<{
          kiosk: { windows: Array<{ side: string }>; state: { health: { blockingIssues: Array<{ code: string }> } } } | null;
        }>(port, "/snapshot");

        return current.kiosk && current.kiosk.windows.length === 2 ? current : null;
      }, 40000);

      expect(initialSnapshot.kiosk?.windows.map((window) => window.side).sort()).toEqual(["A", "B"]);

      await fetchJson(port, "/kiosk/device-probe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          side: "A",
          devices: [],
          permissionGranted: false,
          error: "NotAllowedError: Permission denied"
        })
      });

      const blockedSnapshot = await waitForCondition(async () => {
        const current = await fetchJson<{
          kiosk: { state: { health: { blockingIssues: Array<{ code: string }> } } } | null;
        }>(port, "/snapshot");

        return current.kiosk?.state.health.blockingIssues.some((issue) => issue.code === "microphone-permission-denied")
          ? current
          : null;
      }, 15000);

      expect(blockedSnapshot.kiosk?.state.health.blockingIssues).toContainEqual(
        expect.objectContaining({ code: "microphone-permission-denied" })
      );

      await fetchJson(port, "/wizard/open", {
        method: "POST"
      });

      const recoverySnapshot = await waitForCondition(async () => {
        const current = await fetchJson<{
          setupWizard: { controlWindowOpen: boolean; overlayDisplayIds: number[] };
        }>(port, "/snapshot");

        return current.setupWizard.controlWindowOpen && current.setupWizard.overlayDisplayIds.length === 0
          ? current
          : null;
      }, 15000);

      expect(recoverySnapshot.setupWizard.controlWindowOpen).toBe(true);
      expect(recoverySnapshot.setupWizard.overlayDisplayIds).toEqual([]);
    },
    50000
  );
});
