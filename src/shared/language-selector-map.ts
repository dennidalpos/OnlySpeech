import type { InteractionLanguageChoice } from "./language-flow.js";
import {
  getRegionLabel,
  regionRegistry,
  type RegionId
} from "./region-registry.js";
import { normalizeVisitorLocalizationLanguageKey } from "./visitor-language-readiness.js";

export interface RegionMapDefinition {
  regionId: RegionId;
  position: {
    top: string;
    left: string;
  };
}

export interface InteractionLanguageRegionGroup {
  regionId: RegionId;
  label: string;
  position: {
    top: string;
    left: string;
  };
  choices: InteractionLanguageChoice[];
}

export const REGION_MAP_DEFINITIONS: readonly RegionMapDefinition[] = Object.freeze(
  regionRegistry.map((region) => ({
    regionId: region.id,
    position: region.position
  }))
);

export function buildInteractionLanguageRegionGroups(
  choices: InteractionLanguageChoice[],
  displayLanguage = "en"
): InteractionLanguageRegionGroup[] {
  void normalizeVisitorLocalizationLanguageKey(displayLanguage);

  return REGION_MAP_DEFINITIONS.map((definition) => ({
    regionId: definition.regionId,
    label: getRegionLabel(definition.regionId, displayLanguage),
    position: definition.position,
    choices: choices.filter((choice) => choice.regionIds.includes(definition.regionId))
  })).filter((group) => group.choices.length > 0);
}

export function findInteractionLanguageRegion(
  regionId: RegionId | null | undefined
): RegionMapDefinition | null {
  if (!regionId) {
    return null;
  }

  const definition = REGION_MAP_DEFINITIONS.find((candidate) => candidate.regionId === regionId);
  return definition ?? null;
}
