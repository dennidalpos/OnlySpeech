import { getWizardSidePresentation } from "./shared.js";
import { normalizeSetupWizardUiLanguage, type SetupWizardUiLanguage } from "./localization.js";
import { getSetupWizardSectionSaveBarHtml } from "./shell-section-save-bar.js";
import {
  getSetupWizardSurfaceActionButtonHtml,
  getSetupWizardCardHeaderHtml,
  getSetupWizardSectionHeaderHtml
} from "./shell-primitives.js";

export function getSetupWizardStationsShellHtml(uiLanguage: SetupWizardUiLanguage = "en"): string {
  const normalizedLanguage = normalizeSetupWizardUiLanguage(uiLanguage);
  const sidePresentation = getWizardSidePresentation(normalizedLanguage);
  const sideA = sidePresentation.A;
  const sideB = sidePresentation.B;
  const copyByLanguage: Readonly<Record<SetupWizardUiLanguage, Record<string, string>>> = {
    en: {
      eyebrow: "Stations",
      title: "Hardware assignment and runtime profile",
      openDisplaySetup: "Open guided display setup",
      probeMicrophones: "Probe microphones",
      probeLabel: "Microphone probe in progress",
      probeDetail: "Wait for the probe to finish before assigning new devices.",
      progressValue: "In progress",
      runtimeProfile: "Runtime profile",
      readiness: "Station readiness",
      runtimeMode: "Runtime mode",
      demoSeconds: "Seconds between demo slides",
      microphoneProfile: "Microphone profile",
      dedicated: "2 dedicated microphones",
      shared: "1 shared microphone",
      activeAssignments: "Current assignments",
      display: "Display",
      microphone: "Microphone",
      openSurfaceIndicator: "Opens windows",
      openSurfaceDescription: "Opens fullscreen monitor mapping windows."
    },
    it: {
      eyebrow: "Postazioni",
      title: "Assegnazione hardware e profilo runtime",
      openDisplaySetup: "Apri setup guidato monitor",
      probeMicrophones: "Rileva microfoni",
      probeLabel: "Rilevamento microfoni in corso",
      probeDetail: "Attendi il completamento del probe prima di assegnare i nuovi dispositivi.",
      progressValue: "In corso",
      runtimeProfile: "Profilo runtime",
      readiness: "Stato postazione",
      runtimeMode: "Modalita runtime",
      demoSeconds: "Secondi tra slide demo",
      microphoneProfile: "Profilo microfoni",
      dedicated: "2 microfoni dedicati",
      shared: "1 microfono condiviso",
      activeAssignments: "Assegnazioni correnti",
      display: "Monitor",
      microphone: "Microfono",
      openSurfaceIndicator: "Apre finestre",
      openSurfaceDescription: "Apre finestre monitor a schermo intero per la mappatura fisica."
    },
    es: {
      eyebrow: "Puestos",
      title: "Asignacion de hardware y perfil runtime",
      openDisplaySetup: "Abrir setup guiado de monitores",
      probeMicrophones: "Detectar microfonos",
      probeLabel: "Deteccion de microfonos en curso",
      probeDetail: "Espera a que termine la deteccion antes de asignar nuevos dispositivos.",
      progressValue: "En curso",
      runtimeProfile: "Perfil runtime",
      readiness: "Estado del puesto",
      runtimeMode: "Modo runtime",
      demoSeconds: "Segundos entre diapositivas demo",
      microphoneProfile: "Perfil de microfonos",
      dedicated: "2 microfonos dedicados",
      shared: "1 microfono compartido",
      activeAssignments: "Asignaciones actuales",
      display: "Monitor",
      microphone: "Microfono",
      openSurfaceIndicator: "Abre ventanas",
      openSurfaceDescription: "Abre ventanas de monitores a pantalla completa para el mapeo fisico."
    },
    fr: {
      eyebrow: "Postes",
      title: "Affectation materielle et profil runtime",
      openDisplaySetup: "Ouvrir le setup guide des ecrans",
      probeMicrophones: "Detecter les microphones",
      probeLabel: "Detection des microphones en cours",
      probeDetail: "Attendez la fin de la detection avant d'assigner de nouveaux peripheriques.",
      progressValue: "En cours",
      runtimeProfile: "Profil runtime",
      readiness: "Etat des postes",
      runtimeMode: "Mode runtime",
      demoSeconds: "Secondes entre les slides demo",
      microphoneProfile: "Profil microphones",
      dedicated: "2 microphones dedies",
      shared: "1 microphone partage",
      activeAssignments: "Affectations actuelles",
      display: "Ecran",
      microphone: "Microphone",
      openSurfaceIndicator: "Ouvre des fenetres",
      openSurfaceDescription: "Ouvre des fenetres plein ecran pour le mappage des ecrans."
    },
    de: {
      eyebrow: "Stationen",
      title: "Hardware-Zuweisung und Runtime-Profil",
      openDisplaySetup: "Gefuehrtes Monitor-Setup oeffnen",
      probeMicrophones: "Mikrofone erkennen",
      probeLabel: "Mikrofonerkennung laeuft",
      probeDetail: "Warten Sie, bis die Erkennung abgeschlossen ist, bevor Sie neue Geraete zuweisen.",
      progressValue: "Laeuft",
      runtimeProfile: "Runtime-Profil",
      readiness: "Stationsstatus",
      runtimeMode: "Runtime-Modus",
      demoSeconds: "Sekunden zwischen Demo-Folien",
      microphoneProfile: "Mikrofonprofil",
      dedicated: "2 dedizierte Mikrofone",
      shared: "1 gemeinsames Mikrofon",
      activeAssignments: "Aktuelle Zuweisungen",
      display: "Monitor",
      microphone: "Mikrofon",
      openSurfaceIndicator: "Oeffnet Fenster",
      openSurfaceDescription: "Oeffnet Vollbildfenster fuer das physische Monitor-Mapping."
    },
    zh: {
      eyebrow: "工作站",
      title: "硬件分配与 runtime 配置",
      openDisplaySetup: "打开显示器引导设置",
      probeMicrophones: "探测麦克风",
      probeLabel: "正在探测麦克风",
      probeDetail: "请等待探测完成后再分配新设备。",
      progressValue: "进行中",
      runtimeProfile: "runtime 配置",
      readiness: "工作站状态",
      runtimeMode: "runtime 模式",
      demoSeconds: "演示幻灯片间隔秒数",
      microphoneProfile: "麦克风配置",
      dedicated: "2 个独立麦克风",
      shared: "1 个共享麦克风",
      activeAssignments: "当前分配",
      display: "显示器",
      microphone: "麦克风",
      openSurfaceIndicator: "打开窗口",
      openSurfaceDescription: "打开用于物理显示器映射的全屏窗口。"
    }
  };
  const copy = copyByLanguage[normalizedLanguage];

  return `
      <section class="panel section-panel section-emphasis" data-section-target="stations" data-accent="stations" tabindex="-1">
${getSetupWizardSectionHeaderHtml({
  eyebrow: copy.eyebrow,
  title: copy.title
})}
        <div id="stations-progress" class="section-progress" hidden aria-live="polite" aria-busy="false">
          <div class="section-progress-copy">
            <strong id="stations-progress-label">${copy.probeLabel}</strong>
            <span id="stations-progress-detail">${copy.probeDetail}</span>
          </div>
          <div class="meter meter-indeterminate" role="progressbar" aria-label="${copy.probeLabel}" aria-valuetext="${copy.progressValue}">
            <div class="meter-bar meter-bar-indeterminate"></div>
          </div>
        </div>
        <div class="stations-cta-bar">
${getSetupWizardSurfaceActionButtonHtml({
  id: "toggle-monitor-setup",
  label: copy.openDisplaySetup,
  indicator: copy.openSurfaceIndicator,
  description: copy.openSurfaceDescription,
  extraAttributes: `aria-pressed="false" class="primary wizard-action stations-monitor-cta"`
})}
        </div>
        <article class="card settings-card station-readiness-card">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.readiness,
  title: copy.readiness
})}
          <div id="stations-summary-grid" class="review-strip" aria-live="polite"></div>
        </article>
        <div class="wizard-grid wizard-grid-2">
          <article class="card settings-card profile-choice-card">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.runtimeProfile,
  title: copy.runtimeProfile
})}
            <div class="form-grid">
              <label>${copy.runtimeMode}
                <select id="env-APP_MODE" data-env-key="APP_MODE"></select>
              </label>
              <label id="demo-slide-interval-field" class="full-span">${copy.demoSeconds}
                <input id="env-DEMO_SLIDE_INTERVAL_SECONDS" data-env-key="DEMO_SLIDE_INTERVAL_SECONDS" inputmode="decimal" />
              </label>
            </div>
          </article>
          <article class="card settings-card profile-choice-card">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.microphoneProfile,
  title: copy.microphoneProfile
})}
            <div class="profile-choice-grid" role="radiogroup" aria-label="${copy.microphoneProfile}">
              <button class="secondary wizard-action" type="button" id="stations-microphone-profile-dedicated" role="radio" aria-checked="false" aria-pressed="false">${copy.dedicated}</button>
              <button class="secondary wizard-action" type="button" id="stations-microphone-profile-shared" role="radio" aria-checked="false" aria-pressed="false">${copy.shared}</button>
            </div>
            <select id="env-MICROPHONE_PTT_MODE" data-env-key="MICROPHONE_PTT_MODE" class="field-hidden" tabindex="-1" aria-hidden="true"></select>
            <div id="stations-microphone-profile-note" class="hint" aria-live="polite"></div>
            <div class="actions top-gap">
              <button class="ghost wizard-action" type="button" id="probe-microphones">${copy.probeMicrophones}</button>
            </div>
          </article>
        </div>
        <div id="monitor-notices" class="notice-stack" aria-live="polite"></div>
        <div class="wizard-grid wizard-grid-2">
          <article class="card settings-card side-A">
            <div class="station-block">
              <span class="block-label side-A">${sideA.stationTitle}</span>
              <span class="block-sublabel">${sideA.stationSubtitle}</span>
              <h4 class="block-section-label">${copy.display}</h4>
              <div id="station-monitor-A" aria-live="polite"></div>
            </div>
            <div class="station-block">
              <h4 class="block-section-label">${copy.microphone}</h4>
              <div id="station-mic-A" aria-live="polite"></div>
            </div>
          </article>
          <article class="card settings-card side-B">
            <div class="station-block">
              <span class="block-label side-B">${sideB.stationTitle}</span>
              <span class="block-sublabel">${sideB.stationSubtitle}</span>
              <h4 class="block-section-label">${copy.display}</h4>
              <div id="station-monitor-B" aria-live="polite"></div>
            </div>
            <div class="station-block">
              <h4 class="block-section-label">${copy.microphone}</h4>
              <div id="station-mic-B" aria-live="polite"></div>
            </div>
          </article>
        </div>
        <div id="microphone-notices" class="notice-stack" aria-live="polite"></div>
${getSetupWizardSectionSaveBarHtml("stations-save-btn", normalizedLanguage)}
      </section>
  `;
}
