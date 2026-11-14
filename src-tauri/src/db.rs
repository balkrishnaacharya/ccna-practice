use rusqlite::{params, Connection, OptionalExtension, Result};
use std::path::Path;
use std::sync::Mutex;

// Bundled question bank embedded at compile time.
pub static BUNDLED_DB: &[u8] = include_bytes!("../resources/ccna.db");

// Version of the bundled question bank. synced into the user DB as the
// `bank_version` setting so repeated syncs are idempotent.
pub static BUNDLED_BANK_VERSION: &str = "1.0.0";

pub struct Db(pub Mutex<Connection>);

pub fn init(path: &Path) -> Result<Connection> {
    let conn = Connection::open(path)?;
    conn.execute_batch(
        "
        PRAGMA journal_mode=WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY,
            stem TEXT NOT NULL,
            explanation TEXT,
            domain TEXT NOT NULL,
            subtopic TEXT,
            difficulty TEXT NOT NULL DEFAULT 'medium',
            source TEXT
        );

        CREATE TABLE IF NOT EXISTS choices (
            id INTEGER PRIMARY KEY,
            question_id INTEGER NOT NULL REFERENCES questions(id),
            text TEXT NOT NULL,
            is_correct INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY,
            mode TEXT NOT NULL,
            started_at INTEGER NOT NULL,
            ended_at INTEGER,
            score INTEGER DEFAULT 0,
            total INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS answers (
            id INTEGER PRIMARY KEY,
            session_id INTEGER REFERENCES sessions(id),
            question_id INTEGER REFERENCES questions(id),
            correct INTEGER NOT NULL,
            time_spent_ms INTEGER,
            answered_at INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS flags (
            id INTEGER PRIMARY KEY,
            question_id INTEGER UNIQUE REFERENCES questions(id),
            note TEXT,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS flashcards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL UNIQUE,
            front TEXT NOT NULL,
            back TEXT NOT NULL,
            ease_factor REAL NOT NULL DEFAULT 2.5,
            interval_days REAL NOT NULL DEFAULT 0,
            repetitions INTEGER NOT NULL DEFAULT 0,
            due_date TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS question_notes (
            question_id INTEGER NOT NULL PRIMARY KEY,
            note TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS user_question_stats (
            id INTEGER PRIMARY KEY,
            question_id INTEGER NOT NULL UNIQUE REFERENCES questions(id),
            times_seen INTEGER NOT NULL DEFAULT 0,
            times_correct INTEGER NOT NULL DEFAULT 0,
            last_seen_at INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_q_domain ON questions(domain);
        CREATE INDEX IF NOT EXISTS idx_q_difficulty ON questions(difficulty);
        ",
    )?;

    // --- Idempotent migrations ---

    // Task 1: multi_select column on questions
    let has_multi_select: i64 = conn.query_row(
        "SELECT COUNT(*) FROM pragma_table_info('questions') WHERE name='multi_select'",
        [],
        |r| r.get(0),
    )?;
    if has_multi_select == 0 {
        conn.execute(
            "ALTER TABLE questions ADD COLUMN multi_select INTEGER NOT NULL DEFAULT 0",
            [],
        )?;
    }

    // answered_at on answers (pre-existing migration)
    let has_answered_at: i64 = conn.query_row(
        "SELECT COUNT(*) FROM pragma_table_info('answers') WHERE name='answered_at'",
        [],
        |r| r.get(0),
    )?;
    if has_answered_at == 0 {
        conn.execute(
            "ALTER TABLE answers ADD COLUMN answered_at INTEGER NOT NULL DEFAULT 0",
            [],
        )?;
    }

    // Task 3: selected_choice_ids JSON column on answers
    let has_selected_ids: i64 = conn.query_row(
        "SELECT COUNT(*) FROM pragma_table_info('answers') WHERE name='selected_choice_ids'",
        [],
        |r| r.get(0),
    )?;
    if has_selected_ids == 0 {
        conn.execute(
            "ALTER TABLE answers ADD COLUMN selected_choice_ids TEXT NOT NULL DEFAULT '[]'",
            [],
        )?;
    }

    // Task 3: is_correct alias column (store 0/1 redundantly for fast history queries)
    // Note: 'correct' column already exists; we alias it via is_correct in queries.

    // Task 3: duration_sec column on sessions
    let has_duration: i64 = conn.query_row(
        "SELECT COUNT(*) FROM pragma_table_info('sessions') WHERE name='duration_sec'",
        [],
        |r| r.get(0),
    )?;
    if has_duration == 0 {
        conn.execute(
            "ALTER TABLE sessions ADD COLUMN duration_sec INTEGER NOT NULL DEFAULT 0",
            [],
        )?;
    }

    // Content-based uniqueness: normalized stem + sorted choice texts. Populated
    // by the import pipeline, which also backfills rows from older databases.
    // NULL is allowed for legacy rows so opening the app never fails on a
    // duplicate that predates the fingerprint.
    let has_content_hash: i64 = conn.query_row(
        "SELECT COUNT(*) FROM pragma_table_info('questions') WHERE name='content_hash'",
        [],
        |r| r.get(0),
    )?;
    if has_content_hash == 0 {
        conn.execute("ALTER TABLE questions ADD COLUMN content_hash TEXT", [])?;
    }
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_q_content_hash
         ON questions(content_hash) WHERE content_hash IS NOT NULL",
        [],
    )?;

    // --- Spaced repetition (SM-2) columns on user_question_stats ---
    for (col, ddl) in [
        ("ease_factor", "ALTER TABLE user_question_stats ADD COLUMN ease_factor REAL NOT NULL DEFAULT 2.5"),
        ("interval_days", "ALTER TABLE user_question_stats ADD COLUMN interval_days INTEGER NOT NULL DEFAULT 0"),
        ("repetitions", "ALTER TABLE user_question_stats ADD COLUMN repetitions INTEGER NOT NULL DEFAULT 0"),
        ("next_review_at", "ALTER TABLE user_question_stats ADD COLUMN next_review_at INTEGER NOT NULL DEFAULT 0"),
        ("confidence", "ALTER TABLE user_question_stats ADD COLUMN confidence TEXT NOT NULL DEFAULT 'unsure'"),
    ] {
        let exists: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('user_question_stats') WHERE name=?1",
                params![col],
                |r| r.get(0),
            )
            .unwrap_or(0);
        if exists == 0 {
            conn.execute(ddl, []).map_err(|e| e)?;
        }
    }

    Ok(conn)
}

/// Merge questions from the bundled seed DB into the user database.
///
/// Preserves user progress (answers, flags, stats, settings) and never
/// overwrites user-specific data. Uses a transaction so a failed sync rolls
/// back completely. Repeated syncs are idempotent: questions already present
/// (matched by `content_hash`, or by stem when `content_hash` is NULL) are
/// backfilled and skipped; new questions are inserted with their choices.
///
/// When a legacy row has a `content_hash` that matches a bundled question but
/// different choices (a stale hash), the legacy hash is cleared and the
/// bundled question is inserted as new.
///
/// Returns the number of newly added questions.
pub fn sync_bundled_bank(
    conn: &mut Connection,
    seed_path: &Path,
) -> Result<i64, String> {
    let seed = Connection::open(seed_path).map_err(|e| e.to_string())?;

    let tx = conn
        .transaction()
        .map_err(|e| e.to_string())?;

    let mut added: i64 = 0;

    // Fetch all bundled questions with their content_hash.
    let bundled: Vec<(i64, String, String, String, i64, Option<String>)> = seed
        .prepare(
            "SELECT q.id, q.stem, q.domain, q.difficulty, COALESCE(q.multi_select, 0), q.content_hash
             FROM questions q",
        )
        .map_err(|e| e.to_string())?
        .query_map([], |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, String>(3)?,
                r.get::<_, i64>(4)?,
                r.get::<_, Option<String>>(5)?,
            ))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    for (_seed_id, stem, domain, difficulty, multi_select, content_hash) in &bundled {
        let mut existing_id: Option<i64> = None;
        let mut content_hash_match = false;
        let mut should_insert = false;

        // 1. Match by content_hash if available.
        if let Some(hash) = content_hash {
            if let Ok(found) = tx
                .query_row(
                    "SELECT id FROM questions WHERE content_hash = ?1",
                    params![hash],
                    |r| r.get(0),
                )
                .optional()
            {
                if let Some(id) = found {
                    existing_id = Some(id);
                    content_hash_match = true;
                }
            }
        }

        // 2. If no content_hash match, try stem + domain + difficulty where
        //    content_hash is NULL (legacy row without a hash).
        if existing_id.is_none() {
            if let Ok(found) = tx.query_row(
                "SELECT id FROM questions
                 WHERE stem = ?1 AND domain = ?2 AND difficulty = ?3
                   AND content_hash IS NULL
                 LIMIT 1",
                params![stem, domain, difficulty],
                |r| r.get(0),
            ).optional() {
                existing_id = found;
            }
        }

        match existing_id {
            Some(existing) => {
                if content_hash_match {
                    // Content hash matched: check if choices also match.
                    // If choices differ, the legacy hash is stale — clear it
                    // and insert the bundled question as new.
                    let bundled_choices: Vec<(String, i64)> = seed
                        .prepare(
                            "SELECT text, is_correct FROM choices
                             WHERE question_id = ?1 ORDER BY sort_order",
                        )
                        .map_err(|e| e.to_string())?
                        .query_map(params![_seed_id], |r| {
                            Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?))
                        })
                        .map_err(|e| e.to_string())?
                        .filter_map(|r| r.ok())
                        .collect();

                    let legacy_choices: Vec<(String, i64)> = tx
                        .prepare(
                            "SELECT text, is_correct FROM choices
                             WHERE question_id = ?1 ORDER BY sort_order",
                        )
                        .map_err(|e| e.to_string())?
                        .query_map(params![existing], |r| {
                            Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?))
                        })
                        .map_err(|e| e.to_string())?
                        .filter_map(|r| r.ok())
                        .collect();

                    if bundled_choices == legacy_choices {
                        // Same content: backfill hash if NULL, skip insertion.
                        tx.execute(
                            "UPDATE questions SET content_hash = ?1
                             WHERE id = ?2 AND content_hash IS NULL",
                            params![content_hash, existing],
                        )
                        .map_err(|e| e.to_string())?;
                        continue;
                    }

                    // Stale hash: clear it, mark for insertion.
                    tx.execute(
                        "UPDATE questions SET content_hash = NULL WHERE id = ?1",
                        params![existing],
                    )
                    .map_err(|e| e.to_string())?;
                    should_insert = true;
                } else {
                    // Matched by stem only: backfill content_hash if NULL.
                    if let Some(hash) = content_hash {
                        tx.execute(
                            "UPDATE questions SET content_hash = ?1
                             WHERE id = ?2 AND content_hash IS NULL",
                            params![hash, existing],
                        )
                        .map_err(|e| e.to_string())?;
                    }
                    continue;
                }
            }
            None => {
                should_insert = true;
            }
        }

        if should_insert {
            // New question: insert it.
            tx.execute(
                "INSERT INTO questions (stem, domain, difficulty, multi_select, content_hash)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![stem, domain, difficulty, multi_select, content_hash],
            )
            .map_err(|e| e.to_string())?;
            let new_id = tx.last_insert_rowid();

            // Copy choices from the bundled DB.
            let choices: Vec<(String, i64, i64)> = seed
                .prepare(
                    "SELECT text, is_correct, sort_order FROM choices WHERE question_id = ?1 ORDER BY sort_order",
                )
                .map_err(|e| e.to_string())?
                .query_map(params![_seed_id], |r| {
                    Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?, r.get::<_, i64>(2)?))
                })
                .map_err(|e| e.to_string())?
                .filter_map(|r| r.ok())
                .collect();

            for (text, is_correct, sort_order) in choices {
                tx.execute(
                    "INSERT INTO choices (question_id, text, is_correct, sort_order) VALUES (?1, ?2, ?3, ?4)",
                    params![new_id, text, is_correct, sort_order],
                )
                .map_err(|e| e.to_string())?;
            }

            added += 1;
        }
    }

    // Record the bank version so repeated syncs are idempotent.
    tx.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('bank_version', ?1)",
        params![BUNDLED_BANK_VERSION],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(added)
}

