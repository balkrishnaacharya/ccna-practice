mod common;

use ccna_practice_lib::notifications::*;
use rusqlite::Connection;

fn todays_ordinal(conn: &Connection) -> i64 {
    conn.query_row(
        "SELECT CAST(julianday(date('now', 'localtime')) AS INTEGER)",
        [],
        |r| r.get(0),
    )
    .unwrap()
}

#[test]
fn test_settings_defaults() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        let settings = get_notification_settings(conn).unwrap();
        assert!(settings.enabled, "notifications enabled by default");
        assert_eq!(settings.reminder_time, "09:00");
        assert_eq!(settings.quiet_start, "21:00");
        assert_eq!(settings.quiet_end, "08:00");
        assert_eq!(settings.review_threshold, 3);
        assert!(!settings.weekly_summary, "weekly summary off by default");
        assert!(settings.streak_at_risk, "streak at risk on by default");
    });
}

#[test]
fn test_quiet_hours_midnight_crossing() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        // Default quiet hours 21:00-08:00 (midnight crossing)
        assert!(is_in_quiet_hours(conn, 22).unwrap(), "22:00 in quiet hours");
        assert!(is_in_quiet_hours(conn, 21).unwrap(), "21:00 at start (inclusive)");
        assert!(is_in_quiet_hours(conn, 2).unwrap(), "02:00 after midnight");
        assert!(!is_in_quiet_hours(conn, 8).unwrap(), "08:00 at end (exclusive)");
        assert!(!is_in_quiet_hours(conn, 20).unwrap(), "20:00 before start");
        assert!(!is_in_quiet_hours(conn, 12).unwrap(), "12:00 not in range");
    });
}

#[test]
fn test_quiet_hours_normal_range() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        conn.execute(
            "UPDATE notification_preferences SET value = '22:00' WHERE key = 'notif_quiet_start'",
            [],
        )
        .unwrap();
        conn.execute(
            "UPDATE notification_preferences SET value = '06:00' WHERE key = 'notif_quiet_end'",
            [],
        )
        .unwrap();

        assert!(is_in_quiet_hours(conn, 23).unwrap(), "23:00 in range");
        assert!(is_in_quiet_hours(conn, 22).unwrap(), "22:00 at start (inclusive)");
        assert!(!is_in_quiet_hours(conn, 21).unwrap(), "21:00 before start");
        assert!(!is_in_quiet_hours(conn, 6).unwrap(), "06:00 at end (exclusive)");
        assert!(!is_in_quiet_hours(conn, 12).unwrap(), "12:00 not in range");
    });
}

#[test]
fn test_study_reminder_goal_met_suppressed() {
    let (db, dir) = common::setup_integration_db();
    let today = todays_ordinal(&db.0.lock().unwrap());

    common::with_locked(&db, |conn| {
        // Set daily goal to 2
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('daily_goal', '2')",
            [],
        )
        .unwrap();

        // Insert questions first (FK constraint)
        common::insert_question(conn, 1, "q1", "network_infra", "easy", 0, "");
        common::insert_choice(conn, 101, 1, "A", true);
        common::insert_choice(conn, 102, 1, "B", false);
        common::insert_question(conn, 2, "q2", "switching", "easy", 0, "");
        common::insert_choice(conn, 103, 2, "A", true);
        common::insert_choice(conn, 104, 2, "B", false);

        // Insert 2 answers today (goal met)
        let today_epoch = common::noon_epoch(conn, 0);
        common::add_answer(conn, 1, true, today_epoch);
        common::add_answer(conn, 2, false, today_epoch);

        assert!(
            !should_send_study_reminder(conn, today, 10).unwrap(),
            "goal met should suppress reminder"
        );
    });
}

#[test]
fn test_study_reminder_allowed() {
    let (db, dir) = common::setup_integration_db();
    let today = todays_ordinal(&db.0.lock().unwrap());

    common::with_locked(&db, |conn| {
        // Set daily goal to 10, no answers today (goal not met)
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('daily_goal', '10')",
            [],
        )
        .unwrap();

        assert!(
            should_send_study_reminder(conn, today, 10).unwrap(),
            "not goal met, not quiet hours, no exam → reminder allowed"
        );
    });
}

#[test]
fn test_study_reminder_in_quiet_hours_suppressed() {
    let (db, _dir) = common::setup_integration_db();
    let today = todays_ordinal(&db.0.lock().unwrap());

    common::with_locked(&db, |conn| {
        // Set daily goal high, no answers today
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('daily_goal', '10')",
            [],
        )
        .unwrap();

        // 23:00 is in default quiet hours (21:00-08:00)
        assert!(
            !should_send_study_reminder(conn, today, 23).unwrap(),
            "quiet hours suppress reminder"
        );
    });
}

#[test]
fn test_streak_at_risk_detection() {
    let (db, dir) = common::setup_integration_db();
    let today = todays_ordinal(&db.0.lock().unwrap());

    common::with_locked(&db, |conn| {
        // Insert questions (FK constraint)
        common::insert_question(conn, 1, "q1", "network_infra", "easy", 0, "");
        common::insert_choice(conn, 101, 1, "A", true);
        common::insert_choice(conn, 102, 1, "B", false);
        common::insert_question(conn, 2, "q2", "switching", "easy", 0, "");
        common::insert_choice(conn, 103, 2, "A", true);
        common::insert_choice(conn, 104, 2, "B", false);

        // streak = 0 → not at risk
        assert!(!is_streak_at_risk(conn, today, 0).unwrap());

        // streak = 3, today not answered, yesterday answered → at risk
        let yesterday_epoch = common::noon_epoch(conn, 1);
        common::add_answer(conn, 1, true, yesterday_epoch);
        assert!(is_streak_at_risk(conn, today, 3).unwrap());

        // streak = 3, today answered → not at risk (streak continues)
        let today_epoch = common::noon_epoch(conn, 0);
        common::add_answer(conn, 2, true, today_epoch);
        assert!(!is_streak_at_risk(conn, today, 3).unwrap());
    });
}

#[test]
fn test_review_reminder_threshold() {
    let (db, dir) = common::setup_integration_db();
    let today = todays_ordinal(&db.0.lock().unwrap());

    common::with_locked(&db, |conn| {
        // Set review threshold to 3
        conn.execute(
            "INSERT OR REPLACE INTO notification_preferences (key, value) VALUES ('notif_review_threshold', '3')",
            [],
        )
        .unwrap();

        // Insert 2 questions with next_review_at = 0 (due immediately)
        common::insert_question(conn, 101, "due q1", "network_infra", "easy", 0, "");
        common::insert_choice(conn, 1001, 101, "A", true);
        common::insert_choice(conn, 1002, 101, "B", false);
        conn.execute(
            "INSERT INTO user_question_stats (question_id, next_review_at) VALUES (101, 0)",
            [],
        )
        .unwrap();

        common::insert_question(conn, 102, "due q2", "switching", "easy", 0, "");
        common::insert_choice(conn, 1003, 102, "A", true);
        common::insert_choice(conn, 1004, 102, "B", false);
        conn.execute(
            "INSERT INTO user_question_stats (question_id, next_review_at) VALUES (102, 0)",
            [],
        )
        .unwrap();

        // Only 2 due, below threshold of 3 → no reminder
        assert!(
            !should_send_review_reminder(conn, today, 10).unwrap(),
            "below threshold → no review reminder"
        );

        // Insert a 3rd due question
        common::insert_question(conn, 103, "due q3", "ip_routing", "easy", 0, "");
        common::insert_choice(conn, 1005, 103, "A", true);
        common::insert_choice(conn, 1006, 103, "B", false);
        conn.execute(
            "INSERT INTO user_question_stats (question_id, next_review_at) VALUES (103, 0)",
            [],
        )
        .unwrap();

        // 3 due, meets threshold → reminder allowed
        assert!(
            should_send_review_reminder(conn, today, 10).unwrap(),
            "at threshold → review reminder allowed"
        );
    });
}

#[test]
fn test_no_repeat_reminder_same_day() {
    let (db, dir) = common::setup_integration_db();
    let today = todays_ordinal(&db.0.lock().unwrap());

    common::with_locked(&db, |conn| {
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('daily_goal', '10')",
            [],
        )
        .unwrap();

        // First call: no previous reminder → allowed
        assert!(
            should_send_study_reminder(conn, today, 10).unwrap(),
            "first reminder today allowed"
        );

        // Record that we sent one today
        record_notification_event(conn, "study_reminder", "Test", "Body").unwrap();

        // Second call: already sent today → suppressed
        assert!(
            !should_send_study_reminder(conn, today, 10).unwrap(),
            "already sent today → suppressed"
        );
    });
}
