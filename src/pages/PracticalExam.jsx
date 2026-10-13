import { useState } from "react";
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

function newSession() {
  const history = readHistory();
  const recentIds = history.flat();
  const count = Math.random() < 0.5 ? 5 : 6;
  const scenarios = generateScenarioSet(count, recentIds);
  const nextHistory = [...history, scenarios.map((scenario) => scenario.id)].slice(-4);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  return scenarios;
}

export default function PracticalExam() {
  const [scenarios, setScenarios] = useState(() => newSession());
  const [activeIndex, setActiveIndex] = useState(0);
  const [results, setResults] = useState(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const activeScenario = scenarios[activeIndex];

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
    setScenarios(newSession());
    setActiveIndex(0);
    setResults(null);
    setShowScoreboard(false);
  }

  const score = results?.reduce((sum, item) => sum + item.points, 0) || 0;
  const passedCount = results?.filter((item) => item.passed).length || 0;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#4d6bfe]">Practical Lab</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">IOS Troubleshooting Exam</h1>
          <p className="mt-1 text-sm text-[#666]">Diagnose each network and repair its running configuration in the local simulator.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[#e5e5e5] bg-white px-4 py-3 text-sm">
          <span className="font-semibold text-[#4d6bfe]">{scenarios.length} scenarios</span>
          <span className="text-[#aaa]">·</span>
          <span>1000 points</span>
          <span className="text-[#aaa]">·</span>
          <span>Pass at 825</span>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className="space-y-4 rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-[#4d6bfe]">Scenario {activeIndex + 1} of {scenarios.length} · {DOMAIN_LABELS[activeScenario.domain] || activeScenario.domain}</p>
              <h2 className="mt-1 text-lg font-semibold">{activeScenario.title}</h2>
            </div>
            {results && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${results[activeIndex]?.passed ? "bg-[#e8f6ed] text-[#17653a]" : "bg-[#fdecea] text-[#9a271f]"}`}>{results[activeIndex]?.points} pts</span>}
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-[#4d4d4d]">{activeScenario.description}</p>

          <div className="space-y-2 border-t border-[#eee] pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6b6b6b]">Objectives</h3>
            {activeScenario.validationRules.map((item) => {
              const graded = results?.[activeIndex]?.objectives.find((objective) => objective.id === item.id);
              return <div key={item.id} className="flex items-start gap-2 text-sm"><span className={graded ? (graded.passed ? "text-emerald-600" : "text-red-600") : "text-[#b2b2b2]"}>{graded ? (graded.passed ? "✓" : "✕") : "○"}</span><span className="text-[#444]">{item.objective}</span></div>;
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eee] pt-4">
            <div className="flex gap-2">
              <button disabled={activeIndex === 0} onClick={() => setActiveIndex((n) => n - 1)} className="rounded-full border border-[#ddd] px-3 py-2 text-xs font-medium disabled:opacity-40">Previous</button>
              <button disabled={activeIndex === scenarios.length - 1} onClick={() => setActiveIndex((n) => n + 1)} className="rounded-full border border-[#ddd] px-3 py-2 text-xs font-medium disabled:opacity-40">Next</button>
            </div>
            {!results ? <button onClick={gradeExam} className="rounded-full bg-[#4d6bfe] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#3d59e9]">Submit &amp; Grade</button> : <button onClick={() => setShowScoreboard(true)} className="rounded-full bg-[#4d6bfe] px-4 py-2 text-xs font-semibold text-white">Scoreboard</button>}
          </div>
        </section>

        <div className="min-w-0 space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-[#383838]">Virtual IOS terminal</h2>
            <span className="text-xs text-[#777]">Commands and configuration stay on this device</span>
          </div>
          <CliTerminal key={activeScenario.id} devices={activeScenario.devices} onDevicesChange={refreshDevices} />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {scenarios.map((scenario, index) => (
          <button key={scenario.id} onClick={() => setActiveIndex(index)} className={`min-w-48 rounded-xl border p-3 text-left transition-colors ${index === activeIndex ? "border-[#4d6bfe] bg-[#eef0ff]" : "border-[#e5e5e5] bg-white hover:border-[#b8c2ff]"}`}>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#6c6c6c]">{DOMAIN_LABELS[scenario.domain]}</span>
            <span className="mt-1 block truncate text-xs font-semibold">{scenario.title}</span>
            {results && <span className={`mt-1 block text-[10px] ${results[index].passed ? "text-emerald-700" : "text-red-700"}`}>{results[index].passed ? "Objectives complete" : "Objectives incomplete"}</span>}
          </button>
        ))}
      </div>

      {showScoreboard && results && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-3 sm:p-6" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="practical-score-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eee] pb-4">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-[#4d6bfe]">Practical Exam Score</p><h2 id="practical-score-title" className="mt-1 text-2xl font-bold">{score} <span className="text-base font-medium text-[#777]">/ 1000</span></h2><p className={`mt-1 text-sm font-semibold ${score >= 825 ? "text-emerald-700" : "text-red-700"}`}>{score >= 825 ? "PASS" : "FAIL"} · {passedCount} of {scenarios.length} scenarios fully correct · Passing score 825</p></div>
              <button onClick={() => setShowScoreboard(false)} className="rounded-full border border-[#ddd] px-4 py-2 text-sm">Close</button>
            </div>
            <div className="mt-4 space-y-3">
              {results.map((result, index) => (
                <article key={result.scenarioId} className="rounded-xl border border-[#e5e5e5] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{index + 1}. {result.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${result.passed ? "bg-[#e8f6ed] text-[#17653a]" : "bg-[#fdecea] text-[#9a271f]"}`}>{result.passed ? `PASS · ${result.points} pts` : "FAIL · 0 pts"}</span></div>
                  <p className="mt-1 text-xs text-[#777]">{DOMAIN_LABELS[result.domain]} · {result.passed ? "All validation rules passed" : "Strict grading: all objectives must pass"}</p>
                  <ul className="mt-3 space-y-1.5">{result.objectives.map((objective) => <li key={objective.id} className="flex gap-2 text-sm"><span className={objective.passed ? "text-emerald-600" : "text-red-600"}>{objective.passed ? "✓" : "✕"}</span><span>{objective.objective} <span className="text-xs text-[#888]">({objective.device})</span></span></li>)}</ul>
                </article>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2"><button onClick={startFresh} className="rounded-full bg-[#4d6bfe] px-5 py-2.5 text-sm font-semibold text-white">Start another exam</button><Link to="/" className="rounded-full border border-[#ddd] px-5 py-2.5 text-sm font-medium">Dashboard</Link></div>
          </section>
        </div>
      )}
    </div>
  );
}
