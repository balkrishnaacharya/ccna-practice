use crate::db::Db;
use rusqlite::{params, Connection, OptionalExtension, Result};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

// ─── Notification settings ───────────────────────────────────────────────────

/// User-configurable notification preferences, persisted in the
/// `notification_preferences` table.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NotificationSettings {
    pub enabled: bool,
    pub reminder_time: String,     // "HH:MM" local time
    pub quiet_start: String,       // "HH:MM" local time
    pub quiet_end: String,         // "HH:MM" local time
    pub review_threshold: i64,     // min due questions before review reminder
    pub weekly_summary: bool,      // weekly summary enabled
    pub streak_at_risk: bool,      // streak-at-risk reminders enabled
}

/// A recorded notification event, used for history and dedup.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NotificationEvent {
    pub id: i64,
    pub event_type: String,
    pub title: String,
    pub body: String,
    pub occurred_at: i64,
    pub dismissed_at: Option<i64>,
}

/// Read notification preferences from the DB. Idempotent defaults are
/// inserted by `db::init`, so this always finds rows.
pub fn get_notification_settings(conn: &Connection) -> Result<NotificationSettings, String> {
    let get_val = |key: &str| -> Result<String, String> {
        conn.query_row(
            "SELECT value FROM notification_preferences WHERE key = ?1",
            params![key],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("missing notification preference: {}", key))
    };

    let enabled: bool = get_val("notif_enabled")? == "1";
    let reminder_time = get_val("notif_reminder_time")?;
    let quiet_start = get_val("notif_quiet_start")?;
    let quiet_end = get_val("notif_quiet_end")?;
    let review_threshold: i64 = get_val("notif_review_threshold")?
        .parse()
        .unwrap_or(3);
    let weekly_summary: bool = get_val("notif_weekly_summary")? == "1";
    let streak_at_risk: bool = get_val("notif_streak_at_risk")? == "1";

    Ok(NotificationSettings {
        enabled,
        reminder_time,
        quiet_start,
        quiet_end,
        review_threshold,
        weekly_summary,
        streak_at_risk,
    })
}

/// Current hour of day (0-23) from a Unix epoch timestamp.
pub fn hour_of_day(now_epoch: i64) -> i64 {
    (now_epoch / 3600) % 24
}

/// True when `now_hour` falls inside the quiet-hours window.
/// Handles midnight-crossing ranges (e.g. 21:00-08:00).
pub fn is_in_quiet_hours(conn: &Connection, now_hour: i64) -> Result<bool, String> {
    let settings = get_notification_settings(conn)?;

    let start_hour: i64 = settings
        .quiet_start
        .split(':')
        .next()
        .and_then(|s| s.parse().ok())
        .unwrap_or(21);
    let end_hour: i64 = settings
        .quiet_end
        .split(':')
        .next()
        .and_then(|s| s.parse().ok())
        .unwrap_or(8);

    if start_hour < end_hour {
        // Normal range (e.g. 22:00-06:00): start <= now < end
        Ok(now_hour >= start_hour && now_hour < end_hour)
    } else {
        // Midnight-crossing (e.g. 21:00-08:00): now >= start OR now < end
        Ok(now_hour >= start_hour || now_hour < end_hour)
    }
}

/// True when today's answered count meets the daily goal.
pub fn is_goal_met_today(conn: &Connection, today_ordinal: i64) -> Result<bool, String> {
    let goal: i64 = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'daily_goal'",
            [],
            |r| r.get::<_, String>(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
        .and_then(|raw| raw.trim().parse::<i64>().ok())
        .filter(|g| *g > 0)
        .map(|g| g.min(500))
        .unwrap_or(12);

    let answered: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM answers
             WHERE CAST(julianday(date(answered_at, 'unixepoch', 'localtime')) AS INTEGER) = ?1",
            params![today_ordinal],
            |r| r.get(0),
        )
        .unwrap_or(0);

    Ok(answered >= goal)
}

/// True when the current streak is genuinely at risk of ending today:
/// streak > 0, today not yet answered, yesterday was answered.
pub fn is_streak_at_risk(
    conn: &Connection,
    today_ordinal: i64,
    current_streak: i64,
) -> Result<bool, String> {
    if current_streak == 0 {
        return Ok(false);
    }

    let today_answered: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM answers
             WHERE CAST(julianday(date(answered_at, 'unixepoch', 'localtime')) AS INTEGER) = ?1",
            params![today_ordinal],
            |r| r.get(0),
        )
        .unwrap_or(0);

    if today_answered > 0 {
        return Ok(false); // streak continues today
    }

    let yesterday_ordinal = today_ordinal - 1;
    let yesterday_answered: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM answers
             WHERE CAST(julianday(date(answered_at, 'unixepoch', 'localtime')) AS INTEGER) = ?1",
            params![yesterday_ordinal],
            |r| r.get(0),
        )
        .unwrap_or(0);

    if yesterday_answered == 0 {
        return Ok(false); // streak already broke yesterday
    }

    Ok(true)
}

/// True when a study reminder should fire right now.
pub fn should_send_study_reminder(
    conn: &Connection,
    today_ordinal: i64,
    now_hour: i64,
) -> Result<bool, String> {
    let settings = get_notification_settings(conn)?;

    if !settings.enabled {
        return Ok(false);
    }

    if is_in_quiet_hours(conn, now_hour)? {
        return Ok(false);
    }

    if is_goal_met_today(conn, today_ordinal)? {
        return Ok(false);
    }

    // Already sent a study reminder today?
    let last_sent: Option<i64> = conn
        .query_row(
            "SELECT COALESCE(MAX(CAST(julianday(date(occurred_at, 'unixepoch', 'localtime')) AS INTEGER)), -1)
             FROM notification_events WHERE event_type = ?1",
            params!["study_reminder"],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    if last_sent == Some(today_ordinal) {
        return Ok(false);
    }

    if is_exam_active(conn)? {
        return Ok(false);
    }

    Ok(true)
}

/// True when a streak-at-risk reminder should fire.
pub fn should_send_streak_at_risk(
    conn: &Connection,
    today_ordinal: i64,
    current_streak: i64,
) -> Result<bool, String> {
    let settings = get_notification_settings(conn)?;
    if !settings.enabled || !settings.streak_at_risk {
        return Ok(false);
    }

    is_streak_at_risk(conn, today_ordinal, current_streak)
}

/// True when a review reminder should fire (due count >= threshold,
/// not already sent today, not in quiet hours).
pub fn should_send_review_reminder(
    conn: &Connection,
    today_ordinal: i64,
    now_hour: i64,
) -> Result<bool, String> {
    let settings = get_notification_settings(conn)?;

    if !settings.enabled {
        return Ok(false);
    }

    if is_in_quiet_hours(conn, now_hour)? {
        return Ok(false);
    }

    let due_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM questions q
             LEFT JOIN user_question_stats s ON s.question_id = q.id
             WHERE COALESCE(s.next_review_at, 0) <= ?1",
            params![now_epoch()],
            |r| r.get(0),
        )
        .unwrap_or(0);

    if due_count < settings.review_threshold {
        return Ok(false);
    }

    // Already sent a review reminder today?
    let last_sent: Option<i64> = conn
        .query_row(
            "SELECT COALESCE(MAX(CAST(julianday(date(occurred_at, 'unixepoch', 'localtime')) AS INTEGER)), -1)
             FROM notification_events WHERE event_type = ?1",
            params!["review_reminder"],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    if last_sent == Some(today_ordinal) {
        return Ok(false);
    }

    Ok(true)
}

/// Record a sent notification event for history and dedup.
pub fn record_notification_event(
    conn: &Connection,
    event_type: &str,
    title: &str,
    body: &str,
) -> Result<i64, String> {
    conn.execute(
        "INSERT INTO notification_events (event_type, title, body, occurred_at)
         VALUES (?1, ?2, ?3, ?4)",
        params![event_type, title, body, now_epoch()],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

/// Return recent notification events, most recent first.
pub fn get_notification_events(
    conn: &Connection,
    limit: Option<i64>,
) -> Result<Vec<NotificationEvent>, String> {
    let mut sql = String::from(
        "SELECT id, event_type, title, body, occurred_at, dismissed_at
         FROM notification_events
         ORDER BY occurred_at DESC",
    );
    if let Some(limit) = limit {
        sql.push_str(&format!(" LIMIT {}", limit));
    }

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |r| {
            Ok(NotificationEvent {
                id: r.get(0)?,
                event_type: r.get(1)?,
                title: r.get(2)?,
                body: r.get(3)?,
                occurred_at: r.get(4)?,
                dismissed_at: r.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut events = Vec::new();
    for row in rows {
        events.push(row.map_err(|e| e.to_string())?);
    }
    Ok(events)
}

/// True when an exam session is currently active (started, not ended).
pub fn is_exam_active(conn: &Connection) -> Result<bool, String> {
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sessions WHERE mode = 'exam' AND ended_at IS NULL",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);
    Ok(count > 0)
}

fn now_epoch() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

/// Status of all reminder types, computed from current DB state.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ReminderStatus {
    pub study_reminder: bool,
    pub streak_at_risk: bool,
    pub review_reminder: bool,
    pub today_ordinal: i64,
    pub now_hour: i64,
}

/// Today's Julian day ordinal in local time (same convention as commands.rs).
fn today_ordinal(conn: &Connection) -> Result<i64, String> {
    conn.query_row(
        "SELECT CAST(julianday(date('now', 'localtime')) AS INTEGER)",
        [],
        |r| r.get(0),
    )
    .map_err(|e| e.to_string())
}

/// Combined reminder status: which reminders should fire right now.
pub fn check_reminder_status(conn: &Connection) -> Result<ReminderStatus, String> {
    let today = today_ordinal(conn)?;
    let now_hour = hour_of_day(now_epoch());

    let study = should_send_study_reminder(conn, today, now_hour)?;
    let streak = should_send_streak_at_risk(conn, today, streak_current(conn)?)?;
    let review = should_send_review_reminder(conn, today, now_hour)?;

    Ok(ReminderStatus {
        study_reminder: study,
        streak_at_risk: streak,
        review_reminder: review,
        today_ordinal: today,
        now_hour,
    })
}

/// Current streak count from the DB.
fn streak_current(conn: &Connection) -> Result<i64, String> {
    // Read current_streak by recomputing from activity: count consecutive
    // days ending today (or yesterday if today not answered).
    let today_answered: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM answers
             WHERE CAST(julianday(date(answered_at, 'unixepoch', 'localtime')) AS INTEGER) = ?1",
            params![today_ordinal(conn)?],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let today = today_ordinal(conn)?;
    let mut streak = 0;
    let mut cursor = if today_answered > 0 { today } else { today - 1 };
    loop {
        let day_answered: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM answers
                 WHERE CAST(julianday(date(answered_at, 'unixepoch', 'localtime')) AS INTEGER) = ?1",
                params![cursor],
                |r| r.get(0),
            )
            .unwrap_or(0);
        if day_answered == 0 {
            break;
        }
        streak += 1;
        cursor -= 1;
    }
    Ok(streak)
}

// ─── Tauri command wrappers ─────────────────────────────────────────────────

/// Tauri command: get notification settings.
#[tauri::command]
pub fn get_notification_settings_cmd(db: State<Db>) -> Result<NotificationSettings, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    get_notification_settings(&conn)
}

/// Tauri command: update a single notification setting.
#[tauri::command]
pub fn update_notification_setting_cmd(
    db: State<Db>,
    key: String,
    value: String,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO notification_preferences (key, value) VALUES (?1, ?2)",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Tauri command: record an in-app notification event.
#[tauri::command]
pub fn send_in_app_notification_cmd(
    db: State<Db>,
    event_type: String,
    title: String,
    body: String,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    record_notification_event(&conn, &event_type, &title, &body)?;
    Ok(())
}

/// Tauri command: get notification history.
#[tauri::command]
pub fn get_notification_history_cmd(
    db: State<Db>,
    limit: Option<i64>,
) -> Result<Vec<NotificationEvent>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    get_notification_events(&conn, limit)
}

/// Tauri command: compute whether any reminder should fire now.
#[tauri::command]
pub fn check_reminder_status_cmd(db: State<Db>) -> Result<ReminderStatus, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    check_reminder_status(&conn)
}
