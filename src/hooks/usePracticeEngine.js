import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

export function usePracticeEngine() {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState({});
  const [questionHistory, setQuestionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const answeredRef = useRef(new Set());

  useEffect(() => {
    let mounted = true;

    const initEngine = async () => {
      try {
        setAnswers({});
        setQuestionHistory([]);
        answeredRef.current = new Set();
        setLoading(false);
      } catch (err) {
        console.error("usePracticeEngine init failed:", err);
        if (mounted) setLoading(false);
      }
    };

    initEngine();

    return () => {
      mounted = false;
    };
  }, []);

  // Load a question by domain/subtopic/difficulty
  const loadQuestion = async ({
    domain,
    subtopic,
    difficulty = "mixed",
  } = {}) => {
    try {
      setLoading(true);
      const question = await invoke("get_random_question", {
        mode: difficulty,
        subtopic: subtopic || undefined,
        domain: domain || undefined,
      });

      if (question && question.id) {
        setCurrentQuestion(question);
        // If question was previously answered, surface saved state
        if (answeredRef.current.has(question.id)) {
          const prevAnswer = Object.entries(answers).find(
            ([qid]) => String(qid) === String(question.id)
          );
          if (prevAnswer) {
            setAnswers((prev) => ({
              ...prev,
              [question.id]: { correct: prevAnswer[1].correct, selected: prevAnswer[1].selected },
            }));
          }
        }
      } else {
        setCurrentQuestion(null);
      }
      setLoading(false);
    } catch (err) {
      console.error("loadQuestion failed:", err);
      setCurrentQuestion(null);
      setLoading(false);
    }
  };

  // Submit answer for a practice question
  const submitAnswer = async (questionId, choiceIds) => {
    try {
      const result = await invoke("submit_answer", {
        question_id: questionId,
        choice_ids: choiceIds,
      });

      if (result && result.correct !== undefined) {
        answeredRef.current.add(questionId);

        // Update answers state
        setAnswers((prev) => ({
          ...prev,
          [questionId]: {
            correct: result.correct,
            explanation: result.explanation,
            correct_choice_ids: result.correct_choice_ids,
            selected: choiceIds,
          },
        }));

        // Add to history
        setQuestionHistory((prev) => {
          const alreadyExists = prev.find(
            (h) => h.question_id === questionId
          );
          if (alreadyExists) {
            return prev.map((h) =>
              h.question_id === questionId
                ? { ...h, correct: result.correct, explanation: result.explanation }
                : h
            );
          }
          return [
            ...prev,
            {
              question_id: questionId,
              correct: result.correct,
              explanation: result.explanation,
            },
          ];
        });

        if (result.correct) {
          toast("Correct! 🎉", {
            description: result.explanation || "Great answer!",
          });
        } else {
          toast(`Not quite... 📚`, {
            description: result.explanation || "Review the explanation.",
          });
        }
      }

      return result;
    } catch (err) {
      console.error("submitAnswer failed:", err);
      toast("Error submitting answer", {
        description: "Please try again.",
      });
      return { correct: false, explanation: "Error submitting answer" };
    }
  };

  // Mark question as reviewed (no correctness info needed for practice)
  const markReviewed = (questionId) => {
    answeredRef.current.add(questionId);
    setQuestionHistory((prev) => {
      const alreadyExists = prev.find(
        (h) => h.question_id === questionId
      );
      if (alreadyExists) return prev;
      return [
        ...prev,
        { question_id: questionId, correct: null, explanation: "Reviewed" },
      ];
    });
  };

  // Get practice stats
  const getPracticeStats = async () => {
    try {
      const stats = await invoke("get_stats");
      return {
        ...stats,
        sessionType: "practice",
      };
    } catch (err) {
      console.error("getPracticeStats failed:", err);
      return { total: 0, answered: 0, correct: 0, accuracy: 0, sessionType: "practice" };
    }
  };

  // Get current session summary
  const getCurrentSession = () => ({
    currentQuestion,
    answeredCount: answeredRef.current.size,
    totalSeen: questionHistory.length,
    recentAnswers: Object.entries(answers).slice(-5), // last 5
  });

  return {
    currentQuestion,
    answers,
    questionHistory,
    loading,
    setCurrentQuestion,
    loadQuestion,
    submitAnswer,
    markReviewed,
    nextQuestion: loadQuestion,
    getPracticeStats,
    getCurrentSession,
    answeredCount: answeredRef.current.size,
    totalSeen: questionHistory.length,
  };
}