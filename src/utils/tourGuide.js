import { driver } from "driver.js";
import gsap from "gsap";

export const TOUR_STORAGE_KEY = "ccna_has_seen_tour";

// Steps defined in display order.
// Selectors are verified against Dashboard.jsx and FloatingBottomNav.jsx.
export const TOUR_STEPS = [
  {
    element: '[data-tour="home-welcome"]',
    popover: {
      title: "Welcome to CCNA Practice",
      description:
        "Your workspace for building CCNA knowledge, practising network concepts, and tracking your progress.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="dashboard-stats"]',
    popover: {
      title: "Your Progress at a Glance",
      description:
        "See your question bank, answered questions, correct answers, and accuracy in one place.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tour="study-streak"]',
    popover: {
      title: "Daily Goals & Study Streak",
      description:
        "Track your daily question goals and build momentum. Answer questions daily to keep your learning streak alive.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tour="exam-blueprint"]',
    popover: {
      title: "Learn by Exam Domain",
      description:
        "Explore the CCNA blueprint domains and understand how the question bank is distributed across the syllabus.",
      side: "top",
      align: "center",
    },
  },
  {
    element: '[data-tour="weak-areas"]',
    popover: {
      title: "Targeted Weak-Spot Drills",
      description:
        "Zero in on low-accuracy topics and drill subtopics directly to turn vulnerabilities into strengths.",
      side: "left",
      align: "start",
    },
  },
  {
    element: '[data-tour="spaced-review"]',
    popover: {
      title: "SM-2 Spaced Repetition",
      description:
        "Review questions scheduled by the SuperMemo SM-2 algorithm right before you forget them for maximum retention.",
      side: "left",
      align: "start",
    },
  },
  {
    element: '[data-tour="bottom-navigation"]',
    popover: {
      title: "Everything in Reach",
      description:
        "Explore Dashboard, Practice, Exam, Review, History, and Settings from the bottom navigation.",
      side: "top",
      align: "center",
    },
  },
  {
    element: '[data-tour="practice-navigation"]',
    popover: {
      title: "Practice Without the Pressure",
      description:
        "Work through practice questions at your own pace and strengthen your understanding before taking a full exam.",
      side: "top",
      align: "center",
    },
  },
  {
    element: '[data-tour="exam-button"]',
    popover: {
      title: "Test Your Readiness",
      description:
        "Take a full 120-minute CCNA simulation and measure your readiness against the exam blueprint.",
      side: "top",
      align: "center",
    },
  },
  {
    element: '[data-tour="review-navigation"]',
    popover: {
      title: "Review What Matters",
      description:
        "Return to questions you flagged during practice or exams and revisit the concepts that need more attention.",
      side: "top",
      align: "center",
    },
  },
  {
    element: '[data-tour="history-navigation"]',
    popover: {
      title: "See How Far You've Come",
      description:
        "Revisit your learning and exam history to understand your progress over time.",
      side: "top",
      align: "center",
    },
  },
  {
    element: '[data-tour="settings-navigation"]',
    popover: {
      title: "Your Learning Preferences",
      description:
        "Explore the app\u2019s settings and replay this feature tour whenever you need a refresher.",
      side: "top",
      align: "center",
    },
  },
];

let activeDriver = null;

export function hasSeenTour() {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  } catch {
    // Fail safely on restricted environments (e.g. Tauri iOS sandboxing)
    return true;
  }
}

export function markTourSeen() {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  } catch (err) {
    console.error("Failed to save tour state to localStorage", err);
  }
}

/** Bounded polling for tour targets so we don't start before elements mount */
export function waitForTourTargets(maxWaitMs = 3000) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    function check() {
      const allExist = TOUR_STEPS.every((step) =>
        document.querySelector(step.element)
      );
      if (allExist) {
        resolve(true);
        return;
      }
      if (Date.now() - startTime > maxWaitMs) {
        resolve(false);
        return;
      }
      requestAnimationFrame(check);
    }

    check();
  });
}

/**
 * Inject a "Skip Tour" button into the popover footer on every step.
 * Guards against duplicates so it is safe to call on every onPopoverRender.
 */
function injectSkipButton(popover, destroyFn) {
  if (!popover?.footer) return;
  if (popover.footer.querySelector(".ccna-tour-skip-btn")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ccna-tour-skip-btn";
  btn.textContent = "Skip Tour";

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    destroyFn();
  });

  // Insert at the very start of the footer so it sits to the left
  popover.footer.insertBefore(btn, popover.footer.firstChild);
}

/**
 * Launch the feature tour.
 *
 * @param {object} opts
 * @param {boolean} [opts.isReplay=false]  When true skip has-seen check
 * @param {Function} [opts.onComplete]     Called when user completes the tour
 * @param {Function} [opts.onDismiss]      Called when tour is closed/skipped
 */
export async function startTour({ isReplay = false, onComplete, onDismiss } = {}) {
  // Concurrency guard — never create two instances simultaneously
  if (activeDriver) {
    return;
  }

  const targetsReady = await waitForTourTargets();
  if (!targetsReady) {
    console.warn("Tour: not all targets mounted, proceeding with available targets.");
  }

  try {
    // Shared teardown — called from every dismissal path
    function teardown(cb) {
      markTourSeen();
      if (activeDriver) {
        activeDriver.destroy();
        activeDriver = null;
      }
      cb?.();
    }

    const driverInstance = driver({
      // ---- Overlay --------------------------------------------------
      // overlayColor + overlayOpacity control ONLY the SVG path fill.
      // Do NOT set CSS background-color on .driver-overlay — it blocks the cutout.
      overlayColor: "#0A0A08",
      overlayOpacity: 0.42,

      // ---- Stage highlight -----------------------------------------
      stagePadding: 8,
      stageRadius: 16,

      // ---- Popover -------------------------------------------------
      popoverClass: "ccna-tour-popover",

      // ---- Buttons -------------------------------------------------
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next \u2192",
      prevBtnText: "\u2190 Back",
      doneBtnText: "Start Learning",
      showButtons: ["next", "previous", "close"],

      // ---- Behaviour -----------------------------------------------
      allowClose: true,
      overlayClickNext: false,
      disableActiveInteraction: false,

      steps: TOUR_STEPS,

      // ---- Explicit click handlers ----------------------------------
      // When these are provided, Driver.js defers to them entirely and
      // will NOT perform the default action — we must call the right
      // Driver.js method explicitly.

      onNextClick: (_element, _step, opts) => {
        opts.driver.moveNext();
      },

      onPrevClick: (_element, _step, opts) => {
        opts.driver.movePrevious();
      },

      onCloseClick: (_element, _step, _opts) => {
        // X button — user deliberately closes
        teardown(onDismiss);
      },

      onDoneClick: (_element, _step, _opts) => {
        // "Start Learning" on the final step
        teardown(onComplete);
      },

      // onDestroyStarted fires for every destroy trigger (backdrop click,
      // keyboard Esc, etc.) that was not already handled above.
      // We MUST call opts.driver.destroy() here; omitting it freezes the tour.
      onDestroyStarted: (_element, _step, opts) => {
        markTourSeen();
        activeDriver = null;
        opts.driver.destroy();
        onDismiss?.();
      },

      onDestroyed: () => {
        activeDriver = null;
      },

      // ---- Popover render (animation + Skip button) ----------------
      onPopoverRender: (popover, opts) => {
        if (!popover?.wrapper) return;

        // Inject Skip button on every step (duplicate guard is inside helper)
        injectSkipButton(popover, () => {
          markTourSeen();
          activeDriver = null;
          opts.driver.destroy();
          onDismiss?.();
        });

        // Respect prefers-reduced-motion
        if (
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          gsap.set(popover.wrapper, { opacity: 1, y: 0 });
          return;
        }

        // Subtle fade-up entrance — 240 ms, power2.out
        gsap.fromTo(
          popover.wrapper,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.24,
            ease: "power2.out",
            force3D: true,
            overwrite: "auto",
          }
        );
      },
    });

    activeDriver = driverInstance;
    driverInstance.drive();
  } catch (err) {
    console.error("Failed to run onboarding tour:", err);
    activeDriver = null;
  }
}
