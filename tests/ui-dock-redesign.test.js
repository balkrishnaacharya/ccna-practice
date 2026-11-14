import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/components/layout/FloatingDock.jsx", import.meta.url), "utf8");
test("FloatingDock: uses consistent icon size (18px) and labels", () => {
  assert.ok(source.includes("size={18}"), "Icons use consistent 18px size");
  assert.ok(source.includes("aria-label"), "Items have accessible labels");
});
test("FloatingDock: no pointer-events-none, no oversized magnification", () => {
  assert.ok(!source.includes("pointer-events-none"), "No pointer-events-none");
  assert.ok(
    !source.includes("iconMagnification={48}"),
    "No oversized 48px magnification"
  );
});
test("FloatingDock: responsive padding and safe-area", () => {
  assert.ok(source.includes("sm:px-6") || source.includes("px-3"), "Responsive padding");
  assert.ok(source.includes("safe-bottom") || source.includes("var(--safe-bottom)"), "Mobile safe-area");
});
