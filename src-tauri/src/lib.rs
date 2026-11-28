pub mod commands;
pub mod db;
pub mod notifications;

use db::BUNDLED_DB;

use std::sync::{Mutex, OnceLock};
use tauri::Manager;

/// Captures a startup failure so the UI can show the real cause instead of the
/// opaque "state not managed for field 'db'" Tauri error.
static STARTUP_ERROR: OnceLock<Mutex<Option<String>>> = OnceLock::new();

fn record_startup_error(message: impl Into<String>) {
    let message = message.into();
    let slot = STARTUP_ERROR.get_or_init(|| Mutex::new(None));
    if let Ok(mut guard) = slot.lock() {
        *guard = Some(message.clone());
    }
    eprintln!("[ccna-startup] {message}");
}

#[tauri::command]
fn get_startup_error() -> Option<String> {
    STARTUP_ERROR
        .get()
        .and_then(|slot| slot.lock().ok())
        .and_then(|guard| guard.clone())
}

fn open_database(path: &std::path::Path) -> rusqlite::Connection {
    match db::init(path) {
        Ok(conn) => conn,
        Err(first) => {
            // A stale -wal/-shm from a killed app can block BEGIN IMMEDIATE.
            record_startup_error(format!("db init failed ({first}); retrying after clearing WAL/SHM"));
            let name = path.to_string_lossy();
            let _ = std::fs::remove_file(format!("{name}-wal"));
            let _ = std::fs::remove_file(format!("{name}-shm"));
            match db::init(path) {
                Ok(conn) => {
                    record_startup_error("recovered on retry".to_string());
                    conn
                }
                Err(second) => {
                    record_startup_error(format!(
                        "db retry failed ({second}); falling back to in-memory database"
                    ));
                    // Keep the app alive with an empty in-memory DB so commands
                    // still resolve; the bank can be re-synced on next launch.
                    rusqlite::Connection::open_in_memory()
                        .expect("in-memory sqlite must be available")
                }
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        // Register Db on the Builder, not in setup(): on Android the state
        // manager used by commands does not see state added later in setup.
        .manage(db::Db(db::shared_connection()));

    #[cfg(desktop)]
    {
        builder = builder
            .plugin(tauri_plugin_updater::Builder::new().build())
            .plugin(tauri_plugin_window_state::Builder::default().build());
    }

    builder
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| {
                    record_startup_error(format!("app_data_dir failed: {e}"));
                    format!("Failed to resolve app data directory: {e}")
                })?;
            let db_path = data_dir.join("ccna.db");
            eprintln!("[ccna-startup] db path: {}", db_path.display());

            if let Err(e) = std::fs::create_dir_all(&data_dir) {
                record_startup_error(format!("create_dir_all failed: {e}"));
            }

            // Never let a DB problem skip state registration — that produces the
            // opaque "state not managed" error in every command.
            let mut conn = open_database(&db_path);

            // The bundled bank is embedded via include_bytes!, so the source
            // path does not exist on Android. Stage it in the app data dir.
            let bundled_path = data_dir.join("bundled_ccna.db");
            match std::fs::write(&bundled_path, BUNDLED_DB) {
                Ok(()) => match db::sync_bundled_bank(&mut conn, &bundled_path) {
                    Ok(added) => eprintln!("[bank-sync] added {} new questions", added),
                    Err(e) => record_startup_error(format!("bank sync failed: {e}")),
                },
                Err(e) => record_startup_error(format!("bundled DB write failed: {e}")),
            }
            let _ = std::fs::remove_file(&bundled_path);

            if !db::install_connection(conn) {
                record_startup_error("db mutex poisoned while installing connection");
            }
            eprintln!("[ccna-startup] Db state registered");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_startup_error,
            commands::get_stats,
            commands::get_subtopic_stats,
            commands::get_review_due_count,
            commands::get_streak_stats,
            commands::get_random_question,
            commands::submit_answer,
            commands::get_exam_questions,
            commands::submit_exam,
            commands::toggle_flag,
            commands::get_flag_status,
            commands::get_flags,
            commands::get_setting,
            commands::set_setting,
            commands::reset_stats,
            commands::get_exam_history,
            commands::get_session_detail,
            commands::get_flashcards_due,
            commands::get_flashcard_due_count,
            commands::create_flashcard,
            commands::review_flashcard,
            commands::get_heatmap_data,
            commands::get_question_note,
            commands::save_question_note,
            commands::get_quick_quiz_questions,
            commands::get_diagnostics_cmd,
            commands::get_practice_streak,
            commands::export_progress,
            commands::save_exam_draft,
            commands::get_exam_draft,
            commands::clear_exam_draft,
            notifications::get_notification_settings_cmd,
            notifications::update_notification_setting_cmd,
            notifications::send_in_app_notification_cmd,
            notifications::get_notification_history_cmd,
            notifications::check_reminder_status_cmd,
            notifications::dismiss_notification_event_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}