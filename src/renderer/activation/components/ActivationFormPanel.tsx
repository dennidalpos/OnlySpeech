import type { FormEventHandler } from "react";
import type { ActivationCopy } from "../activation-copy.js";
import { ActivationField } from "./ActivationField.js";
import { ActivationButtonBar } from "./ActivationButtonBar.js";

interface ActivationFormPanelProps {
  activationCode: string;
  codeValid: boolean;
  email: string;
  emailValid: boolean;
  isSubmitting: boolean;
  isTrialSubmitting: boolean;
  onActivationCodeChange: (value: string) => void;
  onClearActivationCode: () => void;
  onClearEmail: () => void;
  onClearFields: () => void;
  onEmailChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  text: ActivationCopy;
}

export function ActivationFormPanel({
  activationCode,
  codeValid,
  email,
  emailValid,
  isSubmitting,
  isTrialSubmitting,
  onActivationCodeChange,
  onClearActivationCode,
  onClearEmail,
  onClearFields,
  onEmailChange,
  onSubmit,
  text
}: ActivationFormPanelProps) {
  return (
    <section className="activation-panel">
      <div className="activation-panel-head">
        <div>
          <h2>{text.formTitle}</h2>
          <p>{text.formBody}</p>
        </div>
      </div>

      <form className="activation-form" onSubmit={onSubmit}>
        <ActivationField
          action={email ? (
            <button
              className="activation-inline-button"
              type="button"
              onClick={onClearEmail}
            >
              {text.clearEmailLabel}
            </button>
          ) : undefined}
          hint={emailValid ? text.emailValidHint : undefined}
          label={text.emailLabel}
          name="activation-email"
          valid={emailValid}
        >
          <input
            autoComplete="email"
            id="activation-email"
            name="activation-email"
            placeholder={text.emailPlaceholder}
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.currentTarget.value)}
          />
        </ActivationField>

        <ActivationField
          action={activationCode ? (
            <button
              className="activation-inline-button"
              type="button"
              onClick={onClearActivationCode}
            >
              {text.clearCodeLabel}
            </button>
          ) : undefined}
          hint={codeValid ? text.codeValidHint : undefined}
          label={text.codeLabel}
          name="activation-code"
          valid={codeValid}
        >
          <textarea
            id="activation-code"
            name="activation-code"
            placeholder={text.codePlaceholder}
            rows={5}
            spellCheck={false}
            value={activationCode}
            onChange={(event) => onActivationCodeChange(event.currentTarget.value)}
          />
        </ActivationField>

        <ActivationButtonBar className="activation-actions">
          <button className="activation-submit" disabled={isSubmitting || isTrialSubmitting} type="submit">
            {isSubmitting ? text.pendingLabel : text.submitLabel}
          </button>
          <button
            className="activation-secondary-button"
            disabled={isSubmitting || isTrialSubmitting}
            type="button"
            onClick={onClearFields}
          >
            {text.clearLabel}
          </button>
        </ActivationButtonBar>
      </form>
    </section>
  );
}
