/**
 * Rules the summary engine must hold to (§8, §9 of the specification).
 * Run with:  node --test tests/engine.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { distill, toPlainText, violations, splitStatements } from '../assets/js/engine.js';
import {
  DIMENSIONS, ALL_ITEM_IDS, ALL_OPEN_IDS, ENVIRONMENTS,
  INSUFFICIENT, REPORT_SECTIONS
} from '../assets/js/content.js';

const engineWritten = (report) =>
  report.sections.flatMap((section) =>
    section.bullets.map((bullet) => (bullet.kind === 'derived' ? bullet.text : bullet.prefix))
  );

const filled = {
  environment: 'production',
  ratings: {
    a1: 2, a2: 3, a3: 5, a4: 2, a5: 2, a6: 4, a7: 2,
    b1: 3, b2: 5, b3: 4, b4: 2, b5: 3, b6: 1, b7: 4,
    c1: 4, c2: 4, c3: 3, c4: 2, c5: 4
  },
  open: {
    teamOpenness: 'יש שניים שמנסים לבד בבית. אחד מהם מביא רעיונות לישיבת צוות.',
    teamDifficulty: 'החשש המרכזי הוא שהפלט לא מדויק ואין דרך לבדוק אותו.',
    teamHelpers: 'ראש הצוות הצעיר, ועוד מהנדס אחד שמגיע מרקע תוכנה.',
    mgrEnablers: 'פתחתי חצי שעה קבועה בישיבת הצוות לנושא.',
    mgrObstacles: 'אין לי זמן ללמוד את זה לעומק. לוח הזמנים של הפרויקטים לא מאפשר.',
    procToday: 'איסוף נתונים ידני מכמה מקורות, ואז בניית דוח שבועי.',
    procChange: 'לקצר את הזמן שלוקח להרכיב את הדוח.',
    procFit: 'בשלב איסוף הנתונים ובניסוח הטיוטה הראשונה.',
    procBlockers: 'אין ודאות לגבי איכות הפלט. צריך מישהו שיבדוק.'
  }
};

test('an empty answer set yields the §9 sentence in every section', () => {
  const report = distill({});
  assert.equal(report.sections.length, REPORT_SECTIONS.length);
  for (const section of report.sections) {
    assert.deepEqual(section.bullets.map((b) => b.text), [INSUFFICIENT]);
  }
});

test('engine-written text never uses a forbidden phrasing (§9)', () => {
  for (const text of engineWritten(distill(filled))) {
    assert.deepEqual(violations(text), [], `forbidden phrasing in: ${text}`);
  }
});

test('fuzzing 600 answer sets produces no forbidden phrasing (§9)', () => {
  let seed = 20260920;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  for (let run = 0; run < 600; run += 1) {
    const state = { ratings: {}, open: {}, environment: null };
    for (const id of ALL_ITEM_IDS) {
      if (rnd() > 0.2) state.ratings[id] = 1 + Math.floor(rnd() * 5);
    }
    for (const id of ALL_OPEN_IDS) {
      if (rnd() > 0.4) state.open[id] = 'טקסט חופשי לבדיקה. שורה שנייה בתשובה.';
    }
    if (rnd() > 0.3) state.environment = ENVIRONMENTS[Math.floor(rnd() * ENVIRONMENTS.length)].id;

    for (const text of engineWritten(distill(state))) {
      assert.deepEqual(violations(text), [], `run ${run}: ${text}`);
    }
  }
});

test('the three dimensions stay separate and no combined score is produced (§9)', () => {
  const plain = toPlainText(distill(filled));
  assert.ok(plain.includes('הצוות | נקודת הפתיחה'));
  assert.ok(plain.includes('הניהול | נקודת הפתיחה'));
  assert.ok(plain.includes('העבודה | פוטנציאל שזוהה'));
  for (const banned of ['ציון כולל', 'ממוצע', 'סה״כ', 'סה"כ', 'מדד מוכנות', 'רמת מוכנות']) {
    assert.ok(!plain.includes(banned), `output must not contain "${banned}"`);
  }
});

test("the user's own words are reproduced unchanged", () => {
  const report = distill(filled);
  const verbatimLines = report.sections
    .flatMap((section) => section.bullets)
    .filter((bullet) => bullet.kind === 'verbatim')
    .map((bullet) => bullet.text);

  assert.ok(verbatimLines.includes('ראש הצוות הצעיר, ועוד מהנדס אחד שמגיע מרקע תוכנה.'));
  assert.ok(verbatimLines.includes('פתחתי חצי שעה קבועה בישיבת הצוות לנושא.'));
  assert.ok(verbatimLines.includes('אין לי זמן ללמוד את זה לעומק.'));
});

test('a rating and a free-text answer that disagree are held open, not resolved (§9 rule 4)', () => {
  const state = {
    environment: 'development',
    ratings: Object.fromEntries(DIMENSIONS.find((d) => d.id === 'team').items.map((i) => [i.id, 5])),
    open: { teamDifficulty: 'בפועל אף אחד לא מצליח להוציא מזה משהו שימושי.' }
  };
  const team = distill(state).sections.find((section) => section.id === 'team');
  const derivedText = team.bullets.filter((b) => b.kind === 'derived').map((b) => b.text).join(' ');
  assert.ok(derivedText.includes('שתי התשובות מוצגות כפי שנמסרו'));
});

test('a relative gap inside the answers is named (§9 rule 6)', () => {
  const team = distill(filled).sections.find((section) => section.id === 'team');
  const derivedText = team.bullets.filter((b) => b.kind === 'derived').map((b) => b.text).join(' ');
  assert.ok(derivedText.includes('פער בתוך הממד'));
  assert.ok(derivedText.includes('נכונות להתנסות בדרכי עבודה חדשות'));
});

test('sections with no supporting answer fall back to the §9 sentence', () => {
  const ratingsOnly = { ratings: { a1: 3, b1: 3, c1: 3 }, open: {}, environment: 'hq' };
  const report = distill(ratingsOnly);
  const blockers = report.sections.find((section) => section.id === 'blockers');
  assert.deepEqual(blockers.bullets.map((b) => b.text), [INSUFFICIENT]);
});

test('follow-up questions are questions, and never carry a proposed action (§8 f)', () => {
  const questions = distill(filled).sections.find((section) => section.id === 'questions');
  assert.ok(questions.bullets.length >= 2);
  for (const bullet of questions.bullets) {
    assert.ok(bullet.text.trim().endsWith('?'), `not a question: ${bullet.text}`);
    assert.deepEqual(violations(bullet.text), []);
  }
});

test('free text is split into statements without altering the words', () => {
  const source = 'משפט ראשון. משפט שני!\n• שורה שלישית';
  assert.deepEqual(splitStatements(source), ['משפט ראשון.', 'משפט שני!', 'שורה שלישית']);
  assert.deepEqual(splitStatements(''), []);
  assert.deepEqual(splitStatements(null), []);
});
