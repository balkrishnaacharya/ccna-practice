import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const quiz = readFileSync(
  new URL("../src/pages/Quiz.jsx", import.meta.url),
  "utf8"
);

test("Quiz: no call to an undeclared setQuestionNumber state setter", () => {
  assert.ok(
    !quiz.includes("setQuestionNumber"),
    "setQuestionNumber was never declared and threw on every question load"
  );
});

test("Quiz: the note editor is actually rendered and wired to save", () => {
  assert.ok(quiz.includes("showNoteInput ?"), "editor toggles on visible state");
  assert.ok(
    quiz.includes("onSubmit={handleSaveNote}"),
    "save handler is attached to the form"
  );
  assert.ok(
    quiz.includes("onChange={(e) => setQuestionNote(e.target.value)}"),
    "textarea edits update the saved note"
  );
  assert.ok(quiz.includes("Save note"), "save action is available");
});

test("Quiz: no write-only or unused state remains", () => {
  assert.ok(!quiz.includes("noteInputVisible"), "duplicate note-visibility state removed");
  assert.ok(!quiz.includes("showOverlay"), "unused overlay state removed");
  assert.ok(!quiz.includes("noteRef"), "unused ref removed");
});

test("Backend: row_to_question fetches subtopic and stats in one query", () => {
  const src = readFileSync(
    new URL("../src-tauri/src/commands/practice.rs", import.meta.url),
    "utf8"
  );
  const body = src.slice(
    src.indexOf("fn row_to_question"),
    src.indexOf("#[tauri::command]\npub fn get_random_question")
  );
  assert.ok(
    body.includes("LEFT JOIN user_question_stats s ON s.question_id = q.id"),
    "subtopic and per-question stats share one SELECT"
  );
});

test("Backend: DB setup always registers state and reports failures", () => {
  const src = readFileSync(
    new URL("../src-tauri/src/lib.rs", import.meta.url),
    "utf8"
  );
  assert.ok(!src.includes(".expect(\"failed to init db\")"), "no panic on init failure");
  assert.ok(src.includes("open_database(&db_path)"), "DB init has a retry/fallback path");
  assert.ok(src.includes(".manage(db::Db(db::shared_connection()))"), "Db registered on Builder");
  assert.ok(src.includes("db::install_connection(conn)"), "setup installs the real connection");
  assert.ok(src.includes("get_startup_error"), "startup failures are surfaced to the UI");

  const dbSrc = readFileSync(new URL("../src-tauri/src/db.rs", import.meta.url), "utf8");
  assert.ok(dbSrc.includes("fn wait_ready()"), "commands wait for DB readiness");
  assert.ok(dbSrc.includes("Condvar"), "readiness uses a condvar");
  assert.ok(!src.includes("[DEBUG]"), "debug logging removed");
});
