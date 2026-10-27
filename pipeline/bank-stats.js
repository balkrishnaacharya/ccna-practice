#!/usr/bin/env node
/**
 * Report bank size, uniqueness, and coverage against the 2000-question goal.
 *
 * Usage:
 *   node pipeline/bank-stats.js [--strict]
 *
 * --strict exits non-zero when duplicates, invalid questions, thin subtopics, or
 * zero-coverage subtopics are found, so it can be wired into CI.
 */

const fs = require("fs");
const path = require("path");
const { fingerprint } = require("./question-fingerprint");
const { BLUEPRINT_SUBTOPICS } = require("./subtopics");

const TARGET_TOTAL = 2000;
const DAYS_LEFT = 150; // five months at ~30 days
const BLUEPRINT = {
  network_infra: 0.25,
  switching: 0.25,
  ip_routing: 0.2,
  services_security: 0.2,
  ai_ops: 0.1,
};

const strict = process.argv.includes("--strict");
const dataDir = path.join(__dirname, "data");
const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));

const seen = new Map();
const perDomain = {};
const perDifficulty = {};
const perSubtopic = new Map();
const perFile = [];
let total = 0;
let duplicates = 0;
let invalid = 0;

for (const file of files) {
  const rows = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
  let fileDupes = 0;
  perFile.push({ file, count: rows.length });

  for (const q of rows) {
    total++;
    perDomain[q.domain] = (perDomain[q.domain] || 0) + 1;
    perDifficulty[q.difficulty || "medium"] = (perDifficulty[q.difficulty || "medium"] || 0) + 1;
    const subtopicKey = `${q.domain}||${q.subtopic || "Uncategorized"}`;
    perSubtopic.set(subtopicKey, (perSubtopic.get(subtopicKey) || 0) + 1);

    const problem = validate(q);
    if (problem) {
      invalid++;
      console.error(`INVALID ${file}: ${problem} — "${String(q.stem).slice(0, 60)}..."`);
    }

    const hash = fingerprint(q);
    if (seen.has(hash)) {
      duplicates++;
      fileDupes++;
      console.error(
        `DUPLICATE ${file} (also in ${seen.get(hash)}): "${String(q.stem).slice(0, 70)}..."`
      );
    } else {
      seen.set(hash, file);
    }
  }

  if (fileDupes > 0) perFile[perFile.length - 1].dupes = fileDupes;
}

const unique = seen.size;
const remaining = Math.max(0, TARGET_TOTAL - unique);
const perDay = Math.ceil(remaining / DAYS_LEFT);

console.log("\n=== CCNA 2.0 Question Bank ===\n");
console.log(`Files scanned : ${files.length}`);
for (const f of perFile) {
  console.log(`  ${f.file.padEnd(24)} ${String(f.count).padStart(4)}${f.dupes ? `  (${f.dupes} dupes)` : ""}`);
}

console.log(`\nTotal rows    : ${total}`);
console.log(`Unique        : ${unique}`);
console.log(`Duplicates    : ${duplicates}`);
console.log(`Invalid       : ${invalid}`);

console.log("\n--- Domains ---");
for (const [domain, weight] of Object.entries(BLUEPRINT)) {
  const count = perDomain[domain] || 0;
  const target = Math.round(TARGET_TOTAL * weight);
  const pct = ((count / target) * 100).toFixed(0);
  console.log(
    `  ${domain.padEnd(20)} ${String(count).padStart(5)} / ${String(target).padStart(5)}  ${pct.padStart(3)}%`
  );
}

console.log("\n--- Difficulty ---");
for (const level of ["easy", "medium", "hard"]) {
  console.log(`  ${level.padEnd(8)} ${String(perDifficulty[level] || 0).padStart(5)}`);
}

// Subtopic spread: a subtopic with only one or two questions cannot be drilled,
// so surface the thinnest ones as the next authoring targets.
const THIN_THRESHOLD = 4;
const thin = [...perSubtopic.entries()]
  .map(([key, count]) => {
    const [domain, subtopic] = key.split("||");
    return { domain, subtopic, count };
  })
  .filter((s) => s.count < THIN_THRESHOLD)
  .sort((a, b) => a.count - b.count || a.domain.localeCompare(b.domain));

console.log("\n--- Coverage ---");
console.log(
  `  ${perSubtopic.size} subtopics, ${thin.length} under ${THIN_THRESHOLD} questions`
);
const shown = thin.slice(0, 20);
for (const s of shown) {
  const bar = "·".repeat(s.count) + "◦".repeat(THIN_THRESHOLD - s.count);
  console.log(`  ${bar.padEnd(6)} ${s.count}  ${s.domain}/${s.subtopic}`);
}
if (thin.length > shown.length) {
  console.log(`  ... and ${thin.length - shown.length} more (all under ${THIN_THRESHOLD})`);
}

// The data files can only prove a subtopic exists, never that one is absent, so
// diff against the canonical registry to catch topics nobody has written yet.
const missing = [];
for (const [domain, subtopics] of Object.entries(BLUEPRINT_SUBTOPICS)) {
  for (const subtopic of subtopics) {
    if (!perSubtopic.has(`${domain}||${subtopic}`)) missing.push({ domain, subtopic });
  }
}

console.log(`\n--- Gaps (never authored) ---`);
console.log(`  ${missing.length} of ${Object.values(BLUEPRINT_SUBTOPICS).flat().length} registry subtopics have 0 questions`);
for (const s of missing) console.log(`  0  ${s.domain}/${s.subtopic}`);

console.log("\n--- Goal ---");
console.log(`  Target        : ${TARGET_TOTAL} unique questions`);
console.log(`  Remaining     : ${remaining} over ~${DAYS_LEFT} days (${perDay}/day)`);

if (remaining === 0 && duplicates === 0 && invalid === 0) {
  console.log("\nBank is at goal and clean.");
} else if (remaining === 0) {
  console.log("\nVolume met, but duplicates/invalid rows need cleanup.");
}

if (strict && (duplicates > 0 || invalid > 0 || thin.length > 0 || missing.length > 0)) {
  process.exit(1);
}

function validate(q) {
  if (!q || typeof q !== "object") return "not an object";
  if (!q.stem || typeof q.stem !== "string" || q.stem.trim().length < 10) return "stem too short";
  if (!BLUEPRINT[q.domain]) return `unknown domain "${q.domain}"`;
  if (q.difficulty && !["easy", "medium", "hard"].includes(q.difficulty)) {
    return `unknown difficulty "${q.difficulty}"`;
  }
  if (!Array.isArray(q.choices) || q.choices.length !== 4) return "needs exactly 4 choices";
  const correct = q.choices.filter((c) => c && c.is_correct === true).length;
  if (correct === 0) return "no correct choice";
  if (correct === q.choices.length) return "all choices correct";
  const texts = new Set(q.choices.map((c) => String(c.text || "").trim().toLowerCase()));
  if (texts.size !== q.choices.length) return "duplicate choice text";
  return null;
}
