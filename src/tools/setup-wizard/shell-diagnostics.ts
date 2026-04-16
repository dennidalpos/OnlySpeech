import { normalizeSetupWizardUiLanguage, type SetupWizardUiLanguage } from "./localization.js";
import { getSetupWizardSectionSaveBarHtml } from "./shell-section-save-bar.js";
import {
  getSetupWizardSurfaceActionButtonHtml,
  getSetupWizardCardHeaderHtml,
  getSetupWizardDisclosureHtml,
  getSetupWizardSectionHeaderHtml
} from "./shell-primitives.js";

export function getSetupWizardDiagnosticsShellHtml(uiLanguage: SetupWizardUiLanguage = "en"): string {
  const normalizedLanguage = normalizeSetupWizardUiLanguage(uiLanguage);
  const copyByLanguage: Readonly<Record<SetupWizardUiLanguage, Record<string, string>>> = {
    en: {
      diagnostics: "Diagnostics",
      title: "Diagnostics and provider tests",
      description: "Run concise validation first, then open technical output only when you need details.",
      openLogs: "Open runtime logs folder",
      openLogsIndicator: "Opens folder",
      openLogsDescription: "Opens the runtime logs folder in the system shell.",
      microphoneChecks: "Microphone checks",
      microphoneChecksDescription: "Validate signal presence on each station before running provider tests.",
      microphoneSignalA: "Microphone signal A",
      microphoneSignalB: "Microphone signal B",
      microphoneSignalLevelA: "Microphone signal level A",
      microphoneSignalLevelB: "Microphone signal level B",
      startTest: "Start test",
      providerValidation: "Provider validation",
      providerValidationDescription: "Use translation or speech validation without mixing the result details into the main controls.",
      providerTest: "Provider test",
      providerTestMode: "Provider test mode",
      textMode: "Text",
      voiceMode: "Voice",
      testSourceLanguage: "Test source language",
      testTargetLanguage: "Test target language",
      sampleText: "Sample text",
      translationSample: "Hello, this is a translation test.",
      providerTestInProgress: "Provider test in progress",
      providerTestInProgressDetail: "The provider is processing the sample translation.",
      inProgress: "In progress",
      runProviderTest: "Run provider test",
      testMicrophone: "Test microphone",
      speechTestSourceLanguage: "Speech test source language",
      speechTestTargetLanguage: "Speech test target language",
      providerSpeechInProgress: "Speech test in progress",
      providerSpeechInProgressDetail: "The provider is listening or finishing the final processing step.",
      providerSpeechAria: "Provider microphone test in progress",
      runProviderMicrophoneTest: "Start microphone test",
      providerPlaybackTest: "Provider speech playback test",
      providerPlaybackDescription: "Keep playback validation available even when runtime playback is disabled for normal sessions.",
      playbackLanguage: "Playback language",
      playbackSample: "Hello, this is a provider speech playback test.",
      playTest: "Play test",
      stopTest: "Stop test",
      providerResultSummary: "Latest provider result",
      providerSpeechSummary: "Latest speech result",
      playbackSummary: "Latest playback result",
      technicalOutput: "Technical output"
    },
    it: {
      diagnostics: "Diagnostica",
      title: "Diagnostica e test provider",
      description: "Esegui prima una validazione sintetica, poi apri l'output tecnico solo quando serve.",
      openLogs: "Apri cartella log runtime",
      openLogsIndicator: "Apre cartella",
      openLogsDescription: "Apre la cartella dei log runtime nella shell di sistema.",
      microphoneChecks: "Controlli microfono",
      microphoneChecksDescription: "Verifica il segnale su ciascuna postazione prima dei test provider.",
      microphoneSignalA: "Segnale microfono A",
      microphoneSignalB: "Segnale microfono B",
      microphoneSignalLevelA: "Livello segnale microfono A",
      microphoneSignalLevelB: "Livello segnale microfono B",
      startTest: "Avvia test",
      providerValidation: "Validazione provider",
      providerValidationDescription: "Usa test testo o voce senza mescolare i dettagli tecnici ai controlli principali.",
      providerTest: "Test provider",
      providerTestMode: "Modalita test provider",
      textMode: "Testo",
      voiceMode: "Voce",
      testSourceLanguage: "Lingua sorgente test",
      testTargetLanguage: "Lingua target test",
      sampleText: "Testo di prova",
      translationSample: "Buongiorno, questo e' un test di traduzione.",
      providerTestInProgress: "Test provider in corso",
      providerTestInProgressDetail: "Il provider sta elaborando la traduzione di prova.",
      inProgress: "In corso",
      runProviderTest: "Esegui test provider",
      testMicrophone: "Microfono test",
      speechTestSourceLanguage: "Lingua sorgente test speech",
      speechTestTargetLanguage: "Lingua target test speech",
      providerSpeechInProgress: "Test speech in corso",
      providerSpeechInProgressDetail: "Il provider sta ascoltando o completando l'elaborazione finale.",
      providerSpeechAria: "Test provider con microfono in corso",
      runProviderMicrophoneTest: "Avvia test con microfono",
      providerPlaybackTest: "Test riproduzione provider",
      providerPlaybackDescription: "Mantieni disponibile la validazione playback anche quando la riproduzione runtime e' disattivata.",
      playbackLanguage: "Lingua playback",
      playbackSample: "Buongiorno, questo e' un test di riproduzione provider.",
      playTest: "Riproduci test",
      stopTest: "Ferma test",
      providerResultSummary: "Ultimo risultato provider",
      providerSpeechSummary: "Ultimo risultato speech",
      playbackSummary: "Ultimo risultato playback",
      technicalOutput: "Output tecnico"
    },
    es: {
      diagnostics: "Diagnostico",
      title: "Diagnostico y pruebas del proveedor",
      description: "Ejecuta primero una validacion concisa y abre la salida tecnica solo cuando haga falta.",
      openLogs: "Abrir carpeta de logs runtime",
      openLogsIndicator: "Abre carpeta",
      openLogsDescription: "Abre la carpeta de logs runtime en la shell del sistema.",
      microphoneChecks: "Comprobaciones de microfono",
      microphoneChecksDescription: "Valida la presencia de senal en cada puesto antes de probar el proveedor.",
      microphoneSignalA: "Senal del microfono A",
      microphoneSignalB: "Senal del microfono B",
      microphoneSignalLevelA: "Nivel de senal del microfono A",
      microphoneSignalLevelB: "Nivel de senal del microfono B",
      startTest: "Iniciar prueba",
      providerValidation: "Validacion del proveedor",
      providerValidationDescription: "Usa validacion de texto o voz sin mezclar el detalle tecnico con los controles principales.",
      providerTest: "Prueba del proveedor",
      providerTestMode: "Modo de prueba del proveedor",
      textMode: "Texto",
      voiceMode: "Voz",
      testSourceLanguage: "Idioma de origen de prueba",
      testTargetLanguage: "Idioma de destino de prueba",
      sampleText: "Texto de muestra",
      translationSample: "Hola, esta es una prueba de traduccion.",
      providerTestInProgress: "Prueba del proveedor en curso",
      providerTestInProgressDetail: "El proveedor esta procesando la traduccion de muestra.",
      inProgress: "En curso",
      runProviderTest: "Ejecutar prueba del proveedor",
      testMicrophone: "Microfono de prueba",
      speechTestSourceLanguage: "Idioma de origen de la prueba de voz",
      speechTestTargetLanguage: "Idioma de destino de la prueba de voz",
      providerSpeechInProgress: "Prueba de voz en curso",
      providerSpeechInProgressDetail: "El proveedor esta escuchando o completando el procesamiento final.",
      providerSpeechAria: "Prueba del proveedor con microfono en curso",
      runProviderMicrophoneTest: "Iniciar prueba con microfono",
      providerPlaybackTest: "Prueba de reproduccion del proveedor",
      providerPlaybackDescription: "Mantiene disponible la validacion de reproduccion incluso si el playback runtime esta desactivado.",
      playbackLanguage: "Idioma de reproduccion",
      playbackSample: "Hola, esta es una prueba de reproduccion del proveedor.",
      playTest: "Reproducir prueba",
      stopTest: "Detener prueba",
      providerResultSummary: "Ultimo resultado del proveedor",
      providerSpeechSummary: "Ultimo resultado de voz",
      playbackSummary: "Ultimo resultado de reproduccion",
      technicalOutput: "Salida tecnica"
    },
    fr: {
      diagnostics: "Diagnostic",
      title: "Diagnostic et tests du fournisseur",
      description: "Lancez d'abord une validation concise, puis ouvrez la sortie technique seulement si necessaire.",
      openLogs: "Ouvrir le dossier des logs runtime",
      openLogsIndicator: "Ouvre le dossier",
      openLogsDescription: "Ouvre le dossier des logs runtime dans la shell du systeme.",
      microphoneChecks: "Controles microphone",
      microphoneChecksDescription: "Validez le signal sur chaque poste avant de lancer les tests fournisseur.",
      microphoneSignalA: "Signal microphone A",
      microphoneSignalB: "Signal microphone B",
      microphoneSignalLevelA: "Niveau du signal microphone A",
      microphoneSignalLevelB: "Niveau du signal microphone B",
      startTest: "Demarrer le test",
      providerValidation: "Validation fournisseur",
      providerValidationDescription: "Utilisez la validation texte ou voix sans melanger les details techniques aux controles principaux.",
      providerTest: "Test fournisseur",
      providerTestMode: "Mode de test fournisseur",
      textMode: "Texte",
      voiceMode: "Voix",
      testSourceLanguage: "Langue source du test",
      testTargetLanguage: "Langue cible du test",
      sampleText: "Texte d'exemple",
      translationSample: "Bonjour, ceci est un test de traduction.",
      providerTestInProgress: "Test fournisseur en cours",
      providerTestInProgressDetail: "Le fournisseur traite la traduction d'exemple.",
      inProgress: "En cours",
      runProviderTest: "Lancer le test fournisseur",
      testMicrophone: "Microphone de test",
      speechTestSourceLanguage: "Langue source du test vocal",
      speechTestTargetLanguage: "Langue cible du test vocal",
      providerSpeechInProgress: "Test vocal en cours",
      providerSpeechInProgressDetail: "Le fournisseur ecoute ou termine le traitement final.",
      providerSpeechAria: "Test micro du fournisseur en cours",
      runProviderMicrophoneTest: "Demarrer le test micro",
      providerPlaybackTest: "Test de lecture fournisseur",
      providerPlaybackDescription: "Conserve la validation de lecture meme si la lecture runtime est desactivee.",
      playbackLanguage: "Langue de lecture",
      playbackSample: "Bonjour, ceci est un test de lecture du fournisseur.",
      playTest: "Lire le test",
      stopTest: "Arreter le test",
      providerResultSummary: "Dernier resultat fournisseur",
      providerSpeechSummary: "Dernier resultat vocal",
      playbackSummary: "Dernier resultat de lecture",
      technicalOutput: "Sortie technique"
    },
    de: {
      diagnostics: "Diagnose",
      title: "Diagnose und Anbieter-Tests",
      description: "Fuehren Sie zuerst eine kompakte Validierung aus und oeffnen Sie die technische Ausgabe nur bei Bedarf.",
      openLogs: "Runtime-Logordner oeffnen",
      openLogsIndicator: "Oeffnet Ordner",
      openLogsDescription: "Oeffnet den Runtime-Logordner in der System-Shell.",
      microphoneChecks: "Mikrofonpruefung",
      microphoneChecksDescription: "Pruefen Sie das Signal jeder Station, bevor Sie Anbieter-Tests starten.",
      microphoneSignalA: "Mikrofonsignal A",
      microphoneSignalB: "Mikrofonsignal B",
      microphoneSignalLevelA: "Mikrofonsignalpegel A",
      microphoneSignalLevelB: "Mikrofonsignalpegel B",
      startTest: "Test starten",
      providerValidation: "Anbieter-Validierung",
      providerValidationDescription: "Nutzen Sie Text- oder Sprachvalidierung, ohne technische Details mit den Hauptsteuerelementen zu mischen.",
      providerTest: "Anbieter-Test",
      providerTestMode: "Anbieter-Testmodus",
      textMode: "Text",
      voiceMode: "Sprache",
      testSourceLanguage: "Quellsprache fuer den Test",
      testTargetLanguage: "Zielsprache fuer den Test",
      sampleText: "Beispieltext",
      translationSample: "Hallo, dies ist ein Uebersetzungstest.",
      providerTestInProgress: "Anbieter-Test laeuft",
      providerTestInProgressDetail: "Der Anbieter verarbeitet die Beispieluebersetzung.",
      inProgress: "Laeuft",
      runProviderTest: "Anbieter-Test ausfuehren",
      testMicrophone: "Testmikrofon",
      speechTestSourceLanguage: "Quellsprache fuer den Sprechtest",
      speechTestTargetLanguage: "Zielsprache fuer den Sprechtest",
      providerSpeechInProgress: "Sprechtest laeuft",
      providerSpeechInProgressDetail: "Der Anbieter hoert zu oder beendet den letzten Verarbeitungsschritt.",
      providerSpeechAria: "Mikrofontest des Anbieters laeuft",
      runProviderMicrophoneTest: "Mikrofontest starten",
      providerPlaybackTest: "Anbieter-Wiedergabetest",
      providerPlaybackDescription: "Haelt die Wiedergabevalidierung verfuegbar, auch wenn Runtime-Wiedergabe deaktiviert ist.",
      playbackLanguage: "Wiedergabesprache",
      playbackSample: "Hallo, dies ist ein Wiedergabetest des Anbieters.",
      playTest: "Test wiedergeben",
      stopTest: "Test stoppen",
      providerResultSummary: "Letztes Anbieter-Ergebnis",
      providerSpeechSummary: "Letztes Sprach-Ergebnis",
      playbackSummary: "Letztes Wiedergabe-Ergebnis",
      technicalOutput: "Technische Ausgabe"
    },
    zh: {
      diagnostics: "诊断",
      title: "诊断和服务商测试",
      description: "先运行简洁校验，需要时再展开技术输出。",
      openLogs: "打开 runtime 日志目录",
      openLogsIndicator: "打开目录",
      openLogsDescription: "在系统 shell 中打开 runtime 日志目录。",
      microphoneChecks: "麦克风检查",
      microphoneChecksDescription: "在运行服务商测试前先确认每个工作站都有信号。",
      microphoneSignalA: "麦克风信号 A",
      microphoneSignalB: "麦克风信号 B",
      microphoneSignalLevelA: "麦克风信号等级 A",
      microphoneSignalLevelB: "麦克风信号等级 B",
      startTest: "开始测试",
      providerValidation: "服务商校验",
      providerValidationDescription: "使用文本或语音校验，同时把技术细节放到折叠区。",
      providerTest: "服务商测试",
      providerTestMode: "服务商测试模式",
      textMode: "文本",
      voiceMode: "语音",
      testSourceLanguage: "测试源语言",
      testTargetLanguage: "测试目标语言",
      sampleText: "示例文本",
      translationSample: "你好，这是一次翻译测试。",
      providerTestInProgress: "服务商测试进行中",
      providerTestInProgressDetail: "服务商正在处理示例翻译。",
      inProgress: "进行中",
      runProviderTest: "运行服务商测试",
      testMicrophone: "测试麦克风",
      speechTestSourceLanguage: "语音测试源语言",
      speechTestTargetLanguage: "语音测试目标语言",
      providerSpeechInProgress: "语音测试进行中",
      providerSpeechInProgressDetail: "服务商正在监听或完成最后处理步骤。",
      providerSpeechAria: "服务商麦克风测试进行中",
      runProviderMicrophoneTest: "开始麦克风测试",
      providerPlaybackTest: "服务商播放测试",
      providerPlaybackDescription: "即使常规 runtime 播放被关闭，也保留播放校验。",
      playbackLanguage: "播放语言",
      playbackSample: "你好，这是一次服务商播放测试。",
      playTest: "播放测试",
      stopTest: "停止测试",
      providerResultSummary: "最近一次服务商结果",
      providerSpeechSummary: "最近一次语音结果",
      playbackSummary: "最近一次播放结果",
      technicalOutput: "技术输出"
    }
  };
  const copy = copyByLanguage[normalizedLanguage];
  return `
      <section class="panel section-panel" data-section-target="diagnostics" data-accent="tests" tabindex="-1">
${getSetupWizardSectionHeaderHtml({
  eyebrow: copy.diagnostics,
  title: copy.title,
  actionsHtml: getSetupWizardSurfaceActionButtonHtml({
    id: "open-runtime-logs",
    label: copy.openLogs,
    indicator: copy.openLogsIndicator,
    description: copy.openLogsDescription
  })
})}
        <article class="card settings-card">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.microphoneChecks,
  title: copy.microphoneChecks,
  description: copy.microphoneChecksDescription
})}
          <div class="test-stations-grid">
            <article class="card side-A diagnostic-subcard">
              <h3>${copy.microphoneSignalA}</h3>
              <div class="meter top-gap" id="microphone-signal-A" role="progressbar" aria-label="${copy.microphoneSignalLevelA}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="meter-bar" id="microphone-meter-A" style="width:0%;"></div></div>
              <div class="actions top-gap">
                <button class="secondary wizard-action" type="button" id="microphone-test-A">${copy.startTest}</button>
              </div>
            </article>
            <article class="card side-B diagnostic-subcard">
              <h3>${copy.microphoneSignalB}</h3>
              <div class="meter top-gap" id="microphone-signal-B" role="progressbar" aria-label="${copy.microphoneSignalLevelB}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="meter-bar" id="microphone-meter-B" style="width:0%;"></div></div>
              <div class="actions top-gap">
                <button class="secondary wizard-action" type="button" id="microphone-test-B">${copy.startTest}</button>
              </div>
            </article>
          </div>
        </article>
        <details class="card settings-card wizard-disclosure" id="provider-validation-disclosure">
          <summary>
            <span class="disclosure-heading">${copy.providerValidation}</span>
          </summary>
          <div class="wizard-disclosure-body">
        <article id="provider-speech-card" aria-busy="false">
          <div class="actions segmented-actions" role="radiogroup" aria-label="${copy.providerTestMode}">
            <button class="secondary is-active wizard-action" type="button" id="provider-test-mode-text" data-provider-test-mode="text" role="radio" aria-checked="true" aria-pressed="true">${copy.textMode}</button>
            <button class="secondary wizard-action" type="button" id="provider-test-mode-voice" data-provider-test-mode="voice" role="radio" aria-checked="false" aria-pressed="false">${copy.voiceMode}</button>
          </div>
          <div id="provider-test-panel-text" data-provider-test-panel="text">
            <div id="provider-test-card" aria-busy="false">
              <div class="form-grid">
                <label>${copy.testSourceLanguage}
                  <select id="provider-test-source"></select>
                </label>
                <label>${copy.testTargetLanguage}
                  <select id="provider-test-target"></select>
                </label>
              </div>
              <label class="top-gap">${copy.sampleText}
                <textarea id="provider-test-text">${copy.translationSample}</textarea>
              </label>
              <div id="provider-test-progress" class="section-progress section-progress-inline top-gap" hidden aria-live="polite" aria-busy="false">
                <div class="section-progress-copy">
                  <strong id="provider-test-progress-label">${copy.providerTestInProgress}</strong>
                  <span id="provider-test-progress-detail">${copy.providerTestInProgressDetail}</span>
                </div>
                <div class="meter meter-indeterminate" role="progressbar" aria-label="${copy.providerTestInProgress}" aria-valuetext="${copy.inProgress}">
                  <div class="meter-bar meter-bar-indeterminate"></div>
                </div>
              </div>
              <div class="actions top-gap">
                <button class="secondary wizard-action" type="button" id="run-provider-test">${copy.runProviderTest}</button>
              </div>
              <div id="provider-test-summary" class="notice info top-gap">${copy.providerResultSummary}</div>
${getSetupWizardDisclosureHtml({
  summary: copy.technicalOutput,
  detailsClass: "wizard-disclosure technical-disclosure top-gap",
  bodyHtml: `<pre id="provider-test-result" class="output test-result" aria-live="polite"></pre>`
})}
            </div>
          </div>
          <div id="provider-test-panel-voice" data-provider-test-panel="voice" hidden>
            <div id="provider-speech-notices" class="notice-stack" aria-live="polite"></div>
            <div class="form-grid">
              <label>${copy.testMicrophone}
                <select id="provider-speech-microphone"></select>
              </label>
              <label>${copy.speechTestSourceLanguage}
                <select id="provider-speech-source"></select>
              </label>
              <label>${copy.speechTestTargetLanguage}
                <select id="provider-speech-target"></select>
              </label>
            </div>
            <div id="provider-speech-progress" class="section-progress section-progress-inline top-gap" hidden aria-live="polite" aria-busy="false">
              <div class="section-progress-copy">
                <strong id="provider-speech-progress-label">${copy.providerSpeechInProgress}</strong>
                <span id="provider-speech-progress-detail">${copy.providerSpeechInProgressDetail}</span>
              </div>
              <div class="meter meter-indeterminate" role="progressbar" aria-label="${copy.providerSpeechAria}" aria-valuetext="${copy.inProgress}">
                <div class="meter-bar meter-bar-indeterminate"></div>
              </div>
            </div>
            <div class="actions top-gap">
              <button class="secondary wizard-action" type="button" id="run-provider-speech-test">${copy.runProviderMicrophoneTest}</button>
            </div>
            <div id="provider-speech-summary" class="notice info top-gap">${copy.providerSpeechSummary}</div>
${getSetupWizardDisclosureHtml({
  summary: copy.technicalOutput,
  detailsClass: "wizard-disclosure technical-disclosure top-gap",
  bodyHtml: `<pre id="provider-speech-result" class="output test-result" aria-live="polite"></pre>`
})}
          </div>
        </article>
          </div>
        </details>
        <details class="card settings-card wizard-disclosure" id="playback-test-disclosure">
          <summary>
            <span class="disclosure-heading">${copy.providerPlaybackTest}</span>
          </summary>
          <div class="wizard-disclosure-body">
          <div id="tts-test-notices" class="notice-stack" aria-live="polite"></div>
          <div class="form-grid">
            <label>${copy.playbackLanguage}
              <select id="tts-test-language"></select>
            </label>
          </div>
          <label class="top-gap">${copy.sampleText}
            <textarea id="tts-test-text">${copy.playbackSample}</textarea>
          </label>
          <div class="actions top-gap">
            <button class="secondary wizard-action" type="button" id="run-tts-test">${copy.playTest}</button>
            <button class="danger wizard-action" type="button" id="stop-tts-test">${copy.stopTest}</button>
          </div>
          <div id="tts-test-summary" class="notice info top-gap">${copy.playbackSummary}</div>
${getSetupWizardDisclosureHtml({
  summary: copy.technicalOutput,
  detailsClass: "wizard-disclosure technical-disclosure top-gap",
  bodyHtml: `<pre id="tts-test-result" class="output test-result" aria-live="polite"></pre>`
})}
          </div>
        </details>
${getSetupWizardSectionSaveBarHtml("diagnostics-save-btn", normalizedLanguage)}
      </section>
  `;
}
