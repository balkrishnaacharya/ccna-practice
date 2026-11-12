import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../src/pages/Quiz.jsx", import.meta.url),
  "utf8"
);

test("Question card: left frame border (gold surgical accent)", () => {
  assert.ok(
    source.includes("border-l-4") || source.includes("border-l-gold"),
    "Question card must have a left frame border (border-l-4 or border-l-gold)"
  );
});

test("Question card: hairline rule between metadata and stem", () => {
  assert.ok(
    source.includes("border-dark-borderSubtle") || source.includes("border-b"),
    "Question card must have a hairline rule separating metadata from stem"
  );
});

test("Question card: mono metadata fields", () => {
  assert.ok(
    source.includes("font-mono"),
    "Question card metadata fields must use monospace"
  );
});

test("Question card: serif stem left-aligned", () => {
  assert.ok(
    source.includes("font-serif") && source.includes("text-left"),
    "Question stem must be serif and left-aligned"
  );
});
