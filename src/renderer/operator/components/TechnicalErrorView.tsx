import { getTechnicalIssueCopy, getUiText } from "../../../shared/ui-localization.js";
import {
  getVisitorLocalizationBundle,
  localizeVisitorTechnicalIssues
} from "../../../shared/visitor-localization-bundle.js";
import type { TechnicalIssue, UiLanguage } from "../../../shared/types.js";

interface TechnicalErrorViewProps {
  issues: TechnicalIssue[];
  language?: UiLanguage;
  visitorLanguageCode?: string | null;
  onRetry: () => void;
  onOpenSetup?: () => void;
}

const SETUP_REPAIR_CODES = new Set<TechnicalIssue["code"]>([
  "missing-monitor",
  "missing-microphone-a",
  "missing-microphone-b",
  "microphone-permission-denied",
  "microphone-unavailable",
  "speech-config-missing",
  "translation-config-missing",
  "translation-provider-failure"
]);

export function TechnicalErrorView({
  issues,
  language,
  visitorLanguageCode,
  onRetry,
  onOpenSetup
}: TechnicalErrorViewProps) {
  const visitorLocalization = visitorLanguageCode ? getVisitorLocalizationBundle(visitorLanguageCode) : null;
  const operatorLanguage = language ?? "en";
  const operatorLabels = getUiText(operatorLanguage);
  const localizedIssues = visitorLanguageCode
    ? localizeVisitorTechnicalIssues(issues, visitorLanguageCode).map((issue) => ({
        issue,
        recovery: undefined
      }))
    : issues.map((issue) => {
        const copy = getTechnicalIssueCopy(issue, operatorLanguage);
        return {
          issue: {
            ...issue,
            message: copy.message
          },
          recovery: copy.recovery
        };
      });
  const retryable = issues.some((issue) => issue.retryable);
  const title = visitorLocalization?.technicalText.technicalError ?? operatorLabels.technicalError;
  const unavailableSystem = visitorLocalization?.technicalText.unavailableSystem ?? operatorLabels.unavailableSystem;
  const retryLabel = visitorLocalization?.technicalText.retry ?? operatorLabels.retry;
  const showOpenSetup = Boolean(onOpenSetup) && issues.some((issue) => SETUP_REPAIR_CODES.has(issue.code));

  return (
    <div className="technical-error-screen">
      <div className="technical-error-card">
        <span className="eyebrow">{title}</span>
        <h1>{localizedIssues[0]?.issue.message || unavailableSystem}</h1>
        <div className="technical-error-list">
          {localizedIssues.map(({ issue, recovery }) => (
            <div className="technical-error-item" key={`${issue.code}-${issue.side || "all"}`}>
              <span>{issue.message}</span>
              {recovery ? <small>{recovery}</small> : null}
            </div>
          ))}
        </div>
        {retryable || showOpenSetup ? (
          <div className="inline-actions inline-actions-single">
            {retryable ? (
              <button className="primary-button wide-button" type="button" onClick={onRetry}>
                {retryLabel}
              </button>
            ) : null}
            {showOpenSetup ? (
              <button className="secondary-button wide-button" type="button" onClick={onOpenSetup}>
                {operatorLabels.openSetup}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
