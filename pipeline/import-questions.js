#!/usr/bin/env node
/**
 * Import CCNA questions from a JSON file into SQLite.
 *
 * Usage:
 *   node pipeline/import-questions.js <file.json> [dbPath] [--dry-run]
 *
 * JSON schema:
 *   [{ stem, explanation, domain, subtopic, difficulty, choices: [{ text, is_correct }] }]
 *
 * Uniqueness is content-based: normalized stem + sorted choice texts. A question
 * that differs only in option order, casing, punctuation, or id is a duplicate.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const Database = require("better-sqlite3");
const { fingerprint } = require("./question-fingerprint");

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const positional = argv.filter((a) => !a.startsWith("--"));
const file = positional[0];
const dbArg = positional[1];

const VALID_DOMAINS = new Set([
  "network_infra",
  "switching",
  "ip_routing",
  "services_security",
  "ai_ops",
]);
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

if (!file) {
  console.error("Usage: node pipeline/import-questions.js <file.json> [dbPath] [--dry-run]");
  process.exit(1);
}

const dbPath = process.env.CCNA_DB_PATH || dbArg || resolveDbPath();
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

ensureContentHashColumn();

const questions = JSON.parse(fs.readFileSync(file, "utf8"));
if (!Array.isArray(questions)) {
  console.error("Root of the JSON file must be an array");
  process.exit(1);
}

const insertQ = db.prepare(
  "INSERT INTO questions (stem, explanation, domain, subtopic, difficulty, source, content_hash) VALUES (?, ?, ?, ?, ?, ?, ?)"
);
const insertC = db.prepare(
  "INSERT INTO choices (question_id, text, is_correct, sort_order) VALUES (?, ?, ?, ?)"
);
const updateHash = db.prepare("UPDATE questions SET content_hash = ? WHERE id = ?");

const existingByHash = backfillExistingHashes();

let imported = 0;
let skipped = 0;
let invalid = 0;

const tx = db.transaction((rows) => {
  rows.forEach((q, i) => {
    const problem = validate(q);
    if (problem) {
      invalid++;
      console.warn(`  skipped Q#${i + 1}: ${problem}`);
      return;
    }

    const hash = fingerprint(q);
    if (existingByHash.has(hash)) {
      skipped++;
      return;
    }
    if (dryRun) {
      imported++;
      existingByHash.set(hash, -1);
      return;
    }

    const info = insertQ.run(
      q.stem.trim(),
      q.explanation || null,
      q.domain,
      q.subtopic || null,
      q.difficulty || "medium",
      q.source || "import",
      hash
    );
    (q.choices || []).forEach((c, idx) => {
      insertC.run(info.lastInsertRowid, c.text, c.is_correct ? 1 : 0, idx);
    });
    existingByHash.set(hash, info.lastInsertRowid);
    imported++;
  });
});

tx(questions);

console.log(
  `${dryRun ? "[dry-run] would import" : "Imported"} ${imported} questions ` +
    `(duplicates ${skipped}, invalid ${invalid}) into ${dbPath}`
);
if (dryRun) console.log("No database changes were written.");

// ---------------------------------------------------------------------------

function validate(q) {
  if (!q || typeof q !== "object") return "not an object";
  if (!q.stem || typeof q.stem !== "string" || q.stem.trim().length < 10) {
    return "stem missing or too short";
  }
  if (!VALID_DOMAINS.has(q.domain)) return `unknown domain "${q.domain}"`;
  if (q.difficulty && !VALID_DIFFICULTIES.has(q.difficulty)) {
    return `unknown difficulty "${q.difficulty}"`;
  }
  if (!Array.isArray(q.choices) || q.choices.length < 2) return "fewer than 2 choices";
  if (q.choices.some((c) => !c || typeof c.text !== "string" || !c.text.trim())) {
    return "empty choice text";
  }
  const correct = q.choices.filter((c) => c.is_correct === true).length;
  if (correct === 0) return "no correct choice";
  if (correct === q.choices.length) return "every choice marked correct";
  return null;
}

function ensureContentHashColumn() {
  const has = db
    .prepare("SELECT COUNT(*) AS n FROM pragma_table_info('questions') WHERE name = 'content_hash'")
    .get().n;
  if (!has) {
    db.exec("ALTER TABLE questions ADD COLUMN content_hash TEXT");
  }
}

/**
 * Compute fingerprints for rows imported before this feature existed, then make
 * the column authoritative with a unique index. Rows that turn out to be
 * duplicates are left NULL rather than breaking the index — they still show up
 * in the report so they can be cleaned manually.
 */
function backfillExistingHashes() {
  const rows = db
    .prepare("SELECT id, stem, content_hash FROM questions")
    .all();
  const choicesByQuestion = new Map();
  for (const c of db.prepare("SELECT question_id, text FROM choices").all()) {
    if (!choicesByQuestion.has(c.question_id)) choicesByQuestion.set(c.question_id, []);
    choicesByQuestion.get(c.question_id).push({ text: c.text });
  }

  const byHash = new Map();
  let backfilled = 0;
  let conflicting = 0;

  for (const row of rows) {
    const hash = fingerprint({
      stem: row.stem,
      choices: choicesByQuestion.get(row.id) || [],
    });
    if (byHash.has(hash) && byHash.get(hash) !== row.id) {
      if (row.content_hash) conflicting++;
      continue;
    }
    byHash.set(hash, row.id);
    if (row.content_hash !== hash && !dryRun) {
      updateHash.run(hash, row.id);
    }
    if (row.content_hash !== hash) backfilled++;
  }

  if (conflicting > 0) {
    console.warn(`Warning: ${conflicting} existing rows are duplicates but still have a content_hash.`);
  }
  if (backfilled > 0) {
    console.log(`Backfilled content_hash for ${backfilled} existing questions.`);
  }

  if (!dryRun) {
    try {
      db.exec(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_q_content_hash ON questions(content_hash) WHERE content_hash IS NOT NULL"
      );
    } catch (err) {
      console.warn(`Could not create unique content_hash index: ${err.message}`);
    }
  }

  return byHash;
}

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
