import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const splash = readFileSync(new URL("../src/components/SplashAnimation.jsx", import.meta.url), "utf8");

test("Splash regression: SplashAnimation wrapped in ErrorBoundary", () => {
  const splashIdx = app.indexOf("<SplashAnimation");
  assert.ok(splashIdx !== -1, "SplashAnimation must be used in App");
  const ebOpen = app.lastIndexOf("<ErrorBoundary", splashIdx);
  const ebClose = app.indexOf("</ErrorBoundary>", splashIdx);
  assert.ok(ebOpen !== -1, "ErrorBoundary must open before SplashAnimation");
  assert.ok(ebClose !== -1, "ErrorBoundary must close after SplashAnimation");
  assert.ok(ebOpen < splashIdx, "ErrorBoundary must open before SplashAnimation");
  assert.ok(ebClose > splashIdx, "ErrorBoundary must close after SplashAnimation");
});

test("Splash regression: ErrorBoundary has onError handler", () => {
  assert.ok(app.includes('onError={() => setIsSplashActive(false)}'), "ErrorBoundary must dismiss splash on error");
});

test("Splash regression: respects reduced motion", () => {
  assert.ok(splash.includes("prefers-reduced-motion"), "Splash must respect reduced motion");
});

test("Splash regression: skip on interaction", () => {
  assert.ok(splash.includes("pointerdown"), "Splash must skip on pointerdown");
  assert.ok(splash.includes("Enter") && splash.includes("Escape"), "Splash must skip on Enter/Escape");
});

test("Splash regression: sessionStorage gating", () => {
  assert.ok(splash.includes("ccna_splash_seen"), "Splash must gate on ccna_splash_seen");
});

test("Splash regression: safety timeout", () => {
  assert.ok(splash.includes("setTimeout"), "Splash must have safety timeout to prevent permanent block");
});
