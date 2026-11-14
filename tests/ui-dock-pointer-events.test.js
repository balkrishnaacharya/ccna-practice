import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/components/layout/FloatingDock.jsx", import.meta.url), "utf8");
test("FloatingDock: container does not use pointer-events-none", () => {
  assert.ok(
    !source.includes("pointer-events-none"),
    "Dock container must not use pointer-events-none"
  );
  assert.ok(
    source.includes("onOpenExamModal"),
    "onOpenExamModal prop must be referenced"
  );
  assert.ok(
    !source.includes('guardNavigation(e, "/practical-exam")'),
    "Center exam button must not navigate to practical-exam"
  );
});
