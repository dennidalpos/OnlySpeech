import { useEffect, useState, type ReactNode } from "react";
import { getUiText } from "../../../shared/ui-localization.js";
import {
  buildInteractionLanguageOptions,
  type InteractionLanguageChoice
} from "../../../shared/language-flow.js";
import { getRuntimeDisclosureText } from "../../../shared/runtime-disclosure.js";
import type { LanguageOption, RuntimeDisclosureSettings, UiLanguage } from "../../../shared/types.js";
import { RuntimeDisclosureCard } from "./RuntimeDisclosureCard.js";
import { WorldMapLanguageSelector } from "./WorldMapLanguageSelector.js";

interface LanguageSelectionProps {
  language: UiLanguage;
  title?: string;
  description?: string;
  selectedLanguage: string | null;
  initialMacroAreaLanguage?: string | null;
  options?: LanguageOption[];
  choices?: InteractionLanguageChoice[];
  appearance?: "select" | "tiles";
  confirmSelection?: boolean;
  preselectLanguage?: boolean;
  onSelect: (language: string) => void;
  onCancel?: () => void;
  disclosure?: ReactNode;
  runtimeDisclosureSettings?: RuntimeDisclosureSettings | null;
}

export function LanguageSelection(props: LanguageSelectionProps) {
  const labels = getUiText(props.language);
  const options = props.options ?? buildInteractionLanguageOptions();
  const choices = props.choices ?? [];
  const usesTiles = props.appearance === "tiles" && choices.length > 0;
  const confirmSelection = props.confirmSelection ?? true;
  const fallbackSelectedLanguage =
    props.selectedLanguage ??
    (usesTiles && props.preselectLanguage === false ? "" : usesTiles ? choices[0]?.value : options[0]?.value) ??
    "";
  const [selectedLanguage, setSelectedLanguage] = useState(fallbackSelectedLanguage);
  const disclosureLanguage =
    selectedLanguage || props.initialMacroAreaLanguage || props.selectedLanguage || props.language;
  const disclosureText = props.runtimeDisclosureSettings
    ? getRuntimeDisclosureText(disclosureLanguage, props.runtimeDisclosureSettings)
    : null;
  const disclosure = disclosureText ? (
    <RuntimeDisclosureCard
      title={disclosureText.title}
      paragraphs={disclosureText.paragraphs}
    />
  ) : props.disclosure;

  useEffect(() => {
    setSelectedLanguage(fallbackSelectedLanguage);
  }, [fallbackSelectedLanguage]);

  if (usesTiles) {
    return (
      <div className="language-selection visitor-language-selection">
        <div className="language-card visitor-language-card">
          <div className="language-card-header">
            <span className="eyebrow">OnlySpeech</span>
            <h1>{props.title ?? labels.selectLanguageTitle}</h1>
            {props.description ? <p className="language-description">{props.description}</p> : null}
            {disclosure}
          </div>
          <WorldMapLanguageSelector
            displayLanguage={props.language}
            choices={choices}
            selectedLanguage={selectedLanguage}
            initialMacroAreaLanguage={props.initialMacroAreaLanguage}
            confirmSelection={confirmSelection}
            confirmLabel={labels.confirm}
            preselectLanguage={props.preselectLanguage}
            cancelLabel={props.onCancel ? labels.cancel : undefined}
            onSelect={(language) => {
              setSelectedLanguage(language);
              props.onSelect(language);
            }}
            onCancel={props.onCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="language-selection">
      <div className="language-card">
        <span className="eyebrow">OnlySpeech</span>
        <h1>{props.title ?? labels.selectLanguageTitle}</h1>
        {props.description ? <p className="language-description">{props.description}</p> : null}
        {disclosure}
        <label className="language-select-field">
          <span>{labels.languageField}</span>
          <select value={selectedLanguage} onChange={(event) => setSelectedLanguage(event.target.value)}>
            {options.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
        <button className="language-button selected wide-button" type="button" onClick={() => props.onSelect(selectedLanguage)}>
          {labels.confirm}
        </button>
        {props.onCancel ? (
          <button className="secondary-button wide-button" type="button" onClick={props.onCancel}>
            {labels.cancel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
