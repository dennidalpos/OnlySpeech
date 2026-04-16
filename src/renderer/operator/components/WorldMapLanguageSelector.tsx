import { useEffect, useMemo, useState } from "react";
import {
  buildInteractionLanguageMacroAreaGroups,
  type InteractionLanguageMacroAreaGroup
} from "../../../shared/language-selector-map.js";
import type { InteractionLanguageChoice } from "../../../shared/language-flow.js";
import { InteractiveWorldMap } from "./InteractiveWorldMap.js";
import { LanguageTileGrid } from "./LanguageTileGrid.js";

interface WorldMapLanguageSelectorProps {
  displayLanguage: string;
  choices: InteractionLanguageChoice[];
  selectedLanguage: string | null;
  initialMacroAreaLanguage?: string | null;
  confirmSelection: boolean;
  confirmLabel: string;
  cancelLabel?: string;
  onSelect: (language: string) => void;
  onCancel?: () => void;
  preselectLanguage?: boolean;
}

function findGroupByLanguage(
  groups: InteractionLanguageMacroAreaGroup[],
  language: string | null | undefined
): InteractionLanguageMacroAreaGroup | null {
  if (!language) {
    return null;
  }

  return groups.find((group) => group.choices.some((choice) => choice.value === language)) ?? null;
}

function resolveInitialMacroArea(
  groups: InteractionLanguageMacroAreaGroup[],
  selectedLanguage: string | null,
  initialMacroAreaLanguage: string | null | undefined
): InteractionLanguageMacroAreaGroup | null {
  const selectedGroup = findGroupByLanguage(groups, selectedLanguage);
  const initialMacroAreaGroup = findGroupByLanguage(groups, initialMacroAreaLanguage);

  return selectedGroup ?? initialMacroAreaGroup ?? groups[0] ?? null;
}

export function WorldMapLanguageSelector(props: WorldMapLanguageSelectorProps) {
  const preselectLanguage = props.preselectLanguage ?? true;
  const groups = useMemo(
    () => buildInteractionLanguageMacroAreaGroups(props.choices, props.displayLanguage),
    [props.choices, props.displayLanguage]
  );
  const [activeMacroArea, setActiveMacroArea] = useState<InteractionLanguageMacroAreaGroup | null>(
    resolveInitialMacroArea(groups, props.selectedLanguage, props.initialMacroAreaLanguage)
  );
  const [selectedLanguage, setSelectedLanguage] = useState(
    preselectLanguage ? props.selectedLanguage ?? activeMacroArea?.choices[0]?.value ?? "" : props.selectedLanguage ?? ""
  );

  useEffect(() => {
    const nextActiveMacroArea = resolveInitialMacroArea(groups, props.selectedLanguage, props.initialMacroAreaLanguage);
    setActiveMacroArea(nextActiveMacroArea);
    setSelectedLanguage(
      preselectLanguage ? props.selectedLanguage ?? nextActiveMacroArea?.choices[0]?.value ?? "" : props.selectedLanguage ?? ""
    );
  }, [groups, preselectLanguage, props.initialMacroAreaLanguage, props.selectedLanguage]);

  const visibleChoices = activeMacroArea?.choices ?? [];

  function activateMacroArea(group: InteractionLanguageMacroAreaGroup) {
    setActiveMacroArea(group);
    setSelectedLanguage((currentValue) =>
      group.choices.some((choice) => choice.value === currentValue)
        ? currentValue
        : preselectLanguage
          ? group.choices[0]?.value ?? ""
          : ""
    );
  }

  return (
    <div className="world-language-selector">
      <div className="world-map-panel">
        <div className="world-map-stage">
          <InteractiveWorldMap />
          <div className="world-map-hit-area">
            {groups.map((group) => {
              const isActive = activeMacroArea?.macroArea === group.macroArea;
              return (
                <button
                  key={group.macroArea}
                  className={`world-map-hotspot${isActive ? " active" : ""}`}
                  type="button"
                  aria-label={`${group.label} (${group.choices.length})`}
                  style={{
                    top: group.position.top,
                    left: group.position.left
                  }}
                  onClick={() => activateMacroArea(group)}
                >
                  <span>{group.choices.length}</span>
                  <strong>{group.label}</strong>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="world-language-panel">
        <div className="world-language-panel-header">
          <div>
            <h2>{activeMacroArea?.label ?? "-"}</h2>
          </div>
          <strong>{visibleChoices.length}</strong>
        </div>
        <div className="visitor-language-grid-wrapper">
          <LanguageTileGrid
            choices={visibleChoices}
            selectedLanguage={selectedLanguage}
            onSelect={(language) => {
              setSelectedLanguage(language);
              if (!props.confirmSelection) {
                props.onSelect(language);
              }
            }}
          />
        </div>
        {props.confirmSelection ? (
          <button
            className="language-button selected wide-button"
            type="button"
            onClick={() => props.onSelect(selectedLanguage)}
          >
            {props.confirmLabel}
          </button>
        ) : null}
        {props.onCancel && props.cancelLabel ? (
          <button className="secondary-button wide-button" type="button" onClick={props.onCancel}>
            {props.cancelLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
