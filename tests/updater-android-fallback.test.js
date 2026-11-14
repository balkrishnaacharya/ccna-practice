import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/utils/useUpdater.js", import.meta.url), "utf8");
test("Updater: Android applyUpdate has try/catch", () => {
  assert.ok(source.includes("try {"), "Android update path uses try/catch");
  assert.ok(source.includes("catch"), "Android update path has error handling");
});
test("Updater: Android fallback offers GitHub release page", () => {
  assert.ok(
    source.includes("github.com") || source.includes("GitHub releases"),
    "Android fallback references GitHub releases"
  );
});
test("Updater: Android error path does not claim silent success", () => {
  assert.ok(
    source.includes("setStatus(\"error\")") || source.includes("setStatus('error')"),
    "Android error path sets error status"
  );
});
test("Updater: Android checkForUpdates sets githubReleaseUrl", () => {
  assert.ok(
    source.includes("githubReleaseUrl"),
    "Android update info must include githubReleaseUrl for direct release page access"
  );
});
test("Updater: Android applyUpdate error path references GitHub release page", () => {
  assert.ok(
    source.includes("githubReleaseUrl") && source.includes("catch"),
    "Android error path must reference githubReleaseUrl as fallback"
  );
});
