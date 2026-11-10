import type { ActivationCopy } from "../activation-copy.js";
import { ActivationButtonBar } from "./ActivationButtonBar.js";

interface ActivationTrialPanelProps {
  disabled?: boolean;
  isTrialSubmitting: boolean;
  onStartTrial: () => void;
  text: ActivationCopy;
}

export function ActivationTrialPanel({
  disabled = false,
  isTrialSubmitting,
  onStartTrial,
  text
}: ActivationTrialPanelProps) {
  return (
    <section className="activation-panel activation-panel-muted activation-trial-panel">
      <h2>{text.trialTitle}</h2>
      <p>{text.trialDescription}</p>
      <ActivationButtonBar>
        <button
          type="button"
          className="activation-trial-button"
          onClick={onStartTrial}
          disabled={disabled || isTrialSubmitting}
        >
          {isTrialSubmitting ? text.trialPending : text.trialLabel}
        </button>
      </ActivationButtonBar>
    </section>
  );
}
