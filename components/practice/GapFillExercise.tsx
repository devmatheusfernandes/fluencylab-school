
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PracticeAudioPlayer } from './PracticeAudioPlayer';
import { Volume2 } from 'lucide-react';

interface GapFillExerciseProps {
  sentenceWithGap: string;
  correctAnswer: string;
  audioSegment?: { start: number; end: number; url: string };
  onComplete: (isCorrect: boolean, userAnswer: string) => void;
}

export function GapFillExercise({ sentenceWithGap, correctAnswer, audioSegment, onComplete }: GapFillExerciseProps) {
  const [answer, setAnswer] = useState('');
  const [parts, setParts] = useState<string[]>([]);
  const [showAudio, setShowAudio] = useState(false);

  useEffect(() => {
    setParts(sentenceWithGap.split('___'));
  }, [sentenceWithGap]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    
    const isCorrect = answer.trim().toLowerCase() === correctAnswer.toLowerCase();
    onComplete(isCorrect, answer);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 p-4">
      {audioSegment && (
        <Button 
            variant="outline" 
            size="lg" 
            className="rounded-2xl border-2 border-b-4 active:border-b-2 active:translate-y-[2px] border-blue-200 text-blue-500 hover:bg-blue-50 hover:text-blue-600 w-full max-w-xs"
            onClick={() => setShowAudio(true)}
        >
            <Volume2 className="mr-2 h-6 w-6" />
            Listen to Context
        </Button>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-2xl text-center">
        <div className="text-2xl md:text-3xl font-medium leading-relaxed text-slate-700 dark:text-slate-200 flex flex-wrap items-center justify-center gap-2">
          {parts.map((part, index) => (
            <span key={index} className="whitespace-pre-wrap">
              {part}
              {index < parts.length - 1 && (
                <span className="inline-block mx-2 relative">
                    <Input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="w-32 md:w-48 text-center text-xl font-bold bg-slate-100 dark:bg-slate-800 border-b-4 border-slate-300 focus:border-blue-500 focus:bg-white transition-all rounded-xl h-12 md:h-14 inline-block"
                        placeholder="..."
                        autoFocus
                    />
                </span>
              )}
            </span>
          ))}
        </div>

        <div className="mt-12">
            <Button 
                type="submit" 
                disabled={!answer}
                className="w-full md:w-auto px-12 py-6 text-lg font-bold uppercase tracking-widest rounded-2xl bg-green-500 hover:bg-green-600 text-white shadow-[0_4px_0_0_#15803d] active:shadow-none active:translate-y-1 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
                Check
            </Button>
        </div>
      </form>

      {audioSegment && (
        <PracticeAudioPlayer 
            audioUrl={audioSegment.url} 
            isOpen={showAudio} 
            onClose={() => setShowAudio(false)} 
            autoPlay={true}
            startTime={audioSegment.start}
            endTime={audioSegment.end}
        />
      )}
    </div>
  );
}
