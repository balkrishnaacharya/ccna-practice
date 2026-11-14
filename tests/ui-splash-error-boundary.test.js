import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
test("App: SplashAnimation is wrapped in an error boundary", () => {
  // SplashAnimation must be inside an ErrorBoundary element in the JSX.
  const splashIdx = app.indexOf("<SplashAnimation");
  assert.ok(splashIdx !== -1, "SplashAnimation must be used in App");
  const ebOpen = app.lastIndexOf("<ErrorBoundary", splashIdx);
  const ebClose = app.indexOf("</ErrorBoundary>", splashIdx);
  assert.ok(ebOpen !== -1, "ErrorBoundary must open before SplashAnimation");
  assert.ok(ebClose !== -1, "ErrorBoundary must close after SplashAnimation");
  assert.ok(ebOpen < splashIdx, "ErrorBoundary must open before SplashAnimation");
  assert.ok(ebClose > splashIdx, "ErrorBoundary must close after SplashAnimation");
});
