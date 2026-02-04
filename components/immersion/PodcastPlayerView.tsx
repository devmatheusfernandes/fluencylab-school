"use client";

import { usePodcastPlayer } from "@/hooks/ui/usePodcastPlayer";
import { Podcast } from "@/types/learning/immersion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton"; // Certifique-se de ter este componente
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  FileText,
  Disc,
} from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface PodcastPlayerViewProps {
  podcast: Podcast;
  initialProgress?: number;
}

export function PodcastPlayerView({
  podcast,
  initialProgress = 0,
}: PodcastPlayerViewProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isReady,
    togglePlay,
    seek,
    changeVolume,
    skip,
  } = usePodcastPlayer({
    podcastId: podcast.id,
    audioUrl: podcast.audioUrl,
    initialProgress,
  });

  const [showTranscription, setShowTranscription] = useState(false);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <motion.div
        layout
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all ease-[cubic-bezier(0.25,0.1,0.25,1)]"
      >
        {/* Player Area */}
        <motion.div
          layout
          className={cn(
            "flex flex-col h-full",
            showTranscription ? "lg:col-span-2" : "lg:col-span-3",
          )}
        >
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden h-full flex flex-col justify-between p-8 sm:p-10 relative">
            {/* Background Decorativo Minimalista */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start h-full">
              {/* Cover Art Placeholder */}
              <motion.div
                layout
                className="w-32 h-32 md:w-48 md:h-48 rounded-2xl bg-muted flex items-center justify-center shrink-0 shadow-sm"
              >
                <Disc
                  className={cn(
                    "text-muted-foreground/50 w-16 h-16",
                    isPlaying && "animate-spin-slow",
                  )}
                />
              </motion.div>

              {/* Info & Controls */}
              <div className="flex-1 w-full space-y-8 flex flex-col justify-center">
                <div className="text-center md:text-left space-y-2">
                  <motion.h2
                    layout
                    className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
                  >
                    {podcast.title}
                  </motion.h2>
                  <motion.p
                    layout
                    className="text-muted-foreground text-sm line-clamp-2"
                  >
                    {podcast.description}
                  </motion.p>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  {!isReady ? (
                    <Skeleton className="h-2 w-full rounded-full" />
                  ) : (
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={1}
                      onValueChange={(vals) => seek(vals[0])}
                      className="w-full cursor-pointer"
                    />
                  )}
                  <div className="flex justify-between text-xs font-medium text-muted-foreground/70">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-center md:justify-between gap-4">
                  {/* Playback Buttons */}
                  <div className="flex items-center gap-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => skip(-10)}
                      disabled={!isReady}
                      className="hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <SkipBack className="h-6 w-6" />
                    </Button>

                    {!isReady ? (
                      <Skeleton className="h-14 w-14 rounded-full" />
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={togglePlay}
                        className="h-16 w-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md hover:shadow-xl transition-shadow"
                      >
                        <AnimatePresence mode="wait">
                          {isPlaying ? (
                            <motion.div
                              key="pause"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                            >
                              <Pause className="h-8 w-8 fill-current" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="play"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                            >
                              <Play className="h-8 w-8 ml-1 fill-current" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => skip(10)}
                      disabled={!isReady}
                      className="hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <SkipForward className="h-6 w-6" />
                    </Button>
                  </div>

                  {/* Secondary Controls (Volume & Transcript) */}
                  <div className="hidden sm:flex items-center gap-4">
                    <div className="flex items-center gap-2 group bg-secondary/30 rounded-full px-3 py-1.5 hover:bg-secondary/50 transition-colors">
                      <button
                        onClick={() => changeVolume(volume === 0 ? 1 : 0)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {volume === 0 ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </button>
                      <div className="w-0 overflow-hidden group-hover:w-20 transition-all duration-300 ease-in-out">
                        <Slider
                          value={[volume]}
                          max={1}
                          step={0.1}
                          onValueChange={(vals) => changeVolume(vals[0])}
                          className="w-20"
                        />
                      </div>
                    </div>

                    {podcast.transcription && (
                      <Button
                        variant={showTranscription ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setShowTranscription(!showTranscription)}
                        className="rounded-full gap-2 transition-all"
                      >
                        <FileText className="h-4 w-4" />
                        <span
                          className={cn(
                            "hidden sm:inline",
                            showTranscription ? "inline" : "hidden sm:inline",
                          )}
                        >
                          {showTranscription ? "Hide Text" : "Transcript"}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Toggle for Transcription */}
            {podcast.transcription && (
              <div className="sm:hidden w-full mt-6 pt-4 border-t border-border/50 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTranscription(!showTranscription)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {showTranscription
                    ? "Ocultar Transcrição"
                    : "Ver Transcrição"}
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Transcription Sidebar */}
        <AnimatePresence mode="popLayout">
          {showTranscription && podcast.transcription && (
            <motion.div
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
              className="col-span-1 h-[500px] lg:h-auto"
            >
              <Card className="h-full border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <div className="p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg tracking-tight">
                      Transcription
                    </h3>
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-md">
                      Scrollable
                    </span>
                  </div>

                  <ScrollArea className="flex-1 pr-4 -mr-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <p className="text-sm md:text-base leading-relaxed text-muted-foreground whitespace-pre-wrap font-light">
                        {podcast.transcription}
                      </p>
                    </motion.div>
                  </ScrollArea>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
