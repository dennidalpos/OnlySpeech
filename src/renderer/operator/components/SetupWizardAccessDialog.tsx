import { useState } from "react";

interface SetupWizardAccessDialogProps {
  title: string;
  description: string;
  passwordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  submitLabel: string;
  cancelLabel: string;
  mustChangePassword: boolean;
  busy?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onSubmit: (payload: { password: string; nextPassword?: string; confirmPassword?: string }) => void | Promise<void>;
}

export function SetupWizardAccessDialog(props: SetupWizardAccessDialogProps) {
  const [password, setPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="dialog-card" role="dialog" aria-modal="true" aria-label={props.title}>
        <h2>{props.title}</h2>
        <p>{props.description}</p>
        <div className="setup-access-form">
          <label className="setup-access-field">
            <span>{props.passwordLabel}</span>
            <input
              autoFocus
              type="password"
              value={password}
              disabled={props.busy}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {props.mustChangePassword ? (
            <>
              <label className="setup-access-field">
                <span>{props.newPasswordLabel}</span>
                <input
                  type="password"
                  value={nextPassword}
                  disabled={props.busy}
                  onChange={(event) => setNextPassword(event.target.value)}
                />
              </label>
              <label className="setup-access-field">
                <span>{props.confirmPasswordLabel}</span>
                <input
                  type="password"
                  value={confirmPassword}
                  disabled={props.busy}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>
            </>
          ) : null}
          {props.errorMessage ? <div className="setup-access-error">{props.errorMessage}</div> : null}
        </div>
        <div className="dialog-actions">
          <button className="secondary-button" type="button" disabled={props.busy} onClick={props.onCancel}>
            {props.cancelLabel}
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={props.busy}
            onClick={() =>
              props.onSubmit({
                password,
                nextPassword: props.mustChangePassword ? nextPassword : undefined,
                confirmPassword: props.mustChangePassword ? confirmPassword : undefined
              })
            }
          >
            {props.submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
