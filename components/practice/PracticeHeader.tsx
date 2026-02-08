"use client";

import { X, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface PracticeHeaderProps {
  progress: number; // 0 to 100
  streak?: number;
  onClose: () => void;
}

export function PracticeHeader({
  progress,
  streak = 0,
  onClose,
}: PracticeHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-1 px-3">
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
      >
        <X className="w-6 h-6 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
      </Button>

      {/* Progress Bar */}
      <div className="flex-1 mx-1 h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 opacity-20" />
        <motion.div
          className="h-full bg-green-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        >
          {/* Highlight shine effect */}
          <div className="absolute top-1 right-2 w-full h-1 bg-white/30 rounded-full" />
        </motion.div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center space-x-1">
          <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-pulse" />
          <span className="text-lg font-bold text-orange-500">{streak}</span>
        </div>
      )}
    </header>
  );
}
