import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const db = readFileSync(new URL("../src-tauri/src/db.rs", import.meta.url), "utf8");
const commands = readFileSync(new URL("../src-tauri/src/commands.rs", import.meta.url), "utf8");
test("Rust: db exports BUNDLED_DB embedded bytes", () => {
  assert.ok(db.includes("pub static BUNDLED_DB"), "BUNDLED_DB must be exported");
});
test("Rust: db exports BUNDLED_BANK_VERSION", () => {
  assert.ok(db.includes("pub static BUNDLED_BANK_VERSION"), "BUNDLED_BANK_VERSION must be exported");
});
test("Rust: db exports sync_bundled_bank", () => {
  assert.ok(db.includes("pub fn sync_bundled_bank"), "sync_bundled_bank must be exported");
});
test("Rust: commands exports get_stats_conn", () => {
  assert.ok(commands.includes("pub fn get_stats_conn"), "get_stats_conn must be exported");
});
