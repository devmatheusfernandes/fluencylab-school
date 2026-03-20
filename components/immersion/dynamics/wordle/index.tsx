"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, History } from "lucide-react";
import { SpinnerLoading } from "@/components/transitions/spinner-loading";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Keyboard } from "../Keyboard";
import { WordleBoard } from "./WordleBoard";
import { WordleDetailsModal } from "./WordleDetailsModal";
import { WordleHistoryModal } from "./WordleHistoryModal";
import { LanguageSelect } from "../LanguageSelect";
import { useWordleGame } from "@/hooks/immersion/useWordleGame";
import { Header } from "@/components/ui/header";
import BreadcrumbActions from "@/components/shared/Breadcrum/BreadcrumbActions";
import BreadcrumbActionIcon from "@/components/shared/Breadcrum/BreadcrumbActionIcon";
import Link from "next/link";

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
    historyOpen,
    setHistoryOpen,
    historyEntries,
    openHistory,
  } = useWordleGame();

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
    <div className="container-padding">
      <Header
        heading="Jogue o Wordle"
        subheading="Tente adivinhar a palavra em 6 tentativas."
        backHref="/hub/student/my-immersion"
        icon={
          <div className="flex flex-row items-center gap-2">
            <BreadcrumbActions placement="start">
              <Link href="/hub/student/my-immersion">
                <BreadcrumbActionIcon icon={ArrowLeft} />
              </Link>
            </BreadcrumbActions>
            <BreadcrumbActions placement="end">
              <LanguageSelect
                value={selectedLang}
                options={langOptions}
                onChange={(next) => {
                  setSelectedLang(next);
                  startNewGame(next);
                }}
                disabled={langOptions.length <= 1}
              />
              <BreadcrumbActionIcon icon={History} onClick={openHistory} />
            </BreadcrumbActions>

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
              <History className="h-5 w-5" />
            </Button>
          </div>
        }
      />

      {/* Container Principal com Carousel */}
      <div className="w-full flex flex-col items-center justify-center">
        <Carousel
          className="w-full"
          opts={{
            watchDrag: !!finished, // Evita arrastar sem querer enquanto joga
            loop: false,
          }}
        >
          <CarouselContent>
            {/* Slide 1: Board + Teclado (ou Indicação de Arrastar) */}
            <CarouselItem className="w-full flex flex-col items-center min-h-[calc(100dvh-220px)] md:min-h-0">
              <WordleBoard
                maxAttempts={maxAttempts}
                length={length}
                guesses={guesses}
                current={current}
                finished={finished}
                evaluations={evaluations}
                shaking={shaking}
              />

              <div className="w-full flex flex-col flex-1">
                <AnimatePresence mode="wait">
                  {!finished ? (
                    <motion.div
                      key="keyboard"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.2 }}
                      className="w-full px-2 pt-8 mt-auto pb-2"
                    >
                      <Keyboard
                        onLetter={onLetter}
                        onEnter={enter}
                        onBackspace={onBackspace}
                        letterStates={letterStates}
                        disabled={!!finished}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="swipe-hint"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                      className="mt-auto mb-2 self-center flex items-center gap-3 text-muted-foreground bg-muted/40 px-4 py-2 rounded-full border border-border/50 animate-pulse"
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

            {/* Slide 2: Resultados (Aparece apenas quando o jogo acaba) */}
            {finished && (
              <CarouselItem className="w-full flex flex-col items-center justify-center gap-6 pb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col items-center gap-6"
                >
                  <WordleDetailsModal
                    word={target.word}
                    lang={(target.lang || selectedLang || "en").toLowerCase()}
                    onPlayAgain={() => {
                      startNewGame(selectedLang);
                    }}
                  />
                </motion.div>
              </CarouselItem>
            )}
          </CarouselContent>
        </Carousel>
      </div>

      <WordleHistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        entries={historyEntries}
      />
    </div>
  );
}
