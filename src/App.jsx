import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";
import Exam from "./pages/Exam";
import Review from "./pages/Review";
import Settings from "./pages/Settings";
import ExamHistory from "./pages/ExamHistory";
import SessionReview from "./pages/SessionReview";
import Notes from "./pages/Notes";
import PracticalExam from "./pages/PracticalExam";
import Topics from "./pages/Topics";
import FloatingBottomNav from "./components/FloatingBottomNav";
import ExamConfirmationModal from "./components/ExamConfirmationModal";
import OrganicMeshBackground from "./components/OrganicMeshBackground";
import SplashSequence from "./components/SplashSequence";
import DirectionalRouteWrapper from "./components/DirectionalRouteWrapper";
import { useUpdater } from "./utils/useUpdater";
import UpdateModal from "./components/UpdateModal";
import { hasSeenTour, startTour } from "./utils/tourGuide";

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
    <div className="min-h-screen bg-dark-bg text-paper flex flex-col font-sans selection:bg-gold/30 selection:text-paper relative overflow-x-hidden">
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
          <div className="hidden lg:flex items-center gap-1">
            {headerLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(event) => guardNavigation(event, link.to)}
                  className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide transition-all duration-150 ${
                    isActive
                      ? "bg-gold/15 text-gold border border-gold/30 font-semibold"
                      : "text-paper-muted hover:text-paper hover:bg-dark-surface"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Candidate Badge */}
        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            onClick={(event) => guardNavigation(event, "/settings")}
            className="flex items-center gap-2 px-3 py-1 bg-dark-card hover:bg-dark-surface border border-dark-border rounded-full text-xs font-medium text-paper-muted hover:text-gold transition-colors duration-150"
            title="Edit local candidate profile"
          >
            <span className="w-2 h-2 rounded-full bg-sage shadow-sage-glow"></span>
            <span className="truncate max-w-[140px]">
              {profileName || "Candidate Profile"}
            </span>
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <main
        className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-32"
        style={{
          paddingTop: "1.5rem",
          paddingBottom: "calc(var(--safe-bottom) + 6.5rem)",
        }}
      >
        <DirectionalRouteWrapper>
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  profileName={profileName}
                  onOpenExamModal={() => setIsExamModalOpen(true)}
                />
              }
            />
            <Route
              path="/quiz"
              element={<Quiz onOpenExamModal={() => setIsExamModalOpen(true)} />}
            />
            <Route
              path="/exam"
              element={<Exam onProgressChange={reportExamProgress} />}
            />
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
