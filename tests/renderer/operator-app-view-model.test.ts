import { describe, expect, it } from "vitest";
import {
  getLocalizedRoleLabels,
  getSourceLanguageLabel,
  resolveDocumentDirection,
  resolveSideFromLocation
} from "../../src/renderer/operator/app/operator-app-view-model.js";

describe("operator app view model", () => {
  it("resolves the station side from the query string", () => {
    expect(resolveSideFromLocation("?side=B")).toBe("B");
    expect(resolveSideFromLocation("?side=A")).toBe("A");
    expect(resolveSideFromLocation("")).toBe("A");
  });

  it("keeps localized labels and language helpers deterministic", () => {
    expect(getLocalizedRoleLabels("it")).toEqual({ A: "Operatore", B: "Utente" });
    expect(getSourceLanguageLabel(null)).toBe("-");
  });

  it("resolves right-to-left document direction for visitor languages", () => {
    expect(resolveDocumentDirection("ar")).toBe("rtl");
    expect(resolveDocumentDirection("it")).toBe("ltr");
  });
});
