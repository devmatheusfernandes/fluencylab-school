"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, EllipsisVertical } from "lucide-react";
import { SpinnerLoading } from "@/components/transitions/spinner-loading";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Keyboard } from "../Keyboard";
import { LanguageSelect } from "../LanguageSelect";
import { useWordLadderGame } from "@/hooks/immersion/useWordLadderGame";
import { WordLadderBoard } from "./WordLadderBoard";
import { WordLadderResultBanner } from "./WordLadderResultBanner";
import { WordLadderWordsCarousel } from "./WordLadderWordsCarousel";
import { Header } from "@/components/ui/header";
import BreadcrumbActions from "@/components/shared/Breadcrum/BreadcrumbActions";
import BreadcrumbActionIcon from "@/components/shared/Breadcrum/BreadcrumbActionIcon";
import Link from "next/link";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

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
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

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
            <BreadcrumbActions placement="end">
              <LanguageSelect
                value={selectedLang}
                options={langOptions}
                onChange={(next) => {
                  setSelectedLang(next);
                  startNewGame(next);
                  setIsOptionsOpen(false);
                }}
                disabled={langOptions.length <= 1}
              />
              <BreadcrumbActionIcon
                icon={EllipsisVertical}
                onClick={() => setIsOptionsOpen(true)}
              />
            </BreadcrumbActions>

            <BreadcrumbActions placement="start">
              <Link
                href="/hub/student/my-immersion"
                className="flex items-center"
              >
                <BreadcrumbActionIcon icon={ArrowLeft} />
              </Link>
            </BreadcrumbActions>

            <div className="hidden md:flex flex-row items-center gap-2">
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
            <CarouselItem className="w-full flex flex-col items-center min-h-[calc(100dvh-220px)] md:min-h-0">
              <div className="w-full flex flex-col items-center justify-center mb-4">
                <p className="text-lg font-medium">{`A palavra inicial é: ${startWord.toUpperCase()}`}</p>
                <p className="text-lg font-medium">{`O objetivo é: ${goalWord.toUpperCase()}`}</p>
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
              <div className="w-full flex flex-col flex-1 mt-6">
                <AnimatePresence mode="wait">
                  {!finished ? (
                    <motion.div
                      key="keyboard"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.2 }}
                      className="w-full px-2 mt-auto pb-2"
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
                      className="mt-auto mb-2 self-center flex items-center gap-3 text-muted-foreground bg-muted/40 px-5 py-2.5 rounded-full border border-border/50 animate-pulse"
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

      <Drawer open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
        <DrawerContent className="h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Opções</DrawerTitle>
            <DrawerDescription className="sr-only">
              Opções do jogo
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-3 overflow-y-auto p-4">
            <Button
              variant={learningMode ? "primary" : "outline"}
              className="w-full justify-start"
              onClick={() => setLearningMode((p) => !p)}
            >
              Aprendizagem
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                hint();
                setIsOptionsOpen(false);
              }}
              disabled={!hasSolution || finished}
            >
              Dica
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                revealSolution();
                setIsOptionsOpen(false);
              }}
              disabled={!hasSolution || finished}
            >
              Solução
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
