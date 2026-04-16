interface SetupWizardTemporaryPasswordNoticeProps {
  title: string;
  description: string;
  passwordLabel: string;
  temporaryPassword: string;
  dismissLabel: string;
  onDismiss: () => void;
}

export function SetupWizardTemporaryPasswordNotice(props: SetupWizardTemporaryPasswordNoticeProps) {
  return (
    <div className="setup-password-notice" role="status" aria-live="polite">
      <div className="setup-password-notice-copy">
        <strong>{props.title}</strong>
        <p>{props.description}</p>
        <div className="setup-password-notice-value">
          <span>{props.passwordLabel}</span>
          <code>{props.temporaryPassword}</code>
        </div>
      </div>
      <button className="secondary-button" type="button" onClick={props.onDismiss}>
        {props.dismissLabel}
      </button>
    </div>
  );
}
