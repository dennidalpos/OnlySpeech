import { describe, expect, it } from "vitest";
import { ACTIVATION_COPY } from "../src/renderer/activation/activation-copy.js";
import {
  SHARED_LICENSE_FORM_COPY_BY_LANGUAGE,
  type SharedLicenseCopyLanguage
} from "../src/shared/license-copy.js";
import { SETUP_WIZARD_LICENSE_COPY_BY_LANGUAGE } from "../src/tools/setup-wizard/license-copy.js";
import { SUPPORTED_SETUP_WIZARD_UI_LANGUAGES } from "../src/tools/setup-wizard/localization.js";

function assertSharedActivationFields(language: "en" | "it") {
  const shared = SHARED_LICENSE_FORM_COPY_BY_LANGUAGE[language];
  const activationCopy = ACTIVATION_COPY[language];

  expect(activationCopy.emailLabel).toBe(shared.emailLabel);
  expect(activationCopy.emailPlaceholder).toBe(shared.emailPlaceholder);
  expect(activationCopy.codeLabel).toBe(shared.codeLabel);
  expect(activationCopy.codePlaceholder).toBe(shared.codePlaceholder);
  expect(activationCopy.submitLabel).toBe(shared.activateSubmitLabel);
  expect(activationCopy.detailsShowLabel).toBe(shared.detailsShowLabel);
  expect(activationCopy.detailsHideLabel).toBe(shared.detailsHideLabel);
}

function assertSharedSetupWizardFields(language: SharedLicenseCopyLanguage) {
  const shared = SHARED_LICENSE_FORM_COPY_BY_LANGUAGE[language];
  const setupCopy = SETUP_WIZARD_LICENSE_COPY_BY_LANGUAGE[language];

  expect(setupCopy.emailLabel).toBe(shared.emailLabel);
  expect(setupCopy.emailPlaceholder).toBe(shared.emailPlaceholder);
  expect(setupCopy.codeLabel).toBe(shared.codeLabel);
  expect(setupCopy.codePlaceholder).toBe(shared.codePlaceholder);
  expect(setupCopy.activateSubmitLabel).toBe(shared.activateSubmitLabel);
  expect(setupCopy.detailsShowLabel).toBe(shared.detailsShowLabel);
  expect(setupCopy.detailsHideLabel).toBe(shared.detailsHideLabel);
}

describe("shared license copy contract", () => {
  it("keeps activation window fields aligned with the canonical shared form copy", () => {
    assertSharedActivationFields("en");
    assertSharedActivationFields("it");
  });

  it("keeps setup wizard fields aligned with the canonical shared form copy", () => {
    for (const language of SUPPORTED_SETUP_WIZARD_UI_LANGUAGES) {
      assertSharedSetupWizardFields(language);
    }
  });
});
