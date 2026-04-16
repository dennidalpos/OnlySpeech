import type { InteractionLanguageChoice } from "../../../shared/language-flow.js";
import type { UiLanguage } from "../../../shared/types.js";
import { getUiText } from "../../../shared/ui-localization.js";
import { FlagIcon } from "./FlagIcon.js";

interface LanguageHeaderChipProps {
  title: string;
  choice: InteractionLanguageChoice | null;
  fallbackLabel: string;
  language?: UiLanguage;
  englishLabel?: string | null;
  showMeta?: boolean;
  configuredLabel?: string | null;
  uiFallback?: boolean;
}

export function LanguageHeaderChip(props: LanguageHeaderChipProps) {
  const labels = getUiText(props.language ?? "en");

  return (
    <div className="header-chip">
      <span>{props.title}</span>
      {props.choice ? (
        <>
          <div className="header-chip-value">
            <FlagIcon id={`chip-${props.choice.value}`} regionCode={props.choice.regionCode} />
            <strong>{props.choice.nativeLabel}</strong>
          </div>
          {props.englishLabel ? <small className="header-chip-english">{props.englishLabel}</small> : null}
          {props.configuredLabel ? (
            <small className="header-chip-configured">{labels.headerChipConfigured(props.configuredLabel)}</small>
          ) : null}
          {props.uiFallback ? <small className="header-chip-ui-fallback">{labels.headerChipUiFallback}</small> : null}
          {props.showMeta === false ? null : (
            <small className="header-chip-meta">
              {props.choice.macroAreaLabels.join(" • ")}
            </small>
          )}
        </>
      ) : (
        <>
          <strong>{props.fallbackLabel}</strong>
          {props.englishLabel ? <small className="header-chip-english">{props.englishLabel}</small> : null}
          {props.configuredLabel ? (
            <small className="header-chip-configured">{labels.headerChipConfigured(props.configuredLabel)}</small>
          ) : null}
          {props.uiFallback ? <small className="header-chip-ui-fallback">{labels.headerChipUiFallback}</small> : null}
        </>
      )}
    </div>
  );
}
