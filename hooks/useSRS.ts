import { useState, useCallback, useEffect } from 'react';
import { Flashcard, ReviewGrade } from '@/types/srs';
import { calculateNextReview } from '@/lib/srs/algorithm';

interface UseSRSProps {
  initialCards: Flashcard[];
  onReview?: (cardId: string, grade: ReviewGrade, newCard: Flashcard) => void;
  onComplete?: () => void;
}

export function useSRS({ initialCards, onReview, onComplete }: UseSRSProps) {
  const [queue, setQueue] = useState<Flashcard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    xpEarned: 0
  });

  // Reset if initialCards changes
  useEffect(() => {
    setQueue(initialCards);
    setCurrentIndex(0);
    setCompletedCount(0);
    setSessionStats({ correct: 0, incorrect: 0, xpEarned: 0 });
  }, [initialCards]);

  const currentCard = queue[currentIndex];
  // We determine session completion by checking if we've processed all cards in the initial queue
  const isSessionComplete = completedCount > 0 && completedCount === queue.length;

  const submitReview = useCallback((grade: ReviewGrade) => {
    if (!currentCard) return;

    const newSrsData = calculateNextReview(grade, currentCard.srsData);
    
    const updatedCard = {
      ...currentCard,
      srsData: newSrsData,
      lastReviewedAt: new Date(),
    };

    // Stats update
    setSessionStats(prev => ({
      ...prev,
      correct: grade >= 3 ? prev.correct + 1 : prev.correct,
      incorrect: grade < 3 ? prev.incorrect + 1 : prev.incorrect,
    }));

    if (onReview) {
      onReview(currentCard.id, grade, updatedCard);
    }

    setCompletedCount(prev => prev + 1);
    
    // Move to next card
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
       // End of queue
       if (onComplete) onComplete();
    }
  }, [currentCard, currentIndex, queue.length, onReview, onComplete]);

  return {
    currentCard,
    currentIndex,
    totalCards: queue.length,
    completedCount,
    isSessionComplete,
    submitReview,
    progress: queue.length > 0 ? (completedCount / queue.length) * 100 : 0,
    sessionStats
  };
}
