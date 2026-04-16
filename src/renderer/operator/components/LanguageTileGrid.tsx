import type { InteractionLanguageChoice } from "../../../shared/language-flow.js";
import { FlagIcon } from "./FlagIcon.js";

interface LanguageTileGridProps {
  choices: InteractionLanguageChoice[];
  selectedLanguage: string | null;
  onSelect: (language: string) => void;
}

export function LanguageTileGrid(props: LanguageTileGridProps) {
  return (
    <div className="visitor-language-grid">
      {props.choices.map((choice) => {
        const isSelected = props.selectedLanguage === choice.value;
        return (
          <button
            key={choice.value}
            className={`visitor-language-tile${isSelected ? " selected" : ""}`}
            type="button"
            onClick={() => props.onSelect(choice.value)}
          >
            <FlagIcon id={choice.value} regionCode={choice.regionCode} />
            <strong>{choice.nativeLabel}</strong>
          </button>
        );
      })}
    </div>
  );
}
