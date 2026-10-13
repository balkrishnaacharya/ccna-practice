import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link } from "react-router-dom";

export default function Exam({ onProgressChange }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  // answers: { [questionId]: choiceId[] }
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState(120 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // Task 2: separate modal for "last question, click Next"
  const [showLastQModal, setShowLastQModal] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [showMobileNav, setShowMobileNav] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    loadExamQuestions();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!loading && !examResult && secondsRemaining > 0) {
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
  }, [loading, examResult]);

  async function loadExamQuestions() {
    setLoading(true);
    try {
      const qs = await invoke("get_exam_questions");
      setQuestions(qs);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load exam questions:", err);
      setLoading(false);
    }
  }

  // Task 1: radio vs checkbox selection in exam
  function handleSelectChoice(choiceId, isMultiSelect) {
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
      // Radio: replace
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
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // Task 2: count answered from answers state (not from nav position)
  const answeredCount = questions.filter((q) => (answers[q.id] || []).length > 0).length;
  const unansweredCount = questions.length - answeredCount;

  useEffect(() => {
    onProgressChange?.(!loading && !examResult && questions.length > 0, unansweredCount);
  }, [onProgressChange, loading, examResult, questions.length, unansweredCount]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4d6bfe] border-t-transparent"></div>
        <p className="text-[#5a5a5a] font-medium text-sm">
          Generating 100-question weighted CCNA 2.0 exam paper...
        </p>
      </div>
    );
  }

  if (examResult) {
    return renderScoreReport();
  }

  const currentQ = questions[currentIndex];
  const selectedChoices = answers[currentQ?.id] || [];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="space-y-6">
      {/* Top Exam Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white border border-[#e5e5e5] rounded-2xl shadow-sm">
        <div>
          <span className="text-xs font-medium tracking-wide uppercase text-[#1a2a8a] bg-[#e8ecff] px-3 py-1 rounded-full">
            CCNA 2.0 Full Exam Simulator
          </span>
          <p className="text-sm font-medium text-[#0d0d0d] mt-2">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border font-mono text-sm font-semibold ${
              secondsRemaining < 600
                ? "bg-red-50 text-[#b3261e] border-[#f0a5a0] animate-pulse"
                : "bg-[#f7f7f9] text-[#0d0d0d] border-[#e5e5e5]"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={unansweredCount > 0 || isSubmitting}
            className="px-5 py-2 bg-[#4d6bfe] hover:bg-[#3b59e9] text-white rounded-full text-xs font-medium tracking-wide shadow-sm transition-colors duration-150 disabled:bg-[#d1d5db] disabled:text-[#6b7280] disabled:shadow-none disabled:cursor-not-allowed"
          >
            {unansweredCount > 0 ? `Finish Exam (${unansweredCount} unanswered)` : "Finish Exam"}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question & Choices */}
        <div className="lg:col-span-3 border border-[#e5e5e5] rounded-2xl p-5 sm:p-6 bg-white shadow-sm space-y-5">
          <div className="flex justify-between items-start gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium uppercase tracking-wide text-[#1a2a8a] bg-[#e8ecff] px-2.5 py-1 rounded-full">
                  {currentQ.domain.replace(/_/g, " ")}
                </span>
                {/* Task 1: multi-select hint in exam */}
                {currentQ.multi_select && (
                  <span className="text-xs font-medium text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">
                    Select all that apply
                  </span>
                )}
              </div>
              <h2 className="text-lg font-medium text-[#0d0d0d] leading-relaxed pt-1">
                {currentQ.stem}
              </h2>
            </div>

            <button
              onClick={toggleQuestionFlag}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium tracking-wide border transition-colors duration-150 shrink-0 ${
                flagged.has(currentQ.id)
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-white text-[#5a5a5a] border-[#e5e5e5] hover:bg-[#f7f7f9] hover:text-[#0d0d0d]"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill={flagged.has(currentQ.id) ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              <span>{flagged.has(currentQ.id) ? "Flagged" : "Flag"}</span>
            </button>
          </div>

          {/* Task 1: radio vs checkbox in exam */}
          <div className="space-y-3 pt-2">
            {currentQ.choices.map((c) => {
              const isSelected = selectedChoices.includes(c.id);
              const inputType = currentQ.multi_select ? "checkbox" : "radio";
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectChoice(c.id, currentQ.multi_select)}
                  className={`block w-full rounded-xl border p-4 text-sm cursor-pointer transition-colors duration-150 ${
                    isSelected
                      ? "border-[#4d6bfe] bg-[#e8ecff] text-[#1a2a8a]"
                      : "border-[#e5e5e5] hover:border-[#4d6bfe] text-[#0d0d0d] bg-white"
                  }`}
                >
                  <div className="flex items-start">
                    <input
                      type={inputType}
                      name={`exam-q-${currentQ.id}`}
                      className={`mt-0.5 mr-3.5 text-[#4d6bfe] focus:ring-[#4d6bfe] ${inputType === "checkbox" ? "rounded" : ""}`}
                      checked={isSelected}
                      readOnly
                    />
                    <span className="select-none leading-relaxed">{c.text}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#e5e5e5]">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-5 py-2.5 border border-[#e5e5e5] rounded-full text-xs font-medium tracking-wide text-[#5a5a5a] hover:bg-[#f7f7f9] hover:text-[#0d0d0d] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
            >
              ← Previous
            </button>

            <span className="text-xs text-[#5a5a5a] font-medium tracking-wide">
              {answeredCount} of {questions.length} answered
            </span>

            {/* Task 2: last question → show confirm instead of disabling Next */}
            {isLastQuestion ? (
              <button
                onClick={() => setShowLastQModal(true)}
                className="px-6 py-2.5 bg-[#4d6bfe] hover:bg-[#3b59e9] text-white rounded-full text-xs font-medium tracking-wide transition-colors duration-150 shadow-sm"
              >
                Finish →
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-6 py-2.5 bg-[#4d6bfe] hover:bg-[#3b59e9] text-white rounded-full text-xs font-medium tracking-wide transition-colors duration-150 shadow-sm"
              >
                Next →
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="border border-[#e5e5e5] rounded-2xl p-5 bg-white shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#e5e5e5]">
            <h3 className="text-xs font-medium text-[#0d0d0d] uppercase tracking-wide">
              Question Navigator
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5a5a5a] font-medium">
                {answeredCount}/{questions.length}
              </span>
              <button
                onClick={() => setShowMobileNav(!showMobileNav)}
                className="lg:hidden text-xs text-[#4d6bfe] font-medium px-2 py-1 bg-[#e8ecff] rounded-full"
              >
                {showMobileNav ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#5a5a5a]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4d6bfe]"></span>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Flagged</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f7f7f9] border border-[#e5e5e5]"></span>
              <span>Pending</span>
            </div>
          </div>

          <div className={`${showMobileNav ? "block" : "hidden lg:block"}`}>
            <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-2 max-h-[460px] overflow-y-auto p-1">
              {questions.map((q, idx) => {
                // Task 2: check answers[q.id] length, not currentIndex
                const hasAnswer = (answers[q.id] || []).length > 0;
                const isFlag = flagged.has(q.id);
                const isCurrent = idx === currentIndex;

                let bgClass = "bg-[#f7f7f9] text-[#5a5a5a] border border-[#e5e5e5] hover:bg-gray-100";
                if (hasAnswer) bgClass = "bg-[#4d6bfe] text-white border-[#4d6bfe]";
                else if (isFlag) bgClass = "bg-amber-400 text-gray-900 border-amber-400 font-bold";

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowMobileNav(false);
                    }}
                    className={`w-9 h-9 rounded-lg text-xs font-mono font-medium transition-all relative flex items-center justify-center shrink-0 ${bgClass} ${
                      isCurrent ? "ring-2 ring-[#0d0d0d] ring-offset-1 scale-105 z-10" : ""
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
      </div>

      {/* Finish Exam Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 border border-[#e5e5e5]">
            <h3 className="text-xl font-medium text-[#0d0d0d]">Submit Examination?</h3>
            <p className="text-sm text-[#5a5a5a] leading-relaxed">
              You have answered{" "}
              <strong className="text-[#0d0d0d]">{answeredCount}</strong> of{" "}
              <strong className="text-[#0d0d0d]">{questions.length}</strong> questions.
              {questions.length - answeredCount > 0 && (
                <span className="block mt-3 text-[#b3261e] bg-[#fdecea] p-3 rounded-2xl border border-[#f0a5a0] text-xs">
                  ⚠️ You have {questions.length - answeredCount} unanswered questions.
                  Unanswered questions receive 0 marks.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 border border-[#e5e5e5] rounded-full text-xs font-medium tracking-wide text-[#5a5a5a] hover:bg-[#f7f7f9] transition-colors"
              >
                Return to Exam
              </button>
              <button
                onClick={submitExamFinal}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#4d6bfe] hover:bg-[#3b59e9] text-white rounded-full text-xs font-medium tracking-wide shadow-sm transition-colors"
              >
                {isSubmitting ? "Calculating..." : "Yes, Submit Exam"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task 2: Last-question Next button modal */}
      {showLastQModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 border border-[#e5e5e5]">
            <h3 className="text-xl font-medium text-[#0d0d0d]">This is the last question</h3>
            <p className="text-sm text-[#5a5a5a] leading-relaxed">
              You have answered{" "}
              <strong className="text-[#0d0d0d]">{answeredCount}</strong> of{" "}
              <strong className="text-[#0d0d0d]">{questions.length}</strong> questions.
              {questions.length - answeredCount > 0 && (
                <span className="block mt-3 text-[#b3261e] bg-[#fdecea] p-3 rounded-2xl border border-[#f0a5a0] text-xs">
                  ⚠️ You have {questions.length - answeredCount} unanswered question
                  {questions.length - answeredCount !== 1 ? "s" : ""}. Submit anyway?
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setShowLastQModal(false)}
                className="px-5 py-2.5 border border-[#e5e5e5] rounded-full text-xs font-medium tracking-wide text-[#5a5a5a] hover:bg-[#f7f7f9] transition-colors"
              >
                Go Back &amp; Review
              </button>
              <button
                onClick={submitExamFinal}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#4d6bfe] hover:bg-[#3b59e9] text-white rounded-full text-xs font-medium tracking-wide shadow-sm transition-colors"
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
      session_id,
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
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Result Banner */}
        <div
          className={`rounded-2xl p-8 border shadow-sm text-center ${
            passed
              ? "bg-gradient-to-b from-[#e6f7ee] to-white border-[#8ed4b0]"
              : "bg-gradient-to-b from-[#fdecea] to-white border-[#f0a5a0]"
          }`}
        >
          {passed ? (
            <span className="inline-block bg-[#e6f7ee] text-[#0e6245] px-4 py-1.5 rounded-full border border-[#8ed4b0] text-xs font-medium mb-3">
              Result: PASS
            </span>
          ) : (
            <span className="inline-block bg-[#fdecea] text-[#b3261e] px-4 py-1.5 rounded-full border border-[#f0a5a0] text-xs font-medium mb-3">
              Result: FAIL
            </span>
          )}

          <h1 className="text-4xl font-semibold text-[#0d0d0d] tracking-tight">
            {scaled_score} <span className="text-xl font-normal text-[#5a5a5a]">/ 1000</span>
          </h1>

          <p className="text-sm font-medium text-[#5a5a5a] mt-2">
            Passing Standard: <strong>825 / 1000 (82.5%)</strong> • Raw Score:{" "}
            <strong>{score} / {total_questions}</strong> ({percentage}%)
          </p>
          <p className="text-xs text-[#5a5a5a] mt-1">
            Time Taken: {Math.floor(time_spent_seconds / 60)} min {time_spent_seconds % 60}s
          </p>

          <div className="flex justify-center gap-3 mt-6 flex-wrap">
            <button
              onClick={() => {
                setExamResult(null);
                setAnswers({});
                setFlagged(new Set());
                setSecondsRemaining(120 * 60);
                loadExamQuestions();
              }}
              className="px-6 py-2.5 bg-[#4d6bfe] hover:bg-[#3b59e9] text-white text-xs font-medium tracking-wide rounded-full shadow-sm transition-colors duration-150"
            >
              Take Another Exam
            </button>
            {/* Task 3: link to history */}
            <Link
              to="/history"
              className="px-6 py-2.5 border border-[#4d6bfe] text-[#4d6bfe] hover:bg-[#e8ecff] text-xs font-medium tracking-wide rounded-full transition-colors duration-150"
            >
              View Exam History
            </Link>
            <Link
              to="/"
              className="px-6 py-2.5 border border-[#e5e5e5] hover:bg-[#f7f7f9] text-[#5a5a5a] hover:text-[#0d0d0d] text-xs font-medium tracking-wide rounded-full transition-colors duration-150"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>

        {/* Domain Breakdown */}
        <div className="border border-[#e5e5e5] rounded-2xl p-5 sm:p-6 bg-white shadow-sm space-y-4">
          <h2 className="text-base font-medium text-[#0d0d0d]">Blueprint Domain Breakdown</h2>
          <div className="space-y-4">
            {domain_scores.map((ds) => (
              <div key={ds.domain} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#0d0d0d] capitalize">{ds.domain.replace(/_/g, " ")}</span>
                  <span className="text-[#0d0d0d] font-semibold">
                    {ds.correct} / {ds.total} ({ds.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#e8ecff] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      ds.percentage >= 82.5
                        ? "bg-emerald-500"
                        : ds.percentage >= 60
                        ? "bg-amber-400"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${ds.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Review */}
        <div className="border border-[#e5e5e5] rounded-2xl p-5 sm:p-6 bg-white shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-medium text-[#0d0d0d]">Detailed Question Review</h2>
              <p className="text-xs text-[#5a5a5a] mt-0.5">
                Examine your answers against correct choices and technical explanations.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "incorrect", "flagged"].map((f) => (
                <button
                  key={f}
                  onClick={() => setReviewFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide border capitalize transition-colors duration-150 ${
                    reviewFilter === f
                      ? "bg-[#4d6bfe] text-white border-[#4d6bfe] shadow-sm"
                      : "border-[#e5e5e5] text-[#5a5a5a] hover:bg-[#f7f7f9] hover:text-[#0d0d0d]"
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
                  r.is_correct
                    ? "border-[#8ed4b0] bg-[#e6f7ee]/30"
                    : "border-[#f0a5a0] bg-[#fdecea]/30"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-medium uppercase text-[#5a5a5a] tracking-wide">
                    Q{i + 1} • {r.domain.replace(/_/g, " ")}
                    {r.subtopic ? ` • ${r.subtopic}` : ""}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      r.is_correct
                        ? "bg-[#e6f7ee] text-[#0e6245] border border-[#8ed4b0]"
                        : "bg-[#fdecea] text-[#b3261e] border border-[#f0a5a0]"
                    }`}
                  >
                    {r.is_correct ? "Correct" : "Incorrect"}
                  </span>
                </div>

                <h3 className="text-sm font-medium text-[#0d0d0d]">{r.stem}</h3>

                <div className="space-y-2 text-xs">
                  {r.choices.map((c) => {
                    const isUserPick = r.user_choice_ids.includes(c.id);
                    const isRight = c.is_correct;

                    let choiceClass = "border-[#e5e5e5] bg-white text-[#0d0d0d]";
                    if (isRight) choiceClass = "border-[#8ed4b0] bg-[#e6f7ee] text-[#0e6245] font-medium";
                    else if (isUserPick && !isRight) choiceClass = "border-[#f0a5a0] bg-[#fdecea] text-[#b3261e] line-through";

                    return (
                      <div key={c.id} className={`p-3 rounded-xl border flex items-center justify-between ${choiceClass}`}>
                        <span>{c.text}</span>
                        {isRight && <span className="text-[11px] font-bold text-[#0e6245] ml-2">✓ Correct</span>}
                        {isUserPick && !isRight && <span className="text-[11px] font-bold text-[#b3261e] ml-2">✗ Your Pick</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#e5e5e5] text-xs space-y-1">
                  <p className="font-medium text-[#0d0d0d]">Explanation:</p>
                  <p className="text-[#5a5a5a] leading-relaxed">{r.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
