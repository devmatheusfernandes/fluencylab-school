"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SpinnerLoading } from "@/components/transitions/spinner-loading";
import { Button } from "@/components/ui/button";
import { Keyboard } from "../Keyboard";
import { WordleBoard } from "./WordleBoard";
import { WordleResultBanner } from "./WordleResultBanner";
import { WordleDetailsModal } from "./WordleDetailsModal";
import { WordleHistoryModal } from "./WordleHistoryModal";
import { LanguageSelect } from "../LanguageSelect";
import { useWordleGame } from "@/hooks/immersion/useWordleGame";

export default function WordleGame() {
  const {
    loading,
    target,
    guesses,
    current,
    finished,
    selectedLang,
    setSelectedLang,
    langOptions,
    maxAttempts,
    length,
    evaluations,
    letterStates,
    enter,
    startNewGame,
    onLetter,
    onBackspace,
    shaking,
    liveMessage,
    historyOpen,
    setHistoryOpen,
    historyEntries,
    openHistory,
  } = useWordleGame();

  // === Renders ===
  if (loading) return <SpinnerLoading />;

  if (!target) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-center text-muted-foreground">
          Sem palavras disponíveis no momento.
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[85dvh] w-full flex flex-col items-center py-4 px-4 gap-8">
      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>

      {/* Top Actions */}
      <div className="w-full max-w-lg flex justify-end px-2 gap-2">
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
          onClick={openHistory}
        >
          Histórico
        </Button>
      </div>

      {/* Board sempre visível */}
      <WordleBoard
        maxAttempts={maxAttempts}
        length={length}
        guesses={guesses}
        current={current}
        finished={finished}
        evaluations={evaluations}
        shaking={shaking}
      />

      {/* Troca suave entre Teclado e Tela de Resultados */}
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
              <WordleResultBanner finished={finished} />
              <WordleDetailsModal
                word={target.word}
                lang={(target.lang || selectedLang || "en").toLowerCase()}
                onPlayAgain={() => {
                  startNewGame(selectedLang);
                }}
              />
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
                disabled={!!finished}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <WordleHistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        entries={historyEntries}
      />
    </div>
  );
}
