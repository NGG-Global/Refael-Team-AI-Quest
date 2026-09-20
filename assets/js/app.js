/**
 * Version A — מיפוי מוכנות להטמעת AI.
 *
 * Step machine and views. Chrome, storage and shared controls come from
 * shell.js; the distillation rules live in engine.js.
 *
 * Everything runs in the browser. The page makes no network request of any
 * kind, and the answers are never transmitted anywhere.
 */

import {
  DIMENSIONS, SCALE, PRINCIPLES, ENVIRONMENTS, ENVIRONMENT_QUESTION,
  PROCESS_FIELDS, ALL_ITEM_IDS
} from './content.js';
import { distill, toPlainText } from './engine.js';
import { distribution, dimensionDetail, ratingsTable, scaleKey } from './charts.js';
import { el, fill } from './dom.js';
import {
  createStore, initTheme, bindTheme, paintProgress, cometField,
  textField, stepNav, toast, copyText, downloadText
} from './shell.js';

const STEPS = ['intro', 'team', 'manager', 'work', 'process', 'report'];
const INPUT_STEPS = ['team', 'manager', 'work', 'process'];

const STEP_NAMES = {
  team: 'הצוות שלי',
  manager: 'אני כמנהל/ת',
  work: 'העבודה שלנו',
  process: 'תהליך עבודה',
  report: 'תמונת מצב'
};

const store = createStore('rafael-ai-readiness/v1', { ratings: {}, open: {}, environment: null });
const state = store.state;

let stepIndex = 0;
let goingBack = false;

const unratedIn = (dimension) => dimension.items.filter((item) => !state.ratings[item.id]).length;
const hasAnyAnswer = () =>
  ALL_ITEM_IDS.some((id) => state.ratings[id]) ||
  Object.values(state.open).some((text) => String(text || '').trim()) ||
  Boolean(state.environment);

const onText = (id, value) => { state.open[id] = value; store.save(); };

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

  const position = INPUT_STEPS.indexOf(current);
  paintProgress({
    steps: INPUT_STEPS,
    current,
    done: current === 'report',
    label: current === 'report'
      ? STEP_NAMES.report
      : `${position + 1}/${INPUT_STEPS.length} · ${STEP_NAMES[current]}`
  });
}

/* ------------------------------------------------------------ the views */

function viewIntro() {
  return el('section', { class: 'intro view' }, [
    cometField([{ x: -150, y: 90, rot: 51.7 }, { x: 40, y: 560, rot: 130.2 }]),
    el('div', { class: 'intro__inner' }, [
      el('p', { class: 'kicker', text: 'רפאל · גרסה א׳' }),
      el('h1', { class: 'hero-title', text: 'מיפוי מוכנות להטמעת AI' }),
      el('p', { class: 'intro__lead', text: 'תמונת מצב מזוקקת של נקודת הפתיחה שלך ושל היחידה, כקלט לעבודה עם Copilot בהמשך.' }),
      el('ul', { class: 'principles' }, PRINCIPLES.map((line) => el('li', { text: line }))),
      el('div', { class: 'actions', style: 'margin-block-start: var(--s-12);' }, [
        el('button', { class: 'btn btn--onDark btn--lg', type: 'button', onClick: () => go('team') },
          hasAnyAnswer() ? 'המשך במיפוי' : 'התחלה'),
        hasAnyAnswer() && el('button', {
          class: 'btn btn--quiet', type: 'button', style: 'color:#9ea6c8;', onClick: reset
        }, 'התחלה מחדש')
      ])
    ])
  ]);
}

/** A 1–5 radio group with roving focus, arrow keys and digit shortcuts. */
function scaleGroup(item) {
  const cells = SCALE.map((step) => el('button', {
    class: 'scale__cell',
    type: 'button',
    role: 'radio',
    'aria-checked': String(state.ratings[item.id] === step.value),
    'aria-label': `${step.value} – ${step.label}`,
    style: `--fill: var(--v${step.value}); --on-fill: var(--on-v${step.value});`,
    tabindex: '-1',
    dataset: { value: String(step.value) },
    text: String(step.value)
  }));

  const group = el('div', { class: 'scale', role: 'radiogroup', 'aria-label': item.text }, cells);

  const paint = () => {
    const chosen = state.ratings[item.id];
    cells.forEach((cell, index) => {
      const value = index + 1;
      cell.setAttribute('aria-checked', String(chosen === value));
      cell.tabIndex = chosen ? (chosen === value ? 0 : -1) : (index === 0 ? 0 : -1);
    });
  };

  const choose = (value, focus = false) => {
    state.ratings[item.id] = value;
    store.save();
    paint();
    if (focus) cells[value - 1].focus();
    updateStatus();
  };

  cells.forEach((cell, index) => cell.addEventListener('click', () => choose(index + 1)));

  group.addEventListener('keydown', (event) => {
    const current = state.ratings[item.id] || 1;
    // The cells run right to left on the page, so ArrowRight steps down.
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); choose(Math.max(1, current - 1), true); }
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); choose(Math.min(5, current + 1), true); }
    else if (event.key === 'Home') { event.preventDefault(); choose(1, true); }
    else if (event.key === 'End') { event.preventDefault(); choose(5, true); }
    else if (/^[1-5]$/.test(event.key)) { event.preventDefault(); choose(Number(event.key), true); }
  });

  paint();
  return group;
}

function updateStatus() {
  const node = document.querySelector('.stepnav__status');
  if (!node) return;
  const dimension = DIMENSIONS.find((d) => d.id === STEPS[stepIndex]);
  if (!dimension) return;
  const left = unratedIn(dimension);
  node.textContent = left ? `${left} מתוך ${dimension.items.length} היגדים ללא דירוג` : '';
}

function viewDimension(dimension) {
  const index = STEPS.indexOf(dimension.id);
  const left = unratedIn(dimension);

  return el('section', { class: `view${goingBack ? ' view--back' : ''}` }, [
    el('div', { class: 'page' }, [
      el('header', { class: 'step__head' }, [
        el('span', { class: 'kicker', text: dimension.ordinal }),
        el('h1', { class: 'step-title', text: dimension.title }),
        el('p', { class: 'step__lead', text: dimension.lead })
      ]),
      el('div', { class: 'rule' }),
      scaleKey(),
      el('div', { class: 'battery' }, dimension.items.map((item, position) => el('div', { class: 'statement' }, [
        el('p', { class: 'statement__text' }, [
          el('span', { class: 'statement__idx', text: String(position + 1) }),
          el('span', { text: item.text })
        ]),
        scaleGroup(item)
      ]))),
      dimension.open.length > 0 && el('div', {}, [
        el('span', { class: 'section-label', text: 'שאלות פתוחות', style: 'margin-block-start: var(--s-12); display:block;' }),
        el('div', { class: 'fields' }, dimension.open.map((field) => textField(field, state.open, onText)))
      ]),
      stepNav({
        onBack: () => go(STEPS[index - 1], true),
        onNext: () => go(STEPS[index + 1]),
        status: left ? `${left} מתוך ${dimension.items.length} היגדים ללא דירוג` : ''
      })
    ])
  ]);
}

function viewProcess() {
  const promptBox = el('div', { class: 'prompt', id: 'env-prompt', hidden: !state.environment });
  const paintPrompt = () => {
    const chosen = ENVIRONMENTS.find((env) => env.id === state.environment);
    promptBox.hidden = !chosen;
    promptBox.textContent = chosen ? chosen.prompt : '';
  };

  const buttons = ENVIRONMENTS.map((env) => el('button', {
    class: 'choice',
    type: 'button',
    'aria-pressed': String(state.environment === env.id),
    onClick: () => {
      state.environment = env.id;
      store.save();
      buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(ENVIRONMENTS[index].id === env.id)));
      paintPrompt();
    },
    text: env.label
  }));

  paintPrompt();

  return el('section', { class: `view${goingBack ? ' view--back' : ''}` }, [
    el('div', { class: 'page' }, [
      el('header', { class: 'step__head' }, [
        el('span', { class: 'kicker', text: 'התאמה לסביבת העבודה' }),
        el('h1', { class: 'step-title', text: ENVIRONMENT_QUESTION })
      ]),
      el('div', { class: 'choices', role: 'group', 'aria-label': ENVIRONMENT_QUESTION }, buttons),
      promptBox,
      el('div', { class: 'fields', style: 'margin-block-start: var(--s-10);' },
        PROCESS_FIELDS.map((field) => textField(field, state.open, onText))),
      stepNav({ onBack: () => go('work', true), onNext: () => go('report'), nextLabel: 'הפקת תמונת מצב' })
    ])
  ]);
}

function viewReport() {
  const report = distill(state);
  const plain = toPlainText(report);

  const blocks = report.sections.map((section) => el('article', { class: 'block' }, [
    el('h3', { class: 'block__heading', text: section.heading }),
    el('div', { class: 'block__list' }, section.bullets.map((bullet) => el('p', {
      class: bullet.kind === 'derived' && bullet.text.startsWith('לא עלה מספיק')
        ? 'block__item block__item--empty'
        : 'block__item'
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
          el('span', { class: 'kicker', text: 'תוצאת המיפוי' }),
          el('h1', { class: 'step-title', text: report.title })
        ])
      ]),
      el('div', { class: 'rule' }),

      el('section', { class: 'panel' }, [
        el('h2', { class: 'panel__title', text: 'פיזור הדירוגים' }),
        el('p', { class: 'panel__note', text: 'כל ריבוע הוא היגד אחד, מסודר מהנמוך לגבוה. שלושת הממדים נשמרים בנפרד ואינם מצטרפים לציון אחד.' }),
        scaleKey('scalekey--static'),
        distribution(state),
        ratingsTable(state)
      ]),

      ...DIMENSIONS.map((dimension) => el('section', { class: 'panel' }, [
        el('h2', { class: 'panel__title', text: dimension.title }),
        el('p', { class: 'panel__note', text: dimension.lead }),
        dimensionDetail(dimension, state)
      ])),

      el('section', {}, [
        el('span', { class: 'section-label', text: 'הפלט להעתקה', style: 'margin-block-start: var(--s-12); display:block;' }),
        el('div', { class: 'report' }, blocks)
      ]),

      el('div', { class: 'exportbar' }, [
        el('button', { class: 'btn btn--primary', type: 'button', onClick: () => copyText(plain) }, 'העתקה ל-Copilot'),
        el('button', { class: 'btn btn--ghost', type: 'button', onClick: () => downloadText(plain, 'מיפוי-מוכנות-AI.txt') }, 'הורדה'),
        el('button', { class: 'btn btn--ghost', type: 'button', onClick: () => window.print() }, 'הדפסה'),
        el('span', { class: 'exportbar__hint', text: 'הפלט מועתק כפי שהוא. Copilot משמש לשלב הבא, אחרי המיפוי.' }),
        el('button', { class: 'btn btn--quiet', type: 'button', onClick: () => go('process', true) }, 'חזרה לעריכה')
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

function render() {
  const current = STEPS[stepIndex];
  const main = document.getElementById('main');

  if (current === 'intro') fill(main, viewIntro());
  else if (current === 'process') fill(main, viewProcess());
  else if (current === 'report') fill(main, viewReport());
  else fill(main, viewDimension(DIMENSIONS.find((dimension) => dimension.id === current)));

  document.title = current === 'intro'
    ? 'מיפוי מוכנות להטמעת AI | רפאל'
    : `${STEP_NAMES[current]} · מיפוי מוכנות להטמעת AI`;

  chrome();
  goingBack = false;
}

/* ------------------------------------------------------------------ boot */

initTheme();
store.load();
bindTheme(chrome);
render();
