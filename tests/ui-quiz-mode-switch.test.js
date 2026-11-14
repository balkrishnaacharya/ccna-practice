import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/pages/Quiz.jsx", import.meta.url), "utf8");
test("Quiz: mode change triggers loadQuestion via useEffect dependency", () => {
  assert.ok(
    /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?loadQuestion\(\)[\s\S]*?\},\s*\[\s*mode\s*\]/s.test(source),
    "Quiz must have useEffect with mode dependency calling loadQuestion()"
  );
  assert.ok(
    source.includes("setSelected([])"),
    "Quiz must reset selected answers when mode changes"
  );
  assert.ok(
    source.includes("setFeedback(null)"),
    "Quiz must reset feedback when mode changes"
  );
  assert.ok(
    source.includes("setConfidence(\"\")"),
    "Quiz must reset confidence when mode changes"
  );
});
