import { getWizardSidePresentation } from "./shared.js";
import { normalizeSetupWizardUiLanguage, type SetupWizardUiLanguage } from "./localization.js";

export function getSetupWizardOverlayHtml(uiLanguage: SetupWizardUiLanguage = "en"): string {
  const normalizedLanguage = normalizeSetupWizardUiLanguage(uiLanguage);
  const wizardSidePresentationByLanguage: Readonly<Record<SetupWizardUiLanguage, ReturnType<typeof getWizardSidePresentation>>> = {
    en: getWizardSidePresentation("en"),
    it: getWizardSidePresentation("it"),
    es: getWizardSidePresentation("es"),
    fr: getWizardSidePresentation("fr"),
    de: getWizardSidePresentation("de"),
    zh: getWizardSidePresentation("zh")
  };
  const wizardSidePresentation = wizardSidePresentationByLanguage[normalizedLanguage];
  const sideA = wizardSidePresentation.A;
  const sideB = wizardSidePresentation.B;
  const copyByLanguage: Readonly<Record<SetupWizardUiLanguage, Record<string, string>>> = {
    en: {
      title: "OnlySpeech Display Wizard",
      unassignedDisplay: "Display not assigned",
      verifyBothStations: "Finish setup after verifying both stations.",
      unassignedMicrophone: "Microphone not assigned",
      microphoneLabel: "Microphone",
      loadingMicrophoneProfile: "Loading runtime microphone profile.",
      startTest: "Start test",
      stopTest: "Stop test",
      stopping: "Stopping...",
      pressButtonToAssign: "Press a button to assign this display.",
      assignToStationA: `Assign to ${sideA.shortTitle}`,
      assignToStationB: `Assign to ${sideB.shortTitle}`,
      stationAAssigned: `${sideA.shortTitle} assigned`,
      stationBAssigned: `${sideB.shortTitle} assigned`,
      removeAssignment: "Remove assignment",
      closeMonitorSetup: "Close display setup",
      unnamedMicrophone: "Unnamed microphone",
      uncategorizedMicrophoneGroup: "Other",
      selectMicrophone: "Select microphone",
      probingMicrophones: "Probing microphones...",
      microphonesDetected: "Detected microphones: {count}.",
      noMicrophonesFound: "No microphone found.",
      microphonePermissionDenied: "Microphone permission denied. Visible microphones: {count}.",
      microphoneProbeFailed: "Unable to detect microphones: {detail}",
      microphoneTestStopped: "Microphone test stopped for {station}.",
      selectMicrophoneFirst: "Select a microphone for {station} first.",
      microphoneTestStarted: "Microphone test started for {station}.",
      unableStartMicrophoneTest: "Unable to start the microphone test for {station}: {detail}",
      assignDisplayFirst: "Assign this display to a station first.",
      displayReady: "{station} ready for verification.",
      assignDisplayPrompt: "Assign this display to one of the two stations.",
      microphonePrefix: "Microphone: ",
      microphoneUnassignedInline: "not assigned",
      assignDisplayBeforeMicrophone: "Assign the display first",
      sharedMicrophoneProfile: "Active profile: 1 shared microphone. The selection on this display is mirrored to both stations.",
      dedicatedMicrophoneProfile: "Active profile: 2 dedicated microphones. Each display keeps the microphone assigned to its station.",
      microphoneUpdated: "Microphone updated.",
      microphoneRemoved: "Microphone removed.",
      unableToUpdateMicrophone: "Unable to update the microphone",
      assigning: "Assigning...",
      displayAssigned: "{station} assigned.",
      unableToAssignDisplay: "Unable to assign the display",
      displayAssignmentRemoved: "Display assignment removed.",
      unableToRemoveDisplayAssignment: "Unable to remove the assignment",
      missingWizardBridge: "The setup wizard bridge is not available in this window.",
      overlayErrorPrefix: "Overlay error: ",
      overlayAsyncErrorPrefix: "Async overlay error: ",
      overlayInitFailedPrefix: "Overlay initialization failed: ",
      displayIdLabel: "Display ID"
    },
    it: {
      title: "OnlySpeech Display Wizard",
      unassignedDisplay: "Monitor non assegnato",
      verifyBothStations: "Termina il setup quando hai verificato entrambe le postazioni.",
      unassignedMicrophone: "Microfono non assegnato",
      microphoneLabel: "Microfono",
      loadingMicrophoneProfile: "Profilo microfono runtime in caricamento.",
      startTest: "Avvia test",
      stopTest: "Ferma test",
      stopping: "Arresto...",
      pressButtonToAssign: "Premi un pulsante per assegnare questo monitor.",
      assignToStationA: `Assegna a ${sideA.shortTitle}`,
      assignToStationB: `Assegna a ${sideB.shortTitle}`,
      stationAAssigned: `${sideA.shortTitle} assegnata`,
      stationBAssigned: `${sideB.shortTitle} assegnata`,
      removeAssignment: "Rimuovi assegnazione",
      closeMonitorSetup: "Termina setup monitor",
      unnamedMicrophone: "Microfono senza nome",
      uncategorizedMicrophoneGroup: "Altro",
      selectMicrophone: "Seleziona microfono",
      probingMicrophones: "Rilevamento microfoni in corso...",
      microphonesDetected: "Microfoni rilevati: {count}.",
      noMicrophonesFound: "Nessun microfono trovato.",
      microphonePermissionDenied: "Permesso microfono non concesso. Microfoni visibili: {count}.",
      microphoneProbeFailed: "Impossibile rilevare i microfoni: {detail}",
      microphoneTestStopped: "Test microfono fermato per {station}.",
      selectMicrophoneFirst: "Seleziona prima un microfono per {station}.",
      microphoneTestStarted: "Test microfono avviato per {station}.",
      unableStartMicrophoneTest: "Impossibile avviare il test microfono per {station}: {detail}",
      assignDisplayFirst: "Assegna prima questo monitor a una postazione.",
      displayReady: "{station} pronta per la verifica.",
      assignDisplayPrompt: "Assegna questo monitor a una delle due postazioni.",
      microphonePrefix: "Microfono: ",
      microphoneUnassignedInline: "non assegnato",
      assignDisplayBeforeMicrophone: "Assegna prima il monitor",
      sharedMicrophoneProfile: "Profilo attivo: 1 microfono condiviso. La selezione su questo monitor viene riflessa su entrambe le postazioni.",
      dedicatedMicrophoneProfile: "Profilo attivo: 2 microfoni dedicati. Ogni monitor mantiene il microfono della propria postazione.",
      microphoneUpdated: "Microfono aggiornato.",
      microphoneRemoved: "Microfono rimosso.",
      unableToUpdateMicrophone: "Impossibile aggiornare il microfono",
      assigning: "Assegnazione...",
      displayAssigned: "{station} assegnata.",
      unableToAssignDisplay: "Impossibile assegnare il monitor",
      displayAssignmentRemoved: "Assegnazione monitor rimossa.",
      unableToRemoveDisplayAssignment: "Impossibile rimuovere l'assegnazione",
      missingWizardBridge: "Il bridge del setup wizard non e' disponibile in questa finestra.",
      overlayErrorPrefix: "Errore overlay: ",
      overlayAsyncErrorPrefix: "Errore async overlay: ",
      overlayInitFailedPrefix: "Inizializzazione overlay fallita: ",
      displayIdLabel: "Display ID"
    },
    es: {
      title: "OnlySpeech Display Wizard",
      unassignedDisplay: "Monitor sin asignar",
      verifyBothStations: "Termina el setup cuando hayas verificado ambos puestos.",
      unassignedMicrophone: "Microfono sin asignar",
      microphoneLabel: "Microfono",
      loadingMicrophoneProfile: "Cargando el perfil runtime del microfono.",
      startTest: "Iniciar prueba",
      stopTest: "Detener prueba",
      stopping: "Deteniendo...",
      pressButtonToAssign: "Pulsa un boton para asignar este monitor.",
      assignToStationA: `Asignar a ${sideA.shortTitle}`,
      assignToStationB: `Asignar a ${sideB.shortTitle}`,
      stationAAssigned: `${sideA.shortTitle} asignado`,
      stationBAssigned: `${sideB.shortTitle} asignado`,
      removeAssignment: "Quitar asignacion",
      closeMonitorSetup: "Cerrar setup de monitores",
      unnamedMicrophone: "Microfono sin nombre",
      uncategorizedMicrophoneGroup: "Otro",
      selectMicrophone: "Selecciona microfono",
      probingMicrophones: "Detectando microfonos...",
      microphonesDetected: "Microfonos detectados: {count}.",
      noMicrophonesFound: "No se encontro ningun microfono.",
      microphonePermissionDenied: "Permiso de microfono denegado. Microfonos visibles: {count}.",
      microphoneProbeFailed: "No se pudieron detectar los microfonos: {detail}",
      microphoneTestStopped: "Prueba de microfono detenida para {station}.",
      selectMicrophoneFirst: "Selecciona antes un microfono para {station}.",
      microphoneTestStarted: "Prueba de microfono iniciada para {station}.",
      unableStartMicrophoneTest: "No se pudo iniciar la prueba de microfono para {station}: {detail}",
      assignDisplayFirst: "Asigna primero este monitor a un puesto.",
      displayReady: "{station} lista para la verificacion.",
      assignDisplayPrompt: "Asigna este monitor a uno de los dos puestos.",
      microphonePrefix: "Microfono: ",
      microphoneUnassignedInline: "sin asignar",
      assignDisplayBeforeMicrophone: "Asigna primero el monitor",
      sharedMicrophoneProfile: "Perfil activo: 1 microfono compartido. La seleccion en este monitor se replica en ambos puestos.",
      dedicatedMicrophoneProfile: "Perfil activo: 2 microfonos dedicados. Cada monitor mantiene el microfono asignado a su puesto.",
      microphoneUpdated: "Microfono actualizado.",
      microphoneRemoved: "Microfono eliminado.",
      unableToUpdateMicrophone: "No se pudo actualizar el microfono",
      assigning: "Asignando...",
      displayAssigned: "{station} asignado.",
      unableToAssignDisplay: "No se pudo asignar el monitor",
      displayAssignmentRemoved: "Asignacion del monitor eliminada.",
      unableToRemoveDisplayAssignment: "No se pudo eliminar la asignacion",
      missingWizardBridge: "El bridge del setup wizard no esta disponible en esta ventana.",
      overlayErrorPrefix: "Error del overlay: ",
      overlayAsyncErrorPrefix: "Error async del overlay: ",
      overlayInitFailedPrefix: "Fallo al iniciar el overlay: ",
      displayIdLabel: "Display ID"
    },
    fr: {
      title: "OnlySpeech Display Wizard",
      unassignedDisplay: "Ecran non assigne",
      verifyBothStations: "Terminez le setup apres verification des deux postes.",
      unassignedMicrophone: "Microphone non assigne",
      microphoneLabel: "Microphone",
      loadingMicrophoneProfile: "Chargement du profil runtime du microphone.",
      startTest: "Demarrer le test",
      stopTest: "Arreter le test",
      stopping: "Arret...",
      pressButtonToAssign: "Appuyez sur un bouton pour assigner cet ecran.",
      assignToStationA: `Assigner a ${sideA.shortTitle}`,
      assignToStationB: `Assigner a ${sideB.shortTitle}`,
      stationAAssigned: `${sideA.shortTitle} assigne`,
      stationBAssigned: `${sideB.shortTitle} assigne`,
      removeAssignment: "Retirer l'affectation",
      closeMonitorSetup: "Fermer le setup ecran",
      unnamedMicrophone: "Microphone sans nom",
      uncategorizedMicrophoneGroup: "Autre",
      selectMicrophone: "Selectionner un microphone",
      probingMicrophones: "Detection des microphones...",
      microphonesDetected: "Microphones detectes : {count}.",
      noMicrophonesFound: "Aucun microphone trouve.",
      microphonePermissionDenied: "Permission microphone refusee. Microphones visibles : {count}.",
      microphoneProbeFailed: "Impossible de detecter les microphones : {detail}",
      microphoneTestStopped: "Test micro arrete pour {station}.",
      selectMicrophoneFirst: "Selectionnez d'abord un microphone pour {station}.",
      microphoneTestStarted: "Test micro demarre pour {station}.",
      unableStartMicrophoneTest: "Impossible de demarrer le test micro pour {station} : {detail}",
      assignDisplayFirst: "Assignez d'abord cet ecran a un poste.",
      displayReady: "{station} pret pour la verification.",
      assignDisplayPrompt: "Assignez cet ecran a l'un des deux postes.",
      microphonePrefix: "Microphone : ",
      microphoneUnassignedInline: "non assigne",
      assignDisplayBeforeMicrophone: "Assignez d'abord l'ecran",
      sharedMicrophoneProfile: "Profil actif : 1 microphone partage. La selection sur cet ecran est recopiee sur les deux postes.",
      dedicatedMicrophoneProfile: "Profil actif : 2 microphones dedies. Chaque ecran conserve le microphone de son poste.",
      microphoneUpdated: "Microphone mis a jour.",
      microphoneRemoved: "Microphone retire.",
      unableToUpdateMicrophone: "Impossible de mettre a jour le microphone",
      assigning: "Affectation...",
      displayAssigned: "{station} assigne.",
      unableToAssignDisplay: "Impossible d'assigner l'ecran",
      displayAssignmentRemoved: "Affectation de l'ecran retiree.",
      unableToRemoveDisplayAssignment: "Impossible de retirer l'affectation",
      missingWizardBridge: "Le bridge du setup wizard n'est pas disponible dans cette fenetre.",
      overlayErrorPrefix: "Erreur overlay : ",
      overlayAsyncErrorPrefix: "Erreur async overlay : ",
      overlayInitFailedPrefix: "Echec de l'initialisation de l'overlay : ",
      displayIdLabel: "Display ID"
    },
    de: {
      title: "OnlySpeech Display Wizard",
      unassignedDisplay: "Monitor nicht zugewiesen",
      verifyBothStations: "Beenden Sie das Setup erst nach der Pruefung beider Stationen.",
      unassignedMicrophone: "Mikrofon nicht zugewiesen",
      microphoneLabel: "Mikrofon",
      loadingMicrophoneProfile: "Runtime-Mikrofonprofil wird geladen.",
      startTest: "Test starten",
      stopTest: "Test stoppen",
      stopping: "Wird gestoppt...",
      pressButtonToAssign: "Druecken Sie eine Taste, um diesen Monitor zuzuweisen.",
      assignToStationA: `Zu ${sideA.shortTitle} zuweisen`,
      assignToStationB: `Zu ${sideB.shortTitle} zuweisen`,
      stationAAssigned: `${sideA.shortTitle} zugewiesen`,
      stationBAssigned: `${sideB.shortTitle} zugewiesen`,
      removeAssignment: "Zuweisung entfernen",
      closeMonitorSetup: "Monitor-Setup schliessen",
      unnamedMicrophone: "Unbenanntes Mikrofon",
      uncategorizedMicrophoneGroup: "Sonstiges",
      selectMicrophone: "Mikrofon waehlen",
      probingMicrophones: "Mikrofone werden erkannt...",
      microphonesDetected: "Erkannte Mikrofone: {count}.",
      noMicrophonesFound: "Kein Mikrofon gefunden.",
      microphonePermissionDenied: "Mikrofonberechtigung verweigert. Sichtbare Mikrofone: {count}.",
      microphoneProbeFailed: "Mikrofone konnten nicht erkannt werden: {detail}",
      microphoneTestStopped: "Mikrofontest fuer {station} gestoppt.",
      selectMicrophoneFirst: "Waehlen Sie zuerst ein Mikrofon fuer {station}.",
      microphoneTestStarted: "Mikrofontest fuer {station} gestartet.",
      unableStartMicrophoneTest: "Mikrofontest fuer {station} konnte nicht gestartet werden: {detail}",
      assignDisplayFirst: "Weisen Sie diesen Monitor zuerst einer Station zu.",
      displayReady: "{station} ist bereit fuer die Pruefung.",
      assignDisplayPrompt: "Weisen Sie diesen Monitor einer der beiden Stationen zu.",
      microphonePrefix: "Mikrofon: ",
      microphoneUnassignedInline: "nicht zugewiesen",
      assignDisplayBeforeMicrophone: "Weisen Sie zuerst den Monitor zu",
      sharedMicrophoneProfile: "Aktives Profil: 1 gemeinsames Mikrofon. Die Auswahl auf diesem Monitor wird auf beide Stationen gespiegelt.",
      dedicatedMicrophoneProfile: "Aktives Profil: 2 dedizierte Mikrofone. Jeder Monitor behaelt das Mikrofon seiner Station.",
      microphoneUpdated: "Mikrofon aktualisiert.",
      microphoneRemoved: "Mikrofon entfernt.",
      unableToUpdateMicrophone: "Mikrofon konnte nicht aktualisiert werden",
      assigning: "Zuweisung...",
      displayAssigned: "{station} zugewiesen.",
      unableToAssignDisplay: "Monitor konnte nicht zugewiesen werden",
      displayAssignmentRemoved: "Monitorzuweisung entfernt.",
      unableToRemoveDisplayAssignment: "Zuweisung konnte nicht entfernt werden",
      missingWizardBridge: "Die Setup-Wizard-Bridge ist in diesem Fenster nicht verfuegbar.",
      overlayErrorPrefix: "Overlay-Fehler: ",
      overlayAsyncErrorPrefix: "Async-Overlay-Fehler: ",
      overlayInitFailedPrefix: "Overlay-Initialisierung fehlgeschlagen: ",
      displayIdLabel: "Display ID"
    },
    zh: {
      title: "OnlySpeech Display Wizard",
      unassignedDisplay: "显示器未分配",
      verifyBothStations: "完成两侧工作站验证后再结束设置。",
      unassignedMicrophone: "麦克风未分配",
      microphoneLabel: "麦克风",
      loadingMicrophoneProfile: "正在加载 runtime 麦克风配置。",
      startTest: "开始测试",
      stopTest: "停止测试",
      stopping: "正在停止...",
      pressButtonToAssign: "按下一个按钮来分配这台显示器。",
      assignToStationA: `分配给 ${sideA.shortTitle}`,
      assignToStationB: `分配给 ${sideB.shortTitle}`,
      stationAAssigned: `${sideA.shortTitle} 已分配`,
      stationBAssigned: `${sideB.shortTitle} 已分配`,
      removeAssignment: "移除分配",
      closeMonitorSetup: "关闭显示器设置",
      unnamedMicrophone: "未命名麦克风",
      uncategorizedMicrophoneGroup: "其他",
      selectMicrophone: "选择麦克风",
      probingMicrophones: "正在探测麦克风...",
      microphonesDetected: "已探测到麦克风：{count}。",
      noMicrophonesFound: "未找到麦克风。",
      microphonePermissionDenied: "麦克风权限被拒绝。可见麦克风：{count}。",
      microphoneProbeFailed: "无法探测麦克风：{detail}",
      microphoneTestStopped: "{station} 的麦克风测试已停止。",
      selectMicrophoneFirst: "请先为 {station} 选择一个麦克风。",
      microphoneTestStarted: "{station} 的麦克风测试已开始。",
      unableStartMicrophoneTest: "无法为 {station} 启动麦克风测试：{detail}",
      assignDisplayFirst: "请先把这台显示器分配到某个工作站。",
      displayReady: "{station} 已准备好验证。",
      assignDisplayPrompt: "将这台显示器分配到两个工作站中的一个。",
      microphonePrefix: "麦克风：",
      microphoneUnassignedInline: "未分配",
      assignDisplayBeforeMicrophone: "请先分配显示器",
      sharedMicrophoneProfile: "当前配置：1 个共享麦克风。此显示器上的选择会同步到两侧工作站。",
      dedicatedMicrophoneProfile: "当前配置：2 个独立麦克风。每台显示器保持自己工作站的麦克风分配。",
      microphoneUpdated: "麦克风已更新。",
      microphoneRemoved: "麦克风已移除。",
      unableToUpdateMicrophone: "无法更新麦克风",
      assigning: "正在分配...",
      displayAssigned: "{station} 已分配。",
      unableToAssignDisplay: "无法分配显示器",
      displayAssignmentRemoved: "显示器分配已移除。",
      unableToRemoveDisplayAssignment: "无法移除分配",
      missingWizardBridge: "此窗口中无法使用 setup wizard bridge。",
      overlayErrorPrefix: "Overlay 错误：",
      overlayAsyncErrorPrefix: "Overlay 异步错误：",
      overlayInitFailedPrefix: "Overlay 初始化失败：",
      displayIdLabel: "Display ID"
    }
  };
  const copy = copyByLanguage[normalizedLanguage];

  return `<!doctype html>
<html lang="${normalizedLanguage}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${copy.title}</title>
    <style>
      :root {
        color-scheme: dark;
        --text:#f4f7fb;
        --muted:#bfd2de;
        --focus:#fde68a;
        --panel:rgba(7,15,25,.82);
        --panel-border:rgba(255,255,255,.12);
        --shadow:0 24px 80px rgba(0,0,0,.35);
        --side-a:#6fe7ff;
        --side-b:#ffcb70;
        --accent-warm:#ffb54a;
        --accent-warm-strong:#ff9151;
        --accent-cool:#55d6ff;
        --accent-cool-strong:#1b88cc;
        --danger:#ff6a63;
      }
      * { box-sizing: border-box; }
      body {
        margin:0;
        min-height:100vh;
        font-family:"Segoe UI","Arial Nova",sans-serif;
        color:var(--text);
        display:grid;
        place-items:center;
        overflow:hidden;
        background:
          radial-gradient(circle at top left, rgba(85,214,255,.24), transparent 30%),
          radial-gradient(circle at top right, rgba(255,181,74,.18), transparent 26%),
          linear-gradient(160deg, #091018 0%, #17344a 100%);
        transition:background .2s ease;
      }
      body.side-A {
        background:
          radial-gradient(circle at top left, rgba(85,214,255,.3), transparent 30%),
          radial-gradient(circle at bottom right, rgba(111,231,255,.18), transparent 24%),
          linear-gradient(160deg, #091018 0%, #14334a 100%);
      }
      body.side-B {
        background:
          radial-gradient(circle at top left, rgba(255,181,74,.28), transparent 30%),
          radial-gradient(circle at bottom right, rgba(255,145,81,.18), transparent 24%),
          linear-gradient(160deg, #16101a 0%, #3a221e 100%);
      }
      body.side-unassigned {
        background:
          radial-gradient(circle at top left, rgba(148,163,184,.22), transparent 28%),
          linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
      }
      .canvas {
        width:min(92vw,1200px);
        display:grid;
        gap:22px;
        align-items:center;
        text-align:center;
      }
      .display-side { font-size:clamp(30px,5vw,64px); font-weight:800; line-height:1.1; }
      .display-role { font-size:clamp(18px,2vw,30px); color:var(--muted); }
      .display-info { font-size:clamp(15px,1.8vw,24px); line-height:1.45; }
      .display-meta { font-size:clamp(14px,1.4vw,20px); opacity:.88; }
      .badge-strip,.actions { display:flex; justify-content:center; gap:12px; flex-wrap:wrap; }
      .side-badge {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        padding:10px 14px;
        border-radius:999px;
        border:1px solid rgba(255,255,255,.18);
        background:rgba(255,255,255,.12);
        font-size:15px;
      }
      .side-badge.side-A { color:var(--side-a); }
      .side-badge.side-B { color:var(--side-b); }
      .overlay-controls {
        width:min(760px,82vw);
        margin:0 auto;
        display:grid;
        gap:14px;
        padding:20px;
        border-radius:24px;
        background:var(--panel);
        border:1px solid var(--panel-border);
        box-shadow:var(--shadow);
        backdrop-filter: blur(10px);
      }
      .overlay-controls label { display:grid; gap:8px; font-size:18px; text-align:left; color:var(--muted); }
      .status {
        max-width:min(880px,84vw);
        margin:0 auto;
        padding:12px 14px;
        border-radius:18px;
        background:rgba(255,255,255,.08);
        border:1px solid rgba(255,255,255,.16);
        color:#d7f6ff;
        font-size:16px;
      }
      .meter {
        height:22px;
        width:min(480px,78vw);
        margin:0 auto;
        background:rgba(255,255,255,.14);
        border-radius:999px;
        overflow:hidden;
        border:1px solid rgba(255,255,255,.2);
      }
      .meter-bar {
        height:100%;
        width:0%;
        background:linear-gradient(90deg, #22c55e, #eab308, #ef4444);
        transition:width 80ms linear;
      }
      button {
        border:1px solid transparent;
        border-radius:18px;
        padding:14px 18px;
        font:inherit;
        font-size:18px;
        cursor:pointer;
        touch-action:manipulation;
        transition:transform .15s ease, border-color .15s ease, background .15s ease, box-shadow .15s ease;
      }
      button:hover:not(:disabled):not(.is-active) {
        transform:translateY(-1px);
        border-color:rgba(85,214,255,.28);
        box-shadow:0 18px 50px rgba(85,214,255,.12);
      }
      .primary { background:linear-gradient(135deg, var(--accent-warm), var(--accent-warm-strong)); color:#10161f; font-weight:700; }
      .secondary { background:rgba(255,255,255,.08); color:var(--text); border-color:rgba(255,255,255,.16); }
      .ghost { background:transparent; color:var(--muted); border:1px dashed rgba(255,255,255,.24); }
      .danger { color:#ffd3d1; border-color:rgba(255,106,99,.24); }
      .is-active {
        background:linear-gradient(135deg, rgba(85,214,255,.22), rgba(27,136,204,.28));
        color:var(--text);
        border-color:rgba(85,214,255,.3);
        box-shadow:0 0 0 1px rgba(255,255,255,.08), 0 0 0 4px rgba(85,214,255,.12);
      }
      button.is-busy,
      button:disabled {
        transform:none;
        box-shadow:none;
        opacity:.7;
      }
      button:focus-visible {
        outline:none;
        border-color:var(--focus);
        box-shadow:0 0 0 3px rgba(253,230,138,.24);
      }
      select { font:inherit; width:100%; padding:12px 14px; border-radius:14px; border:1px solid rgba(255,255,255,.18); background:rgba(0,0,0,.22); color:#f8fafc; font-size:18px; }
      select:focus-visible { outline:none; border-color:var(--focus); box-shadow:0 0 0 3px rgba(253,230,138,.24); }
      select option, select optgroup { color:#07111f; background:#d7e6fb; font-style:normal; }
    </style>
  </head>
  <body class="side-unassigned">
      <div class="canvas">
        <div class="badge-strip">
        <span class="side-badge side-A" id="overlay-badge-a">${sideA.stationTitle}</span>
        <span class="side-badge side-B" id="overlay-badge-b">${sideB.stationTitle}</span>
        </div>
        <div class="display-side" id="display-side">${copy.unassignedDisplay}</div>
        <div class="display-role" id="display-role">${copy.verifyBothStations}</div>
        <div class="display-info" id="display-info"></div>
        <div class="display-meta" id="microphone-info">${copy.unassignedMicrophone}</div>
        <div class="overlay-controls">
        <label><span id="overlay-microphone-label">${copy.microphoneLabel}</span>
          <select id="overlay-microphone-select" disabled></select>
        </label>
        <div class="display-meta" id="overlay-microphone-profile">${copy.loadingMicrophoneProfile}</div>
        <div class="actions">
          <button class="primary" type="button" id="overlay-microphone-test" aria-busy="false">${copy.startTest}</button>
        </div>
      </div>
      <div class="status" id="overlay-status" aria-live="polite">${copy.pressButtonToAssign}</div>
      <div class="meter"><div class="meter-bar" id="meter-bar"></div></div>
      <div class="actions">
        <button class="secondary" type="button" id="assign-a" aria-busy="false">${copy.assignToStationA}</button>
        <button class="secondary" type="button" id="assign-b" aria-busy="false">${copy.assignToStationB}</button>
        <button class="ghost danger" type="button" id="clear-display">${copy.removeAssignment}</button>
        <button class="secondary" type="button" id="close-monitor-setup">${copy.closeMonitorSetup}</button>
      </div>
    </div>
    <script>
      const api = window.onlySpeechWizard;
      const displayId = Number(new URLSearchParams(window.location.search).get("displayId"));
      const nonSelectableIds = new Set(["default","communications"]);
      const copyByLanguage = ${JSON.stringify(copyByLanguage)};
      const wizardSidePresentationByLanguage = ${JSON.stringify(wizardSidePresentationByLanguage)};
      let overlayUiLanguage = ${JSON.stringify(normalizedLanguage)};
      let copy = copyByLanguage[overlayUiLanguage] || copyByLanguage.en;
      let wizardSidePresentation = wizardSidePresentationByLanguage[overlayUiLanguage] || wizardSidePresentationByLanguage.en;
      const microphoneCategoryOrder = ["usb","analog","bluetooth","hdmi","virtual","network","other"];
      const signalReportThrottleMs = 120;
      const overlayUiActionState = {
        probingMicrophones: false,
        assignDisplay: ""
      };
      let state = null;
      let activeTest = null;
      let overlaySelectedMicrophoneId = "";
      function normalizeOverlayUiLanguage(value) {
        const normalized = String(value || "").trim().toLowerCase();
        return copyByLanguage[normalized] ? normalized : "en";
      }
      function formatCopy(template, values = {}) {
        return String(template).replace(/\\{(\\w+)\\}/g, (_match, key) => String(values[key] ?? ""));
      }
      function applyOverlayUiLanguage(nextLanguage) {
        const normalizedLanguage = normalizeOverlayUiLanguage(nextLanguage);
        if (normalizedLanguage === overlayUiLanguage) {
          return;
        }
        overlayUiLanguage = normalizedLanguage;
        copy = copyByLanguage[overlayUiLanguage] || copyByLanguage.en;
        wizardSidePresentation =
          wizardSidePresentationByLanguage[overlayUiLanguage] || wizardSidePresentationByLanguage.en;
        document.documentElement.lang = overlayUiLanguage;
        document.title = copy.title;
      }
      function setOverlayStatus(message) {
        const element = document.getElementById("overlay-status");
        if (element) {
          element.textContent = message;
        }
      }
      function escapeHtml(value) {
        return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
      }
      function setOverlayBusy(actionKey, value) {
        if (actionKey === "assignDisplay") {
          overlayUiActionState.assignDisplay = value || "";
        } else {
          overlayUiActionState[actionKey] = Boolean(value);
        }
        render();
      }
      async function withOverlayBusy(actionKey, value, action) {
        setOverlayBusy(actionKey, value === undefined ? true : value);
        try {
          return await action();
        } finally {
          setOverlayBusy(actionKey, actionKey === "assignDisplay" ? "" : false);
        }
      }
      function sidePresentation(side) {
        return wizardSidePresentation[side];
      }
      function selectedMicrophone(side) {
        return state.microphones.find((item) => item.assignedSides.includes(side)) || null;
      }
      function microphoneDisplayName(microphone) {
        return microphone?.displayLabel || microphone?.label || copy.unnamedMicrophone;
      }
      function groupMicrophones() {
        const grouped = new Map();
        for (const microphone of state.microphones) {
          const key = microphone.connectionType || "other";
          if (!grouped.has(key)) {
            grouped.set(key, { label: microphone.connectionLabel || copy.uncategorizedMicrophoneGroup, items: [] });
          }
          grouped.get(key).items.push(microphone);
        }
        return grouped;
      }
      function microphoneSelectOptionsHtml(selectedId) {
        const options = ['<option value="">' + escapeHtml(copy.selectMicrophone) + '</option>'];
        const grouped = groupMicrophones();
        for (const key of microphoneCategoryOrder) {
          const group = grouped.get(key);
          if (!group || group.items.length === 0) { continue; }
          options.push('<optgroup label="' + escapeHtml(group.label) + '">');
          for (const mic of group.items) {
            const sel = mic.deviceId === selectedId ? " selected" : "";
            options.push('<option value="' + escapeHtml(mic.deviceId) + '"' + sel + '>' + escapeHtml(microphoneDisplayName(mic)) + '</option>');
          }
          options.push("</optgroup>");
        }
        return options.join("");
      }
      async function probeMicrophonesFromOverlay() {
        setOverlayStatus(copy.probingMicrophones);
        await withOverlayBusy("probingMicrophones", true, async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            stream.getTracks().forEach((track) => track.stop());
            const microphones = (await navigator.mediaDevices.enumerateDevices())
              .filter((device) => device.kind === "audioinput")
              .map((device) => ({ deviceId: device.deviceId, groupId: device.groupId, label: device.label || copy.unnamedMicrophone }))
              .filter((device) => !nonSelectableIds.has(device.deviceId));
            await api.updateMicrophones({ microphones, microphonePermissionGranted: true, microphoneError: null });
            setOverlayStatus(microphones.length > 0 ? formatCopy(copy.microphonesDetected, { count: microphones.length }) : copy.noMicrophonesFound);
          } catch (error) {
            try {
              const fallback = (await navigator.mediaDevices.enumerateDevices())
                .filter((device) => device.kind === "audioinput")
                .map((device) => ({ deviceId: device.deviceId, groupId: device.groupId, label: device.label || copy.unnamedMicrophone }))
                .filter((device) => !nonSelectableIds.has(device.deviceId));
              await api.updateMicrophones({ microphones: fallback, microphonePermissionGranted: false, microphoneError: error?.message || String(error) });
              setOverlayStatus(formatCopy(copy.microphonePermissionDenied, { count: fallback.length }));
            } catch {
              setOverlayStatus(formatCopy(copy.microphoneProbeFailed, { detail: error?.message || String(error) }));
            }
          }
        });
      }
      async function stopOverlayMicTest(silent = false) {
        if (!activeTest) {
          return;
        }
        activeTest.stopping = true;
        render();
        cancelAnimationFrame(activeTest.rafId);
        activeTest.stopped = true;
        activeTest.stream.getTracks().forEach((track) => track.stop());
        try {
          await activeTest.audioContext.close();
        } catch {}
        const finishedSide = activeTest.side;
        activeTest = null;
        document.getElementById("meter-bar").style.width = "0%";
        await api.updateSignalLevel(finishedSide, 0);
        render();
        if (!silent) {
          setOverlayStatus(formatCopy(copy.microphoneTestStopped, { station: sidePresentation(finishedSide).stationTitle }));
        }
      }
      async function startOverlayMicTest(side, microphone) {
        if (!microphone) {
          setOverlayStatus(formatCopy(copy.selectMicrophoneFirst, { station: sidePresentation(side).stationTitle }));
          return;
        }
        if (activeTest) {
          await stopOverlayMicTest(true);
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: microphone.deviceId } }, video: false });
          const audioContext = new AudioContext();
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 1024;
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          const samples = new Float32Array(analyser.fftSize);
          const testState = {
            side,
            deviceId: microphone.deviceId,
            stream,
            audioContext,
            analyser,
            rafId: 0,
            stopping: false,
            stopped: false,
            lastReportedAt: 0,
            lastReportedLevel: -1
          };
          const tick = () => {
            if (!activeTest || activeTest !== testState || testState.stopped) {
              return;
            }
            analyser.getFloatTimeDomainData(samples);
            let sum = 0;
            for (const sample of samples) {
              sum += sample * sample;
            }
            const level = Math.max(0, Math.min(1, Math.sqrt(sum / samples.length) * 5));
            document.getElementById("meter-bar").style.width = Math.round(level * 100) + "%";
            const now = Date.now();
            if (now - testState.lastReportedAt >= signalReportThrottleMs && Math.abs(level - testState.lastReportedLevel) >= 0.03) {
              testState.lastReportedAt = now;
              testState.lastReportedLevel = level;
              void api.updateSignalLevel(side, level);
            }
            testState.rafId = requestAnimationFrame(tick);
          };
          activeTest = testState;
          testState.rafId = requestAnimationFrame(tick);
          render();
          setOverlayStatus(formatCopy(copy.microphoneTestStarted, { station: sidePresentation(side).stationTitle }));
        } catch (error) {
          setOverlayStatus(formatCopy(copy.unableStartMicrophoneTest, { station: sidePresentation(side).stationTitle, detail: error?.message || String(error) }));
        }
      }
      async function runOverlayAction(action, successMessage, errorPrefix) {
        try {
          await action();
          setOverlayStatus(successMessage);
        } catch (error) {
          setOverlayStatus(errorPrefix + ": " + (error?.message || String(error)));
          throw error;
        }
      }
      function render() {
        const display = state.displays.find((item) => item.displayId === displayId);
        if (!display) {
          return;
        }
        const badgeA = document.getElementById("overlay-badge-a");
        const badgeB = document.getElementById("overlay-badge-b");
        const microphoneLabel = document.getElementById("overlay-microphone-label");
        const clearDisplayButton = document.getElementById("clear-display");
        const closeMonitorSetupButton = document.getElementById("close-monitor-setup");
        if (badgeA) { badgeA.textContent = wizardSidePresentation.A.stationTitle; }
        if (badgeB) { badgeB.textContent = wizardSidePresentation.B.stationTitle; }
        if (microphoneLabel) { microphoneLabel.textContent = copy.microphoneLabel; }
        if (clearDisplayButton) { clearDisplayButton.textContent = copy.removeAssignment; }
        if (closeMonitorSetupButton) { closeMonitorSetupButton.textContent = copy.closeMonitorSetup; }
        const side = display.assignedSide;
        const presentation = side ? sidePresentation(side) : null;
        const microphone = side ? selectedMicrophone(side) : null;
        const assignBusyTarget = overlayUiActionState.assignDisplay;
        const probingMicrophones = overlayUiActionState.probingMicrophones;
        if (!overlaySelectedMicrophoneId || overlaySelectedMicrophoneId === microphone?.deviceId || !state.microphones.some((item) => item.deviceId === overlaySelectedMicrophoneId)) {
          overlaySelectedMicrophoneId = microphone?.deviceId || "";
        }
        if (activeTest && (!side || activeTest.side !== side || activeTest.deviceId !== (microphone?.deviceId || ""))) {
          void stopOverlayMicTest(true);
        }
        document.body.className = side ? "side-" + side : "side-unassigned";
        document.getElementById("display-side").textContent = presentation ? presentation.shortTitle : copy.unassignedDisplay;
        document.getElementById("display-role").textContent = presentation ? presentation.stationSubtitle : copy.assignDisplayPrompt;
        document.getElementById("display-info").innerHTML = escapeHtml(display.label) + "<br />" + escapeHtml(display.bounds.width) + "x" + escapeHtml(display.bounds.height) + " &middot; " + escapeHtml(copy.displayIdLabel) + " " + escapeHtml(display.displayId);
        document.getElementById("microphone-info").textContent = microphone ? copy.microphonePrefix + microphoneDisplayName(microphone) : (presentation ? copy.microphonePrefix + copy.microphoneUnassignedInline : copy.assignDisplayBeforeMicrophone);
        const profileElement = document.getElementById("overlay-microphone-profile");
        const testButton = document.getElementById("overlay-microphone-test");
        profileElement.textContent =
          state.envValues.MICROPHONE_PTT_MODE === "single-shared"
            ? copy.sharedMicrophoneProfile
            : copy.dedicatedMicrophoneProfile;
        const micSelect = document.getElementById("overlay-microphone-select");
        if (micSelect) {
          micSelect.innerHTML = microphoneSelectOptionsHtml(overlaySelectedMicrophoneId || microphone?.deviceId || "");
          micSelect.value = overlaySelectedMicrophoneId || microphone?.deviceId || "";
          micSelect.disabled = !side || Boolean(activeTest && activeTest.stopping) || Boolean(assignBusyTarget) || probingMicrophones;
          micSelect.onchange = async () => {
            if (!side) { return; }
            const deviceId = micSelect.value || null;
            overlaySelectedMicrophoneId = micSelect.value;
            await stopOverlayMicTest(true);
            await runOverlayAction(
              () => api.assignMicrophone(side, deviceId),
              deviceId ? copy.microphoneUpdated : copy.microphoneRemoved,
              copy.unableToUpdateMicrophone
            );
          };
        }
        testButton.disabled = !side || !microphone || Boolean(activeTest && activeTest.stopping) || Boolean(assignBusyTarget);
        testButton.textContent = activeTest && activeTest.side === side ? (activeTest.stopping ? copy.stopping : copy.stopTest) : copy.startTest;
        testButton.classList.toggle("is-active", Boolean(activeTest && activeTest.side === side && !activeTest.stopping));
        testButton.classList.toggle("is-busy", Boolean(activeTest && activeTest.stopping));
        const level = side ? Math.round((state.signalLevels[side] || 0) * 100) : 0;
        document.getElementById("meter-bar").style.width = level + "%";
        const assignAButton = document.getElementById("assign-a");
        const assignBButton = document.getElementById("assign-b");
        assignAButton.className = side === "A" ? "secondary is-active" : "secondary";
        assignBButton.className = side === "B" ? "secondary is-active" : "secondary";
        assignAButton.disabled = probingMicrophones || Boolean(activeTest && activeTest.stopping) || Boolean(assignBusyTarget);
        assignBButton.disabled = probingMicrophones || Boolean(activeTest && activeTest.stopping) || Boolean(assignBusyTarget);
        assignAButton.textContent = assignBusyTarget === "A" ? copy.assigning : (side === "A" ? copy.stationAAssigned : copy.assignToStationA);
        assignBButton.textContent = assignBusyTarget === "B" ? copy.assigning : (side === "B" ? copy.stationBAssigned : copy.assignToStationB);
        assignAButton.classList.toggle("is-busy", assignBusyTarget === "A");
        assignBButton.classList.toggle("is-busy", assignBusyTarget === "B");
        assignAButton.setAttribute("aria-busy", assignBusyTarget === "A" ? "true" : "false");
        assignBButton.setAttribute("aria-busy", assignBusyTarget === "B" ? "true" : "false");
        if (!activeTest || activeTest.side !== side) {
          setOverlayStatus(presentation ? formatCopy(copy.displayReady, { station: presentation.shortTitle }) : copy.pressButtonToAssign);
        }
      }
      async function initialize() {
        if (!api) {
          throw new Error(copy.missingWizardBridge);
        }
        state = await api.getState();
        applyOverlayUiLanguage(state?.envValues?.SETUP_UI_LANGUAGE);
        render();
        api.onState((nextState) => {
          applyOverlayUiLanguage(nextState?.envValues?.SETUP_UI_LANGUAGE);
          state = nextState;
          render();
        });
        if (state.microphones.length === 0) {
          void probeMicrophonesFromOverlay().catch((error) => {
            setOverlayStatus(formatCopy(copy.microphoneProbeFailed, { detail: error?.message || String(error) }));
          });
        }
        document.getElementById("assign-a").addEventListener("click", () => {
          void withOverlayBusy("assignDisplay", "A", () => runOverlayAction(() => api.assignDisplay("A", displayId), formatCopy(copy.displayAssigned, { station: wizardSidePresentation.A.shortTitle }), copy.unableToAssignDisplay)).catch(() => {});
        });
        document.getElementById("assign-b").addEventListener("click", () => {
          void withOverlayBusy("assignDisplay", "B", () => runOverlayAction(() => api.assignDisplay("B", displayId), formatCopy(copy.displayAssigned, { station: wizardSidePresentation.B.shortTitle }), copy.unableToAssignDisplay)).catch(() => {});
        });
        document.getElementById("clear-display").addEventListener("click", async () => {
          await stopOverlayMicTest(true);
          await runOverlayAction(() => api.assignDisplay(null, displayId), copy.displayAssignmentRemoved, copy.unableToRemoveDisplayAssignment);
        });
        document.getElementById("overlay-microphone-test").addEventListener("click", async () => {
          const display = state.displays.find((item) => item.displayId === displayId);
          const side = display?.assignedSide;
          if (!side) {
            setOverlayStatus(copy.assignDisplayFirst);
            return;
          }
          const microphone = selectedMicrophone(side);
          if (activeTest && activeTest.side === side) {
            await stopOverlayMicTest();
            return;
          }
          await startOverlayMicTest(side, microphone);
        });
        document.getElementById("close-monitor-setup").addEventListener("click", async () => {
          await stopOverlayMicTest(true);
          api.closeMonitorSetup();
        });
        window.addEventListener("keydown", async (event) => {
          if (event.key === "Escape") {
            await stopOverlayMicTest(true);
            api.closeMonitorSetup();
          }
        });
      }
      window.addEventListener("beforeunload", async () => {
        await stopOverlayMicTest(true);
      });
      window.addEventListener("error", (event) => setOverlayStatus(copy.overlayErrorPrefix + event.message));
      window.addEventListener("unhandledrejection", (event) => setOverlayStatus(copy.overlayAsyncErrorPrefix + (event.reason?.message || String(event.reason))));
      initialize().catch((error) => {
        setOverlayStatus(copy.overlayInitFailedPrefix + (error?.message || String(error)));
      });
    </script>
  </body>
</html>`;
}
