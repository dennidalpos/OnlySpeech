import { normalizeSetupWizardUiLanguage, type SetupWizardUiLanguage } from "./localization.js";
import { getSetupWizardSectionSaveBarHtml } from "./shell-section-save-bar.js";
import {
  getSetupWizardCardHeaderHtml,
  getSetupWizardSectionHeaderHtml
} from "./shell-primitives.js";

export function getSetupWizardProviderShellHtml(uiLanguage: SetupWizardUiLanguage = "en"): string {
  const normalizedLanguage = normalizeSetupWizardUiLanguage(uiLanguage);
  const copyByLanguage: Readonly<Record<SetupWizardUiLanguage, Record<string, string>>> = {
    en: {
      eyebrow: "Provider",
      title: "Translation provider and credentials",
      description: "Select the live translation stack first, then complete only the credentials required by that provider.",
      providerSelection: "Provider selection",
      providerSelectionDescription: "This controls runtime validation, diagnostics behavior, and the save gate applied in live mode.",
      translationProvider: "Translation provider",
      credentialTitle: "Shared credentials",
      credentialDescription: "These values are used directly by the selected live provider.",
      azureKey: "Azure Speech key",
      azureRegion: "Azure Speech region",
      azureTranslatorKey: "Azure Translator key",
      azureTranslatorRegion: "Azure Translator region",
      azureTranslatorEndpoint: "Azure Translator endpoint (optional)",
      providerSpecific: "Provider-specific settings",
      providerSpecificDescription: "Show only the settings required by the currently selected provider.",
      chatGptSettings: "ChatGPT settings",
      chatGptApiKey: "ChatGPT API key",
      chatGptModel: "ChatGPT model",
      chatGptTranscribeModel: "ChatGPT transcribe model",
      ollamaSettings: "Ollama settings",
      ollamaBaseUrl: "Ollama base URL",
      ollamaModel: "Ollama model",
      ollamaRequestTimeoutMs: "Ollama request timeout (ms)",
      ollamaStreamingEnabled: "Ollama streaming",
      ollamaApiKey: "Ollama API key (optional)",
      catalogDisclosure: "Provider and language coverage details",
      catalogDisclosureBody:
        "Initial languages, playback validation, and live save gating all depend on the active provider and its supported catalog."
    },
    it: {
      eyebrow: "Provider",
      title: "Provider traduzione e credenziali",
      description: "Seleziona prima lo stack di traduzione live, poi completa solo le credenziali richieste da quel provider.",
      providerSelection: "Selezione provider",
      providerSelectionDescription: "Controlla validazione runtime, comportamento diagnostico e blocchi di salvataggio in live mode.",
      translationProvider: "Provider traduzione",
      credentialTitle: "Credenziali condivise",
      credentialDescription: "Questi valori sono usati direttamente dal provider live selezionato.",
      azureKey: "Chiave Azure Speech",
      azureRegion: "Area Azure Speech",
      azureTranslatorKey: "Chiave Azure Translator",
      azureTranslatorRegion: "Area Azure Translator",
      azureTranslatorEndpoint: "Endpoint Azure Translator (opzionale)",
      providerSpecific: "Impostazioni specifiche provider",
      providerSpecificDescription: "Mostra solo le impostazioni richieste dal provider attualmente selezionato.",
      chatGptSettings: "Impostazioni ChatGPT",
      chatGptApiKey: "Chiave API ChatGPT",
      chatGptModel: "Modello ChatGPT",
      chatGptTranscribeModel: "Modello trascrizione ChatGPT",
      ollamaSettings: "Impostazioni Ollama",
      ollamaBaseUrl: "URL base Ollama",
      ollamaModel: "Modello Ollama",
      ollamaRequestTimeoutMs: "Timeout richiesta Ollama (ms)",
      ollamaStreamingEnabled: "Streaming Ollama",
      ollamaApiKey: "Chiave API Ollama (opzionale)",
      catalogDisclosure: "Dettagli provider e copertura lingue",
      catalogDisclosureBody:
        "Lingue iniziali, test playback e blocchi di salvataggio live dipendono dal provider attivo e dal suo catalogo supportato."
    },
    es: {
      eyebrow: "Proveedor",
      title: "Proveedor de traduccion y credenciales",
      description: "Selecciona primero el proveedor live y completa solo las credenciales que realmente usa.",
      providerSelection: "Seleccion del proveedor",
      providerSelectionDescription: "Controla la validacion runtime, el comportamiento de diagnostico y el bloqueo de guardado en modo live.",
      translationProvider: "Proveedor de traduccion",
      credentialTitle: "Credenciales compartidas",
      credentialDescription: "Estos valores se usan directamente por el proveedor live seleccionado.",
      azureKey: "Clave Azure Speech",
      azureRegion: "Region Azure Speech",
      azureTranslatorKey: "Clave Azure Translator",
      azureTranslatorRegion: "Region Azure Translator",
      azureTranslatorEndpoint: "Endpoint Azure Translator (opcional)",
      providerSpecific: "Ajustes especificos del proveedor",
      providerSpecificDescription: "Muestra solo los ajustes necesarios para el proveedor actualmente seleccionado.",
      chatGptSettings: "Configuracion ChatGPT",
      chatGptApiKey: "Clave API ChatGPT",
      chatGptModel: "Modelo ChatGPT",
      chatGptTranscribeModel: "Modelo de transcripcion ChatGPT",
      ollamaSettings: "Configuracion Ollama",
      ollamaBaseUrl: "URL base Ollama",
      ollamaModel: "Modelo Ollama",
      ollamaRequestTimeoutMs: "Timeout de Ollama (ms)",
      ollamaStreamingEnabled: "Streaming Ollama",
      ollamaApiKey: "Clave API Ollama (opcional)",
      catalogDisclosure: "Detalles del proveedor y cobertura de idiomas",
      catalogDisclosureBody:
        "Los idiomas iniciales, la validacion de reproduccion y el bloqueo de guardado live dependen del proveedor activo y de su catalogo."
    },
    fr: {
      eyebrow: "Fournisseur",
      title: "Fournisseur de traduction et identifiants",
      description: "Choisissez d'abord la pile live, puis renseignez uniquement les identifiants requis par ce fournisseur.",
      providerSelection: "Selection du fournisseur",
      providerSelectionDescription: "Controle la validation runtime, le comportement des diagnostics et le blocage de sauvegarde en mode live.",
      translationProvider: "Fournisseur de traduction",
      credentialTitle: "Identifiants partages",
      credentialDescription: "Ces valeurs sont utilisees directement par le fournisseur live selectionne.",
      azureKey: "Cle Azure Speech",
      azureRegion: "Region Azure Speech",
      azureTranslatorKey: "Cle Azure Translator",
      azureTranslatorRegion: "Region Azure Translator",
      azureTranslatorEndpoint: "Endpoint Azure Translator (optionnel)",
      providerSpecific: "Parametres specifiques au fournisseur",
      providerSpecificDescription: "N'affiche que les parametres requis par le fournisseur actuellement selectionne.",
      chatGptSettings: "Parametres ChatGPT",
      chatGptApiKey: "Cle API ChatGPT",
      chatGptModel: "Modele ChatGPT",
      chatGptTranscribeModel: "Modele de transcription ChatGPT",
      ollamaSettings: "Parametres Ollama",
      ollamaBaseUrl: "URL de base Ollama",
      ollamaModel: "Modele Ollama",
      ollamaRequestTimeoutMs: "Delai Ollama (ms)",
      ollamaStreamingEnabled: "Streaming Ollama",
      ollamaApiKey: "Cle API Ollama (optionnelle)",
      catalogDisclosure: "Details fournisseur et couverture langues",
      catalogDisclosureBody:
        "Les langues initiales, la validation de lecture et le blocage de sauvegarde live dependent du fournisseur actif et de son catalogue."
    },
    de: {
      eyebrow: "Anbieter",
      title: "Uebersetzungsanbieter und Zugangsdaten",
      description: "Waehlen Sie zuerst den Live-Anbieter und vervollstaendigen Sie dann nur die dafuer benoetigten Zugangsdaten.",
      providerSelection: "Anbieterauswahl",
      providerSelectionDescription: "Steuert Runtime-Validierung, Diagnoseverhalten und die Save-Sperre im Live-Modus.",
      translationProvider: "Uebersetzungsanbieter",
      credentialTitle: "Gemeinsame Zugangsdaten",
      credentialDescription: "Diese Werte werden direkt vom ausgewaehlten Live-Anbieter verwendet.",
      azureKey: "Azure-Speech-Schluessel",
      azureRegion: "Azure-Speech-Region",
      azureTranslatorKey: "Azure-Translator-Schluessel",
      azureTranslatorRegion: "Azure-Translator-Region",
      azureTranslatorEndpoint: "Azure-Translator-Endpunkt (optional)",
      providerSpecific: "Anbieterspezifische Einstellungen",
      providerSpecificDescription: "Zeigt nur die Einstellungen fuer den aktuell ausgewaehlten Anbieter.",
      chatGptSettings: "ChatGPT-Einstellungen",
      chatGptApiKey: "ChatGPT-API-Schluessel",
      chatGptModel: "ChatGPT-Modell",
      chatGptTranscribeModel: "ChatGPT-Transkriptionsmodell",
      ollamaSettings: "Ollama-Einstellungen",
      ollamaBaseUrl: "Ollama-Basis-URL",
      ollamaModel: "Ollama-Modell",
      ollamaRequestTimeoutMs: "Ollama-Timeout (ms)",
      ollamaStreamingEnabled: "Ollama-Streaming",
      ollamaApiKey: "Ollama-API-Schluessel (optional)",
      catalogDisclosure: "Details zu Anbieter und Sprachabdeckung",
      catalogDisclosureBody:
        "Initialsprachen, Wiedergabevalidierung und Live-Save-Sperren haengen vom aktiven Anbieter und dessen Katalog ab."
    },
    zh: {
      eyebrow: "服务商",
      title: "翻译服务商和凭据",
      description: "先选择 live 翻译栈，再填写该服务商真正需要的凭据。",
      providerSelection: "服务商选择",
      providerSelectionDescription: "控制 runtime 校验、诊断行为和 live 模式下的保存阻塞。",
      translationProvider: "翻译服务商",
      credentialTitle: "共享凭据",
      credentialDescription: "这些值会直接用于当前选中的 live 服务商。",
      azureKey: "Azure Speech 密钥",
      azureRegion: "Azure Speech 区域",
      azureTranslatorKey: "Azure Translator 密钥",
      azureTranslatorRegion: "Azure Translator 区域",
      azureTranslatorEndpoint: "Azure Translator 终结点（可选）",
      providerSpecific: "服务商专属设置",
      providerSpecificDescription: "只显示当前所选服务商需要的设置。",
      chatGptSettings: "ChatGPT 设置",
      chatGptApiKey: "ChatGPT API 密钥",
      chatGptModel: "ChatGPT 模型",
      chatGptTranscribeModel: "ChatGPT 转写模型",
      ollamaSettings: "Ollama 设置",
      ollamaBaseUrl: "Ollama 基础 URL",
      ollamaModel: "Ollama 模型",
      ollamaRequestTimeoutMs: "Ollama 超时（毫秒）",
      ollamaStreamingEnabled: "Ollama 流式输出",
      ollamaApiKey: "Ollama API 密钥（可选）",
      catalogDisclosure: "服务商与语言覆盖详情",
      catalogDisclosureBody:
        "初始语言、播放校验和 live 保存阻塞都依赖当前服务商及其支持目录。"
    }
  };
  const copy = copyByLanguage[normalizedLanguage];
  return `
      <section class="panel section-panel" data-section-target="provider" data-accent="provider" tabindex="-1">
${getSetupWizardSectionHeaderHtml({
  eyebrow: copy.eyebrow,
  title: copy.title
})}
        <div class="wizard-grid wizard-grid-2">
          <article class="card settings-card provider-selection-card">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.providerSelection,
  title: copy.providerSelection
})}
            <div class="form-grid">
              <label>${copy.translationProvider}
                <select id="provider-select"></select>
              </label>
            </div>
            <div id="provider-config-notices" class="notice-stack" aria-live="polite"></div>
          </article>
          <article class="card settings-card" id="provider-shared-credentials-card">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.credentialTitle,
  title: copy.credentialTitle
})}
            <div class="form-grid">
              <label id="azure-key-field">${copy.azureKey}
                <input id="env-AZURE_SPEECH_KEY" data-env-key="AZURE_SPEECH_KEY" type="password" autocomplete="off" />
              </label>
              <label id="azure-region-field">${copy.azureRegion}
                <input id="env-AZURE_SPEECH_REGION" data-env-key="AZURE_SPEECH_REGION" />
              </label>
              <label id="azure-translator-key-field">${copy.azureTranslatorKey}
                <input id="env-AZURE_TRANSLATOR_KEY" data-env-key="AZURE_TRANSLATOR_KEY" type="password" autocomplete="off" />
              </label>
              <label id="azure-translator-region-field">${copy.azureTranslatorRegion}
                <input id="env-AZURE_TRANSLATOR_REGION" data-env-key="AZURE_TRANSLATOR_REGION" />
              </label>
              <label id="azure-translator-endpoint-field" class="full-span">${copy.azureTranslatorEndpoint}
                <input id="env-AZURE_TRANSLATOR_ENDPOINT" data-env-key="AZURE_TRANSLATOR_ENDPOINT" />
              </label>
            </div>
          </article>
        </div>
        <article class="card settings-card" id="provider-specific-settings-card">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.providerSpecific,
  title: copy.providerSpecific
})}
            <div class="provider-grid">
            <div class="provider-card hidden" data-provider-card="chatgpt">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.chatGptSettings,
  title: copy.chatGptSettings
})}
              <div class="form-grid">
                <label>${copy.chatGptApiKey}
                  <input id="env-CHATGPT_API_KEY" data-env-key="CHATGPT_API_KEY" type="password" autocomplete="off" />
                </label>
                <label>${copy.chatGptModel}
                  <select id="env-CHATGPT_MODEL" data-env-key="CHATGPT_MODEL"></select>
                </label>
                <label class="full-span">${copy.chatGptTranscribeModel}
                  <select id="env-CHATGPT_TRANSCRIBE_MODEL" data-env-key="CHATGPT_TRANSCRIBE_MODEL"></select>
                </label>
              </div>
            </div>
            <div class="provider-card hidden" data-provider-card="ollama">
${getSetupWizardCardHeaderHtml({
  eyebrow: copy.ollamaSettings,
  title: copy.ollamaSettings
})}
              <div class="form-grid">
                <label>${copy.ollamaBaseUrl}
                  <input id="env-OLLAMA_BASE_URL" data-env-key="OLLAMA_BASE_URL" />
                </label>
                <label>${copy.ollamaModel}
                  <input id="env-OLLAMA_MODEL" data-env-key="OLLAMA_MODEL" />
                </label>
                <label>${copy.ollamaRequestTimeoutMs}
                  <input id="env-OLLAMA_REQUEST_TIMEOUT_MS" data-env-key="OLLAMA_REQUEST_TIMEOUT_MS" />
                </label>
                <label>${copy.ollamaStreamingEnabled}
                  <select id="env-OLLAMA_STREAMING_ENABLED" data-env-key="OLLAMA_STREAMING_ENABLED"></select>
                </label>
                <label class="full-span">${copy.ollamaApiKey}
                  <input id="env-OLLAMA_API_KEY" data-env-key="OLLAMA_API_KEY" type="password" autocomplete="off" />
                </label>
              </div>
            </div>
          </div>
        </article>
${getSetupWizardSectionSaveBarHtml("provider-save-btn", normalizedLanguage)}
      </section>
  `;
}
