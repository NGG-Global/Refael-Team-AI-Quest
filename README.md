# כלי סדנת מנהלים — Rafael

Two workshop tools for the same Rafael managers' session, in two different
approaches, behind one entry screen. The team is choosing between them, so both
are built in the same design language and the same interaction model — the
comparison should be about the questionnaires, not about finish.

**Hebrew, right-to-left. No build step. No dependencies. No network calls.**

| Page | What it is |
|---|---|
| `index.html` | The entry screen: pick a version |
| `mapping.html` | **גרסה א׳** — מיפוי מוכנות להטמעת AI |
| `planning.html` | **גרסה ב׳** — מהמיפוי לתוכנית פעולה |

The two keep separate answers in `localStorage`, so trying one does not disturb
the other.

---

## גרסה א׳ — מיפוי מוכנות (`mapping.html`)

Built to *"אפיון למפתח | כלי מיפוי מוכנות להטמעת AI – רפאל"*. Section
references below (§1–§11) point at that document. A **diagnostic** tool: it maps
the starting point and stops before recommendations. The output is written to be
pasted into Copilot, which is where planning happens.

| Step | Content | Spec |
|---|---|---|
| ממד א׳ — הצוות שלי | 7 rated statements, 3 open questions | §4 |
| ממד ב׳ — אני כמנהל/ת | 7 rated statements, 2 open questions | §5 |
| ממד ג׳ — העבודה שלנו | 5 rated statements | §6 |
| תהליך עבודה | environment branch (ייצור / פיתוח / מטה-אחר) plus 4 open fields | §7 |
| תמונת מצב | the distilled output, visualised and ready to copy | §8, §10 |

### How its output is produced

`assets/js/engine.js` is deterministic and rule-based. There is no model in the
loop — every line is either a factual restatement of what was rated, or the
user's own words reproduced unchanged and regrouped under the right heading. The
§9 rules are implemented as follows:

| Rule (§9) | Implementation |
|---|---|
| Never recommend | `FORBIDDEN_PHRASES` is checked against every engine-written line; a line that trips it is dropped rather than shipped. Tests assert this over 600 generated answer sets. |
| Never invent or infer | The engine has no source of content other than `state.ratings` and `state.open`. Free text is split on sentence and line boundaries only — no word is changed or dropped. |
| Say so when there is too little | Each section falls back to the exact sentence *"לא עלה מספיק מידע כדי לזקק תובנה בנושא זה"*. |
| Separate rated data from free text | Bullets carry a `kind` of `derived` or `verbatim` and render differently. Where a rating and a free-text answer disagree, the engine states the tension and leaves it unresolved. |
| No single readiness score | Nothing averages, totals or ranks. The three dimensions are kept apart in the data model, the charts and the export. A test asserts the output contains no "ציון כולל", "ממוצע" or equivalent. |
| Relative gaps are allowed | `CONTRAST_PAIRS` names statement pairs worth contrasting inside a dimension; the engine reports the largest real gap in the user's own numbers. |
| No benchmarking | There is no reference data in the tool to benchmark against. |
| Keep the abstraction level | The tool asks for nothing identifying, and the output is assembled only from what was typed. |

### Its visualisation

Two views, and deliberately no third:

- **פיזור הדירוגים** — one square per statement, sorted low to high, three rows
  kept separate. Every data point is shown and nothing is aggregated.
- **Per-dimension detail** — each statement on its own 1–5 track, sorted so the
  shape of the dimension reads at a glance. The scale runs 1 at the right to
  5 at the left, which is the correct direction in an RTL layout.

The 1–5 scale is coloured with a **single-hue sequential ramp**, stepped evenly
in OKLab lightness. It is not a red-to-green ramp: §3 is explicit that a low
rating is not a failure, and a one-hue scale reads as a position rather than a
verdict. Every mark also carries its own digit, so the two lightest steps never
depend on colour alone, and a full table view is one click away.

---

## גרסה ב׳ — תוכנית פעולה (`planning.html`)

Built to *"שאלון לפעילות עבור סדנת מנהלים ברפאל"*. An **action-planning** tool:
it defines one change, maps the team, and ends in concrete steps and a personal
commitment. Estimated 7 minutes.

| Part | Content |
|---|---|
| חלק 1 — הגדרת השינוי | up to 2 domains from 5, then what the AI does / what stays human / what value it creates |
| חלק 2 — מיפוי הצוות | two lists: שגרירים and מתנגדים |
| חלק 3 — כיווני פעולה | 4 action fields plus a commitment sentence with two blanks |
| תוכנית פעולה | the nine output blocks, visualised and ready to copy |

### How its output is produced

The source document sets no constraints on the summary — this version is meant
to produce a plan, and the plan is the manager's own commitments. So
`assets/js/planning-engine.js` stays a restatement: it organises what was
entered under the nine headings and adds nothing. A blank stays visibly blank
(*"לא נמלא"*) rather than being filled in on the user's behalf, and a
half-finished commitment shows the gap rather than reading as complete.

### Its visualisation

- **חלוקת העבודה** — the AI side and the human side shown together, so an empty
  side is visible. This is the document's own central frame.
- **מפת הצוות** — one chip per person, the two groups counted separately. Fill
  rather than hue separates them: a colour that reads as good or bad is the
  wrong encoding for people.
- **תחומי השינוי** — the five domains with the chosen ones marked.

### Two deliberate departures from the source document

1. The document says *"כתבו את שמות חברי הצוות"*. The step carries one added
   line — *"אפשר לציין שם, תפקיד או פרופיל כללי"* — matching how version A's own
   spec handles the same question (§4: *"אין צורך לציין שם"*). Names still work;
   this only offers the alternative. Remove the `notice` in
   `viewTeam()` (`assets/js/planning-app.js`) to restore the document exactly.
2. The remove control on a person chip is a two-stroke inline SVG. The design
   system ships four icons and says not to substitute from an icon set; it also
   says interactive UI is new design work. This is the one glyph drawn for it.

---

---

## Saving the results

Both report screens end in the same four ways out: copy, a `.txt` file, a PDF
and a PNG. All four are produced in the browser and nothing is transmitted.

**PDF** opens the browser's print dialog, where *שמירה כ-PDF* is the
destination to choose. The print stylesheet in `app.css` is what the file looks
like, and the ratings table is opened for the duration of the print — a
collapsed `<details>` prints as nothing, and that table is the data the rest of
the report is drawn from. The document title carries the filename while the
dialog is up, which is what Chrome and Edge name the saved file after.

**PNG** is one long image of the report, laid out at 1080 px and rendered at
two device pixels per CSS pixel. The controls are left out, the ratings table
is opened, and the date it was produced is added at the foot.

Neither uses a library. The tool has to run on a closed network, and
`tools/build-single.mjs` fails the build on any external reference, so the usual
html-to-canvas and PDF packages are out. The two routes are therefore:

| | How |
|---|---|
| PDF | `window.print()`. The browser brings real text, correct Hebrew shaping and honest page breaks — all three of which a hand-written PDF writer would have to reimplement, and would get the bidi wrong. |
| PNG | The report's own markup inside an SVG `<foreignObject>`, drawn to a canvas. An SVG being rendered as an image may not reach outside itself for a file, so the stylesheet, the fonts and any images travel with it as data URIs. |

`assets/js/report-export.js` holds both, and three details in it are worth
knowing before changing it:

- **The image is always light-themed.** An exported report is a document that
  gets sent on or filed, and a document is on white. The dark rules are dropped
  on the way into the SVG rather than being rendered and inverted.
- **`html`, `body` and `:root` do not exist inside an SVG.** One wrapper stands
  in for all three, and every rule anchored on them is given a twin that targets
  it. Without that the report would lose its typography.
- **The height is measured in an iframe of the export's own width.** The type
  sizes and the gutter are clamped against `vw`, so they only come out at the
  size the image will use in a viewport that is the width the image will be.

The PNG route has been checked on the hosted pages and on the `dist/` build
opened from a file path, where the fonts and logos are already inlined and
nothing is fetched at all.

## Tests

```bash
node --test tests/*.test.mjs      # 27 tests
```

`tests/engine.test.mjs` holds version A's §8/§9 rules, including a 600-case
fuzz. `tests/planning-engine.test.mjs` holds version B's nine blocks, its
verbatim guarantee and its unfilled-field behaviour. `tests/report-export.test.mjs`
holds the two export decisions that are not the browser's job: which selectors
follow the report into the SVG, and what the saved file is called. CI runs all
three on every push.

## Deployment

Plain static files at the repository root, relative paths throughout, so it
works from any sub-path.

**GitHub Actions (recommended).** `.github/workflows/pages.yml` runs the tests
and then deploys on every push to `main`, or on manual dispatch.

Pages has to be switched on first, by hand, once: *Settings → Pages → Build and
deployment → Source: GitHub Actions*. Until that is done the `deploy` job fails
at `actions/configure-pages` with *"Get Pages site failed … Not Found"*. The
action's `enablement: true` does not stand in for it — creating a Pages site
needs repo-administration rights, which `GITHUB_TOKEN` does not carry, so it
fails with *"Resource not accessible by integration"*. After enabling, re-run
the workflow from the Actions tab or push to `main`.

**Deploy from a branch.** *Settings → Pages → Source: Deploy from a branch*,
pick the branch and `/ (root)`. `.nojekyll` is already present.

Either way the site lands at `https://<owner>.github.io/<repo>/`.

> A public repository produces a publicly reachable page. The pages set
> `robots: noindex, nofollow`, but that is a request to crawlers, not access
> control. For an internal-only deployment, host the built files behind the
> organisation's own authentication, or use the offline build below.

## Offline build

```bash
node tools/build-single.mjs      # -> dist/index.html, dist/mapping.html, dist/planning.html
```

Three self-contained HTML files with the styles, scripts, fonts and logos
inlined and **no external reference of any kind**. They sit side by side, so the
links between them still work. They open from a file path, a USB drive or a
network share, which is what a closed environment needs. The build fails if any
external reference survives, and fails if two modules bundled into the same page
declare the same top-level name.

## Local development

ES modules need a server; opening the pages from the filesystem will not work
(use the `dist/` build for that).

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

## Layout

```
index.html                     entry screen
mapping.html / planning.html   the two versions
assets/css/tokens.css          design tokens + self-hosted Assistant
assets/css/app.css             the UI, shared by all three pages
assets/js/dom.js               element builder
assets/js/text.js              free-text splitting, shared by both engines
assets/js/shell.js             storage, theme, app bar, fields, copy and .txt
assets/js/report-export.js     the PDF and PNG routes, shared by both versions
assets/js/content.js           version A content — the single source of truth
assets/js/engine.js            version A's summary engine (§8, §9) — pure, no DOM
assets/js/charts.js            version A's two chart views
assets/js/app.js               version A's steps and views
assets/js/planning-content.js  version B content
assets/js/planning-engine.js   version B's output builder — pure, no DOM
assets/js/planning-app.js      version B's steps, views and charts
assets/js/chooser.js           the entry screen
tests/                         both engines' rules as tests
tools/build-single.mjs         offline build
```

Changing wording means editing `content.js` or `planning-content.js` only.

## Privacy

Answers live in `localStorage` under `rafael-ai-readiness/v1` and
`rafael-ai-planning/v1`, and are never transmitted. The PDF and PNG exports are
built in the page and handed to the browser's own download, so they do not
change that. The font is self-hosted and
there is no analytics, no telemetry and no third-party request, so the pages
work unchanged on a closed network. *התחלה מחדש* on either opening screen clears
that version's store after a confirmation.

Version B collects names of team members if you enter them. They stay in the
browser like everything else, but they are the one piece of personal data either
tool holds — worth knowing before the output is pasted anywhere.

## Design

Built on the **Rafael LEAD AI** design system: `#0044E8` blue, `#00002C` navy,
`#F8FAFC` mist, Assistant at 400/600/700/800, square corners, no borders or
shadows, and the comet motif at its own sizes and rotations.

That system is a presentation template and states that it defines no interaction
states and no motion. These are therefore additions, marked as such in
`assets/css/tokens.css`:

1. **Type sizes are a web scale.** The template's 88px title and 36px body are
   slide measurements; the ratios between steps are kept.
2. **0.9 leading is kept for display type** — the system's strongest
   typographic signature — and relaxed for running body copy, which the
   template never sets.
3. **Interaction states, a second dark surface and a dark-ground accent.** On
   navy, `#0044E8` text sits at 1.56:1, so a lighter step of the same hue
   carries accent text there.

Motion is restrained and turns off under `prefers-reduced-motion`.

## Accessibility

Rating rows are real radio groups with roving focus, arrow keys, `Home`/`End`
and digit shortcuts. Light and dark themes are both authored rather than
inverted. The pages print to a clean report, which is also what *שמירה כ-PDF*
saves.
