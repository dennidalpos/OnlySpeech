import { describe, expect, it } from "vitest";
import { overlayWizardChannels, parseWizardPayload } from "../src/main/setup-wizard-ipc.js";

describe("setup wizard IPC contracts", () => {
  it("accepts strict valid payloads and rejects malformed values", () => {
    expect(parseWizardPayload("wizard:assign-display", { side: "A", displayId: 12 })).toEqual({
      side: "A",
      displayId: 12
    });
    expect(() => parseWizardPayload("wizard:assign-display", { side: "A", displayId: "12" })).toThrow(
      "Invalid wizard:assign-display payload."
    );
    expect(() => parseWizardPayload("wizard:save-env", { unexpected: true })).toThrow(
      "Invalid wizard:save-env payload."
    );
  });

  it("keeps overlay access limited to display setup channels", () => {
    expect(overlayWizardChannels.has("wizard:assign-display")).toBe(true);
    expect(overlayWizardChannels.has("wizard:save-env")).toBe(false);
    expect(overlayWizardChannels.has("wizard:terminate-application")).toBe(false);
  });
});
