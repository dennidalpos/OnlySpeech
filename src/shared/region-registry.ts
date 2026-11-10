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
    width: string;
    height: string;
    compactTop: string;
    compactLeft: string;
    compactWidth: string;
    compactHeight: string;
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
    position: {
      top: "8%",
      left: "38%",
      width: "128px",
      height: "84px",
      compactTop: "8%",
      compactLeft: "35%",
      compactWidth: "118px",
      compactHeight: "78px"
    }
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
    position: {
      top: "9%",
      left: "4%",
      width: "132px",
      height: "84px",
      compactTop: "8%",
      compactLeft: "3%",
      compactWidth: "120px",
      compactHeight: "78px"
    }
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
    position: {
      top: "31%",
      left: "8%",
      width: "146px",
      height: "82px",
      compactTop: "30%",
      compactLeft: "6%",
      compactWidth: "128px",
      compactHeight: "76px"
    }
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
    position: {
      top: "56%",
      left: "14%",
      width: "122px",
      height: "82px",
      compactTop: "55%",
      compactLeft: "11%",
      compactWidth: "114px",
      compactHeight: "76px"
    }
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
    position: {
      top: "43%",
      left: "40%",
      width: "118px",
      height: "84px",
      compactTop: "42%",
      compactLeft: "37%",
      compactWidth: "114px",
      compactHeight: "78px"
    }
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
    position: {
      top: "25%",
      left: "54%",
      width: "116px",
      height: "78px",
      compactTop: "24%",
      compactLeft: "53%",
      compactWidth: "90px",
      compactHeight: "72px"
    }
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
    position: {
      top: "9%",
      left: "61%",
      width: "112px",
      height: "78px",
      compactTop: "9%",
      compactLeft: "67%",
      compactWidth: "92px",
      compactHeight: "72px"
    }
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
    position: {
      top: "33%",
      left: "67%",
      width: "108px",
      height: "78px",
      compactTop: "32%",
      compactLeft: "66%",
      compactWidth: "92px",
      compactHeight: "72px"
    }
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
    position: {
      top: "14%",
      left: "77%",
      width: "114px",
      height: "78px",
      compactTop: "15%",
      compactLeft: "81%",
      compactWidth: "102px",
      compactHeight: "72px"
    }
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
    position: {
      top: "39%",
      left: "79%",
      width: "118px",
      height: "78px",
      compactTop: "39%",
      compactLeft: "79%",
      compactWidth: "104px",
      compactHeight: "72px"
    }
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
    position: {
      top: "69%",
      left: "79%",
      width: "118px",
      height: "78px",
      compactTop: "68%",
      compactLeft: "77%",
      compactWidth: "112px",
      compactHeight: "72px"
    }
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
