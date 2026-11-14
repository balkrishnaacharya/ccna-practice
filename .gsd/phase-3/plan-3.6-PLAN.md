---
phase: 3
plan: 3.6
wave: 2
depends_on: []
files_modified:
  - src/pages/SessionReview.jsx
autonomous: true
user_setup: []
must_haves:
  truths:
    - "SessionReview has an export/print button that produces a readable text summary"
    - "Export includes score, weak areas, and missed questions with explanations"
  artifacts:
    - "src/pages/SessionReview.jsx — export/print function + button"
  key_links:
    - "SessionReview.jsx:36-55 — generateStudyPrompt() already builds a text summary"
    - "SessionReview.jsx:23 — invoke('get_session_detail') loads session data"
---

# Plan 3.6: Export/Print Session Review

## Objective

Add an "Export Review" button to SessionReview.jsx that produces a printable/text summary of the exam session: score, percentage, weak areas by domain, and missed questions with correct answers and explanations. Reuses the existing `generateStudyPrompt()` logic.

Purpose: Let users save or print their exam review for offline study.
Output: SessionReview with an export button that opens a print-friendly view or copies summary to clipboard.

## Context

Load these files for context:
- src/pages/SessionReview.jsx:36-55 — generateStudyPrompt() builds a formatted text summary
- src/pages/SessionReview.jsx:23-29 — loads session detail via invoke('get_session_detail')
- src/pages/SessionReview.jsx:60-186 — renders review UI (need to see export placement)

## Tasks

<task type="auto">
  <name>Add export/print button to SessionReview</name>
  <files>
    src/pages/SessionReview.jsx
  </files>
  <action>
    Modify SessionReview.jsx to:
    1. Add an "Export Review" button next to the existing controls (near where studyPrompt is used)
    2. The button calls `generateStudyPrompt()` (already exists) and either:
       a. Opens a browser print dialog with a print-friendly layout, OR
       b. Copies the summary to clipboard via navigator.clipboard.writeText()
    3. Add a simple print-friendly container that shows when exporting (or just use window.print() on a hidden element)

    Simplest robust approach: button calls `window.print()` after rendering the study prompt in a print-visible element, or copies to clipboard with a toast confirmation.

    AVOID: Do not add a new Tauri command. Do not change the session data structure. Do not require backend changes.
    USE: `navigator.clipboard.writeText()` for clipboard copy (works on desktop and Android), or `window.print()` for print. Show a brief confirmation message after export.

  </action>
  <verify>
    `npm run build` passes. SessionReview renders an export button and generates a text summary when clicked.
  </verify>
  <done>
    SessionReview has a working export/print function.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] `npm run build` exits 0
- [ ] SessionReview renders an export button
- [ ] Clicking export produces a text summary (clipboard or print)

## Success Criteria

- [ ] Task verified passing
- [ ] Must-haves confirmed: export button present, summary generated