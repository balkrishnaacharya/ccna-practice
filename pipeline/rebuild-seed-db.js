#!/usr/bin/env node
/**
 * Rebuild or verify the SQLite seed that is baked into the Tauri binary.
 *
 * The app embeds `src-tauri/resources/ccna.db` with `include_bytes!` and copies
 * it only when the user has no database yet. That means this file must be
 * regenerated whenever `pipeline/data/*.json` changes, or new installs keep
 * seeing the old question count.
 *
 * Usage:
 *   node pipeline/rebuild-seed-db.js            # rebuild the bundled seed
 *   node pipeline/rebuild-seed-db.js --verify   # check the committed seed
 *   node pipeline/rebuild-seed-db.js --out /tmp/ccna.db
 *
 * Rebuilding also rewrites BUNDLED_BANK_VERSION in `src-tauri/src/db.rs`, so the
 * Rust startup merge knows the seed changed.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { fingerprint, normalize } = require("./question-fingerprint");

const DOMAINS = [
  "network_infra",
  "switching",
  "ip_routing",
  "services_security",
  "ai_ops",
];
const DEFAULT_OUT = path.join(__dirname, "..", "src-tauri", "resources", "ccna.db");
const RUST_DB = path.join(__dirname, "..", "src-tauri", "src", "db.rs");

const argv = process.argv.slice(2);
const verifyOnly = argv.includes("--verify");
const outIdx = argv.indexOf("--out");

if (outIdx >= 0 && !argv[outIdx + 1]) {
  fail("--out requires a path");
}

const outPath = outIdx >= 0 ? path.resolve(argv[outIdx + 1]) : DEFAULT_OUT;

const bank = loadBank();
const version = bankVersion(bank);

if (verifyOnly) {
  verifySeed(bank, version);
} else {
  buildSeed(bank, version);
  updateRustVersion(version);
}

// ---------------------------------------------------------------------------

function loadBank() {
  const rows = [];

  for (const domain of DOMAINS) {
    const file = path.join(__dirname, "data", `${domain}.json`);
    if (!fs.existsSync(file)) fail(`Missing domain file: ${file}`);

    const items = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(items)) fail(`${file} root must be an array`);
    rows.push(...items);
  }

  const seen = new Set();
  const seenStems = new Set();
  rows.forEach((q, idx) => {
    const problem = validate(q);
    if (problem) fail(`question ${idx + 1}: ${problem}`);

    // The startup merge matches on stem, so duplicate stems would make the
    // bundled bank impossible to reconcile with an existing database.
    const stem = normalize(q.stem);
    if (seenStems.has(stem)) {
      fail(`duplicate stem ${idx + 1}: "${q.stem}"`);
    }
    seenStems.add(stem);

    const hash = fingerprint(q);
    if (seen.has(hash)) fail(`duplicate question ${idx + 1}: "${q.stem}"`);
    seen.add(hash);
  });

  return rows;
}

function validate(q) {
  if (!q || typeof q !== "object") return "not an object";
  if (!q.stem || typeof q.stem !== "string" || q.stem.trim().length < 10) {
    return "stem missing or too short";
  }
  if (!q.explanation || typeof q.explanation !== "string" || q.explanation.length < 25) {
    return "explanation missing or too short";
  }
  if (!DOMAINS.includes(q.domain)) return `unknown domain "${q.domain}"`;
  if (!["easy", "medium", "hard"].includes(q.difficulty)) {
    return `unknown difficulty "${q.difficulty}"`;
  }
  if (!Array.isArray(q.choices) || q.choices.length !== 4) {
    return "needs exactly 4 choices";
  }
  if (q.choices.some((c) => !c || typeof c.text !== "string" || !c.text.trim())) {
    return "empty choice text";
  }
  const correct = q.choices.filter((c) => c && c.is_correct === true).length;
  if (correct === 0) return "no correct choice";
  if (correct === q.choices.length) return "every choice marked correct";
  if (new Set(q.choices.map((c) => c.text.trim().toLowerCase())).size !== q.choices.length) {
    return "duplicate choice text";
  }
  return null;
}

/** Stable version derived from the actual question content, not a hand-edited date. */
function bankVersion(rows) {
  const hashes = rows.map(fingerprint).sort();
  const digest = crypto
    .createHash("sha256")
    .update(hashes.join("\n"))
    .digest("hex")
    .slice(0, 12);
  return `${rows.length}-${digest}`;
}

function buildSeed(rows, version) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const tmpPath = `${outPath}.tmp`;
  fs.rmSync(tmpPath, { force: true });

  const db = new Database(tmpPath);
  db.pragma("journal_mode = DELETE");
  createSchema(db);

  const insertQuestion = db.prepare(`
    INSERT INTO questions
      (stem, explanation, domain, subtopic, difficulty, source, multi_select, content_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertChoice = db.prepare(`
    INSERT INTO choices (question_id, text, is_correct, sort_order)
    VALUES (?, ?, ?, ?)
  `);
  const insertSetting = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?)"
  );

  const insertAll = db.transaction((items) => {
    for (const q of items) {
      const info = insertQuestion.run(
        q.stem.trim(),
        q.explanation || null,
        q.domain,
        q.subtopic || null,
        q.difficulty || "medium",
        q.source || "import",
        q.multi_select ? 1 : 0,
        fingerprint(q)
      );

      q.choices.forEach((choice, idx) => {
        insertChoice.run(info.lastInsertRowid, choice.text, choice.is_correct ? 1 : 0, idx);
      });
    }

    insertSetting.run("bank_version", version);
    insertSetting.run("profile_name", "Test Engineer");
  });

  insertAll(rows);

  const integrity = db.pragma("integrity_check", { simple: true });
  if (integrity !== "ok") {
    db.close();
    fail(`integrity_check failed: ${integrity}`);
  }

  const count = db.prepare("SELECT COUNT(*) AS n FROM questions").get().n;
  const choiceCount = db.prepare("SELECT COUNT(*) AS n FROM choices").get().n;
  db.close();

  fs.rmSync(outPath, { force: true });
  fs.renameSync(tmpPath, outPath);

  console.log(`Built ${outPath}`);
  console.log(`  questions : ${count}`);
  console.log(`  choices   : ${choiceCount}`);
  console.log(`  version   : ${version}`);
  console.log(`  size      : ${(fs.statSync(outPath).size / 1024 / 1024).toFixed(2)} MB`);
}

function verifySeed(rows, version) {
  if (!fs.existsSync(outPath)) {
    fail(`missing ${outPath}; run "npm run bank:seed"`);
  }

  const db = new Database(outPath, { readonly: true });

  const count = db.prepare("SELECT COUNT(*) AS n FROM questions").get().n;
  if (count !== rows.length) {
    db.close();
    fail(`seed has ${count} questions but the bank has ${rows.length}; run "npm run bank:seed"`);
  }

  const seedVersion = db
    .prepare("SELECT value FROM settings WHERE key = 'bank_version'")
    .get()?.value;
  if (seedVersion !== version) {
    db.close();
    fail(
      `seed version is ${seedVersion || "<missing>"} but the bank is ${version}; run "npm run bank:seed"`
    );
  }

  const seedHashes = new Set(
    db
      .prepare("SELECT content_hash FROM questions WHERE content_hash IS NOT NULL")
      .all()
      .map((row) => row.content_hash)
  );
  for (const q of rows) {
    if (!seedHashes.has(fingerprint(q))) {
      db.close();
      fail(`seed is missing question: "${q.stem.slice(0, 60)}..."; run "npm run bank:seed"`);
    }
  }

  const withoutChoices = db
    .prepare(
      "SELECT COUNT(*) AS n FROM questions q WHERE NOT EXISTS (SELECT 1 FROM choices c WHERE c.question_id = q.id)"
    )
    .get().n;
  if (withoutChoices > 0) {
    db.close();
    fail(`${withoutChoices} seed questions have no choices; run "npm run bank:seed"`);
  }

  db.close();

  const rustVersion = readRustVersion();
  if (rustVersion !== version) {
    fail(
      `db.rs BUNDLED_BANK_VERSION is ${rustVersion || "<missing>"} but the bank is ${version}; run "npm run bank:seed"`
    );
  }

  console.log(`Seed is current: ${count} questions, version ${version}`);
}

function createSchema(db) {
  db.exec(`
    CREATE TABLE questions (
      id INTEGER PRIMARY KEY,
      stem TEXT NOT NULL,
      explanation TEXT,
      domain TEXT NOT NULL,
      subtopic TEXT,
      difficulty TEXT NOT NULL DEFAULT 'medium',
      source TEXT,
      multi_select INTEGER NOT NULL DEFAULT 0,
      content_hash TEXT
    );

    CREATE TABLE choices (
      id INTEGER PRIMARY KEY,
      question_id INTEGER NOT NULL REFERENCES questions(id),
      text TEXT NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE sessions (
      id INTEGER PRIMARY KEY,
      mode TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      score INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      duration_sec INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE answers (
      id INTEGER PRIMARY KEY,
      session_id INTEGER REFERENCES sessions(id),
      question_id INTEGER REFERENCES questions(id),
      correct INTEGER NOT NULL,
      time_spent_ms INTEGER,
      answered_at INTEGER NOT NULL DEFAULT 0,
      selected_choice_ids TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE flags (
      id INTEGER PRIMARY KEY,
      question_id INTEGER UNIQUE REFERENCES questions(id),
      note TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE user_question_stats (
      id INTEGER PRIMARY KEY,
      question_id INTEGER NOT NULL UNIQUE REFERENCES questions(id),
      times_seen INTEGER NOT NULL DEFAULT 0,
      times_correct INTEGER NOT NULL DEFAULT 0,
      last_seen_at INTEGER NOT NULL DEFAULT 0,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      interval_days INTEGER NOT NULL DEFAULT 0,
      repetitions INTEGER NOT NULL DEFAULT 0,
      next_review_at INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX idx_q_domain ON questions(domain);
    CREATE INDEX idx_q_difficulty ON questions(difficulty);
    CREATE UNIQUE INDEX idx_q_content_hash
      ON questions(content_hash) WHERE content_hash IS NOT NULL;
  `);
}

function readRustVersion() {
  const src = fs.readFileSync(RUST_DB, "utf8");
  const match = src.match(/pub const BUNDLED_BANK_VERSION: &str = "([^"]*)";/);
  return match ? match[1] : null;
}

function updateRustVersion(version) {
  const src = fs.readFileSync(RUST_DB, "utf8");
  const pattern = /pub const BUNDLED_BANK_VERSION: &str = "[^"]*";/;
  if (!pattern.test(src)) {
    fail("could not find BUNDLED_BANK_VERSION in src-tauri/src/db.rs");
  }
  const next = src.replace(
    pattern,
    `pub const BUNDLED_BANK_VERSION: &str = "${version}";`
  );
  if (next !== src) {
    fs.writeFileSync(RUST_DB, next);
    console.log(`Updated BUNDLED_BANK_VERSION in src-tauri/src/db.rs`);
  }
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}
