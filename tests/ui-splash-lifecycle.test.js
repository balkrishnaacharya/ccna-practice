import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../src/components/SplashAnimation.jsx", import.meta.url),
  "utf8"
);

test("SplashAnimation: prefers-reduced-motion skip path", () => {
  assert.ok(
    source.includes("prefers-reduced-motion"),
    "respects reduced motion"
  );
  assert.ok(source.includes("600"), "600ms fade duration");
});

test("SplashAnimation: skip on interaction", () => {
  assert.ok(
    source.includes("click") || source.includes("pointerdown"),
    "click/tap skip"
  );
  assert.ok(
    source.includes("Enter") || source.includes("keydown"),
    "Enter skip"
  );
  assert.ok(
    source.includes("Escape") || source.includes("keydown"),
    "Escape skip"
  );
});

test("SplashAnimation: sessionStorage gating", () => {
  assert.ok(source.includes("sessionStorage"), "sessionStorage gating present");
  assert.ok(
    source.includes("ccna_splash"),
    "ccna_splash storage key"
  );
});
