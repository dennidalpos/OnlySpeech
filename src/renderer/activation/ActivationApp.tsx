import { ActivationFormPanel } from "./components/ActivationFormPanel.js";
import { ActivationHeroPanel } from "./components/ActivationHeroPanel.js";
import { ActivationInfoPanel } from "./components/ActivationInfoPanel.js";
import { ActivationScreenShell } from "./components/ActivationScreenShell.js";
import { ActivationStatusPanel } from "./components/ActivationStatusPanel.js";
import { ActivationTrialPanel } from "./components/ActivationTrialPanel.js";
import { useActivationWindow } from "./use-activation-window.js";

export function ActivationApp() {
  const {
    text,
    email,
    activationCode,
    statusTone,
    statusTitle,
    statusSummary,
    statusSuggestion,
    statusDetail,
    hasStatusDetails,
    statusDetailVisible,
    canCopyStatus,
    copiedStatus,
    emailValid,
    codeValid,
    copyStatus,
    isCopyingStatus,
    isStatusRefreshing,
    isSubmitting,
    isTrialSubmitting,
    refreshStatus,
    setEmail,
    setActivationCode,
    clearEmail,
    clearActivationCode,
    handleSubmit,
    handleTrial,
    clearFields,
    toggleStatusDetails
  } = useActivationWindow();

  return (
    <ActivationScreenShell
      sidebar={(
        <>
          <ActivationHeroPanel text={text} />
          <ActivationStatusPanel
            actions={(
              <>
                <button
                  className="activation-tertiary-button"
                  disabled={isStatusRefreshing || isSubmitting || isTrialSubmitting}
                  type="button"
                  onClick={refreshStatus}
                >
                  {isStatusRefreshing ? text.retryStatusPendingLabel : text.retryStatusLabel}
                </button>
                {canCopyStatus ? (
                  <button
                    className="activation-tertiary-button"
                    disabled={isCopyingStatus}
                    type="button"
                    onClick={copyStatus}
                  >
                    {copiedStatus ? text.copyStatusCopiedLabel : text.copyStatusLabel}
                  </button>
                ) : null}
                {hasStatusDetails ? (
                  <button
                    className="activation-tertiary-button"
                    type="button"
                    onClick={toggleStatusDetails}
                  >
                    {statusDetailVisible ? text.detailsHideLabel : text.detailsShowLabel}
                  </button>
                ) : null}
              </>
            )}
            detail={statusDetail}
            label={text.statusLabel}
            message={statusSummary}
            suggestion={statusSuggestion}
            suggestionLabel={text.statusSuggestionLabel}
            title={statusTitle}
            tone={statusTone}
          />
          <ActivationTrialPanel
            disabled={statusTone === "trial-exhausted" || isSubmitting}
            isTrialSubmitting={isTrialSubmitting}
            onStartTrial={handleTrial}
            text={text}
          />
        </>
      )}
    >
      <section className="activation-main">
        <div className="activation-primary-grid">
          <ActivationFormPanel
            activationCode={activationCode}
            codeValid={codeValid}
            email={email}
            emailValid={emailValid}
            isSubmitting={isSubmitting}
            isTrialSubmitting={isTrialSubmitting}
            onActivationCodeChange={setActivationCode}
            onClearActivationCode={clearActivationCode}
            onClearEmail={clearEmail}
            onClearFields={clearFields}
            onEmailChange={setEmail}
            onSubmit={handleSubmit}
            text={text}
          />
          <ActivationInfoPanel text={text} />
        </div>
      </section>
    </ActivationScreenShell>
  );
}
