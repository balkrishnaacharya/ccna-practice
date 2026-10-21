import test from "node:test";
import assert from "node:assert/strict";
import { isVersionGreater } from "../src/utils/useUpdater.js";
import { ROUTE_ORDER, getRouteRank } from "../src/utils/navigationRoutes.js";

test("Version comparison logic (isVersionGreater)", async (t) => {
  await t.test("detects higher patch version", () => {
    assert.equal(isVersionGreater("0.2.1", "0.2.0"), true);
  });

  await t.test("detects higher minor version", () => {
    assert.equal(isVersionGreater("0.3.0", "0.2.0"), true);
  });

  await t.test("detects higher major version", () => {
    assert.equal(isVersionGreater("1.0.0", "0.2.0"), true);
  });

  await t.test("returns false for equal version", () => {
    assert.equal(isVersionGreater("0.2.0", "0.2.0"), false);
  });

  await t.test("returns false for lower patch version", () => {
    assert.equal(isVersionGreater("0.1.9", "0.2.0"), false);
  });

  await t.test("handles different segment lengths gracefully", () => {
    assert.equal(isVersionGreater("0.2.0.1", "0.2.0"), true);
    assert.equal(isVersionGreater("0.2", "0.2.0"), false);
  });
});

test("Route hierarchy and directional ranking", async (t) => {
  await t.test("assigns expected ranks to canonical routes", () => {
    assert.equal(getRouteRank("/"), 0);
    assert.equal(getRouteRank("/quiz"), 1);
    assert.equal(getRouteRank("/practical-exam"), 2);
    assert.equal(getRouteRank("/notes"), 3);
    assert.equal(getRouteRank("/review"), 4);
    assert.equal(getRouteRank("/history"), 5);
    assert.equal(getRouteRank("/settings"), 6);
    assert.equal(getRouteRank("/exam"), 7);
  });

  await t.test("handles nested session review routes (/history/:sessionId)", () => {
    assert.equal(getRouteRank("/history/42"), 5.5);
    assert.equal(getRouteRank("/history/exam-session-abc"), 5.5);
  });

  await t.test("falls back to rank 3 for unspecified routes", () => {
    assert.equal(getRouteRank("/unknown-page"), 3);
  });

  await t.test("accurately determines forward vs backward navigation", () => {
    function computeDirection(fromPath, toPath) {
      const fromRank = getRouteRank(fromPath);
      const toRank = getRouteRank(toPath);
      return toRank >= fromRank ? "forward" : "backward";
    }

    // Moving forward from Dashboard to Quiz
    assert.equal(computeDirection("/", "/quiz"), "forward");
    // Moving forward from Quiz to Exam
    assert.equal(computeDirection("/quiz", "/exam"), "forward");
    // Moving backward from Settings to Dashboard
    assert.equal(computeDirection("/settings", "/"), "backward");
    // Moving backward from Exam to Quiz
    assert.equal(computeDirection("/exam", "/quiz"), "backward");
    // Moving forward from History to Session Review
    assert.equal(computeDirection("/history", "/history/12"), "forward");
  });
});

test("Android signed release asset verification", async (t) => {
  await t.test("rejects unsigned APKs and accepts signed APK", () => {
    const mockAssets = [
      { name: "app-universal-release-unsigned.apk", browser_download_url: "https://example.com/unsigned.apk" },
      { name: "ccna-practice-v0.2.0-android-aarch64.apk", browser_download_url: "https://example.com/signed.apk" },
      { name: "ccna-practice_0.2.0_amd64.deb", browser_download_url: "https://example.com/deb" }
    ];

    const signedApk = mockAssets.find(
      (a) => a.name.endsWith(".apk") && !a.name.includes("unsigned")
    );

    assert.ok(signedApk, "Must find a signed APK");
    assert.equal(signedApk.name, "ccna-practice-v0.2.0-android-aarch64.apk");
    assert.equal(signedApk.browser_download_url, "https://example.com/signed.apk");
  });
});
