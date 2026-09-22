/**
 * Taking the report out of the browser: as a PDF, or as an image.
 *
 * No library is used, because the tool has to run on a closed network and
 * `tools/build-single.mjs` fails the build on any external reference. So
 * neither route is the usual package:
 *
 *   PDF — the browser's own print pipeline. It already lays this report out
 *         (the print rules are in app.css), and it brings real text, correct
 *         Hebrew shaping and honest page breaks. A hand-written PDF writer
 *         would have to reimplement all three, and would get the bidi wrong.
 *
 *   PNG — the report's own markup, placed in an SVG <foreignObject> and drawn
 *         to a canvas. An SVG being rendered as an image may not reach outside
 *         itself for a file, so the stylesheet and the fonts have to travel
 *         with it as data URIs.
 *
 * Both come out light-themed whatever the screen is set to, and neither sends
 * anything anywhere: the file is assembled in the page and handed to the
 * browser's own download.
 */

import { el } from './dom.js';
import { toast } from './shell.js';

/** The width the report is laid out for — `--page-w`. */
const IMAGE_WIDTH = 1080;
/** Two device pixels per CSS pixel, so the text survives being zoomed into. */
const IMAGE_SCALE = 2;
/** Under every browser's own canvas ceiling, with room to spare. */
const MAX_EDGE = 16000;

const DARK_RULE = /\[data-theme=["']?dark/;
const DARK_QUERY = /prefers-color-scheme:\s*dark/;

/**
 * The export's own overrides, appended after the page's stylesheet.
 *
 * `.rx-root` is the wrapper that stands in for <html> and <body>; it takes
 * their rules through `retarget()` below and only has to fix its own box on
 * top. Animations are cut because a CSS animation renders at its first frame
 * in a static image — the entrance ones would otherwise export as blank.
 */
const EXPORT_CSS = `
.rx-root {
  display: block;
  min-height: 0;
  width: ${IMAGE_WIDTH}px;
  direction: rtl;
}
.rx-root, .rx-root *, .rx-root *::before, .rx-root *::after {
  animation: none !important;
  transition: none !important;
}
.rx-root .tableview summary { display: none; }
.rx-stamp {
  margin-block-start: var(--s-10); padding-block-start: var(--s-4);
  border-block-start: 1px solid var(--rule);
  font-size: var(--fs-footer); color: var(--text-muted);
}
`;

/* ------------------------------------------------------------ the files -- */

const pad2 = (value) => String(value).padStart(2, '0');

/** A local calendar date for the filename. `toISOString` is UTC and slips a day. */
export function stamp(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Hands a blob to the browser's download, then lets go of the object URL. */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/* ------------------------------------------------------------------ PDF -- */

/**
 * Opens the ratings table for the duration of a print.
 *
 * A collapsed <details> prints as nothing, and that table is the data the rest
 * of the report is drawn from — a PDF without it is missing its evidence. Bound
 * to the print events rather than to the button, so the browser's own Ctrl+P
 * produces the same file.
 */
export function bindPrint() {
  let opened = [];

  window.addEventListener('beforeprint', () => {
    opened = [...document.querySelectorAll('details.tableview:not([open])')];
    opened.forEach((node) => { node.open = true; });
  });

  window.addEventListener('afterprint', () => {
    opened.forEach((node) => { node.open = false; });
    opened = [];
  });
}

/**
 * Opens the print dialog, where *שמירה כ-PDF* is the destination to pick.
 *
 * Chrome and Edge name the saved file after the document title, so the title
 * carries the filename for as long as the dialog is up.
 */
export function savePdf(filename) {
  const title = document.title;
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    document.title = title;
    window.removeEventListener('afterprint', restore);
  };

  document.title = filename;
  window.addEventListener('afterprint', restore);
  window.print();
  // Safari does not fire afterprint on the save-to-PDF path.
  setTimeout(restore, 1500);
}

/* ---------------------------------------------------------------- assets -- */

/** Same-origin files read as data URIs, so they can travel inside the SVG. */
const assetCache = new Map();

function asDataUrl(url) {
  if (url.startsWith('data:')) return Promise.resolve(url);
  if (assetCache.has(url)) return assetCache.get(url);

  const pending = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return response.blob();
    })
    .then((blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error || new Error(url));
      reader.readAsDataURL(blob);
    }));

  assetCache.set(url, pending);
  return pending;
}

/* ------------------------------------------------------------ the styles -- */

/** Splits a selector list on its own commas, not on those inside :where(...). */
function splitSelectors(text) {
  const parts = [];
  let depth = 0;
  let start = 0;

  for (let at = 0; at < text.length; at += 1) {
    const character = text[at];
    if (character === '(' || character === '[') depth += 1;
    else if (character === ')' || character === ']') depth -= 1;
    else if (character === ',' && depth === 0) { parts.push(text.slice(start, at)); start = at + 1; }
  }
  parts.push(text.slice(start));

  return parts.map((part) => part.trim()).filter(Boolean);
}

const ROOT_ANCHOR = /^(?::root|html|body)(?![\w-])/;

/**
 * Gives any selector anchored on `html`, `body` or `:root` an `.rx-root` twin.
 * Inside the SVG none of those three elements exists — the wrapper stands in
 * for all of them — so without this the page would lose its typography and,
 * where the tokens hang off `body`, its colours.
 */
export function retarget(selectorText) {
  const twins = splitSelectors(selectorText)
    .filter((part) => ROOT_ANCHOR.test(part))
    .map((part) => part.replace(ROOT_ANCHOR, '.rx-root'));

  return twins.length ? `${selectorText}, ${twins.join(', ')}` : selectorText;
}

/**
 * The page's rules flattened to text, with the `@font-face` rules picked out.
 *
 * `@import` is followed by hand, because the tokens — and the font faces with
 * them — live in an imported sheet. The dark theme is left behind on the way.
 */
function collectCss(rules, faces, out) {
  for (const rule of rules) {
    if (rule instanceof CSSImportRule) {
      if (rule.styleSheet) collectCss(rule.styleSheet.cssRules, faces, out);
    } else if (rule instanceof CSSFontFaceRule) {
      faces.push(rule);
    } else if (rule instanceof CSSStyleRule) {
      if (!DARK_RULE.test(rule.selectorText)) out.push(`${retarget(rule.selectorText)} { ${rule.style.cssText} }`);
    } else if (rule instanceof CSSMediaRule) {
      // Print rules would never match here, and the dark ones are not wanted.
      if (DARK_QUERY.test(rule.conditionText) || rule.conditionText.includes('print')) continue;
      const inner = collectCss(rule.cssRules, faces, []);
      if (inner.length) out.push(`@media ${rule.conditionText} {\n${inner.join('\n')}\n}`);
    } else {
      out.push(rule.cssText);
    }
  }
  return out;
}

/** The `@font-face` rules with their files carried inline. */
async function inlineFontFaces(faces) {
  const out = [];
  for (const rule of faces) {
    const found = rule.style.getPropertyValue('src').match(/url\(["']?([^"')]+)["']?\)/);
    if (!found) continue;
    const base = (rule.parentStyleSheet && rule.parentStyleSheet.href) || document.baseURI;
    try {
      const data = await asDataUrl(new URL(found[1], base).href);
      out.push(rule.cssText.replace(found[1], () => data));
    } catch {
      // Better a system face in the image than no image at all.
    }
  }
  return out;
}

/** The page's stylesheet as one string, ready to sit inside the SVG. */
async function exportStylesheet() {
  const faces = [];
  const body = [];

  for (const sheet of document.styleSheets) {
    try { collectCss(sheet.cssRules, faces, body); } catch { /* a sheet we may not read */ }
  }

  return `${(await inlineFontFaces(faces)).join('\n')}\n${body.join('\n')}\n${EXPORT_CSS}`;
}

/* ------------------------------------------------------------- the clone -- */

/** Rewrites every `<img>` to a data URI; an SVG image cannot fetch one itself. */
async function inlineImages(node) {
  await Promise.all([...node.querySelectorAll('img')].map(async (image) => {
    try {
      image.setAttribute('src', await asDataUrl(new URL(image.getAttribute('src'), document.baseURI).href));
    } catch {
      image.remove();
    }
  }));
}

/**
 * The report as it should look on its own: no controls, and the collapsed
 * table opened, because an exported image has no second click in it.
 */
async function prepareClone(source, caption) {
  const clone = source.cloneNode(true);
  clone.querySelectorAll('[data-export="skip"]').forEach((node) => node.remove());
  clone.querySelectorAll('details').forEach((node) => { node.open = true; });
  await inlineImages(clone);

  const root = el('div', { class: 'rx-root', dir: 'rtl' }, clone);
  if (caption) root.append(el('p', { class: 'rx-stamp', text: caption }));
  return root;
}

/**
 * Lays the export out at its real width and reports the height.
 *
 * An iframe rather than a hidden div, because the type sizes and the gutter are
 * clamped against `vw`: they only come out at the size the image will use in a
 * viewport that is the width the image will be. Same markup and same stylesheet
 * as the SVG gets, so the measurement is the render.
 */
async function measureHeight(markup, css) {
  const frame = el('iframe', {
    'aria-hidden': 'true',
    tabindex: '-1',
    style: `position:fixed; left:-20000px; top:0; width:${IMAGE_WIDTH}px; height:100px;
            border:0; visibility:hidden;`
  });
  document.body.append(frame);

  try {
    const doc = frame.contentDocument;
    doc.open();
    doc.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0">${markup}</body></html>`);
    doc.close();
    if (doc.fonts) await doc.fonts.ready;
    const laid = doc.body.firstElementChild;
    return Math.ceil(laid ? laid.getBoundingClientRect().height : 0);
  } finally {
    frame.remove();
  }
}

/* ------------------------------------------------------------- the image -- */

const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
const escapeXml = (text) => text.replace(/[&<>]/g, (character) => XML_ESCAPES[character]);

function svgDocument(markup, css, width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    + `<style>${escapeXml(css)}</style>`
    + `<foreignObject x="0" y="0" width="${width}" height="${height}">${markup}</foreignObject>`
    + '</svg>';
}

function drawSvg(svg, width, height) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(IMAGE_SCALE, MAX_EDGE / Math.max(width, height));
      const canvas = el('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);

      const context = canvas.getContext('2d');
      context.scale(scale, scale);
      // The report's own ground is opaque, but PNG is not; paint under it.
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas);
    };
    image.onerror = () => reject(new Error('the report could not be rendered to an image'));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/**
 * Saves `source` as a PNG. `caption` is a line added under the report — the
 * date it was produced — since an image loses the page around it.
 *
 * Resolves once the file has been handed to the browser, and rejects if the
 * browser refused to rasterise, which the caller should say out loud rather
 * than swallow.
 */
export async function saveImage(source, filename, caption) {
  const css = await exportStylesheet();
  const root = await prepareClone(source, caption);
  const markup = new XMLSerializer().serializeToString(root);

  const height = await measureHeight(markup, css);
  if (!height) throw new Error('the report measured as empty');

  const canvas = await drawSvg(svgDocument(markup, css, IMAGE_WIDTH, height), IMAGE_WIDTH, height);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((made) => (made ? resolve(made) : reject(new Error('the image could not be encoded'))), 'image/png');
  });

  downloadBlob(blob, filename);
}

/* ------------------------------------------------------------ the button -- */

/**
 * A button for an export that takes a moment. It says so while it works, and a
 * failure is said out loud rather than swallowed: a button that quietly
 * produces no file is worse than one that reports an error.
 */
export function exportButton({ label, busyLabel, className = 'btn btn--ghost', run }) {
  const button = el('button', { class: className, type: 'button' }, label);

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = busyLabel;
    try {
      await run();
    } catch (error) {
      console.error(error);
      toast('הייצוא לתמונה נכשל בדפדפן הזה. אפשר לשמור כ-PDF דרך ההדפסה.');
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });

  return button;
}
