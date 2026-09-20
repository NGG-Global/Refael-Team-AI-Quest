/**
 * Questionnaire content.
 *
 * Every string here is taken from the specification document
 * "אפיון למפתח | כלי מיפוי מוכנות להטמעת AI – רפאל".
 * `label` fields are short descriptive names for the same statements, used in
 * charts and in the distilled output; they name what a statement measures and
 * add no judgement to it.
 */

/** §3 — the rating scale. */
export const SCALE = [
  { value: 1, label: 'כלל לא' },
  { value: 2, label: 'במידה מועטה' },
  { value: 3, label: 'במידה בינונית' },
  { value: 4, label: 'במידה רבה' },
  { value: 5, label: 'במידה רבה מאוד' }
];

/** §1, §3, §9 — the guardrails the user is told about before starting. */
export const PRINCIPLES = [
  'כלי מיפוי בלבד. אינו ממליץ ואינו בונה תוכנית עבודה.',
  'דירוג נמוך אינו כישלון. הוא מתאר נקודת פתיחה.',
  'אין ציון כולל. שלושת הממדים נשמרים בנפרד.',
  'ניסוח בלמ״ס: בלי שמות פרויקטים, מערכות, מוצרים, לקוחות או מידע טכני רגיש.'
];

/** §4–§6 — the three mapping dimensions. */
export const DIMENSIONS = [
  {
    id: 'team',
    ordinal: 'ממד א׳',
    name: 'הצוות שלי',
    title: 'הצוות שלי',
    lead: 'נקודת הפתיחה לעבודה עם AI',
    items: [
      { id: 'a1', label: 'היכרות עם הכלים הזמינים', text: 'אנשי הצוות מכירים את כלי ה-AI הזמינים להם ואת האפשרויות הבסיסיות לשימוש בהם.' },
      { id: 'a2', label: 'זיהוי משימות שבהן AI יכול לסייע', text: 'אנשי הצוות מזהים משימות בעבודה שלהם שבהן AI יכול לסייע.' },
      { id: 'a3', label: 'נכונות להתנסות בדרכי עבודה חדשות', text: 'קיימת בצוות נכונות להתנסות בדרכי עבודה חדשות עם AI.' },
      { id: 'a4', label: 'התנסות שכבר מתקיימת בפועל', text: 'יש אנשי צוות שכבר מתנסים ב-AI במשימות מהעבודה, גם אם באופן נקודתי.' },
      { id: 'a5', label: 'מסוגלות לעבוד עם הכלים באופן עצמאי', text: 'קיימת בצוות מסוגלות בסיסית לעבוד עם כלי AI באופן עצמאי.' },
      { id: 'a6', label: 'נכונות לנסות שוב אחרי שלא הצליח', text: 'כששימוש ב-AI לא מצליח מיד, קיימת נכונות לנסות שוב, לדייק וללמוד.' },
      { id: 'a7', label: 'אנשים שיכולים לסייע לאחרים', text: 'יש בצוות אנשים שיכולים לשמש מוקד ידע ולסייע לאחרים להתחיל להתנסות.' }
    ],
    open: [
      { id: 'teamOpenness', label: 'איפה את/ה מזהה בצוות פתיחות או סקרנות כלפי AI?' },
      { id: 'teamDifficulty', label: 'איפה את/ה מזהה קושי, חשש או חוסר מסוגלות?' },
      { id: 'teamHelpers', label: 'מי בצוות יכול לסייע לאחרים לעשות את הצעדים הראשונים?', note: 'אין צורך לציין שם; ניתן לתאר תפקיד או פרופיל כללי.' }
    ]
  },
  {
    id: 'manager',
    ordinal: 'ממד ב׳',
    name: 'אני כמנהל/ת',
    title: 'אני כמנהל/ת',
    lead: 'עד כמה אני מייצר/ת תנאים להתקדמות?',
    items: [
      { id: 'b1', label: 'היכרות עם יכולות AI', text: 'אני מכיר/ה מספיק את יכולות ה-AI כדי לזהות היכן הן יכולות להיות רלוונטיות לעבודה שלנו.' },
      { id: 'b2', label: 'עידוד הצוות להתנסות', text: 'אני מעודד/ת את הצוות להתנסות ולבחון שימושים אפשריים ב-AI.' },
      { id: 'b3', label: 'לגיטימציה ללמידה ולניסוי וטעייה', text: 'אני מייצר/ת לגיטימציה ללמידה, ניסוי וטעייה גם כשלא מתקבל ערך מיידי.' },
      { id: 'b4', label: 'סיוע בבחירת משימות ממוקדות', text: 'אני מסייע/ת לצוות לבחור משימות ממוקדות שבהן כדאי להתחיל להתנסות.' },
      { id: 'b5', label: 'זיהוי מי זקוק להכוונה ומי יכול לסייע', text: 'אני יודע/ת לזהות מי זקוק ליותר הכוונה ומי יכול לסייע לאחרים.' },
      { id: 'b6', label: 'יצירת זמן ומרחב להתנסות', text: 'אני מייצר/ת, ככל שניתן, זמן ומרחב להתנסות ולמידה בתוך עומס העבודה.' },
      { id: 'b7', label: 'חיבור בין התנסות לבין צורך או ערך', text: 'אני מחבר/ת בין התנסות ב-AI לבין צורך אמיתי או ערך שאנחנו רוצים לייצר.' }
    ],
    open: [
      { id: 'mgrEnablers', label: 'מה אני כבר עושה היום שמאפשר לצוות להתחיל להתקדם?' },
      { id: 'mgrObstacles', label: 'מה כרגע מקשה עליי כמנהל/ת לקדם את התחום?' }
    ]
  },
  {
    id: 'work',
    ordinal: 'ממד ג׳',
    name: 'העבודה שלנו',
    title: 'העבודה שלנו',
    lead: 'איפה נמצא הפוטנציאל?',
    items: [
      { id: 'c1', label: 'תמונה ברורה של מה שגוזל זמן ומשאבים', text: 'יש לנו תמונה ברורה של המשימות והתהליכים שגוזלים מאיתנו זמן ומשאבים.' },
      { id: 'c2', label: 'זיהוי פעולות חזרתיות, ידניות או עתירות מידע', text: 'אנחנו יודעים לזהות פעולות חזרתיות, ידניות או עתירות מידע שכדאי לבחון מחדש.' },
      { id: 'c3', label: 'זיהוי מקומות שבהם AI יכול לשפר', text: 'אנחנו מזהים מקומות שבהם AI יכול לשפר מהירות, איכות, דיוק או קבלת החלטות.' },
      { id: 'c4', label: 'זיהוי תהליכים לחשיבה מחדש', text: 'אנחנו מסוגלים לזהות תהליכים שבהם לא רק ניתן לייעל את הקיים, אלא לחשוב אחרת על דרך העבודה.' },
      { id: 'c5', label: 'כיוונים להתנסות ראשונית', text: 'יש לנו לפחות מספר כיוונים שבהם כדאי לבחון התנסות ראשונית.' }
    ],
    open: []
  }
];

/** §7 — the branching question and its three environment-specific framings. */
export const ENVIRONMENTS = [
  {
    id: 'production',
    label: 'ייצור',
    prompt: 'חשוב/י על תהליך שבו קיימים עבודה ידנית, חזרתיות, איסוף או עיבוד מידע, בקרה, תכנון או קבלת החלטות. מה בתהליך הזה היית רוצה לבחון מחדש בעזרת AI?'
  },
  {
    id: 'development',
    label: 'פיתוח',
    prompt: 'חשוב/י על תהליך שבו מושקע זמן רב בחיפוש, עיבוד מידע, ניתוח, תיעוד, יצירת חלופות או פתרון בעיות. מה בתהליך הזה היית רוצה לבחון מחדש בעזרת AI?'
  },
  {
    id: 'hq',
    label: 'מטה/אחר',
    prompt: 'חשוב/י על תהליך עבודה משמעותי שבו יש עומס, חזרתיות, עיבוד מידע, תיאום או קבלת החלטות. מה בתהליך הזה היית רוצה לבחון מחדש בעזרת AI?'
  }
];

export const ENVIRONMENT_QUESTION = 'מה מאפיין יותר את סביבת העבודה שלך?';

/** §7 — the four fields shown to every user, whichever environment was chosen. */
export const PROCESS_FIELDS = [
  { id: 'procToday', label: 'מה קורה היום?' },
  { id: 'procChange', label: 'מה היית רוצה לשפר או לשנות?' },
  { id: 'procFit', label: 'איפה לדעתך AI עשוי להשתלב?' },
  { id: 'procBlockers', label: 'מה עלול לעכב את זה?' }
];

/** §10 — the output block headings, in the order the export must carry them. */
export const REPORT_TITLE = 'תמונת מצב – מיפוי מוכנות לשילוב AI';
export const REPORT_SECTIONS = [
  { id: 'team', heading: 'הצוות | נקודת הפתיחה' },
  { id: 'manager', heading: 'הניהול | נקודת הפתיחה' },
  { id: 'work', heading: 'העבודה | פוטנציאל שזוהה' },
  { id: 'blockers', heading: 'חסמים שעלו' },
  { id: 'assets', heading: 'נכסים קיימים' },
  { id: 'questions', heading: 'שאלות להמשך החשיבה' }
];

/** §9 — the exact sentence to use where the answers do not support an insight. */
export const INSUFFICIENT = 'לא עלה מספיק מידע כדי לזקק תובנה בנושא זה';

/**
 * §9 — phrasings the summary engine must never produce.
 * Checked against engine-generated text only, never against what the user wrote.
 */
export const FORBIDDEN_PHRASES = [
  'כדאי', 'מומלץ', 'ממליץ', 'ממליצים', 'המלצה', 'המלצות',
  'עליך', 'עלייך', 'עליכם', 'הצעד הבא', 'יש להתחיל', 'רצוי',
  'צריך ל', 'חשוב ל', 'אפשר להתחיל'
];

/**
 * Statement pairs worth contrasting inside a dimension (§9, rule 6 — relative
 * gaps within the user's own answers). Unordered: the engine reports whichever
 * side came out higher.
 */
export const CONTRAST_PAIRS = {
  team: [['a3', 'a5'], ['a3', 'a4'], ['a2', 'a1'], ['a6', 'a5'], ['a7', 'a4']],
  manager: [['b2', 'b6'], ['b2', 'b4'], ['b3', 'b7'], ['b1', 'b4']],
  work: [['c2', 'c4'], ['c3', 'c5'], ['c1', 'c2']]
};

/** Flat lookup: statement id -> { item, dimension }. */
export const ITEM_INDEX = Object.freeze(
  DIMENSIONS.reduce((acc, dim) => {
    dim.items.forEach((item) => { acc[item.id] = { item, dimension: dim }; });
    return acc;
  }, {})
);

export const ALL_ITEM_IDS = DIMENSIONS.flatMap((d) => d.items.map((i) => i.id));
export const ALL_OPEN_IDS = [
  ...DIMENSIONS.flatMap((d) => d.open.map((o) => o.id)),
  ...PROCESS_FIELDS.map((f) => f.id)
];
