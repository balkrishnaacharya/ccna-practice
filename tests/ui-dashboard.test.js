import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../src/pages/Dashboard.jsx", import.meta.url),
  "utf8"
);

test("Dashboard: no ALL-CAPS tracking-wider labels", () => {
  assert.ok(
    !source.includes("uppercase tracking-wider"),
    "Dashboard must not use tracked-out ALL-CAPS labels"
  );
});

test("Dashboard: no right-arrow on button text", () => {
  assert.ok(!source.includes("→"), "Dashboard buttons must not end with →");
});

test("Dashboard: no ScrollTrigger section entrances", () => {
  assert.ok(
    !source.includes("ScrollTrigger"),
    "Dashboard must not import ScrollTrigger for fade-in-on-every-section"
  );
});

test("Dashboard: stat cards are differentiated, not identical kit", () => {
  const statCardMatches = source.matchAll(
    /rounded-2xl[\s\S]*?shadow-dock|shadow-dock[\s\S]*?rounded-2xl/g
  );
  const count = Array.from(statCardMatches).length;
  assert.ok(
    count < 4,
    `Expected stat cards to be differentiated (found ${count} identical rounded-2xl+shadow-dock cards), got fewer`
  );
});

test("Dashboard: data-tour attributes preserved", () => {
  assert.ok(
    source.includes('data-tour="home-welcome"'),
    "home-welcome tour anchor preserved"
  );
  assert.ok(
    source.includes('data-tour="dashboard-stats"'),
    "dashboard-stats tour anchor preserved"
  );
  assert.ok(
    source.includes('data-tour="exam-blueprint"'),
    "exam-blueprint tour anchor preserved"
  );
  assert.ok(
    source.includes('data-tour="weak-areas"'),
    "weak-areas tour anchor preserved"
  );
  assert.ok(
    source.includes('data-tour="spaced-review"'),
    "spaced-review tour anchor preserved"
  );
});
