'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { PracticeAudioPlayer } from './PracticeAudioPlayer';
import { Volume2, Eye } from 'lucide-react';

interface QuizExerciseProps {
    question: string;
    options: string[];
    correctIndex: number;
    sectionType?: string;
    audioSegment?: { start: number; end: number; url: string };
    onComplete: (isCorrect: boolean) => void;
}

export function QuizExercise({ question, options, correctIndex, sectionType, audioSegment, onComplete }: QuizExerciseProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOptions, setShowOptions] = useState(!audioSegment);
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);

    // Auto-open player if audio exists and options are hidden
    useEffect(() => {
        if (audioSegment && !showOptions) {
            setIsPlayerOpen(true);
        }
    }, [audioSegment, showOptions]);

    const handleSelect = (index: number) => {
        if (isSubmitting) return;
        setSelected(index);
        setIsSubmitting(true);
        
        const isCorrect = index === correctIndex;
        onComplete(isCorrect);
    };

    const handleAudioComplete = () => {
        setShowOptions(true);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            {sectionType && (
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2 text-center">
                    {sectionType}
                </div>
            )}
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
            >
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    {question}
                </h2>
                
                {audioSegment && (
                    <div className="flex justify-center gap-4">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsPlayerOpen(true)}
                            className="text-blue-500 border-blue-200 hover:bg-blue-50"
                        >
                            <Volume2 className="mr-2 h-4 w-4" />
                            {showOptions ? "Listen Again" : "Listen to Audio"}
                        </Button>
                        
                        {!showOptions && (
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setShowOptions(true)}
                                className="text-slate-500"
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                Show Options
                            </Button>
                        )}
                    </div>
                )}
            </motion.div>

            {!showOptions ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Volume2 className="h-12 w-12 mb-4 opacity-20" />
                    <p>Listen to the audio to see the options...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {options.map((option, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            className={cn(
                                "h-auto py-6 px-6 text-lg justify-start text-left whitespace-normal transition-all",
                                selected === index 
                                    ? (index === correctIndex ? "border-green-500 bg-green-50 dark:bg-green-950/30 ring-2 ring-green-500" : "border-rose-500 bg-rose-50 dark:bg-rose-950/30 ring-2 ring-rose-500")
                                    : "hover:border-primary/50 hover:bg-accent"
                            )}
                            onClick={() => handleSelect(index)}
                            disabled={isSubmitting}
                        >
                            <span className={cn(
                                "mr-4 font-mono text-sm border rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center transition-colors",
                                selected === index
                                    ? (index === correctIndex ? "border-green-500 text-green-700 bg-green-200" : "border-rose-500 text-rose-700 bg-rose-200")
                                    : "text-muted-foreground"
                            )}>
                                {String.fromCharCode(65 + index)}
                            </span>
                            <span className="flex-1">{option}</span>
                        </Button>
                    ))}
                </div>
            )}
            
            {audioSegment && (
                <PracticeAudioPlayer
                    audioUrl={audioSegment.url}
                    isOpen={isPlayerOpen}
                    onClose={() => setIsPlayerOpen(false)}
                    startTime={audioSegment.start}
                    endTime={audioSegment.end}
                    onComplete={handleAudioComplete}
                    autoPlay={true}
                />
            )}
        </div>
    );
}
