import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const RATING_BUTTONS = [
  { label: "Again", quality: 0, color: "text-heart-light bg-heart/10 border-heart/30", bgHover: "bg-heart/20" },
  { label: "Hard", quality: 3, color: "text-gold bg-gold/10 border-gold/30", bgHover: "bg-gold/20" },
  { label: "Good", quality: 4, color: "text-sage-light bg-sage/10 border-sage/30", bgHover: "bg-sage/20" },
  { label: "Easy", quality: 5, color: "text-primary bg-primary/10 border-primary/30", bgHover: "bg-primary/20" },
];

export default function FlashcardReview({ card, onRating }) {
  const [flipped, setFlipped] = useState(false);
  const [showRating, setShowRating] = useState(false);

  const handleFlip = () => setFlipped((f) => !f);

  const handleRate = useCallback(
    (quality) => {
      setShowRating(false);
      onRating(card.id, quality);
    },
    [card.id, onRating],
  );

  const cardClass = `relative w-full h-64 perspective-1000 duration-300 ease-out ${
    flipped ? "rotate-y-180" : ""
  }`;

  const faceClass = `absolute inset-0 w-full h-full rounded-2xl border border-border p-6 backface-hidden flex flex-col justify-between shadow-lg`;

  if (!card) {
    return (
      <Card className="border-border bg-card rounded-xl p-6 text-center">
        <CardContent>
          <h3 className="font-serif text-xl font-semibold text-paper">
            No cards due for review
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Come back later or answer some practice questions to generate flashcards.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card rounded-xl overflow-hidden">
      {!showRating ? (
        <div
          className={cardClass}
          onClick={handleFlip}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleFlip();
            }
          }}
          aria-label={flipped ? "Show card front" : "Show card back"}
        >
          <div className={faceClass}>
            <div className="space-y-4">
              <CardHeader>
                <CardTitle className="font-serif text-lg font-semibold text-foreground">
                  Question
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg text-foreground leading-relaxed">
                  {card.front}
                </p>
                <div className="flex justify-end">
                  <Button variant="ghost" size="icon" onClick={handleFlip}>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </div>
          </div>
          <div className={faceClass} style={{ transform: "rotateY(180deg)" }}>
            <div className="space-y-4">
              <CardHeader>
                <CardTitle className="font-serif text-lg font-semibold text-foreground">
                  Answer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg text-foreground leading-relaxed">
                  {card.back}
                </p>
                <div className="flex justify-end">
                  <Button variant="ghost" size="icon" onClick={handleFlip}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
                <button
                  onClick={() => setShowRating(true)}
                  className="w-full py-3 bg-[#B8842A]/10 text-[#B8842A] border border-[#B8842A]/30 rounded-xl text-sm font-semibold hover:bg-[#B8842A]/20 transition-colors"
                >
                  I got it — rate my recall
                </button>
              </CardContent>
            </div>
          </div>
        </div>
      ) : (
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="font-serif text-xl font-semibold text-foreground">
              How well did you know this?
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {RATING_BUTTONS.map((btn) => (
                <Button
                  key={btn.label}
                  onClick={() => handleRate(btn.quality)}
                  variant="outline"
                  className={`w-full py-3 text-sm font-semibold ${
                    btn.color
                  } hover:${btn.bgHover} transition-colors`}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
