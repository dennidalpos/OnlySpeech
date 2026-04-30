import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConfirmDialog } from "../src/renderer/operator/components/ConfirmDialog.js";
import { SetupWizardAccessDialog } from "../src/renderer/operator/components/SetupWizardAccessDialog.js";
import { StatusBadge } from "../src/renderer/operator/components/StatusBadge.js";

describe("operator accessibility components", () => {
  it("announces runtime status badge updates as a polite live region", () => {
    const html = renderToStaticMarkup(<StatusBadge status="translating" language="en" />);

    expect(html).toContain('class="status-badge status-translating"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-atomic="true"');
  });

  it("labels and describes setup access dialog content and announces access errors", () => {
    const html = renderToStaticMarkup(
      <SetupWizardAccessDialog
        title="Setup password"
        description="Enter the workstation-local setup password."
        passwordLabel="Password"
        newPasswordLabel="New password"
        confirmPasswordLabel="Confirm password"
        submitLabel="Unlock"
        cancelLabel="Cancel"
        mustChangePassword={false}
        errorMessage="Password is invalid."
        onCancel={() => undefined}
        onSubmit={() => undefined}
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-labelledby="setup-wizard-access-dialog-title"');
    expect(html).toContain('aria-describedby="setup-wizard-access-dialog-description"');
    expect(html).toContain('id="setup-wizard-access-dialog-title"');
    expect(html).toContain('id="setup-wizard-access-dialog-description"');
    expect(html).toContain('class="setup-access-error" role="alert" aria-live="assertive"');
  });

  it("labels and describes confirmation dialogs with stable references", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        title="Reset session"
        description="Clear current conversation text."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-labelledby="confirm-dialog-title"');
    expect(html).toContain('aria-describedby="confirm-dialog-description"');
    expect(html).toContain('id="confirm-dialog-title"');
    expect(html).toContain('id="confirm-dialog-description"');
  });
});
