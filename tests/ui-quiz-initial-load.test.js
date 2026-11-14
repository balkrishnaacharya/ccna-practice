import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/pages/Quiz.jsx", import.meta.url), "utf8");
test("Quiz: loadQuestion is invoked on mount via useEffect", () => {
  // loadQuestion() must be the first statement inside a useEffect body
  // (not nested inside an event handler).
  assert.ok(
    /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{\s*\n\s*loadQuestion\(\)/s.test(source),
    "Quiz must call loadQuestion() as the first statement inside a useEffect on mount"
  );
  assert.ok(
    source.includes("setLoading(true)"),
    "Quiz must set loading state before fetching question"
  );
  assert.ok(
    source.includes("setLoading(false)"),
    "Quiz must clear loading state after fetch completes"
  );
});
