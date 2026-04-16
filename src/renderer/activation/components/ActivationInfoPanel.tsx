import type { ActivationCopy } from "../activation-copy.js";

interface ActivationInfoPanelProps {
  text: ActivationCopy;
}

export function ActivationInfoPanel({ text }: ActivationInfoPanelProps) {
  return (
    <section className="activation-panel activation-panel-muted">
      <h2>{text.supportTitle}</h2>
      <ul className="activation-checklist">
        {text.supportItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
