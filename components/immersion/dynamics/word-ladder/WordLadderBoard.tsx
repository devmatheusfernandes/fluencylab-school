"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { CellState } from "../wordle/types";
import { LetterTile } from "../LetterTile";

type WordLadderBoardProps = {
  length: number;
  steps: string[];
  current: string;
  evaluations: CellState[][];
  shaking: boolean;
  maxRows?: number;
  finished: boolean;
};

const stateLabel: Record<CellState, string> = {
  empty: "vazia",
  absent: "ausente",
  present: "presente",
  correct: "correta",
};

export function WordLadderBoard({
  length,
  steps,
  current,
  evaluations,
  shaking,
  maxRows = 5,
  finished,
}: WordLadderBoardProps) {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!shaking) return;
    queueMicrotask(() => setIsShaking(true));
  }, [shaking]);

  const rows = Array.from({ length: maxRows });

  return (
    <div
      className="flex-1 flex flex-col justify-center items-center w-full px-4 mb-6"
      role="application"
      aria-label="Tabuleiro do Word Ladder"
    >
      <div className="grid gap-1.5 sm:gap-2 w-full max-w-[320px] sm:max-w-[400px]">
        {rows.map((_, rowIdx) => {
          const isSubmittedRow = rowIdx < steps.length;
          const isCurrentRow = rowIdx === steps.length && !finished;
          const word = isSubmittedRow ? steps[rowIdx] || "" : isCurrentRow ? current : "";
          const evalRow = isSubmittedRow ? evaluations[rowIdx] || [] : [];
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
                const ch = word[colIdx] || "";
                const state = isSubmittedRow
                  ? ((evalRow[colIdx] || "empty") as CellState)
                  : "empty";

                const a11yStateLabel = isSubmittedRow
                  ? stateLabel[state]
                  : ch
                    ? "digitada"
                    : "vazia";
                const ariaLabel = `Passo ${rowIdx + 1}, letra ${colIdx + 1}: ${ch ? ch.toUpperCase() : "vazia"}, ${a11yStateLabel}`;

                return (
                  <LetterTile
                    key={colIdx}
                    aria-label={ariaLabel}
                    letter={ch}
                    state={state}
                    filled={!!ch && !isSubmittedRow}
                    animation={isSubmittedRow ? "flip" : ch ? "pop" : "none"}
                    delay={isSubmittedRow ? colIdx * 0.15 : 0}
                  />
                );
              })}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
