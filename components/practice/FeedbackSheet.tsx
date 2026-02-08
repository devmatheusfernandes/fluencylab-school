"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  RotateCw,
  ThumbsUp,
  Medal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FeedbackSheetProps {
  isOpen: boolean;
  isCorrect: boolean;
  correctAnswer?: string;
  explanation?: string;
  grade?: number;
  onContinue: () => void;
}

function getFeedbackConfig(grade?: number, isCorrect?: boolean) {
  // If grade is present, we are in a graded exercise (like Flashcard)
  if (grade !== undefined) {
    switch (grade) {
      case 0:
      case 1:
      case 2:
        return {
          title: "Keep practicing!",
          message: "Reviewing is the key to mastery.",
          color: "rose",
          icon: <RotateCw size={32} />,
          buttonText: "Continue",
        };
      case 3:
        return {
          title: "Good effort!",
          message: "Practice makes perfect.",
          color: "amber",
          icon: <ThumbsUp size={32} />,
          buttonText: "Continue",
        };
      case 4:
        return {
          title: "Great job!",
          message: "You're doing well.",
          color: "indigo",
          icon: <Medal size={32} />,
          buttonText: "Continue",
        };
      case 5:
        return {
          title: "Excellent!",
          message: "Too easy for you?",
          color: "emerald",
          icon: <Sparkles size={32} />,
          buttonText: "Continue",
        };
      default:
        // Fallback for unknown grade
        return {
          title: "Completed",
          message: "Moving to next card.",
          color: "slate",
          icon: <CheckCircle2 size={32} />,
          buttonText: "Continue",
        };
    }
  }

  // Fallback for binary exercises (Correct/Incorrect)
  if (isCorrect) {
    return {
      title: "Excellent!",
      message: null,
      color: "green",
      icon: <CheckCircle2 size={32} />,
      buttonText: "Continue",
    };
  }

  return {
    title: "Incorrect",
    message: null,
    color: "rose",
    icon: <XCircle size={32} />,
    buttonText: "Continue",
  };
}

export function FeedbackSheet({
  isOpen,
  isCorrect,
  correctAnswer,
  explanation,
  grade,
  onContinue,
}: FeedbackSheetProps) {
  const config = getFeedbackConfig(grade, isCorrect);

  // Dynamic classes based on color config
  const bgClass =
    {
      rose: "bg-rose-100 border-rose-200 dark:bg-rose-950 dark:border-rose-900",
      amber:
        "bg-amber-100 border-amber-200 dark:bg-amber-950 dark:border-amber-900",
      indigo:
        "bg-indigo-100 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-900",
      emerald:
        "bg-emerald-100 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900",
      green:
        "bg-green-100 border-green-200 dark:bg-green-950 dark:border-green-900",
      slate:
        "bg-slate-100 border-slate-200 dark:bg-slate-950 dark:border-slate-900",
    }[config.color] || "bg-slate-100 border-slate-200";

  const iconBgClass =
    {
      rose: "text-rose-600",
      amber: "text-amber-600",
      indigo: "text-indigo-600",
      emerald: "text-emerald-600",
      green: "text-green-600",
      slate: "text-slate-600",
    }[config.color] || "text-slate-600";

  const titleClass =
    {
      rose: "text-rose-800 dark:text-rose-400",
      amber: "text-amber-800 dark:text-amber-400",
      indigo: "text-indigo-800 dark:text-indigo-400",
      emerald: "text-emerald-800 dark:text-emerald-400",
      green: "text-green-800 dark:text-green-400",
      slate: "text-slate-800 dark:text-slate-400",
    }[config.color] || "text-slate-800";

  const buttonClass =
    {
      rose: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-700",
      amber: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-700",
      indigo: "bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-700",
      emerald:
        "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-700",
      green: "bg-green-500 hover:bg-green-600 text-white shadow-green-700",
      slate: "bg-slate-500 hover:bg-slate-600 text-white shadow-slate-700",
    }[config.color] || "bg-slate-500";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={cn(
            "fixed bottom-0 left-0 right-0 p-6 z-50 border-t-2",
            bgClass,
          )}
        >
          <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full">
              <div className={cn("p-2 rounded-full bg-white", iconBgClass)}>
                {config.icon}
              </div>

              <div className="flex flex-col">
                <h3 className={cn("text-xl font-bold", titleClass)}>
                  {config.title}
                </h3>

                {config.message && (
                  <p className={cn("text-sm mt-1 opacity-90", titleClass)}>
                    {config.message}
                  </p>
                )}

                {/* Show Correct Answer only if explicit failure (not just low grade) AND correctAnswer provided */}
                {/* For Flashcards (grade defined), we usually don't show correct answer here unless we want to. User said NO incorrect/correct label. */}
                {/* Logic: If grade is undefined (Binary Mode) AND isCorrect is false, show answer. */}
                {grade === undefined && !isCorrect && correctAnswer && (
                  <p className="text-rose-700 dark:text-rose-300 mt-1">
                    Correct answer:{" "}
                    <span className="font-semibold">{correctAnswer}</span>
                  </p>
                )}

                {explanation && (
                  <p className="text-sm mt-2 text-slate-600 dark:text-slate-300 border-l-2 border-current pl-2">
                    {explanation}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={onContinue}
              className={cn(
                "w-full md:w-auto px-8 py-6 text-lg font-bold uppercase tracking-wider shadow-[0_4px_0_0_rgb(0,0,0,0.2)] active:shadow-none active:translate-y-1 transition-all",
                buttonClass,
              )}
            >
              {config.buttonText}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
