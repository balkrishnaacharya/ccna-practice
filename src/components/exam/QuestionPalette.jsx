import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";

export default function QuestionPalette({
  totalQuestions = 60,
  currentQuestion = 1,
  answeredQuestions = new Set(),
  flaggedQuestions = new Set(),
  onQuestionSelect,
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const isAnswered = (q) => answeredQuestions.has(q);
  const isFlagged = (q) => flaggedQuestions.has(q);
  const isCurrent = (q) => q === currentQuestion;

  const paletteClass = (q) => {
    if (isFlagged(q)) return "border-destructive bg-destructive/10 text-destructive";
    if (isAnswered(q)) return "bg-primary/20 text-primary-foreground border-primary/30";
    return "border-border bg-card text-muted-foreground hover:border-primary hover:bg-accent";
  };

  return (
    <>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setSheetOpen(true)}
        >
          Question Palette
        </Button>
      </SheetTrigger>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Question Palette</SheetTitle>
            <SheetDescription>
              Jump to any question. Gold = answered, Red = flagged.
            </SheetDescription>
          </SheetHeader>
          <div className="p-4 space-y-2">
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((q) => (
                <Button
                  key={q}
                  variant={paletteClass(q)}
                  size="sm"
                  onClick={() => {
                    onQuestionSelect?.(q);
                    setSheetOpen(false);
                  }}
                  className={cn(
                    "aspect-square text-xs font-mono",
                    isCurrent(q) ? "ring-2 ring-primary ring-offset-2" : "",
                  )}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
