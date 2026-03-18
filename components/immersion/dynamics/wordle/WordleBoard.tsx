"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { CellState, FinishedState } from "./types";

type WordleBoardProps = {
  maxAttempts: number;
  length: number;
  guesses: string[];
  current: string;
  finished: FinishedState;
  evaluations: CellState[][];
  shaking: boolean;
};

const stateLabel: Record<CellState, string> = {
  empty: "vazia",
  absent: "ausente",
  present: "presente",
  correct: "correta",
};

export function WordleBoard({
  maxAttempts,
  length,
  guesses,
  current,
  finished,
  evaluations,
  shaking,
}: WordleBoardProps) {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!shaking) return;
    queueMicrotask(() => setIsShaking(true));
  }, [shaking]);

  return (
    <div
      className="flex-1 flex flex-col justify-center items-center w-full px-4 mb-6"
      role="application"
      aria-label="Tabuleiro do Wordle"
    >
      <div className="grid grid-rows-6 gap-1.5 sm:gap-2 w-full max-w-[320px] sm:max-w-[400px]">
        {Array.from({ length: maxAttempts }).map((_, rowIdx) => {
          const isCurrentRow = guesses.length === rowIdx && !finished;
          const isSubmittedRow = rowIdx < guesses.length;
          const guess = guesses[rowIdx] || "";
          const evalRow = evaluations[rowIdx] || [];
          const shouldShake = isCurrentRow && isShaking;

          return (
            <motion.div
              key={rowIdx}
              className="grid gap-1.5 sm:gap-2 w-full"
              style={{
                gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))`,
              }}
              initial={false}
              animate={shouldShake ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
              transition={shouldShake ? { duration: 0.4 } : { duration: 0 }}
              onAnimationComplete={() => {
                if (shouldShake) setIsShaking(false);
              }}
            >
              {Array.from({ length }).map((_, colIdx) => {
                const ch =
                  isCurrentRow && colIdx < current.length
                    ? current[colIdx]
                    : guess[colIdx] || "";

                const state = isSubmittedRow
                  ? (evalRow[colIdx] as CellState)
                  : "empty";

                const a11yStateLabel = isSubmittedRow
                  ? stateLabel[state]
                  : ch
                    ? "digitada"
                    : "vazia";
                const ariaLabel = `Tentativa ${rowIdx + 1}, letra ${colIdx + 1}: ${ch ? ch.toUpperCase() : "vazia"}, ${a11yStateLabel}`;

                let bgClasses =
                  "bg-transparent border-2 border-neutral-300 dark:border-neutral-700 text-foreground";

                if (state === "correct")
                  bgClasses = "bg-emerald-500 text-white border-emerald-500";
                else if (state === "present")
                  bgClasses = "bg-amber-500 text-white border-amber-500";
                else if (state === "absent")
                  bgClasses =
                    "bg-neutral-500 dark:bg-neutral-600 text-white border-neutral-500 dark:border-neutral-600";
                else if (ch && !isSubmittedRow)
                  bgClasses =
                    "border-neutral-500 dark:border-neutral-400 text-foreground";

                return (
                  <motion.div
                    key={colIdx}
                    initial={false}
                    animate={
                      isSubmittedRow
                        ? { rotateX: [0, 90, 0] }
                        : ch
                          ? { scale: [1, 1.1, 1] }
                          : { scale: 1 }
                    }
                    transition={{
                      duration: 0.4,
                      delay: isSubmittedRow ? colIdx * 0.15 : 0,
                    }}
                    className={`aspect-square w-full rounded-md flex items-center justify-center text-2xl sm:text-3xl font-bold uppercase transition-colors duration-300 ${bgClasses}`}
                    role="img"
                    aria-label={ariaLabel}
                  >
                    {ch}
                  </motion.div>
                );
              })}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
