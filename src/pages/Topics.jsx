import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link } from "react-router-dom";

const DOMAIN_LABELS = {
  network_infra: "Network Infrastructure",
  switching: "Switching & Access",
  ip_routing: "IP Routing",
  services_security: "Services & Security",
  ai_ops: "AI & NetOps",
};

const DOMAIN_ORDER = [
  "network_infra",
  "switching",
  "ip_routing",
  "services_security",
  "ai_ops",
];

function accuracyTone(accuracy) {
  if (accuracy >= 82.5) return "bg-sage";
  if (accuracy >= 60) return "bg-gold";
  return "bg-heart";
}

function accuracyText(accuracy) {
  if (accuracy >= 82.5) return "text-sage-light";
  if (accuracy >= 60) return "text-gold";
  return "text-heart-light";
}

export default function Topics() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await invoke("get_subtopic_stats");
        setStats(data || []);
      } catch (err) {
        console.error("Failed to load subtopic stats:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    return DOMAIN_ORDER.map((domain) => {
      const rows = stats
        .filter((s) => s.domain === domain)
        .filter((s) => !term || s.subtopic.toLowerCase().includes(term))
        // Weakest first, then the ones you have never touched, then the rest.
        .sort((a, b) => {
          const aTried = a.attempts > 0 ? 0 : 1;
          const bTried = b.attempts > 0 ? 0 : 1;
          if (aTried !== bTried) return aTried - bTried;
          if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
          return a.subtopic.localeCompare(b.subtopic);
        });
      return { domain, rows };
    }).filter((g) => g.rows.length > 0);
  }, [stats, query]);

  const totalQuestions = stats.reduce((sum, s) => sum + s.total, 0);
  const totalSubtopics = stats.length;
  const startedCount = stats.filter((s) => s.attempts > 0).length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-paper">
            Topic Drill
          </h1>
          <p className="text-sm text-paper-muted mt-1 font-sans">
            Pick a subtopic and drill it until the accuracy bar turns sage.
          </p>
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter subtopics..."
          className="text-xs border border-dark-border rounded-xl px-3 py-2 bg-dark-card text-paper placeholder:text-paper-dim focus:outline-none focus:ring-1 focus:ring-gold w-full sm:w-56"
        />
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent"></div>
          <p className="text-paper-muted text-sm font-sans">Loading topics...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="border border-dark-border rounded-2xl p-12 bg-dark-card text-center shadow-dock space-y-2">
          <h3 className="font-serif text-xl font-medium text-paper">No matching subtopics</h3>
          <p className="text-sm text-paper-muted font-sans">
            Try a shorter search, or clear the filter to see every topic.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-dark-border rounded-2xl p-4 bg-dark-card shadow-dock text-center">
              <p className="font-mono text-2xl text-peach">{totalQuestions}</p>
              <p className="text-[11px] uppercase tracking-wider text-paper-dim mt-1">Questions</p>
            </div>
            <div className="border border-dark-border rounded-2xl p-4 bg-dark-card shadow-dock text-center">
              <p className="font-mono text-2xl text-paper">{totalSubtopics}</p>
              <p className="text-[11px] uppercase tracking-wider text-paper-dim mt-1">Subtopics</p>
            </div>
            <div className="border border-dark-border rounded-2xl p-4 bg-dark-card shadow-dock text-center">
              <p className="font-mono text-2xl text-sage-light">{startedCount}</p>
              <p className="text-[11px] uppercase tracking-wider text-paper-dim mt-1">Started</p>
            </div>
          </div>

          <div className="space-y-6">
            {groups.map(({ domain, rows }) => {
              const domainTotal = rows.reduce((sum, s) => sum + s.total, 0);
              return (
                <section
                  key={domain}
                  className="border border-dark-border rounded-2xl bg-dark-card shadow-dock overflow-hidden"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-dark-border bg-dark-surface/40">
                    <div>
                      <h2 className="font-serif text-lg font-semibold text-paper">
                        {DOMAIN_LABELS[domain] || domain}
                      </h2>
                      <p className="text-xs text-paper-dim font-mono mt-0.5">
                        {rows.length} subtopics · {domainTotal} questions
                      </p>
                    </div>
                    <Link
                      to={`/quiz?mode=weak&domain=${encodeURIComponent(domain)}`}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-gold/40 text-gold hover:bg-gold/15 transition-colors"
                    >
                      Drill whole domain
                    </Link>
                  </div>

                  <div className="divide-y divide-dark-border">
                    {rows.map((s) => {
                      const started = s.attempts > 0;
                      return (
                        <div
                          key={`${domain}-${s.subtopic}`}
                          className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-dark-surface/40 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm text-paper font-sans truncate">
                                {s.subtopic}
                              </p>
                              <span className="text-xs text-paper-dim font-mono shrink-0">
                                {s.seen}/{s.total} seen
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="h-1 flex-1 rounded-full bg-dark-surface overflow-hidden">
                                {started && (
                                  <div
                                    className={`h-full rounded-full ${accuracyTone(s.accuracy)}`}
                                    style={{ width: `${Math.max(3, s.accuracy)}%` }}
                                  ></div>
                                )}
                              </div>
                              <span
                                className={`text-xs font-mono w-12 text-right ${
                                  started ? accuracyText(s.accuracy) : "text-paper-dim"
                                }`}
                              >
                                {started ? `${s.accuracy}%` : "—"}
                              </span>
                            </div>
                          </div>

                          <Link
                            to={`/quiz?mode=weak&domain=${encodeURIComponent(
                              domain
                            )}&subtopic=${encodeURIComponent(s.subtopic)}`}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25 transition-colors shrink-0"
                          >
                            Drill
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
