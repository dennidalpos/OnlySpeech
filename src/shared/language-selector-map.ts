import type { InteractionLanguageChoice } from "./language-flow.js";
import type { LanguageMacroArea } from "./language-registry-data.js";
import { normalizeVisitorLocalizationLanguageKey } from "./visitor-language-readiness.js";

export interface MacroAreaMapDefinition {
  macroArea: LanguageMacroArea;
  regionCode: string;
  position: {
    top: string;
    left: string;
  };
}

export interface InteractionLanguageMacroAreaGroup {
  macroArea: LanguageMacroArea;
  label: string;
  position: {
    top: string;
    left: string;
  };
  choices: InteractionLanguageChoice[];
}

export const MACRO_AREA_MAP_DEFINITIONS: readonly MacroAreaMapDefinition[] = Object.freeze([
  {
    macroArea: "europe",
    regionCode: "150",
    position: { top: "23%", left: "49%" }
  },
  {
    macroArea: "americas",
    regionCode: "019",
    position: { top: "34%", left: "21%" }
  },
  {
    macroArea: "oceania",
    regionCode: "009",
    position: { top: "69%", left: "86%" }
  },
  {
    macroArea: "africa",
    regionCode: "002",
    position: { top: "52%", left: "52%" }
  },
  {
    macroArea: "asia",
    regionCode: "142",
    position: { top: "27%", left: "75%" }
  }
]);

const MACRO_AREA_INDEX = new Map<LanguageMacroArea, MacroAreaMapDefinition>(
  MACRO_AREA_MAP_DEFINITIONS.map((definition) => [definition.macroArea, definition])
);

const LOCALIZED_MACRO_AREA_LABELS: Readonly<Record<string, Record<LanguageMacroArea, string>>> = Object.freeze({
  en: { europe: "Europe", americas: "Americas", oceania: "Oceania", africa: "Africa", asia: "Asia" },
  it: { europe: "Europa", americas: "Americhe", oceania: "Oceania", africa: "Africa", asia: "Asia" },
  af: { europe: "Europa", americas: "Amerikas", oceania: "Oseanie", africa: "Afrika", asia: "Asie" },
  am: { europe: "አውሮፓ", americas: "አሜሪካ", oceania: "ኦሺያንያ", africa: "አፍሪካ", asia: "እስያ" },
  ar: { europe: "أوروبا", americas: "الأمريكتان", oceania: "أوقيانوسيا", africa: "أفريقيا", asia: "آسيا" },
  be: { europe: "Еўропа", americas: "Паўночная і Паўднёвая Амерыкі", oceania: "Акіянія", africa: "Афрыка", asia: "Азія" },
  bg: { europe: "Европа", americas: "Америка", oceania: "Океания", africa: "Африка", asia: "Азия" },
  bn: { europe: "ইউরোপ", americas: "আমেরিকা", oceania: "ওশিয়ানিয়া", africa: "আফ্রিকা", asia: "এশিয়া" },
  bs: { europe: "Evropa", americas: "Amerika", oceania: "Okeanija", africa: "Afrika", asia: "Azija" },
  ca: { europe: "Europa", americas: "Amèrica", oceania: "Oceania", africa: "Àfrica", asia: "Àsia" },
  cs: { europe: "Evropa", americas: "Amerika", oceania: "Oceánie", africa: "Afrika", asia: "Asie" },
  cy: { europe: "Ewrop", americas: "Yr Amerig", oceania: "Oceania", africa: "Affrica", asia: "Asia" },
  da: { europe: "Europa", americas: "Nord-, Mellem- og Sydamerika", oceania: "Oceanien", africa: "Afrika", asia: "Asien" },
  de: { europe: "Europa", americas: "Amerika", oceania: "Ozeanien", africa: "Afrika", asia: "Asien" },
  el: { europe: "Ευρώπη", americas: "Αμερική", oceania: "Ωκεανία", africa: "Αφρική", asia: "Ασία" },
  es: { europe: "Europa", americas: "América", oceania: "Oceanía", africa: "África", asia: "Asia" },
  et: { europe: "Euroopa", americas: "Ameerika", oceania: "Okeaania", africa: "Aafrika", asia: "Aasia" },
  fa: { europe: "اروپا", americas: "امریکا", oceania: "اقیانوسیه", africa: "افریقا", asia: "آسیا" },
  fi: { europe: "Eurooppa", americas: "Amerikka", oceania: "Oseania", africa: "Afrikka", asia: "Aasia" },
  fr: { europe: "Europe", americas: "Amériques", oceania: "Océanie", africa: "Afrique", asia: "Asie" },
  ga: { europe: "an Eoraip", americas: "Críocha Mheiriceá", oceania: "an Aigéine", africa: "an Afraic", asia: "an Áise" },
  he: { europe: "אירופה", americas: "אמריקה", oceania: "אוקיאניה", africa: "אפריקה", asia: "אסיה" },
  hr: { europe: "Europa", americas: "Amerike", oceania: "Oceanija", africa: "Afrika", asia: "Azija" },
  hi: { europe: "यूरोप", americas: "अमेरिकाज़", oceania: "ओशिआनिया", africa: "अफ़्रीका", asia: "एशिया" },
  hu: { europe: "Európa", americas: "Amerika", oceania: "Óceánia", africa: "Afrika", asia: "Ázsia" },
  hy: { europe: "Եվրոպա", americas: "Ամերիկա", oceania: "Օվկիանիա", africa: "Աֆրիկա", asia: "Ասիա" },
  is: { europe: "Evrópa", americas: "Ameríka", oceania: "Eyjaálfa", africa: "Afríka", asia: "Asía" },
  id: { europe: "Eropa", americas: "Amerika", oceania: "Oseania", africa: "Afrika", asia: "Asia" },
  ja: { europe: "ヨーロッパ", americas: "アメリカ大陸", oceania: "オセアニア", africa: "アフリカ", asia: "アジア" },
  ko: { europe: "유럽", americas: "아메리카 대륙", oceania: "오세아니아", africa: "아프리카", asia: "아시아" },
  kk: { europe: "Еуропа", americas: "Америка", oceania: "Океания", africa: "Африка", asia: "Азия" },
  kn: { europe: "ಯೂರೋಪ್", americas: "ಅಮೆರಿಕಾಸ್", oceania: "ಓಶಿಯೇನಿಯಾ", africa: "ಆಫ್ರಿಕಾ", asia: "ಏಷ್ಯಾ" },
  ka: { europe: "ევროპა", americas: "ამერიკები", oceania: "ოკეანეთი", africa: "აფრიკა", asia: "აზია" },
  lt: { europe: "Europa", americas: "Amerika", oceania: "Okeanija", africa: "Afrika", asia: "Azija" },
  lv: { europe: "Eiropa", americas: "Amerika", oceania: "Okeānija", africa: "Āfrika", asia: "Āzija" },
  mk: { europe: "Европа", americas: "Америки", oceania: "Океанија", africa: "Африка", asia: "Азија" },
  mn: { europe: "Европ", americas: "Америк", oceania: "Номхон далайн орнууд", africa: "Африк", asia: "Ази" },
  mr: { europe: "युरोप", americas: "अमेरिका", oceania: "ओशनिया", africa: "आफ्रिका", asia: "आशिया" },
  ms: { europe: "Eropah", americas: "Amerika", oceania: "Oceania", africa: "Afrika", asia: "Asia" },
  mt: { europe: "Ewropa", americas: "Amerika", oceania: "Oċejanja", africa: "Affrika", asia: "Asja" },
  mi: { europe: "Ūropi", americas: "Ngā Amerika", oceania: "Ngā Moutere-a-Kiwa", africa: "Āwherika", asia: "Āhia" },
  ne: { europe: "युरोप", americas: "अमेरिकास", oceania: "ओसनिया", africa: "अफ्रिका", asia: "एशिया" },
  nl: { europe: "Europa", americas: "Amerika", oceania: "Oceanië", africa: "Afrika", asia: "Azië" },
  nb: { europe: "Europa", americas: "Amerika", oceania: "Oseania", africa: "Afrika", asia: "Asia" },
  pl: { europe: "Europa", americas: "Ameryka", oceania: "Oceania", africa: "Afryka", asia: "Azja" },
  ps: { europe: "اروپا", americas: "امريکې", oceania: "اوقيانوسيه", africa: "افريقا", asia: "آسيا" },
  pt: { europe: "Europa", americas: "Américas", oceania: "Oceania", africa: "África", asia: "Ásia" },
  ro: { europe: "Europa", americas: "Americi", oceania: "Oceania", africa: "Africa", asia: "Asia" },
  ru: { europe: "Европа", americas: "Америка", oceania: "Океания", africa: "Африка", asia: "Азия" },
  sk: { europe: "Európa", americas: "Amerika", oceania: "Oceánia", africa: "Afrika", asia: "Ázia" },
  sq: { europe: "Evropë", americas: "Amerikë", oceania: "Oqeani", africa: "Afrikë", asia: "Azi" },
  "sr-Cyrl": { europe: "Европа", americas: "Северна и Јужна Америка", oceania: "Океанија", africa: "Африка", asia: "Азија" },
  "sr-Latn": { europe: "Evropa", americas: "Severna i Južna Amerika", oceania: "Okeanija", africa: "Afrika", asia: "Azija" },
  si: { europe: "යුරෝපය", americas: "ඇමරිකාව", oceania: "ඕෂනියාව", africa: "අප්‍රිකාව", asia: "ආසියාව" },
  sl: { europe: "Evropa", americas: "Amerike", oceania: "Oceanija", africa: "Afrika", asia: "Azija" },
  so: { europe: "Yurub", americas: "Ameerikaas", oceania: "Osheeniya", africa: "Afrika", asia: "Aasiya" },
  sv: { europe: "Europa", americas: "Nord- och Sydamerika", oceania: "Oceanien", africa: "Afrika", asia: "Asien" },
  sw: { europe: "Ulaya", americas: "Amerika", oceania: "Oceania", africa: "Afrika", asia: "Asia" },
  ta: { europe: "ஐரோப்பா", americas: "அமெரிக்காஸ்", oceania: "ஓஷியானியா", africa: "ஆப்பிரிக்கா", asia: "ஆசியா" },
  te: { europe: "యూరప్", americas: "అమెరికాస్", oceania: "ఓషియానియా", africa: "ఆఫ్రికా", asia: "ఆసియా" },
  th: { europe: "ยุโรป", americas: "อเมริกา", oceania: "โอเชียเนีย", africa: "แอฟริกา", asia: "เอเชีย" },
  tr: { europe: "Avrupa", americas: "Amerika", oceania: "Okyanusya", africa: "Afrika", asia: "Asya" },
  uk: { europe: "Європа", americas: "Американський регіон", oceania: "Океанія", africa: "Африка", asia: "Азія" },
  ur: { europe: "یورپ", americas: "امیریکاز", oceania: "اوشیانیا", africa: "افریقہ", asia: "ایشیا" },
  uz: { europe: "Yevropa", americas: "Amerika", oceania: "Okeaniya", africa: "Afrika", asia: "Osiyo" },
  vi: { europe: "Châu Âu", americas: "Châu Mỹ", oceania: "Châu Đại Dương", africa: "Châu Phi", asia: "Châu Á" },
  az: { europe: "Avropa", americas: "Amerika", oceania: "Okeaniya", africa: "Afrika", asia: "Asiya" },
  eu: { europe: "Europa", americas: "Amerika", oceania: "Ozeania", africa: "Afrika", asia: "Asia" },
  fil: { europe: "Europe", americas: "Americas", oceania: "Oceania", africa: "Africa", asia: "Asya" },
  gl: { europe: "Europa", americas: "América", oceania: "Oceanía", africa: "África", asia: "Asia" },
  yue: { europe: "歐洲", americas: "美洲", oceania: "大洋洲", africa: "非洲", asia: "亞洲" },
  zh: { europe: "欧洲", americas: "美洲", oceania: "大洋洲", africa: "非洲", asia: "亚洲" },
  "zh-Hant": { europe: "歐洲", americas: "美洲", oceania: "大洋洲", africa: "非洲", asia: "亞洲" }
});

function resolveMacroAreaLabel(macroArea: LanguageMacroArea, displayLanguage: string): string {
  const normalizedLanguage =
    displayLanguage === "it" || displayLanguage === "en"
      ? displayLanguage
      : normalizeVisitorLocalizationLanguageKey(displayLanguage);

  return LOCALIZED_MACRO_AREA_LABELS[normalizedLanguage]?.[macroArea] ?? LOCALIZED_MACRO_AREA_LABELS.en[macroArea];
}

export function buildInteractionLanguageMacroAreaGroups(
  choices: InteractionLanguageChoice[],
  displayLanguage = "en"
): InteractionLanguageMacroAreaGroup[] {
  return MACRO_AREA_MAP_DEFINITIONS.map((definition) => ({
    macroArea: definition.macroArea,
    label: resolveMacroAreaLabel(definition.macroArea, displayLanguage),
    position: definition.position,
    choices: choices.filter((choice) => choice.macroAreas.includes(definition.macroArea))
  })).filter((group) => group.choices.length > 0);
}

export function findInteractionLanguageMacroArea(
  macroArea: LanguageMacroArea | null | undefined
): MacroAreaMapDefinition | null {
  if (!macroArea) {
    return null;
  }

  return MACRO_AREA_INDEX.get(macroArea) ?? null;
}
