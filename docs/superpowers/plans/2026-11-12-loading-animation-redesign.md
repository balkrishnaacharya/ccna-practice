# Loading Animation Redesign & Smoother Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the multi-stage 2.4s SplashSequence loading animation with a single orchestrated ~600ms reveal, and retune remaining UI animations (Quiz feedback pulse, bottom nav pill) for smoother feel per GSAP performance guidance.

**Architecture:** SplashSequence becomes a single GSAP timeline: logo mark scales up + title fades in together, then fades out in one motion. No geometric shape sequence, no `uppercase tracking-widest`, no italic single-word accent. Feedback pulse and pill follow ease softened from `power2.out` to `power1.out`. Mesh blobs verified compositor-only (no change needed).

**Tech Stack:** React 18, GSAP 3, Tailwind, Vite, Tauri 2.

**Spec:** Inline plan below (spec = brief). Previous UI refinement spec at `docs/superpowers/specs/2026-11-12-ui-refinement.md` is complete and not modified here.

## Global Constraints

- `prefers-reduced-motion` must be respected (splash skipped, motion disabled).
- Safety timeout must remain so the app is never permanently blocked (~2400ms).
- All `data-tour` attributes must remain intact (tour tests reference them).
- Animations use transform + opacity only (compositor), per gsap-performance.
- No network calls, no auth, local-first (per AGENTS.md).

## Review Focus

1. Splash never permanently blocks app (safety timeout intact) — Task 1.
2. `prefers-reduced-motion` skips splash and disables motion — Task 1 + styles.css already handles mesh.
3. All `data-tour` attributes preserved after SplashSequence rewrite — Task 1 test.
4. Only transform/opacity animated (no layout properties) — Tasks 1–3.
5. Full test suite green after all changes — Task 5.

---
### Task 1: Redesign SplashSequence as single-moment reveal

**Files:**
- Modify: `src/components/SplashSequence.jsx`
- Test: `tests/ui-splash.test.js`

**Interfaces:**
- Consumes: `onComplete` callback prop (unchanged).
- Produces: rewritten SplashSequence with single timeline, same `shouldRender`/`sessionStorage` gating.

- [ ] **Step 1: Write failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/components/SplashSequence.jsx", import.meta.url), "utf8");
test("Splash: single orchestrated timeline, no multi-stage sequence", () => {
  assert.ok(!source.includes("addLabel"), "No addLabel stage labels (single moment)");
  assert.ok(!source.includes("uppercase tracking-widest"), "No tracked-out caps label");
  assert.ok(!source.includes("italic text-gold"), "No italic single-word accent");
  assert.ok(source.includes("sessionStorage.setItem(\"ccna_splash_seen\""), "Safety gating preserved");
  assert.ok(source.includes("setTimeout"), "Safety timeout preserved");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-splash.test.js`
Expected: FAIL — SplashSequence still has addLabel/uppercase/italic.

- [ ] **Step 3: Implement single-moment reveal in SplashSequence.jsx**

Replace the 4-stage timeline (texts/shapes/fuse/reveal) with one timeline: captions + logo scale up together (~0.5s), then container fades out (~0.3s). Keep `prefers-reduced-motion` check, safety timeout, `onComplete`, `ref`s for container/logo/iris/captions. Remove square/circle shape refs and `uppercase tracking-widest`/`italic text-gold` classes.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui-splash.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SplashSequence.jsx tests/ui-splash.test.js
git commit -m "refine(ui): SplashSequence single-moment reveal, remove generic-default tells"
```

### Task 2: Smooth Quiz feedback pulse ease

**Files:**
- Modify: `src/pages/Quiz.jsx`
- Test: `tests/ui-feedback-ease.test.js`

**Interfaces:**
- Consumes: `feedback` state (unchanged).
- Produces: feedback pulse uses `power1.out` instead of `power2.out`.

- [ ] **Step 1: Write failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/pages/Quiz.jsx", import.meta.url), "utf8");
test("Quiz feedback: pulse uses power1.out ease", () => {
  assert.ok(source.includes('ease: "power1.out"'), "Feedback pulse eased to power1.out");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-feedback-ease.test.js`
Expected: FAIL — still `power2.out`.

- [ ] **Step 3: Implement ease change**

Change both `gsap.fromTo(... duration: 0.2, ease: "power2.out" ...)` and the incorrect-pulse `duration: 0.15, ease: "power2.out"` to `ease: "power1.out"` (gentler confirm feel). Keep `force3D: true`, durations unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui-feedback-ease.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Quiz.jsx tests/ui-feedback-ease.test.js
git commit -m "refine(ui): Quiz feedback pulse ease power1.out for smoother confirm"
```

### Task 3: Smooth bottom nav pill ease

**Files:**
- Modify: `src/components/FloatingBottomNav.jsx`
- Test: `tests/ui-nav-ease.test.js`

**Interfaces:**
- Consumes: `location.pathname` (unchanged).
- Produces: pill GSAP `ease` changed from `power2.out` to `power1.out`.

- [ ] **Step 1: Write failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/components/FloatingBottomNav.jsx", import.meta.url), "utf8");
test("Bottom nav pill: ease uses power1.out", () => {
  assert.ok(source.includes('ease: "power1.out"'), "Pill follow eased to power1.out");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-nav-ease.test.js`
Expected: FAIL — still `power2.out`.

- [ ] **Step 3: Implement ease change**

Change the pill `gsap.to(pillEl, { ..., ease: "power2.out", ... })` to `ease: "power1.out"`. Keep duration 0.25, transform-only (x/y/opacity), force3D.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui-nav-ease.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/FloatingBottomNav.jsx tests/ui-nav-ease.test.js
git commit -m "refine(ui): bottom nav pill follow ease power1.out for smoother navigation"
```

### Task 4: Verify mesh blobs are performant (confirm no change needed)

**Files:**
- Read-only: `src/components/OrganicMeshBackground.jsx`, `src/styles.css`

**Interfaces:** None (verification task).

- [ ] **Step 1: Verify mesh uses transform-only + will-change**

Confirm `src/styles.css` mesh animations use `transform: translate3d/rotate/scale` + `will-change: transform`, durations 28s/34s/40s `ease-in-out`, paused on `visibility: hidden` via `prefers-reduced-motion` and `document.hidden`. No code change — document finding in ledger.

- [ ] **Step 2: Record ledger note**

`Task 4: mesh blobs already compositor-only and performant; no change required.`

### Task 5: Final whole-branch review & suite

**Files:** None (review task).

**Interfaces:** Consumes output of Tasks 1–4.

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: all tests pass (46 existing + 3 new = 49), no failures.

- [ ] **Step 2: Verify no generic-default tells remain in scoped files**

Grep `src/components/SplashSequence.jsx`, `src/pages/Quiz.jsx`, `src/components/FloatingBottomNav.jsx` for `→`, `uppercase tracking-widest`, `uppercase tracking-wider`, `italic text-gold`, `addLabel`, `power2.out` (in splash/feedback/pill).

- [ ] **Step 3: Commit any leftover and finalize**

No commit expected unless Step 2 surfaces a cleanup.

---
Pre-flight: Tasks 1–3 each modify a distinct file (SplashSequence.jsx, Quiz.jsx, FloatingBottomNav.jsx) — no shared interfaces. Task 4 is read-only verification. Task 5 consumes all. Pre-flight: no shared interfaces.
