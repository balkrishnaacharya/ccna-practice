import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const dock = readFileSync(new URL("../src/components/layout/FloatingDock.jsx", import.meta.url), "utf8");

test("Dock regression: no pointer-events-none on container", () => {
  assert.ok(!dock.includes("pointer-events-none"), "Dock container must not block pointer events");
});

test("Dock regression: center Exam button uses onOpenExamModal", () => {
  assert.ok(dock.includes("onOpenExamModal"), "Dock must reference onOpenExamModal prop");
  assert.ok(
    !dock.includes('guardNavigation(e, "/practical-exam")'),
    "Center exam button must not navigate to practical-exam"
  );
});

test("Dock regression: consistent icon size", () => {
  assert.ok(dock.includes("size={18}"), "Dock icons must use consistent 18px size");
});

test("Dock regression: accessible labels", () => {
  assert.ok(dock.includes("aria-label"), "Dock items must have aria-label attributes");
});

test("Dock regression: mobile safe-area", () => {
  assert.ok(
    dock.includes("var(--safe-bottom)") || dock.includes("safe-bottom"),
    "Dock must respect mobile safe-area insets"
  );
});

test("Dock regression: focus-visible ring for keyboard navigation", () => {
  assert.ok(dock.includes("focus-visible:ring"), "Dock items must have focus-visible ring");
});
