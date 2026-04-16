import { afterEach, describe, expect, it, vi } from "vitest";
import { TestAutomationServer } from "../src/main/test-automation.js";

afterEach(() => {
  delete process.env.ONLYSPEECH_TEST_AUTOMATION;
  delete process.env.ONLYSPEECH_ALLOW_PACKAGED_TEST_AUTOMATION;
  delete process.env.ONLYSPEECH_AUTOMATION_PORT;
  delete process.env.ONLYSPEECH_AUTOMATION_PORT_FILE;
});

describe("TestAutomationServer", () => {
  it("rejects malformed kiosk device probes with HTTP 400 before they reach the kiosk manager", async () => {
    const handleDeviceProbe = vi.fn();
    const server = new TestAutomationServer({
      isPackaged: false,
      getKioskManager: () => ({ getSnapshot: () => ({ state: null, windows: [] }), handleDeviceProbe } as never),
      getSetupWizardManager: () => ({ getSnapshot: () => ({ controlWindowOpen: false, overlayDisplayIds: [] }) } as never),
      openSetupWizard: () => undefined,
      openSetupWizardMonitorSetup: () => undefined,
      closeSetupWizard: () => undefined,
      navigateSetupWizardToSection: async () => undefined,
      inspectSetupWizardControlWindow: async () => ({}),
      inspectSetupWizardOverlayWindow: async () => ({}),
      clickSetupWizardControlWindow: async () => undefined,
      captureKioskWindow: async () => null,
      inspectKioskWindow: async () => null,
      captureSetupWizardControlWindow: async () => null,
      captureSetupWizardOverlayWindow: async () => null
    });
    process.env.ONLYSPEECH_TEST_AUTOMATION = "1";
    process.env.ONLYSPEECH_AUTOMATION_PORT = "0";

    await server.ensureStarted();
    const port = (server as unknown as { port: number | null }).port;
    const response = await fetch(`http://127.0.0.1:${port}/kiosk/device-probe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ side: "A", permissionGranted: true })
    });

    expect(response.status).toBe(400);
    expect(handleDeviceProbe).not.toHaveBeenCalled();
    server.dispose();
  });

  it("rejects malformed operator actions with HTTP 400 before they mutate kiosk state", async () => {
    const handleOperatorAction = vi.fn();
    const server = new TestAutomationServer({
      isPackaged: false,
      getKioskManager: () => ({ getSnapshot: () => ({ state: null, windows: [] }), handleOperatorAction } as never),
      getSetupWizardManager: () => ({ getSnapshot: () => ({ controlWindowOpen: false, overlayDisplayIds: [] }) } as never),
      openSetupWizard: () => undefined,
      openSetupWizardMonitorSetup: () => undefined,
      closeSetupWizard: () => undefined,
      navigateSetupWizardToSection: async () => undefined,
      inspectSetupWizardControlWindow: async () => ({}),
      inspectSetupWizardOverlayWindow: async () => ({}),
      clickSetupWizardControlWindow: async () => undefined,
      captureKioskWindow: async () => null,
      inspectKioskWindow: async () => null,
      captureSetupWizardControlWindow: async () => null,
      captureSetupWizardOverlayWindow: async () => null
    });
    process.env.ONLYSPEECH_TEST_AUTOMATION = "1";
    process.env.ONLYSPEECH_AUTOMATION_PORT = "0";

    await server.ensureStarted();
    const port = (server as unknown as { port: number | null }).port;
    const response = await fetch(`http://127.0.0.1:${port}/kiosk/operator-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "select-target-language", side: "A" })
    });

    expect(response.status).toBe(400);
    expect(handleOperatorAction).not.toHaveBeenCalled();
    server.dispose();
  });
});
