/**
 * Bundles each page into one self-contained HTML file under dist/:
 * styles, scripts, fonts and logos all inlined, no external reference of any
 * kind. The three files sit side by side, so the links between them still
 * work. The result opens from a file path or a network share, which is what a
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

/**
 * Each page's modules in dependency order. They share one scope once bundled,
 * so no two modules in the same list may declare the same top-level name —
 * checked below rather than left to chance.
 */
const PAGES = [
  { html: 'index.html', modules: ['dom.js', 'shell.js', 'chooser.js'] },
  {
    html: 'mapping.html',
    modules: ['content.js', 'dom.js', 'text.js', 'engine.js', 'charts.js', 'shell.js', 'report-export.js', 'app.js']
  },
  {
    html: 'planning.html',
    modules: ['planning-content.js', 'dom.js', 'text.js', 'planning-engine.js', 'shell.js', 'report-export.js', 'planning-app.js']
  }
];

const LOGOS = ['assets/img/logo-ngg.png', 'assets/img/logo-rafael-blue.png', 'assets/img/logo-rafael-white.png'];

const stripModuleSyntax = (source) => source
  .replace(/^\s*import\s[\s\S]*?from\s*['"][^'"]+['"];?\s*$/gm, '')
  .replace(/^\s*export\s+(?=(const|let|var|function|class)\b)/gm, '');

/** Fails the build if two modules in one bundle declare the same top-level name. */
function assertNoClashes(page, sources) {
  const seen = new Map();
  for (const [file, source] of sources) {
    for (const match of source.matchAll(/^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) {
      const name = match[1];
      if (seen.has(name)) {
        throw new Error(`${page}: "${name}" is declared in both ${seen.get(name)} and ${file}`);
      }
      seen.set(name, file);
    }
  }
}

async function inlineFonts(css) {
  let out = css;
  for (const name of ['assistant-hebrew', 'assistant-latin-ext', 'assistant-latin']) {
    const data = await readB64(`assets/fonts/${name}.woff2`);
    out = out.replace(`url('../fonts/${name}.woff2')`, `url(data:font/woff2;base64,${data})`);
  }
  return out;
}

async function build() {
  let css = await read('assets/css/app.css');
  css = css.replace("@import url('./tokens.css');", await inlineFonts(await read('assets/css/tokens.css')));

  const logos = Object.fromEntries(await Promise.all(LOGOS.map(async (p) => [p, await readB64(p)])));

  await mkdir(resolve(root, 'dist'), { recursive: true });

  for (const page of PAGES) {
    const sources = [];
    for (const file of page.modules) sources.push([file, await read(`assets/js/${file}`)]);
    assertNoClashes(page.html, sources);

    const js = sources.map(([file, source]) => `\n/* ${file} */\n${stripModuleSyntax(source)}\n`).join('');

    let html = await read(page.html);
    html = html
      .replace(/\s*<link rel="preload"[^>]*>\n?/, '\n')
      .replace('<link rel="stylesheet" href="assets/css/app.css">', `<style>\n${css}\n</style>`)
      .replace(/<script type="module" src="assets\/js\/[^"]+"><\/script>/, `<script type="module">\n${js}\n</script>`);

    for (const [path, data] of Object.entries(logos)) {
      html = html.replaceAll(`"${path}"`, `"data:image/png;base64,${data}"`);
      // shell.js swaps the Rafael mark by path when the theme changes.
      html = html.replaceAll(`'${path}'`, `'data:image/png;base64,${data}'`);
    }

    const external = html.match(/(?:src|href)="(?!data:|#|index\.html|mapping\.html|planning\.html)[^"]+"/g) || [];
    if (external.length) throw new Error(`${page.html}: external references remain: ${external.join(', ')}`);

    await writeFile(resolve(root, 'dist', page.html), html, 'utf8');
    console.log(`dist/${page.html} — ${Math.round(Buffer.byteLength(html) / 1024)} KB`);
  }
  console.log('no external references; links between the three files are relative');
}

build();
