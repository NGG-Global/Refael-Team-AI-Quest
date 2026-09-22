/**
 * The export's two rules that are not the browser's job.
 *
 * Everything else in report-export.js is DOM and canvas work that only a
 * browser can answer for. These two are decisions: which selectors have to
 * follow the report into the SVG, and what the saved file is called.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { retarget, stamp } from '../assets/js/report-export.js';

/* ------------------------------------------------------- the stylesheet -- */

test('a selector anchored on the document root gains a wrapper twin', () => {
  // Inside the SVG there is no <html> and no <body>; the wrapper is all three.
  assert.equal(retarget(':root'), ':root, .rx-root');
  assert.equal(retarget('html'), 'html, .rx-root');
  assert.equal(retarget('body'), 'body, .rx-root');
});

test('the twin keeps everything the original selector said after the anchor', () => {
  assert.equal(
    retarget('body[data-ground="mist"]'),
    'body[data-ground="mist"], .rx-root[data-ground="mist"]'
  );
  assert.equal(
    retarget('body[data-ground="navy"] :where(a, button, [tabindex]):focus-visible'),
    'body[data-ground="navy"] :where(a, button, [tabindex]):focus-visible, '
      + '.rx-root[data-ground="navy"] :where(a, button, [tabindex]):focus-visible'
  );
});

test('a selector list is split on its own commas, not on those inside :where()', () => {
  // One twin, for `body` — the commas inside :where(...) are not separators.
  assert.equal(
    retarget('.panel, body :where(h1, h2)'),
    '.panel, body :where(h1, h2), .rx-root :where(h1, h2)'
  );
});

test('a selector that only looks like an anchor is left alone', () => {
  // `bodycopy` and `html-note` are class-ish names, not the elements.
  for (const selector of ['.bodycopy', '.html-note', 'tbody', '.page', '.report .block']) {
    assert.equal(retarget(selector), selector);
  }
});

test('nothing is added to a selector that never touches the root', () => {
  assert.equal(retarget('h1, h2, h3'), 'h1, h2, h3');
});

/* ------------------------------------------------------------ the files -- */

test('the filename carries the local calendar date, not the UTC one', () => {
  // 00:30 on the 1st, in a zone ahead of UTC, is still the 1st. toISOString
  // would call it the last day of the previous month.
  assert.equal(stamp(new Date(2026, 0, 1, 0, 30)), '2026-01-01');
  assert.equal(stamp(new Date(2026, 8, 9, 23, 45)), '2026-09-09');
  assert.equal(stamp(new Date(2026, 11, 31)), '2026-12-31');
});
