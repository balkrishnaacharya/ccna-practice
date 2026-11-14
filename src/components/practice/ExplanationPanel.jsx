import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExplanationPanel({
  explanation,
  correct,
  open = false,
}) {
  if (!explanation || !open) return null;

  return (
    <Card className={cn("border-border bg-muted rounded-xl overflow-hidden", open ? "animate-in slide-in-from-top-2 duration-200 ease-out" : "")}>
      <CardHeader className="px-4 py-3 flex items-center gap-2">
        {correct ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
        <h3 className="text-sm font-semibold text-muted-foreground">
          {correct ? "Explanation" : "Why it's incorrect"}
        </h3>
      </CardHeader>
      <CardContent className="px-4 py-3">
        <p className="text-sm text-foreground leading-relaxed">{explanation}</p>
      </CardContent>
    </Card>
  );
}
