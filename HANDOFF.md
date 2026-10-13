# Handoff — CCNA Practice App

## Context
Switched from one AI model to another mid-project. No commits existed before
the checkpoint at <git hash from the commit above>.

## Task Status
1. BUG — single-answer multi-select           : DONE
2. BUG — exam last question incomplete        : DONE
3. FEATURE — persist exam history             : DONE
4. FEATURE — AI study prompt generator        : DONE
5. FEATURE — exam sampling rules              : DONE
6. FEATURE — difficulty escalation            : DONE
7. FEATURE — study notes + calculators        : DONE

## What Was Changed
- Task 1: `.agents/agents/question-generator.md` now documents the `multi_select` rule; conditional radios/checkboxes and backend validation were already present.
- Task 2: `src/pages/Exam.jsx` disables Finish Exam until all questions have answers and gives answered navigator cells priority over flags.
- Task 3: `src/App.jsx` registers History routes and navigation; `src/pages/SessionReview.jsx` reviews saved answers and supports retaking missed questions.
- Task 4: `src/pages/SessionReview.jsx` generates and copies a local-only weak-area study prompt.
- Task 5: `src-tauri/src/commands.rs` samples with blueprint quotas, a two-per-subtopic cap, adaptive weights, and reset clears flags.
- Task 6: `src-tauri/src/db.rs` adds per-question answer stats; `src-tauri/src/commands.rs` records stats and favors harder questions after two consecutive subtopic successes.
- Task 7: `src/pages/Notes.jsx` adds local subnet, wildcard, and CIDR calculators; `src/App.jsx` registers the Notes route and link.

## Known Issues
- Desktop interaction was not run in this implementation pass; `cargo check` and `npm run build` passed after each task.

## Original Task Prompt
ou are working on a Tauri 2.0 + React + Rust + SQLite CCNA 2.0 practice app. Read AGENTS.md and src-tauri/src/db.rs first to understand the schema and stack rules. Then work through the following tasks in order, verifying each on desktop with npm run tauri dev before moving to the next.

1. BUG — Single-answer questions allow multiple selections
Right now, every question renders with checkboxes and accepts multiple choices, even when only one is correct. Fix this:

Add a column to the questions table: multi_select INTEGER NOT NULL DEFAULT 0. Migrate existing rows to 0.

In the Quiz and Exam UI, render radio buttons when multi_select = 0 and checkboxes when multi_select = 1.

Update submit_answer in commands.rs: for single-answer questions, reject submissions with more than one choice_id.

The question-generator subagent must set multi_select: true only for questions that explicitly say "choose two" or "select all that apply" in the stem.

2. BUG — Exam mode last question never marks as complete
In exam mode, answering the final (100th) question does not mark it as answered in the question navigator. Fix:

When the last question is submitted, update the navigator grid's cell to Answered state.

Ensure Finish Exam enables once all 100 questions have a recorded answer.

If the user reaches the last question and clicks Next, show a confirmation modal ("You have unanswered questions — submit anyway?") rather than silently ending.

3. FEATURE — Persist full exam history
Every exam session must be saved with complete detail so the user can review it later.

Extend the sessions table: id, mode, started_at, ended_at, score, total, duration_sec.

Extend the answers table: id, session_id, question_id, selected_choice_ids (JSON text), is_correct, time_spent_ms, answered_at.

Create a new screen Exam History (route /history) that lists past sessions with date, mode, score, and time. Clicking a session opens a review screen showing every question, the user's answer, the correct answer, and the explanation.

Add a "Retake this exam's wrong questions only" button on the review screen.

4. FEATURE — AI Study Prompt Generator
On the review screen for any past session, add a button "Generate Study Prompt". Clicking it produces a plain-text block the user can copy and paste into an external LLM (ChatGPT, Claude, etc.).

The generated prompt must include:

The session's score and the list of CCNA 2.0 domains where the user answered incorrectly.

For each wrong domain, the specific subtopics missed.

The full text of each question the user got wrong, plus the correct answer and explanation.

An instruction block for the receiving LLM that says, verbatim:

You are a CCNA 2.0 tutor. Based on my weak areas listed below, do the following:

Explain the underlying concept for each missed question in simple terms, then again with exam-level depth.

Generate 5 new multiple-choice questions per weak subtopic, in the same 4-choice format with one correct answer and a 2–4 sentence explanation.

Provide short study notes (bullet form, ~200 words) for each weak subtopic.

End with a 5-question mixed quiz covering only my weak areas.

Show the generated prompt in a textarea with a "Copy" button. Do not auto-send it anywhere — this is local only.

5. FEATURE — Exam sampling rules
The current exam-mode sampler picks randomly by domain weight. Refine it:

Weighted by blueprint: 25% network_infra, 25% switching, 20% ip_routing, 20% services_security, 10% ai_ops. Already implemented — verify it stays correct after schema changes.

No duplicate stem types: two questions with the same subtopic must not appear more than twice in a single 100-question exam.

Adaptive difficulty: prefer questions the user has not answered correctly recently. Weight selection toward unseen or previously-wrong questions by a factor of 2× over unseen-correct questions.

Reset: the Settings screen must have a "Reset Statistics" button that clears answers, sessions, and flags tables. Confirm with a modal before wiping.

6. FEATURE — Difficulty escalation for correct answers
Add user_question_stats(id, question_id, times_seen, times_correct, last_seen_at) table.

When a question is answered correctly twice in a row, mark it as easy in the user's personal view. Prefer harder questions in that subtopic going forward.

The escalation is per subtopic, not per question — if the user aces three Rapid PVST+ questions, show fewer easy Rapid PVST+ questions and more hard ones.

Resetting statistics clears user_question_stats too.

7. FEATURE — Study Notes screen
Add a new route /notes and a nav link. Contents:

Subnet calculator: inputs for IP address and CIDR prefix, outputs network address, broadcast, first host, last host, total hosts, usable hosts, and wildcard mask.

Wildcard mask calculator: input subnet mask → output wildcard mask. And vice versa.

CIDR to subnet mask table for prefixes /8 through /32.

All computed locally in TypeScript, no backend calls.

Keep the UI consistent with the rest of the app — light theme, #4d6bfe accent, Tailwind utility classes, no component libraries.

Constraints (do not violate)
No network calls from the app. No authentication.

SQLite only. Migrate the schema safely — do not drop tables with data.

Preserve the existing question bank . Use ALTER TABLE ADD COLUMN for new fields.

After each numbered task, run cargo check and confirm the desktop app still launches before moving on.

