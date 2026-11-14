import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/pages/Settings.jsx", import.meta.url), "utf8");
test("Settings: notification section present", () => {
  assert.ok(source.includes("Notification"), "notification section heading");
  assert.ok(source.includes("notif_enabled") || source.includes("Enable notifications"), "master toggle");
  assert.ok(source.includes("quiet") || source.includes("Quiet hours"), "quiet hours controls");
});
test("Settings: no guilt-based wording", () => {
  assert.ok(!source.includes("failing") && !source.includes("losing everything"), "no guilt copy");
});
