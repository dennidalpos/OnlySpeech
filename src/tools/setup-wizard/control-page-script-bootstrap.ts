export function getSetupWizardControlBootstrapScript(): string {
  return `      const bootstrapCopyByLanguage = {
        en: {
          closeDisplaySetup: "Close display setup",
          openDisplaySetup: "Open guided display setup",
          uiLanguageUpdateFailed: "Unable to update the UI language: ",
          microphoneProbeFailed: "Microphone probe failed: ",
          providerPlaybackStopped: "Provider playback test stopped.",
          providerPlaybackStopFailed: "Unable to stop the provider playback test",
          displaySetupStarted: "Display setup started. The main setup window moves to the background until the session ends.",
          displaySetupStartFailed: "Unable to start display setup",
          displaySetupClosed: "Display setup closed. Returning focus to the main setup window.",
          displaySetupCloseFailed: "Unable to close display setup",
          openRuntimeLogsFailed: "Unable to open the runtime logs folder",
          runtimeLogsOpened: "Runtime logs folder opened: ",
          setupStateRefreshed: "Setup state refreshed.",
          refreshSetupStateFailed: "Unable to refresh setup state",
          missingWizardBridge: "The setup wizard bridge is not available in this window.",
          licenseLoadError: "License load error: ",
          refreshPreviewFailed: "Unable to refresh the preview: ",
          setupUiError: "Setup UI error: ",
          asyncSetupError: "Async setup error: ",
          setupInitializationFailed: "Setup initialization failed: "
        },
        it: {
          closeDisplaySetup: "Chiudi setup monitor",
          openDisplaySetup: "Apri setup guidato monitor",
          uiLanguageUpdateFailed: "Impossibile aggiornare la lingua UI: ",
          microphoneProbeFailed: "Rilevamento microfoni fallito: ",
          providerPlaybackStopped: "Test riproduzione provider fermato.",
          providerPlaybackStopFailed: "Impossibile fermare il test di riproduzione provider",
          displaySetupStarted: "Setup monitor avviato. La finestra principale passa in background fino al termine della sessione.",
          displaySetupStartFailed: "Impossibile avviare il setup monitor",
          displaySetupClosed: "Setup monitor chiuso. Il focus torna alla finestra principale.",
          displaySetupCloseFailed: "Impossibile chiudere il setup monitor",
          openRuntimeLogsFailed: "Impossibile aprire la cartella log runtime",
          runtimeLogsOpened: "Cartella log runtime aperta: ",
          setupStateRefreshed: "Stato setup aggiornato.",
          refreshSetupStateFailed: "Impossibile aggiornare lo stato setup",
          missingWizardBridge: "Il bridge del setup wizard non e' disponibile in questa finestra.",
          licenseLoadError: "Errore caricamento licenza: ",
          refreshPreviewFailed: "Impossibile aggiornare l'anteprima: ",
          setupUiError: "Errore interfaccia setup: ",
          asyncSetupError: "Errore async setup: ",
          setupInitializationFailed: "Inizializzazione setup fallita: "
        },
        es: {
          closeDisplaySetup: "Cerrar setup de monitores",
          openDisplaySetup: "Abrir setup guiado de monitores",
          uiLanguageUpdateFailed: "No se pudo actualizar el idioma UI: ",
          microphoneProbeFailed: "Fallo en la deteccion de microfonos: ",
          providerPlaybackStopped: "Prueba de reproduccion del proveedor detenida.",
          providerPlaybackStopFailed: "No se pudo detener la prueba de reproduccion del proveedor",
          displaySetupStarted: "Setup de monitores iniciado. La ventana principal pasa a segundo plano hasta que termine la sesion.",
          displaySetupStartFailed: "No se pudo iniciar el setup de monitores",
          displaySetupClosed: "Setup de monitores cerrado. El foco vuelve a la ventana principal.",
          displaySetupCloseFailed: "No se pudo cerrar el setup de monitores",
          openRuntimeLogsFailed: "No se pudo abrir la carpeta de logs runtime",
          runtimeLogsOpened: "Carpeta de logs runtime abierta: ",
          setupStateRefreshed: "Estado del setup actualizado.",
          refreshSetupStateFailed: "No se pudo actualizar el estado del setup",
          missingWizardBridge: "El bridge del setup wizard no esta disponible en esta ventana.",
          licenseLoadError: "Error al cargar la licencia: ",
          refreshPreviewFailed: "No se pudo actualizar la vista previa: ",
          setupUiError: "Error de la interfaz setup: ",
          asyncSetupError: "Error async del setup: ",
          setupInitializationFailed: "Fallo al iniciar el setup: "
        },
        fr: {
          closeDisplaySetup: "Fermer le setup ecran",
          openDisplaySetup: "Ouvrir le setup guide des ecrans",
          uiLanguageUpdateFailed: "Impossible de mettre a jour la langue UI : ",
          microphoneProbeFailed: "Echec de la detection des microphones : ",
          providerPlaybackStopped: "Test de lecture fournisseur arrete.",
          providerPlaybackStopFailed: "Impossible d'arreter le test de lecture fournisseur",
          displaySetupStarted: "Le setup ecran a demarre. La fenetre principale passe en arriere-plan jusqu'a la fin de la session.",
          displaySetupStartFailed: "Impossible de demarrer le setup ecran",
          displaySetupClosed: "Le setup ecran est ferme. Le focus revient a la fenetre principale.",
          displaySetupCloseFailed: "Impossible de fermer le setup ecran",
          openRuntimeLogsFailed: "Impossible d'ouvrir le dossier des logs runtime",
          runtimeLogsOpened: "Dossier des logs runtime ouvert : ",
          setupStateRefreshed: "Etat du setup actualise.",
          refreshSetupStateFailed: "Impossible d'actualiser l'etat du setup",
          missingWizardBridge: "Le bridge du setup wizard n'est pas disponible dans cette fenetre.",
          licenseLoadError: "Erreur de chargement de la licence : ",
          refreshPreviewFailed: "Impossible d'actualiser l'aperçu : ",
          setupUiError: "Erreur UI setup : ",
          asyncSetupError: "Erreur async setup : ",
          setupInitializationFailed: "Echec de l'initialisation du setup : "
        },
        de: {
          closeDisplaySetup: "Monitor-Setup schliessen",
          openDisplaySetup: "Gefuehrtes Monitor-Setup oeffnen",
          uiLanguageUpdateFailed: "UI-Sprache konnte nicht aktualisiert werden: ",
          microphoneProbeFailed: "Mikrofonerkennung fehlgeschlagen: ",
          providerPlaybackStopped: "Anbieter-Wiedergabetest gestoppt.",
          providerPlaybackStopFailed: "Anbieter-Wiedergabetest konnte nicht gestoppt werden",
          displaySetupStarted: "Monitor-Setup gestartet. Das Hauptfenster geht in den Hintergrund, bis die Sitzung endet.",
          displaySetupStartFailed: "Monitor-Setup konnte nicht gestartet werden",
          displaySetupClosed: "Monitor-Setup geschlossen. Der Fokus kehrt zum Hauptfenster zurueck.",
          displaySetupCloseFailed: "Monitor-Setup konnte nicht geschlossen werden",
          openRuntimeLogsFailed: "Runtime-Logordner konnte nicht geoeffnet werden",
          runtimeLogsOpened: "Runtime-Logordner geoeffnet: ",
          setupStateRefreshed: "Setup-Status aktualisiert.",
          refreshSetupStateFailed: "Setup-Status konnte nicht aktualisiert werden",
          missingWizardBridge: "Die Setup-Wizard-Bridge ist in diesem Fenster nicht verfuegbar.",
          licenseLoadError: "Fehler beim Laden der Lizenz: ",
          refreshPreviewFailed: "Vorschau konnte nicht aktualisiert werden: ",
          setupUiError: "Setup-UI-Fehler: ",
          asyncSetupError: "Async-Setup-Fehler: ",
          setupInitializationFailed: "Setup-Initialisierung fehlgeschlagen: "
        },
        zh: {
          closeDisplaySetup: "关闭显示器设置",
          openDisplaySetup: "打开显示器引导设置",
          uiLanguageUpdateFailed: "无法更新界面语言：",
          microphoneProbeFailed: "麦克风探测失败：",
          providerPlaybackStopped: "服务商播放测试已停止。",
          providerPlaybackStopFailed: "无法停止服务商播放测试",
          displaySetupStarted: "显示器设置已启动。主窗口会退到后台，直到当前会话结束。",
          displaySetupStartFailed: "无法启动显示器设置",
          displaySetupClosed: "显示器设置已关闭。焦点返回主窗口。",
          displaySetupCloseFailed: "无法关闭显示器设置",
          openRuntimeLogsFailed: "无法打开 runtime 日志目录",
          runtimeLogsOpened: "runtime 日志目录已打开：",
          setupStateRefreshed: "setup 状态已刷新。",
          refreshSetupStateFailed: "无法刷新 setup 状态",
          missingWizardBridge: "此窗口中无法使用 setup wizard bridge。",
          licenseLoadError: "许可加载错误：",
          refreshPreviewFailed: "无法刷新预览：",
          setupUiError: "setup 界面错误：",
          asyncSetupError: "setup 异步错误：",
          setupInitializationFailed: "setup 初始化失败："
        }
      };
      function bootstrapCopy() {
        return bootstrapCopyByLanguage[wizardUiLanguage] || bootstrapCopyByLanguage.en;
      }
      function render() {
        if (!state) { return; }
        renderHeroSummary();
        renderChecklist();
        renderMonitorNotices();
        renderStationsSummary();
        renderMonitorAssignments();
        renderMicrophoneNotices();
        renderMicrophoneAssignments();
        renderMicrophoneTests();
        renderEnvForm();
        renderProviderControls();
        renderSaveReview();
        renderAsyncUi();
        updateMonitorSetupToggle();
        syncWizardUiLanguageControls(state.envValues.SETUP_UI_LANGUAGE || wizardUiLanguage);
        setActiveSection(activeSection, { scroll: false, focus: false });
      }
      function updateMonitorSetupToggle() {
        const toggle = document.getElementById("toggle-monitor-setup");
        if (!(toggle instanceof HTMLButtonElement)) {
          return;
        }
        const monitorSetupActive = Boolean(state?.monitorSetupSessionActive);
        const nextLabel = monitorSetupActive
          ? bootstrapCopy().closeDisplaySetup
          : bootstrapCopy().openDisplaySetup;
        const label = toggle.querySelector("[data-action-label]");
        if (label) {
          label.textContent = nextLabel;
        } else {
          toggle.textContent = nextLabel;
        }
        toggle.setAttribute("aria-label", nextLabel);
        toggle.setAttribute("aria-pressed", monitorSetupActive ? "true" : "false");
        toggle.classList.toggle("is-active", monitorSetupActive);
      }
      async function handleWizardUiLanguageChange(nextLanguage) {
        const normalizedLanguage = normalizeWizardUiLanguage(nextLanguage);
        if (normalizedLanguage === normalizeWizardUiLanguage(state?.envValues?.SETUP_UI_LANGUAGE || wizardUiLanguage)) {
          syncWizardUiLanguageControls(normalizedLanguage);
          return;
        }
        await api.updateEnvValues({ SETUP_UI_LANGUAGE: normalizedLanguage });
      }
      function wireShellEventHandlers() {
        document.querySelectorAll("[data-section]").forEach((tab) => {
          tab.onclick = () => setActiveSection(tab.getAttribute("data-section"));
        });
        const topLanguageSelect = document.getElementById("wizard-ui-language-select");
        if (topLanguageSelect instanceof HTMLSelectElement) {
          topLanguageSelect.onchange = () => {
            void handleWizardUiLanguageChange(topLanguageSelect.value).catch((error) => {
              setStatus(bootstrapCopy().uiLanguageUpdateFailed + (error?.message || String(error)), "error");
              syncWizardUiLanguageControls(state?.envValues?.SETUP_UI_LANGUAGE || wizardUiLanguage);
            });
          };
        }
        const probeMicrophonesButton = document.getElementById("probe-microphones");
        if (probeMicrophonesButton instanceof HTMLButtonElement) {
          probeMicrophonesButton.onclick = () => {
            void probeMicrophones().catch((error) => {
              setStatus(bootstrapCopy().microphoneProbeFailed + (error?.message || String(error)), "error");
            });
          };
        }
        const saveCloseButton = document.getElementById("save-close-wizard");
        if (saveCloseButton instanceof HTMLButtonElement) {
          saveCloseButton.onclick = () => {
            void saveEnvAndCloseWizard().catch(() => {});
          };
        }
        [
          ["stations-save-btn", "stations"],
          ["provider-save-btn", "provider"],
          ["languages-save-btn", "languages"],
          ["diagnostics-save-btn", "diagnostics"],
          ["license-save-btn", "license"]
        ].forEach(([buttonId, sectionId]) => {
          const button = document.getElementById(buttonId);
          if (button instanceof HTMLButtonElement) {
            button.onclick = () => {
              void saveWizardSection(sectionId).catch(() => {});
            };
          }
        });
        const providerTestButton = document.getElementById("run-provider-test");
        if (providerTestButton instanceof HTMLButtonElement) {
          providerTestButton.onclick = () => {
            void runProviderTest().catch(() => {});
          };
        }
        const providerSpeechButton = document.getElementById("run-provider-speech-test");
        if (providerSpeechButton instanceof HTMLButtonElement) {
          providerSpeechButton.onclick = () => {
            void runProviderSpeechTest().catch(() => {});
          };
        }
        const runTtsButton = document.getElementById("run-tts-test");
        if (runTtsButton instanceof HTMLButtonElement) {
          runTtsButton.onclick = () => {
            void runAction(runProviderPlaybackTest, "", actionsCopy.providerPlaybackFailed).catch(() => {});
          };
        }
        const stopTtsButton = document.getElementById("stop-tts-test");
        if (stopTtsButton instanceof HTMLButtonElement) {
          stopTtsButton.onclick = () => {
            void runAction(
              stopProviderPlaybackTest,
              bootstrapCopy().providerPlaybackStopped,
              bootstrapCopy().providerPlaybackStopFailed
            ).catch(() => {});
          };
        }
        document.querySelectorAll("[data-provider-test-mode]").forEach((button) => {
          button.onclick = () => {
            applyProviderTestPanelMode(button.getAttribute("data-provider-test-mode"));
          };
        });
        ["A","B"].forEach((side) => {
          const testButton = document.getElementById("microphone-test-" + side);
          if (testButton instanceof HTMLButtonElement) {
            testButton.onclick = async () => {
              if (activeTests[side]) {
                await stopMicTest(side);
              } else {
                await startMicTest(side);
              }
            };
          }
        });
        const toggleMonitorSetup = document.getElementById("toggle-monitor-setup");
        if (toggleMonitorSetup instanceof HTMLButtonElement) {
          updateMonitorSetupToggle();
          toggleMonitorSetup.onclick = async () => {
            const monitorSetupActive = Boolean(state?.monitorSetupSessionActive);
            if (!monitorSetupActive) {
              await runAction(
                () => api.openMonitorSetup(),
                bootstrapCopy().displaySetupStarted,
                bootstrapCopy().displaySetupStartFailed
              );
            } else {
              await runAction(
                () => api.closeMonitorSetup(),
                bootstrapCopy().displaySetupClosed,
                bootstrapCopy().displaySetupCloseFailed
              );
            }
            updateMonitorSetupToggle();
          };
        }
        const openRuntimeLogsButton = document.getElementById("open-runtime-logs");
        if (openRuntimeLogsButton instanceof HTMLButtonElement) {
          openRuntimeLogsButton.onclick = async () => {
            const result = await runAction(
              () => api.openLogsFolder(),
              "",
              bootstrapCopy().openRuntimeLogsFailed
            );
            setStatus(bootstrapCopy().runtimeLogsOpened + result.path, "info");
          };
        }
        const refreshDisplaysButton = document.getElementById("refresh-displays");
        if (refreshDisplaysButton instanceof HTMLButtonElement) {
          refreshDisplaysButton.onclick = async () => {
            state = await runAction(
              () => api.getState(),
              bootstrapCopy().setupStateRefreshed,
              bootstrapCopy().refreshSetupStateFailed
            );
            render();
            await refreshPreview();
          };
        }
      }
      async function initialize() {
        if (!api) {
          throw new Error(bootstrapCopy().missingWizardBridge);
        }
        state = await api.getState();
        applyLocalizedResources(state.envValues.SETUP_UI_LANGUAGE || wizardUiLanguage);
        reconcileTransientWizardUi(null, state, { forceFullReset: true });
        await refreshAzureTextToSpeechCatalog();
        render();
        wireShellEventHandlers();
        await initializeLicenseSection().catch((error) => {
          setStatus(bootstrapCopy().licenseLoadError + (error?.message || String(error)), "error");
        });
        api.onState((nextState) => {
          reconcileTransientWizardUi(state, nextState);
          state = nextState;
          void autoApplySingleMicrophoneIfNeeded().catch(() => {});
          void refreshAzureTextToSpeechCatalog();
          const nextUiLanguage = normalizeWizardUiLanguage(nextState.envValues.SETUP_UI_LANGUAGE || wizardUiLanguage);
          if (nextUiLanguage !== wizardUiLanguage) {
            void applyWizardUiLanguage(nextUiLanguage).then(() => refreshPreview()).catch((error) => {
              setStatus(bootstrapCopy().refreshPreviewFailed + (error?.message || String(error)), "error");
            });
            return;
          }
          render();
          void refreshPreview().catch((error) => {
            setStatus(bootstrapCopy().refreshPreviewFailed + (error?.message || String(error)), "error");
          });
        });
        if (api.onTextToSpeechEvent) {
          api.onTextToSpeechEvent((event) => {
            handleProviderPlaybackEvent(event);
          });
        }
        setActiveSection(activeSection, { behavior: "auto" });
        void refreshPreview().catch((error) => {
          setStatus(bootstrapCopy().refreshPreviewFailed + (error?.message || String(error)), "error");
        });
        if (!state.microphones.length || !state.microphonePermissionGranted) {
          void probeMicrophones().catch((error) => {
            setStatus(bootstrapCopy().microphoneProbeFailed + (error?.message || String(error)), "error");
          });
        }
      }
      window.addEventListener("beforeunload", async () => {
        await stopMicTest("A");
        await stopMicTest("B");
        await stopProviderPlaybackTest();
        if (providerSpeechTestState.recorder) {
          try {
            await stopProviderSpeechRecorder();
          } catch {}
        }
      });
      window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          api.closeMonitorSetup();
          updateMonitorSetupToggle();
        }
      });
      window.addEventListener("error", (event) => {
        setStatus(bootstrapCopy().setupUiError + event.message, "error");
      });
      window.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason && event.reason.message ? event.reason.message : String(event.reason);
        setStatus(bootstrapCopy().asyncSetupError + reason, "error");
      });
      initialize().catch((error) => {
        setStatus(bootstrapCopy().setupInitializationFailed + (error?.message || String(error)), "error");
      });`;
}
