import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { MIN_SETUP_WIZARD_PASSWORD_LENGTH } from "../shared/constants.js";
import type {
  SetupWizardAccessFailureCode,
  SetupWizardAccessRequest,
  SetupWizardAccessResult,
  SetupWizardAccessState
} from "../shared/types.js";

const LEGACY_SETUP_WIZARD_ACCESS_SCHEMA_VERSION = 1;
const SETUP_WIZARD_ACCESS_SCHEMA_VERSION = 2;

const DEFAULT_PASSWORD_DERIVATION = Object.freeze({
  algorithm: "scrypt" as const,
  cost: 16_384,
  blockSize: 8,
  parallelization: 1,
  keyLength: 64
});

interface PersistedSetupWizardAccessRecordV1 {
  schemaVersion: 1;
  passwordSalt: string;
  passwordHash: string;
  mustChangePassword: boolean;
  temporaryPassword: string | null;
}

interface PersistedSetupWizardAccessRecordV2 {
  schemaVersion: 2;
  passwordSalt: string;
  passwordHash: string;
  passwordDerivation: typeof DEFAULT_PASSWORD_DERIVATION;
  mustChangePassword: boolean;
  temporaryPassword: string | null;
}

type PersistedSetupWizardAccessRecord =
  | PersistedSetupWizardAccessRecordV1
  | PersistedSetupWizardAccessRecordV2;

function hashPasswordLegacy(password: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${password}`, "utf8").digest("hex");
}

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
  if (record.schemaVersion === LEGACY_SETUP_WIZARD_ACCESS_SCHEMA_VERSION) {
    return compareHexHashes(hashPasswordLegacy(password, record.passwordSalt), record.passwordHash);
  }

  return compareHexHashes(
    derivePasswordHash(password, record.passwordSalt, record.passwordDerivation),
    record.passwordHash
  );
}

function createPasswordRecord(
  password: string,
  options: {
    mustChangePassword: boolean;
    temporaryPassword: string | null;
    randomBytesProvider: (size: number) => Buffer;
  }
): PersistedSetupWizardAccessRecordV2 {
  const passwordSalt = options.randomBytesProvider(16).toString("hex");

  return {
    schemaVersion: SETUP_WIZARD_ACCESS_SCHEMA_VERSION,
    passwordSalt,
    passwordHash: derivePasswordHash(password, passwordSalt, DEFAULT_PASSWORD_DERIVATION),
    passwordDerivation: DEFAULT_PASSWORD_DERIVATION,
    mustChangePassword: options.mustChangePassword,
    temporaryPassword: options.temporaryPassword
  };
}

function createTemporaryPassword(randomBytesProvider: (size: number) => Buffer): string {
  const passwordLength = Math.max(12, MIN_SETUP_WIZARD_PASSWORD_LENGTH);

  return randomBytesProvider(passwordLength)
    .toString("hex")
    .slice(0, passwordLength);
}

export class SetupWizardAccessManager {
  constructor(
    private readonly accessFilePath: string,
    private readonly randomBytesProvider: (size: number) => Buffer = randomBytes
  ) {}

  ensureInitialized(): void {
    if (existsSync(this.accessFilePath)) {
      return;
    }

    const temporaryPassword = createTemporaryPassword(this.randomBytesProvider);
    this.writeRecord(createPasswordRecord(temporaryPassword, {
      mustChangePassword: true,
      temporaryPassword,
      randomBytesProvider: this.randomBytesProvider
    }));
  }

  getAccessState(options: { runtimeEnvPresent: boolean }): SetupWizardAccessState {
    this.ensureInitialized();
    const record = this.readRecord();
    return {
      requiresPassword: options.runtimeEnvPresent,
      mustChangePassword: options.runtimeEnvPresent ? record.mustChangePassword : false,
      temporaryPassword: options.runtimeEnvPresent ? record.temporaryPassword : null
    };
  }

  getProvisioningNotice(): {
    temporaryPassword: string | null;
    mustChangePassword: boolean;
  } {
    this.ensureInitialized();
    const record = this.readRecord();
    return {
      temporaryPassword: record.temporaryPassword,
      mustChangePassword: record.mustChangePassword
    };
  }

  authorize(request: SetupWizardAccessRequest): SetupWizardAccessResult {
    this.ensureInitialized();

    const password = request.password.trim();
    const nextPassword = request.nextPassword?.trim() ?? "";
    const record = this.readRecord();

    if (!password || !verifyPassword(password, record)) {
      return this.failure("invalid-password");
    }

    if (!record.mustChangePassword) {
      this.migrateLegacyRecord(password, record);
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
      temporaryPassword: null,
      randomBytesProvider: this.randomBytesProvider
    }));

    return { ok: true };
  }

  private readRecord(): PersistedSetupWizardAccessRecord {
    const parsed = JSON.parse(readFileSync(this.accessFilePath, "utf8")) as PersistedSetupWizardAccessRecord;

    if (
      parsed.schemaVersion !== LEGACY_SETUP_WIZARD_ACCESS_SCHEMA_VERSION &&
      parsed.schemaVersion !== SETUP_WIZARD_ACCESS_SCHEMA_VERSION
    ) {
      throw new Error("Unsupported setup wizard access record schema.");
    }

    return parsed;
  }

  private migrateLegacyRecord(password: string, record: PersistedSetupWizardAccessRecord): void {
    if (record.schemaVersion !== LEGACY_SETUP_WIZARD_ACCESS_SCHEMA_VERSION) {
      return;
    }

    this.writeRecord(createPasswordRecord(password, {
      mustChangePassword: record.mustChangePassword,
      temporaryPassword: record.temporaryPassword,
      randomBytesProvider: this.randomBytesProvider
    }));
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
