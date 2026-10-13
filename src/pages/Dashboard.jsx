import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link } from "react-router-dom";

export default function Dashboard({ profileName }) {
  const [stats, setStats] = useState(null);
  const [flagCount, setFlagCount] = useState(0);

  useEffect(() => {
    invoke("get_stats").then(setStats).catch(console.error);
    invoke("get_flags")
      .then((flags) => setFlagCount(flags ? flags.length : 0))
      .catch(console.error);
  }, []);

  if (!stats) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4d6bfe] border-t-transparent"></div>
        <p className="text-[#5a5a5a] text-sm mt-3">Loading dashboard statistics...</p>
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

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-[#4d6bfe] to-[#3651d4] rounded-2xl p-6 text-white shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs uppercase font-medium tracking-wide text-[#e8ecff]">
            CCNA 2.0 Exam Readiness
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {profileName ? `Welcome back, ${profileName}!` : "Welcome back, Candidate!"}
          </h1>
          <p className="text-sm text-blue-100 max-w-lg leading-relaxed">
            Track your progress across all 5 CCNA 2.0 domains. Ready to test your knowledge?
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/exam"
            className="px-5 py-2.5 bg-white text-[#4d6bfe] hover:bg-[#e8ecff] text-sm font-medium rounded-full shadow-sm transition-colors duration-150"
          >
            Start Full Exam (120m) →
          </Link>
          <Link
            to="/quiz"
            className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-full transition-colors duration-150 border border-white/20"
          >
            Practice Quiz
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Question Bank"
          value={stats.total}
          subtitle="CCNA 2.0 blueprint"
          icon="📚"
        />
        <StatCard
          label="Answered"
          value={stats.answered}
          subtitle="lifetime questions"
          icon="✍️"
        />
        <StatCard
          label="Correct Answers"
          value={stats.correct}
          subtitle={`${stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(0) : 0}% of bank`}
          icon="✅"
        />
        <StatCard
          label="Accuracy"
          value={`${stats.accuracy}%`}
          subtitle="target >= 82.5%"
          highlight={stats.accuracy >= 82.5}
          icon="🎯"
        />
      </div>

      {/* Blueprint Domains & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Domain distribution (2 cols) */}
        <div className="md:col-span-2 border border-[#e5e5e5] rounded-2xl p-5 bg-white shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#e5e5e5]">
            <h2 className="text-base font-medium text-[#0d0d0d]">
              Exam Domains Distribution
            </h2>
            <span className="text-xs text-[#5a5a5a] font-medium tracking-wide">
              5 Core Blueprint Domains
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {stats.by_domain.map((d) => {
              const friendlyName = domainLabels[d.domain] || d.domain;
              const pct =
                stats.total > 0
                  ? ((d.count / stats.total) * 100).toFixed(1)
                  : 0;

              return (
                <div key={d.domain} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#0d0d0d]">{friendlyName}</span>
                    <span className="text-[#5a5a5a]">
                      {d.count} questions ({pct}%)
                    </span>
                  </div>
                  {/* Horizontal progress bar with bg-[#e8ecff] track and bg-[#4d6bfe] fill, rounded-full */}
                  <div className="w-full h-2.5 bg-[#e8ecff] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4d6bfe] rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Launch Cards (1 col) */}
        <div className="space-y-4">
          <div className="border border-[#e5e5e5] rounded-2xl p-5 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-[#0d0d0d]">
                Flagged for Review
              </h3>
              <span className="text-xs font-medium tracking-wide text-[#1a2a8a] bg-[#e8ecff] px-2.5 py-0.5 rounded-full">
                {flagCount} Qs
              </span>
            </div>
            <p className="text-xs text-[#5a5a5a] leading-relaxed">
              Questions you have flagged during practice to study explanations and review later.
            </p>
            <Link
              to="/review"
              className="block w-full py-2.5 text-center text-xs font-medium tracking-wide text-[#1a2a8a] bg-[#e8ecff] hover:bg-[#d8e0ff] rounded-full transition-colors duration-150"
            >
              Open Review Queue →
            </Link>
          </div>

          <div className="border border-[#e5e5e5] rounded-2xl p-5 bg-white shadow-sm space-y-3">
            <h3 className="text-base font-medium text-[#0d0d0d]">
              CCNA 2.0 Exam Standards
            </h3>
            <ul className="text-xs text-[#5a5a5a] space-y-1.5 list-disc list-inside">
              <li>100 Questions total</li>
              <li>120 Minutes duration</li>
              <li>Passing score: 825 / 1000</li>
              <li>Weighted blueprint coverage</li>
            </ul>
            <Link
              to="/exam"
              className="block w-full py-2.5 text-center text-xs font-medium tracking-wide text-white bg-[#4d6bfe] hover:bg-[#3b59e9] rounded-full shadow-sm transition-colors duration-150"
            >
              Simulate Full Exam
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtitle, highlight, icon }) {
  return (
    <div className="border border-[#e5e5e5] rounded-2xl p-5 bg-white shadow-sm space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-base">{icon}</span>
        {subtitle && <p className="text-[11px] text-[#5a5a5a] truncate max-w-[110px]">{subtitle}</p>}
      </div>
      <p
        className={`text-3xl font-semibold tracking-tight ${
          highlight ? "text-emerald-600" : "text-[#0d0d0d]"
        }`}
      >
        {value}
      </p>
      <p className="text-xs font-medium tracking-wide text-[#5a5a5a] pt-0.5">{label}</p>
    </div>
  );
}
