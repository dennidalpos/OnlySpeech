import type { ActivationCopy } from "../activation-copy.js";

interface ActivationHeroPanelProps {
  text: ActivationCopy;
}

export function ActivationHeroPanel({ text }: ActivationHeroPanelProps) {
  return (
    <aside className="activation-overview">
      <p className="activation-eyebrow">{text.eyebrow}</p>
      <h1>{text.title}</h1>
      <p className="activation-body">{text.body}</p>
    </aside>
  );
}
