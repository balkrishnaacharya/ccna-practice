import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Pencil } from "lucide-react";

const MODES = [
  { id: "weak", label: "Weak Spots", desc: "Drills the questions you get wrong first" },
  { id: "review", label: "Review (SM-2)", desc: "Spaced repetition: surfaces questions due for review" },
  { id: "easy", label: "Easy", desc: "No timer, fundamental concepts" },
  { id: "medium", label: "Medium", desc: "Standard difficulty, 90s pace" },
  { id: "hard", label: "Hard", desc: "Complex scenarios, 60s pace" },
  { id: "impossible", label: "Impossible", desc: "Multi-concept tricky questions" },
  { id: "quick", label: "Quick Quiz", desc: "5 questions: 70% weakest subtopics, 30% random, instant feedback" },
];

const modeTexts = {
  weak: "Weak Spots",
  review: "Review (SM-2)",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  impossible: "Impossible",
  quick: "Quick Quiz",
};

export default function Quiz() {
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get("mode");
  const drillSubtopic = searchParams.get("subtopic")?.trim() || null;
  const drillDomain = searchParams.get("domain")?.trim() || null;
  const isDrilling = Boolean(drillSubtopic || drillDomain);
  const [mode, setMode] = useState(() => {
    if (requestedMode === "quick") return "quick";
    if (MODES.some((m) => m.id === requestedMode)) return requestedMode;
    if (isDrilling) return "weak";
    return "easy";
  });
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isFlagged, setIsFlagged] = useState(false);
  const [flagNote, setFlagNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [questionNote, setQuestionNote] = useState("");
  const [noteInputVisible, setNoteInputVisible] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [quickEnded, setQuickEnded] = useState(false);
  const timerRef = useRef(null);
  const rootRef = useRef(null);
  const cardContainerRef = useRef(null);
  const stemContainerRef = useRef(null);
  const feedbackRef = useRef(null);
  const loadQuestionRef = useRef(0);
  const noteRef = useRef(null);

  const navigate = useNavigate();

  // Mode timing
  const modeTimes = {
    easy: 5 * 60,
    medium: 2 * 60,
    hard: 1 * 60,
    impossible: 30,
    exam: 120 * 60,
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Timer logic
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mode === "exam") return;
    if (mode === "quick") {
      setTimeRemaining(0);
      if (quickStartTime === 0) setQuickStartTime(Date.now());
      return;
    }
    setTimeRemaining(modeTimes[mode] || 2 * 60);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, question?.id]);

  // Quick quiz state
  const [quickQuestions, setQuickQuestions] = useState([]);
  const [quickCurrentIndex, setQuickCurrentIndex] = useState(0);
  const [quickScore, setQuickScore] = useState(0);
  const [quickStartTime, setQuickStartTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    // Reset timer when mode or question changes
    if (timerRef.current) clearInterval(timerRef.current);
    if (mode === "exam") return;
    if (mode === "quick") {
      setTimeRemaining(0);
      if (quickStartTime === 0) setQuickStartTime(Date.now());
      return;
    }
    setTimeRemaining(modeTimes[mode] || 2 * 60);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, question?.id]);

  // Load first question
  useEffect(() => {
    loadQuestion();
  }, []);

  // Reset transient state on mode change
  useEffect(() => {
    setSelected([]);
    setFeedback(null);
    setConfidence("");
    setShowNoteInput(false);
    setQuestionNote("");
    setNoteInputVisible(false);
    setNoteSaved(false);
    loadQuestion();
  }, [mode]);

  async function loadQuestion() {
    const myLoadId = ++loadQuestionRef.current;
    setLoading(true);
    setFeedback(null);
    setSelected([]);
    setShowNoteInput(false);
    setQuestionNote("");
    setNoteInputVisible(false);
    setNoteSaved(false);

    // Quick mode
    if (mode === "quick") {
      try {
        const data = await invoke("get_quick_quiz_questions", {});
        if (myLoadId !== loadQuestionRef.current) return;
        setQuickQuestions(data || []);
        setQuickCurrentIndex(0);
        setQuickScore(0);
        setQuickStartTime(Date.now());
        if (data && data.length > 0) {
          setQuestion(data[0]);
          checkFlagStatus(data[0].id);
          try {
            const note = await invoke("get_question_note", { questionId: data[0].id });
            if (myLoadId !== loadQuestionRef.current) return;
            if (note) setQuestionNote(note);
          } catch (err) {
            // Note may not exist yet
          }
        }
      } catch (err) {
        console.error("Failed to load quick quiz questions:", err);
        setQuickQuestions([]);
      }
      setQuestionNumber((prev) => prev + 1);
      setLoading(false);
      return;
    }

    // Normal mode
    try {
      const q = await invoke("get_random_question", {
        mode,
        subtopic: drillSubtopic,
        domain: drillDomain,
      });
      if (myLoadId !== loadQuestionRef.current) return;
      setQuestion(q);
      if (q) {
        checkFlagStatus(q.id);
        try {
          const note = await invoke("get_question_note", { questionId: q.id });
          if (myLoadId !== loadQuestionRef.current) return;
          if (note) setQuestionNote(note);
        } catch (err) {
          // Note may not exist yet
        }
      }
      setQuestionNumber((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to load question:", err);
    } finally {
      if (myLoadId === loadQuestionRef.current) setLoading(false);
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
      setFlagNote("");
      setShowNoteInput(false);
    } catch (err) {
      console.error("Failed to toggle flag:", err);
    }
  }

  async function handleSaveNote(e) {
    e.preventDefault();
    if (!question) return;
    try {
      await invoke("save_question_note", {
        question_id: question.id,
        note: questionNote.trim(),
      });
      setNoteSaved(true);
      setNoteInputVisible(false);
      setTimeout(() => setNoteSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  }

  function handleChoiceChange(choiceId, isMultiSelect) {
    setSelected((prev) =>
      isMultiSelect
        ? prev.includes(choiceId)
          ? prev.filter((id) => id !== choiceId)
          : [...prev, choiceId]
        : prev.includes(choiceId)
          ? prev.filter((id) => id !== choiceId)
          : [choiceId]
    );
  }

  async function submit() {
    if (!question || selected.length === 0) return;
    try {
      const result = await invoke("submit_answer", {
        question_id: question.id,
        choice_ids: selected,
        confidence,
      });
      setFeedback(result);
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }
  }

  // Quick mode: auto-advance + end screen
  useEffect(() => {
    if (mode !== "quick" || !feedback) return;
    if (quickCurrentIndex + 1 >= 5) {
      setQuickEnded(true);
    } else {
      setQuickCurrentIndex((prev) => prev + 1);
      setTimeout(() => {
        setFeedback(null);
        setSelected([]);
        loadQuestion();
      }, 1500);
    }
  }, [mode, feedback, quickCurrentIndex]);

  // Confidence state
  const [confidence, setConfidence] = useState("");

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!question) return;

      if (e.key === "Enter") {
        if (feedback) {
          e.preventDefault();
          loadQuestion();
        } else if (canSubmit) {
          e.preventDefault();
          submit();
        }
        return;
      }

      const digit = Number(e.key);
      if (
        !feedback &&
        Number.isInteger(digit) &&
        digit >= 1 &&
        digit <= question.choices.length
      ) {
        e.preventDefault();
        handleChoiceChange(question.choices[digit - 1].id, question.multi_select);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [question, feedback, selected, canSubmit]);

  // Flag overlay
  const [showOverlay, setShowOverlay] = useState(false);
  const canSubmit = !feedback && selected.length > 0 && !hasPendingFlags && (mode === "quick" || timeRemaining > 0);

  return (
    <div ref={rootRef} className="space-y-6 pb-12">
      {/* Topic Drill Banner */}
      {isDrilling && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-gold">Topic Drill</span>
            <span className="text-paper font-sans">{drillSubtopic || "All subtopics"}</span>
            {drillDomain && (
              <span className="text-paper-dim capitalize font-sans">· {drillDomain.replace(/_/g, " ")}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/topics" className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-gold/40 text-gold hover:bg-gold/20 transition-colors">
              Change topic
            </Link>
            <Link to="/quiz" className="px-3 py-1.5 rounded-full text-xs font-medium tracking-wide border border-dark-border text-paper-muted hover:text-paper hover:bg-dark-surface transition-colors">
              Exit drill
            </Link>
          </div>
        </div>
      )}

      {/* Mode Selector */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => {
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 ${
                  isActive ? "bg-gold text-dark-bg font-semibold shadow-gold-glow" : "bg-dark-card border border-dark-border text-paper-muted hover:text-paper hover:bg-dark-surface"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-paper-dim font-sans">
            {MODES.find((m) => m.id === mode)?.desc}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-paper-muted">{modeTexts[mode]}</span>
            {mode !== "exam" && mode !== "quick" && (
              <span className="text-sm text-paper-muted" id="timer-elapsed">
                {formatTime(timeRemaining)}
              </span>
            )}
          </div>
          <Link
            to="/topics"
            className="text-xs font-medium text-gold hover:underline"
          >
            Browse topics to drill a subtopic
          </Link>
        </div>
      </div>

      {/* Question Card */}
      {loading ? (
        <div className="py-12 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent"></div>
          <p className="text-paper-muted text-sm font-sans">Loading question stem...</p>
        </div>
      ) : quickEnded ? (
        <div className="border border-dark-border rounded-2xl p-8 bg-dark-card text-center shadow-dock space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent mb-4"></div>
          <p className="text-3xl font-serif font-normal text-gold tracking-tight">Quick Quiz Complete</p>
          <p className="text-paper text-2xl font-semibold mb-4">
            {quickQuestions.length} done in {Math.floor((Date.now() - quickStartTime) / 60000)}:{Math.floor(((Date.now() - quickStartTime) % 60000) / 1000).toString().padStart(2, "0")} — {quickScore} correct</p>
          <button
            onClick={() => {
              setQuickEnded(false);
              setQuickQuestions([]);
              setQuickCurrentIndex(0);
              setQuickScore(0);
              setQuickStartTime(0);
              setQuestion(null);
              setFeedback(null);
              setSelected([]);
            }}
            className="px-6 py-3 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-full text-xs tracking-wider uppercase transition-all shadow-gold-glow"
          >
            Start New Quiz
          </button>
        </div>
      ) : !question ? (
        <div className="border border-dark-border rounded-2xl p-8 bg-dark-card text-center shadow-dock space-y-4">
          <p className="text-paper-muted text-sm font-sans">
            {mode === "review"
              ? "Nothing is due for review right now. Answer a few questions first, then come back."
              : "No questions available for this mode."}
          </p>
          <button onClick={loadQuestion} className="px-5 py-2.5 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-full text-xs tracking-wider uppercase transition-all shadow-gold-glow">
            Retry
          </button>
        </div>
      ) : (
        /* Practice Question Card */
        <div
          ref={cardContainerRef}
          className="border border-dark-border rounded-xl p-6 sm:p-7 bg-dark-card space-y-5"
        >
          {/* Header: domain, difficulty, flag */}
          <div className="flex flex-col sm:flex-wrap items-start gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold font-mono text-gold bg-gold/10 border border-gold/30 px-3 py-1 rounded-full">
                {question.domain.replace(/_/g, " ")}
              </span>
              <span className="text-xs font-medium font-mono tracking-wide text-paper-dim capitalize bg-dark-surface border border-dark-border px-3 py-1 rounded-full">
                {question.difficulty}
              </span>
              {question.multi_select && (
                <span className="text-xs font-semibold text-peach bg-peach/15 border border-peach/30 px-3 py-1 rounded-full">
                  Select all that apply
                </span>
              )}
            </div>

            {/* Flag button */}
            <div className="relative">
              <button
                onClick={handleToggleFlag}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide border ${
                  isFlagged ? "bg-gold/20 text-gold border-gold shadow-gold-glow" : "bg-dark-surface text-paper-muted border-dark-border text-paper"}
                }`}
                title={isFlagged ? "Click to unflag" : "Flag this question"}
              >
                <svg
                  className="w-3 h-3"
                  fill={isFlagged ? "currentColor" : "none"}
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
                {isFlagged ? "Flagged" : "Flag"}
              </button>
            </div>
          </div>

          {/* Question stem */}
          <div className="border-b border-dark-borderSubtle pb-3">
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-paper leading-relaxed">
              {question.stem}
            </h2>
          </div>

          {/* Choices */}
          <div className="space-y-3">
            {question.choices.map((c, index) => {
              const isChecked = selected.includes(c.id);
              const inputType = question.multi_select ? "checkbox" : "radio";
              return (
                <label
                  key={c.id}
                  className={"block rounded-xl border p-3 cursor-pointer " + (isChecked ? "border-gold bg-gold/10 text-gold" : "border-border bg-card") + " " + (feedback ? "pointer-events-none" : "")}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={"mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs font-mono " + (isChecked ? "border-gold bg-gold/20 text-gold" : "border-border text-paper-dim")}
                      >
                        {index + 1}
                      </span>
                      <input
                        type={inputType}
                        name={"q-" + question.id}
                        className={"mt-0.5 text-gold focus:ring-gold " + (inputType === "checkbox" ? "rounded" : "")}
                        checked={isChecked}
                        disabled={feedback !== null}
                        onChange={() => handleChoiceChange(c.id, question.multi_select)}
                      />
                      <span className="leading-relaxed select-none font-sans">{c.text}</span>
                    </div>
                  </label>
              );
            })}
          </div>

          {/* Tip */}
          {feedback ? null : (
            <p className="text-xs text-paper-dim font-sans">
              Tip: press <kbd className="font-mono text-paper-muted">1</kbd>–
              <kbd className="font-mono text-paper-muted">{question.choices.length}</kbd> to pick, {" "}
              <kbd className="font-mono text-paper-muted">Enter</kbd> to submit
            </p>
          )}

          {/* Submit / Next */}
          <div className="mt-4">
            {!feedback ? (
              <button
                onClick={submit}
                disabled={selected.length === 0}
                className="w-full sm:w-auto px-6 min-h-[48px] py-2.5 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-full text-xs tracking-wider uppercase transition-all shadow-gold-glow"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={loadQuestion}
                className="w-full sm:w-auto px-6 min-h-[48px] py-2.5 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-full text-xs tracking-wider uppercase transition-all shadow-gold-glow"
              >
                Next Question
              </button>
            )}
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="mt-4 p-4 rounded-xl border space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {feedback.correct ? "Correct" : "Incorrect"}
                </span>
              </div>
              <p className="text-sm text-paper leading-relaxed">{feedback.explanation}</p>

              {/* Confidence rating - simplified */}
              {(!feedback.correct || mode !== "quick") && (
                <div className="mt-3 flex gap-2">
                  <label
                    className="flex items-center gap-1 px-2 py-1.5 rounded-border text-xs font-medium text-paper-muted"
                    radioGroup="confidence"
                    value="guessed"
                    checked={confidence === "guessed"}
                    onChange={(e) => setConfidence("guessed")}
                  >
                    Guessed
                  </label>
                  <label
                    className="flex items-center gap-1 px-2 py-1.5 rounded border border-dark-border text-xs font-medium text-paper-muted"
                    radioGroup="confidence"
                    value="unsure"
                    checked={confidence === "unsure"}
                    onChange={(e) => setConfidence("unsure")}
                  >
                    Unsure
                  </label>
                  <label
                    className="flex items-center gap-1 px-2 py-1.5 rounded bg-gold border-gold text-xs font-medium text-dark-bg"
                    radioGroup="confidence"
                    value="confident"
                    checked={confidence === "confident"}
                    onChange={(e) => setConfidence("confident")}
                  >
                    Confident
                  </label>
                </div>
              )}

              {/* Question note */}
              {(!feedback.correct || mode === "quick") && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  {questionNote ? (
                    <div className="flex items-start gap-2">
                      <Pencil className="w-3 h-3 text-gold mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-paper font-sans">{questionNote}</p>
                        <button
                          onClick={() => setNoteInputVisible(true)}
                          className="text-xs text-gold hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setNoteInputVisible(true)}
                      className="w-full py-2 bg-gold/10 text-gold border border-gold/30 rounded-xl text-xs font-semibold hover:bg-gold/20 transition-colors"
                    >
                      Add note to this question
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}