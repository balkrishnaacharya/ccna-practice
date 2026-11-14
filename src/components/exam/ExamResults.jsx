import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ExamResults({
  score,
  totalQuestions,
  correctAnswers,
  timeSpentSeconds,
  domainBreakdown = [],
  onReviewAnswers,
  onRetry,
}) {
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const passed = percentage >= 82;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 p-6">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke={passed ? "#22c55e" : "#f59e0b"}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              strokeDasharray: 2 * Math.PI * 42,
              strokeDashoffset: 2 * Math.PI * 42 * (1 - percentage / 100),
            }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center top-0 left-0 w-full h-full">
          <span className="text-3xl font-bold text-foreground">{percentage}%</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{passed ? "Passed" : "Not Passed"}</span>
        </div>
      </div>

      <Badge
        variant={passed ? "secondary" : "destructive"}
        className="px-4 py-2 text-sm font-semibold"
      >
        {passed ? "Ready for Exam" : "Keep Practicing"}
      </Badge>

      <div className="w-full max-w-md space-y-3">
        <p className="text-sm text-muted-foreground">
          {correctAnswers} of {totalQuestions} correct
        </p>
        <p className="text-sm text-muted-foreground">
          Time: {formatTime(timeSpentSeconds)}
        </p>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Domain Breakdown
          </p>
          {domainBreakdown.map((d) => (
            <div key={d.domain} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{d.domain.replace(/_/g, " ")}</span>
                <span className="font-mono">{d.correct} / {d.total}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="h-2 bg-primary rounded-full"
                  style={{ width: `${(d.correct / d.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 w-full max-w-md">
        <Button
          onClick={onReviewAnswers}
          variant="outline"
          className="flex-1"
        >
          Review Answers
        </Button>
        <Button
          onClick={onRetry}
          className="flex-1"
        >
          Retry
        </Button>
      </div>
    </div>
  );
}
