"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PracticeAudioPlayerProps {
  audioUrl?: string | null;
  isOpen: boolean;
  onClose: () => void;
  autoPlay?: boolean;
  startTime?: number;
  endTime?: number;
  onComplete?: () => void;
  textToSpeak?: string;
  language?: string;
}

export function PracticeAudioPlayer({
  audioUrl = null,
  isOpen,
  onClose,
  autoPlay = true,
  startTime = 0,
  endTime,
  onComplete,
  textToSpeak,
  language = "en-US",
}: PracticeAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldAutoPlayRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(startTime);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const handleSpeechStart = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handleSpeechEnd = useCallback(() => {
    setIsPlaying(false);
    if (onComplete) onComplete();
  }, [onComplete]);

  const speakText = useCallback(
    (rateOverride?: number) => {
      if (!textToSpeak) return;
      if (isMuted) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window))
        return;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = language;
      utterance.rate = rateOverride ?? playbackRate;
      utterance.onstart = handleSpeechStart;
      utterance.onend = handleSpeechEnd;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [
      handleSpeechEnd,
      handleSpeechStart,
      isMuted,
      language,
      playbackRate,
      textToSpeak,
    ]
  );

  useEffect(() => {
    if (!isOpen) {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
      return;
    }

    if (textToSpeak && autoPlay) {
      speakText();
    }
  }, [isOpen, autoPlay, speakText, textToSpeak]);

  const handleLoadedMetadata = () => {
    if (textToSpeak) return;
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = isMuted;
    audio.playbackRate = playbackRate;

    const nextDuration = audio.duration;
    setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);

    if (Math.abs(audio.currentTime - startTime) > 0.1) {
      try {
        audio.currentTime = startTime;
      } catch {}
    }
    setProgress(audio.currentTime);
    setIsPlaying(!audio.paused);

    if (shouldAutoPlayRef.current) {
      audio.play().catch(() => {});
    }
  };

  const handleDurationChange = () => {
    if (textToSpeak) return;
    const audio = audioRef.current;
    if (!audio) return;
    const nextDuration = audio.duration;
    setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
  };

  const togglePlay = () => {
    if (textToSpeak) {
      if (isPlaying) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
      } else {
        speakText();
      }
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if (endTime && audioRef.current.currentTime >= endTime) {
          audioRef.current.currentTime = startTime;
        }
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (textToSpeak) return;

    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      setProgress(current);
      const nextDuration = audioRef.current.duration;
      if (Number.isFinite(nextDuration)) {
        setDuration(nextDuration);
      }

      if (endTime && current >= endTime) {
        audioRef.current.pause();
        setIsPlaying(false);
        audioRef.current.currentTime = startTime;
        if (onComplete) onComplete();
      }
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (textToSpeak) {
      if (nextMuted) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const changeSpeed = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackRate(newSpeed);

    if (textToSpeak) {
      if (isPlaying) speakText(newSpeed);
      return;
    }

    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6 shadow-2xl rounded-t-2xl"
        >
          <audio
            ref={audioRef}
            src={audioUrl || undefined}
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
            onDurationChange={handleDurationChange}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />

          <div className="max-w-md mx-auto space-y-4">
            {!textToSpeak && (
              <div className="space-y-2">
                <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-100 ease-linear"
                    style={{
                      width: endTime
                        ? `${Math.max(0, Math.min(100, ((progress - startTime) / (endTime - startTime)) * 100))}%`
                        : `${(progress / (duration || 1)) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>
                    {formatTime(
                      endTime ? Math.max(0, progress - startTime) : progress
                    )}
                  </span>
                  <span>
                    {formatTime(endTime ? endTime - startTime : duration)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={changeSpeed}
                className="text-slate-500 font-bold text-xs w-10 h-10 border-2 rounded-xl"
              >
                {playbackRate}x
              </Button>

              <Button
                size="icon"
                type="button"
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-indigo-500 hover:bg-indigo-600 border-indigo-500 dark:border-indigo-400 text-white shadow-lg shadow-indigo-500/30 text-2xl"
              >
                {isPlaying ? (
                  <Pause className="fill-current" />
                ) : (
                  <Play className="fill-current ml-1" />
                )}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={toggleMute}
                  className="text-slate-500"
                >
                  {isMuted ? <VolumeX /> : <Volume2 />}
                </Button>
              </div>
            </div>

            <div className="w-full flex justify-center pt-2">
              <button
                onClick={onClose}
                className="text-slate-400 text-sm hover:text-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
