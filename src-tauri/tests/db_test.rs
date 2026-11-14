mod common;

use ccna_practice_lib::db;
use rusqlite::{params, Connection};
use tempfile::tempdir;

#[test]
fn test_init_creates_schema_and_migrations() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        let col = |table: &str, name: &str| -> i64 {
            conn.query_row(
                &format!("SELECT COUNT(*) FROM pragma_table_info('{table}') WHERE name=?1"),
                params![name],
                |r| r.get(0),
            )
            .unwrap()
        };
        assert_eq!(col("questions", "multi_select"), 1);
        assert_eq!(col("questions", "content_hash"), 1);
        assert_eq!(col("answers", "answered_at"), 1);
        assert_eq!(col("answers", "selected_choice_ids"), 1);
        assert_eq!(col("sessions", "duration_sec"), 1);
        for c in [
            "ease_factor",
            "interval_days",
            "repetitions",
            "next_review_at",
        ] {
            assert_eq!(col("user_question_stats", c), 1, "missing column {c}");
        }

        // Partial unique index: NULL content_hash duplicates are allowed.
        common::insert_question(conn, 1, "s1", "network_infra", "easy", 0, "");
        common::insert_question(conn, 2, "s2", "network_infra", "easy", 0, "");
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM questions", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 2);
    });
}

#[test]
fn test_init_idempotent() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("test.db");
    db::init(path.as_path()).unwrap();
    db::init(path.as_path()).unwrap(); // second call must not fail
}

#[test]
fn test_metadata_table_created() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        // Table must exist (pragma returns columns).
        let col_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('question_bank_metadata')",
            [], |r| r.get(0)
        ).unwrap();
        assert!(col_count > 0, "question_bank_metadata table must exist");
        // bank_version row must be present.
        let row_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM question_bank_metadata WHERE key='bank_version'",
            [], |r| r.get(0)
        ).unwrap();
        assert_eq!(row_count, 1, "question_bank_metadata must have bank_version row");
    });
}

#[test]
fn test_notification_tables_created() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        let prefs: i64 = conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('notification_preferences') WHERE name='key'",
            [], |r| r.get(0)
        ).unwrap();
        assert_eq!(prefs, 1, "notification_preferences table must exist");
        let events: i64 = conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('notification_events') WHERE name='id'",
            [], |r| r.get(0)
        ).unwrap();
        assert_eq!(events, 1, "notification_events table must exist");
    });
}

#[test]
fn test_bundled_seed_contains_the_full_bank() {
    let dir = tempdir().unwrap();
    let seed_path = dir.path().join("seed.db");
    std::fs::write(&seed_path, db::BUNDLED_DB).unwrap();

    let conn = Connection::open(&seed_path).unwrap();
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM questions", [], |r| r.get(0))
        .unwrap();
    let version: String = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'bank_version'",
            [],
            |r| r.get(0),
        )
        .unwrap();

    assert_eq!(version, db::BUNDLED_BANK_VERSION);
    assert!(
        count >= 2000,
        "bundled seed only has {count} questions; run npm run bank:seed"
    );

    let without_choices: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM questions q
             WHERE NOT EXISTS (SELECT 1 FROM choices c WHERE c.question_id = q.id)",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(without_choices, 0, "seed has questions without choices");
}

#[test]
fn test_sync_bundled_bank_merges_and_is_idempotent() {
    let (db, dir) = common::setup_integration_db();

    // Use a real seed question as an existing row so the merge exercises both
    // the "already present" and "new" paths.
    let seed_copy = dir.path().join("seed-copy.db");
    std::fs::write(&seed_copy, db::BUNDLED_DB).unwrap();
    let seed = Connection::open(&seed_copy).unwrap();
    let seed_count: i64 = seed
        .query_row("SELECT COUNT(*) FROM questions", [], |r| r.get(0))
        .unwrap();
    let (seed_id, stem, domain, difficulty, seed_hash): (i64, String, String, String, String) = seed
        .query_row(
            "SELECT id, stem, domain, difficulty, content_hash
             FROM questions ORDER BY id LIMIT 1",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?)),
        )
        .unwrap();
    let seed_choices: Vec<(String, i64)> = {
        let mut stmt = seed
            .prepare(
                "SELECT text, is_correct FROM choices
                 WHERE question_id = ?1 ORDER BY sort_order",
            )
            .unwrap();
        let rows = stmt
            .query_map(params![seed_id], |r| Ok((r.get(0)?, r.get(1)?)))
            .unwrap()
            .collect::<rusqlite::Result<Vec<_>>>()
            .unwrap();
        rows
    };
    seed.close().unwrap();

    common::with_locked(&db, |conn| {
        conn.execute(
            "INSERT INTO questions (stem, domain, difficulty, content_hash)
             VALUES (?1, ?2, ?3, NULL)",
            params![&stem, &domain, &difficulty],
        )
        .unwrap();
        let legacy_id = conn.last_insert_rowid();
        for (idx, (text, is_correct)) in seed_choices.iter().enumerate() {
            common::insert_choice(
                conn,
                legacy_id * 100 + idx as i64 + 1,
                legacy_id,
                text,
                *is_correct == 1,
            );
        }

        let added = db::sync_bundled_bank(conn, &seed_copy).unwrap();
        assert_eq!(added as i64, seed_count - 1);
        assert_eq!(question_count(conn), seed_count);

        // The pre-existing row matches the bundled content, so it is
        // backfilled instead of being duplicated.
        let legacy_hash: Option<String> = conn
            .query_row(
                "SELECT content_hash FROM questions WHERE id = ?1",
                params![legacy_id],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(
            legacy_hash.as_deref(),
            Some(seed_hash.as_str()),
            "matching legacy row should get the bundled content hash"
        );

        let version: String = conn
            .query_row(
                "SELECT value FROM settings WHERE key = 'bank_version'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(version, db::BUNDLED_BANK_VERSION);

        // The merge is a no-op once the version matches.
        assert_eq!(db::sync_bundled_bank(conn, &seed_copy).unwrap(), 0);
        assert_eq!(question_count(conn), seed_count);
    });
}

#[test]
fn test_sync_replaces_mismatched_legacy_question() {
    let (db, dir) = common::setup_integration_db();

    // Simulate a legacy row that shares a stem with a bundled question but has
    // different choices, plus the stale hash a stem-only backfill would have
    // copied onto it.
    let seed_copy = dir.path().join("seed-copy.db");
    std::fs::write(&seed_copy, db::BUNDLED_DB).unwrap();
    let seed = Connection::open(&seed_copy).unwrap();
    let seed_count: i64 = seed
        .query_row("SELECT COUNT(*) FROM questions", [], |r| r.get(0))
        .unwrap();
    let (stem, domain, difficulty, seed_hash): (String, String, String, String) = seed
        .query_row(
            "SELECT stem, domain, difficulty, content_hash
             FROM questions ORDER BY id LIMIT 1",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
        )
        .unwrap();
    seed.close().unwrap();

    common::with_locked(&db, |conn| {
        conn.execute(
            "INSERT INTO questions (stem, domain, difficulty, content_hash)
             VALUES (?1, ?2, ?3, ?4)",
            params![&stem, &domain, &difficulty, &seed_hash],
        )
        .unwrap();
        let legacy_id = conn.last_insert_rowid();
        for (idx, text) in ["Legacy A", "Legacy B", "Legacy C", "Legacy D"]
            .iter()
            .enumerate()
        {
            common::insert_choice(
                conn,
                legacy_id * 100 + idx as i64 + 1,
                legacy_id,
                text,
                idx == 0,
            );
        }

        let added = db::sync_bundled_bank(conn, &seed_copy).unwrap();
        assert_eq!(
            added as i64, seed_count,
            "mismatched legacy row must not suppress the curated row"
        );
        assert_eq!(question_count(conn), seed_count + 1);

        // The stale hash is cleared so the curated row can own it.
        let legacy_hash: Option<String> = conn
            .query_row(
                "SELECT content_hash FROM questions WHERE id = ?1",
                params![legacy_id],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(legacy_hash, None, "stale hash should be cleared");

        // The curated row exists with its choices attached.
        let curated_id: i64 = conn
            .query_row(
                "SELECT id FROM questions WHERE content_hash = ?1",
                params![&seed_hash],
                |r| r.get(0),
            )
            .unwrap();
        assert_ne!(curated_id, legacy_id);
        let curated_choices: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM choices WHERE question_id = ?1",
                params![curated_id],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(curated_choices, 4);
    });
}

fn question_count(conn: &Connection) -> i64 {
    conn.query_row("SELECT COUNT(*) FROM questions", [], |r| r.get(0))
        .unwrap()
}

#[test]
fn test_sync_updates_metadata() {
    let (db, dir) = common::setup_integration_db();
    let seed_copy = dir.path().join("seed.db");
    std::fs::write(&seed_copy, db::BUNDLED_DB).unwrap();

    common::with_locked(&db, |conn| {
        let added = db::sync_bundled_bank(conn, &seed_copy).unwrap();
        assert!(added >= 0);

        // Verify metadata was updated
        let bank_version: String = conn.query_row(
            "SELECT value FROM question_bank_metadata WHERE key='bank_version'",
            [], |r| r.get(0)
        ).unwrap();
        assert_eq!(bank_version, db::BUNDLED_BANK_VERSION);

        let total: String = conn.query_row(
            "SELECT value FROM question_bank_metadata WHERE key='total_active_questions'",
            [], |r| r.get(0)
        ).unwrap();
        assert_eq!(total, added.to_string());
    });
}
