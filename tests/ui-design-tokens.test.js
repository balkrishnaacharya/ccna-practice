import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("Design system: CSS mirrors the canonical palette", () => {
  const css = read("../src/styles.css");
  assert.ok(css.includes("#0E1118"), "chassis color is defined");
  assert.ok(css.includes("#BD8D39"), "gold accent is defined");
});

test("Design system: centralized tokens are the single source of truth", () => {
  const tokens = read("../src/lib/design-tokens.js");
  assert.ok(tokens.includes("export const PALETTE"), "palette is exported");
  assert.ok(tokens.includes('chassis: "#0E1118"'), "chassis token matches CSS");
  assert.ok(tokens.includes('gold: "#BD8D39"'), "gold token matches CSS");

  const tw = read("../tailwind.config.js");
  assert.ok(
    tw.includes('import { PALETTE as p } from "./src/lib/design-tokens.js"'),
    "Tailwind consumes the shared tokens",
  );
  assert.ok(tw.includes("bg: p.chassis"), "dark.bg comes from the token");
  assert.ok(tw.includes("DEFAULT: p.gold"), "gold comes from the token");
  assert.ok(!tw.includes('"#0E1118"'), "no duplicated hex in Tailwind config");
});
