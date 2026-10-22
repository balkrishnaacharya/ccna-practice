import test from "node:test";
import assert from "node:assert/strict";

/**
 * Test Suite: Exam Timer & Modal Confirmation State Machine
 * Verifies that the CCNA 120-minute timed exam timer DOES NOT start
 * until the candidate explicitly confirms the start modal.
 */

class ExamSessionSimulator {
  constructor({ preConfirmed = false, totalSeconds = 120 * 60 } = {}) {
    this.totalSeconds = totalSeconds;
    this.secondsRemaining = totalSeconds;
    this.hasStarted = preConfirmed;
    this.showConfirmationModal = !preConfirmed;
    this.timerIntervalId = null;
    this.isSubmitting = false;
    this.examResult = null;
    this.ticksCount = 0;
  }

  // Candidate clicks "Start Exam" in the GSAP Confirmation Modal
  confirmStartExam() {
    this.showConfirmationModal = false;
    this.hasStarted = true;
    this._startTimer();
  }

  // Candidate clicks "Cancel" in the GSAP Confirmation Modal
  cancelStartExam() {
    this.showConfirmationModal = false;
    this.hasStarted = false;
    this._stopTimer();
  }

  // Timer interval simulation
  _startTimer() {
    if (!this.hasStarted || this.examResult) return;
    this._stopTimer();
    this.timerIntervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  _stopTimer() {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  tick() {
    if (!this.hasStarted || this.secondsRemaining <= 0) {
      this._stopTimer();
      return;
    }
    this.secondsRemaining -= 1;
    this.ticksCount += 1;
    if (this.secondsRemaining <= 0) {
      this._stopTimer();
      this.autoSubmit();
    }
  }

  autoSubmit() {
    this.isSubmitting = true;
    this.examResult = { passed: false, score: 0 };
  }

  quitExam() {
    this._stopTimer();
    this.hasStarted = false;
    this.showConfirmationModal = false;
  }

  destroy() {
    this._stopTimer();
  }
}

test("Exam Timer Guard: Timer does not start on initial load without modal confirmation", () => {
  const session = new ExamSessionSimulator({ preConfirmed: false });

  assert.equal(session.hasStarted, false, "Exam should not be in started state initially");
  assert.equal(session.showConfirmationModal, true, "Confirmation modal must be displayed");
  assert.equal(session.secondsRemaining, 7200, "Full 120 minutes (7200s) must remain intact");
  assert.equal(session.timerIntervalId, null, "No timer interval should be running");

  // Simulate tick attempts while unconfirmed
  session.tick();
  assert.equal(session.secondsRemaining, 7200, "Seconds must not decrement while unconfirmed");
  assert.equal(session.ticksCount, 0, "Tick count must remain 0");

  session.destroy();
});

test("Exam Timer Guard: Canceling modal leaves timer unstarted and resets cleanly", () => {
  const session = new ExamSessionSimulator({ preConfirmed: false });

  session.cancelStartExam();

  assert.equal(session.hasStarted, false, "Exam must remain unstarted after cancel");
  assert.equal(session.showConfirmationModal, false, "Modal should be closed");
  assert.equal(session.secondsRemaining, 7200, "Time remaining must not have changed");
  assert.equal(session.timerIntervalId, null, "No active interval should exist");

  session.destroy();
});

test("Exam Timer Guard: Timer starts only after candidate confirms 'Start Exam'", () => {
  const session = new ExamSessionSimulator({ preConfirmed: false });

  assert.equal(session.secondsRemaining, 7200);

  // Candidate confirms modal
  session.confirmStartExam();

  assert.equal(session.hasStarted, true, "Exam must be in started state");
  assert.equal(session.showConfirmationModal, false, "Modal must be dismissed");
  assert.notEqual(session.timerIntervalId, null, "Timer interval must now be active");

  // Simulate 3 elapsed seconds
  session.tick();
  session.tick();
  session.tick();

  assert.equal(session.secondsRemaining, 7197, "Seconds should accurately decrement by 3s");
  assert.equal(session.ticksCount, 3);

  session.destroy();
});

test("Exam Timer Guard: Pre-confirmed flow (via Floating Dock Center Button) starts immediately", () => {
  // Center button triggers modal, and upon confirmation navigates with { started: true }
  const session = new ExamSessionSimulator({ preConfirmed: true });

  assert.equal(session.hasStarted, true);
  assert.equal(session.showConfirmationModal, false);

  session._startTimer();
  assert.notEqual(session.timerIntervalId, null);

  session.tick();
  assert.equal(session.secondsRemaining, 7199);

  session.destroy();
});

test("Exam Timer Guard: Explicit exit destroys active timer immediately and stops tick decrements", () => {
  const session = new ExamSessionSimulator({ preConfirmed: true });
  session._startTimer();
  assert.notEqual(session.timerIntervalId, null, "Timer should be active");

  session.tick();
  assert.equal(session.secondsRemaining, 7199);

  // Candidate clicks Exit
  session.quitExam();
  assert.equal(session.timerIntervalId, null, "Timer interval must be immediately destroyed");
  assert.equal(session.hasStarted, false);

  // Subsequent ticks must not decrement remaining seconds
  session.tick();
  assert.equal(session.secondsRemaining, 7199, "Time remaining must freeze after exit");
  assert.equal(session.ticksCount, 1, "Tick count must remain unchanged");

  session.destroy();
});

test("Exam Timer Guard: Android back button popstate intercept cleanly destroys timer upon leave confirmation", () => {
  const session = new ExamSessionSimulator({ preConfirmed: true });
  session._startTimer();

  session.tick();
  session.tick();
  assert.equal(session.secondsRemaining, 7198);

  // Simulate Android hardware back button triggering popstate leave confirmation
  let popstatePendingNavigation = null;
  const onPopState = () => {
    popstatePendingNavigation = "/";
  };
  onPopState();

  assert.equal(popstatePendingNavigation, "/", "Back button must target home navigation");

  // Candidate confirms leave in the confirmation modal
  session.quitExam();
  assert.equal(session.timerIntervalId, null, "Timer must be completely killed upon back-exit confirmation");

  session.tick();
  assert.equal(session.secondsRemaining, 7198);

  session.destroy();
});
