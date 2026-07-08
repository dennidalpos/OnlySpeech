import { normalizeSetupWizardUiLanguage, type SetupWizardUiLanguage } from "./localization.js";
import { getSetupWizardSectionSaveLabel } from "./shell-section-save-bar.js";
import {
  getSetupWizardCardHeaderHtml,
  getSetupWizardDisclosureHtml,
  getSetupWizardSectionHeaderHtml
} from "./shell-primitives.js";

export function getSetupWizardReviewShellHtml(uiLanguage: SetupWizardUiLanguage = "en"): string {
  const normalizedLanguage = normalizeSetupWizardUiLanguage(uiLanguage);
  const copyByLanguage: Readonly<Record<SetupWizardUiLanguage, Record<string, string>>> = {
    en: {
      save: "Save",
      title: "Review and apply configuration",
      finalReview: "Final review",
      automaticStartup: "Automatic startup",
      autostartOn: "Enable",
      autostartOff: "Disable",
      advanced: "Advanced settings",
      advancedDescription: "Open only when you need runtime tuning, disclosure customization, or direct env parameters.",
      idleTimers: "Idle timers",
      idleClear: "Idle clear",
      clearSeconds: "Clear seconds",
      idleHardReset: "Idle hard reset",
      hardResetSeconds: "Hard reset seconds",
      audioAndSession: "Audio and session",
      languageQuality: "Language quality",
      languageContractMode: "Provider language contract",
      chatGptSttPrompt: "ChatGPT STT language prompt",
      chatGptDetectedLanguageMode: "ChatGPT detected language mode",
      openAiTtsInstructions: "OpenAI TTS language instructions",
      azureTtsLangElement: "Azure TTS SSML language",
      audioDiagnostics: "Audio capture diagnostics",
      visitorHistory: "Visitor-side history",
      echoCancellation: "Echo cancellation",
      noiseSuppression: "Noise suppression",
      logLevel: "Log level",
      aiNotice: "AI-assisted use notice",
      noticeMode: "Notice mode",
      globalCustomText: "Global custom text",
      customTextPlaceholder: "Enter the text you want to show in runtime and setup.",
      customTextNote:
        "Use one shared text for both stations and the setup wizard. Blank lines become paragraph separators.",
      advancedParameters: "Advanced parameters",
      finalActions: "Final configuration actions",
      applyAndClose: "Apply and close setup",
      envPreview: "Technical env preview",
      passwordSetupTitle: "Setup Wizard Password",
      passwordSetupDescription: "Choose a secure password to restrict access to this setup wizard in the future (minimum 12 characters).",
      passwordSetupLabel: "New password",
      passwordConfirmLabel: "Confirm password"
    },
    it: {
      save: "Salva",
      title: "Conferma e applica configurazione",
      finalReview: "Riepilogo finale",
      automaticStartup: "Avvio automatico",
      autostartOn: "Attiva",
      autostartOff: "Disattiva",
      advanced: "Impostazioni avanzate",
      advancedDescription: "Apri solo quando servono tuning runtime, personalizzazione disclosure o parametri env diretti.",
      idleTimers: "Timer inattivita'",
      idleClear: "Clear inattivita'",
      clearSeconds: "Secondi clear",
      idleHardReset: "Hard reset inattivita'",
      hardResetSeconds: "Secondi hard reset",
      audioAndSession: "Audio e sessione",
      languageQuality: "Qualita lingua",
      languageContractMode: "Contratto lingua provider",
      chatGptSttPrompt: "Prompt lingua STT ChatGPT",
      chatGptDetectedLanguageMode: "Detection lingua ChatGPT",
      openAiTtsInstructions: "Istruzioni lingua TTS OpenAI",
      azureTtsLangElement: "Lingua SSML TTS Azure",
      audioDiagnostics: "Diagnostica acquisizione audio",
      visitorHistory: "Storico lato utente",
      echoCancellation: "Cancellazione eco",
      noiseSuppression: "Riduzione rumore",
      logLevel: "Livello log",
      aiNotice: "Avviso uso assistito da AI",
      noticeMode: "Modalita avviso",
      globalCustomText: "Testo personalizzato globale",
      customTextPlaceholder: "Inserisci il testo che vuoi mostrare su runtime e wizard.",
      customTextNote:
        "Usa un solo testo condiviso per entrambe le postazioni e per il wizard. Le righe vuote diventano separatori di paragrafo.",
      advancedParameters: "Parametri avanzati",
      finalActions: "Azioni finali configurazione",
      applyAndClose: "Applica e chiudi wizard",
      envPreview: "Anteprima tecnica env",
      passwordSetupTitle: "Password del Setup Wizard",
      passwordSetupDescription: "Scegli una password sicura per limitare l'accesso a questo wizard in futuro (minimo 12 caratteri).",
      passwordSetupLabel: "Nuova password",
      passwordConfirmLabel: "Conferma password"
    },
    es: {
      save: "Guardar",
      title: "Revisar y aplicar configuracion",
      finalReview: "Resumen final",
      automaticStartup: "Inicio automatico",
      autostartOn: "Activar",
      autostartOff: "Desactivar",
      advanced: "Ajustes avanzados",
      advancedDescription: "Abre esta zona solo cuando necesites ajustes runtime, personalizacion del aviso o parametros env directos.",
      idleTimers: "Temporizadores de inactividad",
      idleClear: "Limpieza por inactividad",
      clearSeconds: "Segundos de limpieza",
      idleHardReset: "Reinicio duro por inactividad",
      hardResetSeconds: "Segundos de reinicio duro",
      audioAndSession: "Audio y sesion",
      languageQuality: "Calidad de idioma",
      languageContractMode: "Contrato de idioma del proveedor",
      chatGptSttPrompt: "Prompt de idioma STT ChatGPT",
      chatGptDetectedLanguageMode: "Deteccion de idioma ChatGPT",
      openAiTtsInstructions: "Instrucciones de idioma TTS OpenAI",
      azureTtsLangElement: "Idioma SSML TTS Azure",
      audioDiagnostics: "Diagnostico de captura audio",
      visitorHistory: "Historial del lado usuario",
      echoCancellation: "Cancelacion de eco",
      noiseSuppression: "Reduccion de ruido",
      logLevel: "Nivel de log",
      aiNotice: "Aviso de uso asistido por IA",
      noticeMode: "Modo del aviso",
      globalCustomText: "Texto personalizado global",
      customTextPlaceholder: "Introduce el texto que quieres mostrar en runtime y setup.",
      customTextNote:
        "Usa un unico texto compartido para ambos lados y para el asistente. Las lineas vacias separan parrafos.",
      advancedParameters: "Parametros avanzados",
      finalActions: "Acciones finales de configuracion",
      applyAndClose: "Aplicar y cerrar setup",
      envPreview: "Vista previa tecnica env",
      passwordSetupTitle: "Contraseña del Asistente",
      passwordSetupDescription: "Elige una contraseña segura para restringir el acceso a este asistente en el futuro (mínimo 12 caracteres).",
      passwordSetupLabel: "Nueva contraseña",
      passwordConfirmLabel: "Confirmar contraseña"
    },
    fr: {
      save: "Sauvegarder",
      title: "Verifier et appliquer la configuration",
      finalReview: "Revision finale",
      automaticStartup: "Demarrage automatique",
      autostartOn: "Activer",
      autostartOff: "Desactiver",
      advanced: "Reglages avances",
      advancedDescription: "Ouvrez seulement si vous avez besoin d'ajustements runtime, de personnalisation de l'avis ou de parametres env directs.",
      idleTimers: "Temporisateurs d'inactivite",
      idleClear: "Nettoyage d'inactivite",
      clearSeconds: "Secondes avant nettoyage",
      idleHardReset: "Reinitialisation dure d'inactivite",
      hardResetSeconds: "Secondes avant reinitialisation dure",
      audioAndSession: "Audio et session",
      languageQuality: "Qualite de langue",
      languageContractMode: "Contrat langue fournisseur",
      chatGptSttPrompt: "Prompt langue STT ChatGPT",
      chatGptDetectedLanguageMode: "Detection langue ChatGPT",
      openAiTtsInstructions: "Instructions langue TTS OpenAI",
      azureTtsLangElement: "Langue SSML TTS Azure",
      audioDiagnostics: "Diagnostic capture audio",
      visitorHistory: "Historique cote utilisateur",
      echoCancellation: "Annulation d'echo",
      noiseSuppression: "Reduction du bruit",
      logLevel: "Niveau de log",
      aiNotice: "Avis d'utilisation assistee par IA",
      noticeMode: "Mode d'avis",
      globalCustomText: "Texte personnalise global",
      customTextPlaceholder: "Saisissez le texte a afficher dans runtime et setup.",
      customTextNote:
        "Utilisez un seul texte partage pour les deux postes et l'assistant. Les lignes vides deviennent des separateurs de paragraphe.",
      advancedParameters: "Parametres avances",
      finalActions: "Actions finales de configuration",
      applyAndClose: "Appliquer et fermer le setup",
      envPreview: "Apercu technique env",
      passwordSetupTitle: "Mot de passe de l'assistant",
      passwordSetupDescription: "Choisissez un mot de passe sécurisé pour restreindre l'accès à cet assistant à l'avenir (minimum 12 caractères).",
      passwordSetupLabel: "Nouveau mot de passe",
      passwordConfirmLabel: "Confirmer le mot de passe"
    },
    de: {
      save: "Speichern",
      title: "Konfiguration pruefen und anwenden",
      finalReview: "Letzte Pruefung",
      automaticStartup: "Automatischer Start",
      autostartOn: "Aktivieren",
      autostartOff: "Deaktivieren",
      advanced: "Erweiterte Einstellungen",
      advancedDescription: "Nur oeffnen, wenn Runtime-Tuning, Hinweis-Anpassung oder direkte Env-Parameter noetig sind.",
      idleTimers: "Leerlauf-Timer",
      idleClear: "Leerlauf-Loeschung",
      clearSeconds: "Loeschsekunden",
      idleHardReset: "Harter Leerlauf-Reset",
      hardResetSeconds: "Sekunden bis Hard Reset",
      audioAndSession: "Audio und Sitzung",
      languageQuality: "Sprachqualitaet",
      languageContractMode: "Anbieter-Sprachvertrag",
      chatGptSttPrompt: "ChatGPT STT-Sprachprompt",
      chatGptDetectedLanguageMode: "ChatGPT-Spracherkennung",
      openAiTtsInstructions: "OpenAI TTS-Sprachanweisungen",
      azureTtsLangElement: "Azure TTS SSML-Sprache",
      audioDiagnostics: "Audioaufnahme-Diagnose",
      visitorHistory: "Verlauf auf der Nutzerseite",
      echoCancellation: "Echounterdrueckung",
      noiseSuppression: "Rauschunterdrueckung",
      logLevel: "Log-Stufe",
      aiNotice: "Hinweis zur KI-unterstuetzten Nutzung",
      noticeMode: "Hinweismodus",
      globalCustomText: "Globaler benutzerdefinierter Text",
      customTextPlaceholder: "Geben Sie den Text ein, der in Runtime und Setup angezeigt werden soll.",
      customTextNote:
        "Verwenden Sie einen gemeinsamen Text fuer beide Stationen und den Assistenten. Leere Zeilen werden zu Absatztrennern.",
      advancedParameters: "Erweiterte Parameter",
      finalActions: "Letzte Konfigurationsaktionen",
      applyAndClose: "Anwenden und Setup schliessen",
      envPreview: "Technische Env-Vorschau",
      passwordSetupTitle: "Setup-Assistent-Passwort",
      passwordSetupDescription: "Wählen Sie ein sicheres Passwort, um den Zugriff auf diesen Assistenten in Zukunft einzuschränken (mindestens 12 Zeichen).",
      passwordSetupLabel: "Neues Passwort",
      passwordConfirmLabel: "Passwort bestätigen"
    },
    zh: {
      save: "保存",
      title: "检查并应用配置",
      finalReview: "最终检查",
      automaticStartup: "自动启动",
      autostartOn: "启用",
      autostartOff: "禁用",
      advanced: "高级设置",
      advancedDescription: "仅在需要 runtime 调优、提示文本定制或直接 env 参数时展开。",
      idleTimers: "空闲计时器",
      idleClear: "空闲清理",
      clearSeconds: "清理秒数",
      idleHardReset: "空闲硬重置",
      hardResetSeconds: "硬重置秒数",
      audioAndSession: "音频和会话",
      languageQuality: "语言质量",
      languageContractMode: "服务商语言约束",
      chatGptSttPrompt: "ChatGPT STT 语言提示",
      chatGptDetectedLanguageMode: "ChatGPT 检测语言模式",
      openAiTtsInstructions: "OpenAI TTS 语言指令",
      azureTtsLangElement: "Azure TTS SSML 语言",
      audioDiagnostics: "音频采集诊断",
      visitorHistory: "用户侧历史",
      echoCancellation: "回声消除",
      noiseSuppression: "噪声抑制",
      logLevel: "日志级别",
      aiNotice: "AI 辅助使用提示",
      noticeMode: "提示模式",
      globalCustomText: "全局自定义文本",
      customTextPlaceholder: "输入你希望在 runtime 和 setup 中显示的文本。",
      customTextNote: "两侧工作站和设置向导共用同一段文本。空行会变成段落分隔。",
      advancedParameters: "高级参数",
      finalActions: "最终配置操作",
      applyAndClose: "应用并关闭 setup",
      envPreview: "技术 env 预览",
      passwordSetupTitle: "设置向导密码",
      passwordSetupDescription: "选择一个安全密码以限制将来对设置向导的访问（最少 12 个字符）。",
      passwordSetupLabel: "新密码",
      passwordConfirmLabel: "确认密码"
    }
  };
  const copy = copyByLanguage[normalizedLanguage];

  return `
      <section class="panel section-panel" data-section-target="save" data-accent="save" tabindex="-1">
${getSetupWizardSectionHeaderHtml({
  eyebrow: copy.save,
  title: copy.title
})}
        <div class="wizard-grid wizard-grid-2">
          <div class="card save-review-card">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.finalReview,
  title: copy.finalReview
})}
            <div id="save-review-strip" class="review-strip" aria-live="polite"></div>
            <div id="save-review-autostart" class="review-chip autostart-review-chip" aria-live="polite"></div>
          </div>
          <div class="card settings-card save-cta-card">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.finalActions,
  title: copy.finalActions
})}
            <input type="checkbox" id="autostart-enabled" class="field-hidden" aria-hidden="true" tabindex="-1" />
            <div class="autostart-control-row">
              <span class="card-eyebrow">${copy.automaticStartup}</span>
              <div class="segmented-actions">
                <button type="button" class="secondary segmented-action" id="autostart-enable-btn" aria-pressed="false">${copy.autostartOn}</button>
                <button type="button" class="secondary segmented-action" id="autostart-disable-btn" aria-pressed="false">${copy.autostartOff}</button>
              </div>
            </div>
            <div id="autostart-config-note" class="notice info" aria-live="polite" hidden></div>
            <div class="save-actions-bar save-actions-compact" aria-label="${copy.finalActions}">
              <button class="secondary wizard-action" type="button" id="save-section-save-btn">${getSetupWizardSectionSaveLabel(normalizedLanguage)}</button>
              <button class="primary wizard-action" type="button" id="save-close-wizard">${copy.applyAndClose}</button>
            </div>
            <div id="save-close-wizard-disabled-reason" class="notice warn" aria-live="polite" hidden></div>
            <div id="save-feedback" class="notice info" aria-live="polite" hidden></div>
          </div>
          <div class="card settings-card full-span" id="wizard-password-setup-card" hidden>
            <div class="card-header">
              <span class="card-eyebrow">${copy.finalReview}</span>
              <h3>${copy.passwordSetupTitle}</h3>
              <p>${copy.passwordSetupDescription}</p>
            </div>
            <div class="form-grid">
              <label>${copy.passwordSetupLabel}
                <input type="password" id="wizard-password" autocomplete="new-password" />
              </label>
              <label>${copy.passwordConfirmLabel}
                <input type="password" id="wizard-confirm-password" autocomplete="new-password" />
              </label>
            </div>
          </div>
        </div>
        <details class="card settings-card advanced-disclosure" id="advanced-settings">
          <summary>
            <span class="disclosure-heading">${copy.advanced}</span>
            <span class="disclosure-subtitle">${copy.advancedDescription}</span>
          </summary>
          <div class="wizard-disclosure-body">
            <div class="kiosk-card-grid top-gap">
              <div class="card kiosk-card">
                <h3>${copy.idleTimers}</h3>
                <div class="form-grid">
                  <label>${copy.idleClear}
                    <select id="idle-clear-enabled"></select>
                  </label>
                  <label>${copy.clearSeconds}
                    <input id="env-IDLE_CLEAR_SECONDS" data-env-key="IDLE_CLEAR_SECONDS" />
                  </label>
                  <label>${copy.idleHardReset}
                    <select id="idle-hard-reset-enabled"></select>
                  </label>
                  <label>${copy.hardResetSeconds}
                    <input id="env-IDLE_HARD_RESET_SECONDS" data-env-key="IDLE_HARD_RESET_SECONDS" />
                  </label>
                </div>
              </div>
              <div class="card kiosk-card">
                <h3>${copy.audioAndSession}</h3>
                <div class="form-grid">
                  <label>${copy.echoCancellation}
                    <select id="env-AUDIO_ECHO_CANCELLATION" data-env-key="AUDIO_ECHO_CANCELLATION"></select>
                  </label>
                  <label>${copy.noiseSuppression}
                    <select id="env-AUDIO_NOISE_SUPPRESSION" data-env-key="AUDIO_NOISE_SUPPRESSION"></select>
                  </label>
                  <label>${copy.logLevel}
                    <select id="env-LOG_LEVEL" data-env-key="LOG_LEVEL"></select>
                  </label>
                  <div class="review-readonly-field" aria-live="polite">
                    <span>${copy.visitorHistory}</span>
                    <strong id="save-review-visitor-history"></strong>
                  </div>
                </div>
              </div>
              <div class="card kiosk-card full-span">
                <h3>${copy.languageQuality}</h3>
                <div class="form-grid">
                  <label>${copy.languageContractMode}
                    <select id="env-PROVIDER_LANGUAGE_CONTRACT_MODE" data-env-key="PROVIDER_LANGUAGE_CONTRACT_MODE"></select>
                  </label>
                  <label>${copy.chatGptSttPrompt}
                    <select id="env-CHATGPT_STT_LANGUAGE_PROMPT_ENABLED" data-env-key="CHATGPT_STT_LANGUAGE_PROMPT_ENABLED"></select>
                  </label>
                  <label>${copy.chatGptDetectedLanguageMode}
                    <select id="env-CHATGPT_TRANSLATION_DETECTED_LANGUAGE_MODE" data-env-key="CHATGPT_TRANSLATION_DETECTED_LANGUAGE_MODE"></select>
                  </label>
                  <label>${copy.openAiTtsInstructions}
                    <select id="env-OPENAI_TTS_LANGUAGE_INSTRUCTIONS_ENABLED" data-env-key="OPENAI_TTS_LANGUAGE_INSTRUCTIONS_ENABLED"></select>
                  </label>
                  <label>${copy.azureTtsLangElement}
                    <select id="env-AZURE_TTS_LANG_ELEMENT_ENABLED" data-env-key="AZURE_TTS_LANG_ELEMENT_ENABLED"></select>
                  </label>
                  <label>${copy.audioDiagnostics}
                    <select id="env-AUDIO_CAPTURE_SETTINGS_DIAGNOSTICS_ENABLED" data-env-key="AUDIO_CAPTURE_SETTINGS_DIAGNOSTICS_ENABLED"></select>
                  </label>
                </div>
              </div>
              <div class="card kiosk-card full-span">
                <h3>${copy.aiNotice}</h3>
                <div class="form-grid">
                  <label>${copy.noticeMode}
                    <select id="env-RUNTIME_DISCLOSURE_MODE" data-env-key="RUNTIME_DISCLOSURE_MODE"></select>
                  </label>
                  <div></div>
                  <label id="runtime-disclosure-custom-field" class="full-span">${copy.globalCustomText}
                    <textarea
                      id="env-RUNTIME_DISCLOSURE_CUSTOM_TEXT"
                      data-env-key="RUNTIME_DISCLOSURE_CUSTOM_TEXT"
                      placeholder="${copy.customTextPlaceholder}"
                    ></textarea>
                  </label>
                </div>
                <div id="runtime-disclosure-config-note" class="notice info top-gap" aria-live="polite"></div>
              </div>
              <div class="card kiosk-card full-span">
                <h3>${copy.advancedParameters}</h3>
                <div id="env-form" class="form-grid"></div>
              </div>
${getSetupWizardDisclosureHtml({
  summary: copy.envPreview,
  detailsClass: "wizard-disclosure technical-disclosure full-span",
  bodyHtml: `<pre id="env-preview" class="output"></pre>`
})}
            </div>
          </div>
        </details>
      </section>
  `;
}
