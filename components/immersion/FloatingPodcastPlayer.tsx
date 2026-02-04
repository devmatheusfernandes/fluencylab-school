"use client";

import { usePodcastPlayer } from "@/hooks/ui/usePodcastPlayer";
import { Podcast } from "@/types/learning/immersion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  FileText,
  X,
  ExternalLink,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface FloatingPodcastPlayerProps {
  podcast: Podcast;
  onClose: () => void;
  initialProgress?: number;
}

export function FloatingPodcastPlayer({
  podcast,
  onClose,
  initialProgress = 0,
}: FloatingPodcastPlayerProps) {
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
  const [isExpanded, setIsExpanded] = useState(false);

  // Format time helper
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Auto-play when opened
  useEffect(() => {
    if (isReady && !isPlaying) {
      togglePlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none flex justify-center"
      >
        <div className="w-full max-w-4xl bg-card/95 backdrop-blur-md border shadow-2xl rounded-xl overflow-hidden pointer-events-auto flex flex-col">
          {/* Header / Top Bar */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{podcast.title}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {podcast.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/hub/student/my-immersion/podcasts/${podcast.id}`}
                passHref
              >
                <Button variant="ghost" size="icon" title="Open Full Page">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Controls Area */}
          <div className="p-4 space-y-4">
            {/* Progress */}
            <div className="space-y-1">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={(vals) => seek(vals[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 w-1/4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:inline-flex"
                  onClick={() => changeVolume(volume === 0 ? 1 : 0)}
                >
                  {volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.1}
                  onValueChange={(vals) => changeVolume(vals[0])}
                  className="w-24 hidden sm:flex"
                />
              </div>

              <div className="flex items-center justify-center gap-4 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skip(-10)}
                  disabled={!isReady}
                >
                  <SkipBack className="h-5 w-5" />
                </Button>

                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg"
                  onClick={togglePlay}
                  disabled={!isReady}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-1" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skip(10)}
                  disabled={!isReady}
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center justify-end gap-2 w-1/4">
                {podcast.transcription && (
                  <Button
                    variant={showTranscription ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setShowTranscription(!showTranscription)}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Transcription</span>
                    {showTranscription ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronUp className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Collapsible Transcription */}
          <AnimatePresence>
            {showTranscription && podcast.transcription && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 300, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t bg-muted/20"
              >
                <ScrollArea className="h-[300px] p-4">
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {podcast.transcription}
                    </p>
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
