# CCNA Practice 2.0 — UI Refinement Plan (Approach A)

## Context / intent

Refine the CCNA Practice 2.0 Tauri + React + Tailwind UI by removing generic AI-default
tells (tracked-out ALL-CAPS labels, `→` on buttons, single-word accent in headlines,
fade-in-on-every-card, identical SaaS-card kit with gradient washes, monospace small labels)
and spending the boldness in exactly one place: the question card reimagined as a network
packet header + console stem (mono metadata fields, hairline rule layer boundary, serif stem).

Keep the established brand equity: dark canvas + warm paper text + Georgia serif headings +
gold surgical accent. No new color system, no new typefaces, no new screens.

## Global constraints

- Stack: React + Vite + Tailwind, no component libraries, raw JSX/Tailwind classes only.
- Platforms: Windows, Linux, Android. Android one-handed bottom nav must stay functional.
- No network, no auth, local SQLite only (per AGENTS.md).
- `prefers-reduced-motion` respected; keyboard-first answering (1–4, Enter) preserved.
- All existing `data-tour` attributes must remain intact (tour tests reference them).
- One bold element only (the question card frame); everything else quiet.

## Tasks

### Task 1: Palette & token cleanup — refined dark chassis colors

Update `tailwind.config.js` color map to the refined palette: chassis `#0E1118` (base
canvas), panel `#171D25` (raised surface), ink `#E8EEF5` (primary text), muted `#7C8A97`
(secondary text), surgical gold `#C9A227` (surgical accent only). Update `App.jsx` root
and `index.html` body to use `dark:bg` / `text-ink`. Remove gradient wash classes
(`bg-gold/10`, `blur-3xl` blobs) from Dashboard hero.

RED: Write a test that parses `tailwind.config.js` and asserts the new color keys exist
(`dark.bg`, `dark.panel`, `text.ink`, `text.muted`, `accent.gold`) and that legacy gradient
wash tokens are gone. Watch it fail.
GREEN: Edit `tailwind.config.js` colors; update `App.jsx` root div and `index.html` body
classes; remove gradient blob divs from Dashboard hero.
Expected: `node --test tests/ui-palette.test.js` passes; all color keys present, gradient
wash classes absent from source.

Interfaces: Task 2 consumes `dark.bg`/`dark.panel` from Task 1.

### Task 2: Remove generic-default tells from Dashboard

Remove from `Dashboard.jsx`: ALL-CAPS `tracking-wider uppercase` labels, `→` on button
text, monospace small data labels, hover-on-every-card transitions, fade-in-on-every-section
GSAP entrances (ScrollTrigger on `.domain-row`), identical-card kit (every stat card
`rounded-2xl` + `shadow-dock`). Differentiate stat cards by hierarchy instead of making
them identical. Left-align labels, sentence case.

RED: Write a test that scans `Dashboard.jsx` and asserts: no `uppercase tracking-wider`
on labels, no `→` in button text, no `shadow-dock` + `rounded-2xl` identical combo on all
cards, no `ScrollTrigger` import/use for section entrances. Watch it fail.
GREEN: Edit `Dashboard.jsx` — replace uppercase labels with sentence-case sans text, remove
`→` from buttons, replace mono data labels with sans, remove ScrollTrigger parallax from
domain rows, differentiate stat cards by accent/hierarchy.
Expected: `node --test tests/ui-dashboard.test.js` passes; all generic-default patterns
absent; `data-tour` attributes preserved.

Interfaces: Produces cleaned Dashboard markup consumed by nothing else (leaf task).

### Task 3: Remove generic-default tells from Quiz

Remove from `Quiz.jsx`: `→` on "Next Question" button, ALL-CAPS `tracking-wider uppercase`
on mode pills and choice labels, monospace small labels (accuracy %, question counts),
hover-on-every-card choice transitions. Confidence labels to sentence case. Keep keyboard
answering (1–4, Enter) and feedback pulses (action-driven motion).

RED: Write a test that scans `Quiz.jsx` and asserts: no `→` in any button text, no
`uppercase tracking-wider` on pills/labels, no `accent-gold` on unchecked radio mono rings,
no hover transition on every choice card. Watch it fail.
GREEN: Edit `Quiz.jsx` — sentence-case labels, remove `→`, sans data labels, remove
choice-card hover transitions, keep submit/next feedback pulses.
Expected: `node --test tests/ui-quiz.test.js` passes; generic-default patterns absent;
keyboard shortcuts (`1`–`4`, Enter) still present in keydown handler.

Interfaces: Produces cleaned Quiz markup (leaf task).

### Task 4: Question card as packet/console frame (the bold element)

Reimagine the Quiz question card: narrow left frame border (gold surgical accent), hairline
rule separating metadata (domain, difficulty, number) from the serif stem, mono metadata
fields left-aligned, serif stem left-aligned < 80ch. This is the single bold element; no
gradient washes, no identical-card treatment.

RED: Write a test that asserts the question card container has a left frame border class
(e.g. `border-l-4` or `border-l-gold`), a hairline rule divider between metadata and stem,
and mono metadata fields. Watch it fail.
GREEN: Edit `Quiz.jsx` question card JSX — add `border-l-4 border-gold` frame, hairline
rule (`border-b` / `border-dark-borderSubtle`) under metadata block, mono metadata spans,
serif stem left-aligned.
Expected: `node --test tests/ui-question-frame.test.js` passes; frame border, hairline
rule, mono metadata all present.

Interfaces: Task 4's frame classes must not conflict with Task 3's removals (both edit
`Quiz.jsx`; coordinate class names).

### Task 5: Clean up GSAP animations — action-driven motion only

Remove non-user-triggered section entrances: Dashboard `useGSAP` ScrollTrigger on
`.domain-row` (fade-and-slide-up on each card), hero `fromTo` entrance. Keep action-driven
motion: Quiz feedback pulses (submit → reveal), bottom nav pill follow (user taps nav).
Respect `prefers-reduced-motion`.

RED: Write a test that asserts `ScrollTrigger` is not imported/used for section entrances in
`Dashboard.jsx`, and that `useGSAP` in `Quiz.jsx` only wraps feedback (not question load
entrances). Watch it fail.
GREEN: Edit `Dashboard.jsx` — remove ScrollTrigger block and hero `fromTo` entrance (keep
StreakPanel if it has its own motion). Edit `Quiz.jsx` — keep only feedback pulse
`useGSAP`, remove question-load `useEffect` GSAP slide. Ensure `prefers-reduced-motion`
media query disables mesh blobs (already in styles.css).
Expected: `node --test tests/ui-gsap.test.js` passes; no ScrollTrigger section entrances;
action-driven feedback pulses remain.

Interfaces: Task 5 overlaps Task 2 on `Dashboard.jsx` ScrollTrigger removal — coordinate so
Task 2 removes the import and Task 5 asserts it's gone.

### Task 6: Simplify bottom nav active state

Simplify `FloatingBottomNav.jsx`: remove ALL-CAPS `tracking-wider` on the central "Exam"
label (sentence case), simplify the active pill (remove duplicate border/glow layers), keep
the transform-only pill follow motion. Keep icons + labels sentence case.

RED: Write a test that asserts nav labels are sentence case (no `uppercase`), the central
Exam label is sentence case, and the pill uses transform-only motion (no `width`/`height`
tweening). Watch it fail.
GREEN: Edit `FloatingBottomNav.jsx` — sentence-case labels, simplify pill classes, keep
`gsap.to` on `x`/`y` only.
Expected: `node --test tests/ui-nav.test.js` passes; labels sentence case; pill transform-only.

Interfaces: Leaf task; no other task touches `FloatingBottomNav.jsx`.

### Task 7: Final whole-branch review & suite

Run the full test suite (`npm test`), verify all UI tests pass, confirm `data-tour`
attributes intact (tour tests still green), review diff for leftover generic-default tells.
No code changes unless a finding surfaces.

RED: n/a (review task).
GREEN: Run `npm test`; all tests pass.
Expected: Full suite green; no `→` or `uppercase tracking-wider` remain in source.

Interfaces: Consumes output of Tasks 1–6; verifies nothing broke.

## Interfaces pre-flight scan

| Tasks | Shared interface | Finding |
|-------|-----------------|---------|
| Task 2 → Task 5 | `Dashboard.jsx` ScrollTrigger removal | Task 2 removes ScrollTrigger import/use for domain rows; Task 5 asserts absence. No conflict — Task 2 does the removal, Task 5 verifies. |
| Task 3 → Task 4 | `Quiz.jsx` question card classes | Task 3 removes generic classes (hover transitions, uppercase); Task 4 adds frame classes. Coordinate class names so Task 4's `border-l-4 border-gold` doesn't get stripped by Task 3's hover-removal. |
| Task 1 → Tasks 2–6 | Color tokens (`dark.bg`, `dark.panel`, `accent.gold`) | Task 1 defines tokens; Tasks 2–6 use them. Task 1 must complete before any task that references new token names. |

Pre-flight: no other shared interfaces. Task ordering: 1 → 2 → 3 → 4 → 5 → 6 → 7.
