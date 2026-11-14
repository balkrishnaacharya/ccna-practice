import { useState, useEffect, useRef } from "react";
import { useExamEngine } from "@/hooks/useExamEngine";
import { AnswerChoice } from "@/components/practice/AnswerChoice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExamQuestion({ questionId }) {
  const {
    currentQuestion,
    answers,
    submitAnswer,
    loading,
    setCurrentQuestion,
  } = useExamEngine();

  const [showExplanation, setShowExplanation] = useState(false);
  const questionRef = useRef(null);

  // Load question when component mounts or questionId changes
  useEffect(() => {
    if (questionId) {
      setCurrentQuestion(questionId);
    }
  }, [questionId]);

  // When currentQuestion changes, we already load it via useExamEngine
  useEffect(() => {
    // Question loaded asynchronously via useExamEngine -> loadQuestion
    // No additional action needed here
  }, [currentQuestion]);

  if (loading) {
    return (
      <Card className="border-l-4 border-l-primary rounded-xl bg-card overflow-hidden">
        <CardHeader className="flex flex-col items-start gap-2 px-5 py-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              Q
            </Badge>
            <Badge variant="secondary" className="text-xs font-mono uppercase">
              Loading...
            </Badge>
          </div>
          <CardTitle className="text-lg leading-relaxed text-foreground">
            Loading question...
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4">
          <p className="text-muted-foreground">Loading question...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const correctChoiceId =
    currentQuestion.choices?.find((c) => c.is_correct)?.id || null;
  const isAnswered = currentQuestion.id in answers;
  const selectedAnswer = answers[currentQuestion.id];
  const isCorrect = selectedAnswer?.correct;
  const userChoiceIds = selectedAnswer?.selected_choice_ids || [];

  // Determine if question can still be answered
  const isDisabled = isAnswered && !showExplanation;

  return (
    <Card className="border-l-4 border-l-primary rounded-xl bg-card overflow-hidden">
      <CardHeader className="flex flex-col items-start gap-2 px-5 py-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            Q
          </Badge>
          <Badge
            variant={currentQuestion.difficulty === "easy"
              ? "secondary"
              : currentQuestion.difficulty === "medium"
                ? "default"
                : "destructive"}
            className="text-xs font-mono uppercase"
          >
            {currentQuestion.difficulty}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-relaxed text-foreground">
          {currentQuestion.stem}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-5 py-4">
        {isAnswered && showExplanation ? (
          // Show explanation after answering
          <div className="space-y-4">
            {isCorrect ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-sm font-semibold text-green-400">Correct</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-semibold text-red-400">Incorrect</span>
              </div>
            )}

            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentQuestion.explanation || "No explanation available."}
            </p>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Your answer selected:{" "}
                {userChoiceIds.length > 0
                  ? userChoiceIds.map((id) =>
                      currentQuestion.choices?.find((c) => c.id === id)?.text ||
                        `Choice ${id}`
                    ).join(", ")
                  : "None"}
                </p>
              <p className="text-xs text-muted-foreground">
                Correct choices:{" "}
                {currentQuestion.choices
                  .filter((c) => c.is_correct)
                  .map((c) => c.text)
                  .join(", ")}
              </p>
            </div>
          </div>
        ) : (
          // Show answer choices before answering
          <div className="space-y-3">
            {currentQuestion.choices?.map((choice) => (
              <AnswerChoice
                key={choice.id}
                label={String.fromCharCode(65 + currentQuestion.choices.indexOf(choice))}
                text={choice.text}
                selected={userChoiceIds.includes(choice.id)}
                correct={choice.is_correct}
                disabled={isDisabled}
                onClick={(e) =>
                  e.stopPropagation() || submitAnswer(currentQuestion.id, [
                    choice.id,
                  ])
                }
              />
            ))}

            {!isAnswered && (
              <p className="text-xs text-muted-foreground">
                Click a choice to answer. After answering, explanation will appear.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}