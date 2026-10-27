import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link, useParams } from "react-router-dom";

function formatDate(unixSecs) {
  return unixSecs
    ? new Date(unixSecs * 1000).toLocaleString()
    : "—";
}

export default function SessionReview() {
  const { sessionId } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retaking, setRetaking] = useState(false);
  const [retakeIndex, setRetakeIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [checked, setChecked] = useState(false);
  const [studyPrompt, setStudyPrompt] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    setLoading(true);
    invoke("get_session_detail", { sessionId: Number(sessionId) })
      .then(setDetail)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const wrongReviews = useMemo(
    () => detail?.reviews.filter((review) => !review.is_correct) ?? [],
    [detail],
  );

  function generateStudyPrompt() {
    if (!detail) return;
    const wrongByDomain = new Map();
    for (const review of wrongReviews) {
      if (!wrongByDomain.has(review.domain)) wrongByDomain.set(review.domain, []);
      wrongByDomain.get(review.domain).push(review);
    }

    const weakAreaText = [...wrongByDomain.entries()].map(([domain, missed]) => {
      const subtopics = [...new Set(missed.map((item) => item.subtopic).filter(Boolean))];
      const subtopicLine = subtopics.length ? subtopics.join(", ") : "Unspecified subtopic";
      const questionText = missed.map((item, index) => {
        const correctAnswers = item.choices
          .filter((choice) => item.correct_choice_ids.includes(choice.id))
          .map((choice) => choice.text)
          .join("; ");
        return `${index + 1}. ${item.stem}\n   Correct answer: ${correctAnswers || "Unavailable"}\n   Explanation: ${item.explanation || "No explanation available."}`;
      }).join("\n\n");
      return `Domain: ${domain.replace(/_/g, " ")}\nMissed subtopics: ${subtopicLine}\nMissed questions:\n${questionText}`;
    }).join("\n\n");

    setStudyPrompt([
      `My CCNA 2.0 exam score was ${detail.session.score} out of ${detail.session.total} (${detail.session.percentage}%).`,
      "",
      "Weak areas and missed questions:",
      weakAreaText || "No incorrect answers were recorded.",
      "",
      "You are a CCNA 2.0 tutor. Based on my weak areas listed below, do the following:",
      "",
      "Explain the underlying concept for each missed question in simple terms, then again with exam-level depth.",
      "",
      "Generate 5 new multiple-choice questions per weak subtopic, in the same 4-choice format with one correct answer and a 2–4 sentence explanation.",
      "",
      "Provide short study notes (bullet form, ~200 words) for each weak subtopic.",
      "",
      "End with a 5-question mixed quiz covering only my weak areas.",
    ].join("\n"));
    setCopyStatus("");
  }

  async function copyStudyPrompt() {
    try {
      await navigator.clipboard.writeText(studyPrompt);
      setCopyStatus("Copied to clipboard.");
    } catch {
      setCopyStatus("Clipboard access failed. Select and copy the text manually.");
    }
  }

  function toggleChoice(choiceId) {
    const current = wrongReviews[retakeIndex];
    const isMulti = current.correct_choice_ids.length > 1;
    setSelected((previous) => {
      if (!isMulti) return [choiceId];
      return previous.includes(choiceId)
        ? previous.filter((id) => id !== choiceId)
        : [...previous, choiceId];
    });
    setChecked(false);
  }

  function matchesAnswer(review) {
    return selected.length === review.correct_choice_ids.length
      && review.correct_choice_ids.every((id) => selected.includes(id));
  }

  function nextRetakeQuestion() {
    setRetakeIndex((index) => index + 1);
    setSelected([]);
    setChecked(false);
  }

  if (loading) return <p className="py-24 text-center text-sm text-paper-muted font-sans">Loading session review…</p>;
  if (error) return <p className="py-24 text-center text-sm text-heart-light font-sans">Could not load this session: {error}</p>;
  if (!detail) return null;

  if (retaking) {
    if (retakeIndex >= wrongReviews.length) {
      return (
        <div className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-dark-border bg-dark-card p-8 text-center shadow-dock">
          <h1 className="font-serif text-2xl font-semibold text-paper">Retake complete</h1>
          <p className="text-sm text-paper-muted font-sans">You reviewed all {wrongReviews.length} missed questions.</p>
          <button
            onClick={() => setRetaking(false)}
            className="rounded-full bg-gold hover:bg-gold-hover px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-dark-bg shadow-gold-glow"
          >
            Back to review
          </button>
        </div>
      );
    }

    const review = wrongReviews[retakeIndex];
    const isMulti = review.correct_choice_ids.length > 1;
    const isCorrect = matchesAnswer(review);
    return (
      <section className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-dark-border bg-dark-card p-6 shadow-dock sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-serif text-xl font-semibold text-paper">Retake missed questions</h1>
          <span className="text-xs font-mono text-peach">{retakeIndex + 1} / {wrongReviews.length}</span>
        </div>
        <h2 className="font-serif text-lg leading-relaxed text-paper font-normal">{review.stem}</h2>
        <div className="space-y-2 pt-1">
          {review.choices.map((choice) => (
            <label
              key={choice.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition-all ${
                selected.includes(choice.id)
                  ? "border-gold bg-gold/15 text-paper shadow-gold-glow"
                  : "border-dark-border bg-dark-surface/60 text-paper-muted hover:text-paper"
              }`}
            >
              <input
                type={isMulti ? "checkbox" : "radio"}
                name={`retake-${review.question_id}`}
                checked={selected.includes(choice.id)}
                onChange={() => toggleChoice(choice.id)}
                className="mt-0.5 accent-gold"
              />
              <span className="font-sans leading-relaxed">{choice.text}</span>
            </label>
          ))}
        </div>
        {checked && (
          <p className={`rounded-xl p-3.5 text-xs leading-relaxed font-sans border ${
            isCorrect
              ? "bg-sage/20 border-sage/40 text-sage-light shadow-sage-glow"
              : "bg-heart/20 border-heart/40 text-heart-light"
          }`}>
            <span className="font-semibold block mb-1">{isCorrect ? "✓ Correct." : "✗ Incorrect."}</span>
            {review.explanation}
          </p>
        )}
        <div className="flex justify-between gap-3 pt-2">
          <button
            onClick={() => setRetaking(false)}
            className="rounded-full border border-dark-border px-5 py-2 text-xs font-medium text-paper-muted hover:text-paper hover:bg-dark-surface"
          >
            Exit retake
          </button>
          {!checked ? (
            <button
              disabled={!selected.length}
              onClick={() => setChecked(true)}
              className="rounded-full bg-gold hover:bg-gold-hover px-6 py-2 text-xs font-semibold uppercase tracking-wider text-dark-bg shadow-gold-glow disabled:opacity-30"
            >
              Check answer
            </button>
          ) : (
            <button
              onClick={nextRetakeQuestion}
              className="rounded-full bg-gold hover:bg-gold-hover px-6 py-2 text-xs font-semibold uppercase tracking-wider text-dark-bg shadow-gold-glow"
            >
              {retakeIndex + 1 === wrongReviews.length ? "Finish" : "Next question"}
            </button>
          )}
        </div>
      </section>
    );
  }

  const { session, reviews } = detail;
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/history" className="text-xs text-gold hover:underline">← Exam History</Link>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-paper">Session Review</h1>
          <p className="mt-1 text-xs text-paper-dim font-mono">{formatDate(session.started_at)} · {session.mode} mode · Score {session.score}/{session.total}</p>
        </div>
        {wrongReviews.length > 0 && (
          <button
            onClick={() => { setRetaking(true); setRetakeIndex(0); setSelected([]); setChecked(false); }}
            className="rounded-full bg-gold hover:bg-gold-hover px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-dark-bg shadow-gold-glow transition-all"
          >
            Retake Missed Questions ({wrongReviews.length})
          </button>
        )}
      </div>

      <section className="space-y-4 rounded-2xl border border-dark-border bg-dark-card p-6 shadow-dock">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-semibold text-paper">Study Prompt Generator</h2>
            <p className="mt-0.5 text-xs text-paper-dim">Generated locally from this session's weak domains.</p>
          </div>
          <button
            onClick={generateStudyPrompt}
            className="rounded-full bg-dark-surface hover:bg-dark-elevated border border-dark-border px-4 py-2 text-xs font-medium text-paper hover:text-gold transition-colors"
          >
            Generate Study Prompt
          </button>
        </div>
        {studyPrompt && (
          <div className="space-y-3 pt-2">
            <textarea
              aria-label="Generated study prompt"
              readOnly
              value={studyPrompt}
              rows={14}
              className="w-full resize-y rounded-xl border border-dark-border bg-dark-surface p-3.5 text-xs leading-relaxed text-paper font-mono focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={copyStudyPrompt}
                className="rounded-full bg-gold hover:bg-gold-hover px-5 py-2 text-xs font-semibold uppercase tracking-wider text-dark-bg shadow-gold-glow"
              >
                Copy
              </button>
              <span role="status" className="text-xs text-peach font-mono">{copyStatus}</span>
            </div>
          </div>
        )}
      </section>

      {reviews.map((review, index) => (
        <article
          key={review.question_id}
          className={`space-y-3.5 rounded-2xl border bg-dark-card p-6 shadow-dock ${
            review.is_correct ? "border-sage/40" : "border-heart/40"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-paper-dim">
              Question {index + 1} · {review.domain.replace(/_/g, " ")}{review.subtopic ? ` · ${review.subtopic}` : ""}
            </span>
            <span className={`rounded-full px-3 py-0.5 text-xs font-semibold border ${
              review.is_correct
                ? "bg-sage/20 text-sage-light border-sage/40 shadow-sage-glow"
                : "bg-heart/20 text-heart-light border-heart/40"
            }`}>
              {review.is_correct ? "Correct" : "Incorrect"}
            </span>
          </div>
          <h2 className="font-serif text-base font-normal leading-relaxed text-paper">{review.stem}</h2>
          <div className="space-y-2">
            {review.choices.map((choice) => {
              const userPicked = review.user_choice_ids.includes(choice.id);
              return (
                <div
                  key={choice.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3.5 text-xs transition-colors ${
                    choice.is_correct
                      ? "border-sage/50 bg-sage/20 text-sage-light font-medium shadow-sage-glow"
                      : userPicked
                      ? "border-heart/50 bg-heart/20 text-heart-light"
                      : "border-dark-border bg-dark-surface/60 text-paper-muted"
                  }`}
                >
                  <span className="font-sans">{choice.text}</span>
                  <span className="text-xs font-semibold">
                    {choice.is_correct ? "✓ Correct answer" : userPicked ? "✗ Your answer" : ""}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="rounded-xl border border-dark-border bg-dark-surface/70 p-4 text-xs space-y-1">
            <p className="font-semibold text-paper">Explanation:</p>
            <p className="leading-relaxed text-paper-muted font-sans">{review.explanation || "No explanation available."}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
