import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const MODES = [
  { id: "weak", label: "Weak Spots", desc: "Drills the questions you get wrong first" },
  { id: "easy", label: "Easy", desc: "No timer, fundamental concepts" },
  { id: "medium", label: "Medium", desc: "Standard difficulty, 90s pace" },
  { id: "hard", label: "Hard", desc: "Complex scenarios, 60s pace" },
  { id: "impossible", label: "Impossible", desc: "Multi-concept tricky questions" },
  { id: "exam", label: "Exam Mode", desc: "120-min full 100-Q timed simulation" },
];

export default function Quiz({ onOpenExamModal }) {
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get("mode");
  const drillSubtopic = searchParams.get("subtopic")?.trim() || null;
  const drillDomain = searchParams.get("domain")?.trim() || null;
  const isDrilling = Boolean(drillSubtopic || drillDomain);
  const [mode, setMode] = useState(() =>
    MODES.some((m) => m.id === requestedMode)
      ? requestedMode
      : isDrilling
      ? "weak"
      : "easy"
  );
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isFlagged, setIsFlagged] = useState(false);
  const [flagNote, setFlagNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const rootRef = useRef(null);
  const cardContainerRef = useRef(null);
  const stemContainerRef = useRef(null);
  const feedbackRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (mode === "exam") return;
    loadQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, drillSubtopic, drillDomain]);

  // Parallax Stack Transition when question updates
  useGSAP(
    () => {
      if (!question || !cardContainerRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: "power2.out", force3D: true } });
      // Outer card enters from bottom
      tl.fromTo(
        cardContainerRef.current,
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, duration: 0.25 }
      );

      // Inner stem moves with subtle parallax speed difference
      if (stemContainerRef.current) {
        tl.fromTo(
          stemContainerRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.25 },
          "-=0.15"
        );
      }
    },
    { scope: rootRef, dependencies: [question?.id] }
  );

  // Answer Feedback Pulse: Sage for Correct, Heart for Incorrect
  useGSAP(
    () => {
      if (!feedback || !feedbackRef.current) return;

      if (feedback.correct) {
        // Sage pulse
        gsap.fromTo(
          feedbackRef.current,
          { scale: 0.98, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out", force3D: true }
        );
      } else {
        // Heart pulse + micro-shake
        const tl = gsap.timeline({ defaults: { force3D: true } });
        tl.fromTo(
          feedbackRef.current,
          { scale: 0.98, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.15, ease: "power2.out" }
        ).to(feedbackRef.current, {
          x: -4,
          duration: 0.05,
          repeat: 3,
          yoyo: true,
          ease: "power1.inOut",
        });
      }
    },
    { scope: rootRef, dependencies: [feedback] }
  );

  async function loadQuestion() {
    // If card exists, animate old card sliding UP and fading out
    if (cardContainerRef.current && question) {
      await new Promise((resolve) => {
        gsap.to(cardContainerRef.current, {
          opacity: 0,
          y: -20,
          duration: 0.18,
          ease: "power2.in",
          force3D: true,
          onComplete: resolve,
        });
      });
    }

    setLoading(true);
    setFeedback(null);
    setSelected([]);
    setShowNoteInput(false);
    try {
      const q = await invoke("get_random_question", {
        mode,
        subtopic: drillSubtopic,
        domain: drillDomain,
      });
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

  function handleChoiceChange(choiceId, isMultiSelect) {
    if (isMultiSelect) {
      if (selected.includes(choiceId)) {
        setSelected(selected.filter((id) => id !== choiceId));
      } else {
        setSelected([...selected, choiceId]);
      }
    } else {
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

  // Keyboard-first answering: 1-4 picks a choice, Enter submits or advances.
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
        } else if (selected.length > 0) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, feedback, selected]);

  return (
    <div ref={rootRef} className="space-y-6 pb-12">
      {/* Topic Drill Banner */}
      {isDrilling && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wider text-gold">
              Topic Drill
            </span>
            <span className="text-paper font-sans">{drillSubtopic || "All subtopics"}</span>
            {drillDomain && (
              <span className="text-paper-dim capitalize font-sans">
                · {drillDomain.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/topics"
              className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-gold/40 text-gold hover:bg-gold/20 transition-colors"
            >
              Change topic
            </Link>
            <Link
              to="/quiz"
              className="px-3 py-1.5 rounded-full text-xs font-medium tracking-wide border border-dark-border text-paper-muted hover:text-paper hover:bg-dark-surface transition-colors"
            >
              Exit drill
            </Link>
          </div>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => {
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 ${
                  isActive
                    ? "bg-gold text-dark-bg font-semibold shadow-gold-glow"
                    : "bg-dark-card border border-dark-border text-paper-muted hover:text-paper hover:bg-dark-surface"
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
          {!isDrilling && (
            <Link
              to="/topics"
              className="text-xs font-medium text-gold hover:underline"
            >
              Browse topics to drill a subtopic →
            </Link>
          )}
        </div>
      </div>

      {/* Exam Mode Launcher */}
      {mode === "exam" ? (
        <div className="border border-dark-border rounded-2xl p-8 bg-dark-card text-center shadow-dock space-y-4">
          <div className="w-14 h-14 bg-gold/15 text-gold border border-gold/30 rounded-full flex items-center justify-center mx-auto shadow-gold-glow">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-paper">CCNA 2.0 Full Exam Simulator</h2>
          <p className="text-sm text-paper-muted max-w-md mx-auto leading-relaxed">
            100 questions precisely weighted to the CCNA 2.0 blueprint. 120-minute countdown timer
            with no immediate feedback. Complete score and competency breakdown at the end.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenExamModal || (() => navigate("/exam"))}
              className="px-6 py-3 bg-gold hover:bg-gold-hover text-dark-bg font-semibold text-xs tracking-wider uppercase rounded-full shadow-gold-glow transition-all duration-150 transform hover:scale-105 active:scale-95"
            >
              Begin 120-Minute Exam →
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent"></div>
          <p className="text-paper-muted text-sm font-sans">Loading question stem...</p>
        </div>
      ) : !question ? (
        <div className="border border-dark-border rounded-2xl p-8 bg-dark-card text-center shadow-dock space-y-4">
          <p className="text-paper-muted text-sm font-sans">No questions available for this mode.</p>
          <button
            onClick={loadQuestion}
            className="px-5 py-2.5 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-full text-xs tracking-wider uppercase transition-colors shadow-gold-glow"
          >
            Retry
          </button>
        </div>
      ) : (
        /* Practice Mode Card with Parallax Stack */
        <div
          ref={cardContainerRef}
          className="border border-dark-border rounded-2xl p-6 sm:p-7 bg-dark-card shadow-dock space-y-6 will-change-transform"
        >
          {/* Header & Badges */}
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div ref={stemContainerRef} className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold tracking-wider uppercase text-gold bg-gold/10 border border-gold/30 px-3 py-1 rounded-full">
                  {question.domain.replace(/_/g, " ")}
                </span>
                <span className="text-xs font-medium tracking-wide text-paper-dim capitalize bg-dark-surface border border-dark-border px-3 py-1 rounded-full">
                  {question.difficulty}
                </span>
                {question.multi_select && (
                  <span className="text-xs font-semibold text-peach bg-peach/15 border border-peach/30 px-3 py-1 rounded-full">
                    Select all that apply
                  </span>
                )}
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-paper leading-relaxed pt-1">
                {question.stem}
              </h2>
            </div>

            {/* Flag Button */}
            <div className="relative shrink-0">
              <button
                onClick={handleToggleFlag}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium tracking-wide border transition-all duration-150 ${
                  isFlagged
                    ? "bg-gold/20 text-gold border-gold shadow-gold-glow font-semibold"
                    : "bg-dark-surface text-paper-muted border-dark-border hover:text-paper hover:border-gold/40"
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
                  className="text-xs text-gold hover:underline block mt-1.5 text-right w-full"
                >
                  {showNoteInput ? "Close note" : flagNote ? "Edit note" : "+ Add note"}
                </button>
              )}
            </div>
          </div>

          {/* Flag Note Form */}
          {showNoteInput && isFlagged && (
            <form onSubmit={handleSaveNote} className="bg-dark-surface p-4 rounded-xl border border-dark-border text-xs space-y-2">
              <label className="block font-medium text-gold">Personal Review Note:</label>
              <input
                type="text"
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                placeholder="e.g. Review OSPF LSAs and area border router rules"
                className="w-full px-3 py-2 border border-dark-border rounded-xl text-xs bg-dark-card text-paper focus:outline-none focus:ring-1 focus:ring-gold"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gold hover:bg-gold-hover text-dark-bg rounded-full font-semibold"
                >
                  Save Note
                </button>
              </div>
            </form>
          )}

          {/* Choices list */}
          <div className="space-y-3">
            {question.choices.map((c, index) => {
              const isChecked = selected.includes(c.id);
              const inputType = question.multi_select ? "checkbox" : "radio";
              return (
                <label
                  key={c.id}
                  className={`block w-full rounded-xl border p-4 text-[15px] cursor-pointer transition-all duration-200 ${
                    isChecked
                      ? "border-gold bg-gold/15 text-paper shadow-gold-glow"
                      : "border-dark-border bg-dark-surface/60 hover:border-gold/40 text-paper-muted hover:text-paper"
                  } ${feedback ? "pointer-events-none" : ""}`}
                >
                  <div className="flex items-start">
                    <span
                      className={`mt-0.5 mr-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-mono ${
                        isChecked
                          ? "border-gold bg-gold/20 text-gold"
                          : "border-dark-border text-paper-dim"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <input
                      type={inputType}
                      name={`q-${question.id}`}
                      className={`mt-0.5 mr-3.5 accent-gold text-gold focus:ring-gold ${
                        inputType === "checkbox" ? "rounded" : ""
                      }`}
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

          <p className="text-xs text-paper-dim font-sans">
            Tip: press <kbd className="font-mono text-paper-muted">1</kbd>–
            <kbd className="font-mono text-paper-muted">4</kbd> to pick an answer,{" "}
            <kbd className="font-mono text-paper-muted">Enter</kbd> to submit or advance.
          </p>

          {/* Submit / Next Button */}
          <div className="flex items-center gap-3 pt-2">
            {!feedback ? (
              <button
                onClick={submit}
                disabled={selected.length === 0}
                className="w-full sm:w-auto px-7 py-3 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-full text-xs tracking-wider uppercase disabled:opacity-30 disabled:pointer-events-none transition-all shadow-gold-glow"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={loadQuestion}
                className="w-full sm:w-auto px-7 py-3 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-full text-xs tracking-wider uppercase transition-all shadow-gold-glow"
              >
                Next Question →
              </button>
            )}
          </div>

          {/* Feedback Section with Sage / Heart pulses */}
          {feedback && (
            <div
              ref={feedbackRef}
              className={`p-5 rounded-2xl border space-y-2 will-change-transform ${
                feedback.correct
                  ? "bg-sage/15 border-sage text-sage-light shadow-sage-glow"
                  : "bg-heart/15 border-heart text-heart-light shadow-heart-glow"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {feedback.correct ? "✓ Correct!" : "✗ Incorrect"}
                </span>
              </div>
              <p className="text-sm text-paper leading-relaxed pt-1 font-sans">
                {feedback.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
