import type { ReactNode } from "react";

interface ActivationButtonBarProps {
  children: ReactNode;
  className?: string;
}

export function ActivationButtonBar({
  children,
  className = ""
}: ActivationButtonBarProps) {
  const nextClassName = ["activation-button-bar", className].filter(Boolean).join(" ");
  return <div className={nextClassName}>{children}</div>;
}
