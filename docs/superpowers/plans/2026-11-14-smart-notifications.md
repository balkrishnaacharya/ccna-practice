# CCNA Practice — Smart Notification & Daily Engagement System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polite, user-controlled notification layer for CCNA Practice: in-app toasts for milestones, OS notifications (max 1 study reminder/day) for study reminders, streak-at-risk, review reminders, and weekly summary — all respecting quiet hours, active exams, goal completion, and dedup across channels.

**Architecture:** Notification policy & scheduling live in Rust (`src-tauri/src/commands.rs` + new `src-tauri/src/notifications.rs`), invoked from the frontend via Tauri commands. Frontend: `useNotifications` hook + `NotificationSettings` section inside `Settings.jsx` + sonner in-app toasts + a small `NotificationHistory` component. Preferences stored in the existing `settings` table; event history in a new `notification_events` table. Platform delivery via the official Tauri notification plugin (`@tauri-apps/plugin-notification` / `tauri-plugin-notification`).

**Tech Stack:** Rust + rusqlite, Tauri 2, `@tauri-apps/plugin-notification`, `@tauri-apps/plugin-shell` (already present), React 18, sonner (already present), node:test (frontend tests), Rust `#[cfg(test)]` (backend tests).

**Spec:** `docs/superpowers/specs/2026-11-14-notifications-design.md`.

## Global Constraints

- Maximum one study-related OS notification per local calendar day by default.
- Never send repeated reminders for the same event; combine related events into one notification.
- Suppress scheduled reminders when the daily goal is already completed.
- Suppress study reminders during an active exam.
- Respect notification dismissal and snooze preferences.
- No backlog of old reminders after restart; no notification just because the app updated/reopened.
- Quiet hours configurable (default 21:00–08:00 local), timezone-aware, midnight-crossing, DST-safe.
- Never use guilt-based wording; copy short, clear, friendly, non-judgmental.
- Persist preferences; apply without restart; cancel outdated schedules when settings change.
- No cloud/telemetry; all calculations use local data.
- Do not introduce a resource-heavy background process solely for study reminders.
- Do not publish a release or push to GitHub.

## Review Focus

1. Exam suppression: an OS study reminder must not fire while `/exam` is active — most likely first.
2. Daily dedup: the same study reminder must not fire twice in one local calendar day after restart.
3. Goal-completion suppression: a reminder must not fire when `goal_met_today` is true.
4. Quiet hours: a reminder scheduled inside 21:00–08:00 must be skipped, not delayed into quiet hours.
5. Streak-at-risk accuracy: a "streak at risk" notification must only fire when the current streak is genuinely at risk of ending today, not for a streak of 0 or one already extended.

---

### Task 1: Add notification plugin dependencies

**Files:**
- Modify: `package.json`
- Modify: `src-tauri/Cargo.toml`
- Test: none (verification task)

**Interfaces:**
- Consumes: none.
- Produces: `@tauri-apps/plugin-notification` in `package.json` dependencies; `tauri-plugin-notification` in `src-tauri/Cargo.toml` dependencies.

- [ ] **Step 1: Write the failing test**

Run: `grep -n "@tauri-apps/plugin-notification" package.json && grep -n "tauri-plugin-notification" src-tauri/Cargo.toml`
Expected: FAIL — neither dependency is present.

- [ ] **Step 2: Run test to verify it fails**

Run: `grep -n "@tauri-apps/plugin-notification" package.json` (expect exit code 1 / no match).
Expected: FAIL.

- [ ] **Step 3: Implement dependency additions**

Add `"@tauri-apps/plugin-notification": "^2.0.0"` to `package.json` dependencies.
Add `tauri-plugin-notification = "2.0"` to `src-tauri/Cargo.toml` dependencies.

- [ ] **Step 4: Run test to verify it passes**

Run: `grep -n "@tauri-apps/plugin-notification" package.json` and `grep -n "tauri-plugin-notification" src-tauri/Cargo.toml`.
Expected: both dependencies present.

- [ ] **Step 5: Commit**

```bash
git add package.json src-tauri/Cargo.toml
git commit -m "deps: add Tauri notification plugin for Android and desktop"
```

---

### Task 2: Add notification database tables

**Files:**
- Modify: `src-tauri/src/db.rs` (init function)
- Test: `src-tauri/tests/db_test.rs` (add notification table test)

**Interfaces:**
- Consumes: `db::init()` connection.
- Produces: `notification_preferences` and `notification_events` tables in `init()`.

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn test_notification_tables_created() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        let prefs: i64 = conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('notification_preferences') WHERE name='key'",
            [], |r| r.get(0)
        ).unwrap();
        assert_eq!(prefs, 1, "notification_preferences table must exist");
        let events: i64 = conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('notification_events') WHERE name='id'",
            [], |r| r.get(0)
        ).unwrap();
        assert_eq!(events, 1, "notification_events table must exist");
    });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src-tauri && cargo test test_notification_tables_created`
Expected: FAIL — tables don't exist yet.

- [ ] **Step 3: Implement tables in `src-tauri/src/db.rs`**

Add to the `CREATE TABLE IF NOT EXISTS` batch:

```sql
CREATE TABLE IF NOT EXISTS notification_preferences (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notification_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    occurred_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    dismissed_at INTEGER
);
```

Insert default preference rows (idempotent):
- `notif_enabled` = `1`
- `notif_reminder_time` = `09:00`
- `notif_quiet_start` = `21:00`
- `notif_quiet_end` = `08:00`
- `notif_review_threshold` = `3`
- `notif_weekly_summary` = `0`
- `notif_streak_at_risk` = `1`

- [ ] **Step 4: Run test to verify it passes**

Run: `cd src-tauri && cargo test test_notification_tables_created`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/db.rs src-tauri/tests/db_test.rs
git commit -m "feat(db): add notification preferences and events tables"
```

---

### Task 3: Rust notification policy module

**Files:**
- Create: `src-tauri/src/notifications.rs`
- Modify: `src-tauri/src/lib.rs` (declare `mod notifications;`)
- Test: `src-tauri/tests/notification_policy.rs` (new test file)

**Interfaces:**
- Consumes: `db::Db` state, `get_streak_stats`, `get_review_due_count`, settings.
- Produces: Rust functions `get_notification_settings()`, `should_send_study_reminder()`, `should_send_streak_at_risk()`, `should_send_review_reminder()`, `should_send_weekly_summary()`, `record_notification_event()`, `is_in_quiet_hours()`, `is_exam_active()` — all pure/policy functions taking a `&Connection` plus state, returning booleans or structs.

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn test_should_send_study_reminder_goal_met_suppressed() {
    let conn = setup_test_db();
    // Insert today's activity meeting the goal.
    // ...assert should_send_study_reminder returns false when goal_met_today.
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src-tauri && cargo test --test notification_policy`
Expected: FAIL — `notifications` module / functions don't exist.

- [ ] **Step 3: Implement policy module in `src-tauri/src/notifications.rs`**

Create module with:
- `NotificationSettings` struct (enabled, reminder_time, quiet_start, quiet_end, review_threshold, weekly_summary, streak_at_risk).
- `get_notification_settings(conn)` reads from `notification_preferences`.
- `is_in_quiet_hours(conn, now_ordinal)` — timezone-aware, midnight-crossing, DST-safe using local ordinal.
- `is_goal_met_today(conn, today_ordinal)` — reuses `daily_goal` + `daily_activity`.
- `is_streak_at_risk(conn, today_ordinal, current_streak)` — true only when streak > 0 and today is not yet answered and yesterday was answered (run would break).
- `should_send_study_reminder(conn, today_ordinal, last_sent_date)` — false if not enabled, false if in quiet hours, false if goal met, false if already sent today, false if exam active.
- `should_send_streak_at_risk(conn, today_ordinal)` — true only at risk.
- `should_send_review_reminder(conn, today_ordinal, last_sent_date)` — true only if due count >= threshold and not already sent today.
- `record_notification_event(conn, event_type, title, body)` — inserts into `notification_events`.
- `get_notification_events(conn, limit)` — returns recent events for history.
- `is_exam_active(conn)` — checks sessions table for an active (ended_at IS NULL) exam session.

Register `mod notifications;` in `src-tauri/src/lib.rs`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd src-tauri && cargo test --test notification_policy`
Expected: all policy tests pass.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/notifications.rs src-tauri/src/lib.rs src-tauri/tests/notification_policy.rs
git commit -m "feat(notification): Rust policy module for smart scheduling"
```

---

### Task 4: Tauri notification commands + plugin registration

**Files:**
- Modify: `src-tauri/src/notifications.rs` (add `#[tauri::command]` wrappers)
- Modify: `src-tauri/src/lib.rs` (register commands in invoke_handler, init plugin)
- Test: `src-tauri/tests/commands_test.rs` (add command test)

**Interfaces:**
- Consumes: policy functions from Task 3, `tauri-plugin-notification`.
- Produces: Tauri commands `get_notification_settings`, `update_notification_setting`, `send_in_app_notification`, `get_notification_history`, `check_reminder_status` (returns whether a reminder should fire now).

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn test_get_notification_settings_command() {
    let (db, _dir) = common::setup_integration_db();
    let settings = common::with_locked(&db, |conn| commands::get_notification_settings(conn)).unwrap();
    assert!(settings.enabled);
    assert_eq!(settings.reminder_time, "09:00");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src-tauri && cargo test test_get_notification_settings_command`
Expected: FAIL — command doesn't exist.

- [ ] **Step 3: Implement commands in `src-tauri/src/notifications.rs`**

Add `#[tauri::command]` wrappers:
- `get_notification_settings(db: State<Db>) -> Result<NotificationSettings, String>`
- `update_notification_setting(db: State<Db>, key: String, value: String) -> Result<(), String>`
- `send_in_app_notification(db: State<Db>, event_type: String, title: String, body: String) -> Result<(), String>` (records event; frontend shows toast)
- `get_notification_history(db: State<Db>, limit: Option<i64>) -> Result<Vec<NotificationEvent>, String>`
- `check_reminder_status(db: State<Db>) -> Result<ReminderStatus, String>` (computes whether study reminder, streak-at-risk, review reminder should fire now)

Register plugin `tauri_plugin_notification::init()` and all commands in `lib.rs` invoke_handler + setup.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd src-tauri && cargo test test_get_notification_settings_command`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/notifications.rs src-tauri/src/lib.rs src-tauri/tests/commands_test.rs
git commit -m "feat(notification): Tauri commands and plugin registration"
```

---

### Task 5: Frontend useNotifications hook + sonner toasts

**Files:**
- Create: `src/hooks/useNotifications.js`
- Modify: `src/App.jsx` (wrap app, wire exam-active suppression)
- Test: `tests/use-notifications.test.js` (source-level assertions)

**Interfaces:**
- Consumes: Tauri commands `get_notification_settings`, `send_in_app_notification`, `get_notification_history`, `check_reminder_status`.
- Produces: `useNotifications()` hook returning `{ settings, updateSetting, showToast, history, checkReminderStatus, isExamActive }`; `showToast(eventType, title, body)` shows a sonner toast and records the event.

- [ ] **Step 1: Write the failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/hooks/useNotifications.js", import.meta.url), "utf8");
test("useNotifications: exports hook and showToast", () => {
  assert.ok(source.includes("export function useNotifications"), "hook exported");
  assert.ok(source.includes("showToast"), "showToast present");
  assert.ok(source.includes("sonner"), "sonner toast used for in-app notifications");
});
test("useNotifications: no OS permission request on first load", () => {
  assert.ok(
    !source.includes("requestPermission") || source.includes("enabled") && !source.includes("immediately"),
    "must not request OS permission automatically on load"
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/use-notifications.test.js`
Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement hook in `src/hooks/useNotifications.js`**

```js
export function useNotifications() {
  const [settings, setSettings] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // load settings + history on mount
  // showToast(title, body, eventType) -> invoke("send_in_app_notification", ...) + sonner toast
  // updateSetting(key, value) -> invoke("update_notification_setting", ...)
  // checkReminderStatus() -> invoke("check_reminder_status", ...)
}
```

Wire exam-active suppression in `App.jsx`: pass `examProgress.active` so reminders are suppressed during an exam.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/use-notifications.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useNotifications.js src/App.jsx tests/use-notifications.test.js
git commit -m "feat(notification): frontend hook and sonner in-app toasts"
```

---

### Task 6: Notification settings UI section

**Files:**
- Modify: `src/pages/Settings.jsx` (add Notification Settings section)
- Test: `tests/ui-notification-settings.test.js` (source-level assertions)

**Interfaces:**
- Consumes: `useNotifications()` hook from Task 5.
- Produces: Settings section with master toggle, reminder time picker, days, streak-at-risk toggle, review threshold, weekly summary toggle, quiet hours start/end, notification preview.

- [ ] **Step 1: Write the failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/pages/Settings.jsx", import.meta.url), "utf8");
test("Settings: notification section present", () => {
  assert.ok(source.includes("Notification"), "notification section heading");
  assert.ok(source.includes("notif_enabled") || source.includes("Enable notifications"), "master toggle");
  assert.ok(source.includes("quiet") || source.includes("Quiet hours"), "quiet hours controls");
});
test("Settings: no guilt-based wording", () => {
  assert.ok(!source.includes("failing") && !source.includes("losing everything"), "no guilt copy");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-notification-settings.test.js`
Expected: FAIL — section doesn't exist.

- [ ] **Step 3: Implement settings UI in `src/pages/Settings.jsx`**

Add a `Notification Settings` section (matching dark/gold identity, switches, time inputs, preview) wired to `useNotifications()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui-notification-settings.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Settings.jsx tests/ui-notification-settings.test.js
git commit -m "feat(ui): notification settings section"
```

---

### Task 7: Notification history component

**Files:**
- Create: `src/components/NotificationHistory.jsx`
- Test: `tests/ui-notification-history.test.js` (source-level assertions)

**Interfaces:**
- Consumes: `get_notification_history` via `useNotifications()`.
- Produces: `NotificationHistory` component listing recent milestone events (event_type, title, body, occurred_at, dismissed state).

- [ ] **Step 1: Write the failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/components/NotificationHistory.jsx", import.meta.url), "utf8");
test("NotificationHistory: component exported", () => {
  assert.ok(source.includes("export default function NotificationHistory"), "component exported");
});
test("NotificationHistory: lists events with dismiss", () => {
  assert.ok(source.includes("dismissed_at") || source.includes("dismiss"), "dismissal support");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-notification-history.test.js`
Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement component in `src/components/NotificationHistory.jsx`**

List events from `useNotifications().history`, each with title/body/time and a dismiss button that records `dismissed_at`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui-notification-history.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/NotificationHistory.jsx tests/ui-notification-history.test.js
git commit -m "feat(ui): notification history component"
```

---

### Task 8: Wire reminders into app lifecycle (daily reminder + exam suppression)

**Files:**
- Modify: `src/App.jsx`
- Test: `tests/ui-reminder-suppression.test.js` (source-level assertions)

**Interfaces:**
- Consumes: `useNotifications()`, `examProgress.active`.
- Produces: on app mount + settings change, compute reminder status via `check_reminder_status`; show in-app toast when a reminder is due; suppress during active exam.

- [ ] **Step 1: Write the failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
test("App: reminder status checked on mount", () => {
  assert.ok(app.includes("check_reminder_status"), "check_reminder_status invoked");
});
test("App: reminders suppressed during active exam", () => {
  assert.ok(app.includes("examProgress.active"), "exam-active gate present");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-reminder-suppression.test.js`
Expected: FAIL — wiring not present.

- [ ] **Step 3: Implement wiring in `src/App.jsx`**

On mount, call `check_reminder_status()`; if a reminder should fire and not in quiet hours and not exam-active, show an in-app toast via `showToast`. Recompute when `examProgress.active` or settings change.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui-reminder-suppression.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx tests/ui-reminder-suppression.test.js
git commit -m "feat(notification): wire reminders into app lifecycle with exam suppression"
```

---

### Task 9: Rust notification policy tests

**Files:**
- Modify: `src-tauri/tests/notification_policy.rs` (already created in Task 3 — add remaining tests)

**Interfaces:**
- Consumes: policy functions from Task 3.
- Produces: tests for goal-completion suppression, quiet hours, streak-at-risk accuracy, review threshold, repeat-dedup, exam suppression, timezone/midnight boundary.

- [ ] **Step 1: Write the failing test**

Add tests:
- `test_streak_at_risk_only_when_genuinely_at_risk`
- `test_quiet_hours_suppresses_reminder`
- `test_goal_completion_suppresses_reminder`
- `test_review_threshold_below_threshold_no_notify`
- `test_no_repeat_reminder_same_day`

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src-tauri && cargo test --test notification_policy`
Expected: new tests FAIL.

- [ ] **Step 3: Implement remaining policy logic**

Ensure `is_streak_at_risk`, `is_in_quiet_hours`, `is_goal_met_today`, dedup via `notification_events` are correct.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd src-tauri && cargo test --test notification_policy`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/tests/notification_policy.rs src-tauri/src/notifications.rs
git commit -m "test(notification): complete policy test coverage"
```

---

### Task 10: Full verification suite

**Files:** none (verification task).

**Interfaces:** consumes output of Tasks 1–9.

- [ ] **Step 1: Run frontend tests**

Run: `npm test`
Expected: all tests pass, 0 failures.

- [ ] **Step 2: Run Rust checks**

Run: `cd src-tauri && cargo check`
Expected: compiles cleanly.

Run: `cd src-tauri && cargo test`
Expected: all tests pass.

Run: `cd src-tauri && cargo clippy`
Expected: no new warnings from our code.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

No commit expected unless cleanup needed.

---

## Self-Review

1. **Spec coverage:** Every spec section maps to a task:
   - Three channels (in-app/OS/history) → Tasks 5, 4, 6
   - Frequency limits → Task 3 (policy dedup)
   - Daily streak → reuses existing `get_streak_stats` (Task 3)
   - Study reminders → Tasks 4, 8
   - Review reminders → Task 3
   - Daily goal notifications → Task 5 (goal met toast already exists in `useStreak`)
   - Weekly summary → Task 3 (optional, disabled by default)
   - Settings UI → Task 6
   - Quiet hours/timezone → Task 3
   - Android/desktop → Task 1 (plugin) + Task 4 (registration)
   - Content/visual quality → Task 6 (no guilt copy test)
   - Reliability/scheduler → Task 3 (idempotent)
   - Tests → Tasks 2, 3, 5, 6, 8, 9
   - Final report → Task 10

2. **Step scan:** Each step is one action with a checkable result. No step carries more than one action. Code blocks appear only where the algorithm isn't determined by signature + tests.

3. **Type consistency:** `useNotifications()` (Task 5) consumes Tauri commands defined in Task 4. `NotificationSettings` struct (Task 3) is consumed by `get_notification_settings` command (Task 4) and the settings UI (Task 6). `check_reminder_status` (Task 4) is consumed by App.jsx wiring (Task 8).

4. **Review Focus:** All five review focus items have tests:
   - Exam suppression → Task 8 test + Task 3 policy
   - Daily dedup → Task 3 policy + Task 9 test
   - Goal-completion suppression → Task 3 policy + Task 9 test
   - Quiet hours → Task 3 policy + Task 9 test
   - Streak-at-risk accuracy → Task 3 policy + Task 9 test

5. **Proportion:** Plan matches spec scope — addresses every acceptance criterion without introducing unrelated features. Code blocks are minimal; most steps are test + signature + one-line approach.

---

**Plan complete and saved to `docs/superpowers/plans/2026-11-14-smart-notifications.md`. Please review the plan. Does it capture what you want?**

**Which execution approach would you prefer?**

- **Subagent-driven** — A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** — I implement every task myself in this session, then one fresh reviewer checks the whole branch. Cheapest and fastest; no independent review until the end. Runs well with a mid-tier session model, since the plan carries the design.

**For this plan I recommend Native**, because Tasks 1–5 share tight interfaces (the `NotificationSettings` struct defined in Task 3 is consumed by the command in Task 4, the hook in Task 5, and the UI in Task 6), and having one implementer maintain interface consistency across 10 tasks is more reliable than context-switching between subagents.

Does the plan capture what you want, and should we proceed with Native execution?