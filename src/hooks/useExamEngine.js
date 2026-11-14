import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

export function useExamEngine() {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState({});
  const [questionHistory, setQuestionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const answeredRef = useRef(new Set());

  useEffect(() => {
    let mounted = true;

    const loadEngine = async () => {
      try {
        // Initialize fresh exam state
        setAnswers({});
        setQuestionHistory([]);
        answeredRef.current = new Set();
        setLoading(false);
      } catch (err) {
        console.error("useExamEngine init failed:", err);
        if (mounted) setLoading(false);
      }
    };

    loadEngine();

    return () => {
      mounted = false;
    };
  }, []);

  // Load a new question by ID
  const loadQuestion = async (questionId) => {
    try {
      setLoading(true);
      const question = await invoke("get_random_question", {
        mode: "easy",
        subtopic: null,
        domain: null,
      });

      if (question && question.id) {
        setCurrentQuestion(question);
        // Mark as answered if already in history
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

  // Submit answer for a question
  const submitAnswer = async (questionId, choiceIds) => {
    try {
      const result = await invoke("submit_answer", {
        question_id: questionId,
        choice_ids: choiceIds,
      });

      if (result && result.correct !== undefined) {
        // Update answered set
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
          // Check if already in history
          const alreadyExists = prev.find(
            (h) => h.question_id === questionId
          );
          if (alreadyExists) {
            // Update existing entry
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

  // Go to next question (skip logic)
  const nextQuestion = async () => {
    // Logic to select next question based on mode, difficulty, etc.
    // For now, load a new random easy question
    await loadQuestion(Math.random().toString(36).substr(2, 8) || 1);
  };

  // Get statistics for the current exam session
  const getExamStats = async () => {
    try {
      const stats = await invoke("get_stats");
      return stats;
    } catch (err) {
      console.error("getExamStats failed:", err);
      return { total: 0, answered: 0, correct: 0, accuracy: 0 };
    }
  };

  return {
    currentQuestion,
    answers,
    questionHistory,
    loading,
    setCurrentQuestion,
    submitAnswer,
    nextQuestion,
    getExamStats,
    answeredCount: answeredRef.current.size,
    totalSeen: questionHistory.length,
  };
}