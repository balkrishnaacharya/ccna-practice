import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const quiz = readFileSync(new URL("../src/pages/Quiz.jsx", import.meta.url), "utf8");

test("Practice regression: initial question loads on mount", () => {
  assert.ok(
    /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{\s*\n\s*loadQuestion\(\)/s.test(quiz),
    "Quiz must call loadQuestion() on mount"
  );
});

test("Practice regression: mode change triggers question reload", () => {
  assert.ok(
    /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?loadQuestion\(\)[\s\S]*?\},\s*\[\s*mode\s*\]/s.test(quiz),
    "Quiz must have useEffect with mode dependency calling loadQuestion()"
  );
});

test("Practice regression: answer state resets on mode change", () => {
  assert.ok(quiz.includes("setSelected([])"), "Quiz must reset selected answers on mode change");
  assert.ok(quiz.includes("setFeedback(null)"), "Quiz must reset feedback on mode change");
  assert.ok(quiz.includes("setConfidence(\"\")"), "Quiz must reset confidence on mode change");
});

test("Practice regression: stale async response protection", () => {
  assert.ok(quiz.includes("loadQuestionRef"), "Quiz must track latest loadQuestion call");
  assert.ok(quiz.includes("myLoadId !== loadQuestionRef.current"), "Quiz must discard stale responses");
});

test("Practice regression: empty state renders when no question", () => {
  assert.ok(quiz.includes("No questions available"), "Quiz must render empty state when no question");
  assert.ok(quiz.includes("Retry"), "Quiz must offer Retry button in empty state");
});
