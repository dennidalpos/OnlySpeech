import type { ActivationGateState } from "../../shared/types.js";
import { getSharedLicenseFormCopy } from "../../shared/license-copy.js";

export type ActivationUiLanguage = "it" | "en";
export type ActivationStatusTone = ActivationGateState["status"] | "success";

interface ActivationStatusDescriptor {
  suggestion?: string;
  summary: string;
  title: string;
}

export interface ActivationCopy {
  body: string;
  clearCodeLabel: string;
  clearEmailLabel: string;
  clearLabel: string;
  codeLabel: string;
  codePlaceholder: string;
  codeValidHint: string;
  copyStatusCopiedLabel: string;
  copyStatusLabel: string;
  detailsHideLabel: string;
  detailsShowLabel: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailValidHint: string;
  eyebrow: string;
  formBody: string;
  formTitle: string;
  pendingLabel: string;
  retryStatusLabel: string;
  retryStatusPendingLabel: string;
  statusLabel: string;
  statusSuggestionLabel: string;
  statusMeta: Record<ActivationStatusTone, ActivationStatusDescriptor>;
  submitLabel: string;
  supportItems: readonly string[];
  supportTitle: string;
  technicalFallback: string;
  title: string;
  trialDescription: string;
  trialLabel: string;
  trialPending: string;
  trialTitle: string;
}

type ActivationSpecificCopy = Omit<
  ActivationCopy,
  | "codeLabel"
  | "codePlaceholder"
  | "detailsHideLabel"
  | "detailsShowLabel"
  | "emailLabel"
  | "emailPlaceholder"
  | "submitLabel"
>;

function createActivationCopy(
  language: ActivationUiLanguage,
  specificCopy: ActivationSpecificCopy
): ActivationCopy {
  const sharedCopy = getSharedLicenseFormCopy(language);

  return {
    ...specificCopy,
    emailLabel: sharedCopy.emailLabel,
    emailPlaceholder: sharedCopy.emailPlaceholder,
    codeLabel: sharedCopy.codeLabel,
    codePlaceholder: sharedCopy.codePlaceholder,
    submitLabel: sharedCopy.activateSubmitLabel,
    detailsShowLabel: sharedCopy.detailsShowLabel,
    detailsHideLabel: sharedCopy.detailsHideLabel
  };
}

export const ACTIVATION_COPY: Record<ActivationUiLanguage, ActivationCopy> = {
  en: createActivationCopy("en", {
    eyebrow: "Packaged activation",
    title: "Unlock this workstation",
    body: "Enter the customer email and offline code already issued for this device.",
    formTitle: "Activation code",
    formBody: "Use the exact purchase email and paste the code without editing it.",
    emailValidHint: "Email format looks valid.",
    clearEmailLabel: "Clear email",
    codeValidHint: "Offline code format recognized.",
    clearCodeLabel: "Clear code",
    clearLabel: "Clear form",
    pendingLabel: "Verifying activation...",
    retryStatusLabel: "Retry status",
    retryStatusPendingLabel: "Refreshing status...",
    copyStatusLabel: "Copy status",
    copyStatusCopiedLabel: "Copied",
    statusLabel: "Current state",
    statusSuggestionLabel: "Suggested next step",
    supportTitle: "Checks before retrying",
    supportItems: [
      "Confirm the purchase email matches the code.",
      "Paste the code as one line, including the OS1 prefix.",
      "If the clock changed on this device, correct date and time before retrying."
    ],
    trialTitle: "Need temporary access?",
    trialDescription: "Start the built-in 15-day local trial only on a workstation that has never been unlocked before.",
    trialLabel: "Start 15-day trial",
    trialPending: "Starting trial...",
    technicalFallback: "Activation services are unavailable in this runtime.",
    statusMeta: {
      required: {
        title: "Activation required",
        summary: "Activation is required before startup can continue.",
        suggestion: "Enter the issued email and activation code, then confirm."
      },
      "invalid-code": {
        title: "Invalid code",
        summary: "Activation code is invalid.",
        suggestion: "Check the OS1 prefix and paste the full code again."
      },
      "email-mismatch": {
        title: "Email mismatch",
        summary: "Activation code does not match the provided customer email.",
        suggestion: "Use the purchase email paired with this license."
      },
      "expired-license": {
        title: "Code expired",
        summary: "Activation code is expired.",
        suggestion: "Request a replacement code before retrying."
      },
      "clock-rollback": {
        title: "Clock check failed",
        summary: "Local clock rollback exceeds the offline activation tolerance.",
        suggestion: "Restore the correct local date and time, then retry."
      },
      "invalid-state": {
        title: "Activation data error",
        summary: "Stored activation data could not be read.",
        suggestion: "Retry once. If the issue remains, reopen startup or repair from setup."
      },
      "trial-exhausted": {
        title: "Trial unavailable",
        summary: "Trial already used on this device. Purchase a license to continue.",
        suggestion: "Use a purchased license or replace the current one from setup."
      },
      success: {
        title: "Activation accepted",
        summary: "Activation accepted. Continuing startup..."
      }
    }
  }),
  it: createActivationCopy("it", {
    eyebrow: "Attivazione pacchetto",
    title: "Sblocca questa postazione",
    body: "Inserisci email cliente e codice offline gia' emessi per questo dispositivo.",
    formTitle: "Codice di attivazione",
    formBody: "Usa l'email di acquisto esatta e incolla il codice senza modificarlo.",
    emailValidHint: "Formato email valido.",
    clearEmailLabel: "Pulisci email",
    codeValidHint: "Formato codice offline riconosciuto.",
    clearCodeLabel: "Pulisci codice",
    clearLabel: "Pulisci modulo",
    pendingLabel: "Verifica attivazione in corso...",
    retryStatusLabel: "Riprova stato",
    retryStatusPendingLabel: "Aggiornamento stato...",
    copyStatusLabel: "Copia stato",
    copyStatusCopiedLabel: "Copiato",
    statusLabel: "Stato corrente",
    statusSuggestionLabel: "Passo consigliato",
    supportTitle: "Controlli prima di riprovare",
    supportItems: [
      "Verifica che l'email di acquisto corrisponda al codice.",
      "Incolla il codice su una sola riga, incluso il prefisso OS1.",
      "Se l'orologio del dispositivo e' cambiato, correggi data e ora prima di riprovare."
    ],
    trialTitle: "Serve accesso temporaneo?",
    trialDescription: "Avvia la prova locale di 15 giorni solo su una postazione mai sbloccata prima.",
    trialLabel: "Avvia prova 15 giorni",
    trialPending: "Avvio prova in corso...",
    technicalFallback: "I servizi di attivazione non sono disponibili in questo runtime.",
    statusMeta: {
      required: {
        title: "Attivazione richiesta",
        summary: "L'attivazione e' necessaria prima di continuare l'avvio.",
        suggestion: "Inserisci email e codice emessi per questa postazione, poi conferma."
      },
      "invalid-code": {
        title: "Codice non valido",
        summary: "Il codice di attivazione non e' valido.",
        suggestion: "Controlla il prefisso OS1 e incolla di nuovo il codice completo."
      },
      "email-mismatch": {
        title: "Email non corrispondente",
        summary: "Il codice di attivazione non corrisponde all'email inserita.",
        suggestion: "Usa l'email di acquisto associata a questa licenza."
      },
      "expired-license": {
        title: "Codice scaduto",
        summary: "Il codice di attivazione e' scaduto.",
        suggestion: "Richiedi un codice sostitutivo prima di riprovare."
      },
      "clock-rollback": {
        title: "Controllo orologio fallito",
        summary: "L'orologio locale e' stato riportato indietro oltre la tolleranza offline.",
        suggestion: "Ripristina data e ora corrette della postazione, poi riprova."
      },
      "invalid-state": {
        title: "Errore dati attivazione",
        summary: "I dati di attivazione salvati non sono leggibili.",
        suggestion: "Riprova una volta. Se persiste, riapri l'avvio o ripara dal setup."
      },
      "trial-exhausted": {
        title: "Prova non disponibile",
        summary: "La prova e' gia' stata utilizzata su questo dispositivo. Acquista una licenza per continuare.",
        suggestion: "Usa una licenza acquistata o sostituisci quella corrente dal setup."
      },
      success: {
        title: "Attivazione accettata",
        summary: "Attivazione accettata. Avvio in corso..."
      }
    }
  })
};

export function resolveActivationUiLanguage(): ActivationUiLanguage {
  return navigator.language.toLowerCase().startsWith("it") ? "it" : "en";
}

export function getActivationStatusDescriptor(
  status: ActivationStatusTone,
  language: ActivationUiLanguage
): ActivationStatusDescriptor {
  return ACTIVATION_COPY[language].statusMeta[status];
}
