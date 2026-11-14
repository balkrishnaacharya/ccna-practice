import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import FlashcardReview from "./FlashcardReview";
import { cn } from "@/lib/utils";

export default function FlashcardDeck() {
  const [cards, setCards] = useState([]);
  const [count, setCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewResults, setReviewResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    let mounted = true;

    const loadDue = async () => {
      try {
        const [dueCards, dueCount] = await Promise.all([
          invoke("get_flashcards_due", { today }),
          invoke("get_flashcard_due_count", { today }),
        ]);
        if (mounted) {
          setCards(dueCards || []);
          setCount(dueCount || 0);
          setLoading(false);
        }
      } catch (err) {
        console.error("load flashcards failed:", err);
        if (mounted) {
          setError(String(err));
          setLoading(false);
        }
      }
    };

    loadDue();

    return () => {
      mounted = false;
    };
  }, [today]);

  const currentCard = cards[currentIndex];
  const isComplete = currentIndex >= cards.length;

  const handleRating = useCallback(async (cardId, quality) => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    try {
      await invoke("review_flashcard", {
        id: cardId,
        quality,
        due_date: tomorrow,
      });

      setReviewResults((prev) => [...prev, { cardId, quality }]);

      if (currentIndex + 1 < cards.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // All cards reviewed
      }
    } catch (err) {
      console.error("review failed:", err);
    }
  }, [currentIndex, cards.length]);

  const correctCount = reviewResults.filter((r) => r.quality >= 3).length;
  const totalReviewed = reviewResults.length;

  if (loading) {
    return (
      <Card className="border-border bg-card rounded-xl p-6 text-center">
        <CardContent>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#B8842A] border-t-transparent"></div>
          <p className="text-sm text-muted-foreground mt-3">Loading flashcards…</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border bg-card rounded-xl p-6">
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-heart-light bg-heart/10 border border-heart/20 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (count === 0 && !isComplete) {
    return (
      <Card className="border-border bg-card rounded-xl p-6 text-center">
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10">
            <Clock className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="font-serif text-xl font-semibold text-paper">
              No cards due today
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Answer practice questions incorrectly to generate flashcards.
              They’ll appear here for spaced repetition review.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    const pct = totalReviewed > 0 ? Math.round((correctCount / totalReviewed) * 100) : 0;
    return (
      <Card className="border-border bg-card rounded-xl p-6 text-center">
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <CheckCircle2 className="w-12 h-12 text-sage-light mb-4" />
            <h3 className="font-serif text-2xl font-semibold text-paper mb-2">
              Review Complete
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {correctCount} of {totalReviewed} correct ({pct}%)
            </p>
            <Button
              onClick={() => {
                setCurrentIndex(0);
                setReviewResults([]);
                // Reload cards
                invoke("get_flashcards_due", { today }).then((c) => {
                  setCards(c || []);
                  setCount(c?.length || 0);
                });
              }}
            >
              Review Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card rounded-xl overflow-hidden">
      <CardHeader className="px-6 py-4 flex items-center justify-between">
        <div>
          <CardTitle className="font-serif text-lg font-semibold text-foreground">
            Flashcard Review
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Card {currentIndex + 1} of {count}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {count} due
        </Badge>
      </CardHeader>
      <CardContent className="p-6 h-[400px] flex items-center justify-center">
        <FlashcardReview
          card={currentCard}
          onRating={handleRating}
        />
      </CardContent>
    </Card>
  );
}
