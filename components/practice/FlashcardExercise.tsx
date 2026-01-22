
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotateCw, Volume2 } from 'lucide-react';

interface FlashcardExerciseProps {
  front: React.ReactNode;
  back: React.ReactNode;
  imageUrl?: string | null;
  onResult: (grade: 0 | 1 | 3 | 4 | 5) => void;
}

export function FlashcardExercise({ front, back, imageUrl, onResult }: FlashcardExerciseProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    window.speechSynthesis.cancel(); // Stop audio on flip
    setIsFlipped(!isFlipped);
  };

  const handleSpeak = (e: React.MouseEvent, content: React.ReactNode) => {
    e.stopPropagation();
    if (typeof content === 'string') {
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.lang = 'en-US';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 w-full max-w-md mx-auto perspective-1000">
      {/* Card Container */}
      <div 
        className="relative w-full aspect-[3/4] cursor-pointer group perspective-1000"
        onClick={handleFlip}
      >
        {/* Background Cards Effect */}
        <div className="absolute top-2 left-2 right-[-8px] bottom-[-8px] bg-slate-200 dark:bg-slate-800 rounded-3xl border-2 border-slate-300 dark:border-slate-700 z-0" />
        <div className="absolute top-1 left-1 right-[-4px] bottom-[-4px] bg-slate-100 dark:bg-slate-700 rounded-3xl border-2 border-slate-200 dark:border-slate-600 z-10" />

        {/* Main Card with Flip Animation */}
        <motion.div
          className="relative w-full h-full z-20 transition-all duration-500 preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 rounded-3xl border-b-4 border-slate-200 dark:border-slate-700 shadow-xl flex flex-col items-center justify-center p-8 text-center">
             <button 
                onClick={(e) => handleSpeak(e, front)}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-blue-500 transition-colors z-30"
                title="Listen"
             >
                <Volume2 size={24} />
             </button>

             {imageUrl && (
                 <div className="mb-6 w-full max-h-[180px] flex justify-center">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img 
                        src={imageUrl} 
                        alt="Flashcard visual" 
                        className="rounded-lg max-h-[180px] w-auto object-contain shadow-sm border border-slate-100" 
                     />
                 </div>
             )}

             <div className="text-3xl font-bold text-slate-700 dark:text-slate-200">
               {front}
             </div>
             <p className="absolute bottom-8 text-slate-400 text-sm uppercase tracking-widest font-bold">Tap to flip</p>
          </div>

          {/* Back */}
          <div 
            className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 rounded-3xl border-b-4 border-slate-200 dark:border-slate-700 shadow-xl flex flex-col items-center justify-center p-8 text-center"
            style={{ transform: "rotateY(180deg)" }}
          >
             <button 
                onClick={(e) => handleSpeak(e, back)}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-blue-500 transition-colors z-30"
                title="Listen"
             >
                <Volume2 size={24} />
             </button>

             <div className="text-2xl font-medium text-slate-600 dark:text-slate-300">
               {back}
             </div>
          </div>
        </motion.div>
      </div>

      {/* Controls - Only show when flipped */}
      <div className="h-24 w-full mt-8 flex items-center justify-center">
        <AnimatePresence>
          {isFlipped && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="grid grid-cols-4 gap-2 w-full"
            >
              <Button 
                onClick={(e) => { e.stopPropagation(); onResult(1); setIsFlipped(false); }}
                className="h-14 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-[0_4px_0_0_#be123c] active:translate-y-1 active:shadow-none transition-all px-1"
                title="Fail / Again"
              >
                Again
              </Button>
              <Button 
                onClick={(e) => { e.stopPropagation(); onResult(3); setIsFlipped(false); }}
                className="h-14 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-[0_4px_0_0_#b45309] active:translate-y-1 active:shadow-none transition-all px-1"
                title="Hard"
              >
                Hard
              </Button>
              <Button 
                onClick={(e) => { e.stopPropagation(); onResult(4); setIsFlipped(false); }}
                className="h-14 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm shadow-[0_4px_0_0_#4338ca] active:translate-y-1 active:shadow-none transition-all px-1"
                title="Good"
              >
                Good
              </Button>
              <Button 
                onClick={(e) => { e.stopPropagation(); onResult(5); setIsFlipped(false); }}
                className="h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-[0_4px_0_0_#047857] active:translate-y-1 active:shadow-none transition-all px-1"
                title="Easy"
              >
                Easy
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
