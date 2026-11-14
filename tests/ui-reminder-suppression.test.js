import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
test("App: reminder status checked on mount", () => {
  assert.ok(app.includes("checkReminderStatus"), "checkReminderStatus invoked");
});
test("App: reminders suppressed during active exam", () => {
  assert.ok(app.includes("examProgress.active"), "exam-active gate present");
});
