import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [dailyGoalPct, setDailyGoalPct] = useState(0);
  const [dailyGoalTarget, setDailyGoalTarget] = useState(12);
  const [streakInfo, setStreakInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const rootRef = useRef(null);

  useEffect(() => {
    invoke("get_dashboard_stats")
      .then((data) => {
        setStats(data);
        setDailyGoalPct(data?.daily_goal_percentage ?? 0);
        setDailyGoalTarget(data?.daily_goal_target ?? 12);
        setStreakInfo(data?.streak_info ?? "Study streak active");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent mx-auto"></div>
        <p className="text-paper-muted text-sm">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <section className="pt-8">
      <div className="max-w-7xl mx-auto pb-6">
        
        {/* Row 1: Page Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-semibold text-paper mb-2">Dashboard</h1>
          <p className="text-paper-muted text-lg">
            Welcome back! {" "}
            <span className="font-medium" id="streak-info">
              {streakInfo}
            </span>
          </p>
        </div>

        {/* Row 2: Main Study Focus Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* Left Column: Continue Studying Card (span 2) */}
          <div className="group bg-dark-surface/50 rounded-2xl border border-border/30 p-6 sm:p-8 hover:border-border/50 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-xl text-paper group-hover:text-gold transition-colors">
                  Continue Studying
                </h2>
                <p className="text-paper-muted mt-1">
                  AI & NetOps — Your personalized learning path awaits
                </p>
              </div>
            </div>
            <div className="mt-6">
              <button
                className="w-full py-3 bg-gold text-dark-bg font-semibold rounded-full text-xs tracking-wider uppercase hover:bg-gold-hover transition-all shadow-gold-glow"
              >
                Continue Practice
              </button>
            </div>
          </div>

          {/* Right Column: Daily Goal Card (span 1) */}
          <div className="bg-dark-surface/50 rounded-2xl border border-border/30 p-6 sm:p-8 flex flex-col items-end">
            <div className="text-right mb-4">
              <p className="text-xs text-paper-muted uppercase tracking-wider">Daily Goal</p>
              <p className="font-medium text-paper">{dailyGoalTarget} questions</p>
            </div>
            <div className="w-full max-w-md">
              <div className="bg-dark-surface/50 rounded-full h-2.5 overflow-hidden border border-border/30">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dailyGoalPct >= 100 ? "bg-gold" : dailyGoalPct >= 50 ? "bg-sage" : "bg-heart"
                  }`}
                  style={{ width: `${Math.min(100, dailyGoalPct)}%` }}
                  aria-valuenow={dailyGoalPct}
                  aria-label={`${dailyGoalPct}% progress toward daily goal`}
                />
              </div>
            </div>
            <p className="text-xs text-paper-muted mt-2">{dailyGoalPct}% complete</p>
          </div>
        </div>
      </div>

      {/* Row 3: Statistics & Mastery */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        
        {/* Domain Mastery (span 2) */}
        <div className="group bg-dark-surface/50 rounded-2xl border border-border/30 p-6 sm:p-8">
          <h2 className="font-semibold text-base text-paper mb-4">Domain Mastery</h2>
          <div className="space-y-3">
            {[
              { name: "Network Fundamentals", target: 85 },
              { name: "IP Connectivity", target: 78 },
              { name: "IP Services", target: 72 },
              { name: "Security Fundamentals", target: 91 },
              { name: "Automation", target: 67 },
            ].map((domain) => (
              <div key={domain.name} className="flex items-center justify-between">
                <span className="text-sm text-paper">{domain.name}</span>
                <div className="w-full rounded-full h-2 overflow-hidden bg-dark-surface/50">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      domain.target >= 80 ? "bg-gold" : domain.target >= 60 ? "bg-sage" : "bg-heart"
                    }`}
                    style={{ width: `${domain.target}%` }}
                    aria-hidden="true"
                  ></div>
                </div>
                <span className="text-xs text-paper-muted">{domain.target}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats (span 1) */}
        <div className="bg-dark-surface/50 rounded-2xl border border-border/30 p-6 sm:p-8">
          <h2 className="font-semibold text-base text-paper mb-4">Quick Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-paper-muted attempted">247 attempted</p>
              <p className="font-medium text-paper">Total Questions</p>
            </div>
            <div>
              <p className="text-xs text-paper-muted">50%</p>
              <p className="font-medium text-paper">Accuracy</p>
            </div>
            <div>
              <p className="text-xs text-paper-muted">4</p>
              <p className="font-medium text-paper">Answered Today</p>
            </div>
          </div>
        </div>

        {/* Review Due (span 1 - extra from grid-cols-3) */}
        <div className="group bg-dark-surface/50 rounded-2xl border border-border/30 p-6 sm:p-8">
          <h2 className="font-semibold text-base text-paper mb-4">Review Due</h2>
          <p className="text-paper-muted">
            3 questions due for review today
          </p>
          <button
            className="w-full py-2 bg-gold/10 text-gold border border-gold/30 rounded-full text-xs font-semibold hover:bg-gold/20 transition-colors"
          >
            Review Now
          </button>
        </div>
      </div>
    </section>
  );
}