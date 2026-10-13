import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";

const MODES = [
  { id: "easy", label: "Easy", desc: "No timer, fundamental concepts" },
  { id: "medium", label: "Medium", desc: "Standard difficulty, 90s pace" },
  { id: "hard", label: "Hard", desc: "Complex scenarios, 60s pace" },
  { id: "impossible", label: "Impossible", desc: "Multi-concept tricky questions" },
  { id: "exam", label: "Exam Mode", desc: "120-min full 100-Q timed simulation" },
];

export default function Quiz() {
  const [mode, setMode] = useState("easy");
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isFlagged, setIsFlagged] = useState(false);
  const [flagNote, setFlagNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (mode === "exam") return;
    loadQuestion();
  }, [mode]);

  async function loadQuestion() {
    setLoading(true);
    setFeedback(null);
    setSelected([]);
    setShowNoteInput(false);
    try {
      const q = await invoke("get_random_question", { mode });
      setQuestion(q);
      if (q) checkFlagStatus(q.id);
    } catch (err) {
      console.error("Failed to load question:", err);
    } finally {
      setLoading(false);
    }
  }

  async function checkFlagStatus(questionId) {
    try {
      const note = await invoke("get_flag_status", { questionId });
      setIsFlagged(note !== null);
      setFlagNote(note || "");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggleFlag() {
    if (!question) return;
    try {
      const nextStatus = await invoke("toggle_flag", {
        questionId: question.id,
        note: flagNote.trim() || "Flagged for review",
      });
      setIsFlagged(nextStatus);
      if (!nextStatus) {
        setFlagNote("");
        setShowNoteInput(false);
      }
    } catch (err) {
      console.error("Failed to toggle flag:", err);
    }
  }

  async function handleSaveNote(e) {
    e.preventDefault();
    if (!question) return;
    try {
      await invoke("toggle_flag", {
        questionId: question.id,
        note: flagNote.trim() || "Flagged for review",
      });
      setIsFlagged(true);
      setShowNoteInput(false);
    } catch (err) {
      console.error(err);
    }
  }

  // Task 1: radio vs checkbox toggle logic
  function handleChoiceChange(choiceId, isMultiSelect) {
    if (isMultiSelect) {
      // Checkbox behaviour: toggle
      if (selected.includes(choiceId)) {
        setSelected(selected.filter((id) => id !== choiceId));
      } else {
        setSelected([...selected, choiceId]);
      }
    } else {
      // Radio behaviour: replace selection
      setSelected([choiceId]);
    }
  }

  async function submit() {
    if (!question || selected.length === 0) return;
    try {
      const result = await invoke("submit_answer", {
        payload: {
          question_id: question.id,
          choice_ids: selected,
        },
      });
      setFeedback(result);
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode Selector Tabs */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-colors duration-150 ${
                mode === m.id
                  ? "bg-[#4d6bfe] text-white shadow-sm"
                  : "bg-white border border-[#e5e5e5] text-[#5a5a5a] hover:bg-[#f7f7f9] hover:text-[#0d0d0d]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#5a5a5a]">
          {MODES.find((m) => m.id === mode)?.desc}
        </p>
      </div>

      {/* Exam Mode Launcher */}
      {mode === "exam" ? (
        <div className="border border-[#e5e5e5] rounded-2xl p-8 bg-white text-center shadow-sm space-y-4">
          <div className="w-12 h-12 bg-[#e8ecff] text-[#4d6bfe] rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-[#0d0d0d]">CCNA 2.0 Full Exam Simulator</h2>
          <p className="text-sm text-[#5a5a5a] max-w-md mx-auto leading-relaxed">
            100 questions precisely weighted to the CCNA 2.0 blueprint. 120-minute countdown timer
            with no immediate feedback. Complete score and competency breakdown at the end.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate("/exam")}
              className="px-6 py-3 bg-[#4d6bfe] hover:bg-[#3b59e9] text-white font-medium text-sm rounded-full shadow-sm transition-colors duration-150"
            >
              Begin 120-Minute Exam →
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4d6bfe] border-t-transparent"></div>
          <p className="text-[#5a5a5a] text-sm mt-3">Loading question...</p>
        </div>
      ) : !question ? (
        <div className="border border-[#e5e5e5] rounded-2xl p-8 bg-white text-center shadow-sm space-y-3">
          <p className="text-[#5a5a5a] text-sm">No questions available for this mode.</p>
          <button
            onClick={loadQuestion}
            className="px-5 py-2.5 bg-[#4d6bfe] hover:bg-[#3b59e9] text-white rounded-full text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        /* Practice Mode Card */
        <div className="border border-[#e5e5e5] rounded-2xl p-5 sm:p-6 bg-white shadow-sm space-y-5">
          <div className="flex flex-wrap justify-between items-start gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium tracking-wide uppercase text-[#1a2a8a] bg-[#e8ecff] px-2.5 py-1 rounded-full">
                  {question.domain.replace(/_/g, " ")}
                </span>
                <span className="text-xs font-medium tracking-wide text-[#5a5a5a] capitalize bg-[#f7f7f9] border border-[#e5e5e5] px-2.5 py-1 rounded-full">
                  {question.difficulty}
                </span>
                {/* Task 1: hint badge */}
                {question.multi_select && (
                  <span className="text-xs font-medium text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">
                    Select all that apply
                  </span>
                )}
              </div>
              <h2 className="text-lg font-medium text-[#0d0d0d] leading-relaxed pt-1">
                {question.stem}
              </h2>
            </div>

            {/* Flag Button */}
            <div className="relative">
              <button
                onClick={handleToggleFlag}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium tracking-wide border transition-colors duration-150 ${
                  isFlagged
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-white text-[#5a5a5a] border-[#e5e5e5] hover:bg-[#f7f7f9] hover:text-[#0d0d0d]"
                }`}
                title={isFlagged ? "Click to unflag" : "Flag this question"}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill={isFlagged ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                {isFlagged ? "Flagged" : "Flag"}
              </button>
              {isFlagged && (
                <button
                  onClick={() => setShowNoteInput(!showNoteInput)}
                  className="text-xs text-[#4d6bfe] hover:underline block mt-1.5 text-right w-full"
                >
                  {showNoteInput ? "Close note" : flagNote ? "Edit note" : "+ Add note"}
                </button>
              )}
            </div>
          </div>

          {/* Flag Note Form */}
          {showNoteInput && isFlagged && (
            <form onSubmit={handleSaveNote} className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs space-y-2">
              <label className="block font-medium text-amber-900">Personal Review Note:</label>
              <input
                type="text"
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                placeholder="e.g. Review OSPF LSAs and area border router rules"
                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-medium"
                >
                  Save Note
                </button>
              </div>
            </form>
          )}

          {/* Task 1: render radio or checkbox based on multi_select */}
          <div className="space-y-3">
            {question.choices.map((c) => {
              const isChecked = selected.includes(c.id);
              const inputType = question.multi_select ? "checkbox" : "radio";
              return (
                <label
                  key={c.id}
                  className={`block w-full rounded-xl border p-4 text-sm cursor-pointer transition-colors duration-150 ${
                    isChecked
                      ? "border-[#4d6bfe] bg-[#e8ecff] text-[#1a2a8a]"
                      : "border-[#e5e5e5] hover:border-[#4d6bfe] text-[#0d0d0d] bg-white"
                  } ${feedback ? "pointer-events-none" : ""}`}
                >
                  <div className="flex items-start">
                    <input
                      type={inputType}
                      name={`q-${question.id}`}
                      className={`mt-0.5 mr-3.5 text-[#4d6bfe] focus:ring-[#4d6bfe] ${inputType === "checkbox" ? "rounded" : ""}`}
                      checked={isChecked}
                      disabled={feedback !== null}
                      onChange={() => handleChoiceChange(c.id, question.multi_select)}
                    />
                    <span className="leading-relaxed select-none">{c.text}</span>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Submit / Next */}
          <div className="flex items-center gap-3 pt-2">
            {!feedback ? (
              <button
                onClick={submit}
                disabled={selected.length === 0}
                className="w-full sm:w-auto px-6 py-3 bg-[#4d6bfe] hover:bg-[#3b59e9] text-white rounded-full text-sm font-medium disabled:opacity-40 transition-colors duration-150 shadow-sm"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={loadQuestion}
                className="w-full sm:w-auto px-6 py-3 bg-[#4d6bfe] hover:bg-[#3b59e9] text-white rounded-full text-sm font-medium transition-colors duration-150 shadow-sm"
              >
                Next Question →
              </button>
            )}
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`p-5 rounded-2xl border space-y-2 ${
                feedback.correct
                  ? "bg-[#e6f7ee] border-[#8ed4b0]"
                  : "bg-[#fdecea] border-[#f0a5a0]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${
                    feedback.correct ? "text-[#0e6245]" : "text-[#b3261e]"
                  }`}
                >
                  {feedback.correct ? "✓ Correct!" : "✗ Incorrect"}
                </span>
              </div>
              <p className="text-sm text-[#0d0d0d] leading-relaxed pt-1">
                {feedback.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
