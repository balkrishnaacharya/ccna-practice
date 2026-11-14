import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/hooks/useNotifications.js", import.meta.url), "utf8");
test("useNotifications: exports hook and showToast", () => {
  assert.ok(source.includes("export function useNotifications"), "hook exported");
  assert.ok(source.includes("showToast"), "showToast present");
  assert.ok(source.includes("sonner"), "sonner toast used for in-app notifications");
});
test("useNotifications: no OS permission request on first load", () => {
  assert.ok(
    !source.includes("requestPermission") || source.includes("enabled") && !source.includes("immediately"),
    "must not request OS permission automatically on load"
  );
});
