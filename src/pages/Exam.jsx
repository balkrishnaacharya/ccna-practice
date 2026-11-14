import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ExamConfirmationModal from "@/components/shared/ConfirmDialog";

export default function Exam({ reportExamProgress }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [hasStarted, setHasStarted] = useState(Boolean(location.state?.started));
  const [showPreflightModal, setShowPreflightModal] = useState(!location.state?.started);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState(120 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLastQModal, setShowLastQModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [examError, setExamError] = useState(null);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [showMobileNav, setShowMobileNav] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    loadExamQuestions();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  function handleExplicitExit() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    reportExamProgress?.(false, 0);
    navigate("/");
  }

  // Timer only starts if hasStarted is true, loading is done, no result, and seconds remain
  useEffect(() => {
    if (hasStarted && !loading && !examResult && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            submitExamFinal();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [hasStarted, loading, examResult]);

  async function loadExamQuestions() {
    setLoading(true);
    try {
      const qs = await invoke("get_exam_questions");
      setQuestions(qs);
      if (!qs || qs.length === 0) {
        setExamError("No exam questions available. Please try again.");
      } else {
        setExamError(null);
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to load exam questions:", err);
      setLoading(false);
    }
  }

  function handleStartConfirmed() {
    setShowPreflightModal(false);
    setHasStarted(true);
  }

  function handleCancelPreflight() {
    setShowPreflightModal(false);
    navigate(window.history.length > 1 ? -1 : "/");
  }

  async function handleSelectChoice(choiceId, isMultiSelect) {
    const q = questions[currentIndex];
    const currentSelected = answers[q.id] || [];
    let updated;
    if (isMultiSelect) {
      if (currentSelected.includes(choiceId)) {
        updated = currentSelected.filter((id) => id !== choiceId);
      } else {
        updated = [...currentSelected, choiceId];
      }
    } else {
      updated = [choiceId];
    }
    setAnswers({ ...answers, [q.id]: updated });
  }

  async function toggleQuestionFlag() {
    const q = questions[currentIndex];
    try {
      const isNowFlagged = await invoke("toggle_flag", {
        questionId: q.id,
        note: `Flagged during Exam Mode`,
      });
      const nextFlags = new Set(flagged);
      if (isNowFlagged) nextFlags.add(q.id);
      else nextFlags.delete(q.id);
      setFlagged(nextFlags);
    } catch (err) {
      console.error(err);
    }
  }

  async function submitExamFinal() {
    setIsSubmitting(true);
    setShowConfirmModal(false);
    setShowLastQModal(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpent = 120 * 60 - secondsRemaining;
    const payload = {
      time_spent_seconds: timeSpent,
      answers: questions.map((q) => ({
        question_id: q.id,
        choice_ids: answers[q.id] || [],
      })),
    };

    try {
      const result = await invoke("submit_exam", { payload });
      setExamResult(result);
    } catch (err) {
      console.error("Failed to submit exam:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h > 0 ? `${h}:` : ""}${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }

  const answeredCount = questions.filter((q) => (answers[q.id] || []).length > 0).length;
  const unansweredCount = questions.length - answeredCount;

  useEffect(() => {
    reportExamProgress?.(hasStarted && !loading && !examResult && questions.length > 0, unansweredCount);
  }, [reportExamProgress, hasStarted, loading, examResult, questions.length, unansweredCount]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-9 w-9 border-2 border-gold border-t-transparent"></div>
        <p className="text-paper-muted font-sans text-sm">
          Generating 100-question CCNA 2.0 blueprint exam paper...
        </p>
      </div>
    );
  }

  if (examError || questions.length === 0) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-paper-muted font-sans text-sm">{examError || "No questions available."}</p>
        <button
          onClick={loadExamQuestions}
          className="px-5 py-2.5 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-full text-xs transition-all shadow-gold-glow"
        >
          Retry
        </button>
      </div>
    );
  }

  if (examResult) {
    return renderScoreReport();
  }

  const currentQ = questions[currentIndex] ?? null;
  const selectedChoices = answers[currentQ?.id] || [];

  return (
    <div className="min-h-screen bg-dark/95">
      {/* Preflight Modal if user landed directly on /exam without confirmation */}
      {showPreflightModal && (
        <ExamConfirmationModal
          isOpen={showPreflightModal}
          onCancel={handleCancelPreflight}
          onConfirm={handleStartConfirmed}
        />
      )}

      {/* Top Header - minimal, dark, gold accent */}
      <header className="px-6 py-3 bg-dark/80 border-b border-dark-border/50 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gold bg-gold/10 border border-gold/30 px-3 py-1 rounded-full">
              CCNA 2.0 Full Exam Simulator
            </span>
            <p className="text-sm font-medium text-paper">
              Question <span className="font-serif text-base text-gold">{currentIndex + 1}</span> of {questions.length}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={toggleQuestionFlag}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  flagged.has(currentQ?.id)
                    ? "bg-gold/20 text-gold border-gold shadow-gold-glow"
                    : "bg-transparent text-paper-muted border-border hover:border-gold/40 hover:text-gold"
                }`}
                title={flagged.has(currentQ?.id) ? "Click to unflag" : "Flag this question"}
              >
                <svg
                  className="w-3 h-3"
                  fill={flagged.has(currentQ?.id) ? "currentColor" : "none"}
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
                {flagged.has(currentQ?.id) ? "Flagged" : "Flag"}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-paper">
                {formatTime(secondsRemaining)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        {/* Question Stem */}
        <div className="border-b border-dark-border/50 pb-5 mb-6">
          <h2 className="font-serif text-xl sm:text-2xl text-paper font-normal leading-relaxed">
            {currentQ?.stem}
          </h2>
        </div>

        {/* Choices */}
        <div className="space-y-3 pt-1">
          {currentQ?.choices.map((c) => {
            const isSelected = selectedChoices.includes(c.id);
            const inputType = currentQ.multi_select ? "checkbox" : "radio";
            const isRadio = inputType === "radio";
            const letter = isRadio
              ? String.fromCharCode(65 + currentQ.choices.indexOf(c))
              : String.fromCharCode(97 + currentQ.choices.indexOf(c));
            const checkboxClass = inputType === "checkbox" ? "rounded" : "";
            return (
              <div
                key={c.id}
                onClick={() => handleSelectChoice(c.id, currentQ.multi_select)}
                className={"block rounded-xl border p-4 text-sm cursor-pointer transition-all duration-200 " + (isSelected ? "border-gold bg-gold/10 text-gold" : "border-border bg-card")}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={"mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs font-mono " + (isSelected ? "border-gold bg-gold/20 text-gold" : "border-border text-paper-dim")}
                  >
                    {letter}
                  </span>
                  <input
                    type={inputType}
                    name={"exam-q-" + currentQ.id}
                    className={"mt-0.5 mr-3.5 accent-gold text-gold focus:ring-gold " + checkboxClass}
                    checked={isSelected}
                    readOnly
                  />
                  <span className="leading-relaxed select-none font-sans">{c.text}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-5 border-t border-dark-border/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 border border-dark-border rounded-full text-xs font-medium text-paper-muted hover:text-paper hover:bg-dark-surface disabled:opacity-25 disabled:pointer-events-none transition-colors"
            >
              Previous
            </button>

            <span className="text-xs font-mono text-paper-muted">
              {answeredCount} / {questions.length} answered
            </span>
          </div>

          <div className="flex gap-2">
            {isLastQuestion ? (
              <button
                onClick={() => setShowLastQModal(true)}
                className="px-5 py-2.5 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-full text-xs shadow-gold-glow transition-all"
              >
                Finish Exam
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2.5 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-full text-xs shadow-gold-glow transition-all"
              >
                Next Question
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Question Navigator - compact, always visible on mobile */}
      <div className="mt-4 max-w-7xl mx-auto px-6">
        <div className="border border-dark-border/50 rounded-2xl p-4 bg-dark-card shadow-sm space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-dark-border/50">
            <h3 className="text-xs font-semibold text-paper">Question Grid</h3>
            <div className="flex items-center gap-2 text-xs text-paper-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-gold"></span>
              <span>Answered</span>
              <span className="w-2.5 h-2.5 rounded-full bg-peach"></span>
              <span>Flagged</span>
              <span className="w-2.5 h-2.5 rounded-full bg-dark-surface border border-dark-border"></span>
              <span>Pending</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5 max-h-[460px] overflow-y-auto">
            {questions.map((q, idx) => {
              const hasAnswer = (answers[q.id] || []).length > 0;
              const isFlag = flagged.has(q.id);
              const isCurrent = idx === currentIndex;

              let bgClass = "bg-dark-surface text-paper-dim border border-dark-border hover:border-gold/40 hover:text-paper";
              if (hasAnswer) bgClass = "bg-gold text-dark-bg font-semibold border-gold shadow-gold-glow";
              else if (isFlag) bgClass = "bg-peach text-dark-bg font-semibold border-peach";

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                  }}
                  className={`w-full rounded-lg text-xs font-mono font-medium transition-all relative flex items-center justify-center shrink-0 ${bgClass} ${
                    isCurrent ? "ring-2 ring-paper ring-offset-2 ring-offset-dark-card scale-105 z-10" : ""
                  }`}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Finish Exam Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card rounded-2xl max-w-md w-full p-6 shadow-dock space-y-4 border border-dark-border text-paper">
            <h3 className="font-serif text-xl font-semibold text-paper">Submit Examination?</h3>
            <p className="text-sm text-paper-muted leading-relaxed">
              You have answered <strong className="text-paper">{answeredCount}</strong> of{" "}
              <strong className="text-paper">{questions.length}</strong> questions.
              {questions.length - answeredCount > 0 && (
                <span className="block mt-3 text-heart-light bg-heart/15 p-3 rounded-xl border border-heart/30 text-xs">
                  ⚠️ You have {questions.length - answeredCount} unanswered questions. Unanswered questions receive 0 marks.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 border border-dark-border rounded-full text-xs font-medium text-paper-muted hover:text-paper hover:bg-dark-surface transition-colors"
              >
                Return to Exam
              </button>
              <button
                onClick={submitExamFinal}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-full text-xs shadow-gold-glow transition-all"
              >
                {isSubmitting ? "Calculating..." : "Yes, Submit Exam"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Last-question Next button modal */}
      {showLastQModal && (
        <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card rounded-2xl max-w-md w-full p-6 shadow-dock space-y-4 border border-dark-border text-paper">
            <h3 className="font-serif text-xl font-semibold text-paper">This is the last question</h3>
            <p className="text-sm text-paper-muted leading-relaxed">
              You have answered <strong className="text-paper">{answeredCount}</strong> of{" "}
              <strong className="text-paper">{questions.length}</strong> questions.
              {questions.length - answeredCount > 0 && (
                <span className="block mt-3 text-heart-light bg-heart/15 p-3 rounded-xl border border-heart/30 text-xs">
                  ⚠️ You have {questions.length - answeredCount} unanswered question
                  {questions.length - answeredCount !== 1 ? "s" : ""}. Submit anyway?
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setShowLastQModal(false)}
                className="px-5 py-2.5 border border-dark-border rounded-full text-xs font-medium text-paper-muted hover:text-paper hover:bg-dark-surface transition-colors"
              >
                Go Back & Review
              </button>
              <button
                onClick={submitExamFinal}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-full text-xs shadow-gold-glow transition-all"
              >
                {isSubmitting ? "Calculating..." : "Submit Exam"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderScoreReport() {
    const {
      total_questions,
      score,
      percentage,
      scaled_score,
      passed,
      time_spent_seconds,
      domain_scores,
      reviews,
    } = examResult;

    const filteredReviews = reviews.filter((r) => {
      if (reviewFilter === "incorrect") return !r.is_correct;
      if (reviewFilter === "flagged") return flagged.has(r.question_id);
      return true;
    });

    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        {/* Result Banner */}
        <div
          className={`rounded-2xl p-8 border shadow-dock text-center space-y-3 relative overflow-hidden ${
            passed
              ? "bg-dark-card border-sage/40"
              : "bg-dark-card border-heart/40"
          }`}
        >
          {passed ? (
            <span className="inline-block bg-sage/20 text-sage-light px-4 py-1.5 rounded-full border border-sage/40 text-xs font-semibold mb-1 shadow-sage-glow">
              Result: PASS
            </span>
          ) : (
            <span className="inline-block bg-heart/20 text-heart-light px-4 py-1.5 rounded-full border border-heart/40 text-xs font-semibold mb-1 shadow-heart-glow">
              Result: FAIL
            </span>
          )}

          <h1 className="font-serif text-5xl font-semibold text-paper tracking-tight">
            {scaled_score} <span className="text-xl font-normal text-paper-dim">/ 1000</span>
          </h1>

          <p className="text-sm font-medium text-paper-muted">
            Passing Standard: <strong className="text-peach">825 / 1000 (82.5%)</strong> • Raw Score:{" "}
            <strong className="text-paper">{score} / {total_questions}</strong> ({percentage}%)
          </p>
          <p className="text-xs text-paper-dim">
            Time Taken: {Math.floor(time_spent_seconds / 60)} min {time_spent_seconds % 60}s
          </p>

          <div className="flex justify-center gap-3 mt-6 flex-wrap pt-2">
            <button
              onClick={() => {
                setExamResult(null);
                setAnswers({});
                setFlagged(new Set());
                setSecondsRemaining(120 * 60);
                setHasStarted(false);
                setShowPreflightModal(true);
                loadExamQuestions();
              }}
              className="px-6 py-2.5 bg-gold hover:bg-gold-hover text-dark-bg text-xs font-semibold rounded-full shadow-gold-glow transition-all"
            >
              Take Another Exam
            </button>
            <Link
              to="/history"
              className="px-6 py-2.5 border border-gold/40 text-gold hover:bg-gold/15 text-xs font-medium rounded-full transition-colors"
            >
              View Exam History
            </Link>
            <Link
              to="/"
              className="px-6 py-2.5 border border-dark-border hover:bg-dark-surface text-paper-muted hover:text-paper text-xs font-medium rounded-full transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>

        {/* Domain Breakdown */}
        <div className="border border-dark-border rounded-2xl p-6 bg-dark-card shadow-dock space-y-4">
          <h2 className="font-serif text-xl font-semibold text-paper">Blueprint Domain Breakdown</h2>
          <div className="space-y-4">
            {domain_scores.map((ds) => (
              <div key={ds.domain} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-paper capitalize">{ds.domain.replace(/_/g, " ")}</span>
                  <span className="text-paper font-semibold">
                    {ds.correct} / {ds.total} ({ds.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-dark-surface rounded-full overflow-hidden border border-dark-borderSubtle">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      ds.percentage >= 82.5
                        ? "bg-sage shadow-sage-glow"
                        : ds.percentage >= 60
                        ? "bg-gold shadow-gold-glow"
                        : "bg-heart shadow-heart-glow"
                    }`}
                    style={{ width: `${ds.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Review */}
        <div className="border border-dark-border rounded-2xl p-6 bg-dark-card shadow-dock space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl font-semibold text-paper">Detailed Question Review</h2>
              <p className="text-xs text-paper-dim mt-0.5">
                Examine your answers against correct choices and technical explanations.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "incorrect", "flagged"].map((f) => (
                <button
                  key={f}
                  onClick={() => setReviewFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${
                    reviewFilter === f
                      ? "bg-gold text-dark-bg border-gold shadow-gold-glow font-semibold"
                      : "border-dark-border text-paper-muted hover:bg-dark-surface hover:text-paper"
                  }`}
                >
                  {f} (
                  {f === "all"
                    ? reviews.length
                    : f === "incorrect"
                    ? reviews.filter((r) => !r.is_correct).length
                    : reviews.filter((r) => flagged.has(r.question_id)).length}
                  )
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredReviews.map((r, i) => (
              <div
                key={r.question_id}
                className={`p-5 rounded-2xl border space-y-3 ${
                  r.is_correct ? "border-sage/40 bg-sage/5" : "border-heart/40 bg-heart/5"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-medium text-paper-dim">
                    Q{i + 1} • {r.domain.replace(/_/g, " ")}
                    {r.subtopic ? ` • ${r.subtopic}` : ""}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      r.is_correct
                        ? "bg-sage/20 text-sage-light border border-sage/40"
                        : "bg-heart/20 text-heart-light border border-heart/40"
                    }`}
                  >
                    {r.is_correct ? "Correct" : "Incorrect"}
                  </span>
                </div>

                <h3 className="font-serif text-base font-normal text-paper leading-snug">{r.stem}</h3>

                <div className="space-y-2 text-xs">
                  {r.choices.map((c) => {
                    const isUserPick = r.user_choice_ids.includes(c.id);
                    const isRight = c.is_correct;

                    let choiceClass = "border-dark-border bg-dark-surface/60 text-paper-muted";
                    if (isRight) choiceClass = "border-sage/60 bg-sage/20 text-sage-light font-semibold shadow-sage-glow";
                    else if (isUserPick && !isRight) choiceClass = "border-heart/60 bg-heart/20 text-heart-light line-through";

                    return (
                      <div key={c.id} className={`p-3 rounded-xl border flex items-center justify-between ${choiceClass}`}>
                        <span>{c.text}</span>
                        {isRight && <span className="text-xs font-bold text-sage-light ml-2">✓ Correct</span>}
                        {isUserPick && !isRight && <span className="text-xs font-bold text-heart-light ml-2">✗ Your Pick</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-dark-surface/70 p-4 rounded-xl border border-dark-border text-xs space-y-1">
                  <p className="font-semibold text-paper">Explanation:</p>
                  <p className="text-paper-muted leading-relaxed font-sans">{r.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}