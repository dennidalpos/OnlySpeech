import { getVisitorLanguagePolicy } from "./visitor-language-policy.js";
import { normalizeVisitorLocalizationLanguageKey } from "./visitor-language-readiness.js";
import type { TechnicalIssue } from "./types.js";

export interface VisitorTechnicalText {
  technicalError: string;
  retry: string;
  unavailableSystem: string;
  issueMessages: Partial<Record<TechnicalIssue["code"], (issue: TechnicalIssue) => string>>;
}

function requiresDistinctMicrophones(issue: TechnicalIssue): boolean {
  const message = issue.message.toLowerCase();
  return message.includes("distinti") || message.includes("distinct");
}

const ENGLISH_VISITOR_TECHNICAL_TEXT: VisitorTechnicalText = {
  technicalError: "Technical error",
  retry: "Retry",
  unavailableSystem: "System unavailable",
  issueMessages: {
    "missing-monitor": () => "Two active monitors are required to start the session.",
    "missing-microphone-a": () => "Microphone A not detected.",
    "missing-microphone-b": (issue) =>
      requiresDistinctMicrophones(issue) ? "Two distinct microphones are required." : "Microphone B not detected.",
    "microphone-permission-denied": () => "Microphone access is blocked. Ask the operator to reopen setup.",
    "microphone-unavailable": () => "The assigned microphone is unavailable. Ask the operator to reopen setup.",
    "speech-config-missing": () => "Speech configuration is missing for the selected provider.",
    "translation-config-missing": () => "Translation configuration is missing for the selected provider.",
    "translation-provider-failure": () => "The translation provider request failed.",
    "speech-stream-failure": () => "The speech stream failed."
  }
};

const VISITOR_TECHNICAL_TEXT: Record<string, VisitorTechnicalText> = {
  af: {
    technicalError: "Tegniese fout",
    retry: "Probeer weer",
    unavailableSystem: "Stelsel nie beskikbaar nie",
    issueMessages: {
      "missing-monitor": () => "Twee aktiewe monitors is nodig om die sessie te begin.",
      "missing-microphone-a": () => "Mikrofoon A is nie opgespoor nie.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Twee verskillende mikrofone is nodig." : "Mikrofoon B is nie opgespoor nie.",
      "speech-config-missing": () => "Spraakkonfigurasie ontbreek vir die gekose verskaffer.",
      "translation-config-missing": () => "Vertaalopstelling ontbreek vir die gekose verskaffer.",
      "translation-provider-failure": () => "Die versoek aan die vertaaldienste het misluk.",
      "speech-stream-failure": () => "Die spraakstroom het misluk."
    }
  },
  am: {
    technicalError: "ቴክኒካዊ ስህተት",
    retry: "እንደገና ይሞክሩ",
    unavailableSystem: "ስርዓቱ አይገኝም",
    issueMessages: {
      "missing-monitor": () => "ክፍለ ጊዜውን ለመጀመር ሁለት የሚሰሩ ሞኒተሮች ያስፈልጋሉ።",
      "missing-microphone-a": () => "ማይክሮፎን A አልተገኘም።",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "ሁለት የተለዩ ማይክሮፎኖች ያስፈልጋሉ።" : "ማይክሮፎን B አልተገኘም።",
      "speech-config-missing": () => "ለተመረጠው አቅራቢ የድምፅ አዋቂ ቅንብር የለም።",
      "translation-config-missing": () => "ለተመረጠው አቅራቢ የትርጉም ቅንብር የለም።",
      "translation-provider-failure": () => "ወደ ትርጉም አቅራቢው የተላከው ጥያቄ አልተሳካም።",
      "speech-stream-failure": () => "የድምፅ ስትሪሙ አልተሳካም።"
    }
  },
  ar: {
    technicalError: "خطأ تقني",
    retry: "أعد المحاولة",
    unavailableSystem: "النظام غير متاح",
    issueMessages: {
      "missing-monitor": () => "يلزم وجود شاشتين نشطتين لبدء الجلسة.",
      "missing-microphone-a": () => "لم يتم اكتشاف الميكروفون A.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "يلزم وجود ميكروفونين منفصلين." : "لم يتم اكتشاف الميكروفون B.",
      "speech-config-missing": () => "إعدادات الصوت مفقودة لمزوّد الخدمة المحدد.",
      "translation-config-missing": () => "إعدادات الترجمة مفقودة لمزوّد الخدمة المحدد.",
      "translation-provider-failure": () => "فشل طلب مزوّد الترجمة.",
      "speech-stream-failure": () => "فشل تدفّق الصوت."
    }
  },
  be: {
    technicalError: "Тэхнічная памылка",
    retry: "Паспрабаваць зноў",
    unavailableSystem: "Сістэма недаступная",
    issueMessages: {
      "missing-monitor": () => "Каб пачаць сеанс, патрэбны два актыўныя маніторы.",
      "missing-microphone-a": () => "Мікрафон A не знойдзены.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Патрэбны два асобныя мікрафоны." : "Мікрафон B не знойдзены.",
      "speech-config-missing": () => "Для выбранага пастаўшчыка адсутнічае канфігурацыя распазнавання маўлення.",
      "translation-config-missing": () => "Для выбранага пастаўшчыка адсутнічае канфігурацыя перакладу.",
      "translation-provider-failure": () => "Запыт да пастаўшчыка перакладу не ўдалося выканаць.",
      "speech-stream-failure": () => "Збой патоку маўлення."
    }
  },
  bg: {
    technicalError: "Техническа грешка",
    retry: "Опитай отново",
    unavailableSystem: "Системата не е налична",
    issueMessages: {
      "missing-monitor": () => "За стартиране на сесията са нужни два активни монитора.",
      "missing-microphone-a": () => "Микрофон A не е открит.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Нужни са два отделни микрофона." : "Микрофон B не е открит.",
      "speech-config-missing": () => "Липсва конфигурация за реч за избрания доставчик.",
      "translation-config-missing": () => "Липсва конфигурация за превод за избрания доставчик.",
      "translation-provider-failure": () => "Заявката към доставчика за превод не бе успешна.",
      "speech-stream-failure": () => "Потокът на речта се провали."
    }
  },
  bn: {
    technicalError: "প্রযুক্তিগত ত্রুটি",
    retry: "আবার চেষ্টা করুন",
    unavailableSystem: "সিস্টেম উপলভ্য নয়",
    issueMessages: {
      "missing-monitor": () => "সেশন শুরু করতে দুটি সক্রিয় মনিটর প্রয়োজন।",
      "missing-microphone-a": () => "মাইক্রোফোন A সনাক্ত হয়নি।",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "দুটি আলাদা মাইক্রোফোন প্রয়োজন।" : "মাইক্রোফোন B সনাক্ত হয়নি।",
      "speech-config-missing": () => "নির্বাচিত প্রদানকারীর জন্য স্পিচ কনফিগারেশন অনুপস্থিত।",
      "translation-config-missing": () => "নির্বাচিত প্রদানকারীর জন্য অনুবাদ কনফিগারেশন অনুপস্থিত।",
      "translation-provider-failure": () => "অনুবাদ প্রদানকারীর অনুরোধ ব্যর্থ হয়েছে।",
      "speech-stream-failure": () => "স্পিচ স্ট্রিম ব্যর্থ হয়েছে।"
    }
  },
  de: {
    technicalError: "Technischer Fehler",
    retry: "Erneut versuchen",
    unavailableSystem: "System nicht verfugbar",
    issueMessages: {
      "missing-monitor": () => "Zum Starten der Sitzung werden zwei aktive Monitore benotigt.",
      "missing-microphone-a": () => "Mikrofon A wurde nicht erkannt.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Es werden zwei unterschiedliche Mikrofone benotigt." : "Mikrofon B wurde nicht erkannt.",
      "speech-config-missing": () => "Die Sprachkonfiguration fur den ausgewahlten Anbieter fehlt.",
      "translation-config-missing": () => "Die Ubersetzungskonfiguration fur den ausgewahlten Anbieter fehlt.",
      "translation-provider-failure": () => "Die Anfrage an den Ubersetzungsanbieter ist fehlgeschlagen.",
      "speech-stream-failure": () => "Der Sprachstream ist fehlgeschlagen."
    }
  },
  el: {
    technicalError: "Τεχνικό σφάλμα",
    retry: "Δοκιμάστε ξανά",
    unavailableSystem: "Το σύστημα δεν είναι διαθέσιμο",
    issueMessages: {
      "missing-monitor": () => "Απαιτούνται δύο ενεργές οθόνες για την έναρξη της συνεδρίας.",
      "missing-microphone-a": () => "Το μικρόφωνο A δεν εντοπίστηκε.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Απαιτούνται δύο ξεχωριστά μικρόφωνα." : "Το μικρόφωνο B δεν εντοπίστηκε.",
      "speech-config-missing": () => "Λείπει η ρύθμιση ομιλίας για τον επιλεγμένο πάροχο.",
      "translation-config-missing": () => "Λείπει η ρύθμιση μετάφρασης για τον επιλεγμένο πάροχο.",
      "translation-provider-failure": () => "Το αίτημα προς τον πάροχο μετάφρασης απέτυχε.",
      "speech-stream-failure": () => "Η ροή ομιλίας απέτυχε."
    }
  },
  en: ENGLISH_VISITOR_TECHNICAL_TEXT,
  es: {
    technicalError: "Error tecnico",
    retry: "Reintentar",
    unavailableSystem: "Sistema no disponible",
    issueMessages: {
      "missing-monitor": () => "Se necesitan dos monitores activos para iniciar la sesion.",
      "missing-microphone-a": () => "No se detecto el microfono A.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Se necesitan dos microfonos distintos." : "No se detecto el microfono B.",
      "speech-config-missing": () => "Falta la configuracion de voz para el proveedor seleccionado.",
      "translation-config-missing": () => "Falta la configuracion de traduccion para el proveedor seleccionado.",
      "translation-provider-failure": () => "La solicitud al proveedor de traduccion fallo.",
      "speech-stream-failure": () => "El flujo de voz fallo."
    }
  },
  fa: {
    technicalError: "خطای فنی",
    retry: "تلاش دوباره",
    unavailableSystem: "سیستم در دسترس نیست",
    issueMessages: {
      "missing-monitor": () => "برای شروع نشست، دو نمایشگر فعال لازم است.",
      "missing-microphone-a": () => "میکروفون A شناسایی نشد.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "دو میکروفون جداگانه لازم است." : "میکروفون B شناسایی نشد.",
      "speech-config-missing": () => "پیکربندی گفتار برای ارائه‌دهنده انتخاب‌شده موجود نیست.",
      "translation-config-missing": () => "پیکربندی ترجمه برای ارائه‌دهنده انتخاب‌شده موجود نیست.",
      "translation-provider-failure": () => "درخواست به ارائه‌دهنده ترجمه ناموفق بود.",
      "speech-stream-failure": () => "جریان گفتار ناموفق بود."
    }
  },
  fr: {
    technicalError: "Erreur technique",
    retry: "Reessayer",
    unavailableSystem: "Systeme indisponible",
    issueMessages: {
      "missing-monitor": () => "Deux moniteurs actifs sont necessaires pour demarrer la session.",
      "missing-microphone-a": () => "Le microphone A n'a pas ete detecte.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Deux microphones distincts sont necessaires." : "Le microphone B n'a pas ete detecte.",
      "speech-config-missing": () => "La configuration vocale du fournisseur selectionne est absente.",
      "translation-config-missing": () => "La configuration de traduction du fournisseur selectionne est absente.",
      "translation-provider-failure": () => "La requete au fournisseur de traduction a echoue.",
      "speech-stream-failure": () => "Le flux vocal a echoue."
    }
  },
  he: {
    technicalError: "שגיאה טכנית",
    retry: "נסה שוב",
    unavailableSystem: "המערכת אינה זמינה",
    issueMessages: {
      "missing-monitor": () => "נדרשים שני מסכים פעילים כדי להתחיל את ההפעלה.",
      "missing-microphone-a": () => "מיקרופון A לא זוהה.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "נדרשים שני מיקרופונים נפרדים." : "מיקרופון B לא זוהה.",
      "speech-config-missing": () => "חסרה תצורת דיבור עבור הספק שנבחר.",
      "translation-config-missing": () => "חסרה תצורת תרגום עבור הספק שנבחר.",
      "translation-provider-failure": () => "הבקשה לספק התרגום נכשלה.",
      "speech-stream-failure": () => "זרם הדיבור נכשל."
    }
  },
  hi: {
    technicalError: "तकनीकी त्रुटि",
    retry: "फिर से प्रयास करें",
    unavailableSystem: "सिस्टम उपलब्ध नहीं है",
    issueMessages: {
      "missing-monitor": () => "सत्र शुरू करने के लिए दो सक्रिय मॉनिटर आवश्यक हैं।",
      "missing-microphone-a": () => "माइक्रोफोन A नहीं मिला।",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "दो अलग माइक्रोफोन आवश्यक हैं।" : "माइक्रोफोन B नहीं मिला।",
      "speech-config-missing": () => "चयनित प्रदाता के लिए स्पीच कॉन्फ़िगरेशन उपलब्ध नहीं है।",
      "translation-config-missing": () => "चयनित प्रदाता के लिए अनुवाद कॉन्फ़िगरेशन उपलब्ध नहीं है।",
      "translation-provider-failure": () => "अनुवाद प्रदाता के लिए अनुरोध विफल हुआ।",
      "speech-stream-failure": () => "स्पीच स्ट्रीम विफल हुई।"
    }
  },
  id: {
    technicalError: "Kesalahan teknis",
    retry: "Coba lagi",
    unavailableSystem: "Sistem tidak tersedia",
    issueMessages: {
      "missing-monitor": () => "Dua monitor aktif diperlukan untuk memulai sesi.",
      "missing-microphone-a": () => "Mikrofon A tidak terdeteksi.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Dua mikrofon yang berbeda diperlukan." : "Mikrofon B tidak terdeteksi.",
      "speech-config-missing": () => "Konfigurasi ucapan untuk penyedia yang dipilih tidak tersedia.",
      "translation-config-missing": () => "Konfigurasi terjemahan untuk penyedia yang dipilih tidak tersedia.",
      "translation-provider-failure": () => "Permintaan ke penyedia terjemahan gagal.",
      "speech-stream-failure": () => "Aliran ucapan gagal."
    }
  },
  it: {
    technicalError: "Errore tecnico",
    retry: "Riprova",
    unavailableSystem: "Sistema non disponibile",
    issueMessages: {
      "missing-monitor": () => "Sono necessari due monitor attivi per avviare la sessione.",
      "missing-microphone-a": () => "Microfono A non rilevato.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Servono due microfoni distinti." : "Microfono B non rilevato.",
      "speech-config-missing": () => "Configurazione speech mancante per il provider selezionato.",
      "translation-config-missing": () => "Configurazione traduzione mancante per il provider selezionato.",
      "translation-provider-failure": () => "Richiesta al provider traduzione non riuscita.",
      "speech-stream-failure": () => "Errore nel flusso vocale."
    }
  },
  ja: {
    technicalError: "技術エラー",
    retry: "再試行",
    unavailableSystem: "システムを利用できません",
    issueMessages: {
      "missing-monitor": () => "セッションを開始するには 2 台の有効なモニターが必要です。",
      "missing-microphone-a": () => "マイク A が検出されませんでした。",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "2 台の別々のマイクが必要です。" : "マイク B が検出されませんでした。",
      "speech-config-missing": () => "選択したプロバイダーの音声設定が不足しています。",
      "translation-config-missing": () => "選択したプロバイダーの翻訳設定が不足しています。",
      "translation-provider-failure": () => "翻訳プロバイダーへの要求に失敗しました。",
      "speech-stream-failure": () => "音声ストリームに失敗しました。"
    }
  },
  ko: {
    technicalError: "기술 오류",
    retry: "다시 시도",
    unavailableSystem: "시스템을 사용할 수 없습니다",
    issueMessages: {
      "missing-monitor": () => "세션을 시작하려면 활성 모니터 두 대가 필요합니다.",
      "missing-microphone-a": () => "마이크 A를 찾을 수 없습니다.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "서로 다른 마이크 두 대가 필요합니다." : "마이크 B를 찾을 수 없습니다.",
      "speech-config-missing": () => "선택한 제공자의 음성 설정이 없습니다.",
      "translation-config-missing": () => "선택한 제공자의 번역 설정이 없습니다.",
      "translation-provider-failure": () => "번역 제공자 요청이 실패했습니다.",
      "speech-stream-failure": () => "음성 스트림이 실패했습니다."
    }
  },
  ms: {
    technicalError: "Ralat teknikal",
    retry: "Cuba lagi",
    unavailableSystem: "Sistem tidak tersedia",
    issueMessages: {
      "missing-monitor": () => "Dua monitor aktif diperlukan untuk memulakan sesi.",
      "missing-microphone-a": () => "Mikrofon A tidak dikesan.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Dua mikrofon berasingan diperlukan." : "Mikrofon B tidak dikesan.",
      "speech-config-missing": () => "Konfigurasi pertuturan untuk pembekal yang dipilih tiada.",
      "translation-config-missing": () => "Konfigurasi terjemahan untuk pembekal yang dipilih tiada.",
      "translation-provider-failure": () => "Permintaan kepada pembekal terjemahan gagal.",
      "speech-stream-failure": () => "Strim pertuturan gagal."
    }
  },
  mi: {
    technicalError: "Hapa hangarau",
    retry: "Ngana ano",
    unavailableSystem: "Kaore te punaha i te waatea",
    issueMessages: {
      "missing-monitor": () => "E rua nga mata hohe e hiahiatia ana kia timata ai te wahanga.",
      "missing-microphone-a": () => "Kaore i kitea te hopuoro A.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "E rua nga hopuoro motuhake e hiahiatia ana." : "Kaore i kitea te hopuoro B.",
      "speech-config-missing": () => "Kei te ngaro te whirihoranga reo mo te kaiwhakarato kua tohua.",
      "translation-config-missing": () => "Kei te ngaro te whirihoranga whakamaori mo te kaiwhakarato kua tohua.",
      "translation-provider-failure": () => "I rahua te tono ki te kaiwhakarato whakamaori.",
      "speech-stream-failure": () => "I rahua te rerenga reo."
    }
  },
  nl: {
    technicalError: "Technische fout",
    retry: "Opnieuw proberen",
    unavailableSystem: "Systeem niet beschikbaar",
    issueMessages: {
      "missing-monitor": () => "Er zijn twee actieve monitoren nodig om de sessie te starten.",
      "missing-microphone-a": () => "Microfoon A is niet gedetecteerd.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Er zijn twee verschillende microfoons nodig." : "Microfoon B is niet gedetecteerd.",
      "speech-config-missing": () => "Spraakconfiguratie voor de geselecteerde provider ontbreekt.",
      "translation-config-missing": () => "Vertaalconfiguratie voor de geselecteerde provider ontbreekt.",
      "translation-provider-failure": () => "De aanvraag naar de vertaalprovider is mislukt.",
      "speech-stream-failure": () => "De spraakstream is mislukt."
    }
  },
  pl: {
    technicalError: "Blad techniczny",
    retry: "Sprobuj ponownie",
    unavailableSystem: "System niedostepny",
    issueMessages: {
      "missing-monitor": () => "Do rozpoczecia sesji wymagane sa dwa aktywne monitory.",
      "missing-microphone-a": () => "Mikrofon A nie zostal wykryty.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Wymagane sa dwa rozne mikrofony." : "Mikrofon B nie zostal wykryty.",
      "speech-config-missing": () => "Brakuje konfiguracji mowy dla wybranego dostawcy.",
      "translation-config-missing": () => "Brakuje konfiguracji tlumaczenia dla wybranego dostawcy.",
      "translation-provider-failure": () => "Zadanie do dostawcy tlumaczenia nie powiodlo sie.",
      "speech-stream-failure": () => "Strumien mowy nie powiodl sie."
    }
  },
  ps: {
    technicalError: "تخنيکي تېروتنه",
    retry: "بیا هڅه وکړئ",
    unavailableSystem: "سيستم شتون نه لري",
    issueMessages: {
      "missing-monitor": () => "د غونډې د پيل لپاره دوه فعال مانيټرونه اړين دي.",
      "missing-microphone-a": () => "مايکروفون A ونه موندل شو.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "دوه جلا مايکروفونونه اړين دي." : "مايکروفون B ونه موندل شو.",
      "speech-config-missing": () => "د ټاکل شوي برابروونکي لپاره د وينا امستنې نشته.",
      "translation-config-missing": () => "د ټاکل شوي برابروونکي لپاره د ژباړې امستنې نشته.",
      "translation-provider-failure": () => "د ژباړې برابروونکي غوښتنه ناکامه شوه.",
      "speech-stream-failure": () => "د وينا جريان ناکام شو."
    }
  },
  pt: {
    technicalError: "Erro tecnico",
    retry: "Tentar novamente",
    unavailableSystem: "Sistema indisponivel",
    issueMessages: {
      "missing-monitor": () => "Sao necessarios dois monitores ativos para iniciar a sessao.",
      "missing-microphone-a": () => "Microfone A nao detectado.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Sao necessarios dois microfones distintos." : "Microfone B nao detectado.",
      "speech-config-missing": () => "Falta a configuracao de fala para o fornecedor selecionado.",
      "translation-config-missing": () => "Falta a configuracao de traducao para o fornecedor selecionado.",
      "translation-provider-failure": () => "A solicitacao ao fornecedor de traducao falhou.",
      "speech-stream-failure": () => "O fluxo de fala falhou."
    }
  },
  ro: {
    technicalError: "Eroare tehnica",
    retry: "Incearca din nou",
    unavailableSystem: "Sistem indisponibil",
    issueMessages: {
      "missing-monitor": () => "Sunt necesare doua monitoare active pentru a porni sesiunea.",
      "missing-microphone-a": () => "Microfonul A nu a fost detectat.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Sunt necesare doua microfoane distincte." : "Microfonul B nu a fost detectat.",
      "speech-config-missing": () => "Lipseste configuratia de vorbire pentru furnizorul selectat.",
      "translation-config-missing": () => "Lipseste configuratia de traducere pentru furnizorul selectat.",
      "translation-provider-failure": () => "Cererea catre furnizorul de traducere a esuat.",
      "speech-stream-failure": () => "Fluxul de vorbire a esuat."
    }
  },
  ru: {
    technicalError: "Техническая ошибка",
    retry: "Повторить",
    unavailableSystem: "Система недоступна",
    issueMessages: {
      "missing-monitor": () => "Для запуска сеанса нужны два активных монитора.",
      "missing-microphone-a": () => "Микрофон A не обнаружен.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Требуются два отдельных микрофона." : "Микрофон B не обнаружен.",
      "speech-config-missing": () => "Отсутствует настройка речи для выбранного провайдера.",
      "translation-config-missing": () => "Отсутствует настройка перевода для выбранного провайдера.",
      "translation-provider-failure": () => "Запрос к сервису перевода завершился ошибкой.",
      "speech-stream-failure": () => "Сбой голосового потока."
    }
  },
  sq: {
    technicalError: "Gabim teknik",
    retry: "Provo përsëri",
    unavailableSystem: "Sistemi nuk është i disponueshëm",
    issueMessages: {
      "missing-monitor": () => "Për të nisur sesionin duhen dy monitorë aktivë.",
      "missing-microphone-a": () => "Mikrofoni A nuk u gjet.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Duhen dy mikrofona të ndryshëm." : "Mikrofoni B nuk u gjet.",
      "microphone-permission-denied": () => "Qasja te mikrofoni është bllokuar. Kërkojini operatorit të rihapë konfigurimin.",
      "speech-config-missing": () => "Mungon konfigurimi i zërit për ofruesin e zgjedhur.",
      "translation-config-missing": () => "Mungon konfigurimi i përkthimit për ofruesin e zgjedhur.",
      "translation-provider-failure": () => "Përkthimi dështoi.",
      "speech-stream-failure": () => "Pati një problem me zërin."
    }
  },
  sw: {
    technicalError: "Hitilafu ya kiufundi",
    retry: "Jaribu tena",
    unavailableSystem: "Mfumo haupatikani",
    issueMessages: {
      "missing-monitor": () => "Monitori mbili zinazofanya kazi zinahitajika kuanza kikao.",
      "missing-microphone-a": () => "Mikrofoni A haikupatikana.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Mikrofoni mbili tofauti zinahitajika." : "Mikrofoni B haikupatikana.",
      "speech-config-missing": () => "Mipangilio ya sauti haipo kwa mtoa huduma aliyechaguliwa.",
      "translation-config-missing": () => "Mipangilio ya tafsiri haipo kwa mtoa huduma aliyechaguliwa.",
      "translation-provider-failure": () => "Ombi kwa mtoa huduma wa tafsiri limeshindwa.",
      "speech-stream-failure": () => "Mtiririko wa sauti umeshindwa."
    }
  },
  ta: {
    technicalError: "தொழில்நுட்ப பிழை",
    retry: "மீண்டும் முயற்சிக்கவும்",
    unavailableSystem: "அமைப்பு கிடைக்கவில்லை",
    issueMessages: {
      "missing-monitor": () => "அமர்வை தொடங்க இரண்டு செயல்படும் மானிட்டர்கள் தேவை.",
      "missing-microphone-a": () => "மைக்ரோஃபோன் A கண்டறியப்படவில்லை.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "இரண்டு வேறு மைக்ரோஃபோன்கள் தேவை." : "மைக்ரோஃபோன் B கண்டறியப்படவில்லை.",
      "speech-config-missing": () => "தேர்ந்தெடுக்கப்பட்ட வழங்குநருக்கான பேச்சு அமைப்பு இல்லை.",
      "translation-config-missing": () => "தேர்ந்தெடுக்கப்பட்ட வழங்குநருக்கான மொழிபெயர்ப்பு அமைப்பு இல்லை.",
      "translation-provider-failure": () => "மொழிபெயர்ப்பு வழங்குநருக்கான கோரிக்கை தோல்வியடைந்தது.",
      "speech-stream-failure": () => "குரல் ஓட்டம் தோல்வியடைந்தது."
    }
  },
  te: {
    technicalError: "సాంకేతిక లోపం",
    retry: "మళ్లీ ప్రయత్నించండి",
    unavailableSystem: "సిస్టమ్ అందుబాటులో లేదు",
    issueMessages: {
      "missing-monitor": () => "సెషన్ ప్రారంభించడానికి రెండు క్రియాశీల మానిటర్లు అవసరం.",
      "missing-microphone-a": () => "మైక్రోఫోన్ A గుర్తించబడలేదు.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "రెండు వేర్వేరు మైక్రోఫోన్లు అవసరం." : "మైక్రోఫోన్ B గుర్తించబడలేదు.",
      "speech-config-missing": () => "ఎంచుకున్న ప్రొవైడర్‌కి స్పీచ్ కాన్ఫిగరేషన్ లేదు.",
      "translation-config-missing": () => "ఎంచుకున్న ప్రొవైడర్‌కి అనువాద కాన్ఫిగరేషన్ లేదు.",
      "translation-provider-failure": () => "అనువాద ప్రొవైడర్ అభ్యర్థన విఫలమైంది.",
      "speech-stream-failure": () => "స్పీచ్ స్ట్రీమ్ విఫలమైంది."
    }
  },
  th: {
    technicalError: "ข้อผิดพลาดทางเทคนิค",
    retry: "ลองอีกครั้ง",
    unavailableSystem: "ระบบไม่พร้อมใช้งาน",
    issueMessages: {
      "missing-monitor": () => "ต้องมีจอภาพที่ใช้งานได้สองจอเพื่อเริ่มเซสชัน",
      "missing-microphone-a": () => "ไม่พบไมโครโฟน A",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "ต้องใช้ไมโครโฟนสองตัวที่แยกจากกัน" : "ไม่พบไมโครโฟน B",
      "speech-config-missing": () => "ไม่มีการตั้งค่าการพูดสำหรับผู้ให้บริการที่เลือก",
      "translation-config-missing": () => "ไม่มีการตั้งค่าการแปลสำหรับผู้ให้บริการที่เลือก",
      "translation-provider-failure": () => "คำขอไปยังผู้ให้บริการแปลล้มเหลว",
      "speech-stream-failure": () => "สตรีมเสียงล้มเหลว"
    }
  },
  tr: {
    technicalError: "Teknik hata",
    retry: "Tekrar dene",
    unavailableSystem: "Sistem kullanilamiyor",
    issueMessages: {
      "missing-monitor": () => "Oturumu baslatmak icin iki etkin monitor gerekir.",
      "missing-microphone-a": () => "Mikrofon A algilanmadi.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Iki farkli mikrofon gerekir." : "Mikrofon B algilanmadi.",
      "speech-config-missing": () => "Secilen saglayici icin konusma yapilandirmasi eksik.",
      "translation-config-missing": () => "Secilen saglayici icin ceviri yapilandirmasi eksik.",
      "translation-provider-failure": () => "Ceviri saglayicisina yapilan istek basarisiz oldu.",
      "speech-stream-failure": () => "Ses akisi basarisiz oldu."
    }
  },
  uk: {
    technicalError: "Технічна помилка",
    retry: "Спробувати ще раз",
    unavailableSystem: "Система недоступна",
    issueMessages: {
      "missing-monitor": () => "Для запуску сеансу потрібні два активні монітори.",
      "missing-microphone-a": () => "Мікрофон A не виявлено.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Потрібні два окремі мікрофони." : "Мікрофон B не виявлено.",
      "speech-config-missing": () => "Відсутня конфігурація мовлення для вибраного постачальника.",
      "translation-config-missing": () => "Відсутня конфігурація перекладу для вибраного постачальника.",
      "translation-provider-failure": () => "Запит до постачальника перекладу завершився помилкою.",
      "speech-stream-failure": () => "Помилка голосового потоку."
    }
  },
  ur: {
    technicalError: "تکنیکی خرابی",
    retry: "دوبارہ کوشش کریں",
    unavailableSystem: "نظام دستیاب نہیں ہے",
    issueMessages: {
      "missing-monitor": () => "سیشن شروع کرنے کے لیے دو فعال مانیٹر درکار ہیں۔",
      "missing-microphone-a": () => "مائیکروفون A نہیں ملا۔",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "دو الگ مائیکروفون درکار ہیں۔" : "مائیکروفون B نہیں ملا۔",
      "speech-config-missing": () => "منتخب فراہم کنندہ کے لیے اسپیچ کنفیگریشن موجود نہیں ہے۔",
      "translation-config-missing": () => "منتخب فراہم کنندہ کے لیے ترجمہ کنفیگریشن موجود نہیں ہے۔",
      "translation-provider-failure": () => "ترجمہ فراہم کنندہ کی درخواست ناکام ہوئی۔",
      "speech-stream-failure": () => "اسپیچ اسٹریم ناکام ہوئی۔"
    }
  },
  vi: {
    technicalError: "Loi ky thuat",
    retry: "Thu lai",
    unavailableSystem: "He thong khong kha dung",
    issueMessages: {
      "missing-monitor": () => "Can hai man hinh dang hoat dong de bat dau phien.",
      "missing-microphone-a": () => "Khong phat hien duoc micro A.",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "Can hai micro rieng biet." : "Khong phat hien duoc micro B.",
      "speech-config-missing": () => "Thieu cau hinh giong noi cho nha cung cap da chon.",
      "translation-config-missing": () => "Thieu cau hinh dich cho nha cung cap da chon.",
      "translation-provider-failure": () => "Yeu cau toi nha cung cap dich da that bai.",
      "speech-stream-failure": () => "Luong giong noi da that bai."
    }
  },
  zh: {
    technicalError: "技术错误",
    retry: "重试",
    unavailableSystem: "系统不可用",
    issueMessages: {
      "missing-monitor": () => "启动会话需要两个已启用的显示器。",
      "missing-microphone-a": () => "未检测到麦克风 A。",
      "missing-microphone-b": (issue) =>
        requiresDistinctMicrophones(issue) ? "需要两个不同的麦克风。" : "未检测到麦克风 B。",
      "speech-config-missing": () => "所选提供方缺少语音配置。",
      "translation-config-missing": () => "所选提供方缺少翻译配置。",
      "translation-provider-failure": () => "向翻译提供方发出的请求失败。",
      "speech-stream-failure": () => "语音流失败。"
    }
  }
};

function normalizeVisitorTechnicalLanguageKey(languageCode: string | null | undefined): string {
  const normalized = normalizeVisitorLocalizationLanguageKey(languageCode);

  if (normalized === "zh-Hant" || normalized === "yue") {
    return "zh";
  }

  return normalized;
}

export function hasVisitorTechnicalLocalization(languageCode: string | null | undefined): boolean {
  const normalized = normalizeVisitorLocalizationLanguageKey(languageCode);
  const policy = getVisitorLanguagePolicy(normalized);

  return policy?.technicalLocalization === "dedicated" || policy?.technicalLocalization === "shared-zh";
}

export function getVisitorTechnicalErrorText(languageCode: string | null | undefined): VisitorTechnicalText {
  return VISITOR_TECHNICAL_TEXT[normalizeVisitorTechnicalLanguageKey(languageCode)] ?? ENGLISH_VISITOR_TECHNICAL_TEXT;
}

export function localizeVisitorTechnicalIssue(
  issue: TechnicalIssue,
  languageCode: string | null | undefined
): TechnicalIssue {
  const localization = getVisitorTechnicalErrorText(languageCode);
  const localizedMessage = localization.issueMessages[issue.code]?.(issue) ?? ENGLISH_VISITOR_TECHNICAL_TEXT.issueMessages[issue.code]?.(issue) ?? issue.message;

  return {
    ...issue,
    message: localizedMessage
  };
}
