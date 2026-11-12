import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dashboard = readFileSync(
  new URL("../src/pages/Dashboard.jsx", import.meta.url),
  "utf8"
);
const quiz = readFileSync(
  new URL("../src/pages/Quiz.jsx", import.meta.url),
  "utf8"
);

test("GSAP: no ScrollTrigger in Dashboard section entrances", () => {
  assert.ok(
    !dashboard.includes("ScrollTrigger"),
    "Dashboard must not import ScrollTrigger"
  );
});

test("GSAP: no gsap timeline question-load entrance in Quiz", () => {
  assert.ok(
    !quiz.includes("cardContainerRef.current"),
    "Quiz must not animate card container on question load"
  );
});

test("GSAP: Quiz useGSAP only wraps feedback pulses", () => {
  const useGSAPMatches = quiz.matchAll(/useGSAP\(/g);
  const count = Array.from(useGSAPMatches).length;
  assert.equal(
    count,
    1,
    `Quiz must have exactly one useGSAP (feedback only), found ${count}`
  );
});

test("GSAP: prefers-reduced-motion respected in styles.css", () => {
  const styles = readFileSync(
    new URL("../src/styles.css", import.meta.url),
    "utf8"
  );
  assert.ok(
    styles.includes("prefers-reduced-motion"),
    "styles.css must respect prefers-reduced-motion"
  );
});
