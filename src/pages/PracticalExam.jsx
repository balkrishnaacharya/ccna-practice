import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CliTerminal from "../components/CliTerminal";
import { generateScenarioSet } from "../utils/scenarioGenerator";
import { gradeScenario } from "../utils/iosEngine";

const HISTORY_KEY = "used_sim_history";
const DOMAIN_LABELS = {
  network_infra: "Network Infrastructure",
  switching: "Switching",
  ip_routing: "IP Routing",
  services_security: "Services & Security",
  ai_ops: "AI Operations",
};

function readHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(Array.isArray).slice(-4) : [];
  } catch { return []; }
}

function createScenarios() {
  const history = readHistory();
  const recentIds = history.flat();
  const count = Math.random() < 0.5 ? 5 : 6;
  return generateScenarioSet(count, recentIds);
}

function recordSession(scenarios) {
  const history = readHistory();
  const ids = scenarios.map((scenario) => scenario.id);
  if (JSON.stringify(history.at(-1)) === JSON.stringify(ids)) return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify([...history, ids].slice(-4)));
}

export default function PracticalExam() {
  const [scenarios, setScenarios] = useState(() => createScenarios());
  const [activeIndex, setActiveIndex] = useState(0);
  const [results, setResults] = useState(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const activeScenario = scenarios[activeIndex];

  useEffect(() => { recordSession(scenarios); }, []);

  function refreshDevices(devices) {
    activeScenario.devices = devices;
    setScenarios((old) => [...old]);
  }

  function gradeExam() {
    const basePoints = Math.floor(1000 / scenarios.length);
    const remainder = 1000 - basePoints * scenarios.length;
    const scoreResults = scenarios.map((scenario, index) => {
      const objectives = gradeScenario(scenario);
      const passed = objectives.length > 0 && objectives.every((item) => item.passed);
      return { scenarioId: scenario.id, title: scenario.title, domain: scenario.domain, objectives, passed, points: passed ? basePoints + (index === scenarios.length - 1 ? remainder : 0) : 0 };
    });
    setResults(scoreResults);
    setShowScoreboard(true);
  }

  function startFresh() {
    const nextScenarios = createScenarios();
    recordSession(nextScenarios);
    setScenarios(nextScenarios);
    setActiveIndex(0);
    setResults(null);
    setShowScoreboard(false);
  }

  const score = results?.reduce((sum, item) => sum + item.points, 0) || 0;
  const passedCount = results?.filter((item) => item.passed).length || 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-peach">Practical Lab</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-paper">IOS Troubleshooting Lab</h1>
          <p className="mt-1 text-sm text-paper-muted font-sans">Diagnose topology issues and repair running configs locally in the virtual terminal.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-dark-border bg-dark-card px-4 py-2 text-xs font-mono">
          <span className="font-semibold text-peach">{scenarios.length} scenarios</span>
          <span className="text-paper-dim">·</span>
          <span className="text-paper">1000 pts</span>
          <span className="text-paper-dim">·</span>
          <span className="text-sage-light">Pass: 825</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className="space-y-4 rounded-2xl border border-dark-border bg-dark-card p-6 shadow-dock">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-peach font-mono">Scenario {activeIndex + 1} of {scenarios.length} · {DOMAIN_LABELS[activeScenario.domain] || activeScenario.domain}</p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-paper">{activeScenario.title}</h2>
            </div>
            {results && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                results[activeIndex]?.passed
                  ? "bg-sage/20 text-sage-light border-sage/40 shadow-sage-glow"
                  : "bg-heart/20 text-heart-light border-heart/40"
              }`}>
                {results[activeIndex]?.points} pts
              </span>
            )}
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-paper-muted font-sans">{activeScenario.description}</p>

          <div className="space-y-2 border-t border-dark-borderSubtle pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-paper-dim">Objectives</h3>
            {activeScenario.validationRules.map((item) => {
              const graded = results?.[activeIndex]?.objectives.find((objective) => objective.id === item.id);
              return (
                <div key={item.id} className="flex items-start gap-2 text-xs text-paper-muted font-sans">
                  <span className={graded ? (graded.passed ? "text-sage-light font-bold" : "text-heart-light font-bold") : "text-paper-dim"}>
                    {graded ? (graded.passed ? "✓" : "✕") : "○"}
                  </span>
                  <span>{item.objective}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dark-borderSubtle pt-4">
            <div className="flex gap-2">
              <button
                disabled={activeIndex === 0}
                onClick={() => setActiveIndex((n) => n - 1)}
                className="rounded-full border border-dark-border px-4 py-2 text-xs font-medium text-paper-muted hover:text-paper hover:bg-dark-surface disabled:opacity-25"
              >
                Previous
              </button>
              <button
                disabled={activeIndex === scenarios.length - 1}
                onClick={() => setActiveIndex((n) => n + 1)}
                className="rounded-full border border-dark-border px-4 py-2 text-xs font-medium text-paper-muted hover:text-paper hover:bg-dark-surface disabled:opacity-25"
              >
                Next
              </button>
            </div>
            {!results ? (
              <button
                onClick={gradeExam}
                className="rounded-full bg-gold hover:bg-gold-hover px-5 py-2 text-xs font-semibold text-dark-bg uppercase tracking-wider shadow-gold-glow transition-all"
              >
                Grade Simulation
              </button>
            ) : (
              <button
                onClick={() => setShowScoreboard(true)}
                className="rounded-full bg-gold hover:bg-gold-hover px-5 py-2 text-xs font-semibold text-dark-bg uppercase tracking-wider shadow-gold-glow transition-all"
              >
                Scoreboard
              </button>
            )}
          </div>
        </section>

        <div className="min-w-0 space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-paper-dim font-mono">Virtual Cisco IOS Terminal</h2>
            <span className="text-xs text-paper-dim">Interactive local emulator</span>
          </div>
          <CliTerminal key={activeScenario.id} devices={activeScenario.devices} onDevicesChange={refreshDevices} />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {scenarios.map((scenario, index) => (
          <button
            key={scenario.id}
            onClick={() => setActiveIndex(index)}
            className={`min-w-48 rounded-xl border p-3.5 text-left transition-all ${
              index === activeIndex
                ? "border-gold bg-gold/15 text-paper shadow-gold-glow"
                : "border-dark-border bg-dark-card hover:border-gold/40 text-paper-muted"
            }`}
          >
            <span className="block text-xs font-semibold uppercase tracking-wider text-peach">{DOMAIN_LABELS[scenario.domain]}</span>
            <span className="mt-1 block truncate text-xs font-medium text-paper">{scenario.title}</span>
            {results && (
              <span className={`mt-1 block text-xs font-mono ${results[index].passed ? "text-sage-light" : "text-heart-light"}`}>
                {results[index].passed ? "Objectives complete" : "Objectives incomplete"}
              </span>
            )}
          </button>
        ))}
      </div>

      {showScoreboard && results && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-dark-bg/80 backdrop-blur-md p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="practical-score-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-dark-card border border-dark-border p-6 shadow-dock text-paper sm:p-7 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dark-borderSubtle pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-peach">Practical Exam Score</p>
                <h2 id="practical-score-title" className="mt-1 font-serif text-3xl font-bold">{score} <span className="text-base font-normal text-paper-dim">/ 1000</span></h2>
                <p className={`mt-1 text-xs font-mono font-medium ${score >= 825 ? "text-sage-light" : "text-heart-light"}`}>
                  {score >= 825 ? "PASS" : "FAIL"} · {passedCount} of {scenarios.length} scenarios passed · Passing threshold 825
                </p>
              </div>
              <button
                onClick={() => setShowScoreboard(false)}
                className="rounded-full border border-dark-border px-4 py-2 text-xs font-medium text-paper-muted hover:text-paper hover:bg-dark-surface"
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              {results.map((result, index) => (
                <article key={result.scenarioId} className="rounded-xl border border-dark-border bg-dark-surface/50 p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-serif text-base font-medium text-paper">{index + 1}. {result.title}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                      result.passed
                        ? "bg-sage/20 text-sage-light border-sage/40"
                        : "bg-heart/20 text-heart-light border-heart/40"
                    }`}>
                      {result.passed ? `PASS · ${result.points} pts` : "FAIL · 0 pts"}
                    </span>
                  </div>
                  <p className="text-xs text-paper-dim">{DOMAIN_LABELS[result.domain]}</p>
                  <ul className="space-y-1.5 pt-1">
                    {result.objectives.map((objective) => (
                      <li key={objective.id} className="flex gap-2 text-xs text-paper-muted">
                        <span className={objective.passed ? "text-sage-light font-bold" : "text-heart-light font-bold"}>
                          {objective.passed ? "✓" : "✕"}
                        </span>
                        <span>{objective.objective} <span className="font-mono text-paper-dim">({objective.device})</span></span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-3 pt-3">
              <button
                onClick={startFresh}
                className="rounded-full bg-gold hover:bg-gold-hover px-5 py-2.5 text-xs font-semibold text-dark-bg uppercase tracking-wider shadow-gold-glow"
              >
                Start Another Lab
              </button>
              <Link
                to="/"
                className="rounded-full border border-dark-border px-5 py-2.5 text-xs font-medium text-paper-muted hover:text-paper hover:bg-dark-surface"
              >
                Dashboard
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
