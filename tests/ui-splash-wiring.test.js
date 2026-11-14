import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("App: SplashSequence removed, SplashAnimation imported", () => {
  assert.ok(
    !app.includes("SplashSequence"),
    "SplashSequence no longer imported"
  );
  assert.ok(app.includes("SplashAnimation"), "SplashAnimation imported");
});

test("App: SplashAnimation onComplete wired", () => {
  assert.ok(
    app.includes("SplashAnimation") && app.includes("onComplete"),
    "onComplete wired"
  );
});
