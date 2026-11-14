# Splash Animation — "The Five Domains Converge" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `SplashSequence.jsx` with `SplashAnimation.jsx` — a Canvas 2D + GSAP loading animation (~5.4s first launch, ~2s subsequent) with no text/logo/letters/numerals: five luminous nodes of distinct geometry and orbit speed, hairline links routing between them, gold packets of light traveling links, one self-healing failover reroute, collapse into a glowing ring that dissolves into a radial bloom revealing the Dashboard.

**Architecture:** Single GSAP timeline with labels orchestrating a Canvas 2D render loop. `prefers-reduced-motion` → 600ms fade bloom → `onComplete`. Click/tap/Enter/Escape → immediate `onComplete`. `sessionStorage` gates first-launch vs shortened re-launch. Proper `useEffect` cleanup (`tl.kill()`, cancel rAF, remove listeners).

**Tech Stack:** React 18, GSAP 3, Canvas 2D, Tailwind, Vite, Tauri 2. No TypeScript (project uses `.jsx`, no TS installed).

**Spec:** Inline plan below (brief = spec). Previous UI refinement specs at `docs/superpowers/specs/` are complete and not modified here.

## Global Constraints

- `prefers-reduced-motion` respected (600ms fade bloom, then onComplete).
- Safety: click/tap/Enter/Escape skips straight to Dashboard via onComplete.
- `devicePixelRatio` capped at 2; no per-frame allocations; ~60fps on mid-range Android.
- Responsive: scale by shorter viewport side; works portrait/landscape.
- Canvas 2D or inline SVG only; no external assets, fonts, CDNs, or network calls.
- No new heavy dependencies; GSAP already installed.
- Tunables (colors, durations, node sizes) in one CONFIG object at top of component.
- All `data-tour` attributes elsewhere preserved (not touched by splash).
- `onComplete` callback contract preserved so App.jsx can mount Dashboard.

## Review Focus

1. Splash never permanently blocks app (skip + safety path intact) — Task 2.
2. `prefers-reduced-motion` skips sequence, plays 600ms fade, calls onComplete — Task 2.
3. No text/logo/letters/numerals render anywhere in SplashAnimation — Task 1 test.
4. Only transform/opacity/canvas draw calls animated (compositor-friendly) — Tasks 1–2.
5. Full test suite green + Vite build + Rust `cargo check` after all changes — Task 4.

---
### Task 1: SplashAnimation Canvas render engine

**Files:**
- Create: `src/components/SplashAnimation.jsx`
- Test: `tests/ui-splash-animation.test.js`

**Interfaces:**
- Consumes: `onComplete` callback prop.
- Produces: SplashAnimation component with Canvas 2D + GSAP timeline, CONFIG tunables, five node geometries, hairline links, packet travel, failover reroute, ring collapse, bloom fade.

- [ ] **Step 1: Write failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/components/SplashAnimation.jsx", import.meta.url), "utf8");
test("SplashAnimation: Canvas 2D engine with CONFIG tunables", () => {
  assert.ok(source.includes("CONFIG"), "CONFIG object present");
  assert.ok(source.includes("#0E1118") || source.includes("chassis"), "chassis color #0E1118");
  assert.ok(source.includes("gold") || source.includes("#BD8D39"), "gold accent");
  assert.ok(source.includes("<canvas"), "canvas element rendered");
  assert.ok(!source.includes("<text") && !source.includes("<h"), "no text/logo elements");
  assert.ok(source.includes("gsap.timeline"), "GSAP timeline used");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-splash-animation.test.js`
Expected: FAIL — SplashAnimation.jsx does not exist yet.

- [ ] **Step 3: Implement SplashAnimation.jsx**

Create Canvas 2D component:
- CONFIG: chassis `#0E1118`, gold `#BD8D39`/fallback `#D4AF37`, warm paper `#F2EBDD`, cool blue `#4A6FA5`
- Five nodes: hexagon, rounded square, triangle, circle, diamond — distinct orbit speeds sized to exam weighting
- Hairline links via `stroke-dashoffset` reveal one at a time
- Gold packets travel links with custom easing
- One link flickers/reroutes (self-healing failover) then settles
- Nodes pull together, links tighten to single ring, ring dissolves to radial bloom
- `devicePixelRatio` capped at 2; no per-frame allocations
- Responsive: scale by `Math.min(width, height)`
- GSAP timeline with labels orchestrating 0.0–4.8s sequence
- `useEffect` cleanup: `tl.kill()`, cancel animation frame, remove listeners

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui-splash-animation.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SplashAnimation.jsx tests/ui-splash-animation.test.js
git commit -m "feat(ui): SplashAnimation Canvas 2D five-domain reveal engine"
```

### Task 2: Lifecycle & skip behavior

**Files:**
- Modify: `src/components/SplashAnimation.jsx`
- Test: `tests/ui-splash-lifecycle.test.js`

**Interfaces:**
- Consumes: `onComplete` callback prop (from Task 1).
- Produces: `prefers-reduced-motion` path, skip handlers, sessionStorage gating.

- [ ] **Step 1: Write failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/components/SplashAnimation.jsx", import.meta.url), "utf8");
test("SplashAnimation: prefers-reduced-motion skip path", () => {
  assert.ok(source.includes("prefers-reduced-motion"), "respects reduced motion");
  assert.ok(source.includes("600"), "600ms fade duration");
});
test("SplashAnimation: skip on interaction", () => {
  assert.ok(source.includes("click") || source.includes("pointerdown"), "click/tap skip");
  assert.ok(source.includes("Enter") || source.includes("keydown"), "Enter skip");
  assert.ok(source.includes("Escape") || source.includes("keydown"), "Escape skip");
});
test("SplashAnimation: sessionStorage gating", () => {
  assert.ok(source.includes("sessionStorage"), "sessionStorage gating present");
  assert.ok(source.includes("ccna_splash"), "ccna_splash storage key");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-splash-lifecycle.test.js`
Expected: FAIL — lifecycle not implemented.

- [ ] **Step 3: Implement lifecycle**

- `window.matchMedia("(prefers-reduced-motion: reduce)")` → 600ms fade bloom → `onComplete`
- `pointerdown`, `keydown` (Enter/Escape) → immediate `onComplete`
- `sessionStorage.getItem("ccna_splash_seen")` → first launch full 5.4s, subsequent 2s (steps 1, 4, 5)
- Set `sessionStorage.setItem("ccna_splash_seen", "true")` on complete

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui-splash-lifecycle.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SplashAnimation.jsx tests/ui-splash-lifecycle.test.js
git commit -m "feat(ui): SplashAnimation lifecycle skip & reduced-motion paths"
```

### Task 3: Wire into App.jsx

**Files:**
- Modify: `src/App.jsx`
- Delete: `src/components/SplashSequence.jsx`
- Test: `tests/ui-splash-wiring.test.js`

**Interfaces:**
- Consumes: `SplashAnimation` component (Task 1–2 output).
- Produces: App.jsx using SplashAnimation with `onComplete`; SplashSequence removed.

- [ ] **Step 1: Write failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
test("App: SplashSequence removed, SplashAnimation imported", () => {
  assert.ok(!app.includes("SplashSequence"), "SplashSequence no longer imported");
  assert.ok(app.includes("SplashAnimation"), "SplashAnimation imported");
});
test("App: SplashAnimation onComplete wired", () => {
  assert.ok(app.includes("SplashAnimation") && app.includes("onComplete"), "onComplete wired");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-splash-wiring.test.js`
Expected: FAIL — App.jsx still uses SplashSequence.

- [ ] **Step 3: Implement wiring**

- Replace `import SplashSequence from "./components/SplashSequence"` with `import SplashAnimation from "./components/SplashAnimation"`
- Replace `<SplashSequence onComplete={handleSplashComplete} />` with `<SplashAnimation onComplete={handleSplashComplete} />`
- Delete `src/components/SplashSequence.jsx`

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui-splash-wiring.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx tests/ui-splash-wiring.test.js
git rm src/components/SplashSequence.jsx
git commit -m "feat(ui): wire SplashAnimation into App, remove SplashSequence"
```

### Task 4: Final verification & build

**Files:** None (verification task).

**Interfaces:** Consumes output of Tasks 1–3.

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: all tests pass (57 existing + 9 new = 66+), 0 fail.

- [ ] **Step 2: Run Vite production build**

Run: `npm run build`
Expected: build succeeds, no errors.

- [ ] **Step 3: Run Rust cargo check**

Run: `cd src-tauri && cargo check`
Expected: compiles cleanly (splash is frontend-only, but confirm nothing broke).

- [ ] **Step 4: Commit any leftovers**

No commit expected unless Step 2/3 surfaces cleanup.

---
Pre-flight: Task 1 → Task 2 shares `SplashAnimation.jsx` (Task 1 creates, Task 2 adds lifecycle). Task 2 → Task 3 shares `SplashAnimation` import path (stable from Task 1). Task 3 → Task 4 verifies all. No other shared interfaces.
