import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { motion } from "framer-motion";

export const AudioPlayer = ({ url }: { url: string }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reseta player se a URL mudar
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () =>
      setProgress((audio.currentTime / audio.duration) * 100);
    const handleEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className="w-full bg-indigo-50/80 dark:bg-black/70 backdrop-blur-sm rounded-2xl p-3 mb-6 flex items-center gap-4 border border-indigo-100 dark:border-indigo-500 shadow-sm">
      <button
        onClick={togglePlay}
        className="h-12 w-12 flex items-center justify-center bg-indigo-600 rounded-full text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform shrink-0"
      >
        {playing ? (
          <Pause className="h-5 w-5 fill-current" />
        ) : (
          <Play className="h-5 w-5 ml-1 fill-current" />
        )}
      </button>
      <div className="flex-1 space-y-1.5">
        <div className="flex justify-between text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3" /> Listening Task
          </span>
          <span>{playing ? "Tocando..." : "Toque para ouvir"}</span>
        </div>
        <div className="h-2 bg-indigo-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear", duration: 0.1 }}
          />
        </div>
      </div>
      <audio ref={audioRef} src={url} className="hidden" />
    </div>
  );
};
