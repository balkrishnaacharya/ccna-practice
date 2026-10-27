use rusqlite::{Connection, Result};
use std::path::Path;
use std::sync::Mutex;

pub struct Db(pub Mutex<Connection>);

pub fn init(path: &Path) -> Result<Connection> {
    let conn = Connection::open(path)?;
    conn.execute_batch(
        "
        PRAGMA journal_mode=WAL;

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

    Ok(conn)
}
