/**
 * The summary engine.
 *
 * Implements §8 (output logic) and §9 (engine rules) of the specification.
 * It is deterministic and rule-based: every line it emits is either a factual
 * restatement of what the user rated, or the user's own words reproduced
 * unchanged. Nothing is inferred, scored or recommended.
 *
 * Pure module — no DOM, no network, no storage. Imported by the page and by
 * tests/engine.test.mjs alike.
 */

import {
  DIMENSIONS, ENVIRONMENTS, CONTRAST_PAIRS,
  REPORT_SECTIONS, REPORT_TITLE, INSUFFICIENT, FORBIDDEN_PHRASES
} from './content.js';
import { splitStatements } from './text.js';

/* ------------------------------------------------------------------ bullets */

/** A line the engine wrote. Subject to the §9 phrasing rules. */
function derived(text) {
  return { kind: 'derived', text: String(text) };
}

/**
 * A line the user wrote, reproduced exactly. `prefix` names the field it came
 * from and is engine-written, so only the prefix is checked against §9.
 */
function verbatim(text, prefix) {
  return { kind: 'verbatim', prefix: prefix || '', text: String(text) };
}

/** The part of a bullet the engine is responsible for. */
function enginePart(bullet) {
  return bullet.kind === 'derived' ? bullet.text : bullet.prefix;
}

/** §9 — returns the forbidden phrases present in engine-written text. */
export function violations(text) {
  const haystack = String(text || '');
  return FORBIDDEN_PHRASES.filter((phrase) => haystack.includes(phrase));
}

/**
 * Drops any engine-written line that would break §9. The rule set is designed
 * so this never fires; it is a guard rail, not a formatter.
 */
function enforce(bullets) {
  return bullets.filter((bullet) => {
    const bad = violations(enginePart(bullet));
    if (bad.length && typeof console !== 'undefined') {
      console.error('[engine] §9 violation suppressed:', bad, enginePart(bullet));
    }
    return bad.length === 0;
  });
}

/* -------------------------------------------------------------- user's text */

function textOf(state, id) {
  return String((state.open && state.open[id]) || '').trim();
}

/** Appends one bullet per statement found in a free-text field. */
function pushText(bullets, state, id, prefix) {
  splitStatements(textOf(state, id)).forEach((line) => bullets.push(verbatim(line, prefix)));
}

/* ----------------------------------------------------------------- ratings */

function rowsFor(dimension, state) {
  return dimension.items.map((item) => ({
    id: item.id,
    label: item.label,
    value: Number.isInteger(state.ratings && state.ratings[item.id]) ? state.ratings[item.id] : null
  }));
}

function statsFor(rows) {
  const scored = rows.filter((row) => row.value !== null);
  const values = scored.map((row) => row.value);
  return {
    scored,
    unrated: rows.length - scored.length,
    total: rows.length,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null
  };
}

const quote = (label) => `«${label}»`;
const joinLabels = (rows) => rows.map((row) => quote(row.label)).join(', ');

/* --------------------------------------------- §8 a/b — dimension insights */

/**
 * §9 rule 4 — where a rating and a free-text answer pull in opposite
 * directions, the tension is stated and deliberately left unresolved.
 */
const TENSIONS = {
  team: [
    {
      when: (s, state) => s.min !== null && s.min >= 4 && textOf(state, 'teamDifficulty'),
      text: 'הדירוגים בממד עומדים על 4 ומעלה, ולצידם תואר בטקסט הפתוח קושי, חשש או חוסר מסוגלות. שתי התשובות מוצגות כפי שנמסרו.'
    },
    {
      when: (s, state) => s.max !== null && s.max <= 2 && textOf(state, 'teamOpenness'),
      text: 'הדירוגים בממד עומדים על 2 ומטה, ולצידם תוארה בטקסט הפתוח פתיחות או סקרנות. שתי התשובות מוצגות כפי שנמסרו.'
    }
  ],
  manager: [
    {
      when: (s, state) => s.min !== null && s.min >= 4 && textOf(state, 'mgrObstacles'),
      text: 'הדירוגים בממד עומדים על 4 ומעלה, ולצידם תואר בטקסט הפתוח קושי לקדם את התחום. שתי התשובות מוצגות כפי שנמסרו.'
    },
    {
      when: (s, state) => s.max !== null && s.max <= 2 && textOf(state, 'mgrEnablers'),
      text: 'הדירוגים בממד עומדים על 2 ומטה, ולצידם תוארו בטקסט הפתוח פעולות שכבר מתקיימות. שתי התשובות מוצגות כפי שנמסרו.'
    }
  ]
};

function dimensionSection(dimension, state) {
  const rows = rowsFor(dimension, state);
  const stats = statsFor(rows);
  const openAnswered = dimension.open.filter((field) => textOf(state, field.id));

  if (!stats.scored.length && !openAnswered.length) return [derived(INSUFFICIENT)];

  const bullets = [];

  // 1 — the shape of the ratings.
  if (!stats.scored.length) {
    bullets.push(derived('לא ניתן דירוג לאף אחד מהיגדי הממד.'));
  } else if (stats.min === stats.max) {
    bullets.push(derived(`כל ההיגדים שדורגו בממד קיבלו ${stats.min}.`));
  } else {
    const high = stats.scored.filter((row) => row.value >= 4).length;
    const low = stats.scored.filter((row) => row.value <= 2).length;
    let line = `טווח הדירוגים בממד: ${stats.min} עד ${stats.max}.`;
    if (high) line += ` ${high} מתוך ${stats.scored.length} ההיגדים שדורגו קיבלו 4 ומעלה.`;
    if (low) line += ` ${low} קיבלו 2 ומטה.`;
    bullets.push(derived(line));
  }

  // 2 — a relative gap inside the user's own answers (§9, rule 6).
  const byId = Object.fromEntries(stats.scored.map((row) => [row.id, row]));
  const gaps = (CONTRAST_PAIRS[dimension.id] || [])
    .map(([left, right]) => [byId[left], byId[right]])
    .filter(([left, right]) => left && right && Math.abs(left.value - right.value) >= 2)
    .sort((a, b) => Math.abs(b[0].value - b[1].value) - Math.abs(a[0].value - a[1].value));

  if (gaps.length) {
    const [left, right] = gaps[0];
    const [hi, lo] = left.value >= right.value ? [left, right] : [right, left];
    bullets.push(derived(`פער בתוך הממד: ${quote(hi.label)} (${hi.value}) לעומת ${quote(lo.label)} (${lo.value}).`));
  } else if (stats.scored.length > 1 && stats.min !== stats.max) {
    const tops = stats.scored.filter((row) => row.value === stats.max);
    const bottoms = stats.scored.filter((row) => row.value === stats.min);
    bullets.push(derived(
      `הדירוג הגבוה ביותר בממד: ${joinLabels(tops)} (${stats.max}). הנמוך ביותר: ${joinLabels(bottoms)} (${stats.min}).`
    ));
  }

  // 3 — a tension held open, or the coverage of the ratings.
  const tension = (TENSIONS[dimension.id] || []).find((rule) => rule.when(stats, state));
  if (tension) {
    bullets.push(derived(tension.text));
  } else if (stats.unrated) {
    bullets.push(derived(`${stats.unrated} מתוך ${stats.total} ההיגדים בממד נותרו ללא דירוג.`));
  }

  return bullets.slice(0, 3); // §8 — two to three insights.
}

/* ------------------------------------------- §8 c — the potential identified */

function workSection(state) {
  const bullets = [];
  const environment = ENVIRONMENTS.find((env) => env.id === state.environment);
  if (environment) bullets.push(derived(`סביבת העבודה שסומנה: ${environment.label}.`));

  const framing = bullets.length;
  const work = DIMENSIONS.find((dimension) => dimension.id === 'work');
  const marked = work.items.filter((item) => (state.ratings && state.ratings[item.id]) >= 4);
  if (marked.length) {
    const listed = marked
      .map((item) => `${quote(item.label)} (${state.ratings[item.id]})`)
      .join(', ');
    bullets.push(derived(`סומנו בדירוג 4 ומעלה: ${listed}.`));
  }

  pushText(bullets, state, 'procToday', 'מה קורה היום');
  pushText(bullets, state, 'procChange', 'לשיפור או לשינוי');
  pushText(bullets, state, 'procFit', 'שילוב אפשרי של AI');

  if (bullets.length === framing) bullets.push(derived(INSUFFICIENT));
  return bullets;
}

/* ----------------------------------------------------- §8 d — blockers raised */

function blockersSection(state) {
  const bullets = [];
  pushText(bullets, state, 'teamDifficulty', 'בצוות');
  pushText(bullets, state, 'mgrObstacles', 'בניהול');
  pushText(bullets, state, 'procBlockers', 'בתהליך');
  if (!bullets.length) bullets.push(derived(INSUFFICIENT));
  return bullets;
}

/* ------------------------------------------------------ §8 e — existing assets */

const ASSET_LIST_CAP = 6;

function assetsSection(state) {
  const bullets = [];

  const rated = ['team', 'manager']
    .flatMap((id) => DIMENSIONS.find((dimension) => dimension.id === id).items)
    .map((item) => ({ label: item.label, value: state.ratings && state.ratings[item.id] }))
    .filter((row) => row.value >= 4)
    .sort((a, b) => b.value - a.value);

  if (rated.length) {
    const shown = rated.slice(0, ASSET_LIST_CAP);
    const listed = shown.map((row) => `${quote(row.label)} (${row.value})`).join(', ');
    const rest = rated.length - shown.length;
    bullets.push(derived(
      `סומנו בדירוג 4 ומעלה: ${listed}${rest ? `, ועוד ${rest} היגדים בדירוג 4 ומעלה` : ''}.`
    ));
  }

  pushText(bullets, state, 'teamOpenness', 'פתיחות או סקרנות בצוות');
  pushText(bullets, state, 'teamHelpers', 'מי יכול לסייע לאחרים');
  pushText(bullets, state, 'mgrEnablers', 'מה כבר נעשה בניהול');

  if (!bullets.length) bullets.push(derived(INSUFFICIENT));
  return bullets;
}

/* --------------------------------------------- §8 f — questions for further thought */

const rating = (state, id) => (state.ratings && Number.isInteger(state.ratings[id]) ? state.ratings[id] : null);

function gapBetween(state, left, right) {
  const a = rating(state, left);
  const b = rating(state, right);
  return a === null || b === null ? null : a - b;
}

/**
 * Candidate questions, in priority order. Each is a genuinely open question:
 * none contains a proposed course of action (§8 f).
 */
const QUESTION_RULES = [
  {
    when: (state, ctx) => ctx.tensions.length > 0,
    text: 'כיצד מתיישבים הדירוגים שניתנו עם מה שתואר בתשובות הפתוחות?'
  },
  {
    when: (state) => gapBetween(state, 'a3', 'a5') >= 2,
    text: 'מה מבחין בין הנכונות להתנסות לבין המסוגלות לעבוד עם הכלים באופן עצמאי?'
  },
  {
    when: (state) => gapBetween(state, 'a3', 'a4') >= 2,
    text: 'מה קורה כיום בין הנכונות להתנסות לבין התנסות שמתקיימת בפועל?'
  },
  {
    when: (state) => gapBetween(state, 'b2', 'b6') >= 2,
    text: 'מה ההבדל בין העידוד להתנסות לבין הזמן שעומד לרשות הצוות בפועל?'
  },
  {
    when: (state) => rating(state, 'a7') !== null && rating(state, 'a7') <= 2,
    text: 'על מה נשענת כיום העברת ידע בין אנשי הצוות בנושא הזה?'
  },
  {
    when: (state) => rating(state, 'b6') !== null && rating(state, 'b6') <= 2,
    text: 'כיצד מתחלק כיום זמן הצוות בין העבודה השוטפת לבין למידה והתנסות?'
  },
  {
    when: (state) => rating(state, 'c4') !== null && rating(state, 'c4') <= 2 && rating(state, 'c2') >= 3,
    text: 'מה מבחין, בעבודה שלכם, בין ייעול של תהליך קיים לבין שינוי בדרך העבודה עצמה?'
  },
  {
    when: (state) => rating(state, 'b1') !== null && rating(state, 'b1') <= 2,
    text: 'מה ידוע כיום על יכולות ה-AI הרלוונטיות לעבודה של היחידה?'
  },
  {
    when: (state, ctx) => ctx.hasPotential && !ctx.hasBlockers,
    text: 'מה עדיין לא ידוע לגבי מה שעשוי לעכב התנסות בתהליך שתואר?'
  },
  {
    when: (state, ctx) => ctx.hasBlockers && !ctx.hasPotential,
    text: 'אילו תהליכים טרם נבחנו מול החסמים שתוארו?'
  }
];

function questionsSection(state, ctx) {
  const bullets = QUESTION_RULES
    .filter((rule) => rule.when(state, ctx))
    .slice(0, 3)
    .map((rule) => derived(rule.text));

  // Grounded fallbacks, so a sparse answer set still produces real questions.
  if (bullets.length < 2) {
    const scored = DIMENSIONS
      .flatMap((dimension) => dimension.items)
      .map((item) => ({ label: item.label, value: rating(state, item.id) }))
      .filter((row) => row.value !== null)
      .sort((a, b) => a.value - b.value);

    if (scored.length) {
      const lowest = scored[0];
      const highest = scored[scored.length - 1];
      const extras = [
        `מה עומד מאחורי הדירוג שניתן ל${quote(lowest.label)}?`,
        highest.label !== lowest.label ? `מה עומד מאחורי הדירוג שניתן ל${quote(highest.label)}?` : null
      ].filter(Boolean);

      extras.forEach((text) => {
        if (bullets.length < 3 && !bullets.some((bullet) => bullet.text === text)) bullets.push(derived(text));
      });
    }
  }

  if (!bullets.length) bullets.push(derived(INSUFFICIENT));
  return bullets;
}

/* --------------------------------------------------------------- the report */

/**
 * Builds the distilled picture from the user's answers.
 * @param {{ratings: Object<string, number>, open: Object<string, string>, environment: string|null}} state
 */
export function distill(state) {
  const safe = {
    ratings: (state && state.ratings) || {},
    open: (state && state.open) || {},
    environment: (state && state.environment) || null
  };

  const tensions = Object.entries(TENSIONS).filter(([id, rules]) => {
    const dimension = DIMENSIONS.find((d) => d.id === id);
    const stats = statsFor(rowsFor(dimension, safe));
    return rules.some((rule) => rule.when(stats, safe));
  });

  const work = workSection(safe);
  const blockers = blockersSection(safe);
  const assets = assetsSection(safe);

  const isEmpty = (bullets) => bullets.every((b) => b.kind === 'derived' && b.text === INSUFFICIENT);

  const ctx = {
    tensions,
    hasPotential: !isEmpty(work),
    hasBlockers: !isEmpty(blockers)
  };

  const byId = {
    team: dimensionSection(DIMENSIONS.find((d) => d.id === 'team'), safe),
    manager: dimensionSection(DIMENSIONS.find((d) => d.id === 'manager'), safe),
    work,
    blockers,
    assets,
    questions: questionsSection(safe, ctx)
  };

  return {
    title: REPORT_TITLE,
    sections: REPORT_SECTIONS.map((section) => ({
      id: section.id,
      heading: section.heading,
      bullets: enforce(byId[section.id])
    }))
  };
}

/** §10 — the plain-text block the user copies into Copilot. */
export function toPlainText(report) {
  const lines = [report.title, ''];
  report.sections.forEach((section) => {
    lines.push(section.heading);
    section.bullets.forEach((bullet) => {
      lines.push(`• ${bullet.kind === 'verbatim' && bullet.prefix ? `${bullet.prefix}: ` : ''}${bullet.text}`);
    });
    lines.push('');
  });
  return lines.join('\n').trim() + '\n';
}
