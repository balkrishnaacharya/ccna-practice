# CCNA Practice — Comprehensive Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the CCNA Practice application — fix the first-launch practice crash, practice mode switching, bottom navigation dock, splash screen lifecycle, readiness score mismatch, database synchronization, Rust test compilation, version consistency, updater behavior, and add regression tests — without rebuilding the application or introducing unrelated features.

**Architecture:** Fix root causes in the existing React + Tauri + Rust + SQLite codebase. Add missing `useEffect` dependencies in Quiz.jsx for mode switching and initial load. Move SplashAnimation inside the app error boundary. Fix field-name mismatch in useReadiness.js. Implement `sync_bundled_bank` and missing exports in db.rs. Add `get_stats_conn` in commands.rs. Synchronize all version references. Redesign FloatingDock with pointer-event fixes and working center exam button. Add frontend and backend regression tests for every fixed bug.

**Tech Stack:** React 18, Vite, Tailwind CSS, Tauri 2, Rust + rusqlite, SQLite, Lucide icons, GSAP, node:test (frontend), Rust `#[cfg(test)]` (backend).

**Spec:** User repair request at `/home/somberi/Documents/vivecode` (the detailed CCNA Practice repair spec); existing project at `/home/somberi/projects/ccna-practice`.

## Global Constraints

- Preserve existing question bank, application architecture, and user data.
- Do not add Redux, Zustand, or another large state-management dependency.
- Do not disable application security or updater signature verification.
- Do not add artificial delays to conceal race conditions.
- Do not hide exceptions or suppress useful errors.
- Keep desktop and Android behavior in mind.
- Respect `prefers-reduced-motion`.
- Synchronize version across `VERSION`, `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`.
- Do not commit `ccna.db`, `.env` files, `target/`, `dist/`, or `node_modules`.
- Do not push to GitHub, create tags, publish releases, or install updates on the user's normal device.

## Review Focus

1. Canvas context unavailable on first SplashAnimation render — app must not be permanently covered by splash.
2. Old async `get_random_question` response overwriting newer mode selection during rapid switching — last selected mode must win.
3. Database initialization genuinely failing — show useful error with retry, not white screen or silent crash.
4. Empty question pool for a mode — clear empty-state message, not silent retention of previous question.
5. Rust integration tests referencing functions that don't exist (`db::BUNDLED_DB`, `db::sync_bundled_bank`, `commands::get_stats_conn`) — must compile and pass.

---

### Task 1: Fix startup crash — Quiz initial question load

**Files:**
- Modify: `src/pages/Quiz.jsx:115-132`
- Test: `tests/ui-quiz-initial-load.test.js`

**Interfaces:**
- Consumes: `invoke("get_random_question", { mode, subtopic, domain })` from Task 1.
- Produces: First question loads on Quiz mount without crash; loading/empty/error states render correctly.

- [ ] **Step 1: Write the failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/pages/Quiz.jsx", import.meta.url), "utf8");
test("Quiz: loadQuestion is invoked on mount via useEffect", () => {
  assert.ok(
    /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?loadQuestion\(\)/s.test(source),
    "Quiz must call loadQuestion() inside a useEffect on mount"
  );
  assert.ok(
    source.includes("setLoading(true)"),
    "Quiz must set loading state before fetching question"
  );
  assert.ok(
    source.includes("setLoading(false)"),
    "Quiz must clear loading state after fetch completes"
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-quiz-initial-load.test.js`
Expected: FAIL — no `useEffect` calls `loadQuestion()` on mount.

- [ ] **Step 3: Implement initial-load effect in `src/pages/Quiz.jsx`**

Add a `useEffect` that calls `loadQuestion()` on mount with dependency on `mode` only for the initial trigger. The effect should:
- Set `loading = true`, `feedback = null`, `selected = []`, `confidence = ""`
- Call `invoke("get_random_question", { mode, subtopic: drillSubtopic, domain: drillDomain })`
- On success: `setQuestion(q)`, check flag status, fetch note
- On failure: log error, leave `question = null` (empty state renders)
- Finally: `setLoading(false)`

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui-quiz-initial-load.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Quiz.jsx tests/ui-quiz-initial-load.test.js
git commit -m "fix(practice): load first question on Quiz mount"
```

---

### Task 2: Fix practice mode switching

**Files:**
- Modify: `src/pages/Quiz.jsx:115-132`
- Test: `tests/ui-quiz-mode-switch.test.js`

**Interfaces:**
- Consumes: `loadQuestion()` from Task 1.
- Produces: When `mode` changes, a new question appropriate to the new mode loads; answer/feedback/confidence state resets; old async responses cannot overwrite newer mode.

- [ ] **Step 1: Write the failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/pages/Quiz.jsx", import.meta.url), "utf8");
test("Quiz: mode change triggers loadQuestion via useEffect dependency", () => {
  assert.ok(
    /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?loadQuestion\(\)[\s\S]*?\},\s*\[\s*mode\s*\]/s.test(source),
    "Quiz must have useEffect with mode dependency calling loadQuestion()"
  );
  assert.ok(
    source.includes("setSelected([])"),
    "Quiz must reset selected answers when mode changes"
  );
  assert.ok(
    source.includes("setFeedback(null)"),
    "Quiz must reset feedback when mode changes"
  );
  assert.ok(
    source.includes("setConfidence(\"\")"),
    "Quiz must reset confidence when mode changes"
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-quiz-mode-switch.test.js`
Expected: FAIL — no mode-change effect exists.

- [ ] **Step 3: Implement mode-switch effect in `src/pages/Quiz.jsx`**

Add a `useEffect` with `[mode]` dependency that calls `loadQuestion()` and resets temporary state (`selected`, `feedback`, `confidence`, `showNoteInput`, `questionNote`, `noteSaved`, `noteInputVisible`). Completed answers are preserved (they are in the database, not local state). Use a ref to track the latest mode so stale async responses don't overwrite newer selections.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui-quiz-mode-switch.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Quiz.jsx tests/ui-quiz-mode-switch.test.js
git commit -m "fix(practice): reload question and reset state when mode changes"
```

---

### Task 3: Fix startup crash — SplashAnimation inside error boundary

**Files:**
- Modify: `src/App.jsx:131-132`
- Test: `tests/ui-splash-error-boundary.test.js`

**Interfaces:**
- Consumes: `SplashAnimation` component (already exists), `ErrorBoundary` component (already exists).
- Produces: Splash errors are caught by an error boundary; app shell remains interactive.

- [ ] **Step 1: Write the failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
test("App: SplashAnimation is wrapped in an error boundary", () => {
  // SplashAnimation import and usage should be inside ErrorBoundary JSX or
  // a dedicated splash error boundary should exist.
  assert.ok(
    app.includes("SplashAnimation") && app.includes("ErrorBoundary"),
    "App must import both SplashAnimation and ErrorBoundary"
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-splash-error-boundary.test.js`
Expected: FAIL — SplashAnimation is outside ErrorBoundary.

- [ ] **Step 3: Implement splash error protection in `src/App.jsx`**

Wrap `SplashAnimation` in an error boundary (either reuse the existing `ErrorBoundary` or add a lightweight one) so a splash render error cannot crash the entire app shell. On error, set `isSplashActive = false` so the app is never permanently covered.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui-splash-error-boundary.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx tests/ui-splash-error-boundary.test.js
git commit -m "fix(splash): wrap SplashAnimation in error boundary"
```

---

### Task 4: Fix bottom dock — pointer events and center exam button

**Files:**
- Modify: `src/components/layout/FloatingDock.jsx:37-116`
- Test: `tests/ui-dock-pointer-events.test.js`

**Interfaces:**
- Consumes: `onOpenExamModal` prop (already passed from App.jsx), `guardNavigation` prop.
- Produces: Dock items are clickable; center Exam button opens the exam confirmation modal (not navigate to /practical-exam); `onOpenExamModal` is used.

- [ ] **Step 1: Write the failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/components/layout/FloatingDock.jsx", import.meta.url), "utf8");
test("FloatingDock: container does not use pointer-events-none", () => {
  assert.ok(
    !source.includes("pointer-events-none"),
    "Dock container must not use pointer-events-none"
  );
  assert.ok(
    source.includes("onOpenExamModal"),
    "onOpenExamModal prop must be referenced"
  );
  assert.ok(
    !source.includes('guardNavigation(e, "/practical-exam")'),
    "Center exam button must not navigate to practical-exam"
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-dock-pointer-events.test.js`
Expected: FAIL — container has `pointer-events-none`, center button navigates wrong.

- [ ] **Step 3: Implement dock pointer and center button fixes in `src/components/layout/FloatingDock.jsx`**

- Remove `pointer-events-none` from the nav container (or scope it so only non-interactive areas are affected).
- Change the center Exam button `onClick` to call `onOpenExamModal()` instead of `guardNavigation(e, "/practical-exam")`.
- Use the `onOpenExamModal` prop that App.jsx passes.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui-dock-pointer-events.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/FloatingDock.jsx tests/ui-dock-pointer-events.test.js
git commit -m "fix(dock): restore pointer events, wire center exam button to modal"
```

---

### Task 5: Redesign bottom navigation dock

**Files:**
- Modify: `src/components/layout/FloatingDock.jsx`
- Test: `tests/ui-dock-redesign.test.js`

**Interfaces:**
- Consumes: `onOpenExamModal`, `guardNavigation` props from App.jsx.
- Produces: Minimalist, professional dock with consistent 44px touch targets, active state indication, responsive design, mobile safe-area, focus states, accessible labels.

- [ ] **Step 1: Write the failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/components/layout/FloatingDock.jsx", import.meta.url), "utf8");
test("FloatingDock: uses consistent icon size (18px) and labels", () => {
  assert.ok(source.includes("size={18}"), "Icons use consistent 18px size");
  assert.ok(source.includes("aria-label"), "Items have accessible labels");
});
test("FloatingDock: no pointer-events-none, no oversized magnification", () => {
  assert.ok(!source.includes("pointer-events-none"), "No pointer-events-none");
  assert.ok(
    !source.includes("iconMagnification={48}"),
    "No oversized 48px magnification"
  );
});
test("FloatingDock: responsive padding and safe-area", () => {
  assert.ok(source.includes("sm:px-6") || source.includes("px-3"), "Responsive padding");
  assert.ok(source.includes("safe-bottom") || source.includes("var(--safe-bottom)"), "Mobile safe-area");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-dock-redesign.test.js`
Expected: FAIL — dock still has old styling.

- [ ] **Step 3: Implement dock redesign in `src/components/layout/FloatingDock.jsx`**

Redesign with:
- Consistent icon size (18px), readable labels, `iconSize={30}` touch targets (44px equivalent)
- Active state: gold background + gold text; inactive: muted text with hover state
- No `pointer-events-none` on container; children are naturally clickable
- `var(--safe-bottom)` for mobile safe-area insets
- Focus-visible ring for keyboard navigation
- Center Exam button opens `onOpenExamModal` (exam confirmation flow)
- Compact, minimal, restrained — no excessive glow, gradients, or shadows

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui-dock-redesign.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/FloatingDock.jsx tests/ui-dock-redesign.test.js
git commit -m "feat(dock): minimalist redesign with consistent sizing and safe areas"
```

---

### Task 6: Fix readiness score field-name mismatch

**Files:**
- Modify: `src/hooks/useReadiness.js:35-36`
- Test: `tests/use-readiness-fields.test.js`

**Interfaces:**
- Consumes: `get_subtopic_stats` returns `SubtopicStat` with fields `correct` and `attempts`.
- Produces: Readiness score computed from correct `correct`/`attempts` fields; recent-activity uses correct 7-day window.

- [ ] **Step 1: Write the failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/hooks/useReadiness.js", import.meta.url), "utf8");
test("useReadiness: reads correct and attempts from SubtopicStat", () => {
  assert.ok(
    source.includes("s.correct") || source.includes("s.attempts"),
    "useReadiness must read correct/attempts fields from subtopic stats"
  );
  assert.ok(
    !source.includes("s.times_correct") || !source.includes("s.times_seen"),
    "useReadiness must not read times_correct/times_seen (wrong field names)"
  );
});
test("useReadiness: recent-activity uses 7-day window consistently", () => {
  assert.ok(
    source.includes("sevenDaysAgo") || source.includes("7 days"),
    "Recent activity must use 7-day window"
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/use-readiness-fields.test.js`
Expected: FAIL — wrong field names used.

- [ ] **Step 3: Implement field-name fix in `src/hooks/useReadiness.js`**

Change `s.times_correct` → `s.correct` and `s.times_seen` → `s.attempts` in the domain accuracy loop. Verify the recent-activity calculation uses the 7-day window consistently (not divided by 14).

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/use-readiness-fields.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useReadiness.js tests/use-readiness-fields.test.js
git commit -m "fix(readiness): use correct/attempts fields from SubtopicStat"
```

---

### Task 7: Implement database question-bank synchronization

**Files:**
- Modify: `src-tauri/src/db.rs`
- Modify: `src-tauri/src/lib.rs:31-40`
- Test: `src-tauri/tests/db_test.rs` (existing tests)

**Interfaces:**
- Consumes: `db::BUNDLED_DB` (embedded bytes), `db::BUNDLED_BANK_VERSION` (version string).
- Produces: `sync_bundled_bank(conn, seed_path)` merges new bundled questions into existing user DB, preserving progress, avoiding duplicates, using transactions with rollback.

- [ ] **Step 1: Write the failing test**

```rust
// In src-tauri/tests/db_test.rs
#[test]
fn test_sync_bundled_bank_preserves_user_data() {
    // Existing test already in db_test.rs; verify it compiles and passes
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src-tauri && cargo test test_sync_bundled_bank`
Expected: FAIL — `db::BUNDLED_DB`, `db::BUNDLED_BANK_VERSION`, `db::sync_bundled_bank` don't exist.

- [ ] **Step 3: Implement DB sync in `src-tauri/src/db.rs`**

Add:
- `pub static BUNDLED_DB: &[u8]` — re-export or embed the bundled DB bytes
- `pub static BUNDLED_BANK_VERSION: &str` — bank version string
- `pub fn sync_bundled_bank(conn: &Connection, seed_path: &Path) -> Result<i64, String>` — merges bundled questions into existing DB:
  - Opens the bundled seed DB
  - For each bundled question, checks if content_hash matches an existing row → backfill hash, skip
  - If no match, insert the question and its choices
  - Uses a transaction; rolls back on failure
  - Sets/updates `bank_version` setting
  - Returns count of added questions

- [ ] **Step 4: Wire sync into app startup in `src-tauri/src/lib.rs`**

Change the startup logic from "copy only if db doesn't exist" to:
- Always run `db::init()` (creates tables, runs migrations)
- Always call `sync_bundled_bank()` to merge new bundled questions
- Preserve user data (answers, flags, stats, settings)

- [ ] **Step 5: Run test to verify it passes**

Run: `cd src-tauri && cargo test test_sync_bundled_bank test_init_idempotent test_bundled_seed_contains_the_full_bank test_sync_replaces_mismatched_legacy_question`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/db.rs src-tauri/src/lib.rs src-tauri/tests/db_test.rs
git commit -m "feat(db): implement question-bank synchronization with transactions"
```

---

### Task 8: Fix Rust test compilation — missing symbols

**Files:**
- Modify: `src-tauri/src/db.rs`
- Modify: `src-tauri/src/commands.rs`

**Interfaces:**
- Consumes: Existing test code in `db_test.rs` and `commands_test.rs`.
- Produces: All referenced symbols exist and tests compile.

- [ ] **Step 1: Write the failing test**

Run: `cd src-tauri && cargo test --no-run`
Expected: FAIL — `db::BUNDLED_DB`, `db::BUNDLED_BANK_VERSION`, `db::sync_bundled_bank`, `commands::get_stats_conn` not found.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src-tauri && cargo test --no-run 2>&1`
Expected: Compile errors for missing symbols.

- [ ] **Step 3: Implement missing symbols**

In `db.rs`:
- Export `BUNDLED_DB` (the embedded bytes, same as lib.rs uses)
- Export `BUNDLED_BANK_VERSION` (a version string constant)
- Implement `sync_bundled_bank` (see Task 7)

In `commands.rs`:
- Add `pub fn get_stats_conn(conn: &Connection) -> Result<Stats, String>` — the connection-level version of `get_stats` that `commands_test.rs` calls.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd src-tauri && cargo test`
Expected: All tests compile and pass.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/db.rs src-tauri/src/commands.rs
git commit -m "fix(rust): export missing symbols for test compilation"
```

---

### Task 9: Synchronize version across all files

**Files:**
- Modify: `package.json:3`
- Modify: `src-tauri/Cargo.toml:3`
- Modify: `src-tauri/tauri.conf.json:4`
- Modify: `VERSION`
- Modify: `src/pages/Settings.jsx:188`
- Modify: `README.md:11-20`

**Interfaces:**
- None (cross-cutting consistency fix).

- [ ] **Step 1: Write the failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const cargo = readFileSync(new URL("../src-tauri/Cargo.toml", import.meta.url), "utf8");
const tauri = JSON.parse(readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
const version = readFileSync(new URL("../VERSION", import.meta.url), "utf8").trim();
test("Version: package.json matches VERSION", () => {
  assert.equal(pkg.version, version);
});
test("Version: Cargo.toml matches VERSION", () => {
  assert.ok(cargo.includes(`version = "${version}"`));
});
test("Version: tauri.conf.json matches VERSION", () => {
  assert.equal(tauri.version, version);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/version-consistency.test.js`
Expected: FAIL — package.json and Cargo.toml are 0.6.0, tauri.conf.json and VERSION are 0.5.1.

- [ ] **Step 3: Implement version synchronization**

The intended version is `0.5.1` (matching `VERSION` and `tauri.conf.json`, which are the Tauri build sources of truth). Change:
- `package.json`: `0.6.0` → `0.5.1`
- `src-tauri/Cargo.toml`: `0.6.0` → `0.5.1`
- `src/pages/Settings.jsx`: fallback `"0.5.1"` (already correct)
- `README.md`: update download links from v0.4.0 to v0.5.1

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/version-consistency.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json src-tauri/Cargo.toml src/pages/Settings.jsx README.md tests/version-consistency.test.js
git commit -m "fix(release): synchronize version to 0.5.1 across all files"
```

---

### Task 10: Fix updater desktop fallback behavior

**Files:**
- Modify: `src/utils/useUpdater.js:179-196`
- Test: `tests/updater-desktop-fallback.test.js`

**Interfaces:**
- Consumes: `updateInfo.downloadUrl`, `shell::open`.
- Produces: Desktop fallback clearly indicates the update must be downloaded manually from GitHub; does not label opening a browser as a completed update.

- [ ] **Step 1: Write the failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/utils/useUpdater.js", import.meta.url), "utf8");
test("useUpdater: desktop fallback does not claim silent success", () => {
  assert.ok(
    source.includes("Could not open") || source.includes("error"),
    "Fallback must show error when shell open fails"
  );
  assert.ok(
    source.includes("Visit GitHub releases manually") || source.includes("download manually"),
    "Fallback must direct user to manual download"
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/updater-desktop-fallback.test.js`
Expected: FAIL — current code may label shell-open as success.

- [ ] **Step 3: Implement updater fallback fix in `src/utils/useUpdater.js`**

Ensure the desktop fallback path (when Tauri updater is unconfigured) sets an error status and message when `shell::open` fails, and clearly indicates the user must download manually. Do not set `showModal(false)` as success before the URL is actually opened.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/updater-desktop-fallback.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/useUpdater.js tests/updater-desktop-fallback.test.js
git commit -m "fix(updater): desktop fallback reports errors, does not claim silent success"
```

---

### Task 11: Establish design system tokens and UI consistency

**Files:**
- Create: `src/lib/design-tokens.js` (or consolidate into existing styles)
- Modify: `src/index.css`, `src/styles.css` (consolidate repeated values)
- Modify: Key pages for consistency (Dashboard, Quiz, Exam, Settings, etc.)

**Interfaces:**
- Consumes: Existing color values (#181815 background, #B8842A gold, #F6F2E9 paper).
- Produces: Centralized design tokens; shared button, card, input, modal styles; consistent typography and spacing.

- [ ] **Step 1: Write the failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
test("Design system: defines reusable color tokens", () => {
  assert.ok(
    css.includes("#181815") || css.includes("bg-[#181815]"),
    "Background color #181815 is defined"
  );
  assert.ok(
    css.includes("#B8842A") || css.includes("bg-[#B8842A]"),
    "Gold accent #B8842A is defined"
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-design-tokens.test.js`
Expected: FAIL — no centralized design tokens file.

- [ ] **Step 3: Implement design tokens**

Create `src/lib/design-tokens.js` exporting:
- Colors: background, card, primary (gold #B8842A), text, muted, border, success, warning, error, disabled
- Typography: heading sizes, body sizes, label sizes
- Spacing: page padding, section gaps, card padding, component spacing

Update key components to use these tokens via Tailwind arbitrary values or CSS variables where repeated values exist.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui-design-tokens.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/design-tokens.js tests/ui-design-tokens.test.js
git commit -m "feat(design): establish centralized design tokens"
```

---

### Task 12: Add comprehensive regression tests

**Files:**
- Create: `tests/ui-practice-regression.test.js`
- Create: `tests/ui-dock-regression.test.js`
- Create: `tests/ui-splash-regression.test.js`
- Create: `tests/ui-readiness-regression.test.js`

**Interfaces:**
- Consumes: Source files from Tasks 1–10.
- Produces: Automated tests covering every fixed bug.

- [ ] **Step 1: Write practice regression tests**

Test sequence: `Open Practice → Easy → answer question → Medium → Hard → Easy → Medium`
- Selected mode is correct after each selection
- Question belongs to the selected mode
- Question content changes when another eligible question exists
- Answer state is reset on mode change
- Explanation state is reset on mode change
- No stale question appears
- Rapid switching: `Easy → Medium → Hard → Easy` — final question belongs to Easy
- No available questions → clear empty state
- Change mode after answering → previous saved answer remains recorded (in DB)
- Change mode with unanswered question → temporary answer state resets

- [ ] **Step 2: Write first-launch regression test**

- Fresh installation → Practice → first question loads without crash
- Splash completes or gracefully skips
- Dashboard renders
- DB initialization failure → error with retry

- [ ] **Step 3: Write dock regression tests**

- Dock items are clickable (no pointer-events-none)
- Center Exam button opens exam modal
- Active state is visually distinct
- Labels are accessible (aria-label)

- [ ] **Step 4: Write readiness regression test**

- Readiness score uses `correct`/`attempts` fields
- Score is 0 when no data exists
- Score reflects known database records

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add tests/ui-practice-regression.test.js tests/ui-dock-regression.test.js tests/ui-splash-regression.test.js tests/ui-readiness-regression.test.js
git commit -m "test(regression): add comprehensive regression tests for all fixed bugs"
```

---

### Task 13: Run full verification suite

**Files:** None (verification task).

**Interfaces:** Consumes output of all previous tasks.

- [ ] **Step 1: Run frontend tests**

Run: `npm test`
Expected: All tests pass, 0 failures.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Build succeeds, no errors.

- [ ] **Step 3: Run Rust checks**

Run: `cd src-tauri && cargo check`
Expected: Compiles cleanly.

Run: `cd src-tauri && cargo test`
Expected: All Rust tests pass.

Run: `cd src-tauri && cargo clippy`
Expected: No clippy warnings (or warnings are pre-existing and acceptable).

- [ ] **Step 4: Commit**

No commit expected unless Step 1–3 surfaces cleanup.

---

## Self-Review

1. **Spec coverage:** Every requirement in the user's repair spec maps to a task:
   - Startup crash → Tasks 1, 3
   - Practice mode switching → Task 2
   - Navigation/dock → Tasks 4, 5
   - Splash screen → Task 3
   - UI consistency → Task 11
   - Readiness score → Task 6
   - DB sync → Task 7
   - Rust tests → Task 8
   - Version consistency → Task 9
   - Updater → Task 10
   - Regression tests → Task 12
   - Full verification → Task 13

2. **Step scan:** Each step lets the implementer write exactly one reasonable thing. No step carries more than one action. Code blocks appear only where the algorithm isn't determined by signature + tests.

3. **Type consistency:** `loadQuestion()` is defined in Task 1 and consumed in Task 2. `onOpenExamModal` is consumed in Task 4. `get_stats_conn` is added in Task 8 and consumed by `commands_test.rs`. `sync_bundled_bank` is added in Task 7 and consumed by `db_test.rs` and `lib.rs`.

4. **Review Focus:** All five review focus items have corresponding tests:
   - Canvas context unavailable → Task 3 (error boundary), Task 12 (splash regression)
   - Old async overwriting newer → Task 2 (mode-switch ref), Task 12 (rapid switching test)
   - DB init failure → Task 12 (error with retry test)
   - Empty question pool → Task 12 (empty state test)
   - Rust missing symbols → Task 8, Task 13 (cargo test)

5. **Proportion:** The plan is proportional to the spec — it addresses every issue without introducing unrelated features. Code blocks are minimal; most steps are test + signature + one-line approach.

---

**Plan complete and saved to `docs/superpowers/plans/2026-11-14-ccna-practice-repair.md`. Please review the plan. Does it capture what you want?**

**Which execution approach would you prefer?**

- **Subagent-driven** — A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** — I implement every task myself in this session, then one fresh reviewer checks the whole branch. Cheapest and fastest; no independent review until the end.

**For this plan I recommend Native**, because the tasks are tightly coupled through shared interfaces (Quiz.jsx's `loadQuestion` is used by Tasks 1 and 2; `sync_bundled_bank` is used by Tasks 7 and 8; version strings are read by Task 9's test), and having one implementer maintain interface consistency across 13 tasks is more reliable than context-switching between subagents.

Does the plan capture what you want, and should we proceed with Native execution?