import { createPublicKey, verify, type KeyObject } from "node:crypto";
import { getActivationPublicKeyObjects } from "./activation-public-keys.js";
import type { ActivationClaims, ActivationPlan } from "./activation-types.js";

export interface SignedActivationClaims extends ActivationClaims {
  schemaVersion: 1;
}

export type ActivationValidationFailureCode =
  | "invalid-email"
  | "invalid-code"
  | "email-mismatch"
  | "expired";

export type ActivationValidationResult =
  | {
      ok: true;
      claims: SignedActivationClaims;
      canonicalEmail: string;
    }
  | {
      ok: false;
      code: ActivationValidationFailureCode;
      message: string;
    };

export interface ValidateActivationCodeOptions {
  email: string;
  activationToken: string;
  now?: Date;
  publicKeys?: Readonly<Record<string, string | KeyObject>>;
}

const ACTIVATION_TOKEN_PREFIX = "OS1";
const ACTIVATION_SCHEMA_VERSION = 1;
const ACTIVATION_PLANS = new Set<ActivationPlan>(["monthly", "semiannual", "annual", "lifetime", "trial"]);

export function normalizeActivationCode(code: string): string {
  // Normalize whitespace: trim and collapse multiple spaces to single space
  const normalized = code.trim().replace(/\s+/g, " ");

  // Verify format: OS1 prefix (case-insensitive) followed by dot
  const osMatch = normalized.match(/^OS1\s*\./i);
  if (!osMatch) {
    throw new Error("Activation code must start with OS1.");
  }

  // Split by dots and verify exactly 3 segments
  const parts = normalized.split(".");
  if (parts.length !== 3) {
    throw new Error("Activation code must have exactly 3 segments separated by '.'");
  }

  // Normalize segments: uppercase prefix, trim others, preserve payload/signature
  const prefix = parts[0].trim().toUpperCase();
  if (prefix !== "OS1") {
    throw new Error("Activation code prefix must be OS1");
  }

  const payload = parts[1].trim();
  const signature = parts[2].trim();

  return `${prefix}.${payload}.${signature}`;
}

export function normalizeActivationEmail(email: string): string {
  const normalizedEmail = email.normalize("NFKC").trim().toLowerCase();

  if (
    normalizedEmail.length === 0 ||
    /\s/.test(normalizedEmail) ||
    // Control characters are explicitly rejected by the activation contract.
    // eslint-disable-next-line no-control-regex
    /[\u0000-\u001F\u007F]/.test(normalizedEmail) ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)
  ) {
    throw new Error("Activation email is invalid.");
  }

  return normalizedEmail;
}

export function validateActivationCode(options: ValidateActivationCodeOptions): ActivationValidationResult {
  let canonicalEmail: string;
  try {
    canonicalEmail = normalizeActivationEmail(options.email);
  } catch {
    return {
      ok: false,
      code: "invalid-email",
      message: "Customer email is invalid."
    };
  }

  let normalizedToken: string;
  try {
    normalizedToken = normalizeActivationCode(options.activationToken);
  } catch {
    return invalidCodeResult();
  }

  const tokenSegments = normalizedToken.split(".");
  if (tokenSegments.length !== 3 || tokenSegments[0] !== ACTIVATION_TOKEN_PREFIX) {
    return invalidCodeResult();
  }

  const payloadBytes = decodeBase64UrlSegment(tokenSegments[1]);
  const signatureBytes = decodeBase64UrlSegment(tokenSegments[2]);
  if (!payloadBytes || !signatureBytes) {
    return invalidCodeResult();
  }

  const untrustedClaims = parseSignedClaims(payloadBytes);
  if (!untrustedClaims) {
    return invalidCodeResult();
  }

  const publicKey = resolvePublicKey(untrustedClaims.keyId, options.publicKeys);
  if (!publicKey) {
    return invalidCodeResult();
  }

  if (!verify(null, payloadBytes, publicKey, signatureBytes)) {
    return invalidCodeResult();
  }

  const claims = validateSignedClaims(untrustedClaims);
  if (!claims) {
    return invalidCodeResult();
  }

  if (claims.email !== canonicalEmail) {
    return {
      ok: false,
      code: "email-mismatch",
      message: "Activation code does not match the provided customer email."
    };
  }

  const now = options.now ?? new Date();
  const issuedAtTime = Date.parse(claims.issuedAt);
  if (issuedAtTime > now.getTime()) {
    return invalidCodeResult();
  }

  if (claims.expiresAt !== null && Date.parse(claims.expiresAt) < now.getTime()) {
    return {
      ok: false,
      code: "expired",
      message: "Activation code is expired."
    };
  }

  return {
    ok: true,
    claims,
    canonicalEmail
  };
}

export function calculateExpectedExpiryUtc(issuedAt: string, plan: ActivationPlan): string | null {
  if (plan === "lifetime") {
    return null;
  }

  const issuedAtDate = parseUtcTimestamp(issuedAt);
  if (!issuedAtDate) {
    throw new Error("Activation issuedAt timestamp is invalid.");
  }

  // Trial: add 15 days (simple arithmetic)
  if (plan === "trial") {
    const expiryDate = new Date(issuedAtDate);
    expiryDate.setUTCDate(expiryDate.getUTCDate() + 15);
    return expiryDate.toISOString();
  }

  // Monthly/Semiannual/Annual: add months, respecting month boundaries
  const monthOffset = plan === "monthly"
    ? 1
    : plan === "semiannual"
      ? 6
      : 12;

  const issuedYear = issuedAtDate.getUTCFullYear();
  const issuedMonth = issuedAtDate.getUTCMonth();
  const issuedDay = issuedAtDate.getUTCDate();
  const targetMonthIndex = issuedMonth + monthOffset;
  const targetYear = issuedYear + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const targetMonthLastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(issuedDay, targetMonthLastDay);

  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      targetDay,
      issuedAtDate.getUTCHours(),
      issuedAtDate.getUTCMinutes(),
      issuedAtDate.getUTCSeconds(),
      issuedAtDate.getUTCMilliseconds()
    )
  ).toISOString();
}

function invalidCodeResult(): ActivationValidationResult {
  return {
    ok: false,
    code: "invalid-code",
    message: "Activation code is invalid."
  };
}

function decodeBase64UrlSegment(segment: string): Buffer | null {
  try {
    const decoded = Buffer.from(segment, "base64url");
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

function parseSignedClaims(payloadBytes: Buffer): SignedActivationClaims | null {
  try {
    return JSON.parse(payloadBytes.toString("utf8")) as SignedActivationClaims;
  } catch {
    return null;
  }
}

function resolvePublicKey(
  keyId: string,
  publicKeys: Readonly<Record<string, string | KeyObject>> | undefined
): KeyObject | null {
  const keyMap = publicKeys ?? getActivationPublicKeyObjects();
  const keyValue = keyMap[keyId];
  if (!keyValue) {
    return null;
  }

  return typeof keyValue === "string" ? createPublicKey(keyValue) : keyValue;
}

function validateSignedClaims(claims: SignedActivationClaims): SignedActivationClaims | null {
  if (!isObjectRecord(claims) || claims.schemaVersion !== ACTIVATION_SCHEMA_VERSION) {
    return null;
  }

  if (typeof claims.keyId !== "string" || claims.keyId.trim().length === 0) {
    return null;
  }

  let normalizedPayloadEmail: string;
  try {
    normalizedPayloadEmail = normalizeActivationEmail(claims.email);
  } catch {
    return null;
  }

  if (claims.email !== normalizedPayloadEmail) {
    return null;
  }

  if (!ACTIVATION_PLANS.has(claims.plan)) {
    return null;
  }

  if (!parseUtcTimestamp(claims.issuedAt)) {
    return null;
  }

  const expectedExpiry = calculateExpectedExpiryUtc(claims.issuedAt, claims.plan);
  if (claims.plan === "lifetime") {
    if (claims.expiresAt !== null) {
      return null;
    }
  } else if (!claims.expiresAt || !parseUtcTimestamp(claims.expiresAt) || claims.expiresAt !== expectedExpiry) {
    return null;
  }

  return {
    schemaVersion: ACTIVATION_SCHEMA_VERSION,
    keyId: claims.keyId,
    email: normalizedPayloadEmail,
    plan: claims.plan,
    issuedAt: claims.issuedAt,
    expiresAt: expectedExpiry
  };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseUtcTimestamp(value: unknown): Date | null {
  if (typeof value !== "string" || value.length === 0 || !value.endsWith("Z")) {
    return null;
  }

  const parsedTime = Date.parse(value);
  if (Number.isNaN(parsedTime)) {
    return null;
  }

  return new Date(parsedTime);
}
