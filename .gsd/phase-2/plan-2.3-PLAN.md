---
phase: 2
plan: 2.3
wave: 1
depends_on: []
files_modified:
  - src/pages/Exam.jsx
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Exam page shows an error/empty state when get_exam_questions returns zero questions"
    - "Exam page does not render a broken UI with no questions"
  artifacts:
    - "src/pages/Exam.jsx empty-state handling in loadExamQuestions"
    - "src/pages/Exam.jsx renders a meaningful message when question list is empty"
  key_links:
    - "Exam.jsx:65-75: loadExamQuestions() calls get_exam_questions, no empty check"
    - "Exam.jsx:173: currentQ = questions[currentIndex] — would be undefined if empty"
---

# Plan 2.3: Handle Empty Exam Question Set in Exam Page

## Objective

Add empty-state handling to the Exam page so that if `get_exam_questions` returns an empty array (e.g., insufficient questions in the bank for the 100-question blueprint), the user sees a clear error message instead of a broken UI with `currentQ` being `undefined`.

Purpose: Prevent a broken exam experience when the question bank is incomplete or the exam query returns no results.
Output: Exam.jsx gracefully handles zero questions with an error message and retry option.

## Context

Load these files for context:
- src/pages/Exam.jsx:65-75 — loadExamQuestions() — no empty check after invoke
- src/pages/Exam.jsx:173 — `const currentQ = questions[currentIndex]` — would be undefined
- src/pages/Exam.jsx:158-167 — loading state (only handles loading, not empty)

## Tasks

<task type="auto">
  <name>Add empty-state handling to Exam page</name>
  <files>
    src/pages/Exam.jsx
  </files>
  <action>
    Modify Exam.jsx to:
    1. Add an `examError` state (string | null) initialized to null
    2. In `loadExamQuestions`, after `setQuestions(qs)`, check if `qs` is empty/undefined and set `examError` with a descriptive message
    3. In the render logic, after the `loading` check and before `examResult` check, render an error state if `examError` is set or `questions.length === 0`
    4. Add a "Retry" button in the error state that calls `loadExamQuestions()` again
    5. Ensure `currentQ` is only accessed when `questions.length > 0` (add null-safety)

    Current flow: loading → (examResult ? scoreReport : question UI). Missing: empty/error state between loading and question UI.

    AVOID: Do not remove the loading state or exam result flow. Do not change the `get_exam_questions` invoke call. Do not break the timer or navigation logic.
    USE: Add error state parallel to loading/examResult. Follow existing patterns (Quiz.jsx uses a similar "No questions available" pattern at lines 331-345).

  </action>
  <verify>
    `npm run build` passes (Vite build compiles Exam.jsx without errors). No React/JSX syntax errors.
  </verify>
  <done>
    Exam.jsx handles empty question set with error message + retry button. currentQ access is null-safe.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] `npm run build` passes
- [ ] Exam.jsx renders error state when questions array is empty
- [ ] currentQ is null-safe when questions is empty
- [ ] Retry button calls loadExamQuestions again

## Success Criteria

- [ ] Task verified passing
- [ ] Must-haves confirmed: empty state shown, no broken UI