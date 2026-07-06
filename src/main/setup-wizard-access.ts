import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { MIN_SETUP_WIZARD_PASSWORD_LENGTH } from "../shared/constants.js";
import type {
  SetupWizardAccessFailureCode,
  SetupWizardAccessRequest,
  SetupWizardAccessResult,
  SetupWizardAccessState
} from "../shared/types.js";

const SETUP_WIZARD_ACCESS_SCHEMA_VERSION = 3;
const MAX_FAILED_AUTHORIZATION_ATTEMPTS = 5;
const AUTHORIZATION_LOCKOUT_MS = 5 * 60 * 1_000;

const DEFAULT_PASSWORD_DERIVATION = Object.freeze({
  algorithm: "scrypt" as const,
  cost: 16_384,
  blockSize: 8,
  parallelization: 1,
  keyLength: 64
});

interface PersistedSetupWizardAccessRecordV3 {
  schemaVersion: 3;
  passwordSalt: string;
  passwordHash: string;
  passwordDerivation: typeof DEFAULT_PASSWORD_DERIVATION;
  mustChangePassword: boolean;
  failedAuthorizationAttempts: number;
  lockedUntilEpochMs: number | null;
}

type PersistedSetupWizardAccessRecord = PersistedSetupWizardAccessRecordV3;

function derivePasswordHash(
  password: string,
  salt: string,
  passwordDerivation: typeof DEFAULT_PASSWORD_DERIVATION
): string {
  return scryptSync(password, salt, passwordDerivation.keyLength, {
    N: passwordDerivation.cost,
    r: passwordDerivation.blockSize,
    p: passwordDerivation.parallelization
  }).toString("hex");
}

function compareHexHashes(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  if (leftBuffer.length === 0 || rightBuffer.length === 0 || leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyPassword(password: string, record: PersistedSetupWizardAccessRecord): boolean {
  return compareHexHashes(
    derivePasswordHash(password, record.passwordSalt, record.passwordDerivation),
    record.passwordHash
  );
}

function createPasswordRecord(
  password: string,
  options: {
    mustChangePassword: boolean;
    randomBytesProvider: (size: number) => Buffer;
  }
): PersistedSetupWizardAccessRecordV3 {
  const passwordSalt = options.randomBytesProvider(16).toString("hex");

  return {
    schemaVersion: SETUP_WIZARD_ACCESS_SCHEMA_VERSION,
    passwordSalt,
    passwordHash: derivePasswordHash(password, passwordSalt, DEFAULT_PASSWORD_DERIVATION),
    passwordDerivation: DEFAULT_PASSWORD_DERIVATION,
    mustChangePassword: options.mustChangePassword,
    failedAuthorizationAttempts: 0,
    lockedUntilEpochMs: null
  };
}

function createTemporaryPassword(randomBytesProvider: (size: number) => Buffer): string {
  const passwordLength = Math.max(12, MIN_SETUP_WIZARD_PASSWORD_LENGTH);

  return randomBytesProvider(passwordLength)
    .toString("hex")
    .slice(0, passwordLength);
}

export class SetupWizardAccessManager {
  private provisioningTemporaryPassword: string | null = null;

  constructor(
    private readonly accessFilePath: string,
    private readonly randomBytesProvider: (size: number) => Buffer = randomBytes,
    private readonly nowProvider: () => number = Date.now
  ) {}

  ensureInitialized(options: { runtimeEnvPresent: boolean } = { runtimeEnvPresent: false }): void {
    if (existsSync(this.accessFilePath)) {
      return;
    }

    if (options.runtimeEnvPresent) {
      const temporaryPassword = createTemporaryPassword(this.randomBytesProvider);
      this.provisioningTemporaryPassword = temporaryPassword;
      this.writeRecord(createPasswordRecord(temporaryPassword, {
        mustChangePassword: true,
        randomBytesProvider: this.randomBytesProvider
      }));
    }
  }

  setPassword(newPassword: string): void {
    this.writeRecord(createPasswordRecord(newPassword, {
      mustChangePassword: false,
      randomBytesProvider: this.randomBytesProvider
    }));
    this.provisioningTemporaryPassword = null;
  }

  getAccessState(options: { runtimeEnvPresent: boolean }): SetupWizardAccessState {
    this.ensureInitialized(options);
    if (!existsSync(this.accessFilePath)) {
      return {
        requiresPassword: false,
        mustChangePassword: false,
        temporaryPassword: null
      };
    }
    const record = this.readRecord();
    return {
      requiresPassword: options.runtimeEnvPresent,
      mustChangePassword: options.runtimeEnvPresent ? record.mustChangePassword : false,
      temporaryPassword: options.runtimeEnvPresent ? this.provisioningTemporaryPassword : null
    };
  }

  getProvisioningNotice(): {
    temporaryPassword: string | null;
    mustChangePassword: boolean;
  } {
    this.ensureInitialized({ runtimeEnvPresent: true });
    if (!existsSync(this.accessFilePath)) {
      return {
        temporaryPassword: null,
        mustChangePassword: false
      };
    }
    const record = this.readRecord();
    return {
      temporaryPassword: this.provisioningTemporaryPassword,
      mustChangePassword: record.mustChangePassword
    };
  }

  authorize(request: SetupWizardAccessRequest): SetupWizardAccessResult {
    this.ensureInitialized({ runtimeEnvPresent: true });
    if (!existsSync(this.accessFilePath)) {
      return this.failure("invalid-password");
    }

    const password = request.password.trim();
    const nextPassword = request.nextPassword?.trim() ?? "";
    const record = this.readRecord();
    const now = this.nowProvider();

    if (record.lockedUntilEpochMs !== null && record.lockedUntilEpochMs > now) {
      return this.failure("temporarily-locked");
    }

    if (!password || !verifyPassword(password, record)) {
      const failedAuthorizationAttempts = record.failedAuthorizationAttempts + 1;
      this.writeRecord({
        ...record,
        failedAuthorizationAttempts: failedAuthorizationAttempts >= MAX_FAILED_AUTHORIZATION_ATTEMPTS
          ? 0
          : failedAuthorizationAttempts,
        lockedUntilEpochMs: failedAuthorizationAttempts >= MAX_FAILED_AUTHORIZATION_ATTEMPTS
          ? now + AUTHORIZATION_LOCKOUT_MS
          : null
      });
      if (failedAuthorizationAttempts >= MAX_FAILED_AUTHORIZATION_ATTEMPTS) {
        return this.failure("temporarily-locked");
      }
      return this.failure("invalid-password");
    }

    if (record.failedAuthorizationAttempts !== 0 || record.lockedUntilEpochMs !== null) {
      this.writeRecord({
        ...record,
        failedAuthorizationAttempts: 0,
        lockedUntilEpochMs: null
      });
    }

    if (!record.mustChangePassword) {
      return { ok: true };
    }

    if (!nextPassword) {
      return this.failure("new-password-required");
    }

    if (nextPassword.length < MIN_SETUP_WIZARD_PASSWORD_LENGTH) {
      return this.failure("new-password-too-short");
    }

    this.writeRecord(createPasswordRecord(nextPassword, {
      mustChangePassword: false,
      randomBytesProvider: this.randomBytesProvider
    }));
    this.provisioningTemporaryPassword = null;

    return { ok: true };
  }

  private readRecord(): PersistedSetupWizardAccessRecord {
    const parsed = JSON.parse(readFileSync(this.accessFilePath, "utf8")) as {
      schemaVersion?: number;
      temporaryPassword?: string | null;
    };

    if (parsed.schemaVersion !== SETUP_WIZARD_ACCESS_SCHEMA_VERSION) {
      throw new Error(
        `Unsupported setup wizard access record schema. Delete and reprovision '${this.accessFilePath}' before reopening the setup wizard.`
      );
    }

    return parsed as PersistedSetupWizardAccessRecord;
  }

  private writeRecord(record: PersistedSetupWizardAccessRecord): void {
    mkdirSync(dirname(this.accessFilePath), { recursive: true });
    writeFileSync(this.accessFilePath, JSON.stringify(record, null, 2) + "\n", "utf8");
  }

  private failure(code: SetupWizardAccessFailureCode): SetupWizardAccessResult {
    switch (code) {
      case "invalid-password":
        return {
          ok: false,
          code,
          message: "Setup wizard password is invalid."
        };
      case "temporarily-locked":
        return {
          ok: false,
          code,
          message: "Setup wizard access is temporarily locked after repeated failed attempts. Try again in five minutes."
        };
      case "new-password-required":
        return {
          ok: false,
          code,
          message: "A new setup wizard password is required before reopening the wizard."
        };
      case "new-password-too-short":
        return {
          ok: false,
          code,
          message: `The new setup wizard password must be at least ${MIN_SETUP_WIZARD_PASSWORD_LENGTH} characters long.`
        };
      default:
        return {
          ok: false,
          code,
          message: "Unable to authorize setup wizard access."
        };
    }
  }
}

export function getMinimumSetupWizardPasswordLength(): number {
  return MIN_SETUP_WIZARD_PASSWORD_LENGTH;
}
