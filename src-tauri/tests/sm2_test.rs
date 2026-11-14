mod common;

use ccna_practice_lib::commands;

#[test]
fn test_record_question_stat_sm2_first_correct() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        common::insert_question(conn, 1, "q", "network_infra", "easy", 0, "");
    });
    common::with_locked(&db, |conn| {
        commands::record_question_stat(conn, 1, true, 1000)
    })
    .unwrap();
    let (ef, iv, rp): (f64, i64, i64) = common::with_locked(&db, |conn| {
        conn.query_row(
            "SELECT ease_factor, interval_days, repetitions FROM user_question_stats WHERE question_id=1",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .unwrap()
    });
    assert!((ef - 2.5).abs() < 0.001);
    assert_eq!(iv, 1);
    assert_eq!(rp, 1);
}

#[test]
fn test_record_question_stat_incorrect_resets() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        common::insert_question(conn, 1, "q", "network_infra", "easy", 0, "");
        conn.execute(
            "INSERT INTO user_question_stats (question_id, times_seen, times_correct, ease_factor, interval_days, repetitions) VALUES (1, 3, 2, 2.5, 6, 2)",
            [],
        )
        .unwrap();
    });
    common::with_locked(&db, |conn| {
        commands::record_question_stat(conn, 1, false, 2000)
    })
    .unwrap();
    let (ef, iv, rp): (f64, i64, i64) = common::with_locked(&db, |conn| {
        conn.query_row(
            "SELECT ease_factor, interval_days, repetitions FROM user_question_stats WHERE question_id=1",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .unwrap()
    });
    assert!((ef - 1.96).abs() < 0.001);
    assert_eq!(iv, 1);
    assert_eq!(rp, 0);
}
