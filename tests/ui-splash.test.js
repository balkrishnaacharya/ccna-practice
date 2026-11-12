import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../src/components/SplashSequence.jsx", import.meta.url),
  "utf8"
);

test("Splash: single orchestrated timeline, no multi-stage sequence", () => {
  assert.ok(
    !source.includes("addLabel"),
    "No addLabel stage labels (single moment)"
  );
  assert.ok(
    !source.includes("uppercase tracking-widest"),
    "No tracked-out caps label"
  );
  assert.ok(
    !source.includes("italic text-gold"),
    "No italic single-word accent"
  );
  assert.ok(
    source.includes('sessionStorage.setItem("ccna_splash_seen"'),
    "Safety gating preserved"
  );
  assert.ok(source.includes("setTimeout"), "Safety timeout preserved");
});
