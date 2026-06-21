import { createServer, type Server } from "node:http";
import type { DeviceProbePayload, OperatorAction, Side } from "../shared/types.js";
import type { KioskManager } from "./kiosk-manager.js";
import type { KioskWindowAutomationSnapshot } from "./kiosk-display-runtime.js";
import type { SetupWizardManager } from "./setup-wizard-manager.js";
import {
  deviceProbePayloadSchema,
  operatorActionSchema,
  parsePayload
} from "./ipc-payloads.js";

type WizardAutomationSection = "stations" | "provider" | "languages" | "diagnostics" | "license";

interface AutomationBindings {
  isPackaged: boolean;
  getKioskManager: () => KioskManager | null;
  getSetupWizardManager: () => SetupWizardManager;
  openSetupWizard: () => Promise<void> | void;
  openSetupWizardMonitorSetup: () => Promise<void> | void;
  closeSetupWizard: () => void;
  navigateSetupWizardToSection: (section: WizardAutomationSection) => Promise<void>;
  inspectSetupWizardControlWindow: (
    selectors: string[]
  ) => Promise<Record<string, {
    exists: boolean;
    text: string | null;
    value: string | null;
    hidden: boolean | null;
    disabled: boolean | null;
    disabledReason: string | null;
  }>>;
  inspectSetupWizardOverlayWindow: (
    displayId: number,
    selectors: string[]
  ) => Promise<Record<string, {
    exists: boolean;
    text: string | null;
    value: string | null;
    hidden: boolean | null;
    disabled: boolean | null;
    disabledReason: string | null;
  }>>;
  clickSetupWizardControlWindow: (selector: string) => Promise<void>;
  captureKioskWindow: (side: Side) => Promise<Buffer | null>;
  inspectKioskWindow: (side: Side) => Promise<KioskWindowAutomationSnapshot | null>;
  captureSetupWizardControlWindow: () => Promise<Buffer | null>;
  captureSetupWizardOverlayWindow: (displayId: number) => Promise<Buffer | null>;
}

function sendJson(response: import("node:http").ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request: import("node:http").IncomingMessage): Promise<unknown> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return null;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export class TestAutomationServer {
  private server: Server | null = null;

  private port: number | null = null;

  constructor(private readonly bindings: AutomationBindings) {}

  get isEnabled(): boolean {
    return isTestAutomationEnabled({ isPackaged: this.bindings.isPackaged });
  }

  async ensureStarted(): Promise<void> {
    if (!this.isEnabled || (this.server && this.port !== null)) {
      return;
    }

    this.server = createServer(async (request, response) => {
      try {
        const method = request.method ?? "GET";
        const url = new URL(request.url ?? "/", "http://127.0.0.1");

        if (method === "GET" && url.pathname === "/health") {
          sendJson(response, 200, { ok: true, port: this.port });
          return;
        }

        if (method === "GET" && url.pathname === "/snapshot") {
          sendJson(response, 200, this.createSnapshot());
          return;
        }

        if (method === "POST" && url.pathname === "/wizard/open") {
          await this.bindings.openSetupWizard();
          sendJson(response, 200, this.createSnapshot());
          return;
        }

        if (method === "POST" && url.pathname === "/wizard/monitor-setup/open") {
          await this.bindings.openSetupWizardMonitorSetup();
          sendJson(response, 200, this.createSnapshot());
          return;
        }

        if (method === "POST" && url.pathname === "/wizard/close") {
          this.bindings.closeSetupWizard();
          sendJson(response, 200, this.createSnapshot());
          return;
        }

        if (method === "POST" && url.pathname === "/wizard/section") {
          const payload = (await readJsonBody(request)) as { section?: WizardAutomationSection } | null;
          if (!payload?.section) {
            sendJson(response, 400, { error: "Missing wizard section." });
            return;
          }

          await this.bindings.navigateSetupWizardToSection(payload.section);
          sendJson(response, 200, this.createSnapshot());
          return;
        }

        if (method === "POST" && url.pathname === "/wizard/inspect") {
          const payload = (await readJsonBody(request)) as {
            target?: "wizard-control" | "wizard-overlay";
            selectors?: string[];
            displayId?: number;
          } | null;
          if (!payload?.target || !Array.isArray(payload.selectors) || payload.selectors.length === 0) {
            sendJson(response, 400, { error: "Missing wizard inspect target or selectors." });
            return;
          }

          const inspection =
            payload.target === "wizard-control"
              ? await this.bindings.inspectSetupWizardControlWindow(payload.selectors)
              : Number.isFinite(payload.displayId)
                ? await this.bindings.inspectSetupWizardOverlayWindow(Number(payload.displayId), payload.selectors)
                : null;

          if (!inspection) {
            sendJson(response, 404, { error: "Requested wizard window is not available." });
            return;
          }

          sendJson(response, 200, inspection);
          return;
        }

        if (method === "POST" && url.pathname === "/wizard/click") {
          const payload = (await readJsonBody(request)) as {
            target?: "wizard-control";
            selector?: string;
          } | null;
          if (payload?.target !== "wizard-control" || !payload.selector) {
            sendJson(response, 400, { error: "Missing wizard click target or selector." });
            return;
          }

          await this.bindings.clickSetupWizardControlWindow(payload.selector);
          sendJson(response, 200, { ok: true });
          return;
        }

        if (method === "POST" && url.pathname === "/kiosk/device-probe") {
          const payload = parsePayload(
            deviceProbePayloadSchema,
            await readJsonBody(request),
            "automation:kiosk-device-probe"
          ) as DeviceProbePayload;
          this.bindings.getKioskManager()?.handleDeviceProbe(payload);
          sendJson(response, 200, this.createSnapshot());
          return;
        }

        if (method === "POST" && url.pathname === "/kiosk/operator-action") {
          const payload = parsePayload(
            operatorActionSchema,
            await readJsonBody(request),
            "automation:kiosk-operator-action"
          ) as OperatorAction;
          this.bindings.getKioskManager()?.handleOperatorAction(payload);
          sendJson(response, 200, this.createSnapshot());
          return;
        }

        if (method === "POST" && url.pathname === "/kiosk/demo-pause") {
          const payload = (await readJsonBody(request)) as { paused?: boolean } | null;
          if (typeof payload?.paused !== "boolean") {
            sendJson(response, 400, { error: "Missing demo paused state." });
            return;
          }

          this.bindings.getKioskManager()?.setDemoPaused(payload.paused);
          sendJson(response, 200, this.createSnapshot());
          return;
        }

        if (method === "POST" && url.pathname === "/kiosk/demo-restart-paused") {
          this.bindings.getKioskManager()?.restartDemoPaused();
          sendJson(response, 200, this.createSnapshot());
          return;
        }

        if (method === "POST" && url.pathname === "/kiosk/demo-storyboard-step") {
          const payload = (await readJsonBody(request)) as { step?: number } | null;
          const step = payload?.step;
          if (!Number.isInteger(step) || step === undefined || step < 1 || step > 5) {
            sendJson(response, 400, { error: "Storyboard step must be an integer from 1 to 5." });
            return;
          }

          this.bindings.getKioskManager()?.showDemoStoryboardStep(step);
          sendJson(response, 200, this.createSnapshot());
          return;
        }

        if (method === "POST" && url.pathname === "/kiosk/inspect") {
          const payload = (await readJsonBody(request)) as { side?: Side } | null;
          if (!payload?.side) {
            sendJson(response, 400, { error: "Missing kiosk side." });
            return;
          }

          const snapshot = await this.bindings.inspectKioskWindow(payload.side);
          if (!snapshot) {
            sendJson(response, 404, { error: "Requested kiosk window is not available." });
            return;
          }

          sendJson(response, 200, snapshot);
          return;
        }

        if (method === "POST" && url.pathname === "/capture") {
          const payload = (await readJsonBody(request)) as
            | { target?: "wizard-control" | "wizard-overlay" | "kiosk"; side?: Side; displayId?: number }
            | null;
          if (!payload?.target) {
            sendJson(response, 400, { error: "Missing capture target." });
            return;
          }

          const pngBuffer =
            payload.target === "wizard-control"
              ? await this.bindings.captureSetupWizardControlWindow()
              : payload.target === "wizard-overlay"
                ? Number.isFinite(payload.displayId)
                  ? await this.bindings.captureSetupWizardOverlayWindow(Number(payload.displayId))
                  : null
              : payload.side
                ? await this.bindings.captureKioskWindow(payload.side)
                : null;

          if (!pngBuffer) {
            sendJson(response, 404, { error: "Requested window is not available." });
            return;
          }

          sendJson(response, 200, {
            target: payload.target,
            side: payload.side ?? null,
            displayId: payload.displayId ?? null,
            pngBase64: pngBuffer.toString("base64")
          });
          return;
        }

        sendJson(response, 404, { error: "Not found" });
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("Invalid automation:")) {
          sendJson(response, 400, { error: error.message });
          return;
        }
        sendJson(response, 500, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    const requestedPort = Number(process.env.ONLYSPEECH_AUTOMATION_PORT ?? "0");
    this.port = await new Promise<number>((resolve, reject) => {
      this.server?.once("error", reject);
      this.server?.listen(Number.isFinite(requestedPort) ? requestedPort : 0, "127.0.0.1", () => {
        const address = this.server?.address();
        if (!address || typeof address === "string") {
          reject(new Error("Unable to bind test automation server."));
          return;
        }

        resolve(address.port);
      });
    });

    if (process.env.ONLYSPEECH_AUTOMATION_PORT_FILE) {
      await import("node:fs/promises").then(({ writeFile }) =>
        writeFile(process.env.ONLYSPEECH_AUTOMATION_PORT_FILE!, String(this.port), "utf8")
      );
    }
  }

  dispose(): void {
    this.server?.close();
    this.server = null;
    this.port = null;
  }

  private createSnapshot() {
    const kioskManager = this.bindings.getKioskManager();
    const setupWizardManager = this.bindings.getSetupWizardManager();

    return {
      kiosk: kioskManager?.getSnapshot() ?? null,
      setupWizard: setupWizardManager.getSnapshot()
    };
  }
}

export function isTestAutomationEnabled(options: {
  isPackaged: boolean;
  env?: NodeJS.ProcessEnv;
}): boolean {
  const env = options.env ?? process.env;
  if (env.ONLYSPEECH_TEST_AUTOMATION !== "1") {
    return false;
  }

  return !options.isPackaged || env.ONLYSPEECH_ALLOW_PACKAGED_TEST_AUTOMATION === "1";
}
