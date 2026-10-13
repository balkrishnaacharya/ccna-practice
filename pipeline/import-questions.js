#!/usr/bin/env node
/**
 * Import CCNA questions from a JSON file into SQLite.
 *
 * Usage:
 *   node pipeline/import-questions.js questions.json
 *
 * JSON schema:
 *   [{ stem, explanation, domain, subtopic, difficulty, choices: [{ text, is_correct }] }]
 *
 * The script writes to the same ccna.db that the Tauri app uses.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const Database = require("better-sqlite3");

const dbPath = process.env.CCNA_DB_PATH || (process.argv[3] && !process.argv[3].endsWith(".json") ? process.argv[3] : resolveDbPath());
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

db.exec(`
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
    question_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    is_correct INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
`);

const file = process.argv[2];
if (!file) {
  console.error("Usage: node pipeline/import-questions.js <file.json> [dbPath]");
  process.exit(1);
}

const questions = JSON.parse(fs.readFileSync(file, "utf8"));
const existingStems = new Set(
  db.prepare("SELECT LOWER(TRIM(stem)) AS stem FROM questions").all().map((r) => r.stem)
);

const insertQ = db.prepare(
  "INSERT INTO questions (stem, explanation, domain, subtopic, difficulty, source) VALUES (?, ?, ?, ?, ?, ?)"
);
const insertC = db.prepare(
  "INSERT INTO choices (question_id, text, is_correct, sort_order) VALUES (?, ?, ?, ?)"
);

let skippedCount = 0;
const tx = db.transaction((rows) => {
  let count = 0;
  for (const q of rows) {
    const normalizedStem = (q.stem || "").trim().toLowerCase();
    if (!normalizedStem || existingStems.has(normalizedStem)) {
      skippedCount++;
      continue;
    }

    const info = insertQ.run(
      q.stem.trim(),
      q.explanation || null,
      q.domain,
      q.subtopic || null,
      q.difficulty || "medium",
      q.source || "import"
    );
    const qid = info.lastInsertRowid;
    (q.choices || []).forEach((c, i) => {
      insertC.run(qid, c.text, c.is_correct ? 1 : 0, i);
    });
    existingStems.add(normalizedStem);
    count++;
  }
  return count;
});

const count = tx(questions);
console.log(`Imported ${count} questions (skipped ${skippedCount} duplicates) into ${dbPath}`);

function resolveDbPath() {
  const home = os.homedir();
  if (process.platform === "win32") {
    const tauriDir = path.join(process.env.APPDATA || home, "com.ccnapractice.app");
    if (fs.existsSync(tauriDir)) return path.join(tauriDir, "ccna.db");
    return path.join(process.env.APPDATA || home, "ccna-practice", "ccna.db");
  }
  if (process.platform === "darwin") {
    const tauriDir = path.join(home, "Library", "Application Support", "com.ccnapractice.app");
    if (fs.existsSync(tauriDir)) return path.join(tauriDir, "ccna.db");
    return path.join(home, "Library", "Application Support", "ccna-practice", "ccna.db");
  }
  const tauriDir = path.join(home, ".local", "share", "com.ccnapractice.app");
  if (fs.existsSync(tauriDir)) return path.join(tauriDir, "ccna.db");
  return path.join(home, ".local", "share", "ccna-practice", "ccna.db");
}
