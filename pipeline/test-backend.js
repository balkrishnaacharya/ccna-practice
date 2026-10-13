#!/usr/bin/env node
const Database = require('better-sqlite3');
const os = require('os');
const path = require('path');
const fs = require('fs');

function resolveDbPath() {
  const home = os.homedir();
  if (process.platform === 'win32') {
    const tauriDir = path.join(process.env.APPDATA || home, 'com.ccnapractice.app');
    if (fs.existsSync(tauriDir)) return path.join(tauriDir, 'ccna.db');
    return path.join(process.env.APPDATA || home, 'ccna-practice', 'ccna.db');
  }
  if (process.platform === 'darwin') {
    const tauriDir = path.join(home, 'Library', 'Application Support', 'com.ccnapractice.app');
    if (fs.existsSync(tauriDir)) return path.join(tauriDir, 'ccna.db');
    return path.join(home, 'Library', 'Application Support', 'ccna-practice', 'ccna.db');
  }
  const tauriDir = path.join(home, '.local', 'share', 'com.ccnapractice.app');
  if (fs.existsSync(tauriDir)) return path.join(tauriDir, 'ccna.db');
  return path.join(home, '.local', 'share', 'ccna-practice', 'ccna.db');
}

const dbPath = resolveDbPath();
console.log(`Connecting to SQLite DB at: ${dbPath}`);
const db = new Database(dbPath);

console.log("\n--- TEST 1: Question Bank Verification ---");
const totalQ = db.prepare("SELECT COUNT(*) as count FROM questions").get().count;
console.log(`Total questions in DB: ${totalQ}`);
if (totalQ < 200) {
  console.error(`FAIL: Expected at least 200 questions, found ${totalQ}`);
  process.exit(1);
} else {
  console.log("PASS: Total questions >= 200");
}

console.log("\n--- TEST 2: Domain Breakdown Verification ---");
const domainCounts = db.prepare("SELECT domain, COUNT(*) as count FROM questions GROUP BY domain ORDER BY domain").all();
console.table(domainCounts);
const expectedDomains = ['ai_ops', 'ip_routing', 'network_infra', 'services_security', 'switching'];
const actualDomains = domainCounts.map(d => d.domain);
for (const d of expectedDomains) {
  if (!actualDomains.includes(d)) {
    console.error(`FAIL: Missing domain ${d}`);
    process.exit(1);
  }
}
console.log("PASS: All 5 domains present and populated.");

console.log("\n--- TEST 3: Exam Blueprint Generation (100 Questions) ---");
const targets = [
  { domain: 'network_infra', count: 25 },
  { domain: 'switching', count: 25 },
  { domain: 'ip_routing', count: 20 },
  { domain: 'services_security', count: 20 },
  { domain: 'ai_ops', count: 10 }
];

let examQuestions = [];
for (const t of targets) {
  const qs = db.prepare("SELECT id, stem, domain, difficulty FROM questions WHERE domain = ? ORDER BY RANDOM() LIMIT ?").all(t.domain, t.count);
  if (qs.length !== t.count) {
    console.error(`FAIL: Domain ${t.domain} drew ${qs.length} instead of ${t.count}`);
    process.exit(1);
  }
  examQuestions = examQuestions.concat(qs);
}

if (examQuestions.length !== 100) {
  console.error(`FAIL: Exam drawn total is ${examQuestions.length}, expected 100`);
  process.exit(1);
}
console.log(`PASS: 100 questions successfully drawn matching exact blueprint weights (25/25/20/20/10).`);

console.log("\n--- TEST 4: Choices & Answers Integrity ---");
const sampleQ = examQuestions[0];
const sampleChoices = db.prepare("SELECT id, text, is_correct FROM choices WHERE question_id = ?").all(sampleQ.id);
console.log(`Sample Question (${sampleQ.domain}): "${sampleQ.stem.slice(0, 60)}..."`);
console.log(`Choices count: ${sampleChoices.length}`);
if (sampleChoices.length !== 4) {
  console.error(`FAIL: Expected 4 choices, found ${sampleChoices.length}`);
  process.exit(1);
}
const correctChoices = sampleChoices.filter(c => c.is_correct === 1);
if (correctChoices.length < 1) {
  console.error("FAIL: No correct choice found for question");
  process.exit(1);
}
console.log(`PASS: Choice structure valid. Correct answer: "${correctChoices[0].text}"`);

console.log("\n--- TEST 5: Flag / Review System Integration ---");
// Toggle flag test
db.prepare("DELETE FROM flags WHERE question_id = ?").run(sampleQ.id);
db.prepare("INSERT INTO flags (question_id, note, created_at) VALUES (?, ?, ?)").run(sampleQ.id, "Integration test flag note", Math.floor(Date.now() / 1000));
const flagRow = db.prepare("SELECT * FROM flags WHERE question_id = ?").get(sampleQ.id);
if (!flagRow || flagRow.note !== "Integration test flag note") {
  console.error("FAIL: Flag insertion failed");
  process.exit(1);
}
console.log("PASS: Flag inserted and retrieved successfully.");
db.prepare("DELETE FROM flags WHERE question_id = ?").run(sampleQ.id);
const afterDelete = db.prepare("SELECT * FROM flags WHERE question_id = ?").get(sampleQ.id);
if (afterDelete) {
  console.error("FAIL: Flag deletion failed");
  process.exit(1);
}
console.log("PASS: Flag unflag/deletion verified.");

console.log("\n--- TEST 6: Settings Table Profile Name Upsert ---");
db.prepare("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)").run();
db.prepare("INSERT INTO settings (key, value) VALUES ('profile_name', 'Test Engineer') ON CONFLICT(key) DO UPDATE SET value = 'Test Engineer'").run();
const settingVal = db.prepare("SELECT value FROM settings WHERE key = 'profile_name'").get().value;
if (settingVal !== 'Test Engineer') {
  console.error(`FAIL: Setting value mismatch. Got ${settingVal}`);
  process.exit(1);
}
console.log(`PASS: Settings table profile_name stored and retrieved: "${settingVal}"`);

console.log("\n==========================================");
console.log("ALL BACKEND & DATABASE TESTS PASSED 100%!");
console.log("==========================================");
