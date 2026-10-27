#!/usr/bin/env node
/**
 * Append curated questions into pipeline/data/<domain>.json.
 *
 * Usage:
 *   node pipeline/add-questions.js <file.json> [--dry-run]
 *
 * The input is a JSON array using the record shape of pipeline/data/*.json.
 * Every record is validated and fingerprinted against the whole bank before it
 * is appended, so a batch can never reintroduce a duplicate or a malformed
 * question. Nothing is written until every record in the file passes.
 */

const fs = require("fs");
const path = require("path");
const { fingerprint } = require("./question-fingerprint");

const DOMAINS = ["network_infra", "switching", "ip_routing", "services_security", "ai_ops"];
const DIFFICULTIES = ["easy", "medium", "hard"];

const input = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
if (!input) {
  console.error("Usage: node pipeline/add-questions.js <file.json> [--dry-run]");
  process.exit(1);
}

const dataDir = path.join(__dirname, "data");
const bank = {};
const index = new Map();
for (const domain of DOMAINS) {
  const rows = JSON.parse(fs.readFileSync(path.join(dataDir, `${domain}.json`), "utf8"));
  bank[domain] = rows;
  for (const q of rows) index.set(fingerprint(q), `${domain}:${q.stem.slice(0, 60)}`);
}

const incoming = JSON.parse(fs.readFileSync(input, "utf8"));
if (!Array.isArray(incoming) || incoming.length === 0) {
  console.error("Input must be a non-empty JSON array.");
  process.exit(1);
}

function problem(q) {
  if (!q || typeof q !== "object") return "not an object";
  if (typeof q.stem !== "string" || q.stem.trim().length < 10) return "stem too short";
  if (typeof q.explanation !== "string" || q.explanation.trim().length < 25)
    return "explanation too short";
  if (!DOMAINS.includes(q.domain)) return `unknown domain ${q.domain}`;
  if (!DIFFICULTIES.includes(q.difficulty)) return `unknown difficulty ${q.difficulty}`;
  if (typeof q.subtopic !== "string" || !q.subtopic.trim()) return "missing subtopic";
  if (!Array.isArray(q.choices) || q.choices.length !== 4) return "needs exactly 4 choices";
  const correct = q.choices.filter((c) => c && c.is_correct === true).length;
  if (correct !== 1) return `needs exactly 1 correct choice (found ${correct})`;
  for (const c of q.choices) {
    if (!c || typeof c.text !== "string" || !c.text.trim()) return "empty choice text";
    // A missing flag silently reads as false, which hides a typo until import.
    if (typeof c.is_correct !== "boolean") return "choice is_correct must be boolean";
  }
  if (new Set(q.choices.map((c) => c.text.trim().toLowerCase())).size !== 4)
    return "duplicate choice text";
  return null;
}

const accepted = [];
let rejected = 0;
for (const [i, q] of incoming.entries()) {
  const issue = problem(q);
  if (issue) {
    console.error(`REJECT #${i + 1} (${issue}) — "${String(q && q.stem).slice(0, 70)}"`);
    rejected++;
    continue;
  }
  const hash = fingerprint(q);
  if (index.has(hash)) {
    console.error(`DUPLICATE #${i + 1} of ${index.get(hash)} — "${q.stem.slice(0, 70)}"`);
    rejected++;
    continue;
  }
  index.set(hash, `${q.domain}:${q.stem.slice(0, 60)}`);
  accepted.push(q);
}

if (rejected > 0) {
  console.error(`\n${rejected} record(s) rejected; nothing written.`);
  process.exit(1);
}

const perDomain = {};
for (const q of accepted) perDomain[q.domain] = (perDomain[q.domain] || 0) + 1;

if (dryRun) {
  console.log(`Dry run: ${accepted.length} records would be appended.`);
} else {
  for (const [domain, count] of Object.entries(perDomain)) {
    const file = path.join(dataDir, `${domain}.json`);
    fs.writeFileSync(file, JSON.stringify([...bank[domain], ...accepted.filter((q) => q.domain === domain)], null, 2) + "\n");
    console.log(`+${count} → ${domain}.json`);
  }
}

for (const [domain, count] of Object.entries(perDomain)) console.log(`  ${domain.padEnd(20)} +${count}`);
console.log(`${accepted.length} questions ${dryRun ? "validated" : "appended"}.`);
