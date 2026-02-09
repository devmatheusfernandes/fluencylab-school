"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PracticeHeader } from "./PracticeHeader";
import { FeedbackSheet } from "./FeedbackSheet";
import { GapFillExercise } from "./GapFillExercise";
import { UnscrambleExercise } from "./UnscrambleExercise";
import { FlashcardExercise } from "./FlashcardExercise";
import { QuizExercise } from "./QuizExercise";
import { PracticeSummary } from "./PracticeSummary";
import { Spinner } from "@/components/ui/spinner";
import {
  getDailyPractice,
  getSessionProgress,
  saveSessionProgress,
  clearSessionProgress,
  processPracticeResults,
} from "@/actions/srsActions";
import { PracticeItem, PracticeMode } from "@/types/learning/practice";
import { PracticeResult } from "@/types/learning/plan";
import {
  calculateWritingGrade,
  calculateOrderingGrade,
} from "@/lib/learning/grading";
import { CheckCircle, Trophy } from "lucide-react";
import { ListeningChoiceExercise } from "./ListeningChoiceExercise";

interface PracticeSessionProps {
  planId: string;
  dayOverride?: number;
  isReplay?: boolean;
}

export function PracticeSession({ planId, dayOverride, isReplay = false }: PracticeSessionProps) {
  const router = useRouter();

  // Session State
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [sessionMode, setSessionMode] =
    useState<PracticeMode>("flashcard_visual");
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isDailyGoalMet, setIsDailyGoalMet] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    correctAnswer?: string;
    explanation?: string;
    grade?: number;
  }>({ isCorrect: false });
  const [isSaving, setIsSaving] = useState(false);

  // Initialize Session (Load saved or create new)
  useEffect(() => {
    async function initSession() {
      try {
        setIsLoading(true);

        // 1. Try to load saved progress (SKIP IF REPLAY)
        const savedState = !isReplay ? await getSessionProgress(planId) : null;

        if (
          savedState &&
          savedState.items.length > 0 &&
          savedState.currentIndex < savedState.items.length
        ) {
          console.log("Resuming saved session...", savedState);
          setItems(savedState.items);
          setCurrentIndex(savedState.currentIndex);
          setResults(savedState.results);
          setSessionMode(savedState.mode);

          // Recalculate streak/correct from results if needed, or just reset visual streak
          const correct = savedState.results.filter((r) => r.grade >= 3).length;
          setCorrectCount(correct);
          // Streak is harder to reconstruct perfectly without storing it, but starting at 0 is safe/fair on resume
        } else {
          // 2. No valid saved state, fetch new daily practice
          console.log("Starting new daily practice for plan:", planId);
          const dailySession = await getDailyPractice(planId, dayOverride);
          console.log(
            "Daily session received:",
            dailySession
              ? { ...dailySession, itemsCount: dailySession.items?.length }
              : "null",
          );

          if (
            !dailySession ||
            !dailySession.items ||
            dailySession.items.length === 0
          ) {
            if (dailySession?.error) {
              setSessionError(dailySession.error);
              setIsLoading(false);
              return;
            }

            // Handle empty session (Daily Goal Met)
            console.log(
              "No items returned for daily practice - Daily Goal Met",
            );
            setIsDailyGoalMet(true);
            setIsLoading(false);
            return;
          }

          setItems(dailySession.items);
          setSessionMode(dailySession.mode);
          setCurrentIndex(0);
          setResults([]);

          // Initialize save state
          if (!isReplay) {
            console.log("Saving initial session state...");
            await saveSessionProgress(planId, {
              planId,
              currentDay: dailySession.dayIndex,
              mode: dailySession.mode,
              currentIndex: 0,
              results: [],
              items: dailySession.items,
              lastUpdated: new Date(),
            });
            console.log("Session state saved successfully");
          }
        }
      } catch (error) {
        console.error("Failed to initialize session details:", error);
        alert(
          `Failed to load practice session: ${error instanceof Error ? error.message : String(error)}`,
        );
        router.push("/hub/student/my-notebook");
      } finally {
        setIsLoading(false);
      }
    }

    if (planId) {
      initSession();
    }
  }, [planId, router]);

  const currentItem = items[currentIndex];
  const progress = items.length > 0 ? (currentIndex / items.length) * 100 : 0;

  // Save Progress Helper
  const syncProgress = async (
    newIndex: number,
    newResults: PracticeResult[],
  ) => {
    // Don't await this to keep UI snappy, but track error state if critical
    // In a robust app, we might use optimistic updates + queue
    if (!isReplay) {
      saveSessionProgress(planId, {
        planId,
        currentDay: 0, // We should store this in state if we want to preserve it accurately
        mode: sessionMode,
        currentIndex: newIndex,
        results: newResults,
        items: items, // Save items to ensure consistency
        lastUpdated: new Date(),
      }).catch((e) => console.error("Auto-save failed:", e));
    }
  };

  const handleComplete = (
    isCorrect: boolean,
    grade: 0 | 1 | 2 | 3 | 4 | 5,
    userAnswer?: string,
    explanation?: string,
  ) => {
    const correct = isCorrect;

    if (correct) {
      setStreak((prev) => prev + 1);
      setCorrectCount((prev) => prev + 1);
      // Play success sound
    } else {
      setStreak(0);
      // Play fail sound
    }

    // Record Result
    const resultEntry: PracticeResult = {
      itemId: currentItem.id,
      grade: grade,
      type: currentItem.type,
      timestamp: new Date(),
    } as PracticeResult;

    const updatedResults = [...results, resultEntry];
    setResults(updatedResults);

    // Prepare Feedback Data
    let correctAnswerText = undefined;
    if (!correct) {
      if (
        currentItem.renderMode === "gap_fill_listening" &&
        currentItem.gapFill
      ) {
        correctAnswerText = currentItem.gapFill.correctAnswer;
      } else if (
        currentItem.renderMode === "sentence_unscramble" &&
        currentItem.unscramble
      ) {
        correctAnswerText = currentItem.unscramble.correctOrder.join(" ");
      } else if (
        currentItem.quiz &&
        currentItem.quiz.options &&
        typeof currentItem.quiz.correctIndex === "number"
      ) {
        correctAnswerText =
          currentItem.quiz.options[currentItem.quiz.correctIndex];
      }
    }

    // Determine if we should show motivational feedback (based on grade) or simple binary feedback
    // Only Flashcard modes are truly self-graded and benefit from the "Hard/Easy" motivational messages.
    // Auto-graded modes (Gap Fill, Unscramble, Quiz) should use binary Correct/Incorrect feedback to ensure correct answer is shown on error.
    const isFlashcardMode = [
      "flashcard_visual",
      "flashcard_recall",
      "review_standard",
    ].includes(currentItem.renderMode);

    setLastResult({
      isCorrect: correct,
      correctAnswer: correctAnswerText,
      explanation: explanation || currentItem.quiz?.explanation,
      grade: isFlashcardMode ? grade : undefined,
    });

    // Trigger Auto-save (Save CURRENT index + NEW results)
    // We save the *next* index only when user clicks continue?
    // Better to save current state "finished item X".
    // Actually, if we save currentIndex + 1 now, and user closes browser, they skip feedback?
    // Requirement: "Go back exactly to where it stopped".
    // If stopped at feedback screen, resuming at next question is acceptable.
    // Let's save the result now, but keep index same until nextStep.
    // BUT: If we reload, we reload at currentIndex.
    // We need to persist that we *finished* this item.
    // Simplest: Save updated results, keep index. On resume, if results.length > index, we know we are pending next.
    // Or just save index+1 in `nextStep`.

    setShowFeedback(true);
  };

  const nextStep = async () => {
    setShowFeedback(false);

    if (currentIndex < items.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      await syncProgress(nextIndex, results);
    } else {
      await finishSession();
    }
  };

  const finishSession = async () => {
    setIsSaving(true);
    try {
      // 1. Process Results (Update SRS)
      await processPracticeResults(planId, results, isReplay);

      // 2. Clear Saved Session
      if (!isReplay) {
        await clearSessionProgress(planId);
      }

      setIsSessionComplete(true);
    } catch (error) {
      console.error("Error finishing session:", error);
      alert("Error saving results. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Optional: Save one last time? (Auto-save handles it)
    router.push("/hub/student/my-notebook");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Spinner />
      </div>
    );
  }

  if (isSessionComplete) {
    return (
      <PracticeSummary
        xpGained={isReplay ? 0 : correctCount * 10 + streak * 2}
        streak={streak}
        accuracy={(correctCount / items.length) * 100}
        onGoBack={handleClose}
      />
    );
  }

  if (isDailyGoalMet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        {/* Celebration Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full text-center border-2 border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center gap-6">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center relative">
            <Trophy size={48} className="text-green-600 dark:text-green-400" />
            <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900">
              <CheckCircle size={16} className="text-white" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">
              Daily Goal Met!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              You've completed everything for today. Great job keeping your
              streak alive!
            </p>
          </div>

          <div className="w-full pt-4">
            <Button
              onClick={handleClose}
              className="border-none w-full h-14 text-lg rounded-2xl bg-primary font-bold uppercase tracking-wider"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentItem) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <PracticeHeader
        progress={progress}
        streak={streak}
        onClose={handleClose}
      />

      <main className="max-h-[calc(90vh--50px)] flex-1 flex flex-col justify-center pt-10 px-6 max-w-3xl mx-auto w-full">
        {currentItem.renderMode === "gap_fill_listening" &&
          currentItem.gapFill && (
            <GapFillExercise
              key={currentItem.id}
              sentenceWithGap={currentItem.gapFill.sentenceWithGap}
              correctAnswer={currentItem.gapFill.correctAnswer}
              audioSegment={currentItem.gapFill.audioSegment}
              onComplete={(isCorrect, ans) => {
                const grade = calculateWritingGrade(
                  ans,
                  currentItem.gapFill!.correctAnswer,
                );
                // 3-5 is considered "correct" for streak purposes in strict mode,
                // but let's use isCorrect boolean from component or logic
                // calculateWritingGrade returns 0-5.
                // 5 = Perfect, 4 = Typo. Let's say >= 4 is correct visually.
                handleComplete(grade >= 4, grade, ans);
              }}
            />
          )}

        {currentItem.renderMode === "sentence_unscramble" &&
          currentItem.unscramble && (
            <UnscrambleExercise
              key={currentItem.id}
              scrambledWords={currentItem.unscramble.scrambledWords}
              correctOrder={currentItem.unscramble.correctOrder}
              onComplete={(isCorrect, movesMade) => {
                // Calculate grade based on efficiency if correct
                // If incorrect, it's always grade 1 (Fail)
                let grade: 0 | 1 | 2 | 3 | 4 | 5 = 1;

                if (isCorrect) {
                  const minMoves = currentItem.unscramble!.correctOrder.length;
                  grade = calculateOrderingGrade(movesMade, minMoves);
                }

                handleComplete(isCorrect, grade);
              }}
            />
          )}

        {(currentItem.renderMode === "flashcard_visual" ||
          currentItem.renderMode === "flashcard_recall" ||
          currentItem.renderMode === "review_standard") &&
          currentItem.flashcard && (
            <FlashcardExercise
              key={currentItem.id}
              front={currentItem.flashcard.front}
              back={currentItem.flashcard.back}
              imageUrl={currentItem.flashcard.imageUrl}
              onResult={(grade) => {
                // Flashcard returns 0, 1, 3, 5 directly
                handleComplete(grade >= 3, grade);
              }}
            />
          )}

        {currentItem.renderMode === "listening_choice" &&
          currentItem.interactiveListening && (
            <ListeningChoiceExercise
              key={currentItem.id}
              audioUrl={currentItem.interactiveListening.audioUrl}
              transcriptSegments={
                currentItem.interactiveListening.transcriptSegments
              }
              learningItems={currentItem.interactiveListening.learningItems}
              onComplete={(grade) => {
                const intGrade = Math.round(grade) as 0 | 1 | 2 | 3 | 4 | 5;
                handleComplete(intGrade >= 3, intGrade);
              }}
            />
          )}

        {(currentItem.renderMode === "quiz_comprehensive" ||
          (currentItem.renderMode === "listening_choice" &&
            !currentItem.interactiveListening)) &&
          currentItem.quiz && (
            <QuizExercise
              key={currentItem.id}
              question={currentItem.quiz.question}
              options={currentItem.quiz.options}
              correctIndex={currentItem.quiz.correctIndex}
              sectionType={currentItem.quiz.sectionType}
              audioSegment={currentItem.quiz.audioSegment}
              onComplete={(isCorrect) => {
                handleComplete(
                  isCorrect,
                  isCorrect ? 5 : 1,
                  undefined,
                  currentItem.quiz?.explanation,
                );
              }}
            />
          )}
      </main>

      <FeedbackSheet
        isOpen={showFeedback}
        isCorrect={lastResult.isCorrect}
        correctAnswer={lastResult.correctAnswer}
        explanation={lastResult.explanation}
        grade={lastResult.grade}
        onContinue={nextStep}
      />

      {isSaving && (
        <div className="fixed top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
          Saving...
        </div>
      )}
    </div>
  );
}
