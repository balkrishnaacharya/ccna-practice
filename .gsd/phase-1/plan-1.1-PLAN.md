---
phase: 1
plan: 1.1
wave: 1
depends_on: []
files_modified:
  - src-tauri/resources/ccna.db
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Bundled DB contains 2000+ unique questions across all 5 domains"
    - "Import pipeline runs cleanly with zero duplicates and zero invalid rows"
  artifacts:
    - "src-tauri/resources/ccna.db exists and is populated"
    - "pipeline/questions.bank.json exists with 2000+ questions"
  key_links:
    - "build-bank.js assembles all domain JSONs into questions.bank.json"
    - "import-questions.js loads questions.bank.json into resources/ccna.db"
    - "bank-stats.js --strict verifies count and uniqueness"
---

# Plan 1.1: Rebuild Bundled Question Bank DB (2000+ Questions)

## Objective

Replace the stale bundled `src-tauri/resources/ccna.db` (currently ~500 questions) with a freshly built DB containing all 2000+ questions from the JSON data files. Android (and all platforms) ship with the full question bank baked into the binary.

Purpose: Fix the core bug where Android users only see 500 questions despite 2000+ existing in the data pipeline.
Output: A populated `src-tauri/resources/ccna.db` with 2000+ unique questions, plus a validated `pipeline/questions.bank.json`.

## Context

Load these files for context:
- pipeline/build-bank.js — assembles domain JSONs, validates, imports
- pipeline/import-questions.js — imports JSON bank into SQLite DB
- pipeline/bank-stats.js — reports count, duplicates, invalid rows
- pipeline/data/*.json — source question files (5 domain files)
- src-tauri/src/lib.rs — bundles ccna.db via include_bytes! at compile time
- src-tauri/resources/ccna.db — the stale bundled DB to replace

## Tasks

<task type="auto">
  <name>Assemble and validate full question bank JSON</name>
  <files>
    pipeline/build-bank.js
    pipeline/data/network_infra.json
    pipeline/data/switching.json
    pipeline/data/ip_routing.json
    pipeline/data/services_security.json
    pipeline/data/ai_ops.json
    pipeline/questions.bank.json
  </files>
  <action>
    Run `node pipeline/build-bank.js` from the project root. This script:
    1. Concatenates all 5 domain JSON files into pipeline/questions.bank.json
    2. Runs validate-questions.js for strict validation
    3. Imports into the default DB path (side effect, harmless)
    4. Runs bank-stats.js for a coverage report

    AVOID: Do not edit the JSON data files or build-bank.js logic. The script is the canonical build path.
    USE: The existing build-bank.js as-is. If it exits non-zero, capture the validation errors.

  </action>
  <verify>
    `node pipeline/build-bank.js` exits with code 0. pipeline/questions.bank.json exists and contains 2000+ question objects.
  </verify>
  <done>
    questions.bank.json exists with total question count >= 2000. Validation passes with no errors.
  </done>
</task>

<task type="auto">
  <name>Import full bank into bundled resources DB</name>
  <files>
    pipeline/questions.bank.json
    pipeline/import-questions.js
    src-tauri/resources/ccna.db
  </files>
  <action>
    Run `node pipeline/import-questions.js pipeline/questions.bank.json src-tauri/resources/ccna.db` from the project root. This imports all questions from the bank JSON into the bundled DB path, using content_hash deduplication so the existing ~500 questions are not duplicated.

    AVOID: Do not pass --dry-run (we need actual writes). Do not use the default DB path — must target resources/ccna.db explicitly.
    USE: The dbArg parameter of import-questions.js to write directly to src-tauri/resources/ccna.db. Content-hash dedup handles existing rows safely.

  </action>
  <verify>
    `node pipeline/bank-stats.js --strict` reports 2000+ unique questions, 0 duplicates, 0 invalid rows. The DB at src-tauri/resources/ccna.db has 2000+ rows in the questions table.
  </verify>
  <done>
    src-tauri/resources/ccna.db contains 2000+ questions across all 5 domains. bank-stats.js --strict exits 0.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] pipeline/questions.bank.json has 2000+ questions
- [ ] src-tauri/resources/ccna.db has 2000+ rows in questions table
- [ ] bank-stats.js --strict passes (0 dupes, 0 invalid)
- [ ] Per-domain counts are non-zero for all 5 domains

## Success Criteria

- [ ] All tasks verified passing
- [ ] Must-haves confirmed: 2000+ questions in bundled DB, clean import
- [ ] No regressions in the import pipeline