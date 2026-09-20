/**
 * Version B content — שאלון לפעילות עבור סדנת מנהלים ברפאל.
 *
 * Every string is taken from the source document. Where it gives a single
 * "לדוגמה" line the text becomes a `note`; where it gives a list of
 * "דוגמאות למענה" the items become `examples`, shown on request.
 */

export const DURATION = 'כ־7 דקות';

/** חלק 1, שאלה 1 — up to two domains. */
export const DOMAIN_LIMIT = 2;
export const DOMAIN_QUESTION = 'באילו תחומים תרצו לקדם שימוש ב־AI?';
export const DOMAINS = [
  { id: 'planning', label: 'תכנון וניהול משימות או פרויקטים' },
  { id: 'information', label: 'איסוף, עיבוד וסיכום מידע' },
  { id: 'documents', label: 'כתיבה והפקת מסמכים' },
  { id: 'analysis', label: 'ניתוח נתונים ותמיכה בקבלת החלטות' },
  { id: 'knowledge', label: 'ניהול ידע ולמידה' }
];

/** חלק 1, שאלה 2 — the division of labour and the value it should create. */
export const CHANGE_FIELDS = [
  {
    id: 'aiDoes',
    label: 'מה תרצו שה־AI יבצע?',
    note: 'לדוגמה: לארגן מידע, להכין טיוטה, לסכם מסמך, להציע חלופות או לסייע בתכנון.',
    rows: 3
  },
  {
    id: 'humanKeeps',
    label: 'מה חשוב שיישאר באחריות האדם?',
    note: 'לדוגמה: קבלת החלטה, בדיקת אמינות, הפעלת שיקול דעת, אישור התוצר או תקשורת עם אנשים.',
    rows: 3
  },
  {
    id: 'value',
    label: 'איזה ערך השינוי אמור לייצר?',
    note: 'לדוגמה: חיסכון בזמן, שיפור איכות, הפחתת טעויות, נגישות טובה יותר למידע או קבלת החלטות מהירה יותר.',
    rows: 3
  }
];

/** חלק 2 — the two groups in the team. */
export const TEAM_GROUPS = [
  {
    id: 'ambassadors',
    label: 'שגרירים',
    note: 'חברי הצוות שמגלים יכולת, סקרנות ונכונות להתנסות ב־AI ויכולים לסייע לאחרים.',
    hint: 'דוגמאות לזיהוי: עובדים שכבר מתנסים בכלים, משתפים אחרים, שואלים שאלות או מציעים שימושים חדשים.'
  },
  {
    id: 'resisters',
    label: 'מתנגדים',
    note: 'חברי הצוות שנמנעים משימוש ב־AI, מביעים התנגדות או זקוקים לליווי משמעותי יותר.',
    hint: 'דוגמאות לזיהוי: עובדים שחוששים מטעויות, אינם רואים את הערך, נמנעים מהתנסות או מודאגים מהשפעת ה־AI על תפקידם.'
  }
];

/** חלק 3 — turning the map into steps. */
export const ACTION_FIELDS = [
  {
    id: 'processAction',
    section: 'פעולה בתהליך העבודה',
    label: 'מהו השינוי הראשון שתבצעו בתהליך או בפרויקט שבחרתם?',
    examples: [
      'נבחר משימה אחת ונפעיל עליה פיילוט.',
      'נשתמש ב־AI להכנת טיוטה ראשונית למסמך קבוע.',
      'נבדוק כיצד AI יכול לסייע בתכנון שבועי.',
      'נגדיר נקודה אחת בתהליך שבה נשלב את הכלי.'
    ]
  },
  {
    id: 'ambassadorAction',
    section: 'פעולה עם השגרירים',
    label: 'כיצד תיעזרו בשגרירים כדי להוביל את ההטמעה בצוות?',
    examples: [
      'נבקש מהם להדגים שימוש שעבד עבורם.',
      'נחבר כל שגריר לעובד שזקוק לליווי.',
      'ניתן להם להוביל התנסות קצרה בישיבת צוות.',
      'נבקש מהם לאסוף דוגמאות וטיפים לשימוש.'
    ]
  },
  {
    id: 'resisterAction',
    section: 'פעולה עם המתנגדים',
    label: 'מה תעשו כדי להבין את ההתנגדות ולאפשר צעד ראשון בטוח?',
    examples: [
      'נקיים שיחה קצרה להבנת החששות.',
      'נבחר עבורם משימה פשוטה ולא מאיימת להתנסות.',
      'נבהיר מה נשאר באחריות האדם.',
      'נצמיד אותם לשגריר להתנסות משותפת.'
    ]
  },
  {
    id: 'routine',
    section: 'שגרת ניהול',
    label: 'איזו שגרת ניהול תכניסו לצוות כדי לתמוך בהטמעה לאורך זמן?',
    examples: [
      'חמש דקות לשיתוף בתוצרי AI בכל ישיבת צוות.',
      'זמן קבוע אחת לשבועיים להתנסות.',
      'בדיקה אנושית קבועה לפני שימוש בתוצר.',
      'מעקב חודשי אחר הצלחות, קשיים ולקחים.'
    ]
  }
];

/** חלק 3, שאלה 5 — the commitment, a sentence with two blanks. */
export const COMMITMENT = {
  section: 'התחייבות לפעולה',
  lead: 'השלימו את המשפט:',
  before: 'בתוך החודש הקרוב, הפעולה הראשונה שאבצע היא',
  middle: ', ואדע שהצלחנו כאשר',
  after: '.',
  fields: [
    { id: 'firstAction', label: 'הפעולה הראשונה' },
    { id: 'successSign', label: 'מדד ההצלחה' }
  ],
  example: 'בתוך החודש הקרוב נפעיל פיילוט על הכנת סיכום שבועי, ואדע שהצלחנו כאשר הצוות יחסוך זמן והתוצר יאושר לאחר בדיקה אנושית.'
};

/** The three parts, as steps. */
export const PARTS = [
  { id: 'change', ordinal: 'חלק 1', title: 'הגדרת השינוי', lead: 'להגדיר את תחום השינוי, חלוקת העבודה הרצויה בין האדם ל־AI והתוצאה שאליה רוצים להגיע.' },
  { id: 'team', ordinal: 'חלק 2', title: 'מיפוי הצוות', lead: 'לזהות מי בצוות יכול להוביל את השינוי ומי זקוק לליווי.' },
  { id: 'actions', ordinal: 'חלק 3', title: 'כיווני פעולה', lead: 'להפוך את המיפוי לצעדים מעשיים בתוכנית העבודה.' }
];

/** הפלט הסופי — the nine blocks, in the order the document lists them. */
export const REPORT_TITLE = 'תוכנית פעולה לשילוב AI בצוות';
export const REPORT_SECTIONS = [
  { id: 'domain', heading: 'תחום השינוי' },
  { id: 'split', heading: 'חלוקת העבודה בין האדם ל־AI' },
  { id: 'target', heading: 'תמונת המצב הרצויה' },
  { id: 'people', heading: 'השגרירים והמתנגדים בצוות' },
  { id: 'processAction', heading: 'פעולה בתהליך' },
  { id: 'ambassadorAction', heading: 'פעולה עם השגרירים' },
  { id: 'resisterAction', heading: 'פעולה עם המתנגדים' },
  { id: 'routine', heading: 'שגרת הניהול' },
  { id: 'commitment', heading: 'התחייבות לביצוע ומדד הצלחה' }
];

export const UNFILLED = 'לא נמלא';

export const ALL_TEXT_IDS = [
  ...CHANGE_FIELDS.map((f) => f.id),
  ...ACTION_FIELDS.map((f) => f.id),
  ...COMMITMENT.fields.map((f) => f.id)
];
