import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../src/components/SplashAnimation.jsx", import.meta.url),
  "utf8"
);

test("SplashAnimation: Canvas 2D engine with CONFIG tunables", () => {
  assert.ok(source.includes("CONFIG"), "CONFIG object present");
  assert.ok(
    source.includes("#0E1118") || source.includes("chassis"),
    "chassis color #0E1118"
  );
  assert.ok(
    source.includes("gold") || source.includes("#BD8D39"),
    "gold accent"
  );
  assert.ok(source.includes("<canvas"), "canvas element rendered");
  assert.ok(
    !source.includes("<text") && !source.includes("<h"),
    "no text/logo elements"
  );
  assert.ok(source.includes("gsap.timeline"), "GSAP timeline used");
});
