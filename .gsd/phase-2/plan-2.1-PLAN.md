---
phase: 2
plan: 2.1
wave: 1
depends_on: []
files_modified:
  - src-tauri/src/lib.rs
autonomous: true
user_setup: []
must_haves:
  truths:
    - "App does not crash if app_data_dir() returns None"
    - "App surfaces a clear error instead of panicking on data dir failure"
  artifacts:
    - "src-tauri/src/lib.rs uses graceful error handling instead of unwrap()"
  key_links:
    - "lib.rs:21-26: setup closure resolves db_path via app.path().app_data_dir().unwrap()"
---

# Plan 2.1: Fix Android Crash Risk — Replace unwrap() on app_data_dir

## Objective

Replace the `.unwrap()` on `app.path().app_data_dir()` in `lib.rs` setup closure with graceful error handling. On Android, `app_data_dir()` can return `None` if the app lacks storage permissions or the directory can't be resolved, which would panic-crash the app on launch.

Purpose: Prevent app crash on Android (and other platforms) when the data directory is unavailable.
Output: `lib.rs` setup closure returns a `Result` and surfaces an error instead of panicking.

## Context

Load these files for context:
- src-tauri/src/lib.rs — lines 20-45: setup closure with `app_data_dir().unwrap()` at line 24
- src-tauri/src/lib.rs — line 31: `include_bytes!("../resources/ccna.db")` bundled DB

## Tasks

<task type="auto">
  <name>Replace unwrap() with graceful error handling in lib.rs setup</name>
  <files>
    src-tauri/src/lib.rs
  </files>
  <action>
    Modify the `.setup(|app| { ... })` closure in lib.rs to:
    1. Resolve `app.path().app_data_dir()` and map `None` to a descriptive error instead of `.unwrap()`
    2. Return `Err("Failed to resolve app data directory")` from the setup closure if the dir is unavailable
    3. Keep the rest of the DB seeding and init logic unchanged

    Current code (lines 21-26):
      let db_path = app
        .path()
        .app_data_dir()
        .unwrap()
        .join("ccna.db");
      std::fs::create_dir_all(db_path.parent().unwrap()).ok();

    AVOID: Do not use `.unwrap()` on `app_data_dir()` or `db_path.parent()`. Do not remove the DB seeding logic. Do not change the bundled DB path.
    USE: `app.path().app_data_dir().ok_or_else(|| "...")?` pattern. Use `?` operator since setup closures can return `Result`.

  </action>
  <verify>
    `cargo check` in src-tauri/ passes. `cargo test` in src-tauri/ passes (Rust unit tests compile and run).
  </verify>
  <done>
    lib.rs setup closure returns Result, no .unwrap() on app_data_dir(), cargo check and cargo test pass.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] `cargo check` passes
- [ ] `cargo test` passes
- [ ] No `.unwrap()` on `app_data_dir()` remains in lib.rs
- [ ] Setup closure returns `Result<(), String>` or similar

## Success Criteria

- [ ] Task verified passing
- [ ] Must-haves confirmed: no crash on data_dir failure, graceful error surfaced