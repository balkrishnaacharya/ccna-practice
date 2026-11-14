import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../src/components/layout/FloatingDock.jsx", import.meta.url),
  "utf8"
);

test("Bottom nav: uses MagicUI Dock component", () => {
  assert.ok(
    source.includes("Dock") || source.includes("dock"),
    "Bottom nav must use MagicUI Dock component"
  );
});

test("Bottom nav: no ALL-CAPS tracking-tighter labels", () => {
  assert.ok(
    !source.includes("uppercase tracking-tighter") &&
      !source.includes("uppercase tracking-wider"),
    "Bottom nav labels must be sentence case, not uppercase tracked-out"
  );
});

test("Bottom nav: no redundant tooltip wrappers duplicating visible labels", () => {
  assert.ok(
    !source.includes("TooltipContent"),
    "Bottom nav must not wrap visible labels in redundant TooltipContent"
  );
});

test("Bottom nav: no dead opacity-0 will-change dot indicators", () => {
  assert.ok(
    !source.includes("opacity-0 will-change"),
    "Bottom nav must not have dead opacity-0 will-change indicator dots"
  );
});

test("Bottom nav: keeps floating Exam action button", () => {
  assert.ok(
    source.includes("Exam"),
    "Bottom nav must keep the floating Exam action button"
  );
});
