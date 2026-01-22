
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LearningItemProps {
  text: string;
  translation?: string;
  pronunciation?: string;
  audioUrl?: string;
  onPlayAudio?: () => void;
  className?: string;
}

export function LearningItem({ text, translation, pronunciation, audioUrl, onPlayAudio, className }: LearningItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <span 
          className={`cursor-pointer border-b-2 border-dashed border-slate-400 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-1 rounded transition-colors ${className}`}
          onClick={() => setIsOpen(true)}
        >
          {text}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-xl rounded-xl">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                {onPlayAudio && (
                    <button 
                        onClick={onPlayAudio}
                        className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-500 hover:bg-blue-200 transition-colors"
                    >
                        <Volume2 size={20} />
                    </button>
                )}
                <div>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{text}</p>
                    {pronunciation && <p className="text-sm text-slate-500 font-mono">/{pronunciation}/</p>}
                </div>
            </div>
            {translation && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-base font-medium text-green-600 dark:text-green-400">{translation}</p>
                </div>
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
