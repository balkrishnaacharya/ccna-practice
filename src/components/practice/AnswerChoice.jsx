import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnswerChoice({
  label,
  text,
  selected = false,
  correct = false,
  disabled = false,
  onClick,
}) {
  const isCorrectSelected = selected && correct;
  const isWrongSelected = selected && !correct;

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="outline"
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left text-sm leading-relaxed transition-colors duration-150 ease-out",
        disabled &&
          !isCorrectSelected &&
          !isWrongSelected
          ? "opacity-80 hover:none cursor-not-allowed"
          : "hover:bg-muted hover:border-border",
        isCorrectSelected
          ? "border-green-500 bg-green-500/10 text-green-400"
          : isWrongSelected
            ? "border-red-500 bg-red-500/10 text-red-400"
            : selected
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card",
      )}
      data-state={isCorrectSelected ? "correct" : isWrongSelected ? "incorrect" : undefined}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs">
        {label}
      </div>
      <span className="text-foreground">{text}</span>
    </Button>
  );
}
