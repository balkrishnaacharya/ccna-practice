import { AnswerChoice } from "./AnswerChoice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import DragDropQuestion from "./DragDropQuestion";

export default function QuestionCard({
  question,
  currentAnswer,
  onAnswer,
  showExplanation = false,
  onDragDropComplete,
}) {
  const correctChoiceId =
    question.choices?.find((c) => c.is_correct)?.id || null;
  const isAnswered = currentAnswer !== null && currentAnswer !== undefined;
  const selectedIsCorrect = currentAnswer === correctChoiceId;
  const selectedChoice =
    question.choices?.find((c) => c.id === currentAnswer) || null;

  // Drag-drop question type
  if (question.type === "drag-drop") {
    return (
      <Card className="border-l-4 border-l-primary rounded-xl bg-card overflow-hidden">
        <CardHeader className="flex flex-col items-start gap-2 px-5 py-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              Q
            </Badge>
            <Badge variant="secondary" className="text-xs font-mono uppercase">
              {question.domain?.replace(/_/g, " ") || "General"}
            </Badge>
            <Badge
              variant={question.difficulty === "easy" ? "secondary" : "default"}
              className="text-xs font-mono uppercase"
            >
              {question.difficulty}
            </Badge>
          </div>
          <CardTitle className="text-lg leading-relaxed text-foreground">
            {question.stem}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4">
          <DragDropQuestion
            question={question}
            onComplete={(score, correct, total) => {
              onDragDropComplete?.(score, correct, total);
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary rounded-xl bg-card overflow-hidden">
      <CardHeader className="flex flex-col items-start gap-2 px-5 py-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            Q
          </Badge>
          <Badge variant="secondary" className="text-xs font-mono uppercase">
            {question.domain?.replace(/_/g, " ") || "General"}
          </Badge>
          <Badge
            variant={question.difficulty === "easy" ? "secondary" : "default"}
            className="text-xs font-mono uppercase"
          >
            {question.difficulty}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-relaxed text-foreground">
          {question.stem}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-5 py-4">
        <div className="space-y-2">
          {question.choices?.map((choice) => {
            const isSelected = choice.id === currentAnswer;
            const isCorrect = choice.is_correct;
            const showState = isAnswered && (isSelected || isCorrect);

            return (
              <AnswerChoice
                key={choice.id}
                label={String.fromCharCode(65 + (question.choices.indexOf(choice) || 0))}
                text={choice.text}
                selected={isSelected}
                correct={isCorrect}
                disabled={isAnswered}
                onClick={() => !isAnswered && onAnswer(choice.id)}
              />
            );
          })}
        </div>

        {showExplanation && question.explanation && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2 aria-live-polite">
              {selectedIsCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-semibold">
                {selectedIsCorrect ? "Correct!" : "Incorrect"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {question.explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
