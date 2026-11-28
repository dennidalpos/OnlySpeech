import { describe, expect, it } from "vitest";
import { buildInteractionLanguageChoices } from "../../src/shared/language-flow.js";
import {
  buildInteractionLanguageRegionGroups,
  REGION_MAP_DEFINITIONS
} from "../../src/shared/language-selector-map.js";

function parseMeasure(value: string, total: number): number {
  if (value.endsWith("%")) {
    return (Number.parseFloat(value) / 100) * total;
  }

  if (value.endsWith("px")) {
    return Number.parseFloat(value);
  }

  throw new Error(`Unsupported measure '${value}'.`);
}

function rectanglesOverlap(
  first: { left: number; top: number; width: number; height: number },
  second: { left: number; top: number; width: number; height: number }
): boolean {
  return !(
    first.left + first.width <= second.left ||
    second.left + second.width <= first.left ||
    first.top + first.height <= second.top ||
    second.top + second.height <= first.top
  );
}

describe("language-selector map", () => {
  it("assigns each curated interaction language to exactly one geographic region", () => {
    const groups = buildInteractionLanguageRegionGroups(
      buildInteractionLanguageChoices("chatgpt", { includeProviderExpansions: true }),
      "en"
    );
    const appearances = new Map<string, string[]>();

    for (const group of groups) {
      for (const choice of group.choices) {
        const existing = appearances.get(choice.value) ?? [];
        existing.push(group.regionId);
        appearances.set(choice.value, existing);
      }
    }

    for (const [languageCode, regionIds] of appearances) {
      expect(regionIds, `Language ${languageCode} should appear in a single region.`).toHaveLength(1);
    }

    expect(appearances.get("en")).toEqual(["europe"]);
    expect(appearances.get("es")).toEqual(["north-america"]);
    expect(appearances.get("pt")).toEqual(["south-america"]);
    expect(appearances.get("fr")).toEqual(["europe"]);
    expect(appearances.get("az")).toEqual(["central-asia"]);
    expect(appearances.get("ka")).toEqual(["central-asia"]);
    expect(appearances.get("tr")).toEqual(["middle-east"]);
  });

  it("keeps the desktop and compact hotspot layouts free of overlap", () => {
    const desktopStages = [
      { width: 960, height: 500 },
      { width: 1080, height: 563 },
      { width: 1200, height: 625 }
    ];
    const compactStages = [
      { width: 720, height: 396 },
      { width: 780, height: 429 },
      { width: 840, height: 462 },
      { width: 900, height: 495 }
    ];

    for (const [index, first] of REGION_MAP_DEFINITIONS.entries()) {
      for (const second of REGION_MAP_DEFINITIONS.slice(index + 1)) {
        for (const stage of desktopStages) {
          const desktopFirst = {
            left: parseMeasure(first.position.left, stage.width),
            top: parseMeasure(first.position.top, stage.height),
            width: parseMeasure(first.position.width, stage.width),
            height: parseMeasure(first.position.height, stage.height)
          };
          const desktopSecond = {
            left: parseMeasure(second.position.left, stage.width),
            top: parseMeasure(second.position.top, stage.height),
            width: parseMeasure(second.position.width, stage.width),
            height: parseMeasure(second.position.height, stage.height)
          };

          expect(
            rectanglesOverlap(desktopFirst, desktopSecond),
            `${first.regionId} overlaps ${second.regionId} on desktop width ${stage.width}.`
          ).toBe(false);
        }

        for (const stage of compactStages) {
          const compactFirst = {
            left: parseMeasure(first.position.compactLeft, stage.width),
            top: parseMeasure(first.position.compactTop, stage.height),
            width: parseMeasure(first.position.compactWidth, stage.width),
            height: parseMeasure(first.position.compactHeight, stage.height)
          };
          const compactSecond = {
            left: parseMeasure(second.position.compactLeft, stage.width),
            top: parseMeasure(second.position.compactTop, stage.height),
            width: parseMeasure(second.position.compactWidth, stage.width),
            height: parseMeasure(second.position.compactHeight, stage.height)
          };

          expect(
            rectanglesOverlap(compactFirst, compactSecond),
            `${first.regionId} overlaps ${second.regionId} on compact width ${stage.width}.`
          ).toBe(false);
        }
      }
    }
  });
});
