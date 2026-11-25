import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, CheckCircle, Target, Clock, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";

const DOMAIN_LABELS = {
  network_infra: "Network Infrastructure",
  switching: "Switching & Access",
  ip_routing: "IP Routing",
  services_security: "Services & Security",
  ai_ops: "AI & NetOps",
};

const OFFICIAL_DOMAINS = [
  "network_infra",
  "switching",
  "ip_routing",
  "services_security",
  "ai_ops",
];

export default function Dashboard({ profileName, onOpenExamModal }) {
  const [stats, setStats] = useState(null);
  const [subtopics, setSubtopics] = useState([]);
  const [reviewDue, setReviewDue] = useState(0);
  const [flashcardDue, setFlashcardDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const today = new Date().toISOString().split("T")[0];

    const fetchAllData = async () => {
      try {
        const [statsData, subtopicData, reviewCount, flashcardCount] = await Promise.all([
          invoke("get_stats"),
          invoke("get_subtopic_stats").catch(() => []),
          invoke("get_review_due_count").catch(() => 0),
          invoke("get_flashcard_due_count", { today }).catch(() => 0),
        ]);

        if (mounted) {
          setStats(statsData);
          setSubtopics(subtopicData || []);
          setReviewDue(Number(reviewCount) || 0);
          setFlashcardDue(Number(flashcardCount) || 0);
        }
      } catch (err) {
        console.error("Dashboard data load failed:", err);
        if (mounted) setError(String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAllData();

    return () => {
      mounted = false;
    };
  }, []);

  // Compute daily goal stats
  const dailyGoalTarget = stats?.daily_goal || 12;
  const todayAnswered = stats?.today_answered || 0;
  const dailyGoalPct = Math.min(100, Math.round((todayAnswered / Math.max(1, dailyGoalTarget)) * 100));

  // Identify recommended subtopic or weakest domain for "Continue Studying"
  const recommendedFocus = useMemo(() => {
    if (subtopics && subtopics.length > 0) {
      // Find touched subtopics with lowest accuracy
      const attempted = subtopics.filter((s) => s.attempts > 0);
      if (attempted.length > 0) {
        attempted.sort((a, b) => a.accuracy - b.accuracy);
        return {
          title: attempted[0].subtopic,
          domain: DOMAIN_LABELS[attempted[0].domain] || attempted[0].domain,
          reason: `Accuracy: ${attempted[0].accuracy.toFixed(0)}% (${attempted[0].attempts} attempts)`,
          link: `/quiz?mode=weak&subtopic=${encodeURIComponent(attempted[0].subtopic)}`,
        };
      }
      return {
        title: subtopics[0].subtopic,
        domain: DOMAIN_LABELS[subtopics[0].domain] || subtopics[0].domain,
        reason: "Recommended starting point",
        link: `/quiz?mode=easy`,
      };
    }
    return {
      title: "Network Fundamentals & IP Addressing",
      domain: "Network Infrastructure",
      reason: "Start your CCNA 2.0 blueprint journey",
      link: "/quiz",
    };
  }, [subtopics]);

  // Aggregate domain mastery from stats.by_domain
  const domainMasteryList = useMemo(() => {
    const domainMap = new Map();
    if (stats?.by_domain) {
      for (const d of stats.by_domain) {
        domainMap.set(d.domain, d);
      }
    }

    return OFFICIAL_DOMAINS.map((domainKey) => {
      const data = domainMap.get(domainKey);
      const name = DOMAIN_LABELS[domainKey] || domainKey;
      if (!data || !data.count) {
        return { name, domainKey, accuracy: 0, count: 0, attempted: false };
      }
      const accuracy = data.count > 0 ? Math.round(((data.correct_correct || 0) / data.count) * 100) : 0;
      return {
        name,
        domainKey,
        accuracy,
        count: data.count,
        attempted: true,
      };
    });
  }, [stats]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent mx-auto" />
        <p className="text-paper-muted text-sm font-sans">Loading candidate analytics...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <p className="text-heart-light text-sm font-sans">Unable to load dashboard data: {error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-gold/15 hover:bg-gold/25 text-gold border border-gold/30 rounded-full text-xs font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Row 1: Header */}
      <div
        data-tour="home-welcome"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-dark-border/40"
      >
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-paper tracking-tight">
            Dashboard
          </h1>
          <p className="text-paper-muted text-sm mt-1 font-sans">
            {profileName ? (
              <>
                Welcome back, <span className="text-gold font-medium">{profileName}</span>.
              </>
            ) : (
              "Welcome back."
            )}{" "}
            {todayAnswered > 0 ? (
              <span>You've completed {todayAnswered} question{todayAnswered === 1 ? "" : "s"} today.</span>
            ) : (
              <span>Ready for today's practice session?</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/quiz?mode=quick"
            className="px-4 py-2 bg-dark-card hover:bg-dark-elevated text-paper-muted hover:text-paper border border-dark-border rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Sparkles size={14} className="text-gold" />
            <span>Quick 5-Q Quiz</span>
          </Link>
          <button
            type="button"
            onClick={onOpenExamModal || (() => navigate("/exam"))}
            className="px-4 py-2 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-xl text-xs shadow-gold-glow transition-all"
          >
            Simulate Exam
          </button>
        </div>
      </div>

      {/* Row 2: Study Focus & Daily Goal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Continue Studying Card (2/3 width) */}
        <div
          data-tour="weak-areas"
          className="lg:col-span-2 bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-7 shadow-dock flex flex-col justify-between relative overflow-hidden group hover:border-gold/30 transition-colors"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gold bg-gold/10 border border-gold/30 px-3 py-1 rounded-full">
                Targeted Focus
              </span>
              <span className="text-xs text-paper font-sans">{recommendedFocus.domain}</span>
            </div>

            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-paper group-hover:text-gold transition-colors leading-snug">
                {recommendedFocus.title}
              </h2>
              <p className="text-xs text-paper-muted mt-1.5 font-sans">
                {recommendedFocus.reason}
              </p>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-dark-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-paper">
              Adaptive blueprint algorithm selects high-yield questions first.
            </div>
            <Link
              to={recommendedFocus.link}
              className="px-6 py-2.5 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-full text-xs shadow-gold-glow transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <span>Continue Practice</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Right Column: Daily Goal Card (1/3 width) */}
        <div
          data-tour="study-streak"
          className="lg:col-span-1 bg-dark-card border border-dark-border rounded-xl p-6 sm:p-7 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-paper flex items-center gap-1.5">
                <Target size={14} className="text-gold" />
                Daily Goal
              </span>
              <span className="text-xs font-mono font-medium text-paper">
                {todayAnswered} / {dailyGoalTarget}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-3xl font-semibold text-paper">
                  {dailyGoalPct}%
                </span>
                <span className="text-xs text-paper-muted">
                  {dailyGoalPct >= 100 ? "Goal reached!" : `${Math.max(0, dailyGoalTarget - todayAnswered)} remaining`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-dark-surface rounded-full h-2.5 overflow-hidden border border-dark-border/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dailyGoalPct >= 100
                      ? "bg-sage"
                      : dailyGoalPct >= 50
                        ? "bg-gold"
                        : "bg-heart"
                  }`}
                  style={{ width: `${dailyGoalPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dark-border/60 text-xs text-paper flex items-center justify-between">
            <span>Streak status</span>
            <span className="text-gold font-medium">
              {stats?.streak_info || (todayAnswered > 0 ? "Active today" : "Practice to maintain")}
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Domain Mastery & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Domain Mastery (2/3 width) */}
        <div
          data-tour="exam-blueprint"
          className="lg:col-span-2 bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-7 shadow-dock space-y-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-normal text-paper">
                Domain Mastery
              </h2>
              <p className="text-xs text-paper-muted mt-0.5">
                Official CCNA 2.0 blueprint weighting & accuracy
              </p>
            </div>
            <Link
              to="/topics"
              className="text-xs text-gold hover:underline font-medium"
            >
              View Topic Breakdown
            </Link>
          </div>

          <div className="space-y-4">
            {domainMasteryList.map((domain) => {
              const barColor =
                domain.accuracy >= 80
                  ? "bg-sage"
                  : domain.accuracy >= 60
                    ? "bg-gold"
                    : domain.accuracy > 0
                      ? "bg-heart"
                      : "bg-dark-surface";

              return (
                <div key={domain.domainKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-paper font-medium">{domain.name}</span>
                    <span className="text-paper font-mono">
                      {domain.attempted ? `${domain.accuracy}%` : "Not started"}
                    </span>
                  </div>
                  <div className="w-full bg-dark-surface rounded-full h-2 overflow-hidden border border-dark-border/40">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.max(domain.accuracy, domain.attempted ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats & Review Queue (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Stats Card */}
          <div
            data-tour="dashboard-stats"
            className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-4"
          >
            <h2 className="font-serif text-base font-normal text-paper">
              Candidate Metrics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-dark-border bg-dark-surface/60 p-3 space-y-0.5">
                <span className="text-xs text-paper">Accuracy</span>
                <p className="font-serif text-2xl font-semibold text-sage-light">
                  {stats?.accuracy ?? 0}%
                </p>
              </div>
              <div className="rounded-xl border border-dark-border bg-dark-surface/60 p-3 space-y-0.5">
                <span className="text-xs text-paper">Answered</span>
                <p className="font-serif text-2xl font-semibold text-gold">
                  {stats?.answered ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-dark-border bg-dark-surface/60 p-3 space-y-0.5">
                <span className="text-xs text-paper">Question Bank</span>
                <p className="font-serif text-2xl font-semibold text-paper">
                  {stats?.total ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-dark-border bg-dark-surface/60 p-3 space-y-0.5">
                <span className="text-xs text-paper">Coverage</span>
                <p className="font-serif text-2xl font-semibold text-peach">
                  {stats?.total > 0 ? Math.round(((stats.answered || 0) / stats.total) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Spaced Repetition / Review Due Card */}
          <div
            data-tour="spaced-review"
            className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-paper flex items-center gap-1.5">
                <Clock size={14} className="text-gold" />
                Spaced Repetition
              </span>
              {(reviewDue > 0 || flashcardDue > 0) && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                  Due Now
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-dark-border/40">
                <span className="text-paper-muted">Review Queue:</span>
                <span className="font-mono text-paper font-medium">{reviewDue} questions</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-paper-muted">Flashcards Due:</span>
                <span className="font-mono text-paper font-medium">{flashcardDue} cards</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Link
                to="/quiz?mode=review"
                className="flex-1 py-2 text-center text-xs font-semibold bg-gold hover:bg-gold-hover text-dark-bg rounded-xl shadow-gold-glow transition-all"
              >
                Review ({reviewDue})
              </Link>
              <Link
                to="/flashcards"
                className="flex-1 py-2 text-center text-xs font-medium border border-dark-border text-paper hover:bg-dark-surface rounded-xl transition-colors"
              >
                Flashcards
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Activity */}
      {stats?.recent_activity && stats.recent_activity.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-3">
          <h2 className="font-serif text-base font-normal text-paper">
            Recent Practice Activity
          </h2>
          <div className="divide-y divide-dark-border/40 text-xs">
            {stats.recent_activity.slice(0, 5).map((act, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-gold" />
                  <span className="text-paper font-medium">{act.label || "Practice session"}</span>
                </div>
                {act.date && (
                  <span className="text-paper font-mono">{act.date}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
