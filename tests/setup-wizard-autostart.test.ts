import { describe, expect, it } from "vitest";
import { resolveWizardAutostartState } from "../src/main/setup-wizard-autostart.js";

describe("setup wizard autostart state", () => {
  describe("packaged installs", () => {
    it("reports current-user Run-key autostart for packaged builds", () => {
      const state = resolveWizardAutostartState({
        isPackaged: true,
        currentUserRunValue: null
      });

      expect(state.mechanism).toBe("current-user-run-key");
      expect(state.scope).toBe("current-user");
      expect(state.supported).toBe(true);
      expect(state.canModify).toBe(true);
      expect(state.requiresElevation).toBeUndefined();
    });

    it("reports autostart disabled when the current-user Run key is absent", () => {
      const state = resolveWizardAutostartState({
        isPackaged: true,
        currentUserRunValue: null
      });

      expect(state.currentEnabled).toBe(false);
      expect(state.selectedEnabled).toBe(false);
    });

    it("reports autostart enabled when the current-user Run key is present", () => {
      const state = resolveWizardAutostartState({
        isPackaged: true,
        currentUserRunValue: "\"C:\\Program Files\\OnlySpeech\\OnlySpeech.exe\""
      });

      expect(state.currentEnabled).toBe(true);
      expect(state.selectedEnabled).toBe(true);
    });
  });

  describe("source-mode (dev) sessions", () => {
    it("marks autostart unsupported and non-modifiable for source-mode sessions", () => {
      const state = resolveWizardAutostartState({ isPackaged: false });

      expect(state.supported).toBe(false);
      expect(state.canModify).toBe(false);
      expect(state.currentEnabled).toBe(false);
      expect(state.selectedEnabled).toBe(false);
    });

    it("keeps the packaged Run-key mechanism as the only supported autostart contract", () => {
      const state = resolveWizardAutostartState({ isPackaged: false });

      expect(state.mechanism).toBe("current-user-run-key");
      expect(state.scope).toBe("current-user");
    });
  });
});
