import { describe, expect, it } from "vitest";
import {
  SETUP_WIZARD_LICENSE_COPY_BY_LANGUAGE,
  type SetupWizardLicenseCopy
} from "../../src/tools/setup-wizard/license-copy.js";
import { getSetupWizardControlLicenseCopyScript } from "../../src/tools/setup-wizard/control-page-script-license-copy.js";
import {
  LICENSE_SHELL_COPY_FIELDS,
  getSetupWizardLicenseShellCopy
} from "../../src/tools/setup-wizard/license-shell-copy.js";
import { SUPPORTED_SETUP_WIZARD_UI_LANGUAGES } from "../../src/tools/setup-wizard/localization.js";

describe("setup wizard license copy", () => {
  it("keeps the shell projection aligned with the canonical localized resources", () => {
    for (const language of SUPPORTED_SETUP_WIZARD_UI_LANGUAGES) {
      const canonicalCopy = SETUP_WIZARD_LICENSE_COPY_BY_LANGUAGE[language];
      const shellCopy = getSetupWizardLicenseShellCopy(language);

      for (const field of LICENSE_SHELL_COPY_FIELDS) {
        expect(shellCopy[field]).toBe(canonicalCopy[field]);
      }
    }
  });

  it("serializes the canonical localized resources into the runtime script", () => {
    const script = getSetupWizardControlLicenseCopyScript();
    const match = script.match(/const licenseCopyByLanguage = (\{[\s\S]*\});\s+function licenseCopy/u);

    expect(match).not.toBeNull();

    const serializedCopy = match?.[1];
    expect(serializedCopy).toBeTruthy();

    const parsedCopy = JSON.parse(serializedCopy ?? "") as Record<string, SetupWizardLicenseCopy>;
    expect(parsedCopy).toEqual(SETUP_WIZARD_LICENSE_COPY_BY_LANGUAGE);
  });
});
