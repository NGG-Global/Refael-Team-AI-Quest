/**
 * Visualisation of the ratings.
 *
 * Two views, and deliberately no third: §9 forbids a single combined
 * readiness score, so nothing here averages, totals or ranks the dimensions
 * against each other. Every mark is one statement; the scale is ordinal, so
 * each mark is also labelled with its own digit and colour is redundant.
 */

import { DIMENSIONS, SCALE } from './content.js';
import { el, animateIn } from './dom.js';

const fillFor = (value) => (value ? `--fill: var(--v${value}); --on-fill: var(--on-v${value});` : '');
const scaleLabel = (value) => (SCALE.find((step) => step.value === value) || {}).label || '';

/* ------------------------------------------------------------- tooltip -- */

let tip;

function tooltip() {
  if (!tip) {
    tip = el('div', { class: 'tip', role: 'status', 'aria-live': 'polite' });
    document.body.append(tip);
  }
  return tip;
}

function bindTip(node, text) {
  node.setAttribute('aria-label', text);
  const show = () => {
    const box = tooltip();
    box.textContent = text;
    box.classList.add('is-on');
    const rect = node.getBoundingClientRect();
    box.style.top = `${rect.top + window.scrollY - box.offsetHeight - 10}px`;
    box.style.insetInlineStart = `${rect.left + rect.width / 2}px`;
  };
  const hide = () => tooltip().classList.remove('is-on');
  node.addEventListener('mouseenter', show);
  node.addEventListener('focus', show);
  node.addEventListener('mouseleave', hide);
  node.addEventListener('blur', hide);
  return node;
}

/* -------------------------------------------- the scale key (shared legend) */

export function scaleKey(variant = '') {
  return el('div', { class: `scalekey${variant ? ` ${variant}` : ''}` },
    SCALE.map((step) => el('span', { class: 'scalekey__item' }, [
      el('span', { class: 'scalekey__chip', style: fillFor(step.value) + 'background: var(--fill); color: var(--on-fill);', text: String(step.value) }),
      step.label
    ]))
  );
}

/* ------------------------------------------------------------ distribution */

/**
 * One cell per statement, sorted low to high, three rows kept separate.
 * Shows every data point and aggregates none of them.
 */
export function distribution(state) {
  const rows = DIMENSIONS.map((dimension) => {
    const values = dimension.items
      .map((item) => ({ item, value: state.ratings[item.id] ?? null }))
      .sort((a, b) => (a.value ?? 99) - (b.value ?? 99));

    const scored = values.filter((entry) => entry.value !== null).map((entry) => entry.value);
    const range = scored.length ? `${Math.min(...scored)}–${Math.max(...scored)}` : null;

    return el('div', { class: 'dist__row' }, [
      el('div', { class: 'dist__name', text: dimension.title }),
      el('div', { class: 'dist__cells' }, values.map((entry, index) => bindTip(
        el('span', {
          class: entry.value ? 'cell' : 'cell cell--none',
          style: `${fillFor(entry.value)} --i: ${index};`,
          tabindex: '0',
          text: entry.value ? String(entry.value) : '–'
        }),
        entry.value
          ? `${entry.item.label} — ${entry.value}, ${scaleLabel(entry.value)}`
          : `${entry.item.label} — ללא דירוג`
      ))),
      el('div', { class: 'dist__range' }, range
        ? [el('span', { text: 'טווח ' }), el('span', { dir: 'ltr', text: range })]
        : [el('span', { class: 'muted', text: 'ללא דירוג' })])
    ]);
  });

  const node = el('div', { class: 'dist' }, rows);
  animateIn(node);
  return node;
}

/* ---------------------------------------------------- per-statement detail */

/** Each statement on its own 1–5 track, sorted so the shape reads at a glance. */
export function dimensionDetail(dimension, state) {
  const rows = dimension.items
    .map((item, index) => ({ item, index, value: state.ratings[item.id] ?? null }))
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1));

  const ticks = el('span', { class: 'lolli__ticks' }, [
    el('span', { class: 'lolli__base' }),
    ...SCALE.map((step) => el('span', { class: 'lolli__tick', style: `--at: ${((step.value - 1) / 4) * 100}%` }))
  ]);

  const list = el('div', { class: 'lolli' }, rows.map((row, order) => {
    const percent = row.value ? `${((row.value - 1) / 4) * 100}%` : '0%';
    const track = el('span', { class: 'lolli__track', style: `${fillFor(row.value)} --p: ${percent}; --i: ${order};` }, [
      ticks.cloneNode(true),
      row.value ? el('span', { class: 'lolli__stem' }) : null,
      row.value ? el('span', { class: 'lolli__dot' }) : null
    ]);

    return el('div', {
      class: row.value ? 'lolli__row' : 'lolli__row lolli__row--none',
      title: row.item.text
    }, [
      el('div', { class: 'lolli__label' }, [
        el('span', { class: 'lolli__idx', text: String(row.index + 1) }),
        el('span', { text: row.item.label })
      ]),
      track,
      el('div', { class: 'lolli__val', text: row.value ? String(row.value) : '–' })
    ]);
  }));

  const node = el('div', {}, [
    list,
    el('div', { class: 'lolli__axis', 'aria-hidden': 'true' }, [
      el('span'),
      el('span', { class: 'lolli__scale' }, SCALE.map((step) => el('span', {
        class: 'lolli__mark',
        style: `--at: ${((step.value - 1) / 4) * 100}%`,
        text: String(step.value)
      }))),
      el('span')
    ])
  ]);
  animateIn(node);
  return node;
}

/* ------------------------------------------------------------ table view */

/** The same numbers as text, for screen readers, print and checking. */
export function ratingsTable(state) {
  const body = DIMENSIONS.flatMap((dimension) =>
    dimension.items.map((item) => el('tr', {}, [
      el('td', { text: dimension.title }),
      el('td', { text: item.text }),
      el('td', { text: state.ratings[item.id] ? String(state.ratings[item.id]) : '–' })
    ]))
  );

  return el('details', { class: 'tableview' }, [
    el('summary', { text: 'כל הדירוגים כטבלה' }),
    el('table', {}, [
      el('thead', {}, el('tr', {}, [
        el('th', { text: 'ממד' }),
        el('th', { text: 'היגד' }),
        el('th', { text: 'דירוג' })
      ])),
      el('tbody', {}, body)
    ])
  ]);
}
