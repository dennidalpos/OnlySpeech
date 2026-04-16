import { createRequire } from "node:module";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { getVisitorUiText } from "../src/shared/visitor-localization.js";

const require = createRequire(import.meta.url);
const electronBinary = require("electron") as string;
const repoRoot = process.cwd();

// These tests require a compiled build: run `npm run compile` before executing them.
const bootstrapExists = existsSync(join(repoRoot, "dist", "main", "bootstrap.js"));
const describeWindows = process.platform === "win32" && bootstrapExists ? describe : describe.skip;
const tempDirectories: string[] = [];
const childProcesses = new Set<ChildProcessWithoutNullStreams>();

interface WizardInspectionEntry {
  exists: boolean;
  text: string | null;
  value: string | null;
  hidden: boolean | null;
  disabled: boolean | null;
  disabledReason: string | null;
}

type WizardInspection = Record<string, WizardInspectionEntry>;

interface SpawnElectronOptions {
  preparePaths?: (paths: {
    automationRoot: string;
    portFilePath: string;
    appDataRoot: string;
    localAppDataRoot: string;
  }) => void;
}

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

function waitForChildExit(process: ChildProcessWithoutNullStreams, timeoutMs = 15000): Promise<number | null> {
  if (process.exitCode !== null) {
    return Promise.resolve(process.exitCode);
  }

  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new Error(`Timed out after ${timeoutMs} ms waiting for the Electron process to exit.`));
    }, timeoutMs);

    process.once("exit", (code) => {
      clearTimeout(timeoutHandle);
      resolve(code);
    });
  });
}

function spawnElectronApp(
  args: string[],
  runtimeRoot: string,
  envOverrides: NodeJS.ProcessEnv = {},
  options: SpawnElectronOptions = {}
) {
  const automationRoot = createTempDirectory("onlyspeech-automation");
  const portFilePath = join(automationRoot, "automation-port.txt");
  const appDataRoot = createTempDirectory("onlyspeech-appdata");
  const localAppDataRoot = createTempDirectory("onlyspeech-localappdata");
  options.preparePaths?.({
    automationRoot,
    portFilePath,
    appDataRoot,
    localAppDataRoot
  });

  const child = spawn(electronBinary, ["."].concat(args), {
    cwd: repoRoot,
    env: {
      ...process.env,
      ONLYSPEECH_TEST_AUTOMATION: "1",
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
      LOCALAPPDATA: localAppDataRoot,
      ...envOverrides
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
    appDataRoot,
    localAppDataRoot,
    getOutput: () => output
  };
}

async function inspectWizardControl(port: number, selectors: string[]): Promise<WizardInspection> {
  return fetchJson<WizardInspection>(port, "/wizard/inspect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      target: "wizard-control",
      selectors
    })
  });
}

function writeActivationStateFixture(
  localAppDataRoot: string,
  options: {
    email?: string;
    expiresAt: string;
    plan?: "annual" | "trial";
  }
): void {
  const activationStatePath = join(localAppDataRoot, "OnlySpeech", "config", "activation-state.json");
  mkdirSync(join(localAppDataRoot, "OnlySpeech", "config"), { recursive: true });
  writeFileSync(
    activationStatePath,
    JSON.stringify(
      {
        schemaVersion: 1,
        activationToken: options.plan === "trial" ? null : "OS1.payload.signature",
        claims: {
          keyId: options.plan === "trial" ? "trial" : "ks1",
          email: options.email ?? "buyer@example.com",
          plan: options.plan ?? "annual",
          issuedAt: "2026-04-08T08:00:00.000Z",
          expiresAt: options.expiresAt
        },
        activatedAt: "2026-04-08T08:00:00.000Z",
        lastValidatedAt: "2026-04-08T08:00:00.000Z",
        lastTrustedUtc: "2026-04-08T08:00:00.000Z"
      },
      null,
      2
    ) + "\n",
    "utf8"
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
      // Electron can keep profile files open briefly after taskkill on Windows.
    }
  }
});

describeWindows("Electron runtime end-to-end coverage", () => {
  it(
    "reports stable save-button disabled reasons across chatgpt and azure setup scenarios",
    async () => {
      const scenarios: Array<{
        name: string;
        envLines: string[];
        expectedDisabled: boolean;
        expectedReason: string | null;
        expectedNotice?: string;
      }> = [
        {
          name: "chatgpt-kiosk-valid",
          envLines: [
            "APP_MODE=kiosk",
            "DISPLAY_A_ID=101",
            "DISPLAY_B_ID=202",
            "TRANSLATION_PROVIDER=chatgpt",
            "DEFAULT_TARGET_LANG_A=it",
            "DEFAULT_TARGET_LANG_B=en",
            "CHATGPT_API_KEY=test-key",
            "CHATGPT_MODEL=gpt-4.1-mini",
            "CHATGPT_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe"
          ],
          expectedDisabled: false,
          expectedReason: null
        },
        {
          name: "chatgpt-kiosk-missing-creds",
          envLines: [
            "APP_MODE=kiosk",
            "DISPLAY_A_ID=101",
            "DISPLAY_B_ID=202",
            "TRANSLATION_PROVIDER=chatgpt",
            "DEFAULT_TARGET_LANG_A=it",
            "DEFAULT_TARGET_LANG_B=en",
            "CHATGPT_API_KEY=",
            "CHATGPT_MODEL=",
            "CHATGPT_TRANSCRIBE_MODEL="
          ],
          expectedDisabled: true,
          expectedReason: "save-provider-configuration",
          expectedNotice: "complete the selected provider"
        },
        {
          name: "chatgpt-demo-no-creds",
          envLines: [
            "APP_MODE=demo",
            "DISPLAY_A_ID=101",
            "DISPLAY_B_ID=202",
            "TRANSLATION_PROVIDER=chatgpt",
            "DEFAULT_TARGET_LANG_A=it",
            "DEFAULT_TARGET_LANG_B=en",
            "CHATGPT_API_KEY=",
            "CHATGPT_MODEL=",
            "CHATGPT_TRANSCRIBE_MODEL="
          ],
          expectedDisabled: false,
          expectedReason: null
        },
        {
          name: "azure-kiosk-catalog-unavailable",
          envLines: [
            "APP_MODE=kiosk",
            "DISPLAY_A_ID=101",
            "DISPLAY_B_ID=202",
            "TRANSLATION_PROVIDER=azure",
            "DEFAULT_TARGET_LANG_A=it",
            "DEFAULT_TARGET_LANG_B=en",
            "AZURE_SPEECH_KEY=test-key",
            "AZURE_SPEECH_REGION=westeurope"
          ],
          expectedDisabled: true,
          expectedReason: "save-azure-tts",
          expectedNotice: "Azure"
        },
        {
          name: "azure-demo-no-creds",
          envLines: [
            "APP_MODE=demo",
            "DISPLAY_A_ID=101",
            "DISPLAY_B_ID=202",
            "TRANSLATION_PROVIDER=azure",
            "DEFAULT_TARGET_LANG_A=it",
            "DEFAULT_TARGET_LANG_B=en",
            "AZURE_SPEECH_KEY=",
            "AZURE_SPEECH_REGION="
          ],
          expectedDisabled: false,
          expectedReason: null
        }
      ];

      for (const scenario of scenarios) {
        const runtimeRoot = createTempDirectory(`onlyspeech-runtime-${scenario.name}`);
        writeFileSync(join(runtimeRoot, ".env"), scenario.envLines.join("\n"), "utf8");
        const app = spawnElectronApp(["--setup-wizard"], runtimeRoot);

        try {
          const port = await waitForAutomationPort(app.portFilePath);
          await waitForCondition(async () => {
            const current = await fetchJson<{
              setupWizard: { controlWindowOpen: boolean };
            }>(port, "/snapshot");

            return current.setupWizard.controlWindowOpen ? current : null;
          }, 40000);

          const inspection = await waitForCondition(async () => {
            const current = await inspectWizardControl(port, [
              "#save-close-wizard",
              "#save-close-wizard-disabled-reason"
            ]);
            const saveButton = current["#save-close-wizard"];
            if (!saveButton?.exists) {
              return null;
            }
            if (saveButton.disabled !== scenario.expectedDisabled) {
              return null;
            }
            if (saveButton.disabledReason !== scenario.expectedReason) {
              return null;
            }
            return current;
          }, 30000);

          expect(inspection["#save-close-wizard"]?.disabled).toBe(scenario.expectedDisabled);
          expect(inspection["#save-close-wizard"]?.disabledReason).toBe(scenario.expectedReason);
          if (scenario.expectedNotice) {
            expect(inspection["#save-close-wizard-disabled-reason"]?.text || "").toContain(
              scenario.expectedNotice
            );
          } else {
            expect(inspection["#save-close-wizard-disabled-reason"]?.hidden).toBe(true);
          }
        } finally {
          terminateChildProcess(app.child);
          childProcesses.delete(app.child);
        }
      }
    },
    120000
  );

  it(
    "reports stable license button reasons for absent, active, expired, and trial-exhausted workstations",
    async () => {
      const scenarios: Array<{
        name: string;
        envLines: string[];
        envOverrides?: NodeJS.ProcessEnv;
        preparePaths?: SpawnElectronOptions["preparePaths"];
        expectedTitle: string;
        expectedRemoveReason: string | null;
        expectedTrialReason: string | null;
      }> = [
        {
          name: "license-absent",
          envLines: [
            "APP_MODE=demo",
            "DISPLAY_A_ID=101",
            "DISPLAY_B_ID=202",
            "TRANSLATION_PROVIDER=chatgpt",
            "DEFAULT_TARGET_LANG_A=en",
            "DEFAULT_TARGET_LANG_B=fr"
          ],
          expectedTitle: "Activate workstation",
          expectedRemoveReason: "license-remove-unavailable",
          expectedTrialReason: null
        },
        {
          name: "license-active",
          envLines: [
            "APP_MODE=demo",
            "DISPLAY_A_ID=101",
            "DISPLAY_B_ID=202",
            "TRANSLATION_PROVIDER=chatgpt",
            "DEFAULT_TARGET_LANG_A=en",
            "DEFAULT_TARGET_LANG_B=fr"
          ],
          preparePaths: ({ localAppDataRoot }) => {
            writeActivationStateFixture(localAppDataRoot, {
              expiresAt: "2027-04-08T08:00:00.000Z"
            });
          },
          expectedTitle: "Replace installed license",
          expectedRemoveReason: "license-remove-unconfirmed",
          expectedTrialReason: null
        },
        {
          name: "license-expired",
          envLines: [
            "APP_MODE=demo",
            "DISPLAY_A_ID=101",
            "DISPLAY_B_ID=202",
            "TRANSLATION_PROVIDER=chatgpt",
            "DEFAULT_TARGET_LANG_A=en",
            "DEFAULT_TARGET_LANG_B=fr"
          ],
          preparePaths: ({ localAppDataRoot }) => {
            writeActivationStateFixture(localAppDataRoot, {
              expiresAt: "2026-04-08T08:00:00.000Z"
            });
          },
          expectedTitle: "Restore access",
          expectedRemoveReason: "license-remove-unconfirmed",
          expectedTrialReason: null
        },
        {
          name: "license-trial-exhausted",
          envLines: [
            "APP_MODE=demo",
            "DISPLAY_A_ID=101",
            "DISPLAY_B_ID=202",
            "TRANSLATION_PROVIDER=chatgpt",
            "DEFAULT_TARGET_LANG_A=en",
            "DEFAULT_TARGET_LANG_B=fr"
          ],
          envOverrides: {
            ONLYSPEECH_TEST_TRIAL_EXHAUSTED_AT: "2026-04-09T08:00:00.000Z"
          },
          expectedTitle: "Activate workstation",
          expectedRemoveReason: "license-remove-unavailable",
          expectedTrialReason: "license-trial-exhausted"
        }
      ];

      for (const scenario of scenarios) {
        const runtimeRoot = createTempDirectory(`onlyspeech-runtime-${scenario.name}`);
        writeFileSync(join(runtimeRoot, ".env"), scenario.envLines.join("\n"), "utf8");
        const app = spawnElectronApp(["--setup-wizard"], runtimeRoot, scenario.envOverrides ?? {}, {
          preparePaths: scenario.preparePaths
        });

        try {
          const port = await waitForAutomationPort(app.portFilePath);
          await waitForCondition(async () => {
            const current = await fetchJson<{
              setupWizard: { controlWindowOpen: boolean };
            }>(port, "/snapshot");

            return current.setupWizard.controlWindowOpen ? current : null;
          }, 40000);

          const inspection = await waitForCondition(async () => {
            const current = await inspectWizardControl(port, [
              "#license-update-title",
              "#license-remove-btn",
              "#license-remove-disabled-reason",
              "#license-trial-btn",
              "#license-trial-exhausted"
            ]);
            if ((current["#license-update-title"]?.text || "") !== scenario.expectedTitle) {
              return null;
            }
            if (current["#license-remove-btn"]?.disabledReason !== scenario.expectedRemoveReason) {
              return null;
            }
            if (current["#license-trial-btn"]?.disabledReason !== scenario.expectedTrialReason) {
              return null;
            }
            return current;
          }, 30000);

          expect(inspection["#license-update-title"]?.text).toBe(scenario.expectedTitle);
          expect(inspection["#license-remove-btn"]?.disabledReason).toBe(scenario.expectedRemoveReason);
          expect(inspection["#license-trial-btn"]?.disabledReason).toBe(scenario.expectedTrialReason);
          if (scenario.expectedRemoveReason === "license-remove-unconfirmed") {
            expect(inspection["#license-remove-disabled-reason"]?.text || "").toContain(
              "license"
            );
          }
          if (scenario.expectedTrialReason === "license-trial-exhausted") {
            expect(inspection["#license-trial-exhausted"]?.hidden).toBe(false);
          }
        } finally {
          terminateChildProcess(app.child);
          childProcesses.delete(app.child);
        }
      }
    },
    120000
  );

  it(
    "opens the integrated setup wizard without starting monitor overlays when the runtime env is missing",
    async () => {
      expect(readFileSync(join(repoRoot, "dist", "main", "bootstrap.js"), "utf8")).toContain("OnlySpeech");

      const runtimeRoot = createTempDirectory("onlyspeech-runtime-empty");
      const app = spawnElectronApp(["--setup-wizard"], runtimeRoot);
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
    "keeps French setup wizard text localized across the control and overlay automation surfaces",
    async () => {
      const runtimeRoot = createTempDirectory("onlyspeech-runtime-french-wizard");
      writeFileSync(
        join(runtimeRoot, ".env"),
        [
          "APP_MODE=kiosk",
          "SETUP_UI_LANGUAGE=fr",
          "TRANSLATION_PROVIDER=chatgpt",
          "DEFAULT_TARGET_LANG_A=en",
          "DEFAULT_TARGET_LANG_B=fr"
        ].join("\n"),
        "utf8"
      );

      const app = spawnElectronApp(["--setup-wizard"], runtimeRoot);
      const port = await waitForAutomationPort(app.portFilePath);

      await waitForCondition(async () => {
        const current = await fetchJson<{
          setupWizard: { controlWindowOpen: boolean };
        }>(port, "/snapshot");

        return current.setupWizard.controlWindowOpen ? current : null;
      }, 40000);

      const controlInspection = await waitForCondition(async () => {
        const current = await fetchJson<Record<string, {
          exists: boolean;
          text: string | null;
          value: string | null;
        }>>(port, "/wizard/inspect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            target: "wizard-control",
            selectors: ["#refresh-displays", "#save-close-wizard", "#wizard-ui-language-select", '[data-section="stations"]']
          })
        });

        return current["#refresh-displays"]?.exists ? current : null;
      }, 15000);

      expect(controlInspection["#refresh-displays"]?.text).toBe("Actualiser l'etat");
      expect(controlInspection["#save-close-wizard"]?.text).toBe("Appliquer et fermer le setup");
      expect(controlInspection["#wizard-ui-language-select"]?.value).toBe("fr");
      expect(controlInspection['[data-section="stations"]']?.text).toContain("Postes");

      await fetchJson(port, "/wizard/monitor-setup/open", {
        method: "POST"
      });

      const overlayInspection = await waitForCondition(async () => {
        const current = await fetchJson<Record<string, {
          exists: boolean;
          text: string | null;
        }>>(port, "/wizard/inspect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            target: "wizard-overlay",
            displayId: 101,
            selectors: ["#assign-a", "#assign-b", "#close-monitor-setup"]
          })
        });

        return current["#assign-a"]?.exists ? current : null;
      }, 15000);

      expect(overlayInspection["#assign-a"]?.text).toBe("Assigner a Poste A");
      expect(overlayInspection["#assign-b"]?.text).toBe("Assigner a Poste B");
      expect(overlayInspection["#close-monitor-setup"]?.text).toBe("Fermer le setup ecran");
    },
    50000
  );

  it(
    "opens localized display overlays from the setup wizard automation surface and captures them",
    async () => {
      const runtimeRoot = createTempDirectory("onlyspeech-runtime-italian-wizard");
      writeFileSync(
        join(runtimeRoot, ".env"),
        [
          "APP_MODE=kiosk",
          "SETUP_UI_LANGUAGE=it",
          "TRANSLATION_PROVIDER=chatgpt",
          "DEFAULT_TARGET_LANG_A=en",
          "DEFAULT_TARGET_LANG_B=it"
        ].join("\n"),
        "utf8"
      );

      const app = spawnElectronApp(["--setup-wizard"], runtimeRoot);
      const port = await waitForAutomationPort(app.portFilePath);

      await waitForCondition(async () => {
        const current = await fetchJson<{
          setupWizard: { controlWindowOpen: boolean };
        }>(port, "/snapshot");

        return current.setupWizard.controlWindowOpen ? current : null;
      }, 40000);

      await fetchJson(port, "/wizard/monitor-setup/open", {
        method: "POST"
      });

      const overlaySnapshot = await waitForCondition(async () => {
        const current = await fetchJson<{
          setupWizard: { overlayDisplayIds: number[] };
        }>(port, "/snapshot");

        return current.setupWizard.overlayDisplayIds.length === 2 ? current : null;
      }, 15000);

      expect(overlaySnapshot.setupWizard.overlayDisplayIds).toEqual([101, 202]);

      const capture = await fetchJson<{
        target: string;
        displayId: number | null;
        pngBase64: string;
      }>(port, "/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          target: "wizard-overlay",
          displayId: 101
        })
      });

      expect(capture.target).toBe("wizard-overlay");
      expect(capture.displayId).toBe(101);
      expect(Buffer.from(capture.pngBase64, "base64").length).toBeGreaterThan(0);
    },
    50000
  );

  it(
    "starts the kiosk windows from a runtime env, exposes runtime blocking state, and opens the wizard as a recovery path",
    async () => {
      const runtimeRoot = createTempDirectory("onlyspeech-runtime-kiosk");
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

      const app = spawnElectronApp([], runtimeRoot);
      const port = await waitForAutomationPort(app.portFilePath);

      const initialSnapshot = await waitForCondition(async () => {
        const current = await fetchJson<{
          kiosk: {
            windows: Array<{ side: string; visible: boolean; fullScreen: boolean; kiosk: boolean }>;
            state: { health: { blockingIssues: Array<{ code: string }> } };
          } | null;
        }>(port, "/snapshot");

        return current.kiosk &&
          current.kiosk.windows.length === 2 &&
          current.kiosk.windows.every((window) => window.visible && window.fullScreen)
          ? current
          : null;
      }, 40000);

      expect(initialSnapshot.kiosk?.windows.map((window) => window.side).sort()).toEqual(["A", "B"]);
      expect(initialSnapshot.kiosk?.windows.every((window) => window.visible && window.fullScreen)).toBe(true);

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

  it(
    "reports an idle-clear reset after both sides commit languages and the idle timeout expires",
    async () => {
      const runtimeRoot = createTempDirectory("onlyspeech-runtime-idle-clear");
      writeFileSync(
        join(runtimeRoot, ".env"),
        [
          "APP_MODE=kiosk",
          "REQUIRED_MONITORS=2",
          "TRANSLATION_PROVIDER=chatgpt",
          "DEFAULT_TARGET_LANG_A=fr",
          "DEFAULT_TARGET_LANG_B=ka",
          "IDLE_CLEAR_SECONDS=1",
          "IDLE_HARD_RESET_SECONDS=30"
        ].join("\n"),
        "utf8"
      );

      const app = spawnElectronApp([], runtimeRoot);
      const port = await waitForAutomationPort(app.portFilePath);

      const initialSnapshot = await waitForCondition(async () => {
        const current = await fetchJson<{
          kiosk: {
            state: {
              sessionId: string;
            };
          } | null;
        }>(port, "/snapshot");

        return current.kiosk ? current : null;
      }, 40000);

      await fetchJson(port, "/kiosk/operator-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "select-target-language",
          side: "A",
          targetLanguage: "en"
        })
      });

      await fetchJson(port, "/kiosk/operator-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "select-target-language",
          side: "B",
          targetLanguage: "it"
        })
      });

      const idleSnapshot = await waitForCondition(async () => {
        const current = await fetchJson<{
          kiosk: {
            state: {
              sessionId: string;
              sessionResetReason: string | null;
              clearTriggeredAt: string | null;
              sides: Record<"A" | "B", { selectedTargetLanguage: string | null }>;
            };
          } | null;
        }>(port, "/snapshot");

        return current.kiosk?.state.sessionResetReason === "idle-clear" ? current : null;
      }, 15000);

      expect(idleSnapshot.kiosk?.state.sessionId).not.toBe(initialSnapshot.kiosk?.state.sessionId);
      expect(idleSnapshot.kiosk?.state.clearTriggeredAt).toBeTruthy();
      expect(idleSnapshot.kiosk?.state.sides.A.selectedTargetLanguage).toBe("fr");
      expect(idleSnapshot.kiosk?.state.sides.B.selectedTargetLanguage).toBe("ka");
    },
    50000
  );

  it(
    "reports a hard-reset after the operator reset action and restores the default languages",
    async () => {
      const runtimeRoot = createTempDirectory("onlyspeech-runtime-hard-reset");
      writeFileSync(
        join(runtimeRoot, ".env"),
        [
          "APP_MODE=kiosk",
          "REQUIRED_MONITORS=2",
          "TRANSLATION_PROVIDER=chatgpt",
          "DEFAULT_TARGET_LANG_A=fr",
          "DEFAULT_TARGET_LANG_B=ka"
        ].join("\n"),
        "utf8"
      );

      const app = spawnElectronApp([], runtimeRoot);
      const port = await waitForAutomationPort(app.portFilePath);

      const initialSnapshot = await waitForCondition(async () => {
        const current = await fetchJson<{
          kiosk: {
            state: {
              sessionId: string;
            };
          } | null;
        }>(port, "/snapshot");

        return current.kiosk ? current : null;
      }, 40000);

      for (const payload of [
        { type: "select-target-language", side: "A", targetLanguage: "en" },
        { type: "select-target-language", side: "B", targetLanguage: "it" },
        { type: "request-reset", side: "A" }
      ]) {
        await fetchJson(port, "/kiosk/operator-action", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      }

      const resetSnapshot = await waitForCondition(async () => {
        const current = await fetchJson<{
          kiosk: {
            state: {
              sessionId: string;
              sessionResetReason: string | null;
              sides: Record<"A" | "B", { selectedTargetLanguage: string | null }>;
            };
          } | null;
        }>(port, "/snapshot");

        return current.kiosk?.state.sessionResetReason === "hard-reset" ? current : null;
      }, 15000);

      expect(resetSnapshot.kiosk?.state.sessionId).not.toBe(initialSnapshot.kiosk?.state.sessionId);
      expect(resetSnapshot.kiosk?.state.sides.A.selectedTargetLanguage).toBe("fr");
      expect(resetSnapshot.kiosk?.state.sides.B.selectedTargetLanguage).toBe("ka");
    },
    50000
  );

  it(
    "terminates after Apply and Close when the trial is exhausted and no license remains",
    async () => {
      const runtimeRoot = createTempDirectory("onlyspeech-runtime-trial-exhausted");
      writeFileSync(
        join(runtimeRoot, ".env"),
        [
          "APP_MODE=demo",
          "REQUIRED_MONITORS=2",
          "DISPLAY_A_ID=101",
          "DISPLAY_B_ID=202",
          "TRANSLATION_PROVIDER=chatgpt",
          "DEFAULT_TARGET_LANG_A=en",
          "DEFAULT_TARGET_LANG_B=fr"
        ].join("\n"),
        "utf8"
      );

      const app = spawnElectronApp(
        ["--setup-wizard"],
        runtimeRoot,
        {
          ONLYSPEECH_TEST_TRIAL_EXHAUSTED_AT: "2026-04-09T08:00:00.000Z"
        }
      );
      const port = await waitForAutomationPort(app.portFilePath);

      await waitForCondition(async () => {
        const current = await fetchJson<{
          setupWizard: { controlWindowOpen: boolean };
        }>(port, "/snapshot");

        return current.setupWizard.controlWindowOpen ? current : null;
      }, 40000);

      const saveButtonInspection = await waitForCondition(async () => {
        const current = await fetchJson<Record<string, {
          exists: boolean;
          disabled: boolean | null;
        }>>(port, "/wizard/inspect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            target: "wizard-control",
            selectors: ["#save-close-wizard"]
          })
        });

        return current["#save-close-wizard"]?.disabled === false ? current : null;
      }, 15000);

      expect(saveButtonInspection["#save-close-wizard"]?.disabled).toBe(false);

      try {
        await fetchJson(port, "/wizard/click", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            target: "wizard-control",
            selector: "#save-close-wizard"
          })
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        expect(message).toContain("fetch failed");
      }

      await expect(waitForChildExit(app.child)).resolves.toBe(0);
    },
    50000
  );

  it(
    "inspects Station B visitor-language proof for a non-Latin committed language on the automation surface",
    async () => {
      const runtimeRoot = createTempDirectory("onlyspeech-runtime-visitor-language");
      writeFileSync(
        join(runtimeRoot, ".env"),
        [
          "APP_MODE=kiosk",
          "REQUIRED_MONITORS=2",
          "TRANSLATION_PROVIDER=chatgpt",
          "CHATGPT_API_KEY=test-key",
          "CHATGPT_MODEL=gpt-4.1-mini",
          "CHATGPT_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe",
          "SETUP_UI_LANGUAGE=en",
          "DEFAULT_TARGET_LANG_A=fr",
          "DEFAULT_TARGET_LANG_B=ka"
        ].join("\n"),
        "utf8"
      );

      const app = spawnElectronApp([], runtimeRoot);
      const port = await waitForAutomationPort(app.portFilePath);
      const englishVisitorLabels = getVisitorUiText("en");
      const georgianVisitorLabels = getVisitorUiText("ka");

      await waitForCondition(async () => {
        const current = await fetchJson<{
          kiosk: { windows: Array<{ side: string; visible: boolean; fullScreen: boolean }> } | null;
        }>(port, "/snapshot");

        return current.kiosk && current.kiosk.windows.length === 2 ? current : null;
      }, 40000);

      const selectorInspect = await waitForCondition(async () => {
        const current = await fetchJson<{
          view: string;
          selectorTitle: string | null;
          activeMacroAreaLabel: string | null;
          macroAreaLabels: string[];
          selectedLanguageTileLabel: string | null;
        }>(port, "/kiosk/inspect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ side: "B" })
        });

        return current.view === "visitor-language-selection" ? current : null;
      }, 15000);

      expect(selectorInspect.selectorTitle).toBe(englishVisitorLabels.selectLanguageTitle);
      expect(selectorInspect.activeMacroAreaLabel).toBeTruthy();
      expect(selectorInspect.macroAreaLabels).toContain("Asia");
      expect(selectorInspect.selectedLanguageTileLabel).toContain("ქართული");

      await fetchJson(port, "/kiosk/operator-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "select-target-language",
          side: "B",
          targetLanguage: "ka"
        })
      });

      const sessionInspect = await waitForCondition(async () => {
        const current = await fetchJson<{
          view: string;
          currentLanguageChipTitle: string | null;
          currentLanguageChipValue: string | null;
          changeLanguageLabel: string | null;
        }>(port, "/kiosk/inspect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ side: "B" })
        });

        return current.view === "visitor-session" ? current : null;
      }, 15000);

      expect(sessionInspect.currentLanguageChipTitle).toBe(georgianVisitorLabels.currentLanguage);
      expect(sessionInspect.currentLanguageChipValue).toContain("ქართული");
      expect(sessionInspect.changeLanguageLabel).toBe(georgianVisitorLabels.changeLanguage);
    },
    50000
  );
});
