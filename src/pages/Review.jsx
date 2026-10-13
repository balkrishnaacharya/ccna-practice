import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link } from "react-router-dom";

export default function Review() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState("all");

  useEffect(() => {
    fetchFlags();
  }, []);

  async function fetchFlags() {
    setLoading(true);
    try {
      const data = await invoke("get_flags");
      setFlags(data || []);
    } catch (err) {
      console.error("Failed to load flags:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnflag(questionId) {
    try {
      await invoke("toggle_flag", { questionId, note: null });
      setFlags((prev) => prev.filter((f) => f.question_id !== questionId));
    } catch (err) {
      console.error("Failed to unflag question:", err);
    }
  }

  const domains = Array.from(new Set(flags.map((f) => f.domain)));
  const filteredFlags =
    filterDomain === "all"
      ? flags
      : flags.filter((f) => f.domain === filterDomain);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0d0d0d]">Review Queue</h1>
          <p className="text-sm text-[#5a5a5a] mt-1">
            Questions flagged during practice sessions and exams.
          </p>
        </div>

        {flags.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5a5a5a] font-medium tracking-wide">Domain:</span>
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="text-xs border border-[#e5e5e5] rounded-xl px-3 py-2 bg-white text-[#0d0d0d] focus:outline-none focus:ring-1 focus:ring-[#4d6bfe]"
            >
              <option value="all">All Domains ({flags.length})</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d.replace("_", " ")} ({flags.filter((f) => f.domain === d).length})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4d6bfe] border-t-transparent"></div>
          <p className="text-[#5a5a5a] text-sm mt-3">Loading review queue...</p>
        </div>
      ) : flags.length === 0 ? (
        <div className="border border-[#e5e5e5] rounded-2xl p-12 bg-white text-center shadow-sm space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
              />
            </svg>
          </div>
          <h3 className="text-base font-medium text-[#0d0d0d]">
            No flagged questions yet
          </h3>
          <p className="text-sm text-[#5a5a5a] max-w-sm mx-auto leading-relaxed">
            Whenever you encounter a tricky question during practice or exam simulations, tap the "Flag" button to study it here.
          </p>
          <div className="pt-2">
            <Link
              to="/quiz"
              className="px-6 py-2.5 bg-[#4d6bfe] hover:bg-[#3b59e9] text-white rounded-full text-xs font-medium tracking-wide shadow-sm transition-colors duration-150 inline-block"
            >
              Start Practicing Questions
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFlags.map((f) => (
            <div
              key={f.id}
              className="border border-[#e5e5e5] rounded-2xl p-5 bg-white shadow-sm space-y-4"
            >
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium tracking-wide uppercase text-[#1a2a8a] bg-[#e8ecff] px-2.5 py-1 rounded-full">
                    {f.domain.replace("_", " ")}
                  </span>
                  <span className="text-xs font-medium tracking-wide text-[#5a5a5a] capitalize bg-[#f7f7f9] border border-[#e5e5e5] px-2.5 py-1 rounded-full">
                    {f.difficulty}
                  </span>
                </div>

                <button
                  onClick={() => handleUnflag(f.question_id)}
                  className="text-xs font-medium text-[#5a5a5a] hover:text-[#b3261e] px-3 py-1 rounded-full border border-[#e5e5e5] hover:border-red-200 transition-colors duration-150 flex items-center gap-1"
                  title="Remove from review queue"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Unflag
                </button>
              </div>

              <h2 className="text-base font-medium text-[#0d0d0d] leading-relaxed">
                {f.stem}
              </h2>

              {/* Choices with highlighted correct answers */}
              {f.choices && f.choices.length > 0 && (
                <div className="space-y-2 text-xs">
                  {f.choices.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        c.is_correct
                          ? "bg-[#e6f7ee] border-[#8ed4b0] text-[#0e6245] font-medium"
                          : "bg-[#f7f7f9] border-[#e5e5e5] text-[#5a5a5a]"
                      }`}
                    >
                      <span>{c.text}</span>
                      {c.is_correct && (
                        <span className="text-[#0e6245] text-[11px] font-bold ml-2">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Technical Explanation */}
              {f.explanation && (
                <div className="bg-[#e8ecff]/40 p-4 rounded-xl border border-[#e8ecff] text-xs space-y-1">
                  <p className="font-medium text-[#1a2a8a]">Explanation:</p>
                  <p className="text-[#5a5a5a] leading-relaxed">{f.explanation}</p>
                </div>
              )}

              {/* Custom Note if any */}
              {f.note && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <span className="font-medium">Note:</span>
                  <span>{f.note}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
