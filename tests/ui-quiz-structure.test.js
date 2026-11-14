import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../src/pages/Quiz.jsx", import.meta.url),
  "utf8"
);

const lines = source.split("\n");

test("Quiz.jsx: no module-level useState hooks (all hooks inside component)", () => {
  const moduleLevelHooks = lines.filter(
    (line, i) =>
      /^\s*const \[.*\] = useState\(/.test(line) && line.match(/^\S/) // col 0
  );
  assert.equal(
    moduleLevelHooks.length,
    0,
    `Found module-level useState hooks: ${moduleLevelHooks.join(", ")}`
  );
});

test("Quiz.jsx: no module-level useRef hooks", () => {
  const moduleLevelRefs = lines.filter(
    (line) =>
      /^\s*const .* = useRef\(/.test(line) && line.match(/^\S/) // col 0
  );
  assert.equal(
    moduleLevelRefs.length,
    0,
    `Found module-level useRef hooks: ${moduleLevelRefs.join(", ")}`
  );
});

test("Quiz.jsx: no module-level useNavigate calls", () => {
  const moduleLevelNav = lines.filter(
    (line) =>
      /^\s*const navigate = useNavigate\(\)/.test(line) && line.match(/^\S/) // col 0
  );
  assert.equal(
    moduleLevelNav.length,
    0,
    `Found module-level useNavigate: ${moduleLevelNav.join(", ")}`
  );
});

test("Quiz.jsx: no TypeScript generics in useState (.jsx doesn't support them)", () => {
  const tsGeneric = lines.filter((line) => /useState</.test(line));
  assert.equal(
    tsGeneric.length,
    0,
    `Found TypeScript generic in useState: ${tsGeneric.join(", ")}`
  );
});

test("Quiz.jsx: no CSS typo text-paper-text", () => {
  assert.ok(
    !source.includes("text-paper-text"),
    "text-paper-text is not a valid Tailwind class"
  );
});
