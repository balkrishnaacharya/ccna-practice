---
phase: 2
plan: 2.2
wave: 1
depends_on: []
files_modified:
  - src-tauri/src/commands.rs
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Weak mode serves never-seen questions before mastered questions"
    - "Weak mode serves weak (low correct-rate) questions first"
  artifacts:
    - "src-tauri/src/commands.rs CASE expression corrected in get_random_question_conn"
    - "src-tauri/src/commands.rs CASE expression corrected in drill_question_conn"
    - "Rust test added verifying weak mode never-seen priority"
  key_links:
    - "commands.rs:590-596: get_random_question_conn weak mode CASE expression"
    - "commands.rs:813-821: drill_question_conn CASE expression"
    - "commands.rs:580-581: comment states 'wrong, then the ones you have not seen yet'"
---

# Plan 2.2: Fix "Weak" Mode Question Prioritization Bug

## Objective

Fix the CASE expression ordering in `get_random_question_conn` and `drill_question_conn` so that "weak" mode serves questions in the correct priority: weak (low correct-rate) → never-seen → mastered. Currently never-seen questions are deprioritized below mastered ones, contradicting the code comment at line 580-581.

Purpose: Ensure "Weak Spots" mode actually drills unseen questions before mastered ones, matching the documented behavior.
Output: Corrected CASE expressions in both functions plus a Rust regression test.

## Context

Load these files for context:
- src-tauri/src/commands.rs:580-581 — comment: "drills the questions you actually get wrong, then the ones you have not seen yet"
- src-tauri/src/commands.rs:590-596 — weak mode CASE expression in get_random_question_conn
- src-tauri/src/commands.rs:813-821 — same CASE expression in drill_question_conn

## Tasks

<task type="auto">
  <name>Fix weak mode CASE priority in get_random_question_conn</name>
  <files>
    src-tauri/src/commands.rs
  </files>
  <action>
    In `get_random_question_conn` (lines 588-596), change the CASE expression priority order:
    - Priority 0: weak questions (times_correct * 10 < times_seen * 7, correct rate < 70%) — served first ✓ (unchanged)
    - Priority 1: never-seen questions (times_seen IS NULL OR times_seen = 0) — served second (was 2)
    - Priority 2: mastered questions (correct rate >= 70%) — served last (was 1)

    Current SQL (lines 589-595):
      WHEN s.times_seen IS NULL OR s.times_seen = 0 THEN 2
      WHEN s.times_correct * 10 < s.times_seen * 7 THEN 0
      ELSE 1

    Fixed SQL:
      WHEN s.times_correct * 10 < s.times_seen * 7 THEN 0
      WHEN s.times_seen IS NULL OR s.times_seen = 0 THEN 1
      ELSE 2

    AVOID: Do not change the difficulty filtering, RANDOM() tiebreaker, or the second ORDER BY clause (accuracy ASC). Do not change drill_question_conn in this task.
    USE: Swap the THEN values for never-seen (2→1) and mastered (1→2).

  </action>
  <verify>
    `cargo check` passes. `cargo test` passes.
  </verify>
  <done>
    get_random_question_conn weak mode: never-seen priority is 1, mastered priority is 2.
  </done>
</task>

<task type="auto">
  <name>Fix weak mode CASE priority in drill_question_conn</name>
  <files>
    src-tauri/src/commands.rs
  </files>
  <action>
    In `drill_question_conn` (lines 813-821), apply the same CASE priority fix:
    - Priority 0: weak questions (correct rate < 70%)
    - Priority 1: never-seen questions
    - Priority 2: mastered questions

    Current SQL (lines 814-820):
      WHEN s.times_seen IS NULL OR s.times_seen = 0 THEN 2
      WHEN s.times_correct * 10 < s.times_seen * 7 THEN 0
      ELSE 1

    Fixed SQL:
      WHEN s.times_correct * 10 < s.times_seen * 7 THEN 0
      WHEN s.times_seen IS NULL OR s.times_seen = 0 THEN 1
      ELSE 2

    AVOID: Do not change the domain/subtopic filtering, difficulty filtering, or RANDOM() tiebreaker.
    USE: Same priority swap as get_random_question_conn.

  </action>
  <verify>
    `cargo check` passes. `cargo test` passes.
  </verify>
  <done>
    drill_question_conn weak mode: never-seen priority is 1, mastered priority is 2.
  </done>
</task>

<task type="auto">
  <name>Add Rust regression test for weak mode never-seen priority</name>
  <files>
    src-tauri/src/commands.rs
  </files>
  <action>
    Add a new `#[test]` function in the `mod tests` block that:
    1. Sets up the test DB (reuse setup_test_db pattern)
    2. Marks some questions as seen/correct (mastered), leaves others never-seen
    3. Calls `get_random_question_conn("weak", None, None, &conn)` multiple times
    4. Asserts that never-seen questions are served before mastered ones

    Place the test near the existing streak_stats tests (around line 1734+).

    AVOID: Do not modify existing tests. Do not change the test DB schema.
    USE: Follow the existing test patterns (setup_test_db, add_answer helper, assert! macros).

  </action>
  <verify>
    `cargo test` passes including the new test.
  </verify>
  <done>
    New Rust test passes, confirming weak mode serves never-seen before mastered.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] `cargo check` passes
- [ ] `cargo test` passes (all Rust tests including new one)
- [ ] Both CASE expressions corrected (get_random_question_conn + drill_question_conn)
- [ ] Weak mode priority order: weak → never-seen → mastered

## Success Criteria

- [ ] All tasks verified passing
- [ ] Must-haves confirmed: weak mode serves never-seen before mastered