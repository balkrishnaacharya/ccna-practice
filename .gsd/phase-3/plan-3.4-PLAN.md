---
phase: 3
plan: 3.4
wave: 3
depends_on: ["3.1"]
files_modified:
  - src/pages/Dashboard.jsx
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Each weak area in Dashboard links directly to a topic drill for that subtopic"
    - "Clicking a weak area navigates to /quiz with domain+subtopic params"
  artifacts:
    - "src/pages/Dashboard.jsx — weak area cards are clickable drill links"
  key_links:
    - "Dashboard.jsx:47-50 — weakAreas computed from subtopics"
    - "Quiz.jsx:28-30 — accepts ?subtopic= and ?domain= query params"
    - "navigationRoutes.js — ROUTE_ORDER defines /quiz route"
---

# Plan 3.4: One-Click Weak-Area Drill from Dashboard

## Objective

Make each weak-area entry in the Dashboard clickable, navigating directly to `/quiz?domain=X&subtopic=Y` so users can immediately drill their weakest subtopics without manually navigating to Topics first.

Purpose: Reduce friction between "see weakness" and "fix weakness."
Output: Dashboard weak-area cards become navigation links to the Quiz drill page.

## Context

Load these files for context:
- src/pages/Dashboard.jsx:47-50 — weakAreas array (top 5 weakest subtopics)
- src/pages/Dashboard.jsx:181-398 — weak areas rendering section (need to read)
- src/pages/Quiz.jsx:28-30 — reads searchParams subtopic/domain for drilling
- src/pages/Quiz.jsx:31-37 — mode defaults to "weak" when drilling

## Tasks

<task type="auto">
  <name>Make weak areas clickable drill links</name>
    <files>
    src/pages/Dashboard.jsx
  </files>
  <action>
    Modify the weak areas rendering section in Dashboard.jsx to:
    1. Import `useNavigate` from react-router-dom (if not already imported)
    2. Wrap each weak-area row in a clickable element (Link or onClick handler)
    3. On click, navigate to `/quiz?domain=<domain>&subtopic=<subtopic>`
    4. Add visual affordance (cursor-pointer, hover state, "Drill" label or arrow icon)
    5. Keep existing styling and sorting intact

    Current weak areas section (lines 181+): renders domain rows with accuracy, attempts, etc. These are currently non-interactive.

    AVOID: Do not change the weakAreas computation logic. Do not break existing stats/subtopic rendering. Do not add a new Tauri command.
    USE: `useNavigate()` + `navigate("/quiz", { searchParams: ... })` or `<Link to="/quiz?...">`. Follow Quiz.jsx's existing drill param pattern.

  </action>
  <verify>
    `npm run build` passes. Weak area rows in Dashboard have onClick/Link that navigates to /quiz with domain and subtopic query params.
  </verify>
  <done>
    Dashboard weak areas are clickable and navigate to targeted quiz drills.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] `npm run build` exits 0
- [ ] Dashboard weak area rows are clickable
- [ ] Click navigates to /quiz?domain=X&subtopic=Y
- [ ] Existing weak areas sorting/styling unchanged

## Success Criteria

- [ ] Task verified passing
- [ ] Must-haves confirmed: one-click weak-area drill works