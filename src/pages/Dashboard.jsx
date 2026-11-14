import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link, useNavigate } from "react-router-dom";
import StreakPanel from "../components/StreakPanel";
import ReadinessScore from "../components/analytics/ReadinessScore";
import WeaknessHeatmap from "../components/analytics/WeaknessHeatmap";
import { useReadiness } from "@/hooks/useReadiness";

export default function Dashboard({ profileName, onOpenExamModal }) {
  const [stats, setStats] = useState(null);
  const [subtopics, setSubtopics] = useState([]);
  const [flagCount, setFlagCount] = useState(0);
  const [reviewDue, setReviewDue] = useState(0);
  const [flashcardDue, setFlashcardDue] = useState(0);
  const [statsError, setStatsError] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { score: readinessScore, loading: readinessLoading } = useReadiness();

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const data = await invoke("get_stats", { signal: controller.signal });
        if (mounted) {
          setStats(data);
          setStatsLoading(false);
        }
      } catch (err) {
        if (mounted && err.name !== "AbortError") {
          console.error("get_stats failed:", err);
          setStatsError(String(err));
          setStatsLoading(false);
        }
      } finally {
        if (mounted) clearTimeout(timeout);
      }
    };

    loadStats();

    invoke("get_subtopic_stats")
      .then((rows) => setSubtopics(rows || []))
      .catch(console.error);
    invoke("get_flags")
      .then((flags) => setFlagCount(flags ? flags.length : 0))
      .catch(console.error);
    invoke("get_review_due_count")
      .then((n) => setReviewDue(n || 0))
      .catch(console.error);
    invoke("get_flashcard_due_count", { today: new Date().toISOString().split("T")[0] })
      .then((n) => setFlashcardDue(Number(n) || 0))
      .catch(console.error);

    return () => {
      mounted = false;
    };
  }, []);

  if (statsLoading && !statsError) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent"></div>
        <p className="text-paper-muted text-sm font-sans">
          Loading candidate analytics…
        </p>
      </div>
    );
  }

  if (!stats && statsError) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-block animate-pulse rounded-full h-8 w-8 border-2 border-heart/40"></div>
        <p className="text-sm text-heart-light font-sans">
          Unable to load analytics — {statsError}
        </p>
        <button
          type="button"
          onClick={() => {
            setStatsError(null);
            setStatsLoading(true);
            invoke("get_stats").then(setStats).catch((e) => setStatsError(String(e))).finally(() => setStatsLoading(false));
          }}
          className="px-5 py-2.5 bg-heart/10 hover:bg-heart/20 border border-heart/30 text-heart-light text-xs font-medium rounded-full transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const domainLabels = {
    network_infra: "Network Infrastructure (25%)",
    switching: "Switching & Access (25%)",
    ip_routing: "IP Routing (20%)",
    services_security: "Services & Security (20%)",
    ai_ops: "AI & NetOps (10%)",
  };

  // Weakest subtopics first; untried subtopics carry no signal yet.
  const weakAreas = subtopics
    .filter((s) => s.attempts > 0)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, 5);

  return (
    <div ref={containerRef} className="space-y-8 pb-12">
      {/* Greeting Banner */}
      <div
        data-tour="home-welcome"
        className="rounded-2xl p-6 sm:p-8 bg-dark-panel border border-dark-border shadow-dock relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span>
              CCNA 2.0 Editorial Platform
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-paper tracking-tight font-normal leading-tight">
              {profileName ? (
                <>
                  Welcome back, <span className="italic text-gold">{profileName}</span>
                </>
              ) : (
                <>
                  Ready for the <span className="italic text-gold">CCNA 2.0</span> Blueprint?
                </>
              )}
            </h1>
            <p className="text-paper-muted text-sm leading-relaxed font-sans">
              Curated master question bank structured strictly to Cisco CCNA 2.0 domains.
              Track your competency across all weighted pillars.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenExamModal || (() => navigate("/exam"))}
              className="px-6 py-3 bg-gold hover:bg-gold-hover text-dark-bg font-semibold text-xs rounded-full shadow-gold-glow transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Start Full Exam
            </button>
            <Link
              to="/quiz"
              className="px-5 py-3 bg-dark-surface hover:bg-dark-elevated text-paper-muted hover:text-paper text-xs font-medium rounded-full border border-dark-border transition-colors duration-150"
            >
              Practice Quiz
            </Link>
            <Link
              to="/topics"
              className="px-5 py-3 bg-dark-surface hover:bg-dark-elevated text-paper-muted hover:text-paper text-xs font-medium rounded-full border border-dark-border transition-colors duration-150"
            >
              Drill a Topic
            </Link>
            <Link
              to="/notes"
              className="px-5 py-3 bg-dark-surface hover:bg-dark-elevated text-paper-muted hover:text-paper text-xs font-medium rounded-full border border-dark-border transition-colors duration-150"
            >
              Subnetting & Notes
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards - Responsive: 1 col on mobile (375px), 2 col on sm, 4 col on desktop (1024px+) */}
      <div data-tour="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Question Bank"
          value={stats.total}
          subtitle={`${Math.min(100, Math.round((stats.total / 2000) * 100))}% of 2,000 goal`}
          icon="📚"
          variant="soft"
        />
        <StatCard
          label="Answered"
          value={stats.answered}
          subtitle="lifetime questions"
          icon="✍️"
          variant="panel"
        />
        <StatCard
          label="Correct Answers"
          value={stats.correct}
          subtitle={`${stats.answered > 0 ? ((stats.correct / stats.answered) * 100).toFixed(0) : 0}% of answered`}
          icon="✅"
          accent="sage"
          variant="soft"
        />
        <StatCard
          label="Accuracy"
          value={`${stats.accuracy}%`}
          subtitle="target >= 82.5%"
          highlight={stats.accuracy >= 82.5}
          icon="🎯"
          accent={stats.accuracy >= 82.5 ? "sage" : "gold"}
          variant="accent"
        />
        <StatCard
          label="Flashcards Due"
          value={flashcardDue}
          subtitle="spaced repetition review"
          icon="🃏"
          accent={flashcardDue > 0 ? "gold" : "sage"}
          variant="soft"
        />
      </div>

      {/* Study streak + daily goal */}
      <StreakPanel />

      {/* Readiness Score */}
      <ReadinessScore score={readiness?.value} />

      {/* Weakness Heatmap */}
      <WeaknessHeatmap />

      {/* Blueprint Domains & Quick Actions - Responsive: stack vertically on mobile, 3 cols on desktop */}
      <div
        data-tour="exam-blueprint"
        className="flex flex-col lg:grid lg:grid-cols-3 gap-6"
      >
        {/* Domain distribution (2 cols on desktop) */}
        <div className="lg:col-span-2 border border-dark-border rounded-2xl p-6 bg-dark-card shadow-dock space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-dark-borderSubtle">
            <div>
              <h2 className="font-serif text-xl font-semibold text-paper tracking-tight">
                Exam Domains Distribution
              </h2>
              <p className="text-xs text-paper-dim mt-0.5">
                Weighted blueprint allocation across the syllabus
              </p>
            </div>
            <span className="text-xs text-gold font-sans bg-gold/10 border border-gold/30 px-3 py-1 rounded-full">
              5 Domains
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {stats.by_domain.map((d) => {
              const friendlyName = domainLabels[d.domain] || d.domain;
              const pct =
                stats.total > 0
                  ? ((d.count / stats.total) * 100).toFixed(1)
                  : 0;

              return (
                <div key={d.domain} className="domain-row space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-paper font-medium font-sans">{friendlyName}</span>
                    <span className="text-paper-dim font-sans">
                      {d.count} questions ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-dark-surface rounded-full overflow-hidden border border-dark-borderSubtle">
                    <div
                      className="h-full bg-gradient-to-r from-gold to-[#D8A243] rounded-full transition-all duration-700 shadow-gold-glow"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Launch Cards (1 col on desktop) */}
        <div className="space-y-4">
          <div
            data-tour="weak-areas"
            className="border border-dark-border rounded-xl p-5 bg-dark-card space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-paper">
                Weak Areas
              </h3>
              <span className="text-xs font-mono font-semibold text-heart-light bg-heart/15 px-2.5 py-0.5 rounded-full border border-heart/30">
                {weakAreas.length} tracked
              </span>
            </div>
            {weakAreas.length === 0 ? (
              <p className="text-xs text-paper-muted leading-relaxed font-sans">
                Answer a few questions and your weakest subtopics will surface here.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {weakAreas.map((s) => (
                  <li key={`${s.domain}-${s.subtopic}`} className="space-y-1">
                    <Link
                      to={`/quiz?mode=weak&domain=${encodeURIComponent(
                        s.domain
                      )}&subtopic=${encodeURIComponent(s.subtopic)}`}
                      className="block group space-y-1"
                      title={`Drill ${s.subtopic}`}
                    >
                      <div className="flex justify-between items-baseline gap-2 text-xs">
                        <span className="text-paper-muted group-hover:text-paper truncate font-sans">
                          {s.subtopic}
                        </span>
                        <span className="font-mono text-paper-dim shrink-0">
                          {s.accuracy}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-dark-surface rounded-full overflow-hidden border border-dark-borderSubtle">
                        <div
                          className={`h-full rounded-full ${
                            s.accuracy >= 82.5
                              ? "bg-sage-light"
                              : s.accuracy >= 60
                              ? "bg-gold"
                              : "bg-heart"
                          }`}
                          style={{ width: `${Math.max(3, s.accuracy)}%` }}
                        ></div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/quiz?mode=weak"
              className="block w-full py-2.5 text-center text-xs font-semibold text-gold bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-full transition-colors duration-150"
            >
              Drill Weak Spots
            </Link>
            <Link
              to="/topics"
              className="block w-full text-center text-xs font-medium text-paper-dim hover:text-gold transition-colors"
            >
              Browse all topics
            </Link>
          </div>

          <div className="border border-dark-border rounded-xl p-5 bg-dark-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-paper">
                Flagged for Review
              </h3>
              <span className="text-xs font-sans font-semibold text-peach bg-peach/15 px-2.5 py-0.5 rounded-full border border-peach/30">
                {flagCount} Qs
              </span>
            </div>
            <p className="text-xs text-paper-muted leading-relaxed font-sans">
              Questions you have marked for deep dive. Re-examine explanations and test retention.
            </p>
            <Link
              to="/review"
              className="block w-full py-2.5 text-center text-xs font-semibold text-peach bg-peach/10 hover:bg-peach/20 border border-peach/30 rounded-full transition-colors duration-150"
            >
              Open Review Queue
            </Link>
          </div>

          <div
            data-tour="spaced-review"
            className="border border-dark-border rounded-xl p-5 bg-dark-card space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-paper">
                Spaced Review
              </h3>
              <span className="text-xs font-sans font-semibold text-gold bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
                {reviewDue} due
              </span>
            </div>
            <p className="text-xs text-paper-muted leading-relaxed font-sans">
              Questions scheduled by SM-2 spaced repetition. Drill the ones due
              today to lock in long-term retention.
            </p>
            <Link
              to="/quiz?mode=review"
              className="block w-full py-2.5 text-center text-xs font-semibold text-dark-bg bg-gold hover:bg-gold-hover rounded-full shadow-gold-glow transition-all duration-150"
            >
              Start Review
            </Link>
          </div>

          <div className="border border-dark-border rounded-xl p-5 bg-dark-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-paper">
                Study Notes & Calculators
              </h3>
              <span className="text-xs font-sans font-semibold text-sage-light bg-sage/15 px-2.5 py-0.5 rounded-full border border-sage/30">
                IPv4 Tool
              </span>
            </div>
            <p className="text-xs text-paper-muted leading-relaxed font-sans">
              Interactive IPv4 subnetting calculators, wildcard mask converter, and CIDR prefix cheat sheet.
            </p>
            <Link
              to="/notes"
              className="block w-full py-2.5 text-center text-xs font-semibold text-sage-light bg-sage/10 hover:bg-sage/20 border border-sage/30 rounded-full transition-colors duration-150"
            >
              Open Subnet Calculator
            </Link>
          </div>

          <div className="border border-dark-border rounded-xl p-5 bg-dark-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-paper">
                Quick Quiz
              </h3>
              <span className="text-xs font-mono font-semibold text-gold bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
                5 questions
              </span>
            </div>
            <p className="text-xs text-paper-muted leading-relaxed font-sans">
              70% from weakest subtopics, 30% random. Instant feedback.
            </p>
            <Link
              to="/quiz?mode=quick"
              className="block w-full py-2.5 text-center text-xs font-semibold text-dark-bg bg-gold hover:bg-gold-hover rounded-full shadow-gold-glow transition-all duration-150"
            >
              Start Quick Quiz
            </Link>
          </div>
          <div className="border border-dark-border rounded-xl p-5 bg-dark-card space-y-3">
            <h3 className="font-serif text-lg font-semibold text-paper">
              CCNA 2.0 Exam Standards
            </h3>
            <ul className="text-xs text-paper-muted space-y-2 list-none">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                <span>100 Questions total</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                <span>120 Minutes duration</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                <span>Passing score: 825 / 1000</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                <span>Adaptive blueprint coverage</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={onOpenExamModal || (() => navigate("/exam"))}
              className="block w-full py-2.5 text-center text-xs font-semibold text-dark-bg bg-gold hover:bg-gold-hover rounded-full shadow-gold-glow transition-all duration-150"
            >
              Simulate Full Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtitle, highlight, icon, accent, variant }) {
  let valColor = "text-paper";
  if (accent === "sage" || highlight) valColor = "text-sage-light";
  else if (accent === "gold") valColor = "text-gold";

  const base = "p-5 bg-dark-card space-y-2 border border-dark-border";
  const radius =
    variant === "soft" ? "rounded-xl" : variant === "accent" ? "rounded-2xl" : "rounded-xl";
  const extra =
    variant === "panel"
      ? "shadow-dock"
      : variant === "accent"
        ? "border-gold/30"
        : "border-dark-borderSubtle";

  return (
    <div className={`${base} ${radius} ${extra}`}>
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
        {subtitle && (
          <p className="text-xs text-paper-dim truncate max-w-[120px] font-sans">
            {subtitle}
          </p>
        )}
      </div>
      <p className={`font-serif text-3xl font-semibold tracking-tight ${valColor}`}>
        {value}
      </p>
      <p className="text-xs font-medium text-paper-muted pt-0.5">{label}</p>
    </div>
  );
}
