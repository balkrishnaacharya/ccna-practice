import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link, useNavigate } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Dashboard({ profileName, onOpenExamModal }) {
  const [stats, setStats] = useState(null);
  const [flagCount, setFlagCount] = useState(0);
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const domainContainerRef = useRef(null);
  const heroRef = useRef(null);

  useEffect(() => {
    invoke("get_stats").then(setStats).catch(console.error);
    invoke("get_flags")
      .then((flags) => setFlagCount(flags ? flags.length : 0))
      .catch(console.error);
  }, []);

  useGSAP(
    () => {
      if (!stats) return;

      // Animate Hero entrance
      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", force3D: true }
        );
      }

      // Parallax scroll on domain breakdown items
      const cards = gsap.utils.toArray(".domain-row", containerRef.current);
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            delay: i * 0.05,
            ease: "power2.out",
            force3D: true,
            scrollTrigger: {
              trigger: card,
              start: "top 95%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    },
    { scope: containerRef, dependencies: [stats] }
  );

  if (!stats) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent"></div>
        <p className="text-paper-muted text-sm font-sans">
          Loading candidate analytics...
        </p>
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
    <div ref={containerRef} className="space-y-8 pb-12">
      {/* Greeting Banner */}
      <div
        ref={heroRef}
        data-tour="home-welcome"
        className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-dark-surface via-dark-card to-[#2A2A23] border border-dark-border shadow-dock relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-wider uppercase">
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
              className="px-6 py-3 bg-gold hover:bg-gold-hover text-dark-bg font-semibold text-xs tracking-wider uppercase rounded-full shadow-gold-glow transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Start Full Exam (120m) →
            </button>
            <Link
              to="/quiz"
              className="px-5 py-3 bg-dark-surface hover:bg-dark-elevated text-paper-muted hover:text-paper text-xs font-semibold tracking-wider uppercase rounded-full border border-dark-border transition-colors duration-150"
            >
              Practice Quiz
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards - Responsive: 1 col on mobile (375px), 2 col on sm, 4 col on desktop (1024px+) */}
      <div data-tour="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          accent="sage"
        />
        <StatCard
          label="Accuracy"
          value={`${stats.accuracy}%`}
          subtitle="target >= 82.5%"
          highlight={stats.accuracy >= 82.5}
          icon="🎯"
          accent={stats.accuracy >= 82.5 ? "sage" : "gold"}
        />
      </div>

      {/* Blueprint Domains & Quick Actions - Responsive: stack vertically on mobile, 3 cols on desktop */}
      <div
        ref={domainContainerRef}
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
            <span className="text-xs text-gold font-mono bg-gold/10 border border-gold/30 px-3 py-1 rounded-full">
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
                    <span className="text-paper-dim font-mono">
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
          <div className="border border-dark-border rounded-2xl p-5 bg-dark-card shadow-dock space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-paper">
                Flagged for Review
              </h3>
              <span className="text-xs font-mono font-semibold text-peach bg-peach/15 px-2.5 py-0.5 rounded-full border border-peach/30">
                {flagCount} Qs
              </span>
            </div>
            <p className="text-xs text-paper-muted leading-relaxed font-sans">
              Questions you have marked for deep dive. Re-examine explanations and test retention.
            </p>
            <Link
              to="/review"
              className="block w-full py-2.5 text-center text-xs font-semibold tracking-wider uppercase text-peach bg-peach/10 hover:bg-peach/20 border border-peach/30 rounded-full transition-colors duration-150"
            >
              Open Review Queue →
            </Link>
          </div>

          <div className="border border-dark-border rounded-2xl p-5 bg-dark-card shadow-dock space-y-3">
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
              className="block w-full py-2.5 text-center text-xs font-semibold tracking-wider uppercase text-dark-bg bg-gold hover:bg-gold-hover rounded-full shadow-gold-glow transition-all duration-150"
            >
              Simulate Full Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtitle, highlight, icon, accent }) {
  let valColor = "text-paper";
  if (accent === "sage" || highlight) valColor = "text-sage-light";
  else if (accent === "gold") valColor = "text-gold";

  return (
    <div className="border border-dark-border rounded-2xl p-5 bg-dark-card shadow-dock space-y-2 hover:border-gold/30 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
        {subtitle && (
          <p className="text-[11px] text-paper-dim truncate max-w-[120px] font-mono">
            {subtitle}
          </p>
        )}
      </div>
      <p className={`font-serif text-3xl font-semibold tracking-tight ${valColor}`}>
        {value}
      </p>
      <p className="text-xs font-medium uppercase tracking-wider text-paper-muted pt-0.5">
        {label}
      </p>
    </div>
  );
}
