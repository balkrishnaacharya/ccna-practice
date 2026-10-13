const fs = require("fs");

const validDomains = new Set([
  "network_infra",
  "switching",
  "ip_routing",
  "services_security",
  "ai_ops",
]);
const validDifficulties = new Set(["easy", "medium", "hard"]);

function validateFile(filepath) {
  const content = fs.readFileSync(filepath, "utf8");
  let questions;
  try {
    questions = JSON.parse(content);
  } catch (err) {
    console.error(`JSON Parse error in ${filepath}:`, err.message);
    process.exit(1);
  }

  if (!Array.isArray(questions)) {
    console.error(`${filepath} root must be an array`);
    process.exit(1);
  }

  const stems = new Set();
  let errors = 0;

  questions.forEach((q, idx) => {
    const prefix = `[Q#${idx + 1}]`;

    if (!q.stem || typeof q.stem !== "string" || q.stem.trim().length < 10) {
      console.error(`${prefix} invalid stem`);
      errors++;
    }

    const normStem = (q.stem || "").trim().toLowerCase();
    if (stems.has(normStem)) {
      console.error(`${prefix} duplicate stem in file: "${q.stem}"`);
      errors++;
    }
    stems.add(normStem);

    if (!q.explanation || typeof q.explanation !== "string" || q.explanation.length < 25) {
      console.error(`${prefix} explanation missing or too short`);
      errors++;
    }
    if (q.explanation && q.explanation.trim().toLowerCase() === "it is correct.") {
      console.error(`${prefix} invalid explanation "It is correct."`);
      errors++;
    }

    if (!validDomains.has(q.domain)) {
      console.error(`${prefix} invalid domain "${q.domain}"`);
      errors++;
    }

    if (!validDifficulties.has(q.difficulty)) {
      console.error(`${prefix} invalid difficulty "${q.difficulty}"`);
      errors++;
    }

    if (!Array.isArray(q.choices) || q.choices.length !== 4) {
      console.error(`${prefix} must have exactly 4 choices (has ${q.choices ? q.choices.length : 0})`);
      errors++;
    } else {
      let correctCount = 0;
      q.choices.forEach((c, cIdx) => {
        if (!c.text || typeof c.text !== "string" || c.text.trim().length === 0) {
          console.error(`${prefix} choice ${cIdx + 1} empty text`);
          errors++;
        }
        if (typeof c.is_correct !== "boolean") {
          console.error(`${prefix} choice ${cIdx + 1} is_correct must be boolean`);
          errors++;
        }
        if (c.is_correct) correctCount++;
      });

      if (correctCount === 0) {
        console.error(`${prefix} has 0 correct choices`);
        errors++;
      } else if (correctCount === 4) {
        console.error(`${prefix} has 4 correct choices`);
        errors++;
      }
    }
  });

  if (errors > 0) {
    console.error(`Validation failed with ${errors} errors in ${filepath}`);
    process.exit(1);
  } else {
    console.log(`✓ Validation passed: ${questions.length} questions in ${filepath}`);
  }
}

if (process.argv[2]) {
  validateFile(process.argv[2]);
} else {
  console.log("Usage: node pipeline/validate-questions.js <file.json>");
}
