import { useEffect } from "react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const titleId = "confirm-dialog-title";
  const descriptionId = "confirm-dialog-description";
  const { onCancel } = props;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

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
