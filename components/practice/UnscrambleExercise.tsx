
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface UnscrambleExerciseProps {
  scrambledWords: string[];
  correctOrder: string[];
  onComplete: (isCorrect: boolean, movesMade: number) => void;
}

export function UnscrambleExercise({ scrambledWords, correctOrder, onComplete }: UnscrambleExerciseProps) {
  const [availableWords, setAvailableWords] = useState(scrambledWords.map((word, i) => ({ id: `${word}-${i}`, word })));
  const [selectedWords, setSelectedWords] = useState<{ id: string; word: string }[]>([]);
  const [movesCount, setMovesCount] = useState(0);

  const handleWordClick = (wordObj: { id: string; word: string }, from: 'bank' | 'answer') => {
    setMovesCount(prev => prev + 1);
    if (from === 'bank') {
      setAvailableWords(prev => prev.filter(w => w.id !== wordObj.id));
      setSelectedWords(prev => [...prev, wordObj]);
    } else {
      setSelectedWords(prev => prev.filter(w => w.id !== wordObj.id));
      setAvailableWords(prev => [...prev, wordObj]);
    }
  };

  const checkAnswer = () => {
    const currentSentence = selectedWords.map(w => w.word).join(' ');
    const correctSentence = correctOrder.join(' ');
    onComplete(currentSentence === correctSentence, movesCount);
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[60vh] p-4 max-w-2xl mx-auto w-full">
      <div className="w-full space-y-8">
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 text-center mb-8">
          Reorder the words to form the correct sentence
        </h2>

        {/* Answer Area */}
        <div className="min-h-[80px] w-full border-b-2 border-slate-200 dark:border-slate-700 p-2 flex flex-wrap gap-2 items-center justify-start">
          {selectedWords.map((wordObj) => (
            <motion.button
              layoutId={wordObj.id}
              key={wordObj.id}
              onClick={() => handleWordClick(wordObj, 'answer')}
              className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 border-b-4 active:border-b-2 rounded-xl font-bold text-slate-700 dark:text-slate-200 shadow-sm text-lg"
              whileTap={{ scale: 0.95 }}
            >
              {wordObj.word}
            </motion.button>
          ))}
        </div>

        {/* Word Bank */}
        <div className="flex flex-wrap gap-2 justify-center pt-8">
          {availableWords.map((wordObj) => (
            <motion.button
              layoutId={wordObj.id}
              key={wordObj.id}
              onClick={() => handleWordClick(wordObj, 'bank')}
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
          disabled={selectedWords.length === 0}
          className="w-full md:w-auto md:min-w-[200px] float-right px-8 py-6 text-lg font-bold uppercase tracking-widest rounded-2xl bg-green-500 hover:bg-green-600 text-white shadow-[0_4px_0_0_#15803d] active:shadow-none active:translate-y-1 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          Check
        </Button>
      </div>
    </div>
  );
}
