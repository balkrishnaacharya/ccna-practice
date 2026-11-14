mod common;

use ccna_practice_lib::commands;
use std::collections::HashMap;

#[test]
fn test_get_exam_questions_returns_blueprint_count() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, common::seed_exam_bank);
    let questions = commands::get_exam_questions_conn(&db.0.lock().unwrap()).unwrap();
    assert_eq!(questions.len(), 100);
    assert!(questions.iter().all(|q| q.choices.len() == 2));

    let mut domains: HashMap<&str, usize> = HashMap::new();
    for q in &questions {
        *domains.entry(q.domain.as_str()).or_insert(0) += 1;
    }
    assert_eq!(domains["switching"], 25);
    assert_eq!(domains["ai_ops"], 10);
}

#[test]
fn test_submit_exam_scoring() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        for id in 1..=5 {
            common::insert_question(
                conn,
                id,
                &format!("q {id}"),
                "network_infra",
                "medium",
                0,
                "",
            );
            common::insert_choice(conn, id * 10 + 1, id, "correct", true);
            common::insert_choice(conn, id * 10 + 2, id, "wrong", false);
        }
    });

    let payload = commands::ExamSubmitPayload {
        answers: (1..=5)
            .map(|id| commands::ExamAnswerItem {
                question_id: id,
                choice_ids: vec![id * 10 + 1],
            })
            .collect(),
        time_spent_seconds: 60,
    };
    let now = 1_700_000_000;
    let result =
        common::with_locked(&db, |conn| commands::submit_exam_conn(&payload, conn, now)).unwrap();
    assert_eq!(result.total_questions, 5);
    assert_eq!(result.score, 5);
    assert!((result.percentage - 100.0).abs() < 0.001);
    assert!(result.passed);
    assert_eq!(result.time_spent_seconds, 60);
    assert_eq!(result.reviews.len(), 5);
}
