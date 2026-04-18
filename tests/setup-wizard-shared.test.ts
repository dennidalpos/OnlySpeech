import { describe, expect, it } from "vitest";
import { parse as parseEnv } from "dotenv";
import { getPersistedMicrophoneId } from "../src/services/audio/persisted-microphone-id.js";
import { loadRuntimeConfig } from "../src/shared/config.js";
import { ENV_KEY_ORDER } from "../src/tools/env-probe-output.js";
import {
  applyWizardSelectionsFromEnv,
  assignDisplay,
  assignMicrophone,
  buildWizardEnv,
  createInitialWizardState,
  getWizardConfigurationIssues,
  mergeMicrophoneProbe,
  WIZARD_SIDE_PRESENTATION
} from "../src/tools/setup-wizard/shared.js";

describe("setup wizard shared state", () => {
  it("keeps display assignments unique per side", () => {
    const state = createInitialWizardState(
      [
        { displayId: 1, label: "Left", bounds: { x: 0, y: 0, width: 1, height: 1 }, scaleFactor: 1 },
        { displayId: 2, label: "Right", bounds: { x: 1, y: 0, width: 1, height: 1 }, scaleFactor: 1 }
      ],
      {}
    );

    const displays = assignDisplay(state.displays, "A", 2);

    expect(displays.find((display) => display.displayId === 1)?.assignedSide).toBeNull();
    expect(displays.find((display) => display.displayId === 2)?.assignedSide).toBe("A");
  });

  it("reports missing monitor, microphone, and provider requirements from one shared helper", () => {
    const baseState = createInitialWizardState(
      [
        { displayId: 1, label: "Left", bounds: { x: 0, y: 0, width: 1, height: 1 }, scaleFactor: 1 },
        { displayId: 2, label: "Right", bounds: { x: 1, y: 0, width: 1, height: 1 }, scaleFactor: 1 }
      ],
      {
        TRANSLATION_PROVIDER: "azure",
        DISPLAY_A_ID: "",
        DISPLAY_B_ID: "",
        AZURE_SPEECH_KEY: "",
        AZURE_SPEECH_REGION: ""
      }
    );
    const state = {
      ...baseState,
      displays: baseState.displays.map((display) => ({ ...display, assignedSide: null }))
    };

    const issues = getWizardConfigurationIssues(state);

    expect(issues).toEqual([
      expect.objectContaining({ code: "missing-display-a", message: "monitor A non assegnato" }),
      expect.objectContaining({ code: "missing-display-b", message: "monitor B non assegnato" }),
      expect.objectContaining({ code: "missing-microphone-a", message: "microfono A non assegnato" }),
      expect.objectContaining({ code: "missing-microphone-b", message: "microfono B non assegnato" }),
      expect.objectContaining({
        code: "missing-provider-credentials",
        message: "credenziali provider mancanti",
        detail: "Azure Speech key, Azure Speech region"
      })
    ]);
  });

  it("publishes the explicit workstation labels for the two sides", () => {
    expect(WIZARD_SIDE_PRESENTATION.A.stationTitle).toBe("OnlySpeech . postazione operatore A");
    expect(WIZARD_SIDE_PRESENTATION.A.stationSubtitle).toBe("Lato operatore");
    expect(WIZARD_SIDE_PRESENTATION.B.stationTitle).toBe("OnlySpeech . postazione utente B");
    expect(WIZARD_SIDE_PRESENTATION.B.stationSubtitle).toBe("Lato utente");
  });

  it("keeps only the target defaults in wizard state and derives speech source from them later", () => {
    const state = createInitialWizardState(
      [
        { displayId: 1, label: "Left", bounds: { x: 0, y: 0, width: 1, height: 1 }, scaleFactor: 1 }
      ],
      {
        DEFAULT_TARGET_LANG_A: "fr",
        DEFAULT_TARGET_LANG_B: "ja"
      }
    );

    expect(state.envValues.DEFAULT_TARGET_LANG_A).toBe("fr");
    expect(state.envValues.DEFAULT_TARGET_LANG_B).toBe("ja");
  });

  it("merges microphone probe while preserving previous assignments", () => {
    const merged = mergeMicrophoneProbe(
      [
        { deviceId: "mic-a", groupId: "g1", label: "Mic A", assignedSides: ["A"] },
        { deviceId: "mic-b", groupId: "g2", label: "Mic B", assignedSides: ["B"] }
      ],
      {
        microphones: [{ deviceId: "mic-a", groupId: "g1", label: "Mic A" }],
        microphonePermissionGranted: true,
        microphoneError: null
      }
    );

    expect(merged.microphones).toEqual([
      expect.objectContaining({
        deviceId: "mic-a",
        groupId: "g1",
        label: "Mic A",
        displayLabel: "Mic A",
        connectionType: "other",
        connectionLabel: "Altro",
        audioInputRole: "microphone",
        assignedSides: ["A"]
      })
    ]);
  });

  it("renders the env file with wizard selections", () => {
    const initial = createInitialWizardState(
      [
        { displayId: 1, label: "Left", bounds: { x: 0, y: 0, width: 1, height: 1 }, scaleFactor: 1 },
        { displayId: 2, label: "Right", bounds: { x: 1, y: 0, width: 1, height: 1 }, scaleFactor: 1 }
      ],
      { AZURE_SPEECH_REGION: "westeurope" }
    );
    const state = {
      ...initial,
      displays: assignDisplay(assignDisplay(initial.displays, "A", 1), "B", 2),
      microphones: assignMicrophone(
        [
          { deviceId: "mic-a", groupId: "g1", label: "Mic A", assignedSides: [] },
          { deviceId: "mic-b", groupId: "g2", label: "Mic B", assignedSides: [] }
        ],
        "A",
        "mic-a"
      )
    };

    const envText = buildWizardEnv({
      ...state,
      microphones: assignMicrophone(state.microphones, "B", "mic-b")
    });

    expect(envText).toContain("DISPLAY_A_ID=1");
    expect(envText).toContain("DISPLAY_B_ID=2");
    expect(envText).toContain(
      `MIC_A_ID=${getPersistedMicrophoneId({ deviceId: "mic-a", groupId: "g1", label: "Mic A" }, state.microphones)}`
    );
    expect(envText).toContain(
      `MIC_B_ID=${getPersistedMicrophoneId({ deviceId: "mic-b", groupId: "g2", label: "Mic B" }, [
        ...state.microphones,
        { deviceId: "mic-b", groupId: "g2", label: "Mic B" }
      ])}`
    );
    expect(envText).toContain("AZURE_SPEECH_REGION=westeurope");
    expect(envText).toContain("TRANSLATION_PROVIDER=chatgpt");
    expect(envText).toContain("CHATGPT_SILENCE_RMS_THRESHOLD=0.02");
    expect(envText).toContain("TEXT_TO_SPEECH_ENABLED=true");
    expect(envText).toContain("RUNTIME_DISCLOSURE_MODE=standard");
    expect(envText).toContain("RUNTIME_DISCLOSURE_CUSTOM_TEXT=");
    expect(envText).toContain("VISITOR_CONVERSATION_HISTORY_ENABLED=false");
    expect(envText).toContain("AUDIO_ECHO_CANCELLATION=true");
    expect(envText).toContain("AUDIO_NOISE_SUPPRESSION=true");
    expect(envText).toContain("# chatgpt requires CHATGPT_API_KEY, CHATGPT_MODEL, and CHATGPT_TRANSCRIBE_MODEL.");
    expect(envText).toContain(
      "# azure requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION; normalized playback diagnostics also use AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_REGION."
    );
    expect(envText).toContain(
      "# ollama requires OLLAMA_BASE_URL and OLLAMA_MODEL; it remains translation-only and cannot unlock live kiosk speech."
    );
  });

  it("redacts provider secrets from packaged release env previews", () => {
    const state = createInitialWizardState(
      [
        { displayId: 1, label: "Left", bounds: { x: 0, y: 0, width: 1, height: 1 }, scaleFactor: 1 }
      ],
      {
        AZURE_SPEECH_KEY: "azure-key",
        AZURE_TRANSLATOR_KEY: "translator-key",
        CHATGPT_API_KEY: "chatgpt-key",
        CHATGPT_MODEL: "gpt-4.1-mini",
        CHATGPT_TRANSCRIBE_MODEL: "gpt-4o-mini-transcribe"
      }
    );

    const envText = buildWizardEnv(state, { secureSecretStorage: true });
    const parsedEnv = parseEnv(envText);

    expect(parsedEnv.AZURE_SPEECH_KEY).toBe("");
    expect(parsedEnv.AZURE_TRANSLATOR_KEY).toBe("");
    expect(parsedEnv.CHATGPT_API_KEY).toBe("");
    expect(parsedEnv.CHATGPT_MODEL).toBe("gpt-4.1-mini");
    expect(parsedEnv.CHATGPT_TRANSCRIBE_MODEL).toBe("gpt-4o-mini-transcribe");
    expect(envText).toContain("# Provider secrets are stored in Windows secure local storage for packaged installs.");
  });

  it("localizes wizard env preview comments to the selected setup UI language", () => {
    const state = createInitialWizardState(
      [
        { displayId: 1, label: "Left", bounds: { x: 0, y: 0, width: 1, height: 1 }, scaleFactor: 1 }
      ],
      {
        SETUP_UI_LANGUAGE: "it",
        TEXT_TO_SPEECH_ENABLED: "false",
        RUNTIME_DISCLOSURE_MODE: "disabled"
      }
    );

    const envText = buildWizardEnv(state, { secureSecretStorage: true });

    expect(envText).toContain("# Ambiente OnlySpeech generato dal setup wizard.");
    expect(envText).toContain("# Compila solo le impostazioni richieste dal provider traduzione selezionato prima dell'uso in produzione.");
    expect(envText).toContain("# La riproduzione TTS runtime e' disattivata; diagnostica e manutenzione del wizard restano disponibili.");
    expect(envText).toContain("# Gli avvisi AI runtime e wizard sono disattivati.");
    expect(envText).toContain("# I segreti provider vengono archiviati nello storage locale sicuro di Windows per le installazioni pacchettizzate.");
    expect(envText).toContain(
      "# azure richiede AZURE_SPEECH_KEY e AZURE_SPEECH_REGION; il test playback con normalizzazione testo usa anche AZURE_TRANSLATOR_KEY e AZURE_TRANSLATOR_REGION."
    );
    expect(envText).toContain(
      "# ollama richiede OLLAMA_BASE_URL e OLLAMA_MODEL; resta solo traduzione e non abilita il kiosk live speech."
    );
  });

  it("persists kiosk parameters so they are reloaded on the next app restart", () => {
    const state = createInitialWizardState(
      [
        { displayId: 11, label: "Left", bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 },
        { displayId: 22, label: "Right", bounds: { x: 1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 }
      ],
      {
        APP_MODE: "kiosk",
        MICROPHONE_PTT_MODE: "single-shared",
        DEMO_SLIDE_INTERVAL_SECONDS: "11",
        REQUIRED_MONITORS: "3",
        REQUIRED_MICROPHONES: "1",
        IDLE_CLEAR_SECONDS: "75",
        IDLE_HARD_RESET_SECONDS: "240",
        PTT_RELEASE_GRACE_MS: "650",
        PROVIDER_REQUEST_TIMEOUT_MS: "21000",
        CHATGPT_SILENCE_RMS_THRESHOLD: "0.07",
        VISITOR_CONVERSATION_HISTORY_ENABLED: "true",
        RUNTIME_DISCLOSURE_MODE: "custom",
        RUNTIME_DISCLOSURE_CUSTOM_TEXT: "Custom wizard-managed notice",
        AUDIO_ECHO_CANCELLATION: "false",
        AUDIO_NOISE_SUPPRESSION: "false",
        DEFAULT_TARGET_LANG_A: "fr",
        DEFAULT_TARGET_LANG_B: "de",
        LOG_LEVEL: "debug"
      }
    );

    const envText = buildWizardEnv({
      ...state,
      displays: state.displays,
      microphones: []
    });
    const reloadedConfig = loadRuntimeConfig(parseEnv(envText));

    expect(reloadedConfig.appMode).toBe("kiosk");
    expect(reloadedConfig.microphonePttMode).toBe("single-shared");
    expect(reloadedConfig.demoSlideIntervalSeconds).toBe(11);
    expect(reloadedConfig.requiredMonitors).toBe(2);
    expect(reloadedConfig.requiredMicrophones).toBe(1);
    expect(reloadedConfig.idleClearSeconds).toBe(75);
    expect(reloadedConfig.idleHardResetSeconds).toBe(240);
    expect(reloadedConfig.pttReleaseGraceMs).toBe(650);
    expect(reloadedConfig.providerRequestTimeoutMs).toBe(21000);
    expect(reloadedConfig.chatGptSilenceRmsThreshold).toBe(0.07);
    expect(reloadedConfig.visitorConversationHistoryEnabled).toBe(true);
    expect(reloadedConfig.runtimeDisclosure).toEqual({
      mode: "custom",
      customText: "Custom wizard-managed notice"
    });
    expect(reloadedConfig.audioEchoCancellation).toBe(false);
    expect(reloadedConfig.audioNoiseSuppression).toBe(false);
    expect(reloadedConfig.defaultTargetLangA).toBe("fr");
    expect(reloadedConfig.defaultTargetLangB).toBe("de");
    expect(reloadedConfig.defaultSourceLangA).toBe("fr-FR");
    expect(reloadedConfig.defaultSourceLangB).toBe("de-DE");
    expect(reloadedConfig.logLevel).toBe("debug");
  });

  it("round-trips every persisted env parameter used by the runtime", () => {
    const initialState = createInitialWizardState(
      [
        { displayId: 101, label: "Left", bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 },
        { displayId: 202, label: "Right", bounds: { x: 1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 }
      ],
      {
        APP_MODE: "kiosk",
        MICROPHONE_PTT_MODE: "single-shared",
        DEMO_SLIDE_INTERVAL_SECONDS: "13",
        REQUIRED_MONITORS: "3",
        REQUIRED_MICROPHONES: "1",
        DISPLAY_A_ID: "101",
        DISPLAY_B_ID: "202",
        MIC_A_ID: "persisted-mic-a",
        MIC_B_ID: "persisted-mic-b",
        IDLE_CLEAR_SECONDS: "45",
        IDLE_HARD_RESET_SECONDS: "210",
        PTT_RELEASE_GRACE_MS: "700",
        PROVIDER_REQUEST_TIMEOUT_MS: "30000",
        CHATGPT_SILENCE_RMS_THRESHOLD: "0.09",
        TEXT_TO_SPEECH_ENABLED: "false",
        RUNTIME_DISCLOSURE_MODE: "disabled",
        RUNTIME_DISCLOSURE_CUSTOM_TEXT: "Saved but inactive notice",
        VISITOR_CONVERSATION_HISTORY_ENABLED: "true",
        AUDIO_ECHO_CANCELLATION: "false",
        AUDIO_NOISE_SUPPRESSION: "false",
        AZURE_SPEECH_KEY: "azure-key",
        AZURE_SPEECH_REGION: "westeurope",
        TRANSLATION_PROVIDER: "azure",
        CHATGPT_API_KEY: "chatgpt-key",
        CHATGPT_MODEL: "gpt-4.1",
        CHATGPT_TRANSCRIBE_MODEL: "gpt-4o-transcribe",
        DEFAULT_TARGET_LANG_A: "fr",
        DEFAULT_TARGET_LANG_B: "de",
        LOG_LEVEL: "debug"
      }
    );
    const baseState = {
      ...initialState,
      displays: assignDisplay(assignDisplay(initialState.displays, "A", 101), "B", 202)
    };

    const envText = buildWizardEnv({
      ...baseState,
      microphones: [
        { deviceId: "mic-a", groupId: "ga", label: "Mic A", assignedSides: ["A"] },
        { deviceId: "mic-b", groupId: "gb", label: "Mic B", assignedSides: ["B"] }
      ]
    });
    const parsedEnv = parseEnv(envText);
    const reloadedConfig = loadRuntimeConfig(parsedEnv);

    for (const key of ENV_KEY_ORDER) {
      expect(parsedEnv[key]).toBeDefined();
    }

    expect(parsedEnv.APP_MODE).toBe("kiosk");
    expect(parsedEnv.MICROPHONE_PTT_MODE).toBe("single-shared");
    expect(parsedEnv.DEMO_SLIDE_INTERVAL_SECONDS).toBe("13");
    expect(parsedEnv.REQUIRED_MONITORS).toBe("2");
    expect(parsedEnv.REQUIRED_MICROPHONES).toBe("1");
    expect(parsedEnv.DISPLAY_A_ID).toBe("101");
    expect(parsedEnv.DISPLAY_B_ID).toBe("202");
    expect(parsedEnv.MIC_A_ID).toBe(
      getPersistedMicrophoneId({ deviceId: "mic-a", groupId: "ga", label: "Mic A" }, [
        { deviceId: "mic-a", groupId: "ga", label: "Mic A" },
        { deviceId: "mic-b", groupId: "gb", label: "Mic B" }
      ])
    );
    expect(parsedEnv.MIC_B_ID).toBe(
      getPersistedMicrophoneId({ deviceId: "mic-a", groupId: "ga", label: "Mic A" }, [
        { deviceId: "mic-a", groupId: "ga", label: "Mic A" },
        { deviceId: "mic-b", groupId: "gb", label: "Mic B" }
      ])
    );
    expect(parsedEnv.IDLE_CLEAR_SECONDS).toBe("45");
    expect(parsedEnv.IDLE_HARD_RESET_SECONDS).toBe("210");
    expect(parsedEnv.PTT_RELEASE_GRACE_MS).toBe("700");
    expect(parsedEnv.PROVIDER_REQUEST_TIMEOUT_MS).toBe("30000");
    expect(parsedEnv.CHATGPT_SILENCE_RMS_THRESHOLD).toBe("0.09");
    expect(parsedEnv.TEXT_TO_SPEECH_ENABLED).toBe("false");
    expect(parsedEnv.RUNTIME_DISCLOSURE_MODE).toBe("disabled");
    expect(parsedEnv.RUNTIME_DISCLOSURE_CUSTOM_TEXT).toBe("Saved but inactive notice");
    expect(parsedEnv.VISITOR_CONVERSATION_HISTORY_ENABLED).toBe("true");
    expect(parsedEnv.AUDIO_ECHO_CANCELLATION).toBe("false");
    expect(parsedEnv.AUDIO_NOISE_SUPPRESSION).toBe("false");
    expect(parsedEnv.AZURE_SPEECH_KEY).toBe("azure-key");
    expect(parsedEnv.AZURE_SPEECH_REGION).toBe("westeurope");
    expect(parsedEnv.TRANSLATION_PROVIDER).toBe("azure");
    expect(parsedEnv.CHATGPT_API_KEY).toBe("chatgpt-key");
    expect(parsedEnv.CHATGPT_MODEL).toBe("gpt-4.1");
    expect(parsedEnv.CHATGPT_TRANSCRIBE_MODEL).toBe("gpt-4o-transcribe");
    expect(parsedEnv.DEFAULT_TARGET_LANG_A).toBe("fr");
    expect(parsedEnv.DEFAULT_TARGET_LANG_B).toBe("de");
    expect(parsedEnv.LOG_LEVEL).toBe("debug");

    expect(reloadedConfig.appMode).toBe("kiosk");
    expect(reloadedConfig.microphonePttMode).toBe("single-shared");
    expect(reloadedConfig.demoSlideIntervalSeconds).toBe(13);
    expect(reloadedConfig.requiredMonitors).toBe(2);
    expect(reloadedConfig.requiredMicrophones).toBe(1);
    expect(reloadedConfig.displayAId).toBe(101);
    expect(reloadedConfig.displayBId).toBe(202);
    expect(reloadedConfig.micAId).toBe(parsedEnv.MIC_A_ID);
    expect(reloadedConfig.micBId).toBe(parsedEnv.MIC_B_ID);
    expect(reloadedConfig.idleClearSeconds).toBe(45);
    expect(reloadedConfig.idleHardResetSeconds).toBe(210);
    expect(reloadedConfig.pttReleaseGraceMs).toBe(700);
    expect(reloadedConfig.providerRequestTimeoutMs).toBe(30000);
    expect(reloadedConfig.chatGptSilenceRmsThreshold).toBe(0.09);
    expect(reloadedConfig.textToSpeechEnabled).toBe(false);
    expect(reloadedConfig.runtimeDisclosure).toEqual({
      mode: "disabled",
      customText: "Saved but inactive notice"
    });
    expect(reloadedConfig.visitorConversationHistoryEnabled).toBe(true);
    expect(reloadedConfig.audioEchoCancellation).toBe(false);
    expect(reloadedConfig.audioNoiseSuppression).toBe(false);
    expect(reloadedConfig.azureSpeechKey).toBe("azure-key");
    expect(reloadedConfig.azureSpeechRegion).toBe("westeurope");
    expect(reloadedConfig.translationProvider).toBe("azure");
    expect(reloadedConfig.chatGptApiKey).toBe("chatgpt-key");
    expect(reloadedConfig.chatGptModel).toBe("gpt-4.1");
    expect(reloadedConfig.chatGptTranscribeModel).toBe("gpt-4o-transcribe");
    expect(reloadedConfig.defaultTargetLangA).toBe("fr");
    expect(reloadedConfig.defaultTargetLangB).toBe("de");
    expect(reloadedConfig.defaultSourceLangA).toBe("fr-FR");
    expect(reloadedConfig.defaultSourceLangB).toBe("de-DE");
    expect(reloadedConfig.logLevel).toBe("debug");
  });

  it("writes a coherent single-shared microphone profile", () => {
    const initialState = createInitialWizardState(
      [
        { displayId: 101, label: "Left", bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 },
        { displayId: 202, label: "Right", bounds: { x: 1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 }
      ],
      {
        APP_MODE: "kiosk",
        MICROPHONE_PTT_MODE: "single-shared"
      }
    );
    const state = {
      ...initialState,
      displays: assignDisplay(assignDisplay(initialState.displays, "A", 101), "B", 202),
      microphones: assignMicrophone(
        assignMicrophone(
          [{ deviceId: "mic-shared", groupId: "g1", label: "Shared mic", assignedSides: [] }],
          "A",
          "mic-shared"
        ),
        "B",
        "mic-shared"
      )
    };

    const envText = buildWizardEnv(state);
    const parsedEnv = parseEnv(envText);

    expect(parsedEnv.MICROPHONE_PTT_MODE).toBe("single-shared");
    expect(parsedEnv.REQUIRED_MICROPHONES).toBe("1");
    expect(parsedEnv.MIC_A_ID).toBe(
      getPersistedMicrophoneId({ deviceId: "mic-shared", groupId: "g1", label: "Shared mic" }, [
        { deviceId: "mic-shared", groupId: "g1", label: "Shared mic" }
      ])
    );
    expect(parsedEnv.MIC_B_ID).toBe(
      getPersistedMicrophoneId({ deviceId: "mic-shared", groupId: "g1", label: "Shared mic" }, [
        { deviceId: "mic-shared", groupId: "g1", label: "Shared mic" }
      ])
    );
  });

  it("rehydrates single-shared assignments from the canonical saved env contract", () => {
    const initialState = createInitialWizardState(
      [
        { displayId: 101, label: "Left", bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 },
        { displayId: 202, label: "Right", bounds: { x: 1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 }
      ],
      {
        APP_MODE: "kiosk",
        MICROPHONE_PTT_MODE: "single-shared"
      }
    );
    const sharedMicrophone = {
      deviceId: "mic-shared",
      groupId: "g1",
      label: "Shared mic",
      assignedSides: [] as ("A" | "B")[]
    };
    const canonicalMicId = getPersistedMicrophoneId(sharedMicrophone, [sharedMicrophone]);

    const rehydrated = applyWizardSelectionsFromEnv(
      {
        ...initialState,
        displays: initialState.displays.map((display) => ({ ...display, assignedSide: null })),
        microphones: [
          {
            ...sharedMicrophone,
            assignedSides: ["A"]
          }
        ]
      },
      {
        DISPLAY_A_ID: "101",
        DISPLAY_B_ID: "202",
        MICROPHONE_PTT_MODE: "single-shared",
        MIC_A_ID: canonicalMicId,
        MIC_B_ID: canonicalMicId
      }
    );

    expect(rehydrated.displays.find((display) => display.displayId === 101)?.assignedSide).toBe("A");
    expect(rehydrated.displays.find((display) => display.displayId === 202)?.assignedSide).toBe("B");
    expect(rehydrated.microphones[0]?.assignedSides).toEqual(["A", "B"]);
    expect(rehydrated.envValues.MIC_A_ID).toBe(canonicalMicId);
    expect(rehydrated.envValues.MIC_B_ID).toBe(canonicalMicId);
  });

  it("drops microphone and provider blockers from wizard validation in demo mode", () => {
    const state = createInitialWizardState(
      [
        { displayId: 1, label: "Left", bounds: { x: 0, y: 0, width: 1, height: 1 }, scaleFactor: 1 },
        { displayId: 2, label: "Right", bounds: { x: 1, y: 0, width: 1, height: 1 }, scaleFactor: 1 }
      ],
      {
        APP_MODE: "demo",
        TRANSLATION_PROVIDER: "chatgpt",
        CHATGPT_API_KEY: "",
        CHATGPT_MODEL: "",
        CHATGPT_TRANSCRIBE_MODEL: ""
      }
    );

    expect(getWizardConfigurationIssues(state)).toEqual([
      expect.objectContaining({ code: "missing-display-a" }),
      expect.objectContaining({ code: "missing-display-b" })
    ]);
  });
});
