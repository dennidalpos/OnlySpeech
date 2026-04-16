import {
  findTargetLanguageOption,
  resolveDetectedSourceLanguageOption
} from "./language-options.js";
import {
  buildInteractionLanguageChoices as buildRegistryInteractionLanguageChoices,
  getInteractionLanguageCurrentLabel,
  resolveInteractionLanguageSourceLocale as resolveRegistryInteractionLanguageSourceLocale
} from "./language-registry.js";
import {
  VISITOR_LOCALIZATION_LANGUAGE_KEYS,
  hasVisitorLocalization,
  resolveVisitorLocalizationState
} from "./visitor-language-readiness.js";
import {
  EXTENDED_VISITOR_STATUS_LABELS,
  EXTENDED_VISITOR_UI_TEXT
} from "./visitor-localization-extended.js";
import type { OperatorStatus } from "./types.js";

export interface VisitorLanguageChoice {
  value: string;
  label: string;
  nativeLabel: string;
  regionCode: string | null;
}

export interface VisitorUiText {
  selectLanguageTitle: string;
  selectLanguageDescription: string;
  whatYouSay: string;
  whatYouSayHint: string;
  operatorTranslation: string;
  operatorTranslationHint: string;
  conversationHistory: string;
  conversationHistoryHint: string;
  sessionContext: string;
  sessionTurns: (count: number) => string;
  holdToSpeak: string;
  pressAndSpeak: string;
  waitingAvailability: string;
  changeLanguage: string;
  closeSession: string;
  currentLanguage: string;
  confirmCloseSession: string;
  confirmCloseSessionDescription: string;
  cancel: string;
  confirm: string;
}

const VISITOR_UI_TEXT: Record<string, VisitorUiText> = {
  af: {
    selectLanguageTitle: "Kies jou taal",
    selectLanguageDescription: "Tik die taal wat jy op hierdie skerm wil lees en gebruik.",
    whatYouSay: "Wat jy sê",
    whatYouSayHint: "Jou stem verskyn hier terwyl jy die knoppie ingedruk hou.",
    operatorTranslation: "Vertaling van die operateur",
    operatorTranslationHint: "Die vertaalde antwoord van die operateur verskyn hier.",
    conversationHistory: "Gesprekgeskiedenis",
    conversationHistoryHint: "Bevestigde beurte van die huidige sessie verskyn hier.",
    sessionContext: "Sessiekonteks",
    sessionTurns: (count) => `${count} beurte`,
    holdToSpeak: "Hou in om te praat",
    pressAndSpeak: "Druk en praat",
    waitingAvailability: "Wag vir beskikbaarheid",
    changeLanguage: "Verander taal",
    closeSession: "Sluit sessie",
    currentLanguage: "Taal",
    confirmCloseSession: "Sluit huidige sessie",
    confirmCloseSessionDescription: "Die huidige gesprek sal op albei skerms uitgevee word.",
    cancel: "Kanselleer",
    confirm: "Bevestig",
  },
  am: {
    selectLanguageTitle: "ቋንቋዎን ይምረጡ",
    selectLanguageDescription: "በዚህ ማያ ገጽ ላይ ለማንበብ እና ለመጠቀም የሚፈልጉትን ቋንቋ ይንኩ።",
    whatYouSay: "የሚናገሩት",
    whatYouSayHint: "አዝራሩን ተጭነው ሲያቆዩ ድምጽዎ እዚህ ይታያል።",
    operatorTranslation: "የኦፕሬተር ትርጉም",
    operatorTranslationHint: "የኦፕሬተሩ የተተረጎመ ምላሽ እዚህ ይታያል።",
    conversationHistory: "የውይይት ታሪክ",
    conversationHistoryHint: "የአሁኑ ክፍለ ጊዜ የተረጋገጡ ተራዎች እዚህ ይታያሉ።",
    sessionContext: "የክፍለ ጊዜ አውድ",
    sessionTurns: (count) => `${count} ተራ`,
    holdToSpeak: "ይዘው ይናገሩ",
    pressAndSpeak: "ይጫኑ እና ይናገሩ",
    waitingAvailability: "ተዘጋጅቶ እስኪሆን በመጠበቅ ላይ",
    changeLanguage: "ቋንቋ ቀይር",
    closeSession: "ክፍለ ጊዜ ዝጋ",
    currentLanguage: "ቋንቋ",
    confirmCloseSession: "የአሁኑን ክፍለ ጊዜ ዝጋ",
    confirmCloseSessionDescription: "የአሁኑ ውይይት በሁለቱም ማያ ገጾች ላይ ይጠፋል።",
    cancel: "ሰርዝ",
    confirm: "አረጋግጥ",
  },
  en: {
    selectLanguageTitle: "Choose your language",
    selectLanguageDescription: "Start from a geographic area, then choose one of the supported languages available for that region on this screen.",
    whatYouSay: "User speech",
    whatYouSayHint: "The user speech will appear here while the button is held.",
    operatorTranslation: "Operator translation",
    operatorTranslationHint: "The operator's translated reply will appear here.",
    conversationHistory: "Conversation history",
    conversationHistoryHint: "Confirmed turns from the current session will appear here.",
    sessionContext: "Session context",
    sessionTurns: (count) => `${count} turns`,
    holdToSpeak: "Hold to speak",
    pressAndSpeak: "Press and speak",
    waitingAvailability: "Waiting for availability",
    changeLanguage: "Change language",
    closeSession: "Close session",
    currentLanguage: "Language",
    confirmCloseSession: "Close current session",
    confirmCloseSessionDescription: "The current conversation will be cleared on both screens.",
    cancel: "Cancel",
    confirm: "Confirm",
  },
  el: {
    selectLanguageTitle: "Επιλέξτε τη γλώσσα σας",
    selectLanguageDescription: "Ξεκινήστε από μια γεωγραφική περιοχή και μετά επιλέξτε μία από τις υποστηριζόμενες γλώσσες αυτής της περιοχής για αυτή την οθόνη.",
    whatYouSay: "Ομιλία χρήστη",
    whatYouSayHint: "Η ομιλία σας θα εμφανίζεται εδώ όσο κρατάτε πατημένο το κουμπί.",
    operatorTranslation: "Μετάφραση χειριστή",
    operatorTranslationHint: "Η μεταφρασμένη απάντηση του χειριστή θα εμφανίζεται εδώ.",
    conversationHistory: "Ιστορικό συνομιλίας",
    conversationHistoryHint: "Οι επιβεβαιωμένες εναλλαγές της τρέχουσας συνεδρίας εμφανίζονται εδώ.",
    sessionContext: "Πλαίσιο συνεδρίας",
    sessionTurns: (count) => `${count} γύροι`,
    holdToSpeak: "Κρατήστε πατημένο για να μιλήσετε",
    pressAndSpeak: "Πατήστε και μιλήστε",
    waitingAvailability: "Αναμονή διαθεσιμότητας",
    changeLanguage: "Αλλαγή γλώσσας",
    closeSession: "Κλείσιμο συνεδρίας",
    currentLanguage: "Γλώσσα",
    confirmCloseSession: "Κλείσιμο τρέχουσας συνεδρίας",
    confirmCloseSessionDescription: "Η τρέχουσα συνομιλία θα καθαριστεί και στις δύο οθόνες.",
    cancel: "Ακύρωση",
    confirm: "Επιβεβαίωση",
  },
  it: {
    selectLanguageTitle: "Seleziona la tua lingua",
    selectLanguageDescription: "Tocca la lingua che vuoi leggere e usare su questo schermo.",
    whatYouSay: "Testo utente",
    whatYouSayHint: "Il testo dell'utente apparira qui mentre tiene premuto il pulsante.",
    operatorTranslation: "Traduzione operatore",
    operatorTranslationHint: "La risposta dell'operatore tradotta apparira qui.",
    conversationHistory: "Storico conversazione",
    conversationHistoryHint: "Qui compaiono i turni confermati della sessione corrente.",
    sessionContext: "Contesto sessione",
    sessionTurns: (count) => `${count} turni`,
    holdToSpeak: "Tieni premuto per parlare",
    pressAndSpeak: "Premi e parla",
    waitingAvailability: "Attendi disponibilita",
    changeLanguage: "Cambia lingua",
    closeSession: "Chiudi sessione",
    currentLanguage: "Lingua",
    confirmCloseSession: "Chiudi la sessione corrente",
    confirmCloseSessionDescription: "La conversazione corrente verra cancellata su entrambi gli schermi.",
    cancel: "Annulla",
    confirm: "Conferma",
  },
  fr: {
    selectLanguageTitle: "Choisissez votre langue",
    selectLanguageDescription: "Touchez la langue que vous voulez lire et utiliser sur cet ecran.",
    whatYouSay: "Ce que vous dites",
    whatYouSayHint: "Votre voix apparaitra ici pendant que vous gardez le bouton appuye.",
    operatorTranslation: "Traduction de l'operateur",
    operatorTranslationHint: "La reponse traduite de l'operateur apparaitra ici.",
    conversationHistory: "Historique de conversation",
    conversationHistoryHint: "Les tours confirmes de la session en cours apparaissent ici.",
    sessionContext: "Contexte de session",
    sessionTurns: (count) => `${count} tours`,
    holdToSpeak: "Maintenez pour parler",
    pressAndSpeak: "Appuyez et parlez",
    waitingAvailability: "En attente de disponibilite",
    changeLanguage: "Changer de langue",
    closeSession: "Fermer la session",
    currentLanguage: "Langue",
    confirmCloseSession: "Fermer la session en cours",
    confirmCloseSessionDescription: "La conversation en cours sera effacee sur les deux ecrans.",
    cancel: "Annuler",
    confirm: "Confirmer",
  },
  de: {
    selectLanguageTitle: "Waehlen Sie Ihre Sprache",
    selectLanguageDescription: "Tippen Sie auf die Sprache, die Sie auf diesem Bildschirm lesen und verwenden moechten.",
    whatYouSay: "Was Sie sagen",
    whatYouSayHint: "Ihre Sprache erscheint hier, waehrend Sie die Taste gedrueckt halten.",
    operatorTranslation: "Uebersetzung des Operators",
    operatorTranslationHint: "Die uebersetzte Antwort des Operators erscheint hier.",
    conversationHistory: "Gesprächsverlauf",
    conversationHistoryHint: "Bestätigte Gesprächsrunden der aktuellen Sitzung erscheinen hier.",
    sessionContext: "Sitzungskontext",
    sessionTurns: (count) => `${count} Zuege`,
    holdToSpeak: "Gedrueckt halten zum Sprechen",
    pressAndSpeak: "Druecken und sprechen",
    waitingAvailability: "Warten auf Verfuegbarkeit",
    changeLanguage: "Sprache aendern",
    closeSession: "Sitzung beenden",
    currentLanguage: "Sprache",
    confirmCloseSession: "Aktuelle Sitzung beenden",
    confirmCloseSessionDescription: "Das aktuelle Gespraech wird auf beiden Bildschirmen geloescht.",
    cancel: "Abbrechen",
    confirm: "Bestaetigen",
  },
  es: {
    selectLanguageTitle: "Elige tu idioma",
    selectLanguageDescription: "Toca el idioma que quieres leer y usar en esta pantalla.",
    whatYouSay: "Lo que dices",
    whatYouSayHint: "Tu voz aparecera aqui mientras mantienes pulsado el boton.",
    operatorTranslation: "Traduccion del operador",
    operatorTranslationHint: "La respuesta traducida del operador aparecera aqui.",
    conversationHistory: "Historial de conversacion",
    conversationHistoryHint: "Aqui apareceran los turnos confirmados de la sesion actual.",
    sessionContext: "Contexto de sesion",
    sessionTurns: (count) => `${count} turnos`,
    holdToSpeak: "Mantener pulsado para hablar",
    pressAndSpeak: "Pulsa y habla",
    waitingAvailability: "Esperando disponibilidad",
    changeLanguage: "Cambiar idioma",
    closeSession: "Cerrar sesion",
    currentLanguage: "Idioma",
    confirmCloseSession: "Cerrar la sesion actual",
    confirmCloseSessionDescription: "La conversacion actual se borrara en ambas pantallas.",
    cancel: "Cancelar",
    confirm: "Confirmar",
  },
  pt: {
    selectLanguageTitle: "Escolha o seu idioma",
    selectLanguageDescription: "Toque no idioma que deseja ler e usar nesta tela.",
    whatYouSay: "O que voce diz",
    whatYouSayHint: "Sua fala aparecera aqui enquanto voce mantem o botao pressionado.",
    operatorTranslation: "Traducao do operador",
    operatorTranslationHint: "A resposta traduzida do operador aparecera aqui.",
    conversationHistory: "Historico da conversa",
    conversationHistoryHint: "Os turnos confirmados da sessao atual aparecem aqui.",
    sessionContext: "Contexto da sessao",
    sessionTurns: (count) => `${count} turnos`,
    holdToSpeak: "Segure para falar",
    pressAndSpeak: "Pressione e fale",
    waitingAvailability: "Aguardando disponibilidade",
    changeLanguage: "Mudar idioma",
    closeSession: "Encerrar sessao",
    currentLanguage: "Idioma",
    confirmCloseSession: "Encerrar a sessao atual",
    confirmCloseSessionDescription: "A conversa atual sera limpa nas duas telas.",
    cancel: "Cancelar",
    confirm: "Confirmar",
  },
  nl: {
    selectLanguageTitle: "Kies uw taal",
    selectLanguageDescription: "Tik op de taal die u op dit scherm wilt lezen en gebruiken.",
    whatYouSay: "Wat u zegt",
    whatYouSayHint: "Uw spraak verschijnt hier terwijl u de knop ingedrukt houdt.",
    operatorTranslation: "Vertaling van de operator",
    operatorTranslationHint: "Het vertaalde antwoord van de operator verschijnt hier.",
    conversationHistory: "Gespreksgeschiedenis",
    conversationHistoryHint: "Bevestigde beurten van de huidige sessie verschijnen hier.",
    sessionContext: "Sessiecontext",
    sessionTurns: (count) => `${count} beurten`,
    holdToSpeak: "Ingedrukt houden om te spreken",
    pressAndSpeak: "Druk en spreek",
    waitingAvailability: "Wachten op beschikbaarheid",
    changeLanguage: "Taal wijzigen",
    closeSession: "Sessie sluiten",
    currentLanguage: "Taal",
    confirmCloseSession: "Huidige sessie sluiten",
    confirmCloseSessionDescription: "Het huidige gesprek wordt op beide schermen gewist.",
    cancel: "Annuleren",
    confirm: "Bevestigen",
  },
  pl: {
    selectLanguageTitle: "Wybierz swoj jezyk",
    selectLanguageDescription: "Dotknij jezyka, ktory chcesz czytac i uzywac na tym ekranie.",
    whatYouSay: "To, co mowisz",
    whatYouSayHint: "Twoja mowa pojawi sie tutaj, gdy trzymasz przycisk.",
    operatorTranslation: "Tlumaczenie operatora",
    operatorTranslationHint: "Przetlumaczona odpowiedz operatora pojawi sie tutaj.",
    conversationHistory: "Historia rozmowy",
    conversationHistoryHint: "Tutaj pojawia sie potwierdzone tury biezacej sesji.",
    sessionContext: "Kontekst sesji",
    sessionTurns: (count) => `${count} tur`,
    holdToSpeak: "Przytrzymaj, aby mowic",
    pressAndSpeak: "Nacisnij i mow",
    waitingAvailability: "Oczekiwanie na dostepnosc",
    changeLanguage: "Zmien jezyk",
    closeSession: "Zamknij sesje",
    currentLanguage: "Jezyk",
    confirmCloseSession: "Zamknij biezaca sesje",
    confirmCloseSessionDescription: "Biezaca rozmowa zostanie wyczyszczona na obu ekranach.",
    cancel: "Anuluj",
    confirm: "Potwierdz",
  },
  ro: {
    selectLanguageTitle: "Alege limba ta",
    selectLanguageDescription: "Atinge limba pe care vrei sa o citesti si sa o folosesti pe acest ecran.",
    whatYouSay: "Ce spui",
    whatYouSayHint: "Vocea ta va aparea aici cat timp tii butonul apasat.",
    operatorTranslation: "Traducerea operatorului",
    operatorTranslationHint: "Raspunsul tradus al operatorului va aparea aici.",
    conversationHistory: "Istoric conversatie",
    conversationHistoryHint: "Aici apar replicile confirmate din sesiunea curenta.",
    sessionContext: "Context sesiune",
    sessionTurns: (count) => `${count} replici`,
    holdToSpeak: "Tine apasat pentru a vorbi",
    pressAndSpeak: "Apasa si vorbeste",
    waitingAvailability: "Se asteapta disponibilitatea",
    changeLanguage: "Schimba limba",
    closeSession: "Inchide sesiunea",
    currentLanguage: "Limba",
    confirmCloseSession: "Inchide sesiunea curenta",
    confirmCloseSessionDescription: "Conversatia curenta va fi stearsa pe ambele ecrane.",
    cancel: "Anuleaza",
    confirm: "Confirma",
  },
  ru: {
    selectLanguageTitle: "Vyberite svoi yazyk",
    selectLanguageDescription: "Nazhmi na yazyk, kotoryi nuzhno chitat i ispolzovat na etom ekrane.",
    whatYouSay: "To, chto vy govorite",
    whatYouSayHint: "Vasha rech poyavitsya zdes, poka vy uderzhivaete knopku.",
    operatorTranslation: "Perevod operatora",
    operatorTranslationHint: "Perevedennyi otvet operatora poyavitsya zdes.",
    conversationHistory: "Istoriya razgovora",
    conversationHistoryHint: "Zdes pokazyvayutsya podtverzhdennye repliki tekushchei sessii.",
    sessionContext: "Kontekst sessii",
    sessionTurns: (count) => `${count} replik`,
    holdToSpeak: "Uderzhivayte, chtoby govorit",
    pressAndSpeak: "Nazhmi i govori",
    waitingAvailability: "Ozhidanie dostupnosti",
    changeLanguage: "Smenit yazyk",
    closeSession: "Zavershit seans",
    currentLanguage: "Yazyk",
    confirmCloseSession: "Zavershit tekushchii seans",
    confirmCloseSessionDescription: "Tekushchii razgovor budet ochishchen na oboih ekranah.",
    cancel: "Otmena",
    confirm: "Podtverdit",
  },
  sw: {
    selectLanguageTitle: "Chagua lugha yako",
    selectLanguageDescription: "Gusa lugha unayotaka kusoma na kutumia kwenye skrini hii.",
    whatYouSay: "Unachosema",
    whatYouSayHint: "Sauti yako itaonekana hapa unaposhikilia kitufe.",
    operatorTranslation: "Tafsiri ya mhudumu",
    operatorTranslationHint: "Jibu lililotafsiriwa la mhudumu litaonekana hapa.",
    conversationHistory: "Historia ya mazungumzo",
    conversationHistoryHint: "Zamu zilizothibitishwa za kipindi hiki zitaonekana hapa.",
    sessionContext: "Muktadha wa kipindi",
    sessionTurns: (count) => `${count} zamu`,
    holdToSpeak: "Shikilia kuzungumza",
    pressAndSpeak: "Bonyeza uongee",
    waitingAvailability: "Inasubiri kupatikana",
    changeLanguage: "Badili lugha",
    closeSession: "Funga kipindi",
    currentLanguage: "Lugha",
    confirmCloseSession: "Funga kipindi cha sasa",
    confirmCloseSessionDescription: "Mazungumzo ya sasa yatafutwa kwenye skrini zote mbili.",
    cancel: "Ghairi",
    confirm: "Thibitisha",
  },
  uk: {
    selectLanguageTitle: "Obyrit svoiu movu",
    selectLanguageDescription: "Torknitsia movy, yaku vy khochete chytaty ta vykorystovuvaty na tsomu ekrani.",
    whatYouSay: "Shcho vy hovoryte",
    whatYouSayHint: "Vash holos z'iavytsia tut, poky vy utrymuiete knopku.",
    operatorTranslation: "Pereklad operatora",
    operatorTranslationHint: "Perekladena vidpovid operatora z'iavytsia tut.",
    conversationHistory: "Istoriia rozmovy",
    conversationHistoryHint: "Tut z'iavliaiutsia pidtverdzheni repliki potochnoi sesii.",
    sessionContext: "Kontekst sesii",
    sessionTurns: (count) => `${count} replik`,
    holdToSpeak: "Utrymuite, shchob hovoryty",
    pressAndSpeak: "Natysnit i hovorit",
    waitingAvailability: "Ochykuvannia dostupnosti",
    changeLanguage: "Zminyty movu",
    closeSession: "Zavershyty seans",
    currentLanguage: "Mova",
    confirmCloseSession: "Zavershyty potochnyi seans",
    confirmCloseSessionDescription: "Potocnu rozmovu bude ochyshcheno na obokh ekranakh.",
    cancel: "Skasuvaty",
    confirm: "Pidtverdyty",
  },
  ar: {
    selectLanguageTitle: "اختر لغتك",
    selectLanguageDescription: "المس اللغة التي تريد قراءتها واستخدامها على هذه الشاشة.",
    whatYouSay: "ما تقوله",
    whatYouSayHint: "سيظهر كلامك هنا أثناء استمرارك بالضغط على الزر.",
    operatorTranslation: "ترجمة الموظف",
    operatorTranslationHint: "سيظهر رد الموظف مترجما هنا.",
    conversationHistory: "سجل المحادثة",
    conversationHistoryHint: "ستظهر هنا الرسائل المؤكدة من الجلسة الحالية.",
    sessionContext: "سياق الجلسة",
    sessionTurns: (count) => `${count} جولات`,
    holdToSpeak: "اضغط باستمرار للتحدث",
    pressAndSpeak: "اضغط وتحدث",
    waitingAvailability: "بانتظار التوفر",
    changeLanguage: "تغيير اللغة",
    closeSession: "إنهاء الجلسة",
    currentLanguage: "اللغة",
    confirmCloseSession: "إنهاء الجلسة الحالية",
    confirmCloseSessionDescription: "سيتم مسح المحادثة الحالية على الشاشتين.",
    cancel: "إلغاء",
    confirm: "تأكيد",
  },
  zh: {
    selectLanguageTitle: "选择你的语言",
    selectLanguageDescription: "点击你希望在此屏幕上阅读和使用的语言。",
    whatYouSay: "你说的话",
    whatYouSayHint: "按住按钮说话时，你的语音会显示在这里。",
    operatorTranslation: "工作人员翻译",
    operatorTranslationHint: "工作人员回复的翻译会显示在这里。",
    conversationHistory: "对话记录",
    conversationHistoryHint: "当前会话中已确认的轮次会显示在这里。",
    sessionContext: "会话上下文",
    sessionTurns: (count) => `${count} 轮`,
    holdToSpeak: "按住说话",
    pressAndSpeak: "按下并说话",
    waitingAvailability: "等待可用",
    changeLanguage: "切换语言",
    closeSession: "结束会话",
    currentLanguage: "语言",
    confirmCloseSession: "结束当前会话",
    confirmCloseSessionDescription: "当前对话将在两个屏幕上清除。",
    cancel: "取消",
    confirm: "确认",
  },
  ja: {
    selectLanguageTitle: "言語を選択してください",
    selectLanguageDescription: "この画面で読みたい言語をタップしてください。",
    whatYouSay: "あなたが話した内容",
    whatYouSayHint: "ボタンを押している間、あなたの音声がここに表示されます。",
    operatorTranslation: "オペレーターの翻訳",
    operatorTranslationHint: "オペレーターの返答の翻訳がここに表示されます。",
    conversationHistory: "会話履歴",
    conversationHistoryHint: "現在のセッションで確定した発話がここに表示されます。",
    sessionContext: "セッション情報",
    sessionTurns: (count) => `${count} 件`,
    holdToSpeak: "押して話す",
    pressAndSpeak: "押して話してください",
    waitingAvailability: "利用可能になるまで待機中",
    changeLanguage: "言語を変更",
    closeSession: "セッションを終了",
    currentLanguage: "言語",
    confirmCloseSession: "現在のセッションを終了",
    confirmCloseSessionDescription: "現在の会話は両方の画面で消去されます。",
    cancel: "キャンセル",
    confirm: "確認",
  },
  ko: {
    selectLanguageTitle: "언어를 선택하세요",
    selectLanguageDescription: "이 화면에서 읽고 사용할 언어를 누르세요.",
    whatYouSay: "내가 말한 내용",
    whatYouSayHint: "버튼을 누르고 있는 동안 내 말이 여기에 표시됩니다.",
    operatorTranslation: "상담원 번역",
    operatorTranslationHint: "상담원의 번역된 답변이 여기에 표시됩니다.",
    conversationHistory: "대화 기록",
    conversationHistoryHint: "현재 세션에서 확정된 대화가 여기에 표시됩니다.",
    sessionContext: "세션 정보",
    sessionTurns: (count) => `${count}개`,
    holdToSpeak: "눌러서 말하기",
    pressAndSpeak: "누르고 말하세요",
    waitingAvailability: "사용 가능 상태 대기 중",
    changeLanguage: "언어 변경",
    closeSession: "세션 종료",
    currentLanguage: "언어",
    confirmCloseSession: "현재 세션 종료",
    confirmCloseSessionDescription: "현재 대화가 두 화면에서 모두 지워집니다.",
    cancel: "취소",
    confirm: "확인",
  },
  tr: {
    selectLanguageTitle: "Dilinizi secin",
    selectLanguageDescription: "Bu ekranda okumak ve kullanmak istediginiz dili secin.",
    whatYouSay: "Sizin soylediginiz",
    whatYouSayHint: "Dugmeyi basili tuttugunuzda sesiniz burada gorunur.",
    operatorTranslation: "Operator cevirisi",
    operatorTranslationHint: "Operatorun cevrilmis yaniti burada gorunur.",
    conversationHistory: "Konusma gecmisi",
    conversationHistoryHint: "Mevcut oturumdaki onaylanmis konusmalar burada gorunur.",
    sessionContext: "Oturum baglami",
    sessionTurns: (count) => `${count} tur`,
    holdToSpeak: "Konusmak icin basili tutun",
    pressAndSpeak: "Basin ve konusun",
    waitingAvailability: "Kullanilabilirlik bekleniyor",
    changeLanguage: "Dili degistir",
    closeSession: "Oturumu kapat",
    currentLanguage: "Dil",
    confirmCloseSession: "Mevcut oturumu kapat",
    confirmCloseSessionDescription: "Mevcut gorusme her iki ekranda da temizlenecek.",
    cancel: "Iptal",
    confirm: "Onayla",
  },
  he: {
    selectLanguageTitle: "בחר את השפה שלך",
    selectLanguageDescription: "גע בשפה שברצונך לקרוא ולהשתמש בה במסך זה.",
    whatYouSay: "מה שאתה אומר",
    whatYouSayHint: "הדיבור שלך יופיע כאן בזמן שאתה מחזיק את הכפתור.",
    operatorTranslation: "תרגום המפעיל",
    operatorTranslationHint: "התגובה המתורגמת של המפעיל תופיע כאן.",
    conversationHistory: "היסטוריית שיחה",
    conversationHistoryHint: "כאן יופיעו הסבבים שאושרו בסשן הנוכחי.",
    sessionContext: "הקשר הסשן",
    sessionTurns: (count) => `${count} סבבים`,
    holdToSpeak: "החזק כדי לדבר",
    pressAndSpeak: "לחץ ודבר",
    waitingAvailability: "ממתין לזמינות",
    changeLanguage: "שנה שפה",
    closeSession: "סגור סשן",
    currentLanguage: "שפה",
    confirmCloseSession: "סגור את הסשן הנוכחי",
    confirmCloseSessionDescription: "השיחה הנוכחית תנוקה בשני המסכים.",
    cancel: "ביטול",
    confirm: "אישור",
  },
  fa: {
    selectLanguageTitle: "زبان خود را انتخاب کنید",
    selectLanguageDescription: "زبانی را لمس کنید که می خواهید در این صفحه بخوانید و استفاده کنید.",
    whatYouSay: "آنچه می گویید",
    whatYouSayHint: "هنگام نگه داشتن دکمه، گفتار شما اینجا ظاهر می شود.",
    operatorTranslation: "ترجمه اپراتور",
    operatorTranslationHint: "پاسخ ترجمه شده اپراتور اینجا نمایش داده می شود.",
    conversationHistory: "تاریخچه گفتگو",
    conversationHistoryHint: "نوبت های تایید شده جلسه جاری اینجا ظاهر می شوند.",
    sessionContext: "زمینه جلسه",
    sessionTurns: (count) => `${count} نوبت`,
    holdToSpeak: "برای صحبت نگه دارید",
    pressAndSpeak: "فشار دهید و صحبت کنید",
    waitingAvailability: "در انتظار آماده بودن",
    changeLanguage: "تغییر زبان",
    closeSession: "بستن جلسه",
    currentLanguage: "زبان",
    confirmCloseSession: "بستن جلسه جاری",
    confirmCloseSessionDescription: "گفتگوی جاری در هر دو صفحه پاک می شود.",
    cancel: "انصراف",
    confirm: "تایید",
  },
  ur: {
    selectLanguageTitle: "اپنی زبان منتخب کریں",
    selectLanguageDescription: "اس زبان کو منتخب کریں جسے آپ اس اسکرین پر پڑھنا اور استعمال کرنا چاہتے ہیں۔",
    whatYouSay: "آپ جو کہتے ہیں",
    whatYouSayHint: "جب آپ بٹن دبائے رکھیں گے تو آپ کی آواز یہاں نظر آئے گی۔",
    operatorTranslation: "آپریٹر کا ترجمہ",
    operatorTranslationHint: "آپریٹر کا ترجمہ شدہ جواب یہاں ظاہر ہوگا۔",
    conversationHistory: "گفتگو کی تاریخ",
    conversationHistoryHint: "موجودہ سیشن کے تصدیق شدہ ٹرن یہاں دکھائی دیں گے۔",
    sessionContext: "سیشن کا سیاق",
    sessionTurns: (count) => `${count} ٹرن`,
    holdToSpeak: "بولنے کے لئے دبائے رکھیں",
    pressAndSpeak: "دبائیں اور بولیں",
    waitingAvailability: "دستیابی کا انتظار",
    changeLanguage: "زبان تبدیل کریں",
    closeSession: "سیشن بند کریں",
    currentLanguage: "زبان",
    confirmCloseSession: "موجودہ سیشن بند کریں",
    confirmCloseSessionDescription: "موجودہ گفتگو دونوں اسکرینوں پر صاف کر دی جائے گی۔",
    cancel: "منسوخ",
    confirm: "تصدیق",
  },
  ps: {
    selectLanguageTitle: "خپله ژبه وټاکئ",
    selectLanguageDescription: "هغه ژبه وټاکئ چې غواړئ په دې سکرین کې يې ولولئ او وکاروئ.",
    whatYouSay: "هغه څه چې تاسو وایئ",
    whatYouSayHint: "ستاسو غږ به دلته ښکاره شي تر څو چې تاسې تڼۍ نيولې وي.",
    operatorTranslation: "د اپراتور ژباړه",
    operatorTranslationHint: "د اپراتور ژباړل شوی ځواب به دلته ښکاره شي.",
    conversationHistory: "د خبرو اترو تاريخ",
    conversationHistoryHint: "د روانې ناستې تاييد شوي وارونه به دلته ښکاره شي.",
    sessionContext: "د ناستې شاليد",
    sessionTurns: (count) => `${count} وارونه`,
    holdToSpeak: "د خبرو لپاره يې ونيسئ",
    pressAndSpeak: "کېکاږئ او خبرې وکړئ",
    waitingAvailability: "د چمتووالي په تمه",
    changeLanguage: "ژبه بدله کړئ",
    closeSession: "ناسته وتړئ",
    currentLanguage: "ژبه",
    confirmCloseSession: "روانه ناسته وتړئ",
    confirmCloseSessionDescription: "روانه خبرې اترې به په دواړو سکرينونو کې پاکې شي.",
    cancel: "لغوه",
    confirm: "تاييد",
  },
  hi: {
    selectLanguageTitle: "अपनी भाषा चुनें",
    selectLanguageDescription: "उस भाषा को छुएं जिसे आप इस स्क्रीन पर पढ़ना और उपयोग करना चाहते हैं।",
    whatYouSay: "आप क्या कहते हैं",
    whatYouSayHint: "जब आप बटन दबाए रखेंगे तब आपकी आवाज यहां दिखाई देगी।",
    operatorTranslation: "ऑपरेटर अनुवाद",
    operatorTranslationHint: "ऑपरेटर का अनूदित उत्तर यहां दिखाई देगा।",
    conversationHistory: "बातचीत इतिहास",
    conversationHistoryHint: "वर्तमान सत्र के पुष्टि किए गए टर्न यहां दिखाई देंगे।",
    sessionContext: "सत्र संदर्भ",
    sessionTurns: (count) => `${count} टर्न`,
    holdToSpeak: "बोलने के लिए दबाए रखें",
    pressAndSpeak: "दबाएं और बोलें",
    waitingAvailability: "उपलब्धता की प्रतीक्षा",
    changeLanguage: "भाषा बदलें",
    closeSession: "सत्र बंद करें",
    currentLanguage: "भाषा",
    confirmCloseSession: "वर्तमान सत्र बंद करें",
    confirmCloseSessionDescription: "वर्तमान बातचीत दोनों स्क्रीन पर साफ कर दी जाएगी।",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें",
  },
  bn: {
    selectLanguageTitle: "আপনার ভাষা বেছে নিন",
    selectLanguageDescription: "এই স্ক্রিনে যে ভাষা পড়তে ও ব্যবহার করতে চান সেটি স্পর্শ করুন।",
    whatYouSay: "আপনি যা বলছেন",
    whatYouSayHint: "আপনি বোতাম চেপে ধরে রাখলে আপনার কথা এখানে দেখা যাবে।",
    operatorTranslation: "অপারেটর অনুবাদ",
    operatorTranslationHint: "অপারেটরের অনূদিত উত্তর এখানে দেখা যাবে।",
    conversationHistory: "কথোপকথনের ইতিহাস",
    conversationHistoryHint: "বর্তমান সেশনের নিশ্চিত টার্নগুলো এখানে দেখা যাবে।",
    sessionContext: "সেশন প্রসঙ্গ",
    sessionTurns: (count) => `${count} টার্ন`,
    holdToSpeak: "বলতে ধরে রাখুন",
    pressAndSpeak: "চাপুন এবং বলুন",
    waitingAvailability: "প্রাপ্যতার অপেক্ষায়",
    changeLanguage: "ভাষা পরিবর্তন করুন",
    closeSession: "সেশন বন্ধ করুন",
    currentLanguage: "ভাষা",
    confirmCloseSession: "বর্তমান সেশন বন্ধ করুন",
    confirmCloseSessionDescription: "বর্তমান কথোপকথন দুই স্ক্রিন থেকেই মুছে ফেলা হবে।",
    cancel: "বাতিল",
    confirm: "নিশ্চিত করুন",
  },
  ta: {
    selectLanguageTitle: "உங்கள் மொழியை தேர்வு செய்யவும்",
    selectLanguageDescription: "இந்த திரையில் படிக்கவும் பயன்படுத்தவும் விரும்பும் மொழியைத் தொடுங்கள்.",
    whatYouSay: "நீங்கள் சொல்வது",
    whatYouSayHint: "பட்டனை அழுத்தி வைத்திருக்கும்போது உங்கள் குரல் இங்கே தோன்றும்.",
    operatorTranslation: "ஆபரேட்டர் மொழிபெயர்ப்பு",
    operatorTranslationHint: "ஆபரேட்டரின் மொழிபெயர்க்கப்பட்ட பதில் இங்கே தோன்றும்.",
    conversationHistory: "உரையாடல் வரலாறு",
    conversationHistoryHint: "நடப்பு அமர்வின் உறுதிப்படுத்தப்பட்ட சுற்றுகள் இங்கே தோன்றும்.",
    sessionContext: "அமர்வு சூழல்",
    sessionTurns: (count) => `${count} சுற்றுகள்`,
    holdToSpeak: "பேச அழுத்தி பிடிக்கவும்",
    pressAndSpeak: "அழுத்தி பேசவும்",
    waitingAvailability: "தயாராகும் வரை காத்திருக்கிறது",
    changeLanguage: "மொழியை மாற்று",
    closeSession: "அமர்வை மூடு",
    currentLanguage: "மொழி",
    confirmCloseSession: "தற்போதைய அமர்வை மூடு",
    confirmCloseSessionDescription: "தற்போதைய உரையாடல் இரு திரைகளிலும் அழிக்கப்படும்.",
    cancel: "ரத்து செய்",
    confirm: "உறுதி செய்",
  },
  te: {
    selectLanguageTitle: "మీ భాషను ఎంచుకోండి",
    selectLanguageDescription: "ఈ తెరపై చదవడానికి మరియు ఉపయోగించడానికి కావలసిన భాషను తాకండి.",
    whatYouSay: "మీరు చెప్పేది",
    whatYouSayHint: "మీరు బటన్ నొక్కి ఉంచినంతసేపు మీ మాట ఇక్కడ కనిపిస్తుంది.",
    operatorTranslation: "ఆపరేటర్ అనువాదం",
    operatorTranslationHint: "ఆపరేటర్ అనువదించిన సమాధానం ఇక్కడ కనిపిస్తుంది.",
    conversationHistory: "సంభాషణ చరిత్ర",
    conversationHistoryHint: "ప్రస్తుత సెషన్‌లో నిర్ధారించబడిన టర్న్‌లు ఇక్కడ కనిపిస్తాయి.",
    sessionContext: "సెషన్ సందర్భం",
    sessionTurns: (count) => `${count} టర్న్‌లు`,
    holdToSpeak: "మాట్లాడేందుకు నొక్కి ఉంచండి",
    pressAndSpeak: "నొక్కి మాట్లాడండి",
    waitingAvailability: "అందుబాటుకు వేచి ఉంది",
    changeLanguage: "భాష మార్చు",
    closeSession: "సెషన్ మూసివేయి",
    currentLanguage: "భాష",
    confirmCloseSession: "ప్రస్తుత సెషన్‌ను మూసివేయి",
    confirmCloseSessionDescription: "ప్రస్తుత సంభాషణ రెండు తెరలపైనా క్లియర్ అవుతుంది.",
    cancel: "రద్దు",
    confirm: "ధృవీకరించు",
  },
  th: {
    selectLanguageTitle: "เลือกภาษาของคุณ",
    selectLanguageDescription: "แตะภาษาที่คุณต้องการอ่านและใช้งานบนหน้าจอนี้",
    whatYouSay: "สิ่งที่คุณพูด",
    whatYouSayHint: "เสียงของคุณจะแสดงที่นี่ขณะกดปุ่มค้างไว้",
    operatorTranslation: "คำแปลของเจ้าหน้าที่",
    operatorTranslationHint: "คำตอบที่แปลแล้วของเจ้าหน้าที่จะแสดงที่นี่",
    conversationHistory: "ประวัติการสนทนา",
    conversationHistoryHint: "ข้อความที่ยืนยันแล้วของเซสชันปัจจุบันจะแสดงที่นี่",
    sessionContext: "บริบทเซสชัน",
    sessionTurns: (count) => `${count} รอบ`,
    holdToSpeak: "กดค้างเพื่อพูด",
    pressAndSpeak: "กดและพูด",
    waitingAvailability: "กำลังรอพร้อมใช้งาน",
    changeLanguage: "เปลี่ยนภาษา",
    closeSession: "ปิดเซสชัน",
    currentLanguage: "ภาษา",
    confirmCloseSession: "ปิดเซสชันปัจจุบัน",
    confirmCloseSessionDescription: "การสนทนาปัจจุบันจะถูกล้างบนทั้งสองหน้าจอ",
    cancel: "ยกเลิก",
    confirm: "ยืนยัน",
  },
  vi: {
    selectLanguageTitle: "Chon ngon ngu cua ban",
    selectLanguageDescription: "Cham vao ngon ngu ban muon doc va su dung tren man hinh nay.",
    whatYouSay: "Noi dung ban noi",
    whatYouSayHint: "Giong noi cua ban se hien o day khi ban giu nut.",
    operatorTranslation: "Ban dich cua nhan vien",
    operatorTranslationHint: "Cau tra loi da duoc dich cua nhan vien se hien o day.",
    conversationHistory: "Lich su hoi thoai",
    conversationHistoryHint: "Cac luot da xac nhan trong phien hien tai se hien o day.",
    sessionContext: "Ngu canh phien",
    sessionTurns: (count) => `${count} luot`,
    holdToSpeak: "Giu de noi",
    pressAndSpeak: "Nhan va noi",
    waitingAvailability: "Dang cho san sang",
    changeLanguage: "Doi ngon ngu",
    closeSession: "Dong phien",
    currentLanguage: "Ngon ngu",
    confirmCloseSession: "Dong phien hien tai",
    confirmCloseSessionDescription: "Cuoc hoi thoai hien tai se duoc xoa tren ca hai man hinh.",
    cancel: "Huy",
    confirm: "Xac nhan",
  },
  ms: {
    selectLanguageTitle: "Pilih bahasa anda",
    selectLanguageDescription: "Sentuh bahasa yang anda mahu baca dan gunakan pada skrin ini.",
    whatYouSay: "Apa yang anda katakan",
    whatYouSayHint: "Pertuturan anda akan muncul di sini semasa anda menekan butang.",
    operatorTranslation: "Terjemahan operator",
    operatorTranslationHint: "Jawapan operator yang diterjemahkan akan muncul di sini.",
    conversationHistory: "Sejarah perbualan",
    conversationHistoryHint: "Giliran yang disahkan untuk sesi semasa akan muncul di sini.",
    sessionContext: "Konteks sesi",
    sessionTurns: (count) => `${count} giliran`,
    holdToSpeak: "Tekan dan tahan untuk bercakap",
    pressAndSpeak: "Tekan dan bercakap",
    waitingAvailability: "Menunggu ketersediaan",
    changeLanguage: "Tukar bahasa",
    closeSession: "Tutup sesi",
    currentLanguage: "Bahasa",
    confirmCloseSession: "Tutup sesi semasa",
    confirmCloseSessionDescription: "Perbualan semasa akan dibersihkan pada kedua-dua skrin.",
    cancel: "Batal",
    confirm: "Sahkan",
  },
  id: {
    selectLanguageTitle: "Pilih bahasa Anda",
    selectLanguageDescription: "Ketuk bahasa yang ingin Anda baca dan gunakan di layar ini.",
    whatYouSay: "Apa yang Anda katakan",
    whatYouSayHint: "Ucapan Anda akan muncul di sini saat Anda menahan tombol.",
    operatorTranslation: "Terjemahan operator",
    operatorTranslationHint: "Balasan operator yang sudah diterjemahkan akan muncul di sini.",
    conversationHistory: "Riwayat percakapan",
    conversationHistoryHint: "Giliran yang sudah dikonfirmasi pada sesi saat ini akan muncul di sini.",
    sessionContext: "Konteks sesi",
    sessionTurns: (count) => `${count} giliran`,
    holdToSpeak: "Tahan untuk berbicara",
    pressAndSpeak: "Tekan dan bicara",
    waitingAvailability: "Menunggu kesiapan",
    changeLanguage: "Ubah bahasa",
    closeSession: "Tutup sesi",
    currentLanguage: "Bahasa",
    confirmCloseSession: "Tutup sesi saat ini",
    confirmCloseSessionDescription: "Percakapan saat ini akan dibersihkan di kedua layar.",
    cancel: "Batal",
    confirm: "Konfirmasi",
  },
  ...EXTENDED_VISITOR_UI_TEXT
};

const VISITOR_STATUS_LABELS: Record<string, Record<OperatorStatus, string>> = {
  af: {
    booting: "Begin",
    "language-selection": "Taalkeuse",
    ready: "Gereed",
    listening: "Luister",
    translating: "Vertaal",
    error: "Fout"
  },
  am: {
    booting: "በመጀመር ላይ",
    "language-selection": "የቋንቋ ምርጫ",
    ready: "ዝግጁ",
    listening: "በማዳመጥ ላይ",
    translating: "በመተርጎም ላይ",
    error: "ስህተት"
  },
  en: {
    booting: "Starting",
    "language-selection": "Language selection",
    ready: "Ready",
    listening: "Listening",
    translating: "Translating",
    error: "Error"
  },
  it: {
    booting: "Avvio",
    "language-selection": "Selezione lingua",
    ready: "Pronto",
    listening: "Ascolto",
    translating: "Traduco",
    error: "Errore"
  },
  fr: {
    booting: "Demarrage",
    "language-selection": "Selection langue",
    ready: "Pret",
    listening: "En ecoute",
    translating: "Traduction",
    error: "Erreur"
  },
  de: {
    booting: "Startet",
    "language-selection": "Sprachauswahl",
    ready: "Bereit",
    listening: "Hoert zu",
    translating: "Uebersetzt",
    error: "Fehler"
  },
  el: {
    booting: "Εκκίνηση",
    "language-selection": "Επιλογή γλώσσας",
    ready: "Έτοιμο",
    listening: "Ακρόαση",
    translating: "Μετάφραση",
    error: "Σφάλμα"
  },
  es: {
    booting: "Iniciando",
    "language-selection": "Seleccion de idioma",
    ready: "Listo",
    listening: "Escuchando",
    translating: "Traduciendo",
    error: "Error"
  },
  pt: {
    booting: "Inicializando",
    "language-selection": "Selecao de idioma",
    ready: "Pronto",
    listening: "Ouvindo",
    translating: "Traduzindo",
    error: "Erro"
  },
  nl: {
    booting: "Starten",
    "language-selection": "Taalkeuze",
    ready: "Gereed",
    listening: "Luistert",
    translating: "Vertaalt",
    error: "Fout"
  },
  pl: {
    booting: "Uruchamianie",
    "language-selection": "Wybor jezyka",
    ready: "Gotowe",
    listening: "Nasluch",
    translating: "Tlumaczenie",
    error: "Blad"
  },
  ro: {
    booting: "Pornire",
    "language-selection": "Selectie limba",
    ready: "Gata",
    listening: "Ascultare",
    translating: "Traducere",
    error: "Eroare"
  },
  ru: {
    booting: "Zapusk",
    "language-selection": "Vybor yazyka",
    ready: "Gotov",
    listening: "Slushaet",
    translating: "Perevodit",
    error: "Oshibka"
  },
  sw: {
    booting: "Inaanza",
    "language-selection": "Uchaguzi wa lugha",
    ready: "Tayari",
    listening: "Inasikiliza",
    translating: "Inatafsiri",
    error: "Hitilafu"
  },
  uk: {
    booting: "Zapusk",
    "language-selection": "Vybir movy",
    ready: "Hotovo",
    listening: "Slukhaye",
    translating: "Perekladaye",
    error: "Pomylka"
  },
  ar: {
    booting: "بدء",
    "language-selection": "اختيار اللغة",
    ready: "جاهز",
    listening: "استماع",
    translating: "ترجمة",
    error: "خطأ"
  },
  zh: {
    booting: "启动中",
    "language-selection": "语言选择",
    ready: "就绪",
    listening: "聆听中",
    translating: "翻译中",
    error: "错误"
  },
  ja: {
    booting: "起動中",
    "language-selection": "言語選択",
    ready: "準備完了",
    listening: "聞き取り中",
    translating: "翻訳中",
    error: "エラー"
  },
  ko: {
    booting: "시작 중",
    "language-selection": "언어 선택",
    ready: "준비됨",
    listening: "듣는 중",
    translating: "번역 중",
    error: "오류"
  },
  tr: {
    booting: "Basliyor",
    "language-selection": "Dil secimi",
    ready: "Hazir",
    listening: "Dinliyor",
    translating: "Ceviriyor",
    error: "Hata"
  },
  he: {
    booting: "מתחיל",
    "language-selection": "בחירת שפה",
    ready: "מוכן",
    listening: "מקשיב",
    translating: "מתרגם",
    error: "שגיאה"
  },
  fa: {
    booting: "در حال شروع",
    "language-selection": "انتخاب زبان",
    ready: "آماده",
    listening: "در حال شنیدن",
    translating: "در حال ترجمه",
    error: "خطا"
  },
  ur: {
    booting: "شروع ہو رہا ہے",
    "language-selection": "زبان کا انتخاب",
    ready: "تیار",
    listening: "سن رہا ہے",
    translating: "ترجمہ کر رہا ہے",
    error: "خرابی"
  },
  ps: {
    booting: "پيلېږي",
    "language-selection": "د ژبې ټاکنه",
    ready: "چمتو",
    listening: "اوري",
    translating: "ژباړي",
    error: "تېروتنه"
  },
  hi: {
    booting: "शुरू हो रहा है",
    "language-selection": "भाषा चयन",
    ready: "तैयार",
    listening: "सुन रहा है",
    translating: "अनुवाद कर रहा है",
    error: "त्रुटि"
  },
  bn: {
    booting: "শুরু হচ্ছে",
    "language-selection": "ভাষা নির্বাচন",
    ready: "প্রস্তুত",
    listening: "শুনছে",
    translating: "অনুবাদ করছে",
    error: "ত্রুটি"
  },
  ta: {
    booting: "தொடங்குகிறது",
    "language-selection": "மொழி தேர்வு",
    ready: "தயார்",
    listening: "கேட்கிறது",
    translating: "மொழிபெயர்க்கிறது",
    error: "பிழை"
  },
  te: {
    booting: "ప్రారంభమవుతోంది",
    "language-selection": "భాష ఎంపిక",
    ready: "సిద్ధం",
    listening: "వింటోంది",
    translating: "అనువదిస్తోంది",
    error: "లోపం"
  },
  th: {
    booting: "กําลังเริ่ม",
    "language-selection": "เลือกภาษา",
    ready: "พร้อม",
    listening: "กําลังฟัง",
    translating: "กําลังแปล",
    error: "ข้อผิดพลาด"
  },
  vi: {
    booting: "Dang khoi dong",
    "language-selection": "Chon ngon ngu",
    ready: "San sang",
    listening: "Dang nghe",
    translating: "Dang dich",
    error: "Loi"
  },
  ms: {
    booting: "Memulakan",
    "language-selection": "Pilihan bahasa",
    ready: "Sedia",
    listening: "Mendengar",
    translating: "Menterjemah",
    error: "Ralat"
  },
  id: {
    booting: "Memulai",
    "language-selection": "Pemilihan bahasa",
    ready: "Siap",
    listening: "Mendengarkan",
    translating: "Menerjemahkan",
    error: "Kesalahan"
  },
  ...EXTENDED_VISITOR_STATUS_LABELS
};

function normalizeLanguageKey(languageCode: string | null | undefined): string {
  return resolveVisitorLocalizationState(languageCode).effectiveLanguageKey;
}

export function getVisitorLocalizationLanguageKeys(): string[] {
  return [...VISITOR_LOCALIZATION_LANGUAGE_KEYS];
}

export function isVisitorLocalizationReady(languageCode: string | null | undefined): boolean {
  return hasVisitorLocalization(languageCode);
}

export function getVisitorRequestedLanguageKey(languageCode: string | null | undefined): string {
  return resolveVisitorLocalizationState(languageCode).requestedLanguageKey;
}

export function getVisitorEffectiveLanguageKey(languageCode: string | null | undefined): string {
  return resolveVisitorLocalizationState(languageCode).effectiveLanguageKey;
}

export function usesVisitorEnglishFallback(languageCode: string | null | undefined): boolean {
  return resolveVisitorLocalizationState(languageCode).usesEnglishFallback;
}

export function resolveInteractionLanguageSourceLocale(languageCode: string | null | undefined): string | null {
  return resolveRegistryInteractionLanguageSourceLocale(languageCode);
}

export function buildVisitorLanguageChoices(): VisitorLanguageChoice[] {
  return buildRegistryInteractionLanguageChoices().map(({ value, label, nativeLabel, regionCode }) => ({
    value,
    label,
    nativeLabel,
    regionCode
  }));
}

export function getVisitorUiText(languageCode: string | null | undefined): VisitorUiText {
  return VISITOR_UI_TEXT[normalizeLanguageKey(languageCode)] ?? VISITOR_UI_TEXT.en;
}

export function getVisitorStatusLabels(
  languageCode: string | null | undefined
): Record<OperatorStatus, string> {
  return VISITOR_STATUS_LABELS[normalizeLanguageKey(languageCode)] ?? VISITOR_STATUS_LABELS.en;
}

export function getVisitorCurrentLanguageLabel(languageCode: string | null | undefined): string {
  if (!languageCode || !findTargetLanguageOption(languageCode)) {
    return "-";
  }

  return getInteractionLanguageCurrentLabel(languageCode);
}

function normalizeLanguageDisplayCode(languageCode: string): string {
  const normalized = languageCode.trim();
  const lower = normalized.toLowerCase();

  if (lower === "en-us") {
    return "en-US";
  }

  if (lower === "pt-pt") {
    return "pt-PT";
  }

  if (lower === "fr-ca") {
    return "fr-CA";
  }

  if (lower === "zh-hans") {
    return "zh-Hans";
  }

  if (lower === "zh-hant") {
    return "zh-Hant";
  }

  return normalized;
}

export function getVisitorLocalizedLanguageLabel(
  languageCode: string | null | undefined,
  viewerLanguageCode: string | null | undefined
): string {
  if (!languageCode) {
    return "-";
  }

  const viewerLocale = normalizeLanguageKey(viewerLanguageCode);
  const displayCode = normalizeLanguageDisplayCode(languageCode);

  try {
    const displayNames = new Intl.DisplayNames([viewerLocale], { type: "language" });
    const localized = displayNames.of(displayCode);
    if (localized) {
      return localized;
    }
  } catch {
    // Ignore Intl display-name failures and continue to deterministic fallbacks.
  }

  const detectedSourceLanguage = resolveDetectedSourceLanguageOption(languageCode);
  if (detectedSourceLanguage) {
    return getInteractionLanguageCurrentLabel(detectedSourceLanguage.value);
  }

  return getInteractionLanguageCurrentLabel(languageCode);
}
