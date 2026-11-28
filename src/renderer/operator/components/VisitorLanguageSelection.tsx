import { useEffect, useState, type ReactNode } from "react";
import type { InteractionLanguageChoice } from "../../../shared/language-flow.js";
import { getRuntimeDisclosureText } from "../../../shared/runtime-disclosure.js";
import type { RuntimeDisclosureSettings } from "../../../shared/types.js";
import { RuntimeDisclosureCard } from "./RuntimeDisclosureCard.js";
import { WorldMapLanguageSelector } from "./WorldMapLanguageSelector.js";

interface VisitorLanguageSelectionProps {
  languageCode: string;
  title: string;
  description: string;
  selectedLanguage: string | null;
  choices: InteractionLanguageChoice[];
  onSelect: (language: string) => void;
  disclosure?: ReactNode;
  runtimeDisclosureSettings?: RuntimeDisclosureSettings | null;
}

export function VisitorLanguageSelection(props: VisitorLanguageSelectionProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(props.selectedLanguage ?? "");
  const disclosureLanguage = selectedLanguage || props.selectedLanguage || props.languageCode;
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
    setSelectedLanguage(props.selectedLanguage ?? "");
  }, [props.selectedLanguage]);

  return (
    <div className="language-selection visitor-language-selection">
      <div className="language-card visitor-language-card">
        <div className="language-card-header">
          <span className="eyebrow">OnlySpeech</span>
          <h1>{props.title}</h1>
          <p className="language-description">{props.description}</p>
          {disclosure}
        </div>
        <WorldMapLanguageSelector
          displayLanguage={props.languageCode}
          choices={props.choices}
          selectedLanguage={selectedLanguage}
          confirmSelection={false}
          confirmLabel=""
          onSelect={(language) => {
            setSelectedLanguage(language);
            props.onSelect(language);
          }}
        />
      </div>
    </div>
  );
}
