import { getTechnicalIssueCopy, getUiText } from "../../../shared/ui-localization.js";
import {
  getVisitorLocalizationBundle,
  localizeVisitorTechnicalIssues
} from "../../../shared/visitor-localization-bundle.js";
import type { TechnicalIssue, UiLanguage } from "../../../shared/types.js";

interface RuntimeIssueBannerProps {
  issues: TechnicalIssue[];
  language: UiLanguage;
  visitorLanguageCode?: string | null;
  onRetry: () => void;
  onOpenSetup: () => void;
}

export function RuntimeIssueBanner({
  issues,
  language,
  visitorLanguageCode,
  onRetry,
  onOpenSetup
}: RuntimeIssueBannerProps) {
  const operatorLabels = getUiText(language);
  const visitorBundle = visitorLanguageCode ? getVisitorLocalizationBundle(visitorLanguageCode) : null;
  const localizedIssues = visitorLanguageCode
    ? localizeVisitorTechnicalIssues(issues, visitorLanguageCode)
    : issues.map((issue) => ({
        ...issue,
        message: getTechnicalIssueCopy(issue, language).message
      }));

  return (
    <div className="runtime-issue-banner" role="status" aria-live="polite">
      <div className="runtime-issue-banner-copy">
        <strong>{visitorBundle?.technicalText.technicalError ?? operatorLabels.technicalError}</strong>
        <ul className="runtime-issue-banner-list">
          {localizedIssues.map((issue) => (
            <li key={`${issue.code}-${issue.side ?? "all"}`}>{issue.message}</li>
          ))}
        </ul>
      </div>
      <div className="runtime-issue-banner-actions">
        {issues.some((issue) => issue.retryable) ? (
          <button className="secondary-button" type="button" onClick={onRetry}>
            {visitorBundle?.technicalText.retry ?? operatorLabels.retry}
          </button>
        ) : null}
        <button className="primary-button" type="button" onClick={onOpenSetup}>
          {operatorLabels.openSetup}
        </button>
      </div>
    </div>
  );
}
