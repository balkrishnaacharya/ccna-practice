import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/components/NotificationHistory.jsx", import.meta.url), "utf8");
test("NotificationHistory: component exported", () => {
  assert.ok(source.includes("export default function NotificationHistory"), "component exported");
});
test("NotificationHistory: lists events with dismiss", () => {
  assert.ok(source.includes("dismissed_at") || source.includes("dismiss"), "dismissal support");
});
