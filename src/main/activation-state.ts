import type { PersistedActivationState } from "./activation-storage.js";

export const DEFAULT_ACTIVATION_CLOCK_ROLLBACK_TOLERANCE_MS = 5 * 60 * 1000;

export type ActivationStateFailureCode =
  | "clock-rollback"
  | "expired"
  | "invalid-state";

export type ActivationStateEvaluationResult =
  | {
      ok: true;
      effectiveUtc: string;
      updatedState: PersistedActivationState;
      shouldPersist: boolean;
    }
  | {
      ok: false;
      code: ActivationStateFailureCode;
      message: string;
      effectiveUtc: string | null;
      updatedState: PersistedActivationState;
      shouldPersist: boolean;
    };

export interface EvaluatePersistedActivationStateOptions {
  state: PersistedActivationState;
  now?: Date;
  clockRollbackToleranceMs?: number;
}

export function evaluatePersistedActivationState(
  options: EvaluatePersistedActivationStateOptions
): ActivationStateEvaluationResult {
  const currentNow = options.now ?? new Date();
  if (Number.isNaN(currentNow.getTime())) {
    return invalidStateResult(options.state, "Activation validation time is invalid.");
  }

  const rollbackToleranceMs = options.clockRollbackToleranceMs ?? DEFAULT_ACTIVATION_CLOCK_ROLLBACK_TOLERANCE_MS;
  const persistedTrustedTime = parseUtcTimestamp(options.state.lastTrustedUtc);
  const persistedValidatedTime = parseUtcTimestamp(options.state.lastValidatedAt);

  if (!persistedTrustedTime || !persistedValidatedTime) {
    return invalidStateResult(options.state, "Persisted activation timestamps are invalid.");
  }

  const rollbackDeltaMs = persistedTrustedTime.getTime() - currentNow.getTime();
  if (rollbackDeltaMs > rollbackToleranceMs) {
    return {
      ok: false,
      code: "clock-rollback",
      message: "Local clock rollback exceeds the offline activation tolerance.",
      effectiveUtc: null,
      updatedState: options.state,
      shouldPersist: false
    };
  }

  const effectiveTime = currentNow.getTime() > persistedTrustedTime.getTime()
    ? currentNow
    : persistedTrustedTime;
  const updatedState: PersistedActivationState = {
    ...options.state,
    claims: {
      ...options.state.claims
    },
    lastValidatedAt: currentNow.toISOString(),
    lastTrustedUtc: effectiveTime.toISOString()
  };

  if (!parseUtcTimestamp(options.state.activatedAt) || !parseUtcTimestamp(options.state.claims.issuedAt)) {
    return invalidStateResult(updatedState, "Persisted activation timestamps are invalid.");
  }

  const expiresAt = options.state.claims.expiresAt === null
    ? null
    : parseUtcTimestamp(options.state.claims.expiresAt);
  if (options.state.claims.plan !== "lifetime" && !expiresAt) {
    return invalidStateResult(updatedState, "Persisted activation expiry timestamp is invalid.");
  }

  if (expiresAt && effectiveTime.getTime() > expiresAt.getTime()) {
    return {
      ok: false,
      code: "expired",
      message: "Persisted activation is expired.",
      effectiveUtc: effectiveTime.toISOString(),
      updatedState,
      shouldPersist: hasStateChanged(options.state, updatedState)
    };
  }

  return {
    ok: true,
    effectiveUtc: effectiveTime.toISOString(),
    updatedState,
    shouldPersist: hasStateChanged(options.state, updatedState)
  };
}

function hasStateChanged(previous: PersistedActivationState, next: PersistedActivationState): boolean {
  return previous.lastValidatedAt !== next.lastValidatedAt || previous.lastTrustedUtc !== next.lastTrustedUtc;
}

function invalidStateResult(
  state: PersistedActivationState,
  message: string
): ActivationStateEvaluationResult {
  return {
    ok: false,
    code: "invalid-state",
    message,
    effectiveUtc: null,
    updatedState: state,
    shouldPersist: false
  };
}

function parseUtcTimestamp(value: string): Date | null {
  if (!value.endsWith("Z")) {
    return null;
  }

  const parsedTime = Date.parse(value);
  if (Number.isNaN(parsedTime)) {
    return null;
  }

  return new Date(parsedTime);
}
