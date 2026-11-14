---
phase: 1
plan: 1.3
wave: 2
depends_on: ["1.1", "1.2"]
files_modified:
  - src/App.jsx
  - src/pages/*.jsx
  - src/components/*.jsx
  - src/utils/*.js
  - src-tauri/src/commands.rs
autonomous: true
user_setup: []
must_haves:
  truths:
    - "All 10 frontend pages load without errors"
    - "All Tauri commands invoked from frontend exist in commands.rs"
    - "Question bank (2000+) is accessible from Quiz/Exam pages"
    - "npm test passes with no failures"
  artifacts:
    - "Feature audit document listing every page and its status"
    - "Rebuilt Tauri binary with full question bank"
    - "Test suite passing"
  key_links:
    - "All Tauri commands are registered in lib.rs invoke_handler"
    - "Frontend pages invoke commands via @tauri-apps/api/core invoke"
    - "npm test runs tests/*.test.js"
---

# Plan 1.3: Feature Completeness Audit + Rebuild + Verify

## Objective

Audit every frontend page and Tauri backend command for missing or broken features. Fix any gaps found. Then rebuild the Tauri app with the new bundled question bank (from Plan 1.1) and run the full test suite to verify everything works end-to-end.

Purpose: Ensure "all features are fully there" as the user requested, and that the question bank fix ships in a working build.
Output: A verified feature list, any gap fixes applied, and a rebuilt Tauri binary with 2000+ questions.

## Context

Load these files for context:
- src/App.jsx — route registry and top-level shell
- src/pages/*.jsx — all 10 pages (Dashboard, Exam, ExamHistory, Notes, PracticalExam, Quiz, Review, SessionReview, Settings, Topics)
- src/components/*.jsx — all 10 components
- src/utils/*.js — all 5 utility modules
- src-tauri/src/commands.rs — all Tauri commands
- src-tauri/src/lib.rs — invoke_handler registration
- tests/*.test.js — existing test suite (12 test files)

## Tasks

<task type="auto">
  <name>Feature completeness audit across all pages and commands</name>
  <files>
    src/App.jsx
    src/pages/Dashboard.jsx
    src/pages/Exam.jsx
    src/pages/ExamHistory.jsx
    src/pages/Notes.jsx
    src/pages/PracticalExam.jsx
    src/pages/Quiz.jsx
    src/pages/Review.jsx
    src/pages/SessionReview.jsx
    src/pages/Settings.jsx
    src/pages/Topics.jsx
    src-tauri/src/commands.rs
    src-tauri/src/lib.rs
  </files>
  <action>
    Perform a systematic audit:

    1. List every Tauri command in commands.rs and verify it's registered in lib.rs invoke_handler.
    2. List every `invoke()` call in frontend files and verify the corresponding command exists.
    3. Open each of the 10 pages and confirm it loads without missing imports or broken references.
    4. Check that the question bank flow works: Quiz page calls get_random_question, Exam page calls get_exam_questions, both should return questions from the 2000+ bank.
    5. Check Settings page uses useUpdater correctly.
    6. Check Dashboard page loads stats and subtopic stats.

    Document findings: each page status (OK / gap found), each command status (wired / missing), each missing feature.

    AVOID: Do not change page behavior beyond fixing broken references. Do not remove existing features.
    USE: Read each file fully. Cross-reference invoke() calls against commands.rs and lib.rs.

  </action>
  <verify>
    Audit document created listing: all 10 pages (status), all Tauri commands (status), all invoke() calls (matched/unmatched), gaps found.
  </verify>
  <done>
    Audit complete. Every page and command accounted for. Gaps documented with file:line references.
  </done>
</task>

<task type="auto">
  <name>Fix audit gaps and rebuild Tauri app</name>
  <files>
    src/pages/*.jsx
    src/components/*.jsx
    src/utils/*.js
    src/App.jsx
    src-tauri/src/commands.rs
    src-tauri/src/lib.rs
    src-tauri/resources/ccna.db
  </files>
  <action>
    Based on audit findings from the previous task:

    1. Fix any missing command registrations in lib.rs invoke_handler.
    2. Fix any broken invoke() calls in frontend (wrong command name, missing payload field).
    3. Fix any missing imports or broken component references in pages.
    4. Ensure the rebuilt resources/ccna.db (from Plan 1.1) is in place.

    Then rebuild: `npm run build` (frontend) and `cargo build --release` or `cargo tauri build` (Tauri binary with baked-in DB).

    AVOID: Do not add new features beyond gap fixes. Do not change the question count logic. Do not modify the database schema.
    USE: Minimal, targeted fixes only. Rebuild with the new ccna.db from Plan 1.1.

  </action>
  <verify>
    `npm run build` exits 0. `cargo build --release` (or tauri build) exits 0. The binary includes the updated ccna.db with 2000+ questions.
  </verify>
  <done>
    All audit gaps fixed. Tauri app rebuilt successfully with full question bank baked in.
  </done>
</task>

<task type="auto">
  <name>Run full test suite and end-to-end verification</name>
  <files>
    tests/*.test.js
    src-tauri/resources/ccna.db
  </files>
  <action>
    Run the complete test suite: `npm test`. This runs all 12 test files via node --test.

    Additionally:
    - Verify get_stats returns total >= 2000
    - Verify Quiz page can load a question (invoke get_random_question)
    - Verify Exam page can load exam questions (invoke get_exam_questions)

    AVOID: Do not skip failing tests. Do not modify tests to make them pass artificially.
    USE: `npm test` as the canonical test runner. If tests fail, fix the source code, not the tests.

  </action>
  <verify>
    `npm test` exits 0 with all 12 test files passing. get_stats returns total >= 2000. Question loading works.
  </verify>
  <done>
    All tests passing. Question bank verified at 2000+. All features functional.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] Audit document covers all 10 pages and all commands
- [ ] All gaps fixed (if any found)
- [ ] `npm run build` succeeds
- [ ] Tauri binary rebuilt with 2000+ question DB
- [ ] `npm test` passes all 12 test files
- [ ] get_stats returns total >= 2000

## Success Criteria

- [ ] All tasks verified passing
- [ ] Must-haves confirmed: all pages load, all commands wired, 2000+ questions accessible, tests passing
- [ ] No regressions from the DB or updater changes