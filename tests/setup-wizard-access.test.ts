import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { SetupWizardAccessManager, getMinimumSetupWizardPasswordLength } from "../src/main/setup-wizard-access.js";

const tempDirectories: string[] = [];

function createTempDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "onlyspeech-setup-access-"));
  tempDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("SetupWizardAccessManager", () => {
  it("creates a temporary workstation-local password on first startup and does not require it before provisioning", () => {
    const directory = createTempDirectory();
    const accessFilePath = join(directory, "setup-wizard-access.json");
    const manager = new SetupWizardAccessManager(accessFilePath, (size) => Buffer.alloc(size, 0x41));

    manager.ensureInitialized();

    const accessState = manager.getAccessState({ runtimeEnvPresent: false });
    const provisioningNotice = manager.getProvisioningNotice();
    const persisted = JSON.parse(readFileSync(accessFilePath, "utf8")) as {
      temporaryPassword: string | null;
      mustChangePassword: boolean;
    };

    expect(accessState).toEqual({
      requiresPassword: false,
      mustChangePassword: false,
      temporaryPassword: null
    });
    expect((persisted as { schemaVersion?: number }).schemaVersion).toBe(2);
    expect((persisted as { passwordDerivation?: { algorithm?: string } }).passwordDerivation?.algorithm).toBe("scrypt");
    expect(provisioningNotice.mustChangePassword).toBe(true);
    expect(provisioningNotice.temporaryPassword).toHaveLength(12);
    expect(persisted.temporaryPassword).toBe(provisioningNotice.temporaryPassword);
    expect(persisted.mustChangePassword).toBe(true);
  });

  it("always generates a temporary password that satisfies the minimum length even with non-alphanumeric base64url bytes", () => {
    const directory = createTempDirectory();
    const accessFilePath = join(directory, "setup-wizard-access.json");
    const manager = new SetupWizardAccessManager(accessFilePath, (size) => Buffer.alloc(size, 0xff));

    manager.ensureInitialized();

    const temporaryPassword = manager.getProvisioningNotice().temporaryPassword;

    expect(temporaryPassword).toHaveLength(12);
    expect(temporaryPassword).toMatch(/^[a-f0-9]+$/);
  });

  it("requires the temporary password after provisioning and forces a password change before reopening the wizard", () => {
    const directory = createTempDirectory();
    const accessFilePath = join(directory, "setup-wizard-access.json");
    const manager = new SetupWizardAccessManager(accessFilePath, (size) => Buffer.alloc(size, 0x42));

    manager.ensureInitialized();
    const temporaryPassword = manager.getProvisioningNotice().temporaryPassword;

    expect(temporaryPassword).toHaveLength(12);
    expect(manager.getAccessState({ runtimeEnvPresent: true })).toEqual({
      requiresPassword: true,
      mustChangePassword: true,
      temporaryPassword
    });
    expect(
      manager.authorize({
        password: "wrong-password"
      })
    ).toEqual({
      ok: false,
      code: "invalid-password",
      message: "Setup wizard password is invalid."
    });
    expect(
      manager.authorize({
        password: temporaryPassword!
      })
    ).toEqual({
      ok: false,
      code: "new-password-required",
      message: "A new setup wizard password is required before reopening the wizard."
    });
    expect(
      manager.authorize({
        password: temporaryPassword!,
        nextPassword: "short"
      })
    ).toEqual({
      ok: false,
      code: "new-password-too-short",
      message: `The new setup wizard password must be at least ${getMinimumSetupWizardPasswordLength()} characters long.`
    });
    expect(
      manager.authorize({
        password: temporaryPassword!,
        nextPassword: "OperatorPass42"
      })
    ).toEqual({ ok: true });
    expect(manager.getProvisioningNotice()).toEqual({
      temporaryPassword: null,
      mustChangePassword: false
    });
    expect(manager.getAccessState({ runtimeEnvPresent: true })).toEqual({
      requiresPassword: true,
      mustChangePassword: false,
      temporaryPassword: null
    });
    expect(
      manager.authorize({
        password: "OperatorPass42"
      })
    ).toEqual({ ok: true });
  });

  it("rejects unsupported legacy persisted access records with a reprovision instruction", () => {
    const directory = createTempDirectory();
    const accessFilePath = join(directory, "setup-wizard-access.json");

    writeFileSync(
      accessFilePath,
      JSON.stringify(
        {
          schemaVersion: 1,
          passwordSalt: "legacy-salt",
          passwordHash: "legacy-hash",
          mustChangePassword: false,
          temporaryPassword: null
        },
        null,
        2
      ) + "\n",
      "utf8"
    );

    const manager = new SetupWizardAccessManager(accessFilePath, (size) => Buffer.alloc(size, 0x24));

    expect(() =>
      manager.authorize({
        password: "OperatorPass42"
      })
    ).toThrow(
      `Unsupported setup wizard access record schema. Delete and reprovision '${accessFilePath}' before reopening the setup wizard.`
    );
  });
});
