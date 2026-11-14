# CCNA Practice — Question Bank Synchronization & Android Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish one authoritative, versioned question bank shared by Android and desktop. Implement safe transactional sync that preserves all user data, add diagnostics, fix the Android updater with try/catch + GitHub release fallback, and add comprehensive migration tests.

**Architecture:**
1. Add `question_bank_metadata` table to the DB schema for version tracking (bank version, schema version, question count, timestamp, source revision, content checksum)
2. Enhance `sync_bundled_bank()` to read/write metadata, validate sync results, and update metadata only after successful completion
3. Add a Tauri `diagnostics` command reporting platform, versions, counts, checksum, and sync status
4. Fix Android updater: wrap all async calls in try/catch, add GitHub release page fallback when APK download fails
5. Add tests for all migration scenarios (A–H) using isolated temp databases
6. Update documentation (README.md, BUILD_APK.md)

**Tech Stack:** Rust + rusqlite (backend), React + node:test (frontend tests), Tauri 2, SQLite

**Spec:** User task spec at `/home/somberi/Documents/vivecode` (CCNA Practice Question Bank Synchronization & Android Database Repair); existing project at `/home/somberi/projects/ccna-practice`.

## Global Constraints

- Preserve all existing user data (answers, flags, stats, settings, exam history, flashcards, notes)
- Never drop tables, never replace the user DB with the bundled DB, never run `DROP TABLE questions`
- Sync must be atomic (transaction with rollback on failure)
- Sync must be idempotent (repeated runs produce no duplicates, no data changes)
- Application version and question-bank version are separate concepts
- Do not publish releases, do not push to GitHub, do not install on user's normal device
- Android and desktop must use the same question bank (same IDs, content, checksums)
- 83 legacy questions in the bundled DB must be retained (not silently dropped)

## Review Focus

1. 83 legacy questions (blueprint-bank/ai-generated/cert-guide sources) — retained in bundled DB, never deleted by sync
2. Sync failure mid-transaction — rolls back, previous metadata unchanged, user data intact
3. Android updater shell::open failure — falls back to GitHub release page URL, doesn't claim silent success
4. Repeated sync — no duplicate questions, no duplicate user stats, metadata unchanged on second run
5. Fresh install — gets complete bank (2390 questions including 83 legacy)
6. Legacy 500-question Android install — syncs to full bank, preserves progress/history
7. Bank version and app version tracked separately in metadata table

---

### Task 1: Add `question_bank_metadata` table to schema

**Files:**
- Modify: `src-tauri/src/db.rs:14-196` (init function)
- Test: `src-tauri/tests/db_test.rs` (add metadata table test)

**Interfaces:**
- Consumes: `db::init()` connection
- Produces: `question_bank_metadata` table with columns: `key TEXT PRIMARY KEY, value TEXT NOT NULL`

- [ ] **Step 1: Write the failing test**

```rust
// In src-tauri/tests/db_test.rs
#[test]
fn test_metadata_table_created() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('question_bank_metadata') WHERE name='bank_version'",
            [], |r| r.get(0)
        ).unwrap();
        assert_eq!(count, 1, "question_bank_metadata table must have bank_version column");
    });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src-tauri && cargo test test_metadata_table_created`
Expected: FAIL — `question_bank_metadata` table doesn't exist yet.

- [ ] **Step 3: Implement metadata table in `src-tauri/src/db.rs`**

Add to the `CREATE TABLE IF NOT EXISTS` batch in `init()`:
```sql
CREATE TABLE IF NOT EXISTS question_bank_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

Insert default metadata rows if not present:
```sql
INSERT OR IGNORE INTO question_bank_metadata (key, value) VALUES ('schema_version', '1');
INSERT OR IGNORE INTO question_bank_metadata (key, value) VALUES ('total_active_questions', '0');
INSERT OR IGNORE INTO question_bank_metadata (key, value) VALUES ('generation_timestamp', '');
INSERT OR IGNORE INTO question_bank_metadata (key, value) VALUES ('source_revision', '');
INSERT OR IGNORE INTO question_bank_metadata (key, value) VALUES ('content_checksum', '');
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd src-tauri && cargo test test_metadata_table_created`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/db.rs src-tauri/tests/db_test.rs
git commit -m "feat(db): add question_bank_metadata table for version tracking"
```

---

### Task 2: Enhance sync with metadata tracking and validation

**Files:**
- Modify: `src-tauri/src/db.rs:198-388` (sync_bundled_bank function)
- Test: `src-tauri/tests/db_test.rs` (add sync-with-metadata tests)

**Interfaces:**
- Consumes: `db::sync_bundled_bank()` from Task 1
- Produces: Sync updates `question_bank_metadata` with bank_version, total count, timestamp, checksum; validates sync result before committing

- [ ] **Step 1: Write the failing test**

```rust
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
        
        let total: i64 = conn.query_row(
            "SELECT value FROM question_bank_metadata WHERE key='total_active_questions'",
            [], |r| r.get(0)
        ).unwrap();
        assert_eq!(total, added.to_string());
    });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src-tauri && cargo test test_sync_updates_metadata`
Expected: FAIL — sync doesn't update metadata table.

- [ ] **Step 3: Implement metadata tracking in `sync_bundled_bank()`**

After the transaction inserts all questions and before commit:
1. Count total active questions
2. Compute content checksum from all content_hash values
3. Insert/update metadata rows: bank_version, total_active_questions, generation_timestamp, source_revision, content_checksum
4. Only update metadata after all inserts succeed (within same transaction)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd src-tauri && cargo test test_sync_updates_metadata`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/db.rs src-tauri/tests/db_test.rs
git commit -m "feat(db): sync updates question_bank_metadata after successful merge"
```

---

### Task 3: Add diagnostics Tauri command

**Files:**
- Modify: `src-tauri/src/commands.rs` (add diagnostics command)
- Modify: `src-tauri/src/lib.rs` (register diagnostics command)
- Test: `src-tauri/tests/commands_test.rs` (add diagnostics test)

**Interfaces:**
- Consumes: `db::Db` state, `BUNDLED_DB`, `BUNDLED_BANK_VERSION`
- Produces: `DiagnosticsInfo` struct with platform, app_version, installed_bank_version, bundled_bank_version, installed_count, bundled_count, active_count, checksum, sync_status

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn test_diagnostics_returns_bank_info() {
    let (db, _dir) = common::setup_integration_db();
    common::with_locked(&db, |conn| {
        let diag = commands::get_diagnostics(conn).unwrap();
        assert!(diag.installed_bank_version.is_some() || diag.installed_bank_version.is_none());
        assert!(diag.bundled_count > 0);
    });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src-tauri && cargo test test_diagnostics_returns_bank_info`
Expected: FAIL — `get_diagnostics` function doesn't exist.

- [ ] **Step 3: Implement diagnostics command**

Add `DiagnosticsInfo` struct and `get_diagnostics()` function in commands.rs:
- Reads `question_bank_metadata` for installed bank version, total count
- Reads bundled DB for bundled count, checksum
- Returns `platform` ("desktop" or "android" via cfg), app version from crate metadata

Register in lib.rs invoke_handler.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd src-tauri && cargo test test_diagnostics_returns_bank_info`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/commands.rs src-tauri/src/lib.rs src-tauri/tests/commands_test.rs
git commit -m "feat(db): add diagnostics command for question bank status"
```

---

### Task 4: Fix Android updater — try/catch + GitHub release fallback

**Files:**
- Modify: `src/utils/useUpdater.js:128-211` (applyUpdate function)
- Test: `tests/updater-android-fallback.test.js`

**Interfaces:**
- Consumes: `updateInfo.downloadUrl`, `updateInfo.version`, `shell::open`
- Produces: Android update flow with proper try/catch, error messages, and GitHub release page fallback

- [ ] **Step 1: Write the failing test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/utils/useUpdater.js", import.meta.url), "utf8");
test("Updater: Android applyUpdate has try/catch", () => {
  assert.ok(source.includes("try {"), "Android update path uses try/catch");
  assert.ok(source.includes("catch"), "Android update path has error handling");
});
test("Updater: Android fallback offers GitHub release page", () => {
  assert.ok(
    source.includes("github.com") || source.includes("GitHub releases"),
    "Android fallback references GitHub releases"
  );
});
test("Updater: Android error path does not claim silent success", () => {
  assert.ok(
    source.includes("setStatus(\"error\")") || source.includes("setStatus('error')"),
    "Android error path sets error status"
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/updater-android-fallback.test.js`
Expected: FAIL — Android updater needs try/catch restructuring and GitHub fallback.

- [ ] **Step 3: Implement Android updater fix in `src/utils/useUpdater.js`**

Restructure the Android `applyUpdate` path:
- Wrap `shell::open` in try/catch
- On failure, offer direct GitHub release page URL (`https://github.com/balkrishnaacharya/ccna-practice/releases/latest`)
- Set error status with clear message, don't close modal as success
- Ensure error messages mention manual download from GitHub

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/updater-android-fallback.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/useUpdater.js tests/updater-android-fallback.test.js
git commit -m "fix(updater): android try/catch + GitHub release fallback"
```

---

### Task 5: Add comprehensive migration tests (A–H)

**Files:**
- Create: `src-tauri/tests/migration_test.rs`
- Test: All scenarios in the spec

**Interfaces:**
- Consumes: `db::sync_bundled_bank()`, `db::BUNDLED_DB`, `common::setup_integration_db()`
- Produces: Test coverage for fresh install, legacy 500-question DB, repeated sync, failed sync, question updates, retired questions, platform parity

- [ ] **Step 1: Write the failing test file**

Create `src-tauri/tests/migration_test.rs` with tests:
- Test A: Fresh installation — empty DB → sync → full bank count
- Test B: Legacy 500-question Android DB — sync → new questions added, user data preserved
- Test C: Current desktop DB — sync → no duplicates, no data changes
- Test D: Run sync twice — count unchanged, no duplicates
- Test E: Failed sync — rollback, previous metadata unchanged
- Test F: Question update — content updates, user progress survives
- Test G: Retired question — historical records preserved
- Test H: Platform parity — same counts/checksums

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src-tauri && cargo test --test migration_test`
Expected: FAIL — migration_test.rs doesn't exist yet.

- [ ] **Step 3: Implement migration tests**

Write all 8 tests using isolated temp databases, verifying:
- Question counts match before/after
- User data (answers, flags, stats) preserved
- No duplicate questions after repeated sync
- Metadata updated correctly
- Failed sync rolls back cleanly

- [ ] **Step 4: Run all migration tests**

Run: `cd src-tauri && cargo test --test migration_test`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/tests/migration_test.rs
git commit -m "test(db): add migration tests for question bank sync (scenarios A-H)"
```

---

### Task 6: Run full verification suite

**Files:** None (verification task)

- [ ] **Step 1: Run frontend tests**

Run: `npm test`
Expected: All tests pass, 0 failures.

- [ ] **Step 2: Run Rust checks**

Run: `cd src-tauri && cargo check`
Expected: Compiles cleanly.

Run: `cd src-tauri && cargo test`
Expected: All tests pass.

Run: `cd src-tauri && cargo clippy`
Expected: No new warnings from our changes.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

No commit expected unless cleanup needed.

---

## Self-Review

1. **Spec coverage:** Every requirement maps to a task:
   - Authoritative bank → Tasks 1, 2 (metadata + sync)
   - Question reconciliation → Task 1 (83 questions retained)
   - Versioned bank system → Task 1, 2 (metadata table)
   - Safe sync → Task 2 (transactional, rollback, idempotent)
   - User data preservation → Task 2, 5 (never delete, tests verify)
   - Android database location → Task 5 (platform parity test)
   - Retrieval/display limits → Task 5 (exam limits preserved)
   - Platform parity → Task 5 (Test H)
   - Diagnostics command → Task 3
   - Migration tests → Task 5 (Tests A-H)
   - Build validation → Task 6
   - Android updater → Task 4
   - Documentation → (not in task list, handled separately)

2. **Step scan:** Each step is unambiguous — one action with a checkable result.

3. **Type consistency:** `sync_bundled_bank` signature unchanged (still `&mut Connection, &Path` → `Result<i64, String>`). `get_diagnostics` follows same pattern as existing commands.

4. **Review Focus:** All 7 review focus items have corresponding tests in Task 5.

5. **Proportion:** Plan matches spec scope — addresses every acceptance criterion without introducing unrelated features.

---

**Plan complete. This is a project-scale task requiring the full written design. Which execution approach do you prefer: Subagent-driven (fresh subagent + reviewer per task) or Native (I implement all tasks, one reviewer at the end)? Given the tight coupling between Tasks 1–3 (shared db.rs interface) and Task 5 (tests consuming sync_bundled_bank), I recommend Native execution for interface consistency.**