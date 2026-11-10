import type { ActivationGateState } from "../../shared/types.js";
import {
  ACTIVATION_COPY,
  getActivationStatusDescriptor,
  type ActivationStatusTone,
  type ActivationUiLanguage
} from "./activation-copy.js";

export function createFallbackActivationState(language: ActivationUiLanguage): ActivationGateState {
  return {
    status: "invalid-state",
    message: ACTIVATION_COPY[language].technicalFallback
  };
}

export function createRequiredActivationState(language: ActivationUiLanguage): ActivationGateState {
  return {
    status: "required",
    message: ACTIVATION_COPY[language].statusMeta.required.summary
  };
}

export function createAcceptedActivationState(language: ActivationUiLanguage): ActivationGateState {
  return {
    status: "required",
    message: ACTIVATION_COPY[language].statusMeta.success.summary
  };
}

export function createActivationStatusTitle(
  tone: ActivationStatusTone,
  language: ActivationUiLanguage
): string {
  return getActivationStatusDescriptor(tone, language).title;
}

export function createActivationStatusSuggestion(
  tone: ActivationStatusTone,
  language: ActivationUiLanguage
): string | null {
  return getActivationStatusDescriptor(tone, language).suggestion ?? null;
}

export function canCopyActivationStatus(status: ActivationGateState): boolean {
  return status.message.trim().length > 0;
}
