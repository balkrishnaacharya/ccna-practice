pub mod commands;
pub mod db;
pub mod notifications;

use db::BUNDLED_DB;

use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init());

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .setup(|app| {
            let db_path = app
                .path()
                .app_data_dir()
                .map_err(|_| "Failed to resolve app data directory".to_string())?
                .join("ccna.db");
            std::fs::create_dir_all(db_path.parent().ok_or_else(|| "Failed to resolve db path parent".to_string())?).ok();

            // Always initialize the schema and run migrations (idempotent).
            let mut conn = db::init(&db_path).expect("failed to init db");

            // Always synchronize the bundled question bank into the user DB.
            // Preserves user progress, never overwrites user data, idempotent.
            // Write the embedded bundled DB to a temp file in the app data dir
            // so it can be opened by rusqlite (works on Android where the
            // resources/ccna.db path does not exist as a filesystem path).
            let bundled_path = app
                .path()
                .app_data_dir()
                .map_err(|_| "Failed to resolve app data directory".to_string())?
                .join("bundled_ccna.db");
            std::fs::write(&bundled_path, BUNDLED_DB)
                .map_err(|e| format!("Failed to write bundled DB: {}", e))?;

            match db::sync_bundled_bank(&mut conn, &bundled_path) {
                Ok(added) => eprintln!("[bank-sync] added {} new questions", added),
                Err(e) => eprintln!("[bank-sync] failed: {}", e),
            }
            // Clean up the temp bundled DB file after sync.
            let _ = std::fs::remove_file(&bundled_path);

            app.manage(db::Db(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
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
            notifications::get_notification_settings_cmd,
            notifications::update_notification_setting_cmd,
            notifications::send_in_app_notification_cmd,
            notifications::get_notification_history_cmd,
            notifications::check_reminder_status_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}