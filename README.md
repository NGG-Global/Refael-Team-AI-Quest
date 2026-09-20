# מיפוי מוכנות להטמעת AI — Rafael

A diagnostic mapping tool that produces a distilled picture of a manager's and
a unit's starting point for AI adoption. The output is written to be pasted
straight into Copilot, which is where the next stage — challenge, focus,
and a plan — actually happens. The tool itself stops before that line.

Built to the specification *"אפיון למפתח | כלי מיפוי מוכנות להטמעת AI – רפאל"*.
Section references below (§1–§11) point at that document.

**Hebrew, right-to-left. No build step. No dependencies. No network calls.**

---

## What it does

Four input steps, then a result:

| Step | Content | Spec |
|---|---|---|
| ממד א׳ — הצוות שלי | 7 rated statements, 3 open questions | §4 |
| ממד ב׳ — אני כמנהל/ת | 7 rated statements, 2 open questions | §5 |
| ממד ג׳ — העבודה שלנו | 5 rated statements | §6 |
| תהליך עבודה | environment branch (ייצור / פיתוח / מטה-אחר) plus 4 open fields | §7 |
| תמונת מצב | the distilled output, visualised and ready to copy | §8, §10 |

The environment question changes one framing prompt; the four fields that follow
are the same for everyone, so there is one questionnaire rather than three.

## How the output is produced

`assets/js/engine.js` is a deterministic, rule-based module. There is no model
in the loop — every line it emits is either a factual restatement of what the
user rated, or the user's own words reproduced unchanged and regrouped under the
right heading. The §9 rules are implemented as follows:

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

Run the rules as tests:

```bash
node --test tests/engine.test.mjs
```

## Visualisation

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

## Deployment

The site is plain static files at the repository root, with relative paths
throughout, so it works from any sub-path.

**GitHub Actions (recommended).** `.github/workflows/pages.yml` runs the engine
tests and then deploys on every push to `main`, or on manual dispatch.

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

> A public repository produces a publicly reachable page. The page sets
> `robots: noindex, nofollow`, but that is a request to crawlers, not access
> control. For an internal-only deployment, host the built file behind the
> organisation's own authentication, or use the offline build below.

## Offline single-file build

```bash
node tools/build-single.mjs      # -> dist/index.html
```

Produces one HTML file with the styles, scripts, fonts and logos inlined and
**no external reference of any kind**. It opens from a file path, a USB drive or
a network share, which is what a closed environment needs. The build fails if
any external reference survives.

## Local development

ES modules need a server; opening `index.html` from the filesystem will not work
(use `dist/index.html` for that).

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

## Layout

```
index.html                  page shell, RTL
assets/css/tokens.css       design tokens + self-hosted Assistant
assets/css/app.css          the UI
assets/js/content.js        all questionnaire content — the single source of truth
assets/js/engine.js         the summary engine (§8, §9) — pure, no DOM
assets/js/charts.js         the two chart views
assets/js/dom.js            element builder
assets/js/app.js            state, steps, persistence, export
tests/engine.test.mjs       the §8/§9 rules as tests
tools/build-single.mjs      offline single-file build
```

Changing wording means editing `assets/js/content.js` only. Statement `label`
fields are the short names used in charts and in the distilled output; they name
what a statement measures and add no judgement to it.

## Privacy

Answers live in `localStorage` under `rafael-ai-readiness/v1` and are never
transmitted. The font is self-hosted and there is no analytics, no telemetry and
no third-party request, so the page works unchanged on a closed network. The
footer states this, and *התחלה מחדש* on the opening screen clears the store
after a confirmation.

## Design

Built on the **Rafael LEAD AI** design system: `#0044E8` blue, `#00002C` navy,
`#F8FAFC` mist, Assistant at 400/600/700/800, square corners, no borders or
shadows, and the comet motif at its own sizes and rotations.

That system is a presentation template and states that it defines no interaction
states and no motion. Three things here are therefore additions, and are marked
as such in `assets/css/tokens.css`:

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
inverted. The page prints to a clean report.
