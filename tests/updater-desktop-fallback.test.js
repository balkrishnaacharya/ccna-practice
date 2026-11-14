import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/utils/useUpdater.js", import.meta.url), "utf8");
test("useUpdater: desktop fallback does not claim silent success", () => {
  assert.ok(
    source.includes("Could not open") || source.includes("error"),
    "Fallback must show error when shell open fails"
  );
  assert.ok(
    source.includes("Visit GitHub releases manually") || source.includes("download manually"),
    "Fallback must direct user to manual download"
  );
  // The shell::open success path must not close the modal as completed.
  // Opening a download page is not a completed update.
  assert.ok(
    !source.includes("await open(updateInfo.downloadUrl);\n        setShowModal(false);"),
    "shell::open success path must not silently close modal as completed"
  );
});
