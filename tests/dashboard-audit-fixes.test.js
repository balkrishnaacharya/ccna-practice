import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("Dashboard: fetches streak stats instead of reading nonexistent fields from get_stats", () => {
  const src = read("../src/pages/Dashboard.jsx");
  assert.ok(src.includes('invoke("get_streak_stats")'), "streak stats are loaded");
  assert.ok(!src.includes("stats?.daily_goal"), "daily goal no longer read from Stats");
  assert.ok(!src.includes("stats?.today_answered"), "today count no longer read from Stats");
  assert.ok(!src.includes("stats?.streak_info"), "nonexistent streak_info removed");
  assert.ok(!src.includes("stats?.recent_activity"), "nonexistent recent_activity removed");
  assert.ok(src.includes("streak?.current_streak"), "real streak is displayed");
});

test("Dashboard: recent activity maps the backend DayActivity shape", () => {
  const src = read("../src/pages/Dashboard.jsx");
  assert.ok(src.includes("streak?.recent"), "uses StreakStats.recent");
  assert.ok(src.includes("day.answered"), "uses the answered field");
  assert.ok(src.includes("day.goal_met"), "uses the goal_met field");
});

test("Review due count excludes never-seen questions", () => {
  const commands = read("../src-tauri/src/commands/stats.rs");
  const notifications = read("../src-tauri/src/notifications.rs");
  for (const [name, src] of [["get_review_due_count", commands], ["should_send_review_reminder", notifications]]) {
    const start = src.indexOf(name);
    const body = src.slice(start, start + 1200);
    assert.ok(
      body.includes("FROM user_question_stats s") && body.includes("JOIN questions q"),
      `${name} only counts studied questions`,
    );
  }
});
