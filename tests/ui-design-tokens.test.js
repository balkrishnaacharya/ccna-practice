import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
test("Design system: defines reusable color tokens", () => {
  assert.ok(
    css.includes("#181815") || css.includes("bg-[#181815]"),
    "Background color #181815 is defined"
  );
  assert.ok(
    css.includes("#B8842A") || css.includes("bg-[#B8842A]"),
    "Gold accent #B8842A is defined"
  );
});
test("Design system: centralized design tokens file exists", () => {
  assert.ok(
    readFileSync(new URL("../src/lib/design-tokens.js", import.meta.url), "utf8").includes("export"),
    "design-tokens.js must export token values"
  );
});
