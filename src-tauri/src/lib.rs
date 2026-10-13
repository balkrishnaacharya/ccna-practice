mod commands;
mod db;

use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let db_path = app
                .path()
                .app_data_dir()
                .unwrap()
                .join("ccna.db");
            std::fs::create_dir_all(db_path.parent().unwrap()).ok();

            // Bundled DB baked into the binary at compile time
            const BUNDLED_DB: &[u8] = include_bytes!("../resources/ccna.db");

            if !db_path.exists() {
                match std::fs::write(&db_path, BUNDLED_DB) {
                    Ok(_) => eprintln!(
                        "[seed] wrote {} bytes to {}",
                        BUNDLED_DB.len(),
                        db_path.display()
                    ),
                    Err(e) => eprintln!("[seed] write failed: {}", e),
                }
            }

            let conn = db::init(&db_path).expect("failed to init db");
            app.manage(db::Db(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_stats,
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}