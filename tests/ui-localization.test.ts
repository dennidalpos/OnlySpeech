import { describe, expect, it } from "vitest";
import {
  getTechnicalIssueCopy,
  getUiText,
  localizeTechnicalIssue,
  resolveUiLanguageForSide
} from "../src/shared/ui-localization.js";
import type { SideState, TechnicalIssue } from "../src/shared/types.js";

function createSideState(overrides: Partial<SideState> = {}): SideState {
  return {
    side: "A",
    selectedInteractionLanguage: "en",
    normalizedTargetLanguage: "en",
    sourceLanguage: null,
    requestedUiLanguage: "en",
    effectiveUiLanguage: "en",
    usesEnglishUiFallback: false,
    selectedTargetLanguage: "en",
    localTranscript: "",
    remoteTranslation: "",
    status: "ready",
    error: null,
    isActiveSpeaker: false,
    ...overrides
  };
}

describe("ui-localization", () => {
  it("uses italian UI when the selected interaction language is italian", () => {
    expect(
      resolveUiLanguageForSide(
        createSideState({
          selectedInteractionLanguage: "it",
          normalizedTargetLanguage: "it",
          selectedTargetLanguage: "it",
          requestedUiLanguage: "it",
          effectiveUiLanguage: "it",
          usesEnglishUiFallback: false,
          sourceLanguage: "it-IT"
        })
      )
    ).toBe("it");
  });

  it("uses english UI when no italian signal is present", () => {
    expect(
      resolveUiLanguageForSide(
        createSideState({
          selectedInteractionLanguage: "en",
          normalizedTargetLanguage: "en",
          selectedTargetLanguage: "en",
          requestedUiLanguage: "en",
          effectiveUiLanguage: "en",
          usesEnglishUiFallback: false,
          sourceLanguage: "fr-FR"
        })
      )
    ).toBe("en");
  });

  it("keeps the user-selected interaction language ahead of the source locale", () => {
    expect(
      resolveUiLanguageForSide(
        createSideState({
          selectedInteractionLanguage: "en",
          normalizedTargetLanguage: "en",
          selectedTargetLanguage: "en",
          requestedUiLanguage: "en",
          effectiveUiLanguage: "en",
          usesEnglishUiFallback: false,
          sourceLanguage: "it-IT"
        })
      )
    ).toBe("en");
  });

  it("uses explicit english fallback metadata when visitor UI coverage is missing", () => {
    expect(
      resolveUiLanguageForSide(
        createSideState({
          selectedInteractionLanguage: "sq",
          normalizedTargetLanguage: "sq",
          selectedTargetLanguage: "sq",
          requestedUiLanguage: "sq",
          effectiveUiLanguage: "en",
          usesEnglishUiFallback: true
        })
      )
    ).toBe("en");
  });

  it("supports dedicated operator copy for the shared French runtime UI", () => {
    expect(
      resolveUiLanguageForSide(
        createSideState({
          selectedInteractionLanguage: "fr",
          normalizedTargetLanguage: "fr",
          selectedTargetLanguage: "fr",
          requestedUiLanguage: "fr",
          effectiveUiLanguage: "fr",
          usesEnglishUiFallback: false,
          sourceLanguage: "fr-FR"
        })
      )
    ).toBe("fr");
    expect(getUiText("fr").openSetup).toBe("Ouvrir la configuration");
  });

  it("localizes technical issues in english by issue code", () => {
    const issue: TechnicalIssue = {
      code: "missing-monitor",
      message: "Sono necessari due monitor attivi per avviare la sessione.",
      retryable: true
    };

    expect(localizeTechnicalIssue(issue, "en").message).toBe(
      "Two active monitors are required to start the session."
    );
    expect(getUiText("en").pttReady).toBe("Press and speak");
  });

  it("returns operator-facing recovery guidance for microphone permission blocks", () => {
    const issue: TechnicalIssue = {
      code: "microphone-permission-denied",
      message: "Accesso al microfono bloccato per la postazione.",
      retryable: true,
      side: "A",
      details: "NotAllowedError"
    };

    expect(localizeTechnicalIssue(issue, "en").message).toBe("Station A cannot access its microphone.");
    expect(getTechnicalIssueCopy(issue, "en").recovery).toContain("save the assignment again");
    expect(getTechnicalIssueCopy(issue, "en").recovery).not.toContain("repair:microphones");
  });

  it("uses explicit operator and user wording for the chat panels", () => {
    expect(getUiText("it").remoteTranslation).toBe("Traduzione utente");
    expect(getUiText("it").remoteTranslationHint).toBe("La traduzione dell'utente apparira qui.");
    expect(getUiText("en").remoteTranslation).toBe("User translation");
    expect(getUiText("en").localTranscript).toBe("Operator speech");
  });
});
