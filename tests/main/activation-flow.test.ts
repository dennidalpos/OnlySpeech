import { beforeEach, describe, expect, it, vi } from "vitest";

const activationFlowMocks = vi.hoisted(() => {
  const validateActivationCode = vi.fn();
  const createPersistedActivationState = vi.fn();
  const evaluatePersistedActivationState = vi.fn();

  const reset = () => {
    validateActivationCode.mockReset();
    createPersistedActivationState.mockReset();
    evaluatePersistedActivationState.mockReset();
  };

  return {
    validateActivationCode,
    createPersistedActivationState,
    evaluatePersistedActivationState,
    reset
  };
});

vi.mock("../../src/main/activation-validator.js", () => ({
  validateActivationCode: activationFlowMocks.validateActivationCode
}));

vi.mock("../../src/main/activation-storage.js", () => ({
  createPersistedActivationState: activationFlowMocks.createPersistedActivationState
}));

vi.mock("../../src/main/activation-state.js", () => ({
  evaluatePersistedActivationState: activationFlowMocks.evaluatePersistedActivationState
}));

import {
  createActivationGateState,
  getSetupWizardLicenseFailureMessage,
  inspectPersistedActivationForRuntime,
  prepareActivationSubmission
} from "../../src/main/activation-flow.js";

describe("activation-flow", () => {
  beforeEach(() => {
    activationFlowMocks.reset();
  });

  it("prepares activation submissions through the canonical validation and persisted-state evaluation path", () => {
    const now = new Date("2026-04-08T08:00:00.000Z");
    const initialState = {
      schemaVersion: 1 as const,
      activationToken: "OS1.payload.signature",
      claims: {
        keyId: "ks1",
        email: "buyer@example.com",
        plan: "annual" as const,
        issuedAt: "2026-04-07T10:30:00.000Z",
        expiresAt: "2027-04-07T10:30:00.000Z"
      },
      activatedAt: "2026-04-08T08:00:00.000Z",
      lastValidatedAt: "2026-04-08T08:00:00.000Z",
      lastTrustedUtc: "2026-04-08T08:00:00.000Z"
    };
    const evaluatedState = {
      ...initialState,
      lastValidatedAt: "2026-04-08T08:05:00.000Z",
      lastTrustedUtc: "2026-04-08T08:05:00.000Z"
    };

    activationFlowMocks.validateActivationCode.mockReturnValue({
      ok: true,
      canonicalEmail: "buyer@example.com",
      claims: initialState.claims
    });
    activationFlowMocks.createPersistedActivationState.mockReturnValue(initialState);
    activationFlowMocks.evaluatePersistedActivationState.mockReturnValue({
      ok: true,
      effectiveUtc: "2026-04-08T08:05:00.000Z",
      updatedState: evaluatedState,
      shouldPersist: true
    });

    const result = prepareActivationSubmission({
      email: "Buyer@Example.com",
      activationToken: "  OS1.payload.signature  ",
      now
    });

    expect(activationFlowMocks.validateActivationCode).toHaveBeenCalledWith({
      email: "Buyer@Example.com",
      activationToken: "  OS1.payload.signature  ",
      now
    });
    expect(activationFlowMocks.createPersistedActivationState).toHaveBeenCalledWith({
      activationToken: "OS1.payload.signature",
      claims: initialState.claims,
      activatedAt: now.toISOString()
    });
    expect(activationFlowMocks.evaluatePersistedActivationState).toHaveBeenCalledWith({
      state: initialState,
      now
    });
    expect(result).toEqual({
      ok: true,
      activationState: evaluatedState,
      canonicalEmail: "buyer@example.com",
      claims: initialState.claims
    });
  });

  it("maps persisted activation evaluation failures back to the activation gate contract", () => {
    const initialState = {
      schemaVersion: 1 as const,
      activationToken: "OS1.payload.signature",
      claims: {
        keyId: "ks1",
        email: "buyer@example.com",
        plan: "annual" as const,
        issuedAt: "2026-04-07T10:30:00.000Z",
        expiresAt: "2027-04-07T10:30:00.000Z"
      },
      activatedAt: "2026-04-08T08:00:00.000Z",
      lastValidatedAt: "2026-04-08T08:00:00.000Z",
      lastTrustedUtc: "2026-04-08T08:00:00.000Z"
    };

    activationFlowMocks.validateActivationCode.mockReturnValue({
      ok: true,
      canonicalEmail: "buyer@example.com",
      claims: initialState.claims
    });
    activationFlowMocks.createPersistedActivationState.mockReturnValue(initialState);
    activationFlowMocks.evaluatePersistedActivationState.mockReturnValue({
      ok: false,
      code: "expired",
      message: "Persisted activation is expired.",
      effectiveUtc: "2027-04-08T08:00:00.000Z",
      updatedState: initialState,
      shouldPersist: false
    });

    expect(
      prepareActivationSubmission({
        email: "buyer@example.com",
        activationToken: "OS1.payload.signature"
      })
    ).toEqual({
      ok: false,
      reason: "expired",
      status: "expired-license"
    });
  });

  it("skips signature revalidation for trial-like persisted states and still exposes clock rollback failures", () => {
    const state = {
      schemaVersion: 1 as const,
      activationToken: null,
      claims: {
        keyId: "trial",
        email: "trial@onlyspeech.local",
        plan: "trial" as const,
        issuedAt: "2026-04-07T10:30:00.000Z",
        expiresAt: "2026-04-22T10:30:00.000Z"
      },
      activatedAt: "2026-04-07T10:35:00.000Z",
      lastValidatedAt: "2026-04-09T10:00:00.000Z",
      lastTrustedUtc: "2026-04-09T10:00:00.000Z"
    };

    activationFlowMocks.evaluatePersistedActivationState.mockReturnValue({
      ok: false,
      code: "clock-rollback",
      message: "Local clock rollback exceeds the offline activation tolerance.",
      effectiveUtc: null,
      updatedState: state,
      shouldPersist: false
    });

    expect(
      inspectPersistedActivationForRuntime(state, new Date("2026-04-09T09:50:00.000Z"))
    ).toEqual({
      ok: false,
      reason: "clock-rollback",
      status: "clock-rollback",
      updatedState: state,
      shouldPersist: false
    });
    expect(activationFlowMocks.validateActivationCode).not.toHaveBeenCalled();
  });

  it("keeps bootstrap and setup-wizard failure messaging centralized", () => {
    expect(createActivationGateState("invalid-code")).toEqual({
      status: "invalid-code",
      message: "Activation code is invalid."
    });
    expect(getSetupWizardLicenseFailureMessage("clock-rollback")).toBe(
      "L'orologio locale risulta incoerente rispetto alla licenza salvata."
    );
  });
});
