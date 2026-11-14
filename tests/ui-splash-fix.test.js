import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../src/components/SplashAnimation.jsx", import.meta.url),
  "utf8"
);

test("SplashAnimation: registers GSAP timeline labels for reliable onComplete", () => {
  assert.ok(
    source.includes("tl.addLabel("),
    "GSAP timeline must use addLabel() for reliable sequencing"
  );
});

test("SplashAnimation: single source of truth for animation progress (no rAF override of state.t)", () => {
  assert.ok(
    !source.includes("state.t ="),
    "state.t must not be overwritten by rAF advance loop - use GSAP only"
  );
});

test("SplashAnimation: canvas gets valid dimensions (not 0x0 on first render)", () => {
  assert.ok(
    source.includes("getBoundingClientRect") ||
      source.includes("offsetWidth") ||
      source.includes("offsetHeight"),
    "must read canvas dimensions for proper sizing"
  );
});

test("SplashAnimation: cleanup removes event listeners and kills timeline", () => {
  assert.ok(source.includes("tl.kill()"), "must kill GSAP timeline on cleanup");
  assert.ok(
    source.includes("removeEventListener"),
    "must remove event listeners on cleanup"
  );
});
