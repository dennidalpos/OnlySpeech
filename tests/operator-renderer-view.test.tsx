import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FlagIcon } from "../src/renderer/operator/components/FlagIcon.js";
import { LanguageHeaderChip } from "../src/renderer/operator/components/LanguageHeaderChip.js";
import { LanguageSelection } from "../src/renderer/operator/components/LanguageSelection.js";
import { TechnicalErrorView } from "../src/renderer/operator/components/TechnicalErrorView.js";
import { VisitorLanguageSelection } from "../src/renderer/operator/components/VisitorLanguageSelection.js";
import {
  resolveOperatorViewMode,
  shouldResetVisitorLanguageCommitment,
  shouldShowRemoteUserLanguage
} from "../src/shared/side-flow.js";
import { buildInteractionLanguageChoices } from "../src/shared/language-flow.js";
import type { AppState } from "../src/shared/types.js";

function createAppState(): AppState {
  return {
    sessionId: "session-1",
    appMode: "kiosk",
    microphonePttMode: "dual-dedicated",
    translationProvider: "chatgpt",
    textToSpeechEnabled: true,
    activeSide: null,
    lastActivityAt: "2026-03-27T12:00:00.000Z",
    clearTriggeredAt: null,
    visitorConversationHistoryEnabled: false,
    conversationHistory: [],
    textToSpeech: {
      side: null,
      content: null,
      requestId: null,
      status: "idle",
      engine: null,
      language: null,
      voiceName: null,
      error: null
    },
    sides: {
      A: {
        side: "A",
        selectedInteractionLanguage: "en",
        normalizedTargetLanguage: "en",
        sourceLanguage: "it-IT",
        hasCommittedLanguageSelection: true,
        requestedUiLanguage: "en",
        effectiveUiLanguage: "en",
        usesEnglishUiFallback: false,
        selectedTargetLanguage: "en",
        localTranscript: "",
        remoteTranslation: "",
        status: "ready",
        error: null,
        isActiveSpeaker: false
      },
      B: {
        side: "B",
        selectedInteractionLanguage: "it",
        normalizedTargetLanguage: "it",
        sourceLanguage: "it-IT",
        hasCommittedLanguageSelection: true,
        requestedUiLanguage: "it",
        effectiveUiLanguage: "it",
        usesEnglishUiFallback: false,
        selectedTargetLanguage: "it",
        localTranscript: "",
        remoteTranslation: "",
        status: "ready",
        error: null,
        isActiveSpeaker: false
      }
    },
    health: {
      displaysReady: true,
      microphonesReady: true,
      speechReady: true,
      translationReady: true,
      blockingIssues: [],
      displayAssignments: [],
      microphoneAssignments: []
    }
  };
}

describe("operator renderer view state", () => {
  it("keeps Station B on the full-screen selector until the visitor commits a language", () => {
    expect(
      resolveOperatorViewMode({
        appState: createAppState(),
        side: "B",
        showLanguageSelector: false,
        visitorLanguageCommitted: false
      })
    ).toBe("visitor-language-selection");
  });

  it("keeps Station A on the selector until the operator confirms the language", () => {
    const appState = createAppState();
    appState.sides.A.hasCommittedLanguageSelection = false;

    expect(
      resolveOperatorViewMode({
        appState,
        side: "A",
        showLanguageSelector: false,
        visitorLanguageCommitted: true
      })
    ).toBe("operator-language-selection");
  });

  it("returns Station B to the full-screen selector when change-language is requested", () => {
    expect(
      resolveOperatorViewMode({
        appState: createAppState(),
        side: "B",
        showLanguageSelector: true,
        visitorLanguageCommitted: true
      })
    ).toBe("visitor-language-selection");
  });

  it("returns Station B to the full-screen selector after an inactivity clear", () => {
    const appState = createAppState();
    appState.clearTriggeredAt = "2026-03-27T12:05:00.000Z";

    expect(
      resolveOperatorViewMode({
        appState,
        side: "B",
        showLanguageSelector: false,
        visitorLanguageCommitted: true
      })
    ).toBe("visitor-language-selection");
  });

  it("keeps Station A accessible when the runtime only reports hardware setup blockers", () => {
    const appState = createAppState();
    appState.health.blockingIssues = [
      {
        code: "missing-monitor",
        message: "Sono necessari due monitor attivi per avviare la sessione.",
        retryable: true
      }
    ];

    expect(
      resolveOperatorViewMode({
        appState,
        side: "A",
        showLanguageSelector: false,
        visitorLanguageCommitted: true
      })
    ).toBe("operator-session");
  });

  it("drops the visitor committed state when Station B loses its selected language", () => {
    expect(shouldResetVisitorLanguageCommitment("B", null)).toBe(true);
    expect(shouldResetVisitorLanguageCommitment("B", "it")).toBe(false);
    expect(shouldResetVisitorLanguageCommitment("A", null)).toBe(false);
  });

  it("shows the remote user language line only on Station A when Station B has already chosen a language", () => {
    expect(shouldShowRemoteUserLanguage("A", "ar")).toBe(true);
    expect(shouldShowRemoteUserLanguage("A", null)).toBe(false);
    expect(shouldShowRemoteUserLanguage("B", "ar")).toBe(false);
  });

  it("renders the visitor language grid with local SVG flags and highlights the selected language", () => {
    const europeanChoices = buildInteractionLanguageChoices().filter((choice) => choice.macroAreas.includes("europe"));
    const html = renderToStaticMarkup(
      <VisitorLanguageSelection
        languageCode="sq"
        title="Zgjidhni gjuhën tuaj"
        description="Prekni gjuhën që dëshironi të lexoni dhe të përdorni në këtë ekran."
        selectedLanguage="sq"
        choices={buildInteractionLanguageChoices()}
        onSelect={() => undefined}
      />
    );

    expect(html).toContain("visitor-language-grid");
    expect(html).toContain("world-map-artwork");
    expect(html).toContain("world-map-hotspot active");
    expect(html).toContain("visitor-language-tile selected");
    expect(html).toContain('class="visitor-language-tile selected" type="button" aria-pressed="true"');
    expect(html).toContain('aria-label="Flag AL"');
    expect(html).toContain("Europe");
    expect(html).toContain("shqip");
    expect(html).not.toContain("español");
    expect(html).not.toContain('aria-label="Flag BR"');
    expect(html.match(/visitor-language-tile/g)?.length).toBe(europeanChoices.length);
  });

  it("renders a stable fallback flag icon when no region is available", () => {
    const html = renderToStaticMarkup(<FlagIcon id="fallback" regionCode={null} />);

    expect(html).toContain('aria-label="Flag"');
    expect(html).toContain("flag-clip-fallback");
  });

  it("renders dedicated flags for every region used by the curated language catalog", () => {
    for (const regionCode of ["AU", "MX", "ZA", "ET", "KE", "BY", "NZ"]) {
      const html = renderToStaticMarkup(<FlagIcon id={regionCode.toLowerCase()} regionCode={regionCode} />);
      expect(html).toContain(`aria-label="Flag ${regionCode}"`);
      expect(html).not.toContain("M30 8v24M18 20h24");
    }
  });

  it("covers every region currently used by the interaction-language catalog without falling back", () => {
    const regions = [
      ...new Set(buildInteractionLanguageChoices().map((choice) => choice.regionCode).filter((value): value is string => Boolean(value)))
    ];

    for (const regionCode of regions) {
      const html = renderToStaticMarkup(<FlagIcon id={regionCode.toLowerCase()} regionCode={regionCode} />);
      expect(html).toContain(`aria-label="Flag ${regionCode}"`);
      expect(html).not.toContain("M30 8v24M18 20h24");
    }
  });

  it("covers every region used by the expanded chatgpt language catalog without fallback flags", () => {
    const regions = [
      ...new Set(
        buildInteractionLanguageChoices("chatgpt", { includeProviderExpansions: true })
          .map((choice) => choice.regionCode)
          .filter(Boolean)
      )
    ];

    for (const regionCode of regions.filter((value): value is string => Boolean(value))) {
      const html = renderToStaticMarkup(<FlagIcon id={regionCode.toLowerCase()} regionCode={regionCode} />);
      expect(html).toContain(`aria-label="Flag ${regionCode}"`);
      expect(html).not.toContain("M30 8v24M18 20h24");
    }
  });

  it("renders the operator language selection with the same flag grid and curated languages", () => {
    const choices = buildInteractionLanguageChoices();
    const europeChoices = choices.filter((choice) => choice.macroAreas.includes("europe"));
    const html = renderToStaticMarkup(
      <LanguageSelection
        language="it"
        title="Seleziona lingua"
        description="Test"
        selectedLanguage={null}
        initialMacroAreaLanguage="fr"
        appearance="tiles"
        confirmSelection={false}
        preselectLanguage={false}
        choices={buildInteractionLanguageChoices()}
        onSelect={() => undefined}
      />
    );

    expect(html).toContain("visitor-language-grid");
    expect(html).toContain("world-map-artwork");
    expect(html).toContain("world-map-hotspot active");
    expect(html).not.toContain("visitor-language-tile selected");
    expect(html).not.toContain('class="visitor-language-tile selected" type="button" aria-pressed="true"');
    expect(html).toContain("Africa");
    expect(html).toContain("Europa");
    expect(html).not.toContain("español");
    expect(html).not.toContain('aria-label="Flag BR"');
    expect(html.match(/visitor-language-tile/g)?.length).toBe(europeChoices.length);
    expect(html).toContain("italiano");
    expect(html).toContain("français");
  });

  it("keeps the world map artwork decorative while macro-area selection stays on overlay hotspots", () => {
    const html = renderToStaticMarkup(
      <LanguageSelection
        language="en"
        title="Select language"
        description="Test"
        selectedLanguage={null}
        initialMacroAreaLanguage="en"
        appearance="tiles"
        confirmSelection={false}
        preselectLanguage={false}
        choices={buildInteractionLanguageChoices()}
        onSelect={() => undefined}
      />
    );

    expect(html).toContain('class="world-map-artwork"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("world-map-hit-area");
    expect(html).toContain("world-map-hotspot");
  });

  it("renders language header chips with a flag and macro-area label", () => {
    const swahili = buildInteractionLanguageChoices().find((choice) => choice.value === "sw") ?? null;
    const html = renderToStaticMarkup(
      <LanguageHeaderChip
        title="Selected language"
        choice={swahili}
        fallbackLabel="-"
      />
    );

    expect(html).toContain("Selected language");
    expect(html).toContain('aria-label="Flag KE"');
    expect(html).toContain("Africa");
    expect(html).toContain("Kiswahili");
  });

  it("can hide macro-area metadata for the visitor language chip", () => {
    const english = buildInteractionLanguageChoices().find((choice) => choice.value === "en") ?? null;
    const html = renderToStaticMarkup(
      <LanguageHeaderChip
        title="Language"
        choice={english}
        fallbackLabel="-"
        showMeta={false}
      />
    );

    expect(html).toContain("English");
    expect(html).not.toContain("Americhe");
  });

  it("can render an english helper label for the remote user language chip", () => {
    const georgian = buildInteractionLanguageChoices("chatgpt", { includeProviderExpansions: true }).find(
      (choice) => choice.value === "ka"
    ) ?? null;
    const html = renderToStaticMarkup(
      <LanguageHeaderChip
        title="User language"
        choice={georgian}
        fallbackLabel="-"
        englishLabel="Georgian"
      />
    );

    expect(html).toContain("ქართული");
    expect(html).toContain("Georgian");
    expect(html).toContain("Asia");
    expect(html).not.toContain("Europa");
  });

  it("renders the active fallback state only when the effective language differs from the configured one", () => {
    const english = buildInteractionLanguageChoices().find((choice) => choice.value === "en") ?? null;
    const html = renderToStaticMarkup(
      <LanguageHeaderChip
        title="Current language"
        choice={english}
        fallbackLabel="-"
        configuredLabel="Bielorusso"
        uiFallback
      />
    );

    expect(html).toContain("English");
    expect(html).toContain("Configured: Bielorusso");
    expect(html).toContain("UI: English");
  });

  it("localizes header-chip metadata labels for italian operator surfaces", () => {
    const english = buildInteractionLanguageChoices().find((choice) => choice.value === "en") ?? null;
    const html = renderToStaticMarkup(
      <LanguageHeaderChip
        title="Lingua attuale"
        choice={english}
        fallbackLabel="-"
        language="it"
        configuredLabel="Bielorusso"
        uiFallback
      />
    );

    expect(html).toContain("English");
    expect(html).toContain("Configurata: Bielorusso");
    expect(html).toContain("Interfaccia: inglese");
  });

  it("renders visitor technical errors in the visitor language without raw blocking codes", () => {
    const html = renderToStaticMarkup(
      <TechnicalErrorView
        visitorLanguageCode="es"
        issues={[
          {
            code: "missing-monitor",
            message: "Sono necessari due monitor attivi per avviare la sessione.",
            retryable: true,
            details: "Display probe timeout"
          }
        ]}
        onRetry={() => undefined}
      />
    );

    expect(html).toContain("Error tecnico");
    expect(html).toContain("Se necesitan dos monitores activos para iniciar la sesion.");
    expect(html).toContain("Reintentar");
    expect(html).not.toContain("missing-monitor");
    expect(html).not.toContain("Display probe timeout");
  });

  it("keeps setup recovery visible even on the visitor technical-error screen", () => {
    const html = renderToStaticMarkup(
      <TechnicalErrorView
        visitorLanguageCode="es"
        issues={[
          {
            code: "microphone-unavailable",
            message: "Il microfono assegnato non e disponibile o non e acquisibile.",
            retryable: true,
            side: "B"
          }
        ]}
        onRetry={() => undefined}
        onOpenSetup={() => undefined}
      />
    );

    expect(html).toContain("Open setup");
  });

  it("falls back unsupported visitor technical errors to english copy", () => {
    const html = renderToStaticMarkup(
      <TechnicalErrorView
        visitorLanguageCode="kk"
        issues={[
          {
            code: "speech-stream-failure",
            message: "Errore nel flusso vocale.",
            retryable: true
          }
        ]}
        onRetry={() => undefined}
      />
    );

    expect(html).toContain("Technical error");
    expect(html).toContain("The speech stream failed.");
    expect(html).toContain("Retry");
  });

  it("renders operator microphone permission guidance without exposing raw diagnostics", () => {
    const html = renderToStaticMarkup(
      <TechnicalErrorView
        language="en"
        issues={[
          {
            code: "microphone-permission-denied",
            message: "Accesso al microfono bloccato per la postazione.",
            retryable: true,
            side: "A",
            details: "NotAllowedError: Permission denied"
          }
        ]}
        onRetry={() => undefined}
        onOpenSetup={() => undefined}
      />
    );

    expect(html).toContain("Station A cannot access its microphone.");
    expect(html).toContain("save the assignment again");
    expect(html).not.toContain("repair:microphones");
    expect(html).toContain("Open setup");
    expect(html).not.toContain("microphone-permission-denied");
    expect(html).not.toContain("NotAllowedError: Permission denied");
  });

  it("offers setup repair for monitor and translation configuration blockers owned by the wizard", () => {
    const html = renderToStaticMarkup(
      <TechnicalErrorView
        language="en"
        issues={[
          {
            code: "missing-monitor",
            message: "Sono necessari due monitor attivi per avviare la sessione.",
            retryable: true
          },
          {
            code: "translation-config-missing",
            message: "Configurazione provider traduzione mancante: chatgpt.",
            retryable: false
          }
        ]}
        onRetry={() => undefined}
        onOpenSetup={() => undefined}
      />
    );

    expect(html).toContain("Two active monitors are required to start the session.");
    expect(html).toContain("Translation configuration is missing for the selected provider.");
    expect(html).toContain("Open setup");
  });

  it("keeps setup repair hidden for transient speech stream failures", () => {
    const html = renderToStaticMarkup(
      <TechnicalErrorView
        language="en"
        issues={[
          {
            code: "speech-stream-failure",
            message: "Errore nel flusso vocale.",
            retryable: true
          }
        ]}
        onRetry={() => undefined}
        onOpenSetup={() => undefined}
      />
    );

    expect(html).toContain("Retry");
    expect(html).not.toContain("Open setup");
  });
});
