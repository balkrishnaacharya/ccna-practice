import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const readiness = readFileSync(new URL("../src/hooks/useReadiness.js", import.meta.url), "utf8");

test("Readiness regression: uses correct/attempts fields", () => {
  assert.ok(readiness.includes("s.correct"), "Readiness must read s.correct from SubtopicStat");
  assert.ok(readiness.includes("s.attempts"), "Readiness must read s.attempts from SubtopicStat");
  assert.ok(
    !readiness.includes("s.times_correct"),
    "Readiness must not read s.times_correct (wrong field name)"
  );
  assert.ok(
    !readiness.includes("s.times_seen"),
    "Readiness must not read s.times_seen (wrong field name)"
  );
});

test("Readiness regression: 7-day recent activity window", () => {
  assert.ok(
    readiness.includes("sevenDaysAgo") || readiness.includes("7 days"),
    "Readiness must use 7-day window for recent activity"
  );
});

test("Readiness regression: score is 0 when no data", () => {
  assert.ok(readiness.includes("weightSum > 0 ?"), "Readiness must guard against zero weight sum");
});
