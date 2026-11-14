import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link, useNavigate } from "react-router-dom";
import StreakPanel from "../components/StreakPanel";
import ReadinessScore from "../components/analytics/ReadinessScore";
import WeaknessHeatmap from "../components/analytics/WeaknessHeatmap";
import { useReadiness } from "@/hooks/useReadiness";

const getBarClass = (accuracy) => {
  if (accuracy >= 82.5) return "bg-sage-light";
  if (accuracy >= 60) return "bg-gold";
  return "bg-heart";
};

const getDotClass = (i) => {
  const mod = i % 3;
  if (mod === 0) return "bg-gold";
  if (mod === 1) return "bg-sage";
  return "bg-heart";
};

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
      <div className="py-12 text-center space-y-4">
        <p className="text-paper-muted text-sm font-sans">
          Loading candidate analytics…
        </p>
      </div>
    );
  }

  if (!stats && statsError) {
    return (
      <div className="py-12 text-center space-y-4">
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
          className="px-6 py-3 bg-heart/10 hover:bg-heart/20 border border-heart/30 text-heart-light text-xs font-medium rounded-full transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  /* ── Top: greeting + daily goal ── */
  const domainLabels = {
    network_infra: "Network Infrastructure",
    switching: "Switching & Access",
    ip_routing: "IP Routing",
    services_security: "Services & Security",
    ai_ops: "AI & NetOps",
  };

  const dailyGoalPct =
    stats && stats.answered > 0
      ? ((stats.today_answered || 0) / Math.max(1, stats.daily_goal || 1)) * 100
      : 0;
  const goalColor = dailyGoalPct >= 100 ? "sage" : dailyGoalPct >= 50 ? "gold" : "heart";

  return (
    <div ref={containerRef} className="space-y-8 pb-12">
      {/* Greeting & Progress Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
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

          {/* Daily Goal Card */}
          <div className="w-48 bg-dark-surface rounded-2xl p-4 border border-border/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-paper-muted">Daily Goal</span>
              <span className="text-xs font-medium text-gold">{stats?.daily_goal ?? 12} questions</span>
            </div>
            <div className="w-full bg-dark-surface/50 rounded-full h-2">
              <div
                className={`h-full rounded-full ${
                  dailyGoalPct >= 100 ? "bg-sage-light" : dailyGoalPct >= 50 ? "bg-gold" : "bg-heart"
                }`}
                style={{ width: `${Math.min(100, dailyGoalPct)}%` }}
                aria-valuenow={dailyGoalPct}
                aria-label={`${dailyGoalPct}% progress toward daily goal`}
              />
            </div>
            <p className="text-xs text-paper-muted text-center mt-1">
              {stats?.today_answered ?? 0} of {stats?.daily_goal ?? 12} answered
            </p>
          </div>
        </div>
      </div>

      {/* Main: Continue Studying */}
      <div>
        <h2 className="font-serif text-2xl font-semibold text-paper tracking-tight">
          Continue Studying
        </h2>
        <p className="text-paper-muted text-sm mt-1">
          Your last studied topic and recommended next activity
        </p>

        {/* Last studied topic */}
        {stats && stats.by_domain && stats.by_domain.length > 0 ? (
          <div className="mt-4">
            <div className="flex items-center gap-3 rounded-xl bg-dark-surface/50 p-3 border border-border/30">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-gold"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-paper">
                  {stats.by_domain[0]?.domain ? domainLabels[stats.by_domain[0].domain] : "Network Infrastructure"}
                </p>
                <p className="text-xs text-paper-muted">
                  {stats.by_domain[0]?.count ?? 0} questions • {(
                  stats.by_domain[0]?.accuracy ?? 0
                ).toFixed(0)}% accuracy
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-paper-muted mt-4 text-sm">
            Answer a few questions and your progress will appear here.
          </p>
        )}

        {/* Continue Practice button */}
        <Link
          to="/quiz?mode=weak&domain=network_infra"
          className="mt-4 inline-block px-6 py-3 bg-gold text-dark-bg font-semibold rounded-full text-xs shadow-gold-glow transition-colors hover:bg-gold-hover"
          aria-label="Continue practice"
        >
          Continue Practice
        </Link>
      </div>

      {/* Daily Goal & Topic Mastery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {/* Quick stats row */}
        <div>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-3xl font-serif font-semibold tracking-tight text-gold">{stats?.total ?? 0}</span>
            <span className="text-xs text-paper-muted">questions</span>
          </div>
          <span className="text-3xl font-serif font-semibold tracking-tight text-sage-light">
            {stats?.accuracy ?? 0}%
          </span>
          <span className="text-xs text-paper-muted">accuracy</span>
        </div>

        <div>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-3xl font-serif font-semibold tracking-tight text-gold">
              {stats?.answered ?? 0}
            </span>
            <span className="text-xs text-paper-muted">answered</span>
          </div>
          <span className="text-3xl font-serif font-semibold tracking-tight text-sage-light">
            {((stats?.answered ?? 0) / Math.max(1, (stats?.total ?? 1)) * 100).toFixed(0)}%
          </span>
          <span className="text-xs text-paper-muted">of total</span>
        </div>

        <div>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-3xl font-serif font-semibold tracking-tight text-gold">
              {stats?.today_answered ?? 0}
            </span>
            <span className="text-xs text-paper-muted">today</span>
          </div>
          <span className="text-3xl font-serif font-semibold tracking-tight text-sage-light">
            {dailyGoalPct.toFixed(0)}%
          </span>
          <span className="text-xs text-paper-muted">of goal</span>
        </div>
      </div>

      {/* Domain Mastery */}
      {stats && stats.by_domain && stats.by_domain.length > 0 ? (
        <div className="mt-8 space-y-3">
          <h2 className="font-serif text-lg font-semibold text-paper tracking-tight">
            Domain Mastery
          </h2>
          <div className="space-y-2">
            {stats.by_domain.map((d) => {
              const friendlyName = domainLabels[d.domain] || d.domain;
              const pct = stats.total > 0 ? ((d.count / stats.total) * 100).toFixed(1) : 0;
              const accuracy = d.count > 0 ? ((d.correct_correct ?? 0) / d.count) * 100 : 0;

              return (
                <div key={d.domain} className="flex items-center justify-between">
                  <span className="font-medium text-paper">{friendlyName}</span>
                  <div className="w-24 h-2 rounded-full bg-dark-surface/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getBarClass(accuracy)}`}
                      style={{ width: `${Math.max(1, pct)}%` }}
                      aria-label={`${friendlyName}: ${pct}% mastery`}
                    />
                  </div>
                  <span className="text-xs text-paper-muted">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-paper-muted mt-8 text-sm">
          Take a practice quiz to establish domain mastery.
        </p>
      )}

      {/* Review Section */}
      <div className="mt-8">
        <h2 className="font-serif text-lg font-semibold text-paper tracking-tight">
          Review
        </h2>
        <p className="text-paper-muted text-sm mt-1">
          Questions scheduled for spaced repetition
        </p>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs text-gold bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
            {reviewDue} due
          </span>
          <Link
            to="/quiz?mode=review"
            className="px-4 py-2 text-xs font-medium text-dark-bg bg-gold hover:bg-gold-hover rounded-full shadow-gold-glow transition-colors"
            aria-label="Start review"
          >
            Start Review
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      {stats && stats.recent_activity && stats.recent_activity.length > 0 ? (
        <div className="mt-8 space-y-3">
          <h2 className="font-serif text-lg font-semibold text-paper tracking-tight">
            Recent Activity
          </h2>
          <ul className="text-sm text-paper-muted space-y-1">
            {stats.recent_activity.map((a, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${getDotClass(i)}`} />
                <span className="align-middle">
                  {a.label || " Practice session"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-8 text-paper-muted">
          Start your first practice session to see recent activity.
        </p>
      )}
    </div>
  );
}