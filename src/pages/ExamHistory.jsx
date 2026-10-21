import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link, useNavigate } from "react-router-dom";

function formatDate(unixSecs) {
  if (!unixSecs) return "—";
  return new Date(unixSecs * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(sec) {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ExamHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke("get_exam_history")
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent"></div>
        <p className="text-paper-muted text-sm font-sans">Loading exam history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-paper">Exam History</h1>
          <p className="text-xs text-paper-muted mt-1 font-sans">
            All past exam sessions with scaled scores and item-level review.
          </p>
        </div>
        <Link
          to="/exam"
          className="px-5 py-2.5 bg-gold hover:bg-gold-hover text-dark-bg text-xs font-semibold uppercase tracking-wider rounded-full shadow-gold-glow transition-all"
        >
          New Exam
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="border border-dark-border rounded-2xl p-12 bg-dark-card text-center shadow-dock space-y-4">
          <div className="w-14 h-14 bg-gold/15 text-gold border border-gold/30 rounded-full flex items-center justify-center mx-auto shadow-gold-glow">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-paper-muted text-sm font-sans">No exam sessions completed yet.</p>
          <Link
            to="/exam"
            className="inline-block px-6 py-2.5 bg-gold hover:bg-gold-hover text-dark-bg text-xs font-semibold uppercase tracking-wider rounded-full shadow-gold-glow transition-all"
          >
            Take Your First Exam
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Link
              key={s.id}
              to={`/history/${s.id}`}
              className="block border border-dark-border rounded-2xl p-5 bg-dark-card shadow-dock hover:border-gold/50 transition-all duration-200 group"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        s.passed
                          ? "bg-sage/20 text-sage-light border-sage/40 shadow-sage-glow"
                          : "bg-heart/20 text-heart-light border-heart/40"
                      }`}
                    >
                      {s.passed ? "PASS" : "FAIL"}
                    </span>
                    <span className="text-xs text-paper-dim uppercase tracking-wider font-mono">
                      {s.mode} mode
                    </span>
                  </div>
                  <p className="text-xs text-paper-dim font-mono">{formatDate(s.started_at)}</p>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="font-serif text-3xl font-semibold text-paper group-hover:text-gold transition-colors">
                      {s.scaled_score}
                    </p>
                    <p className="text-xs text-paper-dim font-mono">/ 1000</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-paper">
                      {s.score} / {s.total}
                    </p>
                    <p className="text-xs text-paper-dim font-mono">{s.percentage}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-mono text-paper-muted">{formatDuration(s.duration_sec)}</p>
                    <p className="text-xs text-paper-dim font-mono">duration</p>
                  </div>
                  <svg className="w-4 h-4 text-paper-dim group-hover:text-gold group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
