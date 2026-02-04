"use client";

import { usePodcastPlayer } from "@/hooks/ui/usePodcastPlayer";
import { Podcast } from "@/types/learning/immersion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className={cn("col-span-1", showTranscription ? "lg:col-span-2" : "lg:col-span-3")}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">{podcast.title}</h2>
              <p className="text-muted-foreground">{podcast.description}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
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

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => skip(-10)}
                disabled={!isReady}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                className="h-12 w-12 rounded-full"
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
                variant="outline"
                size="icon"
                onClick={() => skip(10)}
                disabled={!isReady}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Volume & Extras */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 w-1/3">
                <Button
                  variant="ghost"
                  size="icon"
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
                />
              </div>

              {podcast.transcription && (
                <Button
                  variant={showTranscription ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setShowTranscription(!showTranscription)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Transcription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transcription Sidebar */}
      {showTranscription && podcast.transcription && (
        <div className="col-span-1 h-[500px]">
          <Card className="h-full">
            <CardContent className="p-4 h-full">
              <h3 className="font-semibold mb-4">Transcription</h3>
              <ScrollArea className="h-[calc(100%-2rem)] pr-4">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {podcast.transcription}
                </p>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
