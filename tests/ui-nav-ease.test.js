import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../src/components/FloatingBottomNav.jsx", import.meta.url),
  "utf8"
);

test("Bottom nav pill: ease uses power1.out", () => {
  assert.ok(
    source.includes('ease: "power1.out"'),
    "Pill follow eased to power1.out"
  );
});
