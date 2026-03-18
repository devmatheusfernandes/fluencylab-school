"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SpinnerLoading } from "@/components/transitions/spinner-loading";
import { Button } from "@/components/ui/button";
import { Keyboard } from "../Keyboard";
import { LanguageSelect } from "../LanguageSelect";
import { useWordLadderGame } from "@/hooks/immersion/useWordLadderGame";
import { WordLadderBoard } from "./WordLadderBoard";
import { WordLadderResultBanner } from "./WordLadderResultBanner";
import { WordLadderWordsCarousel } from "./WordLadderWordsCarousel";
import { ImmersionGameHeader } from "../ImmersionGameHeader";

export default function WordLadderGame() {
  const {
    loading,
    status,
    selectedLang,
    setSelectedLang,
    langOptions,
    length,
    startWord,
    goalWord,
    steps,
    current,
    evaluations,
    letterStates,
    enter,
    onLetter,
    onBackspace,
    startNewGame,
    hint,
    revealSolution,
    hasSolution,
    learningMode,
    setLearningMode,
    shaking,
  } = useWordLadderGame();

  if (loading || status === "loading") return <SpinnerLoading />;

  if (status === "empty") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-center text-muted-foreground">
          Sem palavras disponíveis no momento.
        </div>
      </div>
    );
  }

  const finished = status === "win" || status === "end";

  return (
    <div className="relative min-h-[85dvh] w-full flex flex-col items-center py-4 px-4 gap-8">
      <ImmersionGameHeader>
        <LanguageSelect
          value={selectedLang}
          options={langOptions}
          onChange={(next) => {
            setSelectedLang(next);
            startNewGame(next);
          }}
          disabled={langOptions.length <= 1}
        />

        <Button
          variant="ghost"
          className="rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => setLearningMode((p) => !p)}
        >
          {learningMode ? "Aprendizagem: on" : "Aprendizagem: off"}
        </Button>

        <Button
          variant="ghost"
          className="rounded-full text-muted-foreground hover:text-foreground"
          onClick={hint}
          disabled={!hasSolution || finished}
        >
          Dica
        </Button>

        <Button
          variant="ghost"
          className="rounded-full text-muted-foreground hover:text-foreground"
          onClick={revealSolution}
          disabled={!hasSolution || finished}
        >
          Solução
        </Button>
      </ImmersionGameHeader>

      <div className="w-full max-w-lg flex flex-col items-center gap-2 px-2 text-center">
        <div className="text-sm text-muted-foreground">
          Troque apenas 1 letra por passo. Objetivo:{" "}
          <span className="font-semibold text-foreground">
            {goalWord.toUpperCase()}
          </span>
        </div>
        <div className="text-xs text-muted-foreground/80">
          Início: {startWord.toUpperCase()} • Tamanho: {length} letras
        </div>
      </div>

      <WordLadderBoard
        length={length}
        steps={steps}
        current={current}
        evaluations={evaluations}
        shaking={shaking}
        finished={finished}
        maxRows={5}
      />

      <div className="w-full max-w-lg flex flex-col items-center justify-center min-h-[200px]">
        <AnimatePresence mode="wait">
          {finished ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center gap-4"
            >
              <WordLadderResultBanner
                status={status === "win" ? "win" : "end"}
                stepsCount={Math.max(0, steps.length - 1)}
                startWord={startWord}
                goalWord={goalWord}
                onPlayAgain={() => startNewGame(selectedLang)}
                onRevealSolution={revealSolution}
                canRevealSolution={status !== "win" && hasSolution}
              />
              {learningMode ? <WordLadderWordsCarousel words={steps} /> : null}
            </motion.div>
          ) : (
            <motion.div
              key="keyboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full px-2"
            >
              <Keyboard
                onLetter={onLetter}
                onEnter={enter}
                onBackspace={onBackspace}
                letterStates={letterStates}
                disabled={false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
