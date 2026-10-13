import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";
import Exam from "./pages/Exam";
import Review from "./pages/Review";
import Settings from "./pages/Settings";
import ExamHistory from "./pages/ExamHistory";
import SessionReview from "./pages/SessionReview";

export default function App() {
  const [profileName, setProfileName] = useState("");
  const location = useLocation();

  useEffect(() => {
    invoke("get_setting", { key: "profile_name" })
      .then((val) => {
        if (val) setProfileName(val);
      })
      .catch(console.error);
  }, []);

  const navLinks = [
    {
      to: "/",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: "/quiz",
      label: "Practice",
      fullLabel: "Practice Quiz",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      to: "/exam",
      label: "Exam",
      fullLabel: "Full Exam (120m)",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      to: "/history",
      label: "History",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      to: "/review",
      label: "Review",
      fullLabel: "Review Queue",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      ),
    },
    {
      to: "/settings",
      label: "Settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-[#0d0d0d] flex flex-col font-sans">
      {/* Top Nav Bar (h-14 with px-4) */}
      <nav
        className="bg-white border-b border-[#e5e5e5] px-4 h-14 flex items-center justify-between sticky top-0 z-40 box-content"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="font-semibold text-base text-[#4d6bfe] tracking-tight flex items-center gap-2"
          >
            <span className="w-7 h-7 rounded-full bg-[#4d6bfe] text-white flex items-center justify-center text-xs font-bold">
              2.0
            </span>
            <span className="text-sm font-semibold tracking-wide text-[#0d0d0d]">
              CCNA Practice
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden sm:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-colors duration-150 ${
                    isActive
                      ? "bg-[#e8ecff] text-[#1a2a8a]"
                      : "text-[#5a5a5a] hover:text-[#0d0d0d] hover:bg-[#f7f7f9]"
                  }`}
                >
                  {link.fullLabel || link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Local Candidate Display Name Badge (desktop and tablet) */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            to="/settings"
            className="flex items-center gap-2 px-3 py-1 bg-[#f7f7f9] hover:bg-[#e8ecff] border border-[#e5e5e5] rounded-full text-xs font-medium text-[#5a5a5a] hover:text-[#1a2a8a] transition-colors duration-150"
            title="Edit local candidate profile"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="truncate max-w-[140px]">
              {profileName || "Candidate Profile"}
            </span>
          </Link>
        </div>

        {/* Mobile top-right compact badge */}
        <div className="sm:hidden flex items-center">
          <Link
            to="/settings"
            className="w-8 h-8 rounded-full bg-[#e8ecff] text-[#1a2a8a] flex items-center justify-center text-xs font-semibold"
            title={profileName || "Candidate Profile"}
          >
            {profileName ? profileName.slice(0, 1).toUpperCase() : "C"}
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <main
        className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-8"
        style={{ paddingBottom: "calc(var(--safe-bottom) + 5rem)" }}
      >
        <Routes>
          <Route path="/" element={<Dashboard profileName={profileName} />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/history" element={<ExamHistory />} />
          <Route path="/history/:sessionId" element={<SessionReview />} />
          <Route path="/review" element={<Review />} />
          <Route
            path="/settings"
            element={<Settings onProfileChange={setProfileName} />}
          />
        </Routes>
      </main>

      {/* Mobile Bottom Tab Bar (fixed bottom-0 inset-x-0 h-16 bg-white border-t) */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-[#e5e5e5] flex items-center justify-around z-50 px-2"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        {navLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors duration-150 ${
                isActive
                  ? "text-[#4d6bfe] font-semibold"
                  : "text-[#5a5a5a] hover:text-[#0d0d0d]"
              }`}
            >
              <div
                className={`p-1 rounded-full transition-colors ${
                  isActive ? "bg-[#e8ecff]" : ""
                }`}
              >
                {link.icon}
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <footer className="hidden sm:block border-t border-[#e5e5e5] bg-white py-4 text-center text-xs text-[#5a5a5a]">
        CCNA 2.0 Local-First Practice App • Cross-Platform (Desktop + Android)
      </footer>
    </div>
  );
}
