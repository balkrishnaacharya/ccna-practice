import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function PracticeProgress({ totalQuestions = 0, answeredQuestions = 0, correctQuestions = 0 }) {
  const percentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  return (
    <SheetTrigger asChild>
      <Button variant="outline" size="sm" className="w-full">
        Practice Progress
      </Button>
    </SheetTrigger>
  );
}
