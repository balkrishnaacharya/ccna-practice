import { Keyboard } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function Key({ children }) {
  return (
    <kbd className="rounded border border-dark-border bg-dark-elevated px-1.5 py-0.5 font-mono text-[10px] text-paper">
      {children}
    </kbd>
  );
}

/**
 * Small always-available affordance that explains the keyboard controls.
 * `variant="exam"` swaps answer selection for question navigation.
 */
export default function ShortcutsHint({ variant = "quiz" }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Keyboard shortcuts"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-dark-border bg-dark-surface text-paper-muted transition-colors hover:border-gold/40 hover:text-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          <Keyboard size={15} strokeWidth={1.8} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs flex-col items-start gap-1.5 p-3">
        <p className="font-semibold">Keyboard shortcuts</p>
        <p className="flex items-center gap-1.5">
          <Key>1</Key>–<Key>4</Key> Select an option
        </p>
        <p className="flex items-center gap-1.5">
          <Key>Enter</Key> {variant === "exam" ? "Next question" : "Submit / next"}
        </p>
        <p className="flex items-center gap-1.5">
          <Key>←</Key> <Key>→</Key>{" "}
          {variant === "exam" ? "Navigate questions" : "Navigate quick-quiz questions"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
