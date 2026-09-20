/**
 * Version B's output builder — הפלט הסופי.
 *
 * Unlike version A, the source document sets no constraints on the summary:
 * this version is meant to produce a plan, and the plan is the manager's own
 * commitments. So the engine stays a restatement — it organises what was
 * entered under the nine headings and adds nothing. A blank stays visibly
 * blank rather than being filled in on the user's behalf.
 */

import {
  DOMAINS, CHANGE_FIELDS, ACTION_FIELDS, COMMITMENT,
  REPORT_TITLE, REPORT_SECTIONS, UNFILLED
} from './planning-content.js';
import { splitStatements } from './text.js';

const derived = (text) => ({ kind: 'derived', text: String(text) });
const verbatim = (text, prefix) => ({ kind: 'verbatim', prefix: prefix || '', text: String(text) });
const unfilled = () => ({ kind: 'empty', text: UNFILLED });

const textOf = (state, id) => String((state.text && state.text[id]) || '').trim();
const listOf = (state, id) => (Array.isArray(state[id]) ? state[id] : []).map((v) => String(v).trim()).filter(Boolean);

/** Appends one bullet per statement found in a field, or nothing if it is blank. */
function pushText(bullets, state, id, prefix) {
  splitStatements(textOf(state, id)).forEach((line) => bullets.push(verbatim(line, prefix)));
}

/* ------------------------------------------------------------- sections -- */

function domainSection(state) {
  const chosen = DOMAINS.filter((domain) => (state.domains || []).includes(domain.id));
  if (!chosen.length) return [unfilled()];
  return chosen.map((domain) => derived(domain.label));
}

function splitSection(state) {
  const bullets = [];
  pushText(bullets, state, 'aiDoes', 'ה־AI');
  pushText(bullets, state, 'humanKeeps', 'האדם');
  return bullets.length ? bullets : [unfilled()];
}

function targetSection(state) {
  const bullets = [];
  pushText(bullets, state, 'value');
  return bullets.length ? bullets : [unfilled()];
}

function peopleSection(state) {
  const ambassadors = listOf(state, 'ambassadors');
  const resisters = listOf(state, 'resisters');
  if (!ambassadors.length && !resisters.length) return [unfilled()];

  const bullets = [];
  bullets.push(ambassadors.length
    ? verbatim(ambassadors.join(', '), `שגרירים (${ambassadors.length})`)
    : derived(`שגרירים: ${UNFILLED}`));
  bullets.push(resisters.length
    ? verbatim(resisters.join(', '), `מתנגדים (${resisters.length})`)
    : derived(`מתנגדים: ${UNFILLED}`));
  return bullets;
}

function actionSection(state, id) {
  const bullets = [];
  pushText(bullets, state, id);
  return bullets.length ? bullets : [unfilled()];
}

function commitmentSection(state) {
  const first = textOf(state, 'firstAction');
  const success = textOf(state, 'successSign');
  if (!first && !success) return [unfilled()];

  const blank = `[${UNFILLED}]`;
  const sentence = `${COMMITMENT.before} ${first || blank}${COMMITMENT.middle} ${success || blank}${COMMITMENT.after}`;
  return [first && success ? verbatim(sentence) : derived(sentence)];
}

/* --------------------------------------------------------------- report -- */

/**
 * @param {{domains: string[], text: Object<string,string>, ambassadors: string[], resisters: string[]}} state
 */
export function buildPlan(state) {
  const safe = {
    domains: (state && state.domains) || [],
    text: (state && state.text) || {},
    ambassadors: (state && state.ambassadors) || [],
    resisters: (state && state.resisters) || []
  };

  const byId = {
    domain: domainSection(safe),
    split: splitSection(safe),
    target: targetSection(safe),
    people: peopleSection(safe),
    processAction: actionSection(safe, 'processAction'),
    ambassadorAction: actionSection(safe, 'ambassadorAction'),
    resisterAction: actionSection(safe, 'resisterAction'),
    routine: actionSection(safe, 'routine'),
    commitment: commitmentSection(safe)
  };

  return {
    title: REPORT_TITLE,
    sections: REPORT_SECTIONS.map((section) => ({
      id: section.id,
      heading: section.heading,
      bullets: byId[section.id]
    }))
  };
}

/** How complete the plan is, for the step indicator. Counts fields, not quality. */
export function completeness(state) {
  const filled = [
    (state.domains || []).length > 0,
    ...CHANGE_FIELDS.map((field) => Boolean(textOf(state, field.id))),
    (state.ambassadors || []).length > 0 || (state.resisters || []).length > 0,
    ...ACTION_FIELDS.map((field) => Boolean(textOf(state, field.id))),
    Boolean(textOf(state, 'firstAction') && textOf(state, 'successSign'))
  ];
  return { filled: filled.filter(Boolean).length, total: filled.length };
}

/** The plain-text block the user copies out. */
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
