import { normalizeSetupWizardUiLanguage, type SetupWizardUiLanguage } from "./localization.js";
import { getSharedLicenseFormCopy } from "../../shared/license-copy.js";

export interface SetupWizardLicenseCopy {
  locale: string;
  plans: {
    monthly: string;
    semiannual: string;
    annual: string;
    lifetime: string;
    trial: string;
  };
  eyebrow: string;
  title: string;
  statusTitle: string;
  loadingLicense: string;
  refreshBtn: string;
  activateTitle: string;
  restoreTitle: string;
  replaceTitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  codeLabel: string;
  codePlaceholder: string;
  activateSubmitLabel: string;
  restoreSubmitLabel: string;
  replaceSubmitLabel: string;
  detailsShowLabel: string;
  detailsHideLabel: string;
  trialTitle: string;
  trialBtn: string;
  trialExhausted: string;
  removeTitle: string;
  removeBtn: string;
  removeSelectionLabel: string;
  removeSelectionRequired: string;
  removeDisabledUnavailable: string;
  removeDisabledUnconfirmed: string;
  removeConfirmPrompt: string;
  noLicense: string;
  noLicenseBody: string;
  active: string;
  expired: string;
  plan: string;
  activatedOn: string;
  issuedOn: string;
  expiry: string;
  noExpiry: string;
  expiredDay: string;
  expiredDays: string;
  remainingDay: string;
  remainingDays: string;
  warningExpired: string;
  warningActive: string;
  licenseRemovedStatus: string;
  licenseRemovedMessage: string;
  licenseRemovedError: string;
  emailAndCodeRequired: string;
  invalidEmail: string;
  invalidCode: string;
  validating: string;
  validationFailed: string;
  operationFailed: string;
  statusRefreshFailed: string;
  newLicenseAppliedStatus: string;
  newLicenseAppliedMessage: string;
  activatingTrial: string;
  trialActivatedStatus: string;
  trialActivatedMessage: string;
  trialDisabledExhausted: string;
  activationFailed: string;
}

type SetupWizardLicenseSpecificCopy = Omit<
  SetupWizardLicenseCopy,
  | "activateSubmitLabel"
  | "codeLabel"
  | "codePlaceholder"
  | "detailsHideLabel"
  | "detailsShowLabel"
  | "emailLabel"
  | "emailPlaceholder"
>;

function createSetupWizardLicenseCopy(
  language: SetupWizardUiLanguage,
  specificCopy: SetupWizardLicenseSpecificCopy
): SetupWizardLicenseCopy {
  const sharedCopy = getSharedLicenseFormCopy(language);

  return {
    ...specificCopy,
    emailLabel: sharedCopy.emailLabel,
    emailPlaceholder: sharedCopy.emailPlaceholder,
    codeLabel: sharedCopy.codeLabel,
    codePlaceholder: sharedCopy.codePlaceholder,
    activateSubmitLabel: sharedCopy.activateSubmitLabel,
    detailsShowLabel: sharedCopy.detailsShowLabel,
    detailsHideLabel: sharedCopy.detailsHideLabel
  };
}

export const SETUP_WIZARD_LICENSE_COPY_BY_LANGUAGE = Object.freeze({
  en: createSetupWizardLicenseCopy("en", {
    locale: "en-GB",
    plans: { monthly: "Monthly", semiannual: "Semiannual", annual: "Annual", lifetime: "Lifetime", trial: "Trial" },
    eyebrow: "License",
    title: "License and activation",
    statusTitle: "License state",
    loadingLicense: "Loading license state...",
    refreshBtn: "Refresh license state",
    activateTitle: "Activate workstation",
    restoreTitle: "Restore access",
    replaceTitle: "Replace installed license",
    restoreSubmitLabel: "Restore access",
    replaceSubmitLabel: "Replace installed license",
    trialTitle: "Local trial",
    trialBtn: "Start trial",
    trialExhausted: "The local trial is no longer available on this workstation. Contact the supplier for a license.",
    removeTitle: "Remove installed license",
    removeBtn: "Remove selected license",
    removeSelectionLabel: "Select the installed license before removing it.",
    removeSelectionRequired: "Select the installed license before removing it.",
    removeDisabledUnavailable: "No installed license is available to remove on this workstation.",
    removeDisabledUnconfirmed: "Select the installed license before removing it.",
    removeConfirmPrompt: "Remove the stored license from this workstation?",
    noLicense: "No license",
    noLicenseBody: "No license installed on this device.",
    active: "ACTIVE",
    expired: "EXPIRED",
    plan: "Plan",
    activatedOn: "Activated on",
    issuedOn: "Issued on",
    expiry: "Expiry",
    noExpiry: "No expiry (Lifetime)",
    expiredDay: "Expired {count} day ago",
    expiredDays: "Expired {count} days ago",
    remainingDay: "{count} day remaining",
    remainingDays: "{count} days remaining",
    warningExpired: "The current license has expired. Enter a new activation code to restore access.",
    warningActive: "Submitting a new activation code will overwrite the currently installed license.",
    licenseRemovedStatus: "License removed.",
    licenseRemovedMessage: "License removed. The app will require activation on the next validation cycle.",
    licenseRemovedError: "License removal error: ",
    emailAndCodeRequired: "Email and code are required.",
    invalidEmail: "Enter a valid customer email.",
    invalidCode: "Enter a valid activation code that starts with OS1.",
    validating: "Validating...",
    validationFailed: "Validation failed.",
    operationFailed: "The operation could not be completed.",
    statusRefreshFailed: "Unable to refresh the license status.",
    newLicenseAppliedStatus: "New license applied successfully.",
    newLicenseAppliedMessage: "New license applied. Verification occurs automatically within 60 seconds.",
    activatingTrial: "Activating trial...",
    trialActivatedStatus: "15-day trial activated successfully.",
    trialActivatedMessage: "Trial activated. You have 15 days of unlimited access.",
    trialDisabledExhausted: "The local trial is no longer available on this workstation.",
    activationFailed: "Activation failed."
  }),
  it: createSetupWizardLicenseCopy("it", {
    locale: "it-IT",
    plans: { monthly: "Mensile", semiannual: "Semestrale", annual: "Annuale", lifetime: "A vita", trial: "Prova" },
    eyebrow: "Licenza",
    title: "Licenza e attivazione",
    statusTitle: "Stato licenza",
    loadingLicense: "Caricamento stato licenza...",
    refreshBtn: "Aggiorna stato licenza",
    activateTitle: "Attiva postazione",
    restoreTitle: "Ripristina accesso",
    replaceTitle: "Sostituisci licenza installata",
    restoreSubmitLabel: "Ripristina accesso",
    replaceSubmitLabel: "Sostituisci licenza installata",
    trialTitle: "Prova locale",
    trialBtn: "Avvia trial",
    trialExhausted: "La prova locale non e' piu' disponibile su questa postazione. Contatta il fornitore per una licenza.",
    removeTitle: "Rimuovi licenza installata",
    removeBtn: "Rimuovi licenza selezionata",
    removeSelectionLabel: "Seleziona la licenza installata prima di rimuoverla.",
    removeSelectionRequired: "Seleziona la licenza installata prima di rimuoverla.",
    removeDisabledUnavailable: "Non c'e' alcuna licenza installata da rimuovere su questa postazione.",
    removeDisabledUnconfirmed: "Seleziona la licenza installata prima di rimuoverla.",
    removeConfirmPrompt: "Rimuovere la licenza memorizzata da questa postazione?",
    noLicense: "Nessuna licenza",
    noLicenseBody: "Nessuna licenza installata su questo dispositivo.",
    active: "ATTIVA",
    expired: "SCADUTA",
    plan: "Piano",
    activatedOn: "Attivata il",
    issuedOn: "Emessa il",
    expiry: "Scadenza",
    noExpiry: "Nessuna scadenza (Lifetime)",
    expiredDay: "Scaduta {count} giorno fa",
    expiredDays: "Scaduta {count} giorni fa",
    remainingDay: "{count} giorno rimanente",
    remainingDays: "{count} giorni rimanenti",
    warningExpired: "La licenza attuale e' scaduta. Inserisci un nuovo codice di attivazione per ripristinare l'accesso.",
    warningActive: "L'invio di un nuovo codice di attivazione sovrascrivera' la licenza attualmente installata.",
    licenseRemovedStatus: "Licenza rimossa.",
    licenseRemovedMessage: "Licenza rimossa. L'app richiedera' l'attivazione al prossimo ciclo di verifica.",
    licenseRemovedError: "Errore rimozione licenza: ",
    emailAndCodeRequired: "Email e codice sono obbligatori.",
    invalidEmail: "Inserisci un'email cliente valida.",
    invalidCode: "Inserisci un codice di attivazione valido che inizi con OS1.",
    validating: "Validazione in corso...",
    validationFailed: "Validazione fallita.",
    operationFailed: "L'operazione non puo' essere completata.",
    statusRefreshFailed: "Impossibile aggiornare lo stato licenza.",
    newLicenseAppliedStatus: "Nuova licenza applicata con successo.",
    newLicenseAppliedMessage: "Nuova licenza applicata. La verifica avviene automaticamente entro 60 secondi.",
    activatingTrial: "Attivazione prova in corso...",
    trialActivatedStatus: "Prova 15 giorni attivata con successo.",
    trialActivatedMessage: "Prova attivata. Hai 15 giorni di accesso illimitato.",
    trialDisabledExhausted: "La prova locale non e' piu' disponibile su questa postazione.",
    activationFailed: "Attivazione fallita."
  }),
  es: createSetupWizardLicenseCopy("es", {
    locale: "es-ES",
    plans: { monthly: "Mensual", semiannual: "Semestral", annual: "Anual", lifetime: "Vitalicia", trial: "Prueba" },
    eyebrow: "Licencia",
    title: "Licencia y activacion",
    statusTitle: "Estado de licencia",
    loadingLicense: "Cargando estado de licencia...",
    refreshBtn: "Actualizar estado de licencia",
    activateTitle: "Activar puesto",
    restoreTitle: "Restaurar acceso",
    replaceTitle: "Sustituir licencia instalada",
    restoreSubmitLabel: "Restaurar acceso",
    replaceSubmitLabel: "Sustituir licencia instalada",
    trialTitle: "Prueba local",
    trialBtn: "Iniciar prueba",
    trialExhausted: "La prueba local ya no esta disponible en este puesto. Contacta con el proveedor para una licencia.",
    removeTitle: "Eliminar licencia instalada",
    removeBtn: "Eliminar licencia seleccionada",
    removeSelectionLabel: "Selecciona la licencia instalada antes de eliminarla.",
    removeSelectionRequired: "Selecciona la licencia instalada antes de eliminarla.",
    removeDisabledUnavailable: "No hay ninguna licencia instalada disponible para eliminar en este puesto.",
    removeDisabledUnconfirmed: "Selecciona la licencia instalada antes de eliminarla.",
    removeConfirmPrompt: "Eliminar la licencia guardada de este puesto?",
    noLicense: "Sin licencia",
    noLicenseBody: "No hay ninguna licencia instalada en este dispositivo.",
    active: "ACTIVA",
    expired: "CADUCADA",
    plan: "Plan",
    activatedOn: "Activada el",
    issuedOn: "Emitida el",
    expiry: "Caducidad",
    noExpiry: "Sin caducidad (Vitalicia)",
    expiredDay: "Caducada hace {count} dia",
    expiredDays: "Caducada hace {count} dias",
    remainingDay: "{count} dia restante",
    remainingDays: "{count} dias restantes",
    warningExpired: "La licencia actual ha caducado. Introduce un nuevo codigo de activacion para restaurar el acceso.",
    warningActive: "El envio de un nuevo codigo de activacion sobrescribira la licencia instalada actualmente.",
    licenseRemovedStatus: "Licencia eliminada.",
    licenseRemovedMessage: "Licencia eliminada. La aplicacion requerira activacion en el siguiente ciclo de validacion.",
    licenseRemovedError: "Error al eliminar la licencia: ",
    emailAndCodeRequired: "El email y el codigo son obligatorios.",
    invalidEmail: "Introduce un email de cliente valido.",
    invalidCode: "Introduce un codigo de activacion valido que empiece por OS1.",
    validating: "Validando...",
    validationFailed: "La validacion ha fallado.",
    operationFailed: "No se pudo completar la operacion.",
    statusRefreshFailed: "No se pudo actualizar el estado de la licencia.",
    newLicenseAppliedStatus: "Nueva licencia aplicada correctamente.",
    newLicenseAppliedMessage: "Nueva licencia aplicada. La validacion se realiza automaticamente en 60 segundos.",
    activatingTrial: "Activando prueba...",
    trialActivatedStatus: "Prueba de 15 dias activada correctamente.",
    trialActivatedMessage: "Prueba activada. Tienes 15 dias de acceso ilimitado.",
    trialDisabledExhausted: "La prueba local ya no esta disponible en este puesto.",
    activationFailed: "La activacion ha fallado."
  }),
  fr: createSetupWizardLicenseCopy("fr", {
    locale: "fr-FR",
    plans: { monthly: "Mensuelle", semiannual: "Semestrielle", annual: "Annuelle", lifetime: "A vie", trial: "Essai" },
    eyebrow: "Licence",
    title: "Licence et activation",
    statusTitle: "Etat de la licence",
    loadingLicense: "Chargement de l'etat de la licence...",
    refreshBtn: "Actualiser l'etat de la licence",
    activateTitle: "Activer le poste",
    restoreTitle: "Restaurer l'acces",
    replaceTitle: "Remplacer la licence installee",
    restoreSubmitLabel: "Restaurer l'acces",
    replaceSubmitLabel: "Remplacer la licence installee",
    trialTitle: "Essai local",
    trialBtn: "Demarrer l'essai",
    trialExhausted: "L'essai local n'est plus disponible sur ce poste. Contactez le fournisseur pour une licence.",
    removeTitle: "Supprimer la licence installee",
    removeBtn: "Supprimer la licence selectionnee",
    removeSelectionLabel: "Selectionnez la licence installee avant de la supprimer.",
    removeSelectionRequired: "Selectionnez la licence installee avant de la supprimer.",
    removeDisabledUnavailable: "Aucune licence installee n'est disponible pour la suppression sur ce poste.",
    removeDisabledUnconfirmed: "Selectionnez la licence installee avant de la supprimer.",
    removeConfirmPrompt: "Supprimer la licence enregistree de ce poste ?",
    noLicense: "Aucune licence",
    noLicenseBody: "Aucune licence n'est installee sur ce poste.",
    active: "ACTIVE",
    expired: "EXPIREE",
    plan: "Forfait",
    activatedOn: "Activee le",
    issuedOn: "Emise le",
    expiry: "Expiration",
    noExpiry: "Aucune expiration (A vie)",
    expiredDay: "Expiree il y a {count} jour",
    expiredDays: "Expiree il y a {count} jours",
    remainingDay: "{count} jour restant",
    remainingDays: "{count} jours restants",
    warningExpired: "La licence actuelle a expire. Saisissez un nouveau code d'activation pour restaurer l'acces.",
    warningActive: "L'envoi d'un nouveau code d'activation ecrasera la licence actuellement installee.",
    licenseRemovedStatus: "Licence supprimee.",
    licenseRemovedMessage: "Licence supprimee. L'application demandera une activation lors du prochain cycle de validation.",
    licenseRemovedError: "Erreur de suppression de la licence : ",
    emailAndCodeRequired: "L'email et le code sont obligatoires.",
    invalidEmail: "Saisissez un email client valide.",
    invalidCode: "Saisissez un code d'activation valide qui commence par OS1.",
    validating: "Validation en cours...",
    validationFailed: "La validation a echoue.",
    operationFailed: "L'operation n'a pas pu etre terminee.",
    statusRefreshFailed: "Impossible d'actualiser l'etat de la licence.",
    newLicenseAppliedStatus: "Nouvelle licence appliquee avec succes.",
    newLicenseAppliedMessage: "Nouvelle licence appliquee. La verification a lieu automatiquement sous 60 secondes.",
    activatingTrial: "Activation de l'essai...",
    trialActivatedStatus: "Essai de 15 jours active avec succes.",
    trialActivatedMessage: "Essai active. Vous disposez de 15 jours d'acces illimite.",
    trialDisabledExhausted: "L'essai local n'est plus disponible sur ce poste.",
    activationFailed: "L'activation a echoue."
  }),
  de: createSetupWizardLicenseCopy("de", {
    locale: "de-DE",
    plans: { monthly: "Monatlich", semiannual: "Halbjaehrlich", annual: "Jaehrlich", lifetime: "Lebenslang", trial: "Test" },
    eyebrow: "Lizenz",
    title: "Lizenz und Aktivierung",
    statusTitle: "Lizenzstatus",
    loadingLicense: "Lizenzstatus wird geladen...",
    refreshBtn: "Lizenzstatus aktualisieren",
    activateTitle: "Station aktivieren",
    restoreTitle: "Zugriff wiederherstellen",
    replaceTitle: "Installierte Lizenz ersetzen",
    restoreSubmitLabel: "Zugriff wiederherstellen",
    replaceSubmitLabel: "Installierte Lizenz ersetzen",
    trialTitle: "Lokaler Test",
    trialBtn: "Test starten",
    trialExhausted: "Der lokale Test ist auf dieser Station nicht mehr verfuegbar. Kontaktieren Sie den Anbieter fuer eine Lizenz.",
    removeTitle: "Installierte Lizenz entfernen",
    removeBtn: "Ausgewaehlte Lizenz entfernen",
    removeSelectionLabel: "Waehlen Sie die installierte Lizenz aus, bevor Sie sie entfernen.",
    removeSelectionRequired: "Waehlen Sie die installierte Lizenz aus, bevor Sie sie entfernen.",
    removeDisabledUnavailable: "Auf dieser Station steht keine installierte Lizenz zum Entfernen bereit.",
    removeDisabledUnconfirmed: "Waehlen Sie die installierte Lizenz aus, bevor Sie sie entfernen.",
    removeConfirmPrompt: "Die gespeicherte Lizenz von dieser Station entfernen?",
    noLicense: "Keine Lizenz",
    noLicenseBody: "Auf diesem Geraet ist keine Lizenz installiert.",
    active: "AKTIV",
    expired: "ABGELAUFEN",
    plan: "Tarif",
    activatedOn: "Aktiviert am",
    issuedOn: "Ausgestellt am",
    expiry: "Ablauf",
    noExpiry: "Kein Ablaufdatum (Lebenslang)",
    expiredDay: "Vor {count} Tag abgelaufen",
    expiredDays: "Vor {count} Tagen abgelaufen",
    remainingDay: "{count} Tag verbleibend",
    remainingDays: "{count} Tage verbleibend",
    warningExpired: "Die aktuelle Lizenz ist abgelaufen. Geben Sie einen neuen Aktivierungscode ein, um den Zugriff wiederherzustellen.",
    warningActive: "Wenn Sie einen neuen Aktivierungscode senden, wird die aktuell installierte Lizenz ueberschrieben.",
    licenseRemovedStatus: "Lizenz entfernt.",
    licenseRemovedMessage: "Lizenz entfernt. Die Anwendung fordert im naechsten Validierungszyklus erneut eine Aktivierung an.",
    licenseRemovedError: "Fehler beim Entfernen der Lizenz: ",
    emailAndCodeRequired: "E-Mail und Code sind erforderlich.",
    invalidEmail: "Geben Sie eine gueltige Kunden-E-Mail ein.",
    invalidCode: "Geben Sie einen gueltigen Aktivierungscode ein, der mit OS1 beginnt.",
    validating: "Validierung laeuft...",
    validationFailed: "Validierung fehlgeschlagen.",
    operationFailed: "Der Vorgang konnte nicht abgeschlossen werden.",
    statusRefreshFailed: "Lizenzstatus konnte nicht aktualisiert werden.",
    newLicenseAppliedStatus: "Neue Lizenz erfolgreich angewendet.",
    newLicenseAppliedMessage: "Neue Lizenz angewendet. Die Verifizierung erfolgt automatisch innerhalb von 60 Sekunden.",
    activatingTrial: "Testversion wird aktiviert...",
    trialActivatedStatus: "15-Tage-Test erfolgreich aktiviert.",
    trialActivatedMessage: "Test aktiviert. Sie haben 15 Tage unbegrenzten Zugriff.",
    trialDisabledExhausted: "Der lokale Test ist auf dieser Station nicht mehr verfuegbar.",
    activationFailed: "Aktivierung fehlgeschlagen."
  }),
  zh: createSetupWizardLicenseCopy("zh", {
    locale: "zh-CN",
    plans: { monthly: "月度", semiannual: "半年", annual: "年度", lifetime: "终身", trial: "试用" },
    eyebrow: "许可",
    title: "许可与激活",
    statusTitle: "许可状态",
    loadingLicense: "正在加载许可状态...",
    refreshBtn: "刷新许可状态",
    activateTitle: "激活工作站",
    restoreTitle: "恢复访问",
    replaceTitle: "替换已安装许可",
    restoreSubmitLabel: "恢复访问",
    replaceSubmitLabel: "替换已安装许可",
    trialTitle: "本地试用",
    trialBtn: "开始试用",
    trialExhausted: "这台工作站已无法再使用本地试用。请联系供应商获取许可。",
    removeTitle: "移除已安装许可",
    removeBtn: "移除所选许可",
    removeSelectionLabel: "移除前请先选中已安装的许可。",
    removeSelectionRequired: "移除前请先选中已安装的许可。",
    removeDisabledUnavailable: "此工作站上没有可移除的已安装许可。",
    removeDisabledUnconfirmed: "移除前请先选中已安装的许可。",
    removeConfirmPrompt: "要从这台工作站移除已保存的许可吗？",
    noLicense: "无许可",
    noLicenseBody: "此设备上未安装许可。",
    active: "有效",
    expired: "已过期",
    plan: "方案",
    activatedOn: "激活日期",
    issuedOn: "签发日期",
    expiry: "到期时间",
    noExpiry: "无到期时间（终身）",
    expiredDay: "已于 {count} 天前过期",
    expiredDays: "已于 {count} 天前过期",
    remainingDay: "剩余 {count} 天",
    remainingDays: "剩余 {count} 天",
    warningExpired: "当前许可已过期。请输入新的激活码以恢复访问。",
    warningActive: "提交新的激活码会覆盖当前已安装的许可。",
    licenseRemovedStatus: "许可已移除。",
    licenseRemovedMessage: "许可已移除。应用会在下一次校验周期要求重新激活。",
    licenseRemovedError: "移除许可时出错：",
    emailAndCodeRequired: "邮箱和激活码为必填项。",
    invalidEmail: "请输入有效的客户邮箱。",
    invalidCode: "请输入以 OS1 开头的有效激活码。",
    validating: "正在校验...",
    validationFailed: "校验失败。",
    operationFailed: "操作无法完成。",
    statusRefreshFailed: "无法刷新许可状态。",
    newLicenseAppliedStatus: "新许可已成功应用。",
    newLicenseAppliedMessage: "新许可已应用。系统会在 60 秒内自动完成校验。",
    activatingTrial: "正在激活试用...",
    trialActivatedStatus: "15 天试用已成功激活。",
    trialActivatedMessage: "试用已激活。你有 15 天的无限制访问权限。",
    trialDisabledExhausted: "这台工作站已无法再使用本地试用。",
    activationFailed: "激活失败。"
  })
}) satisfies Readonly<Record<SetupWizardUiLanguage, SetupWizardLicenseCopy>>;

export function getSetupWizardLicenseCopy(
  uiLanguage: SetupWizardUiLanguage = "en"
): SetupWizardLicenseCopy {
  return SETUP_WIZARD_LICENSE_COPY_BY_LANGUAGE[normalizeSetupWizardUiLanguage(uiLanguage)];
}
