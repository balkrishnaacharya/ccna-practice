---
phase: 3
plan: 3.5
wave: 2
depends_on: []
files_modified:
  - src/pages/PracticalExam.jsx
autonomous: true
user_setup: []
must_haves:
  truths:
    - "PracticalExam has no 'uppercase tracking-wider' violations"
    - "PracticalExam has no '→' arrow characters"
  artifacts:
    - "src/pages/PracticalExam.jsx — all uppercase/tracking-wider/→ removed"
  key_links:
    - "PracticalExam.jsx:80, 116, 120, 154, 161, 171, 189, 205, 248 — uppercase tracking-wider violations"
    - "tests/ui-quiz.test.js:10-11 — asserts no '→' (UI standard)"
---

# Plan 3.5: PracticalExam UI Cleanup

## Objective

Fix UI standard violations in PracticalExam.jsx: remove `uppercase tracking-wider`, `tracking-wide`, and `→` characters. Also add a "New Lab" vs resume distinction so users know when they're starting fresh vs continuing.

Purpose: Bring PracticalExam into compliance with the UI design system and clarify session state.
Output: PracticalExam.jsx cleaned up with consistent typography.

## Context

Load these files for context:
- src/pages/PracticalExam.jsx — full file (264 lines), multiple `uppercase tracking-wider` on lines 80, 116, 120, 154, 161, 171, 189, 205, 248
- tests/ui-quiz.test.js:10-11 — reference for no-→ standard
- src/pages/Dashboard.jsx — reference for how fixed pages look

## Tasks

<task type="auto">
  <name>Fix PracticalExam UI violations</name>
  <files>
    src/pages/PracticalExam.jsx
  </files>
  <action>
    Replace all `uppercase tracking-wider`, `tracking-wide`, and `tracking-wider` with plain font utilities:
    - Line 80: `uppercase tracking-wider text-peach` → `font-semibold text-peach`
    - Line 116: `uppercase tracking-wider text-peach` → `font-semibold text-peach`
    - Line 120: `uppercase tracking-wider text-paper-dim` → `text-paper-dim`
    - Line 154: `uppercase tracking-wider` → remove both
    - Line 161: `uppercase tracking-wider` → remove both
    - Line 171: `uppercase tracking-wider text-paper-dim font-mono` → `text-paper-dim font-mono`
    - Line 189: `uppercase tracking-wider text-peach` → `font-semibold text-peach`
    - Line 205: `uppercase tracking-wider text-peach` → `font-semibold text-peach`
    - Line 248: `uppercase tracking-wider` → remove both

    Check for any `→` characters and remove them (replace with plain text).

    AVOID: Do not change layout, colors, grading logic, or the CliTerminal integration. Do not add new features beyond typography fixes.
    USE: `text-xs font-semibold` / `text-xs font-medium` without tracking-uppercase utilities.

  </action>
  <verify>
    `npm run build` passes. `grep -n "tracking-wider\|tracking-wide\|uppercase\|→" src/pages/PracticalExam.jsx` returns no matches.
  </verify>
  <done>
    PracticalExam.jsx has no tracking-wider, tracking-wide, uppercase, or → characters.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] `npm run build` exits 0
- [ ] PracticalExam.jsx: no tracking-wider, tracking-wide, uppercase, →

## Success Criteria

- [ ] Task verified passing
- [ ] Must-haves confirmed: PracticalExam UI violations eliminated