export const SHARED_LICENSE_COPY_LANGUAGES = [
  "en",
  "it",
  "es",
  "fr",
  "de",
  "zh"
] as const;

export type SharedLicenseCopyLanguage = (typeof SHARED_LICENSE_COPY_LANGUAGES)[number];

export interface SharedLicenseFormCopy {
  activateSubmitLabel: string;
  codeLabel: string;
  codePlaceholder: string;
  detailsHideLabel: string;
  detailsShowLabel: string;
  emailLabel: string;
  emailPlaceholder: string;
}

export const SHARED_LICENSE_FORM_COPY_BY_LANGUAGE = Object.freeze({
  en: {
    activateSubmitLabel: "Activate workstation",
    emailLabel: "Customer email",
    emailPlaceholder: "customer@example.com",
    codeLabel: "Activation code",
    codePlaceholder: "OS1.payload.signature",
    detailsShowLabel: "Error details",
    detailsHideLabel: "Hide details"
  },
  it: {
    activateSubmitLabel: "Attiva postazione",
    emailLabel: "Email cliente",
    emailPlaceholder: "cliente@example.com",
    codeLabel: "Codice di attivazione",
    codePlaceholder: "OS1.payload.signature",
    detailsShowLabel: "Dettagli errore",
    detailsHideLabel: "Nascondi dettagli"
  },
  es: {
    activateSubmitLabel: "Activar puesto",
    emailLabel: "Email del cliente",
    emailPlaceholder: "cliente@example.com",
    codeLabel: "Codigo de activacion",
    codePlaceholder: "OS1.payload.signature",
    detailsShowLabel: "Detalles del error",
    detailsHideLabel: "Ocultar detalles"
  },
  fr: {
    activateSubmitLabel: "Activer le poste",
    emailLabel: "Email client",
    emailPlaceholder: "client@example.com",
    codeLabel: "Code d'activation",
    codePlaceholder: "OS1.payload.signature",
    detailsShowLabel: "Details de l'erreur",
    detailsHideLabel: "Masquer les details"
  },
  de: {
    activateSubmitLabel: "Station aktivieren",
    emailLabel: "Kunden-E-Mail",
    emailPlaceholder: "kunde@example.com",
    codeLabel: "Aktivierungscode",
    codePlaceholder: "OS1.payload.signature",
    detailsShowLabel: "Fehlerdetails",
    detailsHideLabel: "Details ausblenden"
  },
  zh: {
    activateSubmitLabel: "激活工作站",
    emailLabel: "客户邮箱",
    emailPlaceholder: "customer@example.com",
    codeLabel: "激活码",
    codePlaceholder: "OS1.payload.signature",
    detailsShowLabel: "错误详情",
    detailsHideLabel: "隐藏详情"
  }
}) satisfies Readonly<Record<SharedLicenseCopyLanguage, SharedLicenseFormCopy>>;

export function getSharedLicenseFormCopy(
  language: SharedLicenseCopyLanguage
): SharedLicenseFormCopy {
  return SHARED_LICENSE_FORM_COPY_BY_LANGUAGE[language];
}
