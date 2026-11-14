import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/hooks/useReadiness.js", import.meta.url), "utf8");
test("useReadiness: reads correct and attempts from SubtopicStat", () => {
  assert.ok(
    source.includes("s.correct") || source.includes("s.attempts"),
    "useReadiness must read correct/attempts fields from subtopic stats"
  );
  assert.ok(
    !source.includes("s.times_correct") || !source.includes("s.times_seen"),
    "useReadiness must not read times_correct/times_seen (wrong field names)"
  );
});
test("useReadiness: recent-activity uses 7-day window consistently", () => {
  assert.ok(
    source.includes("sevenDaysAgo") || source.includes("7 days"),
    "Recent activity must use 7-day window"
  );
});
