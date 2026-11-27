import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("Exam: isLastQuestion is defined before use", () => {
  const src = read("../src/pages/Exam.jsx");
  assert.ok(
    src.includes("const isLastQuestion = currentIndex >= questions.length - 1;"),
    "last-question flag is computed",
  );
});

test("Scenario generator: every validation rule references a defined checker", () => {
  const src = read("../src/utils/scenarioGenerator.js");
  const functions = [...src.matchAll(/function (\w+Scenario)\(\)/g)].map((m) => m[1]);
  for (const name of functions) {
    const start = src.indexOf(`function ${name}()`);
    const end = src.indexOf("\nfunction ", start + 1);
    const body = src.slice(start, end === -1 ? src.length : end);
    if (body.includes(", check)]")) {
      assert.ok(
        body.includes("const check ="),
        `${name} uses a check without defining it`,
      );
    }
  }
  assert.ok(!src.includes("e.dstPort === rand("), "ACL checker does not re-randomize");
});

test("ESLint: flat config gates no-undef and React hooks", () => {
  const cfg = read("../eslint.config.js");
  assert.ok(cfg.includes('"no-undef": "error"'), "undefined variables are errors");
  assert.ok(cfg.includes("reactHooks.configs.recommended.rules"), "hooks rules enabled");
  assert.ok(cfg.includes("react/jsx-uses-vars"), "JSX imports count as used");
  const pkg = JSON.parse(read("../package.json"));
  assert.ok(pkg.scripts.lint, "lint script exists");
  assert.ok(pkg.devDependencies.eslint, "eslint is a dev dependency");
});

test("CI: lint workflow runs on pushes and pull requests", () => {
  const wf = read("../.github/workflows/lint.yml");
  assert.ok(wf.includes("pull_request:"), "PRs are gated");
  assert.ok(wf.includes("npm run lint"), "lint runs in CI");
});

test("CI: updater manifest is produced by tauri-action, not a redundant step", () => {
  const wf = read("../.github/workflows/build.yml");
  assert.ok(wf.includes("uploadUpdaterJson: true"), "tauri-action uploads latest.json");
  assert.ok(!wf.includes("Generate updater manifest"), "manual manifest step removed");
  assert.ok(!wf.includes("includeUpdaterJson"), "unsupported input removed");
  assert.ok(!wf.includes('-c\'{"bundle"'), "broken inline config override removed");
  assert.ok(!/CCNA\.Practice_0\.\d+\.\d+/.test(wf), "no hardcoded version in release URLs");
});

test("Rust commands are split into cohesive modules with a facade", () => {
  assert.ok(!existsSync(new URL("../src-tauri/src/commands.rs", import.meta.url)), "monolith removed");
  const facade = read("../src-tauri/src/commands/mod.rs");
  for (const m of ["exam", "library", "practice", "stats"]) {
    assert.ok(facade.includes(`pub use ${m}::*;`), `${m} re-exported`);
  }
  for (const f of ["exam.rs", "library.rs", "practice.rs", "stats.rs"]) {
    assert.ok(existsSync(new URL(`../src-tauri/src/commands/${f}`, import.meta.url)), `${f} exists`);
  }
});
