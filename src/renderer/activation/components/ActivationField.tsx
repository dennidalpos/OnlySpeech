import type { ReactNode } from "react";

interface ActivationFieldProps {
  action?: ReactNode;
  children: ReactNode;
  hint?: string;
  label: string;
  name: string;
  valid?: boolean;
}

export function ActivationField({
  action,
  children,
  hint,
  label,
  name,
  valid = false
}: ActivationFieldProps) {
  return (
    <label className={`activation-field${valid ? " activation-field-valid" : ""}`} htmlFor={name}>
      <span className="activation-field-head">
        <span className="activation-field-label">{label}</span>
        {action ? <span className="activation-field-action">{action}</span> : null}
      </span>
      {children}
      {hint ? <span className="activation-field-hint">{hint}</span> : null}
    </label>
  );
}
