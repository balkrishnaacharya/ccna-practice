import test from "node:test";
import assert from "node:assert/strict";
import {
  TOUR_STEPS,
  TOUR_STORAGE_KEY,
  hasSeenTour,
  markTourSeen,
} from "../src/utils/tourGuide.js";

/**
 * Test Suite: CCNA 2.0 First-Time User Onboarding Tour
 */

test("Tour Steps Configuration: Exposes exactly 9 sequential steps with required copy", () => {
  assert.equal(TOUR_STEPS.length, 9, "Tour must have exactly 9 steps");

  // Step 1: Home Welcome
  const step1 = TOUR_STEPS[0];
  assert.equal(step1.element, '[data-tour="home-welcome"]');
  assert.equal(step1.popover.title, "Welcome to CCNA Practice");
  assert.ok(step1.popover.description.length > 0, "Step 1 must have a description");

  // Step 2: Dashboard Stats
  const step2 = TOUR_STEPS[1];
  assert.equal(step2.element, '[data-tour="dashboard-stats"]');
  assert.equal(step2.popover.title, "Your Progress at a Glance");
  assert.ok(step2.popover.description.length > 0, "Step 2 must have a description");

  // Step 3: Exam Blueprint
  const step3 = TOUR_STEPS[2];
  assert.equal(step3.element, '[data-tour="exam-blueprint"]');
  assert.equal(step3.popover.title, "Learn by Exam Domain");
  assert.ok(step3.popover.description.length > 0, "Step 3 must have a description");

  // Step 4: Bottom Navigation
  const step4 = TOUR_STEPS[3];
  assert.equal(step4.element, '[data-tour="bottom-navigation"]');
  assert.equal(step4.popover.title, "Everything in Reach");
  assert.ok(step4.popover.description.length > 0, "Step 4 must have a description");

  // Step 5: Practice Navigation
  const step5 = TOUR_STEPS[4];
  assert.equal(step5.element, '[data-tour="practice-navigation"]');
  assert.equal(step5.popover.title, "Practice Without the Pressure");
  assert.ok(step5.popover.description.length > 0, "Step 5 must have a description");

  // Step 6: Exam Button
  const step6 = TOUR_STEPS[5];
  assert.equal(step6.element, '[data-tour="exam-button"]');
  assert.equal(step6.popover.title, "Test Your Readiness");
  assert.ok(step6.popover.description.length > 0, "Step 6 must have a description");

  // Step 7: Review Navigation
  const step7 = TOUR_STEPS[6];
  assert.equal(step7.element, '[data-tour="review-navigation"]');
  assert.equal(step7.popover.title, "Review What Matters");
  assert.ok(step7.popover.description.length > 0, "Step 7 must have a description");

  // Step 8: History Navigation
  const step8 = TOUR_STEPS[7];
  assert.equal(step8.element, '[data-tour="history-navigation"]');
  assert.equal(step8.popover.title, "See How Far You've Come");
  assert.ok(step8.popover.description.length > 0, "Step 8 must have a description");

  // Step 9: Settings / Config Navigation
  const step9 = TOUR_STEPS[8];
  assert.equal(step9.element, '[data-tour="settings-navigation"]');
  assert.equal(step9.popover.title, "Your Learning Preferences");
  assert.ok(step9.popover.description.length > 0, "Step 9 must have a description");
});


test("Tour Storage Persistence: Uses 'ccna_has_seen_tour' key and handles lifecycle correctly", () => {
  assert.equal(TOUR_STORAGE_KEY, "ccna_has_seen_tour");

  // Mock localStorage for Node test runner
  const storageMap = new Map();
  const originalLocalStorage = globalThis.localStorage;

  globalThis.localStorage = {
    getItem: (k) => storageMap.get(k) ?? null,
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k),
    clear: () => storageMap.clear(),
  };

  try {
    // 1. First launch (clean state)
    localStorage.removeItem(TOUR_STORAGE_KEY);
    assert.equal(hasSeenTour(), false, "hasSeenTour must return false on first launch");

    // 2. Mark tour completed/dismissed
    markTourSeen();
    assert.equal(hasSeenTour(), true, "hasSeenTour must return true after markTourSeen()");
    assert.equal(localStorage.getItem(TOUR_STORAGE_KEY), "true");

    // 3. Subsequent launches remain seen
    assert.equal(hasSeenTour(), true, "Tour remains marked seen across sessions");
  } finally {
    globalThis.localStorage = originalLocalStorage;
  }
});

test("Tour Storage Resilience: Handles storage exceptions gracefully without crashing", () => {
  const originalLocalStorage = globalThis.localStorage;

  // Simulate restricted / security sandbox throwing on localStorage access
  globalThis.localStorage = {
    getItem: () => {
      throw new Error("SecurityError: Access is denied");
    },
    setItem: () => {
      throw new Error("SecurityError: Access is denied");
    },
  };

  try {
    // Should fail safely to true so user isn't stuck in an infinite tour loop
    assert.equal(hasSeenTour(), true, "Must fail safely if localStorage throws");
    assert.doesNotThrow(() => markTourSeen(), "markTourSeen must catch and log errors safely");
  } finally {
    globalThis.localStorage = originalLocalStorage;
  }
});

test("Tour Replay Flow: Replaying feature tour does not reset 'ccna_has_seen_tour' to false", () => {
  const storageMap = new Map();
  const originalLocalStorage = globalThis.localStorage;

  globalThis.localStorage = {
    getItem: (k) => storageMap.get(k) ?? null,
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k),
  };

  try {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    assert.equal(hasSeenTour(), true);

    // Simulate Replay Action from Settings
    // The replay triggers startTour({ isReplay: true }) and on finish calls markTourSeen()
    markTourSeen();

    assert.equal(hasSeenTour(), true, "ccna_has_seen_tour must remain 'true' after replay");
  } finally {
    globalThis.localStorage = originalLocalStorage;
  }
});
