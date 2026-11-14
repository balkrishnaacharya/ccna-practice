mod common;

use ccna_practice_lib::db;
use rusqlite::{params, Connection, OptionalExtension};
use std::fs;
use tempfile::tempdir;

// Helper: write bundled DB to a temp file and return the path.
fn write_bundled_seed(dir: &tempfile::TempDir) -> std::path::PathBuf {
    let seed_path = dir.path().join("seed.db");
    fs::write(&seed_path, db::BUNDLED_DB).unwrap();
    seed_path
}

// Helper: count questions in a connection.
fn question_count(conn: &Connection) -> i64 {
    conn.query_row("SELECT COUNT(*) FROM questions", [], |r| r.get(0))
        .unwrap()
}

// Helper: get metadata value by key.
fn metadata_value(conn: &Connection, key: &str) -> Option<String> {
    conn.query_row(
        "SELECT value FROM question_bank_metadata WHERE key = ?1",
        params![key],
        |r| r.get(0),
    )
    .optional()
    .unwrap()
}

// ── Test A: Fresh installation ──────────────────────────────────────────

#[test]
fn test_a_fresh_installation_full_bank() {
    let (db, dir) = common::setup_integration_db();
    let seed_path = write_bundled_seed(&dir);

    common::with_locked(&db, |conn| {
        let added = db::sync_bundled_bank(conn, &seed_path).unwrap();
        assert_eq!(added, 2390, "fresh install should add all bundled questions");

        let count = question_count(conn);
        assert_eq!(count, 2390, "fresh DB should contain full bank");

        let version = metadata_value(conn, "bank_version");
        assert_eq!(
            version.as_deref(),
            Some(db::BUNDLED_BANK_VERSION),
            "metadata should record bundled bank version"
        );

        let total = metadata_value(conn, "total_active_questions");
        assert_eq!(
            total.as_deref(),
            Some("2390"),
            "metadata should record total question count"
        );
    });
}

// ── Test B: Legacy 500-question Android DB ──────────────────────────────

#[test]
fn test_b_legacy_500_question_db_preserves_user_data() {
    let (db, dir) = common::setup_integration_db();
    let seed_path = write_bundled_seed(&dir);

    // Open bundled DB to read 500 sample questions for legacy simulation.
    let bundled = Connection::open(&seed_path).unwrap();
    let legacy_questions: Vec<(String, String, String)> = bundled
        .prepare(
            "SELECT stem, domain, difficulty FROM questions LIMIT 500",
        )
        .unwrap()
        .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();
    drop(bundled);

    common::with_locked(&db, |conn| {
        // Insert 500 legacy questions with NULL content_hash (simulating old Android DB).
        for (idx, (stem, domain, difficulty)) in legacy_questions.iter().enumerate() {
            common::insert_question(
                conn,
                (idx + 1) as i64,
                stem,
                domain,
                difficulty,
                0,
                "",
            );
        }

        // Add user data for legacy questions.
        common::add_answer(conn, 1, true, 1000);
        common::add_answer(conn, 2, false, 2000);

        let before_count = question_count(conn);
        assert_eq!(before_count, 500, "legacy DB starts with 500 questions");

        // Sync bundled bank.
        let added = db::sync_bundled_bank(conn, &seed_path).unwrap();

        // After sync, all 2390 bundled questions should be present.
        let after_count = question_count(conn);
        assert_eq!(after_count, 2390, "sync should bring DB to full bank size");
        assert_eq!(
            added, 1890,
            "sync should add 1890 new questions (2390 - 500 matched)"
        );

        // User data preserved.
        let answers: i64 = conn
            .query_row("SELECT COUNT(*) FROM answers", [], |r| r.get(0))
            .unwrap();
        assert_eq!(answers, 2, "user answers should be preserved after sync");

        // Metadata updated.
        let version = metadata_value(conn, "bank_version");
        assert_eq!(
            version.as_deref(),
            Some(db::BUNDLED_BANK_VERSION)
        );
    });
}

// ── Test C: Current desktop DB — sync is idempotent ─────────────────────

#[test]
fn test_c_current_db_sync_is_idempotent() {
    let (db, dir) = common::setup_integration_db();
    let seed_path = write_bundled_seed(&dir);

    common::with_locked(&db, |conn| {
        // First sync.
        let added1 = db::sync_bundled_bank(conn, &seed_path).unwrap();
        assert_eq!(added1, 2390);
        let count1 = question_count(conn);
        assert_eq!(count1, 2390);

        // Second sync — should add nothing.
        let added2 = db::sync_bundled_bank(conn, &seed_path).unwrap();
        assert_eq!(added2, 0, "second sync should add zero questions");
        let count2 = question_count(conn);
        assert_eq!(count2, 2390, "count should remain unchanged");
    });
}

// ── Test D: Run sync twice — same result ────────────────────────────────

#[test]
fn test_d_sync_twice_no_duplicates() {
    let (db, dir) = common::setup_integration_db();
    let seed_path = write_bundled_seed(&dir);

    common::with_locked(&db, |conn| {
        db::sync_bundled_bank(conn, &seed_path).unwrap();
        db::sync_bundled_bank(conn, &seed_path).unwrap();

        let count = question_count(conn);
        assert_eq!(count, 2390, "repeated sync must not create duplicates");

        // Verify no duplicate content_hash values.
        let dup_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM (
                    SELECT content_hash, COUNT(*) as c
                    FROM questions WHERE content_hash IS NOT NULL
                    GROUP BY content_hash HAVING c > 1
                )",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(dup_count, 0, "no duplicate content hashes allowed");
    });
}

// ── Test E: Failed sync — rollback, previous state unchanged ────────────

#[test]
fn test_e_failed_sync_preserves_previous_state() {
    let (db, dir) = common::setup_integration_db();
    let nonexistent_path = dir.path().join("nonexistent.db");

    common::with_locked(&db, |conn| {
        let before_count = question_count(conn);
        let before_version = metadata_value(conn, "bank_version");

        // Sync with non-existent seed path should fail.
        let result = db::sync_bundled_bank(conn, &nonexistent_path);
        assert!(result.is_err(), "failed sync should return an error");

        // State unchanged after failed sync.
        let after_count = question_count(conn);
        assert_eq!(
            after_count, before_count,
            "failed sync must not change question count"
        );
        let after_version = metadata_value(conn, "bank_version");
        assert_eq!(
            after_version, before_version,
            "failed sync must not change metadata"
        );
    });
}

// ── Test F: Question update — user progress survives sync ───────────────

#[test]
fn test_f_user_progress_survives_sync() {
    let (db, dir) = common::setup_integration_db();
    let seed_path = write_bundled_seed(&dir);

    common::with_locked(&db, |conn| {
        // Insert a legacy question that matches a bundled question by stem+domain+difficulty.
        // Read a question from the bundled DB to use as the legacy match.
        let bundled = Connection::open(&seed_path).unwrap();
        let (stem, domain, difficulty): (String, String, String) = bundled
            .query_row(
                "SELECT stem, domain, difficulty FROM questions LIMIT 1",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();
        drop(bundled);

        common::insert_question(conn, 1, &stem, &domain, &difficulty, 0, "");
        common::add_answer(conn, 1, true, 5000);

        let before_answers: i64 = conn
            .query_row("SELECT COUNT(*) FROM answers", [], |r| r.get(0))
            .unwrap();
        assert_eq!(before_answers, 1);

        // Sync bundled bank — the legacy question should be matched by stem
        // and have its content_hash backfilled, but user data preserved.
        db::sync_bundled_bank(conn, &seed_path).unwrap();

        let after_answers: i64 = conn
            .query_row("SELECT COUNT(*) FROM answers", [], |r| r.get(0))
            .unwrap();
        assert_eq!(after_answers, 1, "user answers should survive sync");

        let count = question_count(conn);
        assert_eq!(count, 2390, "DB should contain full bank after sync");
    });
}

// ── Test G: Retired question — historical records preserved ─────────────

#[test]
fn test_g_retired_question_history_preserved() {
    let (db, dir) = common::setup_integration_db();
    let seed_path = write_bundled_seed(&dir);

    common::with_locked(&db, |conn| {
        // Insert a question that is NOT in the bundled DB (simulating a
        // retired or custom question).
        common::insert_question(
            conn,
            99999,
            "Custom retired question about obsolete technology",
            "network_infra",
            "easy",
            0,
            "",
        );
        common::add_answer(conn, 99999, true, 8000);
        common::add_answer(conn, 99999, false, 9000);

        let before_answers: i64 = conn
            .query_row("SELECT COUNT(*) FROM answers WHERE question_id = 99999", [], |r| r.get(0))
            .unwrap();
        assert_eq!(before_answers, 2);

        // Sync bundled bank — should NOT delete the custom question.
        db::sync_bundled_bank(conn, &seed_path).unwrap();

        // Custom question and its history preserved.
        let exists: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM questions WHERE id = 99999",
                [],
                |r| r.get::<_, i64>(0),
            )
            .unwrap()
            > 0;
        assert!(exists, "retired question should not be deleted by sync");

        let after_answers: i64 = conn
            .query_row("SELECT COUNT(*) FROM answers WHERE question_id = 99999", [], |r| r.get(0))
            .unwrap();
        assert_eq!(
            after_answers, 2,
            "historical answer records should be preserved"
        );

        // Full bank still present.
        let count = question_count(conn);
        assert_eq!(count, 2391, "2390 bundled + 1 custom question");
    });
}

// ── Test H: Platform parity — bundled bank has expected content ─────────

#[test]
fn test_h_platform_parity_bundled_bank_content() {
    let (_db, dir) = common::setup_integration_db();
    let seed_path = write_bundled_seed(&dir);

    let bundled = Connection::open(&seed_path).unwrap();

    let count: i64 = bundled
        .query_row("SELECT COUNT(*) FROM questions", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 2390, "bundled bank should contain 2390 questions");

    // All questions should have content_hash.
    let without_hash: i64 = bundled
        .query_row(
            "SELECT COUNT(*) FROM questions WHERE content_hash IS NULL",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(
        without_hash, 0,
        "all bundled questions should have content_hash"
    );

    // All questions should have choices.
    let without_choices: i64 = bundled
        .query_row(
            "SELECT COUNT(*) FROM questions q WHERE NOT EXISTS (
                SELECT 1 FROM choices c WHERE c.question_id = q.id
            )",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(
        without_choices, 0,
        "all bundled questions should have choices"
    );

    // Counts by difficulty should be non-zero for all difficulties.
    for difficulty in ["easy", "medium", "hard"] {
        let diff_count: i64 = bundled
            .query_row(
                "SELECT COUNT(*) FROM questions WHERE difficulty = ?1",
                params![difficulty],
                |r| r.get(0),
            )
            .unwrap();
        assert!(
            diff_count > 0,
            "bundled bank should have {difficulty} questions"
        );
    }

    // Counts by domain should be non-zero for all domains.
    for domain in [
        "network_infra",
        "switching",
        "ip_routing",
        "services_security",
        "ai_ops",
    ] {
        let domain_count: i64 = bundled
            .query_row(
                "SELECT COUNT(*) FROM questions WHERE domain = ?1",
                params![domain],
                |r| r.get(0),
            )
            .unwrap();
        assert!(
            domain_count > 0,
            "bundled bank should have {domain} questions"
        );
    }

    drop(bundled);
}
