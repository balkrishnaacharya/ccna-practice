use super::*;

// ─── Flags ────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn toggle_flag(question_id: i64, note: Option<String>, db: State<Db>) -> Result<bool, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    with_immediate_tx_string(&conn, |conn| {
    let existing: Option<i64> = conn
        .query_row(
            "SELECT id FROM flags WHERE question_id = ?1",
            params![question_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    if let Some(id) = existing {
        conn.execute("DELETE FROM flags WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        let now = now_secs();
        conn.execute(
            "INSERT INTO flags (question_id, note, created_at) VALUES (?1, ?2, ?3)",
            params![question_id, note, now],
        )
        .map_err(|e| e.to_string())?;
        Ok(true)
    }
    })
}

#[tauri::command]
pub fn get_flag_status(question_id: i64, db: State<Db>) -> Result<Option<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let note: Option<Option<String>> = conn
        .query_row(
            "SELECT note FROM flags WHERE question_id = ?1",
            params![question_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    match note {
        Some(opt) => Ok(Some(opt.unwrap_or_default())),
        None => Ok(None),
    }
}

#[tauri::command]
pub fn get_flags(db: State<Db>) -> Result<Vec<serde_json::Value>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT f.id, f.question_id, q.stem, q.domain, q.difficulty, COALESCE(q.explanation, ''), f.note, f.created_at
             FROM flags f
             JOIN questions q ON q.id = f.question_id
             ORDER BY f.created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows: Vec<(i64, i64, String, String, String, String, Option<String>, i64)> = stmt
        .query_map([], |r| {
            Ok((
                r.get(0)?,
                r.get(1)?,
                r.get(2)?,
                r.get(3)?,
                r.get(4)?,
                r.get(5)?,
                r.get(6)?,
                r.get(7)?,
            ))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let mut result = Vec::new();
    for (id, question_id, stem, domain, difficulty, explanation, note, created_at) in rows {
        let mut cstmt = conn
            .prepare("SELECT id, text, is_correct FROM choices WHERE question_id = ?1 ORDER BY RANDOM()")
            .map_err(|e| e.to_string())?;

        let choices: Vec<serde_json::Value> = cstmt
            .query_map(params![question_id], |cr| {
                Ok(serde_json::json!({
                    "id": cr.get::<_, i64>(0)?,
                    "text": cr.get::<_, String>(1)?,
                    "is_correct": cr.get::<_, i64>(2)? == 1,
                }))
            })
            .map_err(|e| e.to_string())?
            .filter_map(|cr| cr.ok())
            .collect();

        result.push(serde_json::json!({
            "id": id,
            "question_id": question_id,
            "stem": stem,
            "domain": domain,
            "difficulty": difficulty,
            "explanation": explanation,
            "note": note,
            "created_at": created_at,
            "choices": choices,
        }));
    }

    Ok(result)
}

// ─── Settings ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_setting(key: String, db: State<Db>) -> Result<Option<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let val = conn
        .query_row(
            "SELECT value FROM settings WHERE key = ?1",
            params![key],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(val)
}

#[tauri::command]
pub fn set_setting(key: String, value: String, db: State<Db>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    with_immediate_tx_string(&conn, |conn| {
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2",
            params![key, value],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
pub fn reset_stats(db: State<Db>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    with_immediate_tx_string(&conn, |conn| {
        conn.execute("DELETE FROM answers", []).map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM sessions", []).map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM flags", []).map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM user_question_stats", []).map_err(|e| e.to_string())?;
        // A stale draft would otherwise pop a "Resume exam?" dialog after reset.
        conn.execute("DELETE FROM exam_drafts WHERE id = 1", []).map_err(|e| e.to_string())?;
        Ok(())
    })
}

// ─── Flashcards (SM-2) ─────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct Flashcard {
    pub id: i64,
    pub question_id: i64,
    pub front: String,
    pub back: String,
    pub ease_factor: f64,
    pub interval_days: f64,
    pub repetitions: i64,
    pub due_date: String,
    pub created_at: String,
}

#[tauri::command]
pub fn get_flashcards_due(today: String, db: State<Db>) -> Result<Vec<Flashcard>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, question_id, front, back, ease_factor, interval_days, repetitions,
                 due_date, created_at
         FROM flashcards
         WHERE due_date <= ?1
         ORDER BY due_date ASC, id ASC",
    )
    .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![today], |r| {
            Ok(Flashcard {
                id: r.get(0)?,
                question_id: r.get(1)?,
                front: r.get(2)?,
                back: r.get(3)?,
                ease_factor: r.get(4)?,
                interval_days: r.get(5)?,
                repetitions: r.get(6)?,
                due_date: r.get(7)?,
                created_at: r.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(rows)
}

#[tauri::command]
pub fn get_flashcard_due_count(today: String, db: State<Db>) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM flashcards WHERE due_date <= ?1",
            params![today],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(count)
}

#[derive(Deserialize)]
pub struct CreateFlashcardPayload {
    pub question_id: i64,
    pub front: String,
    pub back: String,
    pub due_date: String,
}

#[tauri::command]
pub fn create_flashcard(payload: CreateFlashcardPayload, db: State<Db>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    with_immediate_tx_string(&conn, |conn| {
        conn.execute(
            "INSERT INTO flashcards (question_id, front, back, due_date)
             VALUES (?1, ?2, ?3, ?4)",
            params![payload.question_id, payload.front, payload.back, payload.due_date],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[derive(Deserialize)]
pub struct ReviewFlashcardPayload {
    pub id: i64,
    pub quality: i64, // 0-5, 4 = hard, 5 = easy
    pub due_date: String,
}

#[tauri::command]
pub fn review_flashcard(payload: ReviewFlashcardPayload, db: State<Db>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    with_immediate_tx_string(&conn, |conn| {
    // Fetch current state
    let (ef, interval, reps): (f64, f64, i64) = conn
        .query_row(
            "SELECT ease_factor, interval_days, repetitions FROM flashcards WHERE id = ?1",
            params![payload.id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .map_err(|e| e.to_string())?;

    let q = payload.quality as f64;
    let (new_ef, new_interval, new_reps) = if q >= 3.0 {
        // Correct
        let new_reps = reps + 1;
        let new_interval = if new_reps == 1 {
            1.0
        } else if new_reps == 2 {
            6.0
        } else {
            interval * ef
        };
        let ef_adjustment = 0.1 - (5.0 - q) * 0.08 * (5.0 - q);
        let new_ef = (ef + ef_adjustment).max(1.3);
        (new_ef, new_interval, new_reps)
    } else {
        // Incorrect
        ((ef - 0.2).max(1.3), 0.0, 0)
    };

    conn.execute(
        "UPDATE flashcards SET ease_factor = ?1, interval_days = ?2, repetitions = ?3, due_date = ?4 WHERE id = ?5",
        params![new_ef, new_interval, new_reps, payload.due_date, payload.id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
    })
}

// ─── Weakness Heatmap ─────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct HeatmapCell {
    pub subtopic: String,
    pub date: String,
    pub answered: i64,
    pub correct: i64,
    pub accuracy: f64,
}

#[tauri::command]
pub fn get_heatmap_data(db: State<Db>) -> Result<Vec<HeatmapCell>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Last 7 days inclusive of today
    let seven_days_ago = now_secs() - 7 * 86400;

    let mut stmt = conn.prepare(
        "SELECT q.subtopic,
                 date(a.answered_at, 'unixepoch', 'localtime') AS day,
                 COUNT(*) AS answered,
                 COALESCE(SUM(a.correct), 0) AS correct
          FROM answers a
          JOIN questions q ON a.question_id = q.id
          WHERE a.answered_at > 0 AND a.answered_at >= ?1
          GROUP BY q.subtopic, day
          ORDER BY q.subtopic, day",
    ).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![seven_days_ago], |r| {
            let answered: i64 = r.get(2)?;
            let correct: i64 = r.get(3)?;
            let accuracy = if answered > 0 { (correct as f64 / answered as f64) * 100.0 } else { 0.0 };
            Ok(HeatmapCell {
                subtopic: r.get(0)?,
                date: r.get(1)?,
                answered,
                correct,
                accuracy,
            })
        }).map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(rows)
}

// ─── Question Notes ───────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize)]
#[allow(dead_code)]
pub struct QuestionNote {
    pub question_id: i64,
    pub note: String,
    pub updated_at: String,
}

#[derive(Deserialize)]
pub struct SaveQuestionNotePayload {
    pub question_id: i64,
    pub note: String,
}

#[tauri::command]
pub fn get_question_note(question_id: i64, db: State<Db>) -> Result<Option<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let note: Option<String> = conn
        .query_row(
            "SELECT note FROM question_notes WHERE question_id = ?1",
            params![question_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(note)
}

#[tauri::command]
pub fn save_question_note(payload: SaveQuestionNotePayload, db: State<Db>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    with_immediate_tx_string(&conn, |conn| {
        conn.execute(
            "INSERT INTO question_notes (question_id, note, updated_at)
             VALUES (?1, ?2, datetime('now'))
             ON CONFLICT(question_id) DO UPDATE SET note = ?2, updated_at = datetime('now')",
            params![payload.question_id, payload.note],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })
}

// ─── Diagnostics ──────────────────────────────────────────────────────────────

/// Diagnostic information about the question bank, used to verify Android/
// desktop parity and troubleshoot sync issues.
#[derive(Serialize, Debug)]
pub struct DiagnosticsInfo {
    pub platform: String,
    pub app_version: String,
    pub installed_bank_version: Option<String>,
    pub bundled_bank_version: String,
    pub installed_count: i64,
    pub bundled_count: i64,
    pub active_count: i64,
    pub checksum: String,
    pub sync_status: String,
}

/// Returns diagnostic information about the question bank.
/// Reads installed metadata from the user's DB connection and bundled
/// information from the embedded database file.
pub fn get_diagnostics(conn: &Connection) -> Result<DiagnosticsInfo, String> {
    // Installed bank version from user DB metadata.
    let installed_bank_version: Option<String> = conn
        .query_row(
            "SELECT value FROM question_bank_metadata WHERE key='bank_version'",
            [],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    // Total questions in the user's database.
    let installed_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM questions", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    // Schema version from metadata.
    let schema_version: String = conn
        .query_row(
            "SELECT value FROM question_bank_metadata WHERE key='schema_version'",
            [],
            |r| r.get(0),
        )
        .unwrap_or_else(|_| "unknown".to_string());

    // The bundled DB is embedded via include_bytes!, so the source path does
    // not exist on Android. Materialize the bytes in a temp file to get a real
    // count on every platform rather than reporting a misleading zero.
    let bundled_count = {
        let tmp = std::env::temp_dir().join(format!(
            "ccna-bundled-diag-{}-{}.db",
            std::process::id(),
            now_secs()
        ));
        let result = (|| -> Result<i64, String> {
            std::fs::write(&tmp, crate::db::BUNDLED_DB)
                .map_err(|e| format!("Failed to stage bundled DB: {e}"))?;
            let bundled = rusqlite::Connection::open(&tmp)
                .map_err(|e| format!("Failed to open staged bundled DB: {e}"))?;
            bundled
                .query_row("SELECT COUNT(*) FROM questions", [], |r| r.get(0))
                .map_err(|e| e.to_string())
        })();
        let _ = std::fs::remove_file(&tmp);
        result?
    };

    let platform = if cfg!(target_os = "android") {
        "android"
    } else {
        "desktop"
    }
    .to_string();

    let sync_status = if installed_bank_version.is_some()
        && installed_bank_version.as_deref() == Some(crate::db::BUNDLED_BANK_VERSION)
    {
        "synced"
    } else {
        "pending"
    }
    .to_string();

    Ok(DiagnosticsInfo {
        platform,
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        installed_bank_version,
        bundled_bank_version: crate::db::BUNDLED_BANK_VERSION.to_string(),
        installed_count,
        bundled_count,
        active_count: installed_count,
        checksum: schema_version,
        sync_status,
    })
}

/// Tauri command wrapper for get_diagnostics — callable from the frontend.
#[tauri::command]
pub fn get_diagnostics_cmd(db: State<Db>) -> Result<DiagnosticsInfo, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    get_diagnostics(&conn)
}

// ─── Progress export ─────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct ExportResult {
    /// Path (or Android content URI) chosen in the save dialog.
    pub path: String,
    /// Serialized progress. The frontend writes this itself when `written`
    /// is false — Android SAF returns a content URI that `std::fs` cannot open.
    pub json: String,
    pub written: bool,
}

/// Build the progress payload and ask the user where to save it.
#[tauri::command]
pub async fn export_progress(
    app: tauri::AppHandle,
    db: State<'_, Db>,
) -> Result<ExportResult, String> {
    use tauri_plugin_dialog::DialogExt;

    let export = {
        let mut conn = db.0.lock().map_err(|e| e.to_string())?;
        let stats = get_stats_conn(&conn)?;
        let streak = streak_stats_conn(&mut conn)?;
        let practice = practice_streak_conn(&conn)?;

        let mut stmt = conn
            .prepare(
                "SELECT q.domain,
                        COUNT(*) AS answered,
                        COALESCE(SUM(a.correct), 0) AS correct
                 FROM answers a JOIN questions q ON q.id = a.question_id
                 GROUP BY q.domain ORDER BY q.domain",
            )
            .map_err(|e| e.to_string())?;
        let domain_accuracy: Vec<serde_json::Value> = stmt
            .query_map([], |r| {
                let answered: i64 = r.get(1)?;
                let correct: i64 = r.get(2)?;
                Ok(serde_json::json!({
                    "domain": r.get::<_, String>(0)?,
                    "answered": answered,
                    "correct": correct,
                    "accuracy": if answered > 0 {
                        ((correct as f64 / answered as f64) * 1000.0).round() / 10.0
                    } else { 0.0 },
                }))
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        serde_json::json!({
            "app_version": env!("CARGO_PKG_VERSION"),
            "exported_at": now_secs(),
            "total_questions_answered": stats.answered,
            "total_correct": stats.correct,
            "overall_accuracy": stats.accuracy,
            "question_bank_size": stats.total,
            "domain_accuracy": domain_accuracy,
            "streak": {
                "current": streak.current_streak,
                "longest": streak.longest_streak,
                "active_days": streak.active_days,
                "goal_met_today": streak.goal_met_today,
            },
            "practice_streak": practice,
        })
    };

    let json = serde_json::to_string_pretty(&export).map_err(|e| e.to_string())?;

    let (tx, rx) = std::sync::mpsc::channel();
    app.dialog()
        .file()
        .add_filter("JSON", &["json"])
        .set_file_name("ccna-progress.json")
        .save_file(move |file_path| {
            let _ = tx.send(file_path);
        });

    let file_path = tauri::async_runtime::spawn_blocking(move || rx.recv())
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Export cancelled".to_string())?;

    let display_path = file_path.clone().into_path().map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| format!("{file_path:?}"));

    // Desktop returns a real path; Android returns a content URI that must be
    // written by the frontend through the FS plugin.
    let written = match file_path.into_path() {
        Ok(path) => {
            std::fs::write(&path, &json).map_err(|e| e.to_string())?;
            true
        }
        Err(_) => false,
    };

    Ok(ExportResult {
        path: display_path,
        json,
        written,
    })
}
