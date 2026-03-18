"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, EllipsisVertical } from "lucide-react";
import { SpinnerLoading } from "@/components/transitions/spinner-loading";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Keyboard } from "../Keyboard";
import { LanguageSelect } from "../LanguageSelect";
import { useWordLadderGame } from "@/hooks/immersion/useWordLadderGame";
import { WordLadderBoard } from "./WordLadderBoard";
import { WordLadderResultBanner } from "./WordLadderResultBanner";
import { WordLadderWordsCarousel } from "./WordLadderWordsCarousel";
import { Header } from "@/components/ui/header";

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
    <div className="container-padding">
      <Header
        heading="Troque apenas 1 letra por passo"
        subheading={<>Objetivo: {goalWord.toUpperCase()}</>}
        backHref="/hub/student/my-immersion"
        icon={
          <div className="flex flex-row items-center gap-2">
            <div className="hidden sm:flex flex-row items-center gap-2">
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
            </div>

            <div className="flex sm:hidden flex-row items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-muted-foreground hover:text-foreground"
                    aria-label="Abrir opções"
                  >
                    <EllipsisVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Idioma</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={selectedLang}
                    onValueChange={(next) => {
                      setSelectedLang(next);
                      startNewGame(next);
                    }}
                  >
                    {langOptions.map((lang) => (
                      <DropdownMenuRadioItem
                        key={lang}
                        value={lang}
                        disabled={langOptions.length <= 1}
                      >
                        {lang.toUpperCase()}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuCheckboxItem
                    checked={learningMode}
                    onCheckedChange={(checked) => setLearningMode(!!checked)}
                  >
                    Aprendizagem
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuItem
                    onClick={hint}
                    disabled={!hasSolution || finished}
                  >
                    Dica
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={revealSolution}
                    disabled={!hasSolution || finished}
                  >
                    Solução
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        }
      />

      {/* Container Principal com Carousel */}
      <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center">
        <Carousel
          className="w-full"
          opts={{
            watchDrag: finished, // Só permite arrastar quando finalizar o jogo
            loop: false,
          }}
        >
          <CarouselContent>
            {/* Slide 1: WordLadderBoard + Teclado */}
            <CarouselItem className="w-full flex flex-col items-center">
              <WordLadderBoard
                length={length}
                steps={steps}
                current={current}
                evaluations={evaluations}
                shaking={shaking}
                finished={finished}
                maxRows={5}
              />

              <div className="w-full min-h-[200px] flex flex-col items-center justify-center mt-6">
                <AnimatePresence mode="wait">
                  {!finished ? (
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
                  ) : (
                    <motion.div
                      key="swipe-hint"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                      className="flex items-center gap-3 text-muted-foreground bg-muted/40 px-5 py-2.5 rounded-full border border-border/50 animate-pulse mt-4"
                    >
                      <span className="text-sm font-medium">
                        Deslize para ver o resultado
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CarouselItem>

            {/* Slide 2: Resultados e Learning Mode (Apenas quando finalizado) */}
            {finished && (
              <CarouselItem className="w-full flex flex-col items-center gap-4 pb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
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
                  {learningMode ? (
                    <WordLadderWordsCarousel words={steps} />
                  ) : null}
                </motion.div>
              </CarouselItem>
            )}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
