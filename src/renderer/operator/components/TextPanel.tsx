import type { ReactNode } from "react";
import { SpeakerControl } from "./SpeakerControl.js";

interface TextPanelProps {
  title: string;
  value: string;
  hint: string;
  accent: "warm" | "cool";
  footer?: ReactNode;
  history?: ReactNode;
  speechControl?: {
    active: boolean;
    disabled: boolean;
    label: string;
    status: string | null;
    title: string;
    onClick: () => void;
  };
}

export function TextPanel({ title, value, hint, accent, footer, history, speechControl }: TextPanelProps) {
  return (
    <section className={`text-panel text-panel-${accent}`}>
      <header className="text-panel-header">
        <div className="text-panel-heading">
          <span className="text-panel-title">{title}</span>
        </div>
        {speechControl ? <SpeakerControl {...speechControl} /> : null}
      </header>
      <div className="text-panel-live">
        <div className={`text-panel-content${value ? "" : " is-empty"}`}>{value || hint}</div>
        {footer ? <footer className="text-panel-footer">{footer}</footer> : null}
      </div>
      {history ? <div className="text-panel-history">{history}</div> : null}
    </section>
  );
}
