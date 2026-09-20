/**
 * Version B — שאלון לפעילות עבור סדנת מנהלים ברפאל.
 *
 * Same shell, same design language and same interaction model as version A,
 * so the two can be compared on their content rather than their finish.
 */

import {
  DOMAINS, DOMAIN_LIMIT, DOMAIN_QUESTION, CHANGE_FIELDS, TEAM_GROUPS,
  ACTION_FIELDS, COMMITMENT, PARTS, DURATION
} from './planning-content.js';
import { buildPlan, toPlainText, completeness } from './planning-engine.js';
import { splitStatements } from './text.js';
import { el, fill, animateIn } from './dom.js';
import {
  createStore, initTheme, bindTheme, paintProgress, cometField,
  textField, stepNav, toast, copyText, downloadText
} from './shell.js';

const STEPS = ['intro', 'change', 'team', 'actions', 'report'];
const INPUT_STEPS = ['change', 'team', 'actions'];

const store = createStore('rafael-ai-planning/v1', {
  domains: [], text: {}, ambassadors: [], resisters: []
});
const state = store.state;

let stepIndex = 0;
let goingBack = false;

const onText = (id, value) => { state.text[id] = value; store.save(); };
const hasAnyAnswer = () => completeness(state).filled > 0;

/* ------------------------------------------------------------ navigation */

function go(name, back = false) {
  const next = STEPS.indexOf(name);
  if (next < 0) return;
  goingBack = back;
  stepIndex = next;
  render();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function chrome() {
  const current = STEPS[stepIndex];
  if (current === 'intro') return paintProgress({ steps: INPUT_STEPS, current, label: null });

  const part = PARTS.find((p) => p.id === current);
  paintProgress({
    steps: INPUT_STEPS,
    current,
    done: current === 'report',
    label: part ? `${INPUT_STEPS.indexOf(current) + 1}/${INPUT_STEPS.length} · ${part.title}` : 'תוכנית פעולה'
  });
}

function partHead(part) {
  return el('header', { class: 'step__head' }, [
    el('span', { class: 'kicker', text: part.ordinal }),
    el('h1', { class: 'step-title', text: part.title }),
    el('p', { class: 'step__lead', text: part.lead })
  ]);
}

/* ---------------------------------------------------------- an icon mark */

/** A remove affordance. Two strokes in the system's single-weight outline hand. */
function removeGlyph() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const d of ['M3 3 L13 13', 'M13 3 L3 13']) {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.6');
    path.setAttribute('fill', 'none');
    svg.append(path);
  }
  return svg;
}

/* ------------------------------------------------------------- the views */

function viewIntro() {
  const parts = PARTS.map((part) => el('li', {}, [
    el('span', { class: 'kicker', style: 'display:block;margin-block-end:var(--s-1);', text: part.ordinal }),
    el('span', { text: `${part.title}. ${part.lead}` })
  ]));

  return el('section', { class: 'intro view' }, [
    cometField([{ x: -150, y: 90, rot: 51.7 }, { x: 40, y: 560, rot: 130.2 }]),
    el('div', { class: 'intro__inner' }, [
      el('p', { class: 'kicker', text: 'רפאל · גרסה ב׳' }),
      el('h1', { class: 'hero-title', text: 'מהמיפוי לתוכנית פעולה' }),
      el('p', { class: 'intro__lead', text: `שאלון לסדנת מנהלים: להגדיר שינוי אחד, למפות את הצוות ולנסח את הצעדים הראשונים. משך מילוי משוער: ${DURATION}.` }),
      el('ul', { class: 'principles principles--parts' }, parts),
      el('div', { class: 'actions', style: 'margin-block-start: var(--s-12);' }, [
        el('button', { class: 'btn btn--onDark btn--lg', type: 'button', onClick: () => go('change') },
          hasAnyAnswer() ? 'המשך בשאלון' : 'התחלה'),
        hasAnyAnswer() && el('button', {
          class: 'btn btn--quiet', type: 'button', style: 'color:#9ea6c8;', onClick: reset
        }, 'התחלה מחדש')
      ])
    ])
  ]);
}

function domainPicker() {
  const counter = el('span', { class: 'picker__count' });

  const buttons = DOMAINS.map((domain) => el('button', {
    class: 'choice choice--wide',
    type: 'button',
    'aria-pressed': String(state.domains.includes(domain.id)),
    text: domain.label
  }));

  const paint = () => {
    const full = state.domains.length >= DOMAIN_LIMIT;
    buttons.forEach((button, index) => {
      const on = state.domains.includes(DOMAINS[index].id);
      button.setAttribute('aria-pressed', String(on));
      button.disabled = full && !on;
    });
    counter.textContent = `נבחרו ${state.domains.length} מתוך ${DOMAIN_LIMIT}`;
  };

  buttons.forEach((button, index) => button.addEventListener('click', () => {
    const id = DOMAINS[index].id;
    const at = state.domains.indexOf(id);
    if (at >= 0) state.domains.splice(at, 1);
    else if (state.domains.length < DOMAIN_LIMIT) state.domains.push(id);
    store.save();
    paint();
  }));

  paint();

  return el('div', {}, [
    el('div', { class: 'picker__head' }, [
      el('label', { class: 'field__label', text: DOMAIN_QUESTION }),
      counter
    ]),
    el('div', { class: 'choices choices--stack', role: 'group', 'aria-label': DOMAIN_QUESTION }, buttons)
  ]);
}

function viewChange() {
  return el('section', { class: `view${goingBack ? ' view--back' : ''}` }, [
    el('div', { class: 'page' }, [
      partHead(PARTS[0]),
      el('div', { class: 'rule' }),
      domainPicker(),
      el('div', { class: 'fields', style: 'margin-block-start: var(--s-10);' },
        CHANGE_FIELDS.map((field) => textField(field, state.text, onText))),
      stepNav({ onBack: () => go('intro', true), onNext: () => go('team') })
    ])
  ]);
}

/** A list of people, entered one at a time. */
function peopleList(group) {
  const items = el('ul', { class: 'taglist' });
  const input = el('input', {
    type: 'text',
    class: 'taglist__input',
    id: `f-${group.id}`,
    autocomplete: 'off'
  });

  const paint = () => {
    fill(items, state[group.id].map((name, index) => el('li', { class: `tag tag--${group.id}` }, [
      el('span', { text: name }),
      el('button', {
        type: 'button',
        class: 'tag__remove',
        'aria-label': `הסרה של ${name}`,
        onClick: () => { state[group.id].splice(index, 1); store.save(); paint(); }
      }, removeGlyph())
    ])));
  };

  const add = () => {
    const value = input.value.trim();
    if (!value) return;
    state[group.id].push(value);
    input.value = '';
    store.save();
    paint();
    input.focus();
  };

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); add(); }
  });

  paint();

  return el('div', { class: 'field' }, [
    el('label', { class: 'field__label', for: `f-${group.id}`, text: group.label }),
    el('span', { class: 'field__note', text: group.note }),
    el('div', { class: 'taglist__row' }, [
      input,
      el('button', { class: 'btn btn--ghost', type: 'button', onClick: add }, 'הוספה')
    ]),
    items,
    el('details', { class: 'examples' }, [
      el('summary', { text: 'דוגמאות לזיהוי' }),
      el('ul', { class: 'examples__list' }, [el('li', { text: group.hint })])
    ])
  ]);
}

function viewTeam() {
  return el('section', { class: `view${goingBack ? ' view--back' : ''}` }, [
    el('div', { class: 'page' }, [
      partHead(PARTS[1]),
      el('div', { class: 'rule' }),
      el('p', { class: 'notice', text: 'אפשר לציין שם, תפקיד או פרופיל כללי. הרשימה נשמרת בדפדפן שלך בלבד.' }),
      el('div', { class: 'fields', style: 'margin-block-start: var(--s-8);' }, TEAM_GROUPS.map(peopleList)),
      stepNav({ onBack: () => go('change', true), onNext: () => go('actions') })
    ])
  ]);
}

function commitmentField() {
  const blanks = COMMITMENT.fields.map((field) => {
    const input = el('input', {
      type: 'text',
      class: 'commit__blank',
      id: `f-${field.id}`,
      'aria-label': field.label,
      autocomplete: 'off',
      onInput: (event) => onText(field.id, event.target.value)
    });
    input.value = state.text[field.id] || '';
    return input;
  });

  return el('div', { class: 'field' }, [
    el('label', { class: 'field__label', for: `f-${COMMITMENT.fields[0].id}`, text: COMMITMENT.lead }),
    el('p', { class: 'commit' }, [
      COMMITMENT.before, blanks[0], COMMITMENT.middle, blanks[1], COMMITMENT.after
    ]),
    el('details', { class: 'examples' }, [
      el('summary', { text: 'דוגמה' }),
      el('ul', { class: 'examples__list' }, [el('li', { text: COMMITMENT.example })])
    ])
  ]);
}

function viewActions() {
  const fields = ACTION_FIELDS.map((field) => el('div', {}, [
    el('span', { class: 'section-label', text: field.section }),
    textField(field, state.text, onText)
  ]));

  return el('section', { class: `view${goingBack ? ' view--back' : ''}` }, [
    el('div', { class: 'page' }, [
      partHead(PARTS[2]),
      el('div', { class: 'rule' }),
      el('div', { class: 'fields' }, [
        ...fields,
        el('div', {}, [
          el('span', { class: 'section-label', text: COMMITMENT.section }),
          commitmentField()
        ])
      ]),
      stepNav({ onBack: () => go('team', true), onNext: () => go('report'), nextLabel: 'הפקת תוכנית' })
    ])
  ]);
}

/* ------------------------------------------------------- the two pictures */

/** The division of labour, side by side, so an empty side is visible. */
function splitChart() {
  const column = (title, id, tone) => {
    const lines = splitStatements(state.text[id] || '');
    return el('div', { class: `split__col split__col--${tone}` }, [
      el('span', { class: 'split__title', text: title }),
      lines.length
        ? el('ul', { class: 'split__list' }, lines.map((line, index) =>
            el('li', { style: `--i: ${index}`, text: line })))
        : el('p', { class: 'split__empty', text: 'לא נמלא' })
    ]);
  };

  const node = el('div', { class: 'split' }, [
    column('ה־AI מבצע', 'aiDoes', 'ai'),
    column('האדם אחראי', 'humanKeeps', 'human')
  ]);
  animateIn(node);
  return node;
}

/**
 * The team map: one chip per person, counted, in two labelled columns.
 * Fill rather than hue separates the groups — a colour that reads as good or
 * bad is the wrong encoding for people.
 */
function teamChart() {
  const column = (group) => {
    const people = state[group.id] || [];
    return el('div', { class: 'teammap__col' }, [
      el('div', { class: 'teammap__head' }, [
        el('span', { class: 'teammap__title', text: group.label }),
        el('span', { class: 'teammap__count num', text: String(people.length) })
      ]),
      people.length
        ? el('ul', { class: 'teammap__list' }, people.map((name, index) =>
            el('li', { class: `chip chip--${group.id}`, style: `--i: ${index}`, text: name })))
        : el('p', { class: 'split__empty', text: 'לא נמלא' })
    ]);
  };

  const node = el('div', { class: 'teammap' }, TEAM_GROUPS.map(column));
  animateIn(node);
  return node;
}

function domainChart() {
  const node = el('ul', { class: 'domains' }, DOMAINS.map((domain, index) => el('li', {
    class: state.domains.includes(domain.id) ? 'domains__item is-on' : 'domains__item',
    style: `--i: ${index}`,
    text: domain.label
  })));
  animateIn(node);
  return node;
}

/* ---------------------------------------------------------------- report */

function viewReport() {
  const report = buildPlan(state);
  const plain = toPlainText(report);
  const done = completeness(state);

  const blocks = report.sections.map((section) => el('article', { class: 'block' }, [
    el('h3', { class: 'block__heading', text: section.heading }),
    el('div', { class: 'block__list' }, section.bullets.map((bullet) => el('p', {
      class: bullet.kind === 'empty' ? 'block__item block__item--empty' : 'block__item'
    }, [
      bullet.kind === 'verbatim' && bullet.prefix
        ? el('span', { class: 'block__prefix', text: `${bullet.prefix}: ` })
        : null,
      bullet.text
    ])))
  ]));

  return el('section', { class: `view${goingBack ? ' view--back' : ''}` }, [
    el('div', { class: 'page' }, [
      el('header', { class: 'report-head' }, [
        el('div', {}, [
          el('span', { class: 'kicker', text: 'תוצאת השאלון' }),
          el('h1', { class: 'step-title', text: report.title })
        ])
      ]),
      el('div', { class: 'rule' }),

      el('section', { class: 'panel' }, [
        el('h2', { class: 'panel__title', text: 'חלוקת העבודה' }),
        el('p', { class: 'panel__note', text: 'מה עובר ל־AI ומה נשאר באחריות האדם, כפי שהוגדר.' }),
        splitChart(),
        el('div', { class: 'domains__wrap' }, [
          el('span', { class: 'section-label', text: 'תחומי השינוי שנבחרו' }),
          domainChart()
        ])
      ]),

      el('section', { class: 'panel' }, [
        el('h2', { class: 'panel__title', text: 'מפת הצוות' }),
        el('p', { class: 'panel__note', text: 'כל תווית היא אדם אחד. שתי הקבוצות נספרות בנפרד.' }),
        teamChart()
      ]),

      el('section', {}, [
        el('span', { class: 'section-label', text: 'הפלט להעתקה', style: 'margin-block-start: var(--s-12); display:block;' }),
        el('div', { class: 'report' }, blocks)
      ]),

      el('div', { class: 'exportbar' }, [
        el('button', { class: 'btn btn--primary', type: 'button', onClick: () => copyText(plain) }, 'העתקה'),
        el('button', { class: 'btn btn--ghost', type: 'button', onClick: () => downloadText(plain, 'תוכנית-פעולה-AI.txt') }, 'הורדה'),
        el('button', { class: 'btn btn--ghost', type: 'button', onClick: () => window.print() }, 'הדפסה'),
        el('span', { class: 'exportbar__hint', text: `${done.filled} מתוך ${done.total} השדות מולאו.` }),
        el('button', { class: 'btn btn--quiet', type: 'button', onClick: () => go('actions', true) }, 'חזרה לעריכה')
      ])
    ])
  ]);
}

/* ----------------------------------------------------------------- reset */

function reset() {
  if (!window.confirm('לאפס את כל התשובות ולהתחיל מחדש? הפעולה אינה הפיכה.')) return;
  store.clear();
  go('intro', true);
  toast('התשובות נמחקו');
}

/* ---------------------------------------------------------------- render */

const VIEWS = { intro: viewIntro, change: viewChange, team: viewTeam, actions: viewActions, report: viewReport };

function render() {
  const current = STEPS[stepIndex];
  fill(document.getElementById('main'), VIEWS[current]());

  const part = PARTS.find((p) => p.id === current);
  document.title = current === 'intro'
    ? 'מהמיפוי לתוכנית פעולה | רפאל'
    : `${part ? part.title : 'תוכנית פעולה'} · מהמיפוי לתוכנית פעולה`;

  chrome();
  goingBack = false;
}

/* ------------------------------------------------------------------ boot */

initTheme();
store.load();
bindTheme(chrome);
render();
