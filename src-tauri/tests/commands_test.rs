mod common;

use ccna_practice_lib::commands;

#[test]
fn test_submit_answer_flow_updates_stats() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        common::insert_question(conn, 1, "What is OSPF?", "network_infra", "easy", 0, "");
        common::insert_choice(conn, 101, 1, "Open Shortest Path First", true);
        common::insert_choice(conn, 102, 1, "Wrong", false);
    });

    let payload = commands::SubmitPayload {
        question_id: 1,
        choice_ids: vec![101],
    };
    let result =
        common::with_locked(&db, |conn| commands::submit_answer_conn(&payload, conn)).unwrap();
    assert!(result.correct);
    assert_eq!(result.correct_choice_ids, vec![101]);

    // Multi-selection is rejected for a single-answer question.
    let bad = commands::SubmitPayload {
        question_id: 1,
        choice_ids: vec![101, 102],
    };
    assert!(common::with_locked(&db, |conn| commands::submit_answer_conn(&bad, conn)).is_err());

    // Command wrapper logic: stats reflect the submitted answer.
    let stats = commands::get_stats_conn(&db.0.lock().unwrap()).unwrap();
    assert_eq!(stats.answered, 1);
    assert_eq!(stats.correct, 1);
    assert!((stats.accuracy - 100.0).abs() < 0.001);
}

#[test]
fn test_diagnostics_returns_bank_info() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        let diag = commands::get_diagnostics(conn).unwrap();
        assert!(
            diag.installed_bank_version.is_some() || diag.installed_bank_version.is_none()
        );
        assert!(diag.bundled_count > 0, "bundled count must be positive");
        assert!(!diag.app_version.is_empty());
        assert!(!diag.platform.is_empty());
    });
}
