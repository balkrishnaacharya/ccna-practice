import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("Tailwind: shadcn CSS-variable tokens are mapped", () => {
  const cfg = read("../tailwind.config.js");
  for (const token of [
    "background:",
    "foreground:",
    "popover:",
    "primary:",
    "destructive:",
    'input: "hsl(var(--input))"',
    'ring: "hsl(var(--ring))"',
    "foreground: \"hsl(var(--muted-foreground))\"",
  ]) {
    assert.ok(cfg.includes(token), `missing Tailwind mapping: ${token}`);
  }
});

test("FloatingDock: responsive sizing uses CSS, not a render-time window read", () => {
  const src = read("../src/components/layout/FloatingDock.jsx");
  assert.ok(!src.includes("window.innerWidth"), "no stale window.innerWidth reads");
  assert.ok(src.includes("sm:w-11"), "desktop sizing via breakpoint");
  assert.ok(src.includes("hidden sm:inline"), "label visibility via breakpoint");
});

test("Exam: timer updater is pure; submission happens in its own effect", () => {
  const src = read("../src/pages/Exam.jsx");
  assert.ok(!src.includes("submitExamFinal();\n            return 0"), "no submit inside updater");
  assert.ok(src.includes("submittedRef"), "duplicate submit guard present");
  assert.ok(
    src.includes("setSecondsRemaining((prev) => Math.max(prev - 1, 0))"),
    "updater only decrements",
  );
});

test("Notifications: quiet hours use local time, not UTC", () => {
  const src = read("../src-tauri/src/notifications.rs");
  assert.ok(src.includes("local_hour"), "local hour helper exists");
  assert.ok(
    src.includes("strftime('%H', 'now', 'localtime')"),
    "localtime used for hour",
  );
  assert.ok(
    src.indexOf("pub fn local_hour") < src.indexOf("let now_hour = local_hour(conn)?;"),
    "helper defined before use",
  );
});

test("Diagnostics: bundled count comes from embedded bytes on every platform", () => {
  const src = read("../src-tauri/src/commands/library.rs");
  const body = src.slice(src.indexOf("pub fn get_diagnostics("), src.indexOf("/// Tauri command wrapper"));
  assert.ok(body.includes("crate::db::BUNDLED_DB"), "uses embedded bundle");
  assert.ok(!body.includes('Path::new("resources/ccna.db")'), "no relative source path");
});

test("Importer: generic question/options/answer shape is normalized before insert", () => {
  const src = read("../pipeline/import-questions.js");
  assert.ok(src.includes("function normalizeQuestion"), "normalizer exists");
  assert.ok(
    src.includes("const q = normalizeQuestion(raw);"),
    "transaction uses normalized question",
  );
  assert.ok(
    src.includes("const stem = q.stem ?? q.question"),
    "question/stem alias handled",
  );
  assert.ok(src.includes("q.choices ?? q.options"), "choices/options alias handled");
});

test("Progress reset clears exam drafts", () => {
  const src = read("../src-tauri/src/commands/library.rs");
  const body = src.slice(src.indexOf("pub fn reset_stats"), src.indexOf("// ─── Flashcards"));
  assert.ok(body.includes("DELETE FROM exam_drafts"), "stale draft removed on reset");
});
