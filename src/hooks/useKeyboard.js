import { useEffect } from "react";

export function useKeyboard({
  enabled = false,
  onSelectAnswer,   // (index: number) => void, index 0-3 for A-D
  onNextQuestion,
  onPrevQuestion,
  onToggleFlag,
  onSubmit,
  onClose,
}) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event) {
      // Ignore when typing in inputs
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.isComposing) return;

      // Keys 1-4: select answer A/B/C/D (index 0-3)
      if (event.key >= "1" && event.key <= "4") {
        event.preventDefault();
        const index = Number(event.key) - 1;
        onSelectAnswer?.(index);
        return;
      }

      // N or ArrowRight: next question
      if (event.key === "n" || event.key === "N" || event.key === "ArrowRight") {
        event.preventDefault();
        onNextQuestion?.();
        return;
      }

      // P or ArrowLeft: previous question
      if (event.key === "p" || event.key === "P" || event.key === "ArrowLeft") {
        event.preventDefault();
        onPrevQuestion?.();
        return;
      }

      // F: toggle flag
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        onToggleFlag?.();
        return;
      }

      // Enter: confirm/submit
      if (event.key === "Enter") {
        event.preventDefault();
        onSubmit?.();
        return;
      }

      // Esc: close any open sheet/dialog
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    enabled,
    onSelectAnswer,
    onNextQuestion,
    onPrevQuestion,
    onToggleFlag,
    onSubmit,
    onClose,
  ]);
}
