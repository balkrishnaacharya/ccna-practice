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

  if (loading) return <p className="py-16 text-center text-sm text-[#5a5a5a]">Loading session review…</p>;
  if (error) return <p className="py-16 text-center text-sm text-[#b3261e]">Could not load this session: {error}</p>;
  if (!detail) return null;

  if (retaking) {
    if (retakeIndex >= wrongReviews.length) {
      return (
        <div className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-[#e5e5e5] bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Retake complete</h1>
          <p className="text-sm text-[#5a5a5a]">You reviewed {wrongReviews.length} missed questions.</p>
          <button onClick={() => setRetaking(false)} className="rounded-full bg-[#4d6bfe] px-5 py-2.5 text-sm font-medium text-white">Back to review</button>
        </div>
      );
    }

    const review = wrongReviews[retakeIndex];
    const isMulti = review.correct_choice_ids.length > 1;
    const isCorrect = matchesAnswer(review);
    return (
      <section className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">Retake missed questions</h1>
          <span className="text-xs text-[#5a5a5a]">{retakeIndex + 1} / {wrongReviews.length}</span>
        </div>
        <h2 className="text-base leading-relaxed">{review.stem}</h2>
        <div className="space-y-2">
          {review.choices.map((choice) => (
            <label key={choice.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${selected.includes(choice.id) ? "border-[#4d6bfe] bg-[#e8ecff]" : "border-[#e5e5e5]"}`}>
              <input type={isMulti ? "checkbox" : "radio"} name={`retake-${review.question_id}`} checked={selected.includes(choice.id)} onChange={() => toggleChoice(choice.id)} />
              <span>{choice.text}</span>
            </label>
          ))}
        </div>
        {checked && <p className={`rounded-xl p-3 text-sm ${isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{isCorrect ? "Correct." : "Not quite. Review the answer below."} {review.explanation}</p>}
        <div className="flex justify-between gap-3">
          <button onClick={() => setRetaking(false)} className="rounded-full border border-[#e5e5e5] px-4 py-2 text-sm">Exit retake</button>
          {!checked ? (
            <button disabled={!selected.length} onClick={() => setChecked(true)} className="rounded-full bg-[#4d6bfe] px-5 py-2 text-sm text-white disabled:opacity-40">Check answer</button>
          ) : (
            <button onClick={nextRetakeQuestion} className="rounded-full bg-[#4d6bfe] px-5 py-2 text-sm text-white">{retakeIndex + 1 === wrongReviews.length ? "Finish" : "Next question"}</button>
          )}
        </div>
      </section>
    );
  }

  const { session, reviews } = detail;
  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/history" className="text-sm text-[#4d6bfe] hover:underline">← Exam History</Link>
          <h1 className="mt-2 text-2xl font-semibold">Session review</h1>
          <p className="mt-1 text-sm text-[#5a5a5a]">{formatDate(session.started_at)} · {session.mode} · Score {session.score}/{session.total}</p>
        </div>
        {wrongReviews.length > 0 && (
          <button onClick={() => { setRetaking(true); setRetakeIndex(0); setSelected([]); setChecked(false); }} className="rounded-full bg-[#4d6bfe] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3b59e9]">Retake wrong questions only ({wrongReviews.length})</button>
        )}
      </div>

      <section className="space-y-3 rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">Study Prompt</h2>
            <p className="mt-1 text-xs text-[#5a5a5a]">Generated locally from this session. Nothing is sent anywhere.</p>
          </div>
          <button onClick={generateStudyPrompt} className="rounded-full bg-[#4d6bfe] px-4 py-2 text-sm font-medium text-white hover:bg-[#3b59e9]">Generate Study Prompt</button>
        </div>
        {studyPrompt && (
          <div className="space-y-2">
            <textarea aria-label="Generated study prompt" readOnly value={studyPrompt} rows={18} className="w-full resize-y rounded-xl border border-[#d9dce5] bg-[#fbfbfd] p-3 text-xs leading-relaxed text-[#222] focus:outline-none focus:ring-2 focus:ring-[#4d6bfe]" />
            <div className="flex items-center gap-3">
              <button onClick={copyStudyPrompt} className="rounded-full border border-[#4d6bfe] px-4 py-2 text-sm font-medium text-[#4d6bfe] hover:bg-[#e8ecff]">Copy</button>
              <span role="status" className="text-xs text-[#5a5a5a]">{copyStatus}</span>
            </div>
          </div>
        )}
      </section>

      {reviews.map((review, index) => (
        <article key={review.question_id} className={`space-y-3 rounded-2xl border bg-white p-5 shadow-sm ${review.is_correct ? "border-[#b7e0c8]" : "border-[#f0c2be]"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-[#5a5a5a]">Question {index + 1} · {review.domain.replace(/_/g, " ")}{review.subtopic ? ` · ${review.subtopic}` : ""}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${review.is_correct ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{review.is_correct ? "Correct" : "Incorrect"}</span>
          </div>
          <h2 className="text-base font-medium leading-relaxed">{review.stem}</h2>
          <div className="space-y-2">
            {review.choices.map((choice) => {
              const userPicked = review.user_choice_ids.includes(choice.id);
              return (
                <div key={choice.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm ${choice.is_correct ? "border-green-200 bg-green-50 text-green-900" : userPicked ? "border-red-200 bg-red-50 text-red-900" : "border-[#e5e5e5] bg-white text-[#5a5a5a]"}`}>
                  <span>{choice.text}</span>
                  <span className="text-xs font-semibold">{choice.is_correct ? "✓ Correct answer" : userPicked ? "Your answer" : ""}</span>
                </div>
              );
            })}
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-[#f7f7f9] p-4 text-sm">
            <p className="font-medium">Explanation</p><p className="mt-1 leading-relaxed text-[#5a5a5a]">{review.explanation || "No explanation available."}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
