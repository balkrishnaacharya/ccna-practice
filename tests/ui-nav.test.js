import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../src/components/FloatingBottomNav.jsx", import.meta.url),
  "utf8"
);

test("Bottom nav: no uppercase labels", () => {
  assert.ok(
    !source.includes("uppercase"),
    "Bottom nav labels must be sentence case, not uppercase"
  );
});

test("Bottom nav: central Exam label is sentence case", () => {
  assert.ok(
    source.includes("Exam"),
    "Central Exam label present"
  );
  assert.ok(
    !source.includes("tracking-wider"),
    "Bottom nav must not use tracked-out text"
  );
});

test("Bottom nav: pill uses transform-only motion", () => {
  const gsapToMatch = source.match(/gsap\.to\(pillEl, \{[\s\S]*?\}\)/);
  assert.ok(gsapToMatch, "Pill must use GSAP to() for transform animation");
  const tweenVars = gsapToMatch[0];
  assert.ok(
    !tweenVars.includes("width") && !tweenVars.includes("height"),
    "Pill GSAP tween must not animate width/height (layout properties)"
  );
  assert.ok(
    tweenVars.includes("x:") || tweenVars.includes("y:"),
    "Pill GSAP tween must animate x/y (transform)"
  );
});
