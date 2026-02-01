"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, CheckCircle, ArrowRight, Volume2, HelpCircle } from "lucide-react";
import { TranscriptSegment, LearningItem } from "@/types/learning/lesson";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ListeningChoiceExerciseProps {
  audioUrl: string;
  transcriptSegments: TranscriptSegment[];
  learningItems: LearningItem[];
  onComplete: (score: number) => void;
}

type GapState = {
  hasGap: boolean;
  correctWord: string;
  displayParts: [string, string]; // [before, after]
  options: string[];
  selectedOption: string | null;
  isCorrect: boolean | null;
};

export function ListeningChoiceExercise({
  audioUrl,
  transcriptSegments,
  learningItems,
  onComplete,
}: ListeningChoiceExerciseProps) {
  const [phase, setPhase] = useState<"full_listen" | "interactive">("full_listen");
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasListenedOnce, setHasListenedOnce] = useState(false);
  
  // Interactive Phase
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [gapState, setGapState] = useState<GapState | null>(null);
  const [score, setScore] = useState(0);
  const [totalGaps, setTotalGaps] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize Gap for current segment
  useEffect(() => {
    if (phase === "interactive" && transcriptSegments[currentSegmentIndex]) {
      const segment = transcriptSegments[currentSegmentIndex];
      const text = segment.text;
      
      // Find matching learning item
      // Sort by length desc to match longest phrases first
      const sortedItems = [...learningItems].sort((a, b) => b.mainText.length - a.mainText.length);
      
      let match: LearningItem | null = null;
      let matchIndex = -1;

      for (const item of sortedItems) {
        // Simple case-insensitive match
        // Ensure word boundary or at least not inside another word if possible
        const regex = new RegExp(`\\b${item.mainText}\\b`, 'i');
        const found = text.match(regex);
        if (found && found.index !== undefined) {
          match = item;
          matchIndex = found.index;
          break;
        }
      }

      if (match && matchIndex !== -1) {
        const before = text.substring(0, matchIndex);
        const after = text.substring(matchIndex + match.mainText.length);
        const correctWord = match.mainText;

        // Generate Options
        const distractors = learningItems
          .filter(i => i.id !== match!.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 2)
          .map(i => i.mainText);
        
        // If not enough distractors, add some dummy ones or random words from text?
        // Fallback to "Option A", "Option B" if really broken, but unlikely with decent lesson
        while (distractors.length < 2) {
           distractors.push("..."); 
        }

        const options = [correctWord, ...distractors].sort(() => 0.5 - Math.random());

        setGapState({
          hasGap: true,
          correctWord,
          displayParts: [before, after],
          options,
          selectedOption: null,
          isCorrect: null
        });
        setTotalGaps(prev => prev + 1);
      } else {
        setGapState({
          hasGap: false,
          correctWord: "",
          displayParts: [text, ""],
          options: [],
          selectedOption: null,
          isCorrect: null
        });
      }
      
      // Auto-play segment
      if (audioRef.current) {
        audioRef.current.currentTime = segment.start;
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
        
        // Schedule pause
        const duration = (segment.end - segment.start) * 1000;
        const timeout = setTimeout(() => {
             if(audioRef.current) {
                 audioRef.current.pause();
                 setIsPlaying(false);
             }
        }, duration + 200); // Small buffer
        return () => clearTimeout(timeout);
      }
    }
  }, [phase, currentSegmentIndex, transcriptSegments, learningItems]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleFullListenEnd = () => {
    setIsPlaying(false);
    setHasListenedOnce(true);
  };

  const startInteractive = () => {
    setPhase("interactive");
    setCurrentSegmentIndex(0);
    setScore(0);
    setTotalGaps(0);
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
  };

  const handleOptionSelect = (option: string) => {
    if (!gapState || gapState.selectedOption) return; // Already answered

    const isCorrect = option.toLowerCase() === gapState.correctWord.toLowerCase();
    setGapState({
      ...gapState,
      selectedOption: option,
      isCorrect
    });

    if (isCorrect) setScore(prev => prev + 1);
  };

  const nextSegment = () => {
    if (currentSegmentIndex < transcriptSegments.length - 1) {
      setCurrentSegmentIndex(prev => prev + 1);
    } else {
      // Finished
      const finalScore = totalGaps > 0 ? (score / totalGaps) * 5 : 5; // 0-5 scale
      onComplete(finalScore);
    }
  };

  // Phase 1: Full Listening UI
  if (phase === "full_listen") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in">
        <div className="text-center space-y-4 max-w-lg">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Volume2 size={40} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Listen to the Full Audio
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Listen to the entire conversation once. Try to understand the context before we practice details.
          </p>
        </div>

        <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-4">
            <audio 
                ref={audioRef} 
                src={audioUrl} 
                onEnded={handleFullListenEnd}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="hidden"
            />
            
            <Button
                size="lg"
                className={cn(
                    "rounded-full w-16 h-16 flex items-center justify-center",
                    isPlaying ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-indigo-600 text-white hover:bg-indigo-700"
                )}
                onClick={togglePlay}
            >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </Button>
            
            <p className="text-sm font-medium text-slate-500">
                {isPlaying ? "Playing..." : "Tap to Play"}
            </p>
        </div>

        {hasListenedOnce && (
             <Button onClick={startInteractive} className="w-full max-w-xs" size="lg">
                Continue to Practice <ArrowRight className="ml-2 w-4 h-4" />
             </Button>
        )}
      </div>
    );
  }

  // Phase 2: Interactive UI
  const progress = ((currentSegmentIndex) / transcriptSegments.length) * 100;

  return (
    <div className="flex flex-col min-h-[60vh] max-w-2xl mx-auto w-full space-y-6 animate-in fade-in">
       {/* Header / Progress */}
       <div className="w-full space-y-2">
           <div className="flex justify-between text-sm text-slate-500">
               <span>Segment {currentSegmentIndex + 1} of {transcriptSegments.length}</span>
               <span>{Math.round(progress)}%</span>
           </div>
           <Progress value={progress} className="h-2" />
       </div>

       {/* Audio Control for Segment */}
       <div className="flex justify-center py-4">
            <audio ref={audioRef} src={audioUrl} className="hidden" />
            <Button
                variant="outline"
                size="sm"
                className={cn("rounded-full px-6", isPlaying && "border-indigo-500 text-indigo-600")}
                onClick={togglePlay}
            >
                {isPlaying ? <Pause size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
                {isPlaying ? "Playing Segment..." : "Replay Segment"}
            </Button>
       </div>

       {/* Transcript Display */}
       <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[160px] flex items-center justify-center text-center">
           {gapState ? (
               <p className="text-xl md:text-2xl leading-relaxed font-medium text-slate-700 dark:text-slate-200">
                   {gapState.displayParts[0]}
                   {gapState.hasGap ? (
                       <span className={cn(
                           "inline-block min-w-[80px] border-b-2 mx-1 px-2 py-0.5 rounded transition-colors",
                           !gapState.selectedOption ? "border-slate-300 bg-slate-50 text-transparent" : "",
                           gapState.selectedOption && gapState.isCorrect ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "",
                           gapState.selectedOption && !gapState.isCorrect ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" : ""
                       )}>
                           {gapState.selectedOption || "____"}
                       </span>
                   ) : (
                       <span>{gapState.displayParts[0] /* No gap, just text */}</span>
                   )}
                   {gapState.displayParts[1]}
               </p>
           ) : (
               <div className="text-slate-400">Loading segment...</div>
           )}
       </div>

       {/* Options / Action Area */}
       <div className="flex-1 flex flex-col justify-end space-y-4">
           {gapState?.hasGap ? (
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                   {gapState.options.map((option, idx) => (
                       <Button
                           key={idx}
                           variant="outline"
                           className={cn(
                               "h-14 text-lg hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50",
                               gapState.selectedOption === option && gapState.isCorrect && "bg-green-100 border-green-500 text-green-700 hover:bg-green-100 hover:text-green-700",
                               gapState.selectedOption === option && !gapState.isCorrect && "bg-red-100 border-red-500 text-red-700 hover:bg-red-100 hover:text-red-700",
                               gapState.selectedOption && gapState.selectedOption !== option && "opacity-50 cursor-not-allowed"
                           )}
                           onClick={() => handleOptionSelect(option)}
                           disabled={!!gapState.selectedOption}
                       >
                           {option}
                       </Button>
                   ))}
               </div>
           ) : (
               <div className="text-center text-slate-500 py-4 italic">
                   No key terms in this segment. Listen and continue.
               </div>
           )}

           {/* Continue Button */}
           {(!gapState?.hasGap || gapState?.selectedOption) && (
               <Button 
                    className="w-full h-12 text-lg animate-in slide-in-from-bottom-2" 
                    onClick={nextSegment}
                    variant={gapState?.hasGap && !gapState.isCorrect ? "secondary" : "outline"}
               >
                   {currentSegmentIndex < transcriptSegments.length - 1 ? (
                       <>Next Segment <ArrowRight className="ml-2" /></>
                   ) : (
                       <>Finish Practice <CheckCircle className="ml-2" /></>
                   )}
               </Button>
           )}
       </div>
    </div>
  );
}
