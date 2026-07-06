import { describe, expect, it } from "vitest";
import { getSetupWizardControlHtml } from "../src/tools/setup-wizard/pages.js";
import {
  createDom,
  createWizardApi,
  createWizardState,
  waitForScripts
} from "./setup-wizard-dom-test-helpers.js";

describe("setup wizard keyboard accessibility", () => {
  it("initial active section nav button has aria-current set to true", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    const buttons = window.document.querySelectorAll("[data-section]");
    const activeCurrent = Array.from(buttons).filter((b) => b.getAttribute("aria-current") === "true");
    const inactiveCurrent = Array.from(buttons).filter((b) => b.getAttribute("aria-current") === "false");

    expect(activeCurrent).toHaveLength(1);
    expect(activeCurrent[0].getAttribute("data-section")).toBe("license");
    expect(activeCurrent[0].classList.contains("is-active")).toBe(true);
    expect(inactiveCurrent).toHaveLength(5);
  });

  it("clicking a section nav button updates aria-current on all nav buttons", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    const providerButton = window.document.querySelector<HTMLButtonElement>('[data-section="provider"]');
    if (!providerButton) throw new Error("Provider section button not found.");
    providerButton.click();
    await waitForScripts(window);

    const buttons = window.document.querySelectorAll("[data-section]");
    for (const button of Array.from(buttons)) {
      const section = button.getAttribute("data-section");
      const current = button.getAttribute("aria-current");
      expect(current).toBe(section === "provider" ? "true" : "false");
      expect(button.classList.contains("is-active")).toBe(section === "provider");
    }
  });

  it("monitor setup button has aria-pressed and is accessible", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    const toggleButton = window.document.querySelector<HTMLButtonElement>("#toggle-monitor-setup");
    if (!toggleButton) throw new Error("Monitor setup toggle button not found.");

    expect(toggleButton.getAttribute("aria-pressed")).toBeDefined();
    expect(toggleButton.getAttribute("aria-description")).toBeTruthy();
    expect(toggleButton.textContent).toContain("Open guided display setup");
  });

  it("microphone clear buttons have aria-label identifying the side", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    const clearA = window.document.querySelector("#microphone-clear-A");
    const clearB = window.document.querySelector("#microphone-clear-B");
    if (!clearA || !clearB) throw new Error("Microphone clear buttons not found.");

    expect(clearA.getAttribute("aria-label")).toContain("A");
    expect(clearB.getAttribute("aria-label")).toContain("B");
  });

  it("microphone signal meters have progressbar role with aria-valuemin, aria-valuemax and aria-valuenow", async () => {
    const state = createWizardState();
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    for (const side of ["A", "B"]) {
      const signal = window.document.querySelector(`#microphone-signal-${side}`);
      if (!signal) throw new Error(`Microphone signal container for side ${side} not found.`);
      expect(signal.getAttribute("role")).toBe("progressbar");
      expect(signal.getAttribute("aria-valuemin")).toBe("0");
      expect(signal.getAttribute("aria-valuemax")).toBe("100");
      expect(signal.getAttribute("aria-valuenow")).toBeDefined();
      expect(signal.getAttribute("aria-label")).toBeTruthy();
    }
  });
});

