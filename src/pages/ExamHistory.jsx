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
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4d6bfe] border-t-transparent"></div>
        <p className="text-[#5a5a5a] text-sm mt-3">Loading exam history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0d0d0d]">Exam History</h1>
          <p className="text-xs text-[#5a5a5a] mt-1">
            All past exam sessions with scores and detailed review.
          </p>
        </div>
        <Link
          to="/exam"
          className="px-5 py-2.5 bg-[#4d6bfe] hover:bg-[#3b59e9] text-white text-xs font-medium rounded-full shadow-sm transition-colors"
        >
          New Exam
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="border border-[#e5e5e5] rounded-2xl p-12 bg-white text-center shadow-sm space-y-3">
          <div className="w-12 h-12 bg-[#e8ecff] text-[#4d6bfe] rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-[#5a5a5a] text-sm">No exam sessions yet.</p>
          <Link
            to="/exam"
            className="inline-block px-6 py-2.5 bg-[#4d6bfe] hover:bg-[#3b59e9] text-white text-sm font-medium rounded-full transition-colors"
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
              className="block border border-[#e5e5e5] rounded-2xl p-5 bg-white shadow-sm hover:border-[#4d6bfe] hover:shadow-md transition-all duration-150"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                        s.passed
                          ? "bg-[#e6f7ee] text-[#0e6245] border-[#8ed4b0]"
                          : "bg-[#fdecea] text-[#b3261e] border-[#f0a5a0]"
                      }`}
                    >
                      {s.passed ? "PASS" : "FAIL"}
                    </span>
                    <span className="text-xs text-[#5a5a5a] uppercase tracking-wide font-medium">
                      {s.mode} mode
                    </span>
                  </div>
                  <p className="text-sm text-[#5a5a5a]">{formatDate(s.started_at)}</p>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-2xl font-semibold text-[#0d0d0d]">{s.scaled_score}</p>
                    <p className="text-xs text-[#5a5a5a]">/ 1000</p>
                  </div>
                  <div>
                    <p className="text-base font-medium text-[#0d0d0d]">
                      {s.score} / {s.total}
                    </p>
                    <p className="text-xs text-[#5a5a5a]">{s.percentage}% correct</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0d0d0d]">{formatDuration(s.duration_sec)}</p>
                    <p className="text-xs text-[#5a5a5a]">duration</p>
                  </div>
                  <svg className="w-4 h-4 text-[#5a5a5a] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
