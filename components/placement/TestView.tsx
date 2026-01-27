"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AudioPlayer } from "./AudioPlayer";
import { Question, AdaptiveState } from "../../types/placement/types";
import { MAX_QUESTIONS } from "../../utils/placement-utils";
import { pageVariants, containerVariants, itemVariants } from "../../config/animations";
import { useTranslations } from "next-intl";

interface TestViewProps {
  currentQuestion: Question;
  adaptiveState: AdaptiveState;
  progress: number;
  onOptionSelect: (value: string) => void;
  onAnswer: () => void;
  onSkip: () => void;
  onExit: () => void;
}

export const TestView = ({
  currentQuestion,
  adaptiveState,
  progress,
  onOptionSelect,
  onAnswer,
  onSkip,
  onExit,
}: TestViewProps) => {
    const t = useTranslations("Placement");
  
  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Top Bar */}
      <div className="w-full flex items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary hover:bg-slate-100/50 hover:text-primary"
          onClick={onExit}
        >
          <X className="h-6 w-6" />
        </Button>
        <div className="flex-1 h-4 bg-gray-200 dark:bg-black/70 rounded-full overflow-hidden relative">
          <motion.div
            className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
          />
          <div className="absolute top-1 left-2 h-1.5 w-full bg-white/20 dark:bg-black/10 rounded-full" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full pb-20"
        >
          <Card className="bg-slate-200/90! dark:bg-gray-900! rounded-2xl! border-3! border-b-6! border-slate-300! dark:border-black/50!">
            <CardHeader className="px-6 pt-6">
              {currentQuestion.audioUrl && (
                <AudioPlayer url={currentQuestion.audioUrl} />
              )}

              <h2 className="text-xl md:text-2xl font-bold text-foreground text-center leading-tight mb-4">
                {currentQuestion.text}
              </h2>
            </CardHeader>

            <CardContent className="px-6">
              <RadioGroup
                value={adaptiveState.answers[currentQuestion.id] || ""}
                onValueChange={onOptionSelect}
                className="grid gap-3"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid gap-3"
                >
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected =
                      adaptiveState.answers[currentQuestion.id] === option;
                    return (
                      <motion.div key={idx} variants={itemVariants}>
                        <div className="relative">
                          <RadioGroupItem
                            value={option}
                            id={`opt-${idx}`}
                            className="sr-only"
                          />
                          <Label
                            htmlFor={`opt-${idx}`}
                            onClick={() => onOptionSelect(option)}
                            className={`
                                flex items-center p-2.5 md:p-3.5 rounded-2xl border-2 border-b-4 cursor-pointer transition-all active:scale-[0.98] w-full
                                ${
                                  isSelected
                                    ? "border-indigo-400 bg-indigo-50/50 dark:bg-black/40 text-indigo-600"
                                    : "border-slate-200 dark:border-black/40 bg-accent hover:bg-slate-50 hover:border-slate-300 hover:dark:border-black/50 hover:dark:bg-black/40 text-foreground"
                                }
                            `}
                          >
                            <div
                              className={`
                                flex items-center justify-center w-8 h-8 rounded-lg border-2 mr-4 font-bold text-sm
                                ${
                                  isSelected
                                    ? "border-indigo-400 text-indigo-400"
                                    : "border-slate-200 dark:border-black/40 text-slate-300"
                                }
                            `}
                            >
                              {String.fromCharCode(65 + idx)}
                            </div>
                            <span className="font-semibold text-lg md:text-xl flex-1">
                              {option}
                            </span>
                          </Label>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>
        <CardFooter className="fixed bottom-0 md:bottom-12 left-0 w-full bg-white md:dark:bg-transparent dark:bg-black p-4 border-t border-slate-100 dark:border-black/50 z-50 md:relative md:bg-transparent md:border-none md:p-0 md:mt-8 flex flex-col md:flex-row gap-3">
          {/* Skip Button */}
          <Button
            variant="ghost"
            className="w-full md:w-auto font-bold text-foreground hover:text-primary uppercase tracking-widest hover:bg-transparent"
            onClick={onSkip}
          >
            {t("skip")}
          </Button>

          {/* Next Button */}
          <Button
            onClick={onAnswer}
            disabled={!adaptiveState.answers[currentQuestion.id]}
            className={`
                            w-full md:flex-1 h-12 text-lg font-bold uppercase tracking-wider rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all
                            ${
                              adaptiveState.questionCount === MAX_QUESTIONS - 1
                                ? "bg-green-500 hover:bg-green-600 border-green-700"
                                : "bg-green-500 hover:bg-green-600 border-green-700"
                            }
                        `}
          >
            {adaptiveState.questionCount === MAX_QUESTIONS - 1
              ? t("finishTest")
              : t("check")}
          </Button>
        </CardFooter>
      </AnimatePresence>
    </div>
  );
};
