---
phase: 3
plan: 3.3
wave: 2
depends_on: []
files_modified:
  - src/pages/ExamHistory.jsx
autonomous: true
user_setup: []
must_haves:
  truths:
    - "ExamHistory has a search input that filters sessions by date/score"
    - "Search is client-side, no new backend command needed"
  artifacts:
    - "src/pages/ExamHistory.jsx — search input + filtered session list"
  key_links:
    - "ExamHistory.jsx:31 — invoke('get_exam_history') loads all sessions"
    - "ExamHistory.jsx:47-60 — session list rendering"
---

# Plan 3.3: Add Search/Filter to Exam History

## Objective

Add a client-side search input to ExamHistory.jsx so users can filter their exam sessions by date, score, or percentage. Currently all sessions are listed with no way to narrow them down.

Purpose: Make exam history usable as the session count grows.
Output: ExamHistory with a search input that filters the rendered session list.

## Context

Load these files for context:
- src/pages/ExamHistory.jsx — full file (133 lines), loads sessions via invoke('get_exam_history'), renders session cards
- SessionSummary struct in src-tauri/src/commands.rs:193-205 — has id, mode, started_at, ended_at, score, total, duration_sec, percentage, scaled_score, passed

## Tasks

<task type="auto">
  <name>Add search input and filter logic to ExamHistory</name>
  <files>
    src/pages/ExamHistory.jsx
  </files>
  <action>
    Modify ExamHistory.jsx to:
    1. Add `const [search, setSearch] = useState("");` state
    2. Add a search input above the session list (text input, placeholder "Search by date or score...")
    3. Add a `useMemo` that filters sessions by: date string includes search, or score/percentage includes search
    4. Render the filtered list instead of the raw list
    5. Show "No matching sessions" when filter yields zero results

    AVOID: Do not add a new Tauri command (keep it client-side). Do not change the session data structure. Do not remove existing sort (newest first).
    USE: Follow the existing pattern in Topics.jsx:52-68 (useMemo with query filtering).

  </action>
  <verify>
    `npm run build` passes. ExamHistory renders a search input and filters sessions when text is entered.
  </verify>
  <done>
    ExamHistory has a working client-side search filter.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] `npm run build` exits 0
- [ ] ExamHistory renders a search input
- [ ] Typing in search filters the session list
- [ ] Empty state shows when no matches

## Success Criteria

- [ ] Task verified passing
- [ ] Must-haves confirmed: search input present, client-side filtering works