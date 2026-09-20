/**
 * Pieces both versions of the tool share: storage, theme, the app bar, step
 * navigation, free-text fields and the brand motif.
 *
 * Each version keeps its own step machine and its own views; only the chrome
 * lives here, so the two feel like one product and can be compared on their
 * content rather than their finish.
 */

import { el, fill } from './dom.js';

const THEME_KEY = 'rafael-ai-readiness/theme';

/* -------------------------------------------------------------- storage -- */

/** A localStorage-backed store that degrades quietly when the store is blocked. */
export function createStore(key, shape) {
  const state = structuredClone(shape);

  const load = () => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return state;
      const saved = JSON.parse(raw);
      Object.keys(shape).forEach((field) => {
        if (saved[field] === undefined) return;
        if (Array.isArray(shape[field])) state[field] = Array.isArray(saved[field]) ? saved[field] : shape[field];
        else if (shape[field] && typeof shape[field] === 'object') Object.assign(state[field], saved[field]);
        else state[field] = saved[field];
      });
    } catch { /* a blocked or full store must not stop the tool */ }
    return state;
  };

  const save = () => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* ignore */ }
  };

  const clear = () => {
    Object.keys(shape).forEach((field) => {
      if (Array.isArray(shape[field])) state[field] = [];
      else if (shape[field] && typeof shape[field] === 'object') Object.keys(state[field]).forEach((k) => delete state[field][k]);
      else state[field] = shape[field];
    });
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  };

  return { state, load, save, clear };
}

/* ---------------------------------------------------------------- theme -- */

export function isDark() {
  const set = document.documentElement.dataset.theme;
  return set ? set === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function initTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) document.documentElement.dataset.theme = saved;
  } catch { /* ignore */ }
}

/** Wires the app bar's theme button. `onChange` repaints anything theme-dependent. */
export function bindTheme(onChange) {
  const button = document.getElementById('theme-toggle');
  if (button) {
    button.addEventListener('click', () => {
      document.documentElement.dataset.theme = isDark() ? 'light' : 'dark';
      try { localStorage.setItem(THEME_KEY, document.documentElement.dataset.theme); } catch { /* ignore */ }
      onChange();
    });
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onChange);
}

/** The Rafael mark ships in two tones; pick the one that reads on the ground. */
export function paintMarks() {
  const src = isDark() ? 'assets/img/logo-rafael-white.png' : 'assets/img/logo-rafael-blue.png';
  document.querySelectorAll('[data-logo="rafael"]').forEach((img) => { img.src = src; });
}

/* ---------------------------------------------------------------- toast -- */

let toastTimer;

export function toast(message) {
  const node = document.getElementById('toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-on'), 2600);
}

/* -------------------------------------------------------------- app bar -- */

/**
 * Paints the step indicator. `steps` are the input steps; `current` is the
 * step now showing, or null on an opening screen.
 */
export function paintProgress({ steps, current, label, done = false }) {
  const bars = document.getElementById('progress-bars');
  const text = document.getElementById('progress-label');
  if (!bars || !text) return;

  paintMarks();

  if (!label) {
    bars.parentElement.hidden = true;
    return;
  }
  bars.parentElement.hidden = false;

  const position = steps.indexOf(current);
  fill(bars, steps.map((_, index) => el('span', {
    class: `progress__bar${done || index < position ? ' is-done' : index === position ? ' is-now' : ''}`
  })));
  text.textContent = label;
}

/* ------------------------------------------------------------ the motif -- */

/**
 * Places the template's two shapes: a trail, and a dot landing on the trail's
 * transparent end so the streak reads as coming off the dot. Trail 273x89,
 * dot 93, neither scaled; rotations come from the template's own set.
 */
export function cometField(pairs) {
  const W = 273; const H = 89; const D = 93;
  const shapes = pairs.flatMap(({ x, y, rot }) => {
    const radians = (rot * Math.PI) / 180;
    const cx = x + W / 2 + (W / 2) * Math.cos(radians);
    const cy = y + H / 2 + (W / 2) * Math.sin(radians);
    return [
      el('span', { class: 'trail', style: `left:${x}px; top:${y}px; --rot:${rot}deg;` }),
      el('span', { class: 'dot', style: `left:${cx - D / 2}px; top:${cy - D / 2}px;` })
    ];
  });
  return el('div', { class: 'cometfield', 'aria-hidden': 'true' }, shapes);
}

/* --------------------------------------------------------------- fields -- */

/** A labelled free-text field, optionally with a note and collapsible examples. */
export function textField(field, values, onInput) {
  const area = el('textarea', {
    id: `f-${field.id}`,
    rows: String(field.rows || 3),
    onInput: (event) => onInput(field.id, event.target.value)
  });
  area.value = values[field.id] || '';

  return el('div', { class: 'field' }, [
    el('label', { class: 'field__label', for: `f-${field.id}`, text: field.label }),
    field.note && el('span', { class: 'field__note', text: field.note }),
    area,
    field.examples && field.examples.length
      ? el('details', { class: 'examples' }, [
          el('summary', { text: 'דוגמאות' }),
          el('ul', { class: 'examples__list' }, field.examples.map((line) => el('li', { text: line })))
        ])
      : null
  ]);
}

/** Back / status / forward, the same on every step of both versions. */
export function stepNav({ onBack, onNext, nextLabel, status }) {
  return el('div', { class: 'stepnav' }, [
    onBack && el('button', { class: 'btn btn--ghost', type: 'button', onClick: onBack }, 'חזרה'),
    el('span', { class: 'stepnav__status', text: status || '' }),
    onNext && el('button', { class: 'btn btn--primary', type: 'button', onClick: onNext }, nextLabel || 'המשך')
  ]);
}

/* --------------------------------------------------------------- export -- */

/** Copies text, falling back to a hidden textarea where the API is blocked. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('הפלט הועתק');
    return true;
  } catch {
    const area = el('textarea', { style: 'position:fixed;opacity:0;top:0;' });
    area.value = text;
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    toast(ok ? 'הפלט הועתק' : 'ההעתקה נחסמה בדפדפן');
    return ok;
  }
}

/** Saves text as a .txt file. */
export function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
