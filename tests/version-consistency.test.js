import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const cargo = readFileSync(new URL("../src-tauri/Cargo.toml", import.meta.url), "utf8");
const tauri = JSON.parse(readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
const version = readFileSync(new URL("../VERSION", import.meta.url), "utf8").trim();
test("Version: package.json matches VERSION", () => {
  assert.equal(pkg.version, version);
});
test("Version: Cargo.toml matches VERSION", () => {
  assert.ok(cargo.includes(`version = "${version}"`));
});
test("Version: tauri.conf.json matches VERSION", () => {
  assert.equal(tauri.version, version);
});
