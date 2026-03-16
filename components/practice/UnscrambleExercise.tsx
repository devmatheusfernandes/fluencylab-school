"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface UnscrambleExerciseProps {
  scrambledWords: string[];
  correctOrder: string[];
  onComplete: (isCorrect: boolean, movesMade: number) => void;
}

export function UnscrambleExercise({
  scrambledWords,
  correctOrder,
  onComplete,
}: UnscrambleExerciseProps) {
  const t = useTranslations("UnscrambleExercise");
  const [availableWords, setAvailableWords] = useState(
    scrambledWords.map((word, i) => ({ id: `${word}-${i}`, word }))
  );
  const [selectedWords, setSelectedWords] = useState<
    { id: string; word: string }[]
  >([]);
  const [movesCount, setMovesCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const handleWordClick = (
    wordObj: { id: string; word: string },
    from: "bank" | "answer"
  ) => {
    if (isLocked) return;
    setMovesCount((prev) => prev + 1);
    if (from === "bank") {
      setAvailableWords((prev) => prev.filter((w) => w.id !== wordObj.id));
      setSelectedWords((prev) => [...prev, wordObj]);
    } else {
      setSelectedWords((prev) => prev.filter((w) => w.id !== wordObj.id));
      setAvailableWords((prev) => [...prev, wordObj]);
    }
  };

  const checkAnswer = () => {
    if (isLocked) return;
    setIsLocked(true);
    const currentSentence = selectedWords.map((w) => w.word).join(" ");
    const correctSentence = correctOrder.join(" ");
    onComplete(currentSentence === correctSentence, movesCount);
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[60vh] p-4 max-w-2xl mx-auto w-full">
      <div className="w-full space-y-8">
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 text-center mb-8">
          {t("title")}
        </h2>

        <div className="min-h-[80px] w-full border-b-2 border-slate-200 dark:border-slate-700 p-2 flex flex-wrap gap-2 items-center justify-start">
          {selectedWords.map((wordObj) => (
            <motion.button
              layoutId={wordObj.id}
              key={wordObj.id}
              onClick={() => handleWordClick(wordObj, "answer")}
              disabled={isLocked}
              className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 border-b-4 active:border-b-2 rounded-xl font-bold text-slate-700 dark:text-slate-200 shadow-sm text-lg"
              whileTap={{ scale: 0.95 }}
            >
              {wordObj.word}
            </motion.button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 justify-center pt-8">
          {availableWords.map((wordObj) => (
            <motion.button
              layoutId={wordObj.id}
              key={wordObj.id}
              onClick={() => handleWordClick(wordObj, "bank")}
              disabled={isLocked}
              className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 border-b-4 active:border-b-2 rounded-xl font-bold text-slate-700 dark:text-slate-200 shadow-sm text-lg"
              whileTap={{ scale: 0.95 }}
            >
              {wordObj.word}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="w-full mt-12">
        <Button
          onClick={checkAnswer}
          disabled={selectedWords.length === 0 || isLocked}
          className="w-full md:w-auto md:min-w-[200px] float-right px-8 py-6 text-lg font-bold uppercase tracking-widest rounded-2xl bg-green-500 hover:bg-green-600 border-green-700 dark:border-green-500 text-white shadow-[0_4px_0_0_#15803d] active:shadow-none active:translate-y-1 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:border-none"
        >
          Check
        </Button>
      </div>
    </div>
  );
}
