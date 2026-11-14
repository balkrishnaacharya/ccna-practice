---
phase: 3
plan: 3.1
wave: 1
depends_on: []
files_modified:
  - src/pages/Exam.jsx
  - src/pages/Dashboard.jsx
  - src/pages/Review.jsx
  - src/pages/Settings.jsx
autonomous: true
user_setup: []
must_haves:
  truths:
    - "No page uses 'uppercase tracking-wider' or 'uppercase tracking-wide' (violates UI standard enforced by tests)"
    - "No button uses '→' arrow character (violates UI standard enforced by tests)"
  artifacts:
    - "src/pages/Exam.jsx — all uppercase/tracking-wider/→ removed"
    - "src/pages/Dashboard.jsx — tracking-wider uppercase removed"
    - "src/pages/Review.jsx — tracking-wider uppercase removed"
    - "src/pages/Settings.jsx — uppercase tracking-wider removed"
  key_links:
    - "tests/ui-dashboard.test.js:10-14 — asserts no 'uppercase tracking-wider' in Dashboard"
    - "tests/ui-quiz.test.js:10-11 — asserts no '→' in Quiz"
    - "tests/ui-nav.test.js:10-14 — asserts no 'uppercase'/'tracking-wider' in Bottom Nav"
---

# Plan 3.1: Fix UI Standard Violations Across Pages

## Objective

Remove `uppercase tracking-wider`, `tracking-wider uppercase`, and `→` arrow characters from Exam.jsx, Dashboard.jsx, Review.jsx, and Settings.jsx. These violate the UI design standards enforced by existing tests (which check Dashboard, Quiz, and Bottom Nav but not yet Exam/Review/Settings).

Purpose: Bring all pages into compliance with the established UI design system (sentence-case labels, no tracked-out caps, no arrow characters).
Output: Four pages cleaned up to match UI standards.

## Context

Load these files for context:
- src/pages/Exam.jsx — lines 191-192 (tracking-wider uppercase + → arrows), 274 (tracking-wider uppercase), 350 (tracking-wide), 375 (tracking-wider)
- src/pages/Dashboard.jsx — line 361 (tracking-wider uppercase)
- src/pages/Review.jsx — lines 118-121 (tracking-wider uppercase)
- src/pages/Settings.jsx — lines 113-114, 159-160, 263-264, 323-324 (uppercase tracking-wider)
- tests/ui-dashboard.test.js — reference for the UI standard

## Tasks

<task type="auto">
  <name>Fix Exam.jsx UI violations</name>
  <files>
    src/pages/Exam.jsx
  </files>
  <action>
    Replace all `tracking-wider uppercase` and `tracking-wide` with plain `text-xs font-medium` or `text-xs font-semibold` (no tracking, no uppercase). Replace `Finish →` and `Next →` button text with `Finish Exam` and `Next Question`. Replace `← Previous` with `Previous`.

    Specific replacements:
    - Line 191-192: `tracking-wider uppercase text-gold` → `font-semibold text-gold`; `Finish →` → `Finish Exam`; `Next →` → `Next Question`; `← Previous` → `Previous`
    - Line 274: `tracking-wider uppercase text-paper-muted` → `text-paper-muted`
    - Line 350: `tracking-wide` → remove tracking utility
    - Line 375: `tracking-wider` → remove tracking utility

    AVOID: Do not change layout structure, colors, or GSAP animation. Do not remove the `text-paper-muted` or `text-gold` color utilities.
    USE: Tailwind `text-xs font-semibold` / `text-xs font-medium` without tracking or uppercase.

  </action>
  <verify>
    `npm run build` passes. `grep -rn "tracking-wider\|tracking-wide\|uppercase\|→" src/pages/Exam.jsx` returns no matches for those patterns in Exam.jsx.
  </verify>
  <done>
    Exam.jsx has no tracking-wider, tracking-wide, uppercase, or → characters.
  </done>
</task>

<task type="auto">
  <name>Fix Dashboard, Review, Settings UI violations</name>
  <files>
    src/pages/Dashboard.jsx
    src/pages/Review.jsx
    src/pages/Settings.jsx
  </files>
  <action>
    Replace `tracking-wider uppercase` / `uppercase tracking-wider` with plain font utilities:
    - Dashboard.jsx line 361: `tracking-wider uppercase` → remove both
    - Review.jsx lines 118-121: `tracking-wider uppercase` / `tracking-wide` → remove both
    - Settings.jsx lines 113-114, 159-160, 263-264, 323-324: `uppercase tracking-wider` → remove both

    AVOID: Do not change colors, layout, or button functionality. Do not touch Exam.jsx (handled in separate task).
    USE: `text-xs font-medium` / `text-xs font-semibold` without tracking-uppercase utilities.

  </action>
  <verify>
    `npm run build` passes. `grep -rn "tracking-wider\|tracking-wide\|uppercase" src/pages/Dashboard.jsx src/pages/Review.jsx src/pages/Settings.jsx` returns no matches.
  </verify>
  <done>
    Dashboard.jsx, Review.jsx, Settings.jsx have no tracking-wider, tracking-wide, or uppercase.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] `npm run build` exits 0
- [ ] Exam.jsx: no tracking-wider, tracking-wide, uppercase, →
- [ ] Dashboard.jsx: no tracking-wider, tracking-wide, uppercase
- [ ] Review.jsx: no tracking-wider, tracking-wide, uppercase
- [ ] Settings.jsx: no tracking-wider, tracking-wide, uppercase

## Success Criteria

- [ ] All tasks verified passing
- [ ] Must-haves confirmed: UI standard violations eliminated across all four pages