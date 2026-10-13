#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("=== Building CCNA 2.0 200-Question Bank ===");

const domains = [
  'network_infra',
  'switching',
  'ip_routing',
  'services_security',
  'ai_ops'
];

let bank = [];

for (const d of domains) {
  const filePath = path.join(__dirname, `data/${d}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing domain file: ${filePath}`);
    process.exit(1);
  }
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`Loaded ${items.length} questions from ${d}.json`);
  bank = bank.concat(items);
}

console.log(`Total assembled questions: ${bank.length}`);

const bankFile = path.join(__dirname, 'questions.bank.json');
fs.writeFileSync(bankFile, JSON.stringify(bank, null, 2));

console.log(`Saved bank to ${bankFile}`);

console.log("\nRunning strict validator...");
execSync(`node "${path.join(__dirname, 'validate-questions.js')}" "${bankFile}"`, { stdio: 'inherit' });

console.log("\nImporting questions into database...");
// Clean slate or add: let's import the full 200-question bank
execSync(`node "${path.join(__dirname, 'import-questions.js')}" "${bankFile}"`, { stdio: 'inherit' });

console.log("\n=== 200 Question Bank successfully built, validated, and imported! ===");
