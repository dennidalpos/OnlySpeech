import { normalizeVisitorLocalizationLanguageKey } from "./visitor-language-readiness.js";

export type RegionId =
  | "europe"
  | "north-america"
  | "central-america-caribbean"
  | "south-america"
  | "africa"
  | "middle-east"
  | "central-asia"
  | "south-asia"
  | "east-asia"
  | "southeast-asia"
  | "oceania";

export interface RegionDefinition {
  id: RegionId;
  labels: {
    en: string;
    it: string;
    es: string;
    fr: string;
    de: string;
    zh: string;
  };
  position: {
    top: string;
    left: string;
  };
}

export const REGION_REGISTRY: readonly RegionDefinition[] = Object.freeze([
  {
    id: "europe",
    labels: {
      en: "Europe",
      it: "Europa",
      es: "Europa",
      fr: "Europe",
      de: "Europa",
      zh: "欧洲"
    },
    position: { top: "24%", left: "48%" }
  },
  {
    id: "north-america",
    labels: {
      en: "North America",
      it: "Nord America",
      es: "Norteamérica",
      fr: "Amérique du Nord",
      de: "Nordamerika",
      zh: "北美洲"
    },
    position: { top: "24%", left: "18%" }
  },
  {
    id: "central-america-caribbean",
    labels: {
      en: "Central America & Caribbean",
      it: "America Centrale e Caraibi",
      es: "Centroamérica y Caribe",
      fr: "Amérique centrale et Caraïbes",
      de: "Mittelamerika und Karibik",
      zh: "中美洲和加勒比"
    },
    position: { top: "42%", left: "22%" }
  },
  {
    id: "south-america",
    labels: {
      en: "South America",
      it: "Sud America",
      es: "Sudamérica",
      fr: "Amérique du Sud",
      de: "Südamerika",
      zh: "南美洲"
    },
    position: { top: "60%", left: "28%" }
  },
  {
    id: "africa",
    labels: {
      en: "Africa",
      it: "Africa",
      es: "África",
      fr: "Afrique",
      de: "Afrika",
      zh: "非洲"
    },
    position: { top: "53%", left: "51%" }
  },
  {
    id: "middle-east",
    labels: {
      en: "Middle East",
      it: "Medio Oriente",
      es: "Oriente Medio",
      fr: "Moyen-Orient",
      de: "Naher Osten",
      zh: "中东"
    },
    position: { top: "35%", left: "59%" }
  },
  {
    id: "central-asia",
    labels: {
      en: "Central Asia",
      it: "Asia Centrale",
      es: "Asia Central",
      fr: "Asie centrale",
      de: "Zentralasien",
      zh: "中亚"
    },
    position: { top: "25%", left: "68%" }
  },
  {
    id: "south-asia",
    labels: {
      en: "South Asia",
      it: "Asia del Sud",
      es: "Asia del Sur",
      fr: "Asie du Sud",
      de: "Südasien",
      zh: "南亚"
    },
    position: { top: "43%", left: "69%" }
  },
  {
    id: "east-asia",
    labels: {
      en: "East Asia",
      it: "Asia Orientale",
      es: "Asia Oriental",
      fr: "Asie de l'Est",
      de: "Ostasien",
      zh: "东亚"
    },
    position: { top: "28%", left: "82%" }
  },
  {
    id: "southeast-asia",
    labels: {
      en: "Southeast Asia",
      it: "Sud-est Asiatico",
      es: "Sudeste Asiático",
      fr: "Asie du Sud-Est",
      de: "Südostasien",
      zh: "东南亚"
    },
    position: { top: "48%", left: "79%" }
  },
  {
    id: "oceania",
    labels: {
      en: "Oceania",
      it: "Oceania",
      es: "Oceanía",
      fr: "Océanie",
      de: "Ozeanien",
      zh: "大洋洲"
    },
    position: { top: "71%", left: "87%" }
  }
]);

export const regionRegistry = REGION_REGISTRY;

const REGION_INDEX = new Map<RegionId, RegionDefinition>(REGION_REGISTRY.map((region) => [region.id, region]));

export function getRegionDefinition(regionId: RegionId): RegionDefinition {
  return REGION_INDEX.get(regionId)!;
}

export function getRegionLabel(regionId: RegionId, displayLanguage = "en"): string {
  const normalizedLanguage = normalizeVisitorLocalizationLanguageKey(displayLanguage);
  const definition = getRegionDefinition(regionId);

  switch (normalizedLanguage) {
    case "it":
      return definition.labels.it;
    case "es":
      return definition.labels.es;
    case "fr":
      return definition.labels.fr;
    case "de":
      return definition.labels.de;
    case "zh":
    case "zh-Hant":
    case "yue":
      return definition.labels.zh;
    default:
      return definition.labels.en;
  }
}
