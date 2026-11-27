import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("Splash: skips when the first-500ms FPS sample is below 30", () => {
  const src = read("../src/components/SplashAnimation.jsx");
  assert.ok(src.includes("elapsed < 500"), "samples the first 500ms");
  assert.ok(src.includes("/ elapsed < 30"), "skips below 30 FPS");
  assert.ok(src.includes("prefers-reduced-motion"), "reduced-motion path retained");
});

test("Quiz: arrow keys navigate the quick quiz and shortcuts hint is shown", () => {
  const src = read("../src/pages/Quiz.jsx");
  assert.ok(src.includes('e.key === "ArrowLeft"'), "ArrowLeft handled");
  assert.ok(src.includes('e.key === "ArrowRight"'), "ArrowRight handled");
  assert.ok(src.includes("ShortcutsHint"), "shortcuts hint rendered");
});

test("Exam: arrow keys and Enter navigate questions", () => {
  const src = read("../src/pages/Exam.jsx");
  assert.ok(src.includes('e.key === "ArrowLeft"'), "ArrowLeft handled");
  assert.ok(src.includes('e.key === "ArrowRight" || e.key === "Enter"'), "Enter/Right handled");
  assert.ok(src.includes('variant="exam"'), "exam-specific shortcuts hint");
});

test("Exam: checkpoints answers every 30 seconds and clears the draft on submit", () => {
  const src = read("../src/pages/Exam.jsx");
  assert.ok(src.includes("}, 30000)"), "30 second checkpoint interval");
  assert.ok(src.includes('"save_exam_draft"'), "writes the draft");
  assert.ok(src.includes('"clear_exam_draft"'), "clears the draft on submit");
  assert.ok(src.includes("resumeDraft"), "can restore a draft");
});

test("App: offers to resume an exam draft on launch", () => {
  const src = read("../src/App.jsx");
  assert.ok(src.includes('"get_exam_draft"'), "checks for a draft on launch");
  assert.ok(src.includes("resumeExamDraft"), "resume handler present");
  assert.ok(src.includes("Resume your exam?"), "resume prompt rendered");
});

test("Streak: practice streak requires 5 questions/day and is in the top bar", () => {
  const hook = read("../src/hooks/useStreak.js");
  assert.ok(hook.includes('"get_practice_streak"'), "loads practice streak");
  assert.ok(hook.includes("practiceStreakMin"), "exposes the daily minimum");
  const shell = read("../src/components/layout/AppShell.jsx");
  assert.ok(shell.includes("aria-label=\"Practice streak\""), "streak badge in header");
});

test("Settings: export progress button and Rust fallback write", () => {
  const settings = read("../src/pages/Settings.jsx");
  assert.ok(settings.includes('"export_progress"'), "invokes the export command");
  assert.ok(settings.includes("writeTextFile"), "writes content URIs via FS plugin");
  const pkg = JSON.parse(read("../package.json"));
  assert.ok(pkg.dependencies["@tauri-apps/plugin-fs"], "plugin-fs dependency present");
});

test("Import pipeline: structured validation report before writing", () => {
  const src = read("../pipeline/import-questions.js");
  assert.ok(src.includes("=== Import validation report ==="), "structured report");
  assert.ok(src.includes("Malformed JSON"), "malformed JSON check");
  assert.ok(src.includes("Duplicate id"), "duplicate id check");
  assert.ok(src.includes("No correct answer specified"), "answer check");
  assert.ok(src.indexOf("function validateDocument") < src.indexOf("const db = new Database"), "validation precedes DB open");
});

test("Repo hygiene: LICENSE, README quick start, screenshots, Cargo.lock tracked", () => {
  assert.ok(read("../LICENSE").includes("MIT License"));
  const readme = read("../README.md");
  assert.ok(readme.includes("## Quick Start"), "Quick Start section");
  assert.ok(readme.includes("git clone"), "clone command");
  assert.ok(readme.includes("## Screenshots"), "screenshot placeholder");
  const gitignore = read("../.gitignore");
  assert.ok(!gitignore.split("\n").some((l) => l.trim() === "Cargo.lock"), "Cargo.lock not ignored");
  assert.ok(gitignore.includes("release-apk/*"), "release artifacts ignored");
});
