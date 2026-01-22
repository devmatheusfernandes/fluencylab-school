
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Flame, Star, Trophy } from 'lucide-react';
import Link from 'next/link';

interface PracticeSummaryProps {
  xpGained: number;
  streak: number;
  accuracy: number;
  onGoBack: () => void;
}

export function PracticeSummary({ xpGained, streak, accuracy, onGoBack }: PracticeSummaryProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="text-center mb-12"
      >
        <div className="relative inline-block">
            <Trophy className="w-32 h-32 text-yellow-400 fill-yellow-400 drop-shadow-lg mx-auto mb-6" />
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full -z-10"
            />
        </div>
        <h1 className="text-4xl font-bold text-yellow-500 mb-2">Session Complete!</h1>
        <p className="text-xl text-slate-500 font-medium">You practiced like a champion today.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mb-12">
        {/* XP Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-yellow-400 border-b-4 border-yellow-600 rounded-2xl p-6 flex flex-col items-center justify-center text-white"
        >
          <span className="text-sm font-bold uppercase tracking-widest opacity-90">Total XP</span>
          <div className="flex items-center gap-2 mt-2">
             <Star className="fill-white w-6 h-6" />
             <span className="text-4xl font-black">{xpGained}</span>
          </div>
        </motion.div>

        {/* Streak Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-orange-500 border-b-4 border-orange-700 rounded-2xl p-6 flex flex-col items-center justify-center text-white"
        >
          <span className="text-sm font-bold uppercase tracking-widest opacity-90">Streak</span>
           <div className="flex items-center gap-2 mt-2">
             <Flame className="fill-white w-6 h-6" />
             <span className="text-4xl font-black">{streak}</span>
          </div>
        </motion.div>

        {/* Accuracy Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-green-500 border-b-4 border-green-700 rounded-2xl p-6 flex flex-col items-center justify-center text-white"
        >
          <span className="text-sm font-bold uppercase tracking-widest opacity-90">Accuracy</span>
           <div className="flex items-center gap-2 mt-2">
             <span className="text-4xl font-black">{Math.round(accuracy)}%</span>
          </div>
        </motion.div>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Button 
          onClick={onGoBack}
          className="w-full h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg uppercase tracking-widest shadow-[0_4px_0_0_#2563eb] active:translate-y-1 active:shadow-none transition-all"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
