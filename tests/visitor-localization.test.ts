import { describe, expect, it } from "vitest";
import {
  buildVisitorLanguageChoices,
  getVisitorCurrentLanguageLabel,
  getVisitorEffectiveLanguageKey,
  getVisitorLocalizationLanguageKeys,
  getVisitorRequestedLanguageKey,
  getVisitorStatusLabels,
  getVisitorUiText,
  isVisitorLocalizationReady,
  usesVisitorEnglishFallback
} from "../src/shared/visitor-localization.js";
import { buildInteractionLanguageChoices } from "../src/shared/language-flow.js";
import {
  getVisitorTechnicalErrorText,
  hasVisitorTechnicalLocalization,
  localizeVisitorTechnicalIssue
} from "../src/shared/visitor-technical-localization.js";
import { VISITOR_TECHNICAL_LOCALIZATION_REVIEW } from "../src/shared/visitor-language-policy.js";

describe("visitor-localization", () => {
  it("builds native language tiles with a visible icon", () => {
    const choices = buildVisitorLanguageChoices();
    const english = choices.find((choice) => choice.value === "en");
    const englishUnitedStates = choices.find((choice) => choice.value === "en-us");
    const italian = choices.find((choice) => choice.value === "it");
    const japanese = choices.find((choice) => choice.value === "ja");
    const arabic = choices.find((choice) => choice.value === "ar");
    const afrikaans = choices.find((choice) => choice.value === "af");
    const amharic = choices.find((choice) => choice.value === "am");
    const swahili = choices.find((choice) => choice.value === "sw");
    const portuguesePortugal = choices.find((choice) => choice.value === "pt-pt");
    const albanian = choices.find((choice) => choice.value === "sq");
    const cantonese = choices.find((choice) => choice.value === "yue");
    const englishUnitedKingdom = choices.find((choice) => choice.value === "en-gb");

    expect(choices).toHaveLength(56);
    expect(english).toMatchObject({
      value: "en"
    });
    expect(englishUnitedKingdom).toMatchObject({
      value: "en-gb",
      regionCode: "GB"
    });
    expect(englishUnitedStates).toMatchObject({
      value: "en-us",
      regionCode: "US"
    });
    expect(english?.nativeLabel.length).toBeGreaterThan(0);
    expect(english?.regionCode).toBe("US");
    expect(afrikaans?.regionCode).toBe("ZA");
    expect(amharic?.regionCode).toBe("ET");
    expect(italian?.regionCode).toBe("IT");
    expect(japanese?.nativeLabel.length).toBeGreaterThan(0);
    expect(arabic?.nativeLabel.length).toBeGreaterThan(0);
    expect(swahili?.regionCode).toBe("KE");
    expect(portuguesePortugal?.regionCode).toBe("PT");
    expect(albanian?.nativeLabel.length).toBeGreaterThan(0);
    expect(cantonese?.regionCode).toBe("HK");
  });

  it("uses the visitor language for station B microcopy when supported", () => {
    const labels = getVisitorUiText("es");

    expect(labels.changeLanguage).toBe("Cambiar idioma");
    expect(labels.closeSession).toBe("Cerrar sesion");
  });

  it("exposes dedicated Greek visitor microcopy when the user selects Greek", () => {
    const labels = getVisitorUiText("el");

    expect(labels.changeLanguage).toBe("Αλλαγή γλώσσας");
    expect(getVisitorStatusLabels("el").ready).toBe("Έτοιμο");
  });

  it("falls back to english visitor microcopy for unsupported languages", () => {
    expect(getVisitorUiText("km").pressAndSpeak).toBe("Press and speak");
    expect(getVisitorRequestedLanguageKey("km")).toBe("km");
    expect(getVisitorEffectiveLanguageKey("km")).toBe("en");
    expect(usesVisitorEnglishFallback("km")).toBe(true);
  });

  it("returns the language name in its own language when possible", () => {
    expect(getVisitorCurrentLanguageLabel("fr")).toBeTruthy();
  });

  it("returns localized status labels for the visitor station", () => {
    expect(getVisitorStatusLabels("es").ready).toBe("Listo");
    expect(getVisitorStatusLabels("ja").translating).toBe("翻訳中");
  });

  it("includes localized visitor microcopy for languages in the shared default pool", () => {
    expect(getVisitorUiText("ur").changeLanguage).toBeTruthy();
    expect(getVisitorStatusLabels("ur").ready).toBeTruthy();
    expect(getVisitorUiText("sw").changeLanguage).toBe("Badili lugha");
    expect(getVisitorStatusLabels("am").ready).toBe("ዝግጁ");
  });

  it("covers the full baseline visitor language catalog without falling back to english", () => {
    const choices = buildVisitorLanguageChoices();

    expect(choices).toHaveLength(56);
    expect(getVisitorLocalizationLanguageKeys()).toContain("bg");
    expect(getVisitorLocalizationLanguageKeys()).toContain("sr-Cyrl");
    expect(getVisitorLocalizationLanguageKeys()).toContain("zh-Hant");

    for (const choice of choices) {
      expect(isVisitorLocalizationReady(choice.value)).toBe(true);
      expect(usesVisitorEnglishFallback(choice.value)).toBe(false);
    }
  });

  it("returns dedicated microcopy for newly covered baseline languages and script variants", () => {
    expect(getVisitorUiText("bg").changeLanguage).toBe("Смяна на езика");
    expect(getVisitorStatusLabels("bg").ready).toBe("Готово");
    expect(getVisitorEffectiveLanguageKey("sr-Cyrl")).toBe("sr-Cyrl");
    expect(getVisitorUiText("sr-Cyrl").pressAndSpeak).toBe("Притисните и говорите");
    expect(getVisitorEffectiveLanguageKey("zh-Hant")).toBe("zh-Hant");
    expect(getVisitorUiText("zh-Hant").changeLanguage).toBe("變更語言");
  });

  it("covers the full chatgpt expanded language catalog without english fallback", () => {
    const choices = buildInteractionLanguageChoices("chatgpt", { includeProviderExpansions: true });

    expect(choices).toHaveLength(70);

    for (const choice of choices) {
      expect(isVisitorLocalizationReady(choice.value)).toBe(true);
      expect(usesVisitorEnglishFallback(choice.value)).toBe(false);
      if (!choice.value.startsWith("en")) {
        expect(getVisitorUiText(choice.value).changeLanguage).not.toBe("Change language");
      }
    }
  });

  it("updates visitor microcopy for the newly exposed expansion languages shown in the selector", () => {
    expect(getVisitorUiText("sq").changeLanguage).toBe("Ndrysho gjuhën");
    expect(getVisitorUiText("be").changeLanguage).toBe("Змяніць мову");
    expect(getVisitorUiText("mr").changeLanguage).toBe("भाषा बदला");
    expect(getVisitorUiText("mi").changeLanguage).toBe("Huri reo");
    expect(getVisitorUiText("ne").changeLanguage).toBe("भाषा परिवर्तन गर्नुहोस्");
    expect(getVisitorUiText("ka").changeLanguage).toBe("ენის შეცვლა");
    expect(getVisitorUiText("mn").changeLanguage).toBe("Хэл өөрчлөх");
    expect(getVisitorUiText("si").changeLanguage).toBe("භාෂාව වෙනස් කරන්න");
    expect(getVisitorUiText("uz").changeLanguage).toBe("Tilni o‘zgartirish");
  });

  it("localizes visitor technical errors in supported visitor languages", () => {
    const issue = {
      code: "missing-monitor",
      message: "Sono necessari due monitor attivi per avviare la sessione.",
      retryable: true
    } as const;

    expect(hasVisitorTechnicalLocalization("es")).toBe(true);
    expect(hasVisitorTechnicalLocalization("be")).toBe(true);
    expect(hasVisitorTechnicalLocalization("mi")).toBe(true);
    expect(getVisitorTechnicalErrorText("es").retry).toBe("Reintentar");
    expect(getVisitorTechnicalErrorText("be").technicalError).toBe("Тэхнічная памылка");
    expect(getVisitorTechnicalErrorText("mi").retry).toBe("Ngana ano");
    expect(localizeVisitorTechnicalIssue(issue, "es").message).toBe(
      "Se necesitan dos monitores activos para iniciar la sesion."
    );
    expect(getVisitorTechnicalErrorText("bg").technicalError).toBe("Техническа грешка");
  });

  it("keeps dedicated visitor microphone recovery copy localized for supported languages", () => {
    const permissionIssue = {
      code: "microphone-permission-denied",
      message: "Accesso al microfono bloccato.",
      retryable: true
    } as const;
    const unavailableIssue = {
      code: "microphone-unavailable",
      message: "Il microfono assegnato non e disponibile.",
      retryable: true
    } as const;

    expect(localizeVisitorTechnicalIssue(permissionIssue, "es").message).toBe(
      "El acceso al microfono esta bloqueado. Pide al operador que vuelva a abrir la configuracion."
    );
    expect(localizeVisitorTechnicalIssue(unavailableIssue, "fr").message).toBe(
      "Le microphone assigne n'est pas disponible. Demandez a l'operateur de rouvrir la configuration."
    );
    expect(localizeVisitorTechnicalIssue(permissionIssue, "zh").message).toBe(
      "麦克风访问已被阻止。请让操作员重新打开设置。"
    );
  });

  it("uses the dedicated Albanian technical copy with full locale coverage", () => {
    const speechIssue = {
      code: "speech-stream-failure",
      message: "Errore nel flusso vocale.",
      retryable: true
    } as const;
    const microphoneIssue = {
      code: "microphone-permission-denied",
      message: "Accesso al microfono bloccato.",
      retryable: true
    } as const;

    expect(getVisitorTechnicalErrorText("sq").retry).toBe("Provo përsëri");
    expect(localizeVisitorTechnicalIssue(speechIssue, "sq").message).toBe("Pati një problem me zërin.");
    expect(localizeVisitorTechnicalIssue(microphoneIssue, "sq").message).toBe(
      "Qasja te mikrofoni është bllokuar. Kërkojini operatorit të rihapë konfigurimin."
    );
  });

  it("falls back visitor technical errors to explicit english when not localized", () => {
    const issue = {
      code: "speech-stream-failure",
      message: "Errore nel flusso vocale.",
      retryable: true
    } as const;

    expect(hasVisitorTechnicalLocalization("kk")).toBe(false);
    expect(hasVisitorTechnicalLocalization("sr-Cyrl")).toBe(false);
    expect(getVisitorTechnicalErrorText("kk").retry).toBe("Retry");
    expect(localizeVisitorTechnicalIssue(issue, "kk").message).toBe("The speech stream failed.");
    expect(localizeVisitorTechnicalIssue(issue, "sr-Cyrl").message).toBe("The speech stream failed.");
  });

  it("reuses simplified chinese visitor technical copy for cantonese and traditional chinese fallbacks", () => {
    expect(hasVisitorTechnicalLocalization("yue")).toBe(true);
    expect(hasVisitorTechnicalLocalization("zh-Hant")).toBe(true);
    expect(getVisitorTechnicalErrorText("yue").technicalError).toBe("技术错误");
    expect(getVisitorTechnicalErrorText("zh-Hant").retry).toBe("重试");
  });

  it("keeps the reviewed technical-localization coverage split explicit", () => {
    expect(VISITOR_TECHNICAL_LOCALIZATION_REVIEW.dedicated).toHaveLength(36);
    expect(VISITOR_TECHNICAL_LOCALIZATION_REVIEW.sharedZh).toEqual(["yue", "zh-Hant"]);
    expect(VISITOR_TECHNICAL_LOCALIZATION_REVIEW.englishFallback).toEqual([
      "az",
      "bs",
      "ca",
      "cs",
      "cy",
      "da",
      "et",
      "eu",
      "fi",
      "fil",
      "ga",
      "gl",
      "hr",
      "hu",
      "hy",
      "is",
      "ka",
      "kk",
      "kn",
      "lt",
      "lv",
      "mk",
      "mn",
      "mr",
      "mt",
      "nb",
      "ne",
      "si",
      "sk",
      "sl",
      "so",
      "sr-Cyrl",
      "sr-Latn",
      "sv",
      "uz"
    ]);
    expect(
      [
        ...VISITOR_TECHNICAL_LOCALIZATION_REVIEW.dedicated,
        ...VISITOR_TECHNICAL_LOCALIZATION_REVIEW.englishFallback,
        ...VISITOR_TECHNICAL_LOCALIZATION_REVIEW.sharedZh
      ].sort()
    ).toEqual([...getVisitorLocalizationLanguageKeys()].sort());
  });
});
