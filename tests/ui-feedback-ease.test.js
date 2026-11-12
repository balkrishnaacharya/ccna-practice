import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../src/pages/Quiz.jsx", import.meta.url),
  "utf8"
);

test("Quiz feedback: pulse uses power1.out ease", () => {
  assert.ok(
    source.includes('ease: "power1.out"'),
    "Feedback pulse eased to power1.out"
  );
});
