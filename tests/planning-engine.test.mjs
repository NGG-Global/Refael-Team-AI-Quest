/**
 * Version B's output builder.
 * Run with:  node --test tests/planning-engine.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPlan, toPlainText, completeness } from '../assets/js/planning-engine.js';
import { REPORT_SECTIONS, UNFILLED, DOMAINS, DOMAIN_LIMIT } from '../assets/js/planning-content.js';

const filled = {
  domains: ['information', 'documents'],
  text: {
    aiDoes: 'לארגן את חומרי הרקע לפני ישיבת סטטוס. להכין טיוטה ראשונה לסיכום.',
    humanKeeps: 'ההחלטה מה נכנס לסיכום. אישור התוצר לפני הפצה.',
    value: 'לקצר את זמן ההכנה לישיבה.',
    processAction: 'נפעיל פיילוט על סיכום ישיבת הסטטוס השבועית.',
    ambassadorAction: 'נבקש מהם להדגים בישיבת הצוות שימוש שעבד עבורם.',
    resisterAction: 'נקיים שיחה קצרה להבנת החששות.',
    routine: 'חמש דקות לשיתוף בתוצרי AI בכל ישיבת צוות.',
    firstAction: 'פיילוט על סיכום ישיבת הסטטוס',
    successSign: 'ההכנה לישיבה תתקצר'
  },
  ambassadors: ['ראש צוות תשתיות', 'מהנדס מערכת'],
  resisters: ['בודק איכות ותיק']
};

test('an empty answer set marks every section as unfilled', () => {
  const report = buildPlan({});
  assert.equal(report.sections.length, REPORT_SECTIONS.length);
  for (const section of report.sections) {
    assert.deepEqual(section.bullets.map((b) => b.text), [UNFILLED]);
    assert.equal(section.bullets[0].kind, 'empty');
  }
});

test('the nine headings appear in the order the document lists them', () => {
  const report = buildPlan(filled);
  assert.deepEqual(
    report.sections.map((s) => s.heading),
    REPORT_SECTIONS.map((s) => s.heading)
  );
});

test('the division of labour keeps the two sides apart and attributed', () => {
  const split = buildPlan(filled).sections.find((s) => s.id === 'split');
  const ai = split.bullets.filter((b) => b.prefix === 'ה־AI').map((b) => b.text);
  const human = split.bullets.filter((b) => b.prefix === 'האדם').map((b) => b.text);
  assert.deepEqual(ai, ['לארגן את חומרי הרקע לפני ישיבת סטטוס.', 'להכין טיוטה ראשונה לסיכום.']);
  assert.deepEqual(human, ['ההחלטה מה נכנס לסיכום.', 'אישור התוצר לפני הפצה.']);
});

test("the user's own words are reproduced unchanged", () => {
  const plain = toPlainText(buildPlan(filled));
  for (const value of Object.values(filled.text)) {
    const first = value.split('. ')[0].replace(/\.$/, '');
    assert.ok(plain.includes(first), `missing from the output: ${first}`);
  }
  for (const name of [...filled.ambassadors, ...filled.resisters]) {
    assert.ok(plain.includes(name), `missing from the output: ${name}`);
  }
});

test('only the selected domains are reported, and never more than the limit', () => {
  const domain = buildPlan(filled).sections.find((s) => s.id === 'domain');
  assert.equal(domain.bullets.length, 2);
  assert.ok(domain.bullets.length <= DOMAIN_LIMIT);
  const labels = domain.bullets.map((b) => b.text);
  assert.ok(labels.includes(DOMAINS.find((d) => d.id === 'information').label));
  assert.ok(!labels.includes(DOMAINS.find((d) => d.id === 'planning').label));
});

test('each group in the team map is counted separately', () => {
  const people = buildPlan(filled).sections.find((s) => s.id === 'people');
  assert.ok(people.bullets.some((b) => b.prefix === 'שגרירים (2)'));
  assert.ok(people.bullets.some((b) => b.prefix === 'מתנגדים (1)'));
});

test('one group left empty is stated, not quietly dropped', () => {
  const people = buildPlan({ ambassadors: ['ראש צוות'], resisters: [] })
    .sections.find((s) => s.id === 'people');
  assert.ok(people.bullets.some((b) => b.text.includes(`מתנגדים: ${UNFILLED}`)));
});

test('a half-finished commitment shows the gap rather than reading as complete', () => {
  const partial = buildPlan({ text: { firstAction: 'פיילוט על סיכום שבועי' } })
    .sections.find((s) => s.id === 'commitment');
  const text = partial.bullets[0].text;
  assert.ok(text.includes('פיילוט על סיכום שבועי'));
  assert.ok(text.includes(`[${UNFILLED}]`));
});

test('a complete commitment reads as one sentence', () => {
  const commitment = buildPlan(filled).sections.find((s) => s.id === 'commitment');
  assert.equal(commitment.bullets.length, 1);
  assert.equal(commitment.bullets[0].kind, 'verbatim');
  assert.ok(!commitment.bullets[0].text.includes(UNFILLED));
  assert.ok(commitment.bullets[0].text.startsWith('בתוך החודש הקרוב'));
});

test('completeness counts filled fields and nothing else', () => {
  assert.deepEqual(completeness(filled), { filled: 10, total: 10 });
  assert.equal(completeness({}).filled, 0);
  assert.equal(completeness({ domains: ['documents'] }).filled, 1);
});

test('nothing is invented: every reported line traces to an entry', () => {
  const sparse = { domains: [], text: { value: 'לחסוך זמן.' }, ambassadors: [], resisters: [] };
  const report = buildPlan(sparse);
  const filledSections = report.sections.filter((s) => s.bullets.some((b) => b.kind !== 'empty'));
  assert.deepEqual(filledSections.map((s) => s.id), ['target']);
  assert.deepEqual(filledSections[0].bullets.map((b) => b.text), ['לחסוך זמן.']);
});
