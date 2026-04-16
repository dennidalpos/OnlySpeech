import { describe, expect, it } from "vitest";
import { getSetupWizardControlHtml } from "../src/tools/setup-wizard/pages.js";
import { createInitialWizardState } from "../src/tools/setup-wizard/shared.js";
import {
  click,
  createDom,
  createWizardApi,
  createWizardState,
  setValue,
  waitForScripts
} from "./setup-wizard-dom-test-helpers.js";

describe("setup wizard station flow DOM interactions", () => {
  it("renders station monitor panels as unassigned when no display is assigned", async () => {
    const baseState = createInitialWizardState(
      [
        { displayId: 101, label: "Fixture A", bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 },
        { displayId: 202, label: "Fixture B", bounds: { x: 1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 }
      ],
      { TRANSLATION_PROVIDER: "chatgpt" }
    );
    const api = createWizardApi({ ...baseState, signalLevels: { A: 0, B: 0 } });
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    const monitorA = window.document.querySelector("#station-monitor-A");
    const monitorB = window.document.querySelector("#station-monitor-B");

    expect(monitorA?.textContent).toContain("no display assigned");
    expect(monitorB?.textContent).toContain("no display assigned");
  });

  it("renders the assigned display name in the station monitor panel when a display is assigned", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    // Default wizard state has display 101 assigned to side A
    expect(window.document.querySelector("#station-monitor-A")?.textContent).toContain("Fixture A");
    expect(window.document.querySelector("#station-monitor-B")?.textContent).toContain("Fixture B");
  });

  it("opens the guided display setup overlay when the monitor setup button is clicked", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    const toggleButton = window.document.querySelector<HTMLButtonElement>("#toggle-monitor-setup");
    if (!toggleButton) throw new Error("Monitor setup toggle button not found.");

    toggleButton.click();
    await waitForScripts(window);

    expect(api.openMonitorSetup).toHaveBeenCalledTimes(1);
  });

  it("assigns a microphone via the station-mic select and calls assignMicrophone", async () => {
    const state = createWizardState();
    state.microphones = state.microphones.map((m) => ({ ...m, assignedSides: [] }));
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    setValue(window, "#microphone-select-A", "mic-a");
    await waitForScripts(window);

    expect(api.assignMicrophone).toHaveBeenCalledWith("A", "mic-a");
  });

  it("auto-probes microphones when the wizard starts without a current microphone inventory", async () => {
    const state = createWizardState();
    state.microphones = [];
    state.microphonePermissionGranted = false;
    const api = createWizardApi(state);

    await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");

    expect(api.updateMicrophones).toHaveBeenCalledTimes(1);
    expect(api.updateMicrophones).toHaveBeenCalledWith({
      microphones: [
        { deviceId: "mic-a", groupId: "ga", label: "Microfono A" },
        { deviceId: "mic-b", groupId: "gb", label: "Microfono B" }
      ],
      microphonePermissionGranted: true,
      microphoneError: null
    });
  });

  it("renders distinct readable microphone options when multiple analog inputs expose generic labels", async () => {
    const state = createWizardState();
    state.microphones = [
      {
        deviceId: "rear-mic",
        groupId: "realtek-g1",
        label: "HD Audio Input",
        displayLabel: "HD Audio Input · tk-g1",
        connectionType: "analog",
        connectionLabel: "Analogico",
        assignedSides: []
      },
      {
        deviceId: "line-in",
        groupId: "realtek-g2",
        label: "HD Audio Input",
        displayLabel: "HD Audio Input · tk-g2",
        connectionType: "analog",
        connectionLabel: "Analogico",
        assignedSides: []
      }
    ];
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const optionsText = Array.from(
      dom.window.document.querySelectorAll("#microphone-select-A option")
    ).map((option) => option.textContent?.trim());

    expect(optionsText).toContain("HD Audio Input · tk-g1");
    expect(optionsText).toContain("HD Audio Input · tk-g2");
  });

  it("does not flag the saved shared microphone as unavailable when the browser changes its group id on reopen", async () => {
    const state = createWizardState();
    state.envValues.MICROPHONE_PTT_MODE = "single-shared";
    state.envValues.MIC_A_ID = "endpoint:origin-a-group:microphone:microfono%20generale%20webcam%201b3f%202247";
    state.envValues.MIC_B_ID = "endpoint:origin-a-group:microphone:microfono%20generale%20webcam%201b3f%202247";
    state.microphones = [
      {
        deviceId: "origin-b-device",
        groupId: "origin-b-group",
        label: "Microfono generale Webcam 1B3F 2247",
        connectionType: "usb",
        connectionLabel: "USB",
        assignedSides: []
      }
    ];

    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const noticesText = dom.window.document.querySelector("#microphone-notices")?.textContent || "";

    expect(noticesText).not.toContain("non e' piu disponibile");
  });

  it("clears a microphone assignment via the clear button and calls assignMicrophone with null", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    click(window, "#microphone-clear-A");
    await waitForScripts(window);

    expect(api.assignMicrophone).toHaveBeenCalledWith("A", null);
  });

  it("persists separate selector zone and language for operator and visitor from the languages section", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    expect((window.document.querySelector("#env-SELECTOR_UI_LANGUAGE_A") as HTMLSelectElement | null)?.value).toBe("en");
    expect((window.document.querySelector("#env-SELECTOR_UI_LANGUAGE_B") as HTMLSelectElement | null)?.value).toBe("en");

    setValue(window, "#env-SELECTOR_UI_LANGUAGE_A", "fr");
    await waitForScripts(window);
    setValue(window, "#env-SELECTOR_UI_LANGUAGE_B", "de");
    await waitForScripts(window);

    expect(api.updateEnvValues).toHaveBeenCalledWith({ SELECTOR_UI_LANGUAGE_A: "fr" });
    expect(api.updateEnvValues).toHaveBeenCalledWith({ SELECTOR_UI_LANGUAGE_B: "de" });
  });

  it("keeps the first-class station microphone profile buttons synchronized with the runtime profile", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    click(window, "#stations-microphone-profile-shared");
    await waitForScripts(window);

    expect(api.updateEnvValues).toHaveBeenCalledWith({
      APP_MODE: "kiosk",
      MICROPHONE_PTT_MODE: "single-shared",
      REQUIRED_MICROPHONES: "1"
    });
    expect((window.document.querySelector("#env-MICROPHONE_PTT_MODE") as HTMLSelectElement | null)?.value).toBe("single-shared");
    expect(window.document.querySelector("#stations-microphone-profile-note")?.textContent).toContain("one shared microphone");
  });

  it("keeps visitor history editable only in the languages section and mirrors it as read-only in save review", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    expect(window.document.querySelectorAll('[id="env-VISITOR_CONVERSATION_HISTORY_ENABLED"]')).toHaveLength(1);
    expect(window.document.querySelector("#save-review-visitor-history")?.textContent).toContain("Disabled");

    setValue(window, "#env-VISITOR_CONVERSATION_HISTORY_ENABLED", "true");
    await waitForScripts(window);

    expect(api.updateEnvValues).toHaveBeenCalledWith({ VISITOR_CONVERSATION_HISTORY_ENABLED: "true" });
    expect(window.document.querySelector("#save-review-visitor-history")?.textContent).toContain("Enabled");
  });

});

