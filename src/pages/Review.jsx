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
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-paper">
            Review Queue
          </h1>
          <p className="text-sm text-paper-muted mt-1 font-sans">
            Questions flagged during practice sessions and exams.
          </p>
        </div>

        {flags.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-paper-dim font-medium tracking-wide">Domain:</span>
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="text-xs border border-dark-border rounded-xl px-3 py-2 bg-dark-card text-paper focus:outline-none focus:ring-1 focus:ring-gold"
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
        <div className="py-24 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent"></div>
          <p className="text-paper-muted text-sm font-sans">Loading review queue...</p>
        </div>
      ) : flags.length === 0 ? (
        <div className="border border-dark-border rounded-2xl p-12 bg-dark-card text-center shadow-dock space-y-4">
          <div className="w-14 h-14 bg-gold/15 text-gold border border-gold/30 rounded-full flex items-center justify-center mx-auto shadow-gold-glow">
            <svg
              className="w-7 h-7"
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
          <h3 className="font-serif text-xl font-medium text-paper">
            No flagged questions yet
          </h3>
          <p className="text-sm text-paper-muted max-w-sm mx-auto leading-relaxed font-sans">
            Whenever you encounter a tricky question during practice or exam simulations, tap the "Flag" button to study it here.
          </p>
          <div className="pt-2">
            <Link
              to="/quiz"
              className="px-6 py-2.5 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-full text-xs tracking-wider uppercase shadow-gold-glow transition-all duration-150 inline-block"
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
              className="border border-dark-border rounded-2xl p-6 bg-dark-card shadow-dock space-y-4"
            >
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-wider uppercase text-gold bg-gold/10 border border-gold/30 px-3 py-1 rounded-full">
                    {f.domain.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs font-medium tracking-wide text-paper-dim capitalize bg-dark-surface border border-dark-border px-3 py-1 rounded-full">
                    {f.difficulty}
                  </span>
                </div>

                <button
                  onClick={() => handleUnflag(f.question_id)}
                  className="text-xs font-medium text-paper-dim hover:text-heart-light px-3.5 py-1.5 rounded-full border border-dark-border hover:border-heart/40 transition-colors flex items-center gap-1.5"
                  title="Remove from review queue"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Unflag
                </button>
              </div>

              <h2 className="font-serif text-lg font-normal text-paper leading-relaxed">
                {f.stem}
              </h2>

              {/* Choices with highlighted correct answers */}
              {f.choices && f.choices.length > 0 && (
                <div className="space-y-2 text-xs">
                  {f.choices.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        c.is_correct
                          ? "bg-sage/20 border-sage/50 text-sage-light font-semibold shadow-sage-glow"
                          : "bg-dark-surface/60 border-dark-border text-paper-muted"
                      }`}
                    >
                      <span className="font-sans">{c.text}</span>
                      {c.is_correct && (
                        <span className="text-sage-light text-xs font-bold ml-2">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Technical Explanation */}
              {f.explanation && (
                <div className="bg-dark-surface/70 p-4 rounded-xl border border-dark-border text-xs space-y-1">
                  <p className="font-semibold text-paper">Explanation:</p>
                  <p className="text-paper-muted leading-relaxed font-sans">{f.explanation}</p>
                </div>
              )}

              {/* Custom Note if any */}
              {f.note && (
                <div className="bg-peach/10 p-3.5 rounded-xl border border-peach/30 text-xs text-peach flex items-center gap-2">
                  <span className="font-semibold">Note:</span>
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
