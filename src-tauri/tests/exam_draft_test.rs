mod common;

use ccna_practice_lib::commands::{
    clear_exam_draft_conn_for_test, get_exam_draft_conn_for_test,
    practice_streak_conn, save_exam_draft_conn, SaveExamDraftPayload,
};

#[test]
fn test_exam_draft_round_trip_and_clear() {
    let (db, _dir) = common::setup_integration_db();
    let payload = SaveExamDraftPayload {
        questions_json: "[{\"id\":1}]".to_string(),
        answers_json: "{\"1\":[42]}".to_string(),
        seconds_remaining: 3600,
    };

    common::with_locked(&db, |conn| {
        assert!(get_exam_draft_conn_for_test(conn).unwrap().is_none());

        save_exam_draft_conn(&payload, conn, 1000).unwrap();
        let draft = get_exam_draft_conn_for_test(conn).unwrap().unwrap();
        assert_eq!(draft.questions_json, payload.questions_json);
        assert_eq!(draft.answers_json, payload.answers_json);
        assert_eq!(draft.seconds_remaining, 3600);
        assert_eq!(draft.updated_at, 1000);

        // Upsert replaces the single draft row rather than adding another.
        let updated = SaveExamDraftPayload {
            questions_json: "[]".to_string(),
            answers_json: "{}".to_string(),
            seconds_remaining: 1800,
        };
        save_exam_draft_conn(&updated, conn, 2000).unwrap();
        let draft = get_exam_draft_conn_for_test(conn).unwrap().unwrap();
        assert_eq!(draft.seconds_remaining, 1800);
        assert_eq!(draft.updated_at, 2000);

        clear_exam_draft_conn_for_test(conn).unwrap();
        assert!(get_exam_draft_conn_for_test(conn).unwrap().is_none());
    });
}

#[test]
fn test_practice_streak_requires_five_questions_per_day() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        common::insert_question(conn, 1, "stem one", "network_infra", "easy", 0, "");

        // Four answers today must NOT count.
        let today = common::noon_epoch(conn, 0);
        for _ in 0..4 {
            common::add_answer(conn, 1, true, today);
        }
        let streak = practice_streak_conn(conn).unwrap();
        assert_eq!(streak.current, 0);
        assert_eq!(streak.min_per_day, 5);

        // A fifth answer completes today's requirement.
        common::add_answer(conn, 1, true, today);
        let streak = practice_streak_conn(conn).unwrap();
        assert_eq!(streak.current, 1);
        assert_eq!(streak.active_days, 1);

        // Yesterday with five answers extends the run.
        let yesterday = common::noon_epoch(conn, 1);
        for _ in 0..5 {
            common::add_answer(conn, 1, true, yesterday);
        }
        let streak = practice_streak_conn(conn).unwrap();
        assert_eq!(streak.current, 2);
        assert_eq!(streak.longest, 2);
    });
}
