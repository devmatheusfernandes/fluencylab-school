import { useState, useEffect, useRef, useCallback } from "react";
import { savePodcastProgressAction } from "@/actions/learning/immersionActions";

interface UsePodcastPlayerProps {
  podcastId: string;
  initialProgress?: number; // in seconds
  audioUrl: string;
}

export function usePodcastPlayer({
  podcastId,
  initialProgress = 0,
  audioUrl,
}: UsePodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialProgress);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isReady, setIsReady] = useState(false);

  // Initialize audio
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.currentTime = initialProgress;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
      setIsReady(true);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      saveProgress(audio.currentTime, true);
    };

    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      // Cleanup: pause and save progress
      if (!audio.paused) {
        audio.pause();
      }
      saveProgress(audio.currentTime, false);

      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, podcastId]);

  // Save progress logic
  const saveProgress = async (time: number, completed: boolean) => {
    if (!podcastId || isNaN(time)) return;

    try {
      await savePodcastProgressAction(podcastId, time, completed);
    } catch (error) {
      console.error("Failed to save progress", error);
    }
  };

  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && audioRef.current) {
        saveProgress(audioRef.current.currentTime, false);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isPlaying, podcastId]);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const changeVolume = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setVolume(vol);
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.min(
        Math.max(audioRef.current.currentTime + seconds, 0),
        audioRef.current.duration,
      );
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    isReady,
    togglePlay,
    seek,
    changeVolume,
    skip,
  };
}
