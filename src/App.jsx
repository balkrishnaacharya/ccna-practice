import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import Dashboard from "./pages/Dashboard";
const Quiz = lazy(() => import("./pages/Quiz"));
const Exam = lazy(() => import("./pages/Exam"));
const Review = lazy(() => import("./pages/Review"));
const Settings = lazy(() => import("./pages/Settings"));
const ExamHistory = lazy(() => import("./pages/ExamHistory"));
const SessionReview = lazy(() => import("./pages/SessionReview"));
const Notes = lazy(() => import("./pages/Notes"));
const PracticalExam = lazy(() => import("./pages/PracticalExam"));
const Topics = lazy(() => import("./pages/Topics"));
import FloatingBottomNav from "./components/FloatingBottomNav";
import ExamConfirmationModal from "./components/ExamConfirmationModal";
import OrganicMeshBackground from "./components/OrganicMeshBackground";
import SplashSequence from "./components/SplashSequence";
import DirectionalRouteWrapper from "./components/DirectionalRouteWrapper";
import { useUpdater } from "./utils/useUpdater";
import UpdateModal from "./components/UpdateModal";
import { hasSeenTour, startTour } from "./utils/tourGuide";
import ErrorBoundary from "./components/ErrorBoundary";
import RouteLoader from "./components/RouteLoader";

export default function App() {
  const [profileName, setProfileName] = useState("");
  const [examProgress, setExamProgress] = useState({ active: false, unanswered: 0 });
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isSplashActive, setIsSplashActive] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("ccna_splash_seen");
  });

  const location = useLocation();
  const navigate = useNavigate();

  const handleSplashComplete = useCallback(() => {
    setIsSplashActive(false);
  }, []);

  // Automatic first-launch onboarding tour trigger
  useEffect(() => {
    if (!isSplashActive && !hasSeenTour() && location.pathname === "/") {
      startTour();
    }
  }, [isSplashActive, location.pathname]);

  const updater = useUpdater({
    autoCheck: true,
    isExamActive: examProgress.active,
  });

  const reportExamProgress = useCallback((active, unanswered) => {
    setExamProgress({ active, unanswered });
  }, []);

  function guardNavigation(event, destination) {
    if (location.pathname === "/exam" && examProgress.active && destination !== "/exam") {
      event.preventDefault();
      setPendingNavigation(destination);
    }
  }

  function leaveExam() {
    const destination = pendingNavigation || "/";
    setPendingNavigation(null);
    setExamProgress({ active: false, unanswered: 0 });
    navigate(destination);
  }

  function cancelLeaveExam() {
    setPendingNavigation(null);
    if (location.pathname === "/exam" && examProgress.active) {
      window.history.pushState({ inExam: true }, "", window.location.href);
    }
  }

  function handleStartExamConfirmed() {
    setIsExamModalOpen(false);
    navigate("/exam", { state: { started: true } });
  }

  // Intercept Android hardware back button and browser popstate during active exam
  useEffect(() => {
    if (location.pathname === "/exam" && examProgress.active) {
      window.history.pushState({ inExam: true }, "", window.location.href);

      const handlePopState = () => {
        setPendingNavigation("/");
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [location.pathname, examProgress.active]);

  useEffect(() => {
    invoke("get_setting", { key: "profile_name" })
      .then((val) => {
        if (val) setProfileName(val);
      })
      .catch(console.error);
  }, []);

  const headerLinks = [
    { to: "/", label: "Dashboard" },
    { to: "/quiz", label: "Practice" },
    { to: "/practical-exam", label: "Labs" },
    { to: "/notes", label: "Notes" },
    { to: "/history", label: "History" },
    { to: "/review", label: "Review" },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-ink flex flex-col font-sans selection:bg-accent/30 selection:text-ink relative overflow-x-hidden">
      {/* Background Organic Mesh Blobs */}
      <OrganicMeshBackground />

      {/* Opening Splash Sequence (Polpharma-inspired) */}
      <SplashSequence onComplete={handleSplashComplete} />

      {/* Top Editorial Nav Bar */}
      <nav
        className="bg-dark-surface/90 backdrop-blur-md border-b border-dark-border px-4 sm:px-6 flex items-end justify-between sticky top-0 z-40 box-content"
        style={{
          paddingTop: "var(--safe-top)",
          height: "3.5rem",
          minHeight: "calc(3.5rem + var(--safe-top))",
        }}
      >
        <div className="flex items-center gap-6">
          <Link
            to="/"
            onClick={(event) => guardNavigation(event, "/")}
            className="font-semibold text-base text-gold tracking-tight flex items-center gap-2 group"
          >
            <span className="w-7 h-7 rounded-full bg-gold text-dark-bg flex items-center justify-center text-xs font-bold shadow-gold-glow transition-transform group-hover:scale-105">
              2.0
            </span>
            <span className="font-serif text-base tracking-wide text-paper">
              CCNA <span className="italic text-gold font-normal">Practice</span>
            </span>
          </Link>

          {/* Desktop Navigation Links (subtle pill design) */}
          <div className="hidden md:flex items-center gap-1">
            {headerLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(event) => guardNavigation(event, link.to)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-gold/10 text-gold"
                      : "text-paper-muted hover:text-paper hover:bg-dark-surface"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 pb-2">
          <Link
            to="/settings"
            onClick={(event) => guardNavigation(event, "/settings")}
            className="px-3 py-1.5 rounded-full text-sm text-paper-muted hover:text-paper hover:bg-dark-surface transition-all duration-150 hidden sm:block"
          >
            Settings
          </Link>
          {profileName && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-surface/60 border border-dark-border text-xs text-paper-dim">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              {profileName}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full relative z-10">
        <DirectionalRouteWrapper>
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/exam" element={<Exam reportExamProgress={reportExamProgress} />} />
                <Route path="/practical-exam" element={<PracticalExam />} />
                <Route path="/topics" element={<Topics />} />
                <Route path="/history" element={<ExamHistory />} />
                <Route path="/history/:sessionId" element={<SessionReview />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/review" element={<Review />} />
                <Route
                  path="/settings"
                  element={
                    <Settings
                      onProfileChange={setProfileName}
                      updater={updater}
                    />
                  }
                />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </DirectionalRouteWrapper>
      </main>

      {/* Floating Bottom Navigation Pill Dock (Universal across all screens) */}
      <FloatingBottomNav
        onOpenExamModal={() => setIsExamModalOpen(true)}
        guardNavigation={guardNavigation}
      />

      {/* GSAP-Animated Exam Confirmation Modal */}
      <ExamConfirmationModal
        isOpen={isExamModalOpen}
        onCancel={() => setIsExamModalOpen(false)}
        onConfirm={handleStartExamConfirmed}
      />

      {/* Application Update Modal */}
      <UpdateModal
        isOpen={updater.showModal}
        updateInfo={updater.updateInfo}
        status={updater.status}
        downloadProgress={updater.downloadProgress}
        onClose={() => updater.setShowModal(false)}
        onApply={updater.applyUpdate}
      />

      {/* Leave Exam Modal Guard */}
      {pendingNavigation && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-dark-bg/80 backdrop-blur-md p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-exam-title"
            className="w-full max-w-md space-y-4 rounded-2xl border border-dark-border bg-dark-card p-6 sm:p-7 shadow-dock text-paper"
          >
            <h2 id="leave-exam-title" className="font-serif text-xl font-semibold text-paper">
              Leave this exam?
            </h2>
            <p className="text-sm leading-relaxed text-paper-muted font-sans">
              You have {examProgress.unanswered} unanswered question
              {examProgress.unanswered === 1 ? "" : "s"}. Are you sure you want to exit? Your timer will stop and progress will be lost.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={cancelLeaveExam}
                className="rounded-full border border-dark-border px-5 py-2 text-xs font-medium text-paper-muted hover:text-paper hover:bg-dark-surface transition-colors"
              >
                Stay in exam
              </button>
              <button
                type="button"
                onClick={leaveExam}
                className="rounded-full bg-heart hover:bg-heart-hover px-5 py-2 text-xs font-semibold text-paper shadow-heart-glow transition-colors"
              >
                Leave exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
