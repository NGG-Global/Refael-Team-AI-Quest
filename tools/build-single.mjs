/**
 * Bundles the tool into one self-contained HTML file at dist/index.html:
 * styles, scripts, fonts and logos all inlined, no external reference of any
 * kind. The result opens from a file path or a network share, which is what a
 * closed environment needs.
 *
 *   node tools/build-single.mjs
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFile(resolve(root, file), 'utf8');
const readB64 = async (file) => (await readFile(resolve(root, file))).toString('base64');

/** Modules in dependency order; they share one scope once bundled. */
const MODULES = [
  'assets/js/content.js',
  'assets/js/dom.js',
  'assets/js/engine.js',
  'assets/js/charts.js',
  'assets/js/app.js'
];

const stripModuleSyntax = (source) => source
  .replace(/^\s*import\s[\s\S]*?from\s*['"][^'"]+['"];?\s*$/gm, '')
  .replace(/^\s*export\s+(?=(const|let|var|function|class)\b)/gm, '');

async function inlineFonts(css) {
  const files = ['assistant-hebrew', 'assistant-latin-ext', 'assistant-latin'];
  let out = css;
  for (const name of files) {
    const data = await readB64(`assets/fonts/${name}.woff2`);
    out = out.replace(`url('../fonts/${name}.woff2')`, `url(data:font/woff2;base64,${data})`);
  }
  return out;
}

async function build() {
  let css = await read('assets/css/app.css');
  const tokens = await inlineFonts(await read('assets/css/tokens.css'));
  css = css.replace("@import url('./tokens.css');", tokens);

  let js = '';
  for (const file of MODULES) js += `\n/* ${file} */\n${stripModuleSyntax(await read(file))}\n`;

  const logos = {
    'assets/img/logo-ngg.png': await readB64('assets/img/logo-ngg.png'),
    'assets/img/logo-rafael-blue.png': await readB64('assets/img/logo-rafael-blue.png'),
    'assets/img/logo-rafael-white.png': await readB64('assets/img/logo-rafael-white.png')
  };

  let html = await read('index.html');
  html = html
    .replace(/\s*<link rel="preload"[^>]*>\n?/, '\n')
    .replace('<link rel="stylesheet" href="assets/css/app.css">', `<style>\n${css}\n</style>`)
    .replace('<script type="module" src="assets/js/app.js"></script>', `<script type="module">\n${js}\n</script>`);

  for (const [path, data] of Object.entries(logos)) {
    html = html.replaceAll(`"${path}"`, `"data:image/png;base64,${data}"`);
    // app.js swaps the Rafael mark by path when the theme changes.
    html = html.replaceAll(`'${path}'`, `'data:image/png;base64,${data}'`);
  }

  await mkdir(resolve(root, 'dist'), { recursive: true });
  await writeFile(resolve(root, 'dist/index.html'), html, 'utf8');

  const kb = Math.round(Buffer.byteLength(html) / 1024);
  const external = html.match(/(?:src|href)="(?!data:|#)[^"]+"/g) || [];
  if (external.length) throw new Error(`external references remain: ${external.join(', ')}`);
  console.log(`dist/index.html — ${kb} KB, no external references`);
}

build();
