import type { ReactNode } from "react";
import type { ActivationStatusTone } from "../activation-copy.js";
import { ActivationButtonBar } from "./ActivationButtonBar.js";

interface ActivationStatusPanelProps {
  actions?: ReactNode;
  detail?: string | null;
  label: string;
  message: string;
  suggestion?: string | null;
  suggestionLabel?: string;
  title: string;
  tone: ActivationStatusTone;
}

export function ActivationStatusPanel({
  actions,
  detail,
  label,
  message,
  suggestion,
  suggestionLabel,
  title,
  tone
}: ActivationStatusPanelProps) {
  return (
    <div className={`activation-status activation-status-${tone}`} aria-live="polite" role="status">
      <span className="activation-status-label">{label}</span>
      <strong>{title}</strong>
      <p className="activation-status-message">{message}</p>
      {suggestion ? (
        <div className="activation-status-suggestion">
          <span>{suggestionLabel ?? label}</span>
          <p>{suggestion}</p>
        </div>
      ) : null}
      {detail ? <pre className="activation-status-detail">{detail}</pre> : null}
      {actions ? (
        <ActivationButtonBar className="activation-status-actions">
          {actions}
        </ActivationButtonBar>
      ) : null}
    </div>
  );
}
