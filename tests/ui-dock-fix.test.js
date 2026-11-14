import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../src/components/layout/FloatingDock.jsx", import.meta.url),
  "utf8"
);

test("Bottom nav: labels are conditionally visible (opacity-0 default, group-hover shows)", () => {
  assert.ok(
    source.includes("opacity-0") && source.includes("group-hover:opacity-100"),
    "Labels must be hidden by default and show on group hover"
  );
});

test("Bottom nav: labels show when active (opacity-100 on active)", () => {
  assert.ok(
    source.includes('"opacity-100"'),
    "Active items must show labels (opacity-100)"
  );
});

test("Bottom nav: adequate spacing between dock items (iconDistance >= 100)", () => {
  assert.ok(
    source.includes("iconDistance={120}") ||
      source.includes("iconDistance={110}") ||
      source.includes("iconDistance={100}"),
    "Dock iconDistance must be >= 100 to prevent label crowding"
  );
});
