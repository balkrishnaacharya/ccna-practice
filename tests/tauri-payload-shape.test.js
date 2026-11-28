import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

const quiz = read("../src/pages/Quiz.jsx");
const flashcards = read("../src/components/flashcards/FlashcardDeck.jsx");

const RUST_PAYLOAD_COMMANDS = {
  submit_answer: "mod.rs",
  submit_exam: "mod.rs",
  save_exam_draft: "exam.rs",
  save_question_note: "library.rs",
  review_flashcard: "library.rs",
  create_flashcard: "library.rs",
};

test("every Rust command with a struct payload is invoked with a payload key", () => {
  const all = quiz + flashcards + read("../src/pages/Exam.jsx");
  for (const command of Object.keys(RUST_PAYLOAD_COMMANDS)) {
    const pattern = new RegExp(`invoke\\("${command}"`);
    if (!pattern.test(all)) continue;
    const start = all.indexOf(`invoke("${command}"`);
    const call = all.slice(start, all.indexOf("});", start) + 3);
    assert.ok(
      call.includes("payload:") || /\{\s*payload\s*\}/.test(call),
      `${command} must pass arguments under the payload key`,
    );
  }
});

test("submit_answer no longer sends confidence or top-level fields", () => {
  const start = quiz.indexOf('invoke("submit_answer"');
  const call = quiz.slice(start, quiz.indexOf("});", start));
  assert.ok(call.includes("question_id: question.id"), "question id included");
  assert.ok(call.includes("choice_ids: selected"), "choices included");
  assert.ok(!call.includes("confidence"), "Rust payload has no confidence field");
});

test("Quiz submit action is sticky so the system bar cannot cover it", () => {
  assert.ok(quiz.includes("sticky bottom-0"), "submit area is sticky");
});
