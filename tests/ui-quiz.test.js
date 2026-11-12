import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../src/pages/Quiz.jsx", import.meta.url),
  "utf8"
);

test("Quiz: no right-arrow on button text", () => {
  assert.ok(!source.includes("→"), "Quiz buttons must not end with →");
});

test("Quiz: no ALL-CAPS tracking-wider labels", () => {
  assert.ok(
    !source.includes("uppercase tracking-wider"),
    "Quiz must not use tracked-out ALL-CAPS labels"
  );
});

test("Quiz: no accent-gold on unchecked radio rings", () => {
  assert.ok(
    !source.includes("accent-gold"),
    "Quiz must not use accent-gold on unchecked choice rings"
  );
});

test("Quiz: no hover transition on every choice card", () => {
  assert.ok(
    !source.includes("hover:border-gold/40"),
    "Quiz choice cards must not have hover transitions on every card"
  );
});

test("Quiz: keyboard shortcuts (1-4, Enter) preserved", () => {
  assert.ok(
    source.includes("Number(e.key)"),
    "Quiz must keep digit-based answer selection"
  );
  assert.ok(
    source.includes('e.key === "Enter"'),
    "Quiz must keep Enter to submit or advance"
  );
});
