import { describe, expect, it } from "vitest";
import { getSetupWizardControlHtml } from "../src/tools/setup-wizard/pages.js";
import {
  createDom,
  createWizardApi,
  createWizardState,
  setInputValue,
  waitForScripts
} from "./setup-wizard-dom-test-helpers.js";

describe("setup wizard initial setup mode", () => {
  it("enforces sequential section unlocking, validates wizard password on first boot, and styles next buttons", async () => {
    // 1. Create a state simulating fresh boot (no env file exists)
    const state = createWizardState();
    state.lastSavedEnvPath = null; // null indicates initialSetupMode

    // Initially active section is license, stations should be locked
    const api = createWizardApi(state);
    const dom = await createDom(getSetupWizardControlHtml(), api, "http://127.0.0.1/control");
    const { window } = dom;

    // Check that we have a password card visible
    const pwdCard = window.document.getElementById("wizard-password-setup-card");
    expect(pwdCard).not.toBeNull();
    expect(pwdCard?.hidden).toBe(false);

    // Verify step numbers are present in the nav links
    const navLinks = window.document.querySelectorAll(".section-links button");
    expect(navLinks).toHaveLength(6);
    expect(navLinks[0].textContent).toContain("1. ");
    expect(navLinks[1].textContent).toContain("2. ");

    // Verify next buttons are styled as primary in initial setup mode
    const licenseNextBtn = window.document.getElementById("license-save-btn");
    expect(licenseNextBtn?.classList.contains("primary")).toBe(true);
    expect(licenseNextBtn?.classList.contains("secondary")).toBe(false);

    // Check checklist contains the wizard password validation warning
    let checklist = window.document.getElementById("required-config-checklist");
    expect(checklist?.textContent).toContain("wizard password not set");

    // Type matching valid passwords in the fields
    setInputValue(window, "#wizard-password", "ValidSetupPass123");
    setInputValue(window, "#wizard-confirm-password", "ValidSetupPass123");

    // Trigger oninput event manually if not fired by helper
    window.document.getElementById("wizard-password")?.dispatchEvent(new window.Event("input"));
    window.document.getElementById("wizard-confirm-password")?.dispatchEvent(new window.Event("input"));

    await waitForScripts(window);

    // Checklist should no longer contain "wizard password not set"
    checklist = window.document.getElementById("required-config-checklist");
    expect(checklist?.textContent).not.toContain("wizard password not set");

    // If passwords mismatch
    setInputValue(window, "#wizard-confirm-password", "DifferentPass123");
    window.document.getElementById("wizard-confirm-password")?.dispatchEvent(new window.Event("input"));
    await waitForScripts(window);

    checklist = window.document.getElementById("required-config-checklist");
    expect(checklist?.textContent).toContain("passwords do not match");
  });
});
