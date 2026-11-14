mod common;

use ccna_practice_lib::commands;

#[test]
fn test_streak_stats_integration() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        for id in 1..=3 {
            common::insert_question(conn, id, &format!("q {id}"), "network_infra", "easy", 0, "");
        }
    });

    let empty = common::with_locked(&db, commands::streak_stats_conn).unwrap();
    assert_eq!(empty.daily_goal, 12);
    assert_eq!(empty.current_streak, 0);
    assert_eq!(empty.active_days, 0);
    assert_eq!(empty.recent.len(), 7);

    // Three-day streak ending yesterday, plus one isolated older day.
    for offset in [1, 2, 3] {
        common::with_locked(&db, |conn| {
            common::add_answer(conn, 1, true, common::noon_epoch(conn, offset))
        });
    }
    common::with_locked(&db, |conn| {
        common::add_answer(conn, 2, false, common::noon_epoch(conn, 6))
    });

    let stats = common::with_locked(&db, commands::streak_stats_conn).unwrap();
    assert_eq!(stats.current_streak, 3);
    assert_eq!(stats.active_days, 4);

    // Answering today extends the run.
    common::with_locked(&db, |conn| {
        common::add_answer(conn, 3, false, common::noon_epoch(conn, 0))
    });
    let stats = common::with_locked(&db, commands::streak_stats_conn).unwrap();
    assert_eq!(stats.current_streak, 4);
    assert_eq!(stats.longest_streak, 4);
    assert_eq!(stats.today_answered, 1);
    assert_eq!(stats.recent.len(), 7);
}
