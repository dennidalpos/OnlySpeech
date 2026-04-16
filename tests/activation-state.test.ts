import { describe, expect, it } from "vitest";
import { createPersistedActivationState } from "../src/main/activation-storage.js";
import {
  DEFAULT_ACTIVATION_CLOCK_ROLLBACK_TOLERANCE_MS,
  evaluatePersistedActivationState
} from "../src/main/activation-state.js";

describe("evaluatePersistedActivationState", () => {
  it("advances the trusted UTC marker when the local clock moves forward", () => {
    const state = createPersistedActivationState({
      activationToken: "OS1.payload.signature",
      claims: {
        keyId: "ks1",
        email: "buyer@example.com",
        plan: "annual",
        issuedAt: "2026-04-07T10:30:00.000Z",
        expiresAt: "2027-04-07T10:30:00.000Z"
      },
      activatedAt: "2026-04-07T10:35:00.000Z",
      lastValidatedAt: "2026-04-07T10:35:00.000Z",
      lastTrustedUtc: "2026-04-07T10:35:00.000Z"
    });

    expect(
      evaluatePersistedActivationState({
        state,
        now: new Date("2026-04-08T07:00:00.000Z")
      })
    ).toEqual({
      ok: true,
      effectiveUtc: "2026-04-08T07:00:00.000Z",
      shouldPersist: true,
      updatedState: {
        ...state,
        lastValidatedAt: "2026-04-08T07:00:00.000Z",
        lastTrustedUtc: "2026-04-08T07:00:00.000Z"
      }
    });
  });

  it("keeps the higher trusted UTC marker when the clock drifts backward within tolerance", () => {
    const state = createPersistedActivationState({
      activationToken: "OS1.payload.signature",
      claims: {
        keyId: "ks1",
        email: "buyer@example.com",
        plan: "annual",
        issuedAt: "2026-04-07T10:30:00.000Z",
        expiresAt: "2027-04-07T10:30:00.000Z"
      },
      activatedAt: "2026-04-07T10:35:00.000Z",
      lastValidatedAt: "2026-04-08T07:00:00.000Z",
      lastTrustedUtc: "2026-04-08T07:00:00.000Z"
    });

    expect(
      evaluatePersistedActivationState({
        state,
        now: new Date("2026-04-08T06:56:00.000Z")
      })
    ).toEqual({
      ok: true,
      effectiveUtc: "2026-04-08T07:00:00.000Z",
      shouldPersist: true,
      updatedState: {
        ...state,
        lastValidatedAt: "2026-04-08T06:56:00.000Z",
        lastTrustedUtc: "2026-04-08T07:00:00.000Z"
      }
    });
  });

  it("rejects significant local clock rollback beyond the offline tolerance", () => {
    const state = createPersistedActivationState({
      activationToken: "OS1.payload.signature",
      claims: {
        keyId: "ks1",
        email: "buyer@example.com",
        plan: "annual",
        issuedAt: "2026-04-07T10:30:00.000Z",
        expiresAt: "2027-04-07T10:30:00.000Z"
      },
      activatedAt: "2026-04-07T10:35:00.000Z",
      lastValidatedAt: "2026-04-08T07:00:00.000Z",
      lastTrustedUtc: "2026-04-08T07:00:00.000Z"
    });

    expect(
      evaluatePersistedActivationState({
        state,
        now: new Date("2026-04-08T06:54:59.999Z"),
        clockRollbackToleranceMs: DEFAULT_ACTIVATION_CLOCK_ROLLBACK_TOLERANCE_MS
      })
    ).toEqual({
      ok: false,
      code: "clock-rollback",
      message: "Local clock rollback exceeds the offline activation tolerance.",
      effectiveUtc: null,
      updatedState: state,
      shouldPersist: false
    });
  });

  it("keeps expired licenses expired even if the current clock is set back slightly", () => {
    const state = createPersistedActivationState({
      activationToken: "OS1.payload.signature",
      claims: {
        keyId: "ks1",
        email: "buyer@example.com",
        plan: "monthly",
        issuedAt: "2026-01-31T10:30:00.000Z",
        expiresAt: "2026-02-28T10:30:00.000Z"
      },
      activatedAt: "2026-01-31T10:35:00.000Z",
      lastValidatedAt: "2026-03-01T08:00:00.000Z",
      lastTrustedUtc: "2026-03-01T08:00:00.000Z"
    });

    expect(
      evaluatePersistedActivationState({
        state,
        now: new Date("2026-03-01T07:56:00.000Z")
      })
    ).toEqual({
      ok: false,
      code: "expired",
      message: "Persisted activation is expired.",
      effectiveUtc: "2026-03-01T08:00:00.000Z",
      shouldPersist: true,
      updatedState: {
        ...state,
        lastValidatedAt: "2026-03-01T07:56:00.000Z",
        lastTrustedUtc: "2026-03-01T08:00:00.000Z"
      }
    });
  });

  it("treats lifetime licenses as non-expiring while still enforcing rollback protection", () => {
    const state = createPersistedActivationState({
      activationToken: "OS1.payload.signature",
      claims: {
        keyId: "ks1",
        email: "buyer@example.com",
        plan: "lifetime",
        issuedAt: "2026-04-07T10:30:00.000Z",
        expiresAt: null
      },
      activatedAt: "2026-04-07T10:35:00.000Z",
      lastValidatedAt: "2036-04-07T10:30:00.000Z",
      lastTrustedUtc: "2036-04-07T10:30:00.000Z"
    });

    expect(
      evaluatePersistedActivationState({
        state,
        now: new Date("2036-04-07T10:28:00.000Z")
      })
    ).toEqual({
      ok: true,
      effectiveUtc: "2036-04-07T10:30:00.000Z",
      shouldPersist: true,
      updatedState: {
        ...state,
        lastValidatedAt: "2036-04-07T10:28:00.000Z",
        lastTrustedUtc: "2036-04-07T10:30:00.000Z"
      }
    });
  });

  it("accepts trial activation within 15-day window", () => {
    const now = new Date("2026-04-07T10:00:00.000Z");
    const expiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    const state = createPersistedActivationState({
      activationToken: null, // Trial has no token
      claims: {
        keyId: "trial",
        email: "trial@onlyspeech.local",
        plan: "trial",
        issuedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString()
      },
      activatedAt: now.toISOString()
    });

    // Within trial period (10 days later)
    expect(
      evaluatePersistedActivationState({
        state,
        now: new Date("2026-04-17T10:00:00.000Z")
      }).ok
    ).toBe(true);
  });

  it("rejects expired trial activation", () => {
    const now = new Date("2026-04-07T10:00:00.000Z");
    const expiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    const state = createPersistedActivationState({
      activationToken: null, // Trial has no token
      claims: {
        keyId: "trial",
        email: "trial@onlyspeech.local",
        plan: "trial",
        issuedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString()
      },
      activatedAt: now.toISOString()
    });

    // After trial period (16 days later)
    expect(
      evaluatePersistedActivationState({
        state,
        now: new Date("2026-04-23T10:00:00.000Z")
      })
    ).toEqual({
      ok: false,
      code: "expired",
      message: "Persisted activation is expired.",
      effectiveUtc: "2026-04-23T10:00:00.000Z",
      shouldPersist: true,
      updatedState: {
        ...state,
        lastValidatedAt: "2026-04-23T10:00:00.000Z",
        lastTrustedUtc: "2026-04-23T10:00:00.000Z"
      }
    });
  });

  it("protects trial from clock rollback within tolerance", () => {
    const now = new Date("2026-04-07T10:00:00.000Z");
    const expiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    const state = createPersistedActivationState({
      activationToken: null,
      claims: {
        keyId: "trial",
        email: "trial@onlyspeech.local",
        plan: "trial",
        issuedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString()
      },
      activatedAt: now.toISOString(),
      lastTrustedUtc: "2026-04-10T10:00:00.000Z"
    });

    // Clock rolls back 3 minutes (within 5-minute tolerance)
    expect(
      evaluatePersistedActivationState({
        state,
        now: new Date("2026-04-10T09:57:00.000Z")
      }).ok
    ).toBe(true);

    // Clock rolls back 10 minutes (exceeds 5-minute tolerance)
    expect(
      evaluatePersistedActivationState({
        state,
        now: new Date("2026-04-10T09:50:00.000Z")
      })
    ).toEqual(
      expect.objectContaining({
        ok: false,
        code: "clock-rollback"
      })
    );
  });
});
