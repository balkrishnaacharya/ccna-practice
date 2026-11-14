# CCNA Practice — Smart Notification & Daily Engagement System Design

**Intent / Why:** The app has no notification system beyond a single sonner toast for daily-goal completion. Users who close the app get no useful nudges, and there's no intelligent scheduling, quiet-hours, dedup, or per-platform notification delivery. This design adds a polite, user-controlled notification layer so CCNA Practice feels like a helpful learning companion rather than a silent tool or a spam source.

**Goals (non-goals in brackets):**
- In-app toast notifications for milestones (daily goal, streak, exam completion) while the app is open.
- OS notifications for genuinely useful events when the app is closed: scheduled study reminder, streak-at-risk, optional review reminder, optional weekly summary. [Not: per-question feedback, promotional content, every minor interaction.]
- A central notification policy that dedupes, enforces per-day/per-week limits, respects quiet hours and active-exam suppression, and is idempotent across restarts.
- A Settings section to enable/disable each category, pick reminder time/days, set quiet hours, and preview notification wording. [Not: a cloud service, telemetry, or any data leaving the device.]
- Streak calculations reuse the existing `get_streak_stats` backend (study day = ≥1 question answered); reminder logic reuses `get_review_due_count` and `daily_goal`. [Not: rewriting the streak or review algorithms.]
- Android + desktop parity on the notification *policy*; platform-specific delivery via the official Tauri notification plugin. [Not: claiming scheduled notifications work while the desktop app is fully closed unless the OS genuinely supports it — documented honestly.]

**Constraints (copied verbatim from spec):**
- Maximum one study-related OS notification per local calendar day by default.
- Never send repeated reminders for the same event; combine related events into one notification.
- Suppress scheduled reminders when the daily goal is already completed.
- Suppress study reminders during an active exam.
- Respect notification dismissal and snooze preferences.
- No backlog of old reminders after restart; no notification just because the app updated/reopened.
- Quiet hours configurable (default 21:00–08:00 local), timezone-aware, midnight-crossing, DST-safe.
- Never use guilt-based wording; keep copy short, clear, friendly, non-judgmental.
- Persist preferences; apply without restart; cancel outdated schedules when settings change.
- Do not introduce a large notification dependency or resource-heavy background process.
- No cloud/telemetry; all calculations use local data.

**Approaches considered:**
- **A (chosen):** Official Tauri notification plugin (`@tauri-apps/plugin-notification` / `tauri-plugin-notification`). Official, maintained, covers Android channels + scheduled local notifications and desktop native notifications. One small dependency, fits the existing Tauri invoke pattern. Documented limitation: desktop scheduled-when-closed behavior varies by OS.
- **B (rejected):** Custom Rust background scheduler / cron. Full control but requires a wake-lock/background process and battery-heavy cross-platform timing — violates the "no resource-heavy background process" constraint.
- **C (rejected):** In-app only (sonner). Simplest but fails the OS-notification and study-reminder requirements.

**Architecture (the parts of the how decided):**
- Notification policy & scheduling live in Rust (`src-tauri/src/commands.rs` + a new `notifications.rs`), invoked from the frontend via Tauri commands. Business logic is platform-agnostic; delivery is platform-specific.
- Frontend: a `useNotifications` hook + `NotificationSettings` section inside `Settings.jsx`, plus lightweight in-app toasts via existing `sonner`. A small `NotificationHistory` component lists recent milestones.
- Persistence: notification preferences stored in the existing `settings` table (keys: `notif_enabled`, `notif_reminder_time`, `notif_quiet_start`, `notif_quiet_end`, `notif_review_threshold`, `notif_weekly_summary`, etc.) plus a new `notification_events` table (id, event_type, occurred_at, dismissed_at) for history/dedup.
- Scheduler: idempotent — each command recomputes whether a notification *should* fire now based on current DB state and stored preferences, cancels/replaces stale scheduled IDs, and never schedules the same daily reminder twice.
- Android: notification channel `ccna.study` (importance default), scheduled via plugin; exact alarms not requested.
- Desktop: OS native notification; scheduled delivery documented as OS-dependent.
- Tests: Rust tests for the policy (streak at-risk, dedup, quiet hours, exam suppression, goal-completion suppression, repeated sync idempotency) and frontend tests for the settings UI and hook behavior.

**What's left to the builder:**
- Exact Tauri notification plugin crate names/versions (to add to `Cargo.toml`/`package.json`).
- Precise notification copy wording (spec gives examples; builder finalizes).
- Which Tauri command names to use for schedule/cancel/permission.
- Whether to add a dedicated `NotificationHistory` page or a settings-panel section.

---

**Spec location:** `docs/superpowers/specs/2026-11-14-notifications-design.md` (this file).

**Approval needed:** Please confirm this design captures what you want. Any corrections (plugin preference, copy tone, default quiet hours, default goal, etc.) before I write the implementation plan and start coding?