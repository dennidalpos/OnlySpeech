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
  const titleId = "setup-wizard-access-dialog-title";
  const descriptionId = "setup-wizard-access-dialog-description";

  const handleSubmit = () => {
    props.onSubmit({
      password,
      nextPassword: props.mustChangePassword ? nextPassword : undefined,
      confirmPassword: props.mustChangePassword ? confirmPassword : undefined
    });
  };

  return (
    <div className="dialog-backdrop" role="presentation">
      <div
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <h2 id={titleId}>{props.title}</h2>
        <p id={descriptionId}>{props.description}</p>
        <form
          className="setup-access-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!props.busy) {
              handleSubmit();
            }
          }}
        >
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
          {props.errorMessage ? (
            <div className="setup-access-error" role="alert" aria-live="assertive">
              {props.errorMessage}
            </div>
          ) : null}
          <div className="dialog-actions">
            <button className="secondary-button" type="button" disabled={props.busy} onClick={props.onCancel}>
              {props.cancelLabel}
            </button>
            <button className="primary-button" type="submit" disabled={props.busy}>
              {props.submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
