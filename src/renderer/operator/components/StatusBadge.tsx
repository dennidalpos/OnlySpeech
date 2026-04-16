import { getUiText } from "../../../shared/ui-localization.js";
import type { OperatorStatus, UiLanguage } from "../../../shared/types.js";

export function StatusBadge({
  status,
  language,
  labels
}: {
  status: OperatorStatus;
  language?: UiLanguage;
  labels?: Record<OperatorStatus, string>;
}) {
  const badgeLabels = labels ?? getUiText(language ?? "en").statusLabels;
  return <div className={`status-badge status-${status}`}>{badgeLabels[status]}</div>;
}
