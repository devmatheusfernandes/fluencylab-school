"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { PracticeHeader } from "./PracticeHeader";
import { FeedbackSheet } from "./FeedbackSheet";
import { GapFillExercise } from "./GapFillExercise";
import { UnscrambleExercise } from "./UnscrambleExercise";
import { FlashcardExercise } from "./FlashcardExercise";
import { QuizExercise } from "./QuizExercise";
import { PracticeSummary } from "./PracticeSummary";
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
import { SpinnerLoading } from "../transitions/spinner-loading";

interface PracticeSessionProps {
  planId: string;
  dayOverride?: number;
  isReplay?: boolean;
  lessonId?: string;
}

export function PracticeSession({
  planId,
  dayOverride,
  isReplay = false,
  lessonId,
}: PracticeSessionProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const getLanguageCode = (lang?: string) => {
    if (!lang) return "en-US";
    const map: Record<string, string> = {
      Inglês: "en-US",
      Espanhol: "es-ES",
      Português: "pt-BR",
      Libras: "pt-BR",
    };
    return map[lang] || "en-US";
  };

  const targetLanguage = getLanguageCode(session?.user?.languages?.[0]);

  const [items, setItems] = useState<PracticeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [sessionMode, setSessionMode] =
    useState<PracticeMode>("flashcard_visual");
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    async function initSession() {
      try {
        setIsLoading(true);
        const savedState = !isReplay ? await getSessionProgress(planId) : null;

        if (
          savedState &&
          savedState.items.length > 0 &&
          savedState.currentIndex < savedState.items.length
        ) {
          setItems(savedState.items);
          setCurrentIndex(savedState.currentIndex);
          setResults(savedState.results);
          setSessionMode(savedState.mode);
          const correct = savedState.results.filter((r) => r.grade >= 3).length;
          setCorrectCount(correct);
        } else {
          const dailySession = await getDailyPractice(
            planId,
            dayOverride,
            lessonId
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
            setIsDailyGoalMet(true);
            setIsLoading(false);
            return;
          }

          setItems(dailySession.items);
          setSessionMode(dailySession.mode);
          setCurrentIndex(0);
          setResults([]);

          if (!isReplay) {
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
          `Failed to load practice session: ${error instanceof Error ? error.message : String(error)}`
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

  const syncProgress = async (
    newIndex: number,
    newResults: PracticeResult[]
  ) => {
    if (!isReplay) {
      saveSessionProgress(planId, {
        planId,
        currentDay: 0,
        mode: sessionMode,
        currentIndex: newIndex,
        results: newResults,
        items: items,
        lastUpdated: new Date(),
      }).catch((e) => console.error("Auto-save failed:", e));
    }
  };

  const handleComplete = (
    isCorrect: boolean,
    grade: 0 | 1 | 2 | 3 | 4 | 5,
    userAnswer?: string,
    explanation?: string
  ) => {
    const correct = isCorrect;

    if (correct) {
      setStreak((prev) => prev + 1);
      setCorrectCount((prev) => prev + 1);
    } else {
      setStreak(0);
    }
    const resultEntry: PracticeResult = {
      itemId: currentItem.id,
      grade: grade,
      type: currentItem.type,
      timestamp: new Date(),
    } as PracticeResult;

    const updatedResults = [...results, resultEntry];
    setResults(updatedResults);

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
      await processPracticeResults(planId, results, isReplay, streak);
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
    router.push("/hub/student/my-notebook");
  };

  if (isLoading) {
    return <SpinnerLoading />;
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
              audioText={
                currentItem.gapFill.audioSegment
                  ? undefined
                  : currentItem.gapFill.correctAnswer
              }
              language={targetLanguage}
              onComplete={(isCorrect, ans) => {
                const grade = calculateWritingGrade(
                  ans,
                  currentItem.gapFill!.correctAnswer
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
                  currentItem.quiz?.explanation
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
        <div className="absolute min-w-screen min-h-screen flex items-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 z-99">
          <SpinnerLoading />
        </div>
      )}
    </div>
  );
}
