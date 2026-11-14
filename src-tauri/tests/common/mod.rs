use ccna_practice_lib::db;
use rusqlite::params;
use std::sync::Mutex;
use tempfile::TempDir;

pub fn setup_integration_db() -> (db::Db, TempDir) {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("test.db");
    let conn = db::init(path.as_path()).unwrap();
    (db::Db(Mutex::new(conn)), dir)
}

/// Runs `f` with the database mutex locked; the lock is released when `f`
/// returns so `db` can be moved into a `tauri::State` afterwards.
pub fn with_locked<T>(db: &db::Db, f: impl FnOnce(&rusqlite::Connection) -> T) -> T {
    let conn = db.0.lock().unwrap();
    f(&conn)
}

pub fn insert_question(
    conn: &rusqlite::Connection,
    id: i64,
    stem: &str,
    domain: &str,
    difficulty: &str,
    multi_select: i64,
    subtopic: &str,
) {
    conn.execute(
        "INSERT INTO questions (id, stem, domain, difficulty, multi_select, subtopic, content_hash)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL)",
        params![id, stem, domain, difficulty, multi_select, subtopic],
    )
    .unwrap();
}

pub fn insert_choice(
    conn: &rusqlite::Connection,
    id: i64,
    question_id: i64,
    text: &str,
    is_correct: bool,
) {
    conn.execute(
        "INSERT INTO choices (id, question_id, text, is_correct, sort_order) VALUES (?1, ?2, ?3, ?4, 1)",
        params![id, question_id, text, if is_correct { 1 } else { 0 }],
    )
    .unwrap();
}

pub fn add_answer(conn: &rusqlite::Connection, question_id: i64, correct: bool, answered_at: i64) {
    conn.execute(
        "INSERT INTO answers (question_id, correct, answered_at) VALUES (?1, ?2, ?3)",
        params![question_id, if correct { 1 } else { 0 }, answered_at],
    )
    .unwrap();
}

pub fn noon_epoch(conn: &rusqlite::Connection, days_ago: i64) -> i64 {
    conn.query_row(
        "SELECT CAST(strftime('%s', date('now', 'localtime', ?1) || ' 12:00:00', 'utc') AS INTEGER)",
        params![format!("{} days", -days_ago)],
        |r| r.get(0),
    )
    .unwrap()
}

pub fn seed_exam_bank(conn: &rusqlite::Connection) {
    let targets = [
        ("network_infra", 25usize),
        ("switching", 25usize),
        ("ip_routing", 20usize),
        ("services_security", 20usize),
        ("ai_ops", 10usize),
    ];
    let mut id = 1i64;
    for (domain, count) in targets {
        for j in 0..count {
            let subtopic = format!("sub-{domain}-{j}");
            insert_question(conn, id, &format!("q {id}"), domain, "medium", 0, &subtopic);
            insert_choice(conn, id * 10 + 1, id, "correct", true);
            insert_choice(conn, id * 10 + 2, id, "wrong", false);
            id += 1;
        }
    }
}
