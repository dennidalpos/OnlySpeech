interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="dialog-card" role="dialog" aria-modal="true" aria-label={props.title}>
        <h2>{props.title}</h2>
        <p>{props.description}</p>
        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={props.onCancel}>
            {props.cancelLabel}
          </button>
          <button className="danger-button" type="button" onClick={props.onConfirm}>
            {props.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
