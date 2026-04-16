import type { ActivationGateState } from "../shared/types.js";
import {
  evaluatePersistedActivationState,
  type ActivationStateFailureCode
} from "./activation-state.js";
import {
  createPersistedActivationState,
  type PersistedActivationState
} from "./activation-storage.js";
import {
  validateActivationCode,
  type ActivationValidationFailureCode,
  type SignedActivationClaims
} from "./activation-validator.js";

export type ActivationFailureReason =
  | ActivationStateFailureCode
  | ActivationValidationFailureCode;

export type ActivationSubmissionPreparationResult =
  | {
      ok: true;
      activationState: PersistedActivationState;
      canonicalEmail: string;
      claims: SignedActivationClaims;
    }
  | {
      ok: false;
      reason: ActivationFailureReason;
      status: ActivationGateState["status"];
    };

export type PersistedActivationInspectionResult =
  | {
      ok: true;
      updatedState: PersistedActivationState;
      shouldPersist: boolean;
    }
  | {
      ok: false;
      reason: ActivationFailureReason;
      status: ActivationGateState["status"];
      updatedState: PersistedActivationState;
      shouldPersist: boolean;
    };

export interface PrepareActivationSubmissionOptions {
  email: string;
  activationToken: string;
  activatedAt?: string;
  now?: Date;
}

export function createActivationGateState(
  status: ActivationGateState["status"]
): ActivationGateState {
  switch (status) {
    case "required":
      return {
        status,
        message: "Activation is required before startup can continue."
      };
    case "invalid-code":
      return {
        status,
        message: "Activation code is invalid."
      };
    case "email-mismatch":
      return {
        status,
        message: "Activation code does not match the provided customer email."
      };
    case "expired-license":
      return {
        status,
        message: "The stored activation is expired."
      };
    case "clock-rollback":
      return {
        status,
        message: "Local clock rollback exceeds the offline activation tolerance."
      };
    case "invalid-state":
      return {
        status,
        message: "Stored activation data could not be read."
      };
    case "trial-exhausted":
      return {
        status,
        message: "The trial has already been used on this device. Purchase a license to continue."
      };
  }
}

export function mapActivationFailureReasonToStatus(
  reason: ActivationFailureReason
): ActivationGateState["status"] {
  switch (reason) {
    case "invalid-email":
      return "invalid-state";
    case "invalid-code":
      return "invalid-code";
    case "email-mismatch":
      return "email-mismatch";
    case "expired":
      return "expired-license";
    case "clock-rollback":
      return "clock-rollback";
    case "invalid-state":
      return "invalid-state";
  }
}

export function getSetupWizardLicenseFailureMessage(
  reason: ActivationFailureReason
): string {
  switch (reason) {
    case "invalid-email":
      return "Email non valida.";
    case "invalid-code":
      return "Codice di attivazione non valido o firma non riconosciuta.";
    case "email-mismatch":
      return "Il codice non corrisponde all'email inserita.";
    case "expired":
      return "Il codice di attivazione è scaduto.";
    case "clock-rollback":
      return "L'orologio locale risulta incoerente rispetto alla licenza salvata.";
    case "invalid-state":
      return "Lo stato licenza salvato non è valido.";
  }
}

export function inspectPersistedActivationForRuntime(
  state: PersistedActivationState,
  now?: Date
): PersistedActivationInspectionResult {
  if (state.activationToken !== null) {
    const revalidation = validateActivationCode({
      email: state.claims.email,
      activationToken: state.activationToken,
      now
    });

    if (!revalidation.ok) {
      return createActivationFailureResult(revalidation.code, state, false);
    }
  }

  const evaluation = evaluatePersistedActivationState({
    state,
    now
  });

  if (!evaluation.ok) {
    return createActivationFailureResult(
      evaluation.code,
      evaluation.updatedState,
      evaluation.shouldPersist
    );
  }

  return {
    ok: true,
    updatedState: evaluation.updatedState,
    shouldPersist: evaluation.shouldPersist
  };
}

export function prepareActivationSubmission(
  options: PrepareActivationSubmissionOptions
): ActivationSubmissionPreparationResult {
  const validation = validateActivationCode({
    email: options.email,
    activationToken: options.activationToken,
    now: options.now
  });

  if (!validation.ok) {
    return {
      ok: false,
      reason: validation.code,
      status: mapActivationFailureReasonToStatus(validation.code)
    };
  }

  const activatedAt = options.activatedAt ?? (options.now ?? new Date()).toISOString();
  const persistedActivationState = createPersistedActivationState({
    activationToken: options.activationToken.trim(),
    claims: validation.claims,
    activatedAt
  });
  const inspection = inspectPersistedActivationForRuntime(
    persistedActivationState,
    options.now
  );

  if (!inspection.ok) {
    return {
      ok: false,
      reason: inspection.reason,
      status: inspection.status
    };
  }

  return {
    ok: true,
    activationState: inspection.updatedState,
    canonicalEmail: validation.canonicalEmail,
    claims: validation.claims
  };
}

function createActivationFailureResult(
  reason: ActivationFailureReason,
  updatedState: PersistedActivationState,
  shouldPersist: boolean
): Extract<PersistedActivationInspectionResult, { ok: false }> {
  return {
    ok: false,
    reason,
    status: mapActivationFailureReasonToStatus(reason),
    updatedState,
    shouldPersist
  };
}
