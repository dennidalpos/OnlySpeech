import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { calculateExpectedExpiryUtc, normalizeActivationEmail, validateActivationCode } from "../../src/main/activation-validator.js";

function issueActivationCode(input: {
  keyId?: string;
  email?: string;
  plan?: "monthly" | "semiannual" | "annual" | "lifetime" | "trial";
  issuedAt?: string;
  expiresAt?: string | null;
}) {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const claims = {
    schemaVersion: 1 as const,
    keyId: input.keyId ?? "test-key",
    email: input.email ?? "buyer@example.com",
    plan: input.plan ?? "annual",
    issuedAt: input.issuedAt ?? "2026-04-07T10:30:00.000Z",
    expiresAt: input.expiresAt === undefined
      ? calculateExpectedExpiryUtc(input.issuedAt ?? "2026-04-07T10:30:00.000Z", input.plan ?? "annual")
      : input.expiresAt
  };
  const payloadBytes = Buffer.from(JSON.stringify(claims), "utf8");
  const signatureBytes = sign(null, payloadBytes, privateKey);

  return {
    claims,
    token: `OS1.${payloadBytes.toString("base64url")}.${signatureBytes.toString("base64url")}`,
    publicKeys: {
      [claims.keyId]: publicKey
    }
  };
}

describe("normalizeActivationEmail", () => {
  it("normalizes and lowercases customer emails deterministically", () => {
    expect(normalizeActivationEmail("  Buyer@Example.com  ")).toBe("buyer@example.com");
  });

  it("rejects malformed email values", () => {
    expect(() => normalizeActivationEmail("not-an-email")).toThrow("Activation email is invalid.");
    expect(() => normalizeActivationEmail("buyer @example.com")).toThrow("Activation email is invalid.");
  });
});

describe("calculateExpectedExpiryUtc", () => {
  it("clamps month-based plans to the last valid UTC day", () => {
    expect(calculateExpectedExpiryUtc("2026-01-31T10:30:00.000Z", "monthly")).toBe("2026-02-28T10:30:00.000Z");
    expect(calculateExpectedExpiryUtc("2026-08-31T10:30:00.000Z", "semiannual")).toBe("2027-02-28T10:30:00.000Z");
  });

  it("returns null for lifetime plans", () => {
    expect(calculateExpectedExpiryUtc("2026-04-07T10:30:00.000Z", "lifetime")).toBeNull();
  });

  it("adds exactly 15 days for trial plans", () => {
    expect(calculateExpectedExpiryUtc("2026-04-07T10:30:00.000Z", "trial")).toBe("2026-04-22T10:30:00.000Z");
    expect(calculateExpectedExpiryUtc("2026-01-31T10:30:00.000Z", "trial")).toBe("2026-02-15T10:30:00.000Z");
  });
});

describe("validateActivationCode", () => {
  it("accepts a correctly signed activation code when the email matches", () => {
    const issued = issueActivationCode({});

    expect(
      validateActivationCode({
        email: "Buyer@Example.com",
        activationToken: issued.token,
        now: new Date("2026-05-01T10:00:00.000Z"),
        publicKeys: issued.publicKeys
      })
    ).toEqual({
      ok: true,
      canonicalEmail: "buyer@example.com",
      claims: issued.claims
    });
  });

  it("rejects malformed or tampered activation codes", () => {
    const issued = issueActivationCode({});

    expect(
      validateActivationCode({
        email: "buyer@example.com",
        activationToken: "invalid-token",
        publicKeys: issued.publicKeys
      })
    ).toEqual({
      ok: false,
      code: "invalid-code",
      message: "Activation code is invalid."
    });

    expect(
      validateActivationCode({
        email: "buyer@example.com",
        activationToken: `${issued.token}tampered`,
        publicKeys: issued.publicKeys
      })
    ).toEqual({
      ok: false,
      code: "invalid-code",
      message: "Activation code is invalid."
    });
  });

  it("rejects codes signed for a different email", () => {
    const issued = issueActivationCode({});

    expect(
      validateActivationCode({
        email: "other@example.com",
        activationToken: issued.token,
        publicKeys: issued.publicKeys
      })
    ).toEqual({
      ok: false,
      code: "email-mismatch",
      message: "Activation code does not match the provided customer email."
    });
  });

  it("rejects expired non-lifetime plans", () => {
    const issued = issueActivationCode({
      plan: "monthly",
      issuedAt: "2026-01-31T10:30:00.000Z"
    });

    expect(
      validateActivationCode({
        email: "buyer@example.com",
        activationToken: issued.token,
        now: new Date("2026-03-01T00:00:00.000Z"),
        publicKeys: issued.publicKeys
      })
    ).toEqual({
      ok: false,
      code: "expired",
      message: "Activation code is expired."
    });
  });

  it("accepts lifetime licenses only when expiresAt is null", () => {
    const lifetimeIssued = issueActivationCode({
      plan: "lifetime",
      expiresAt: null
    });

    expect(
      validateActivationCode({
        email: "buyer@example.com",
        activationToken: lifetimeIssued.token,
        now: new Date("2036-04-07T10:30:00.000Z"),
        publicKeys: lifetimeIssued.publicKeys
      })
    ).toEqual({
      ok: true,
      canonicalEmail: "buyer@example.com",
      claims: lifetimeIssued.claims
    });

    const malformedLifetime = issueActivationCode({
      plan: "lifetime",
      expiresAt: "2027-04-07T10:30:00.000Z"
    });

    expect(
      validateActivationCode({
        email: "buyer@example.com",
        activationToken: malformedLifetime.token,
        publicKeys: malformedLifetime.publicKeys
      })
    ).toEqual({
      ok: false,
      code: "invalid-code",
      message: "Activation code is invalid."
    });
  });

  it("accepts trial plans and validates expiry correctly", () => {
    const trialIssued = issueActivationCode({
      plan: "trial",
      issuedAt: "2026-04-07T10:30:00.000Z"
    });

    expect(
      validateActivationCode({
        email: "buyer@example.com",
        activationToken: trialIssued.token,
        now: new Date("2026-04-20T10:00:00.000Z"),
        publicKeys: trialIssued.publicKeys
      })
    ).toEqual({
      ok: true,
      canonicalEmail: "buyer@example.com",
      claims: trialIssued.claims
    });

    // Trial expired (after 15 days)
    expect(
      validateActivationCode({
        email: "buyer@example.com",
        activationToken: trialIssued.token,
        now: new Date("2026-04-23T10:00:00.000Z"),
        publicKeys: trialIssued.publicKeys
      })
    ).toEqual({
      ok: false,
      code: "expired",
      message: "Activation code is expired."
    });
  });

  it("tolerates whitespace in activation codes", () => {
    const issued = issueActivationCode({});

    // Code with spaces before/after segments
    const codeWithSpaces = `OS1. ${issued.token.split(".")[1]} . ${issued.token.split(".")[2]}`;
    expect(
      validateActivationCode({
        email: "buyer@example.com",
        activationToken: codeWithSpaces,
        now: new Date("2026-05-01T10:00:00.000Z"),
        publicKeys: issued.publicKeys
      })
    ).toEqual({
      ok: true,
      canonicalEmail: "buyer@example.com",
      claims: issued.claims
    });

    // Code with multiple spaces and linebreaks
    const codeWithWhitespace = `OS1 .  ${issued.token.split(".")[1]}  .  ${issued.token.split(".")[2]}  `;
    expect(
      validateActivationCode({
        email: "buyer@example.com",
        activationToken: codeWithWhitespace,
        now: new Date("2026-05-01T10:00:00.000Z"),
        publicKeys: issued.publicKeys
      })
    ).toEqual({
      ok: true,
      canonicalEmail: "buyer@example.com",
      claims: issued.claims
    });

    // Code with lowercase OS1 prefix
    const codeWithLowercasePrefix = `os1.${issued.token.split(".")[1]}.${issued.token.split(".")[2]}`;
    expect(
      validateActivationCode({
        email: "buyer@example.com",
        activationToken: codeWithLowercasePrefix,
        now: new Date("2026-05-01T10:00:00.000Z"),
        publicKeys: issued.publicKeys
      })
    ).toEqual({
      ok: true,
      canonicalEmail: "buyer@example.com",
      claims: issued.claims
    });
  });
});
