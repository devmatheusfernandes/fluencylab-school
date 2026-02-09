
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PracticeAudioPlayerProps {
  audioUrl: string;
  isOpen: boolean;
  onClose: () => void;
  autoPlay?: boolean;
  startTime?: number;
  endTime?: number;
  onComplete?: () => void;
}

export function PracticeAudioPlayer({ audioUrl, isOpen, onClose, autoPlay = true, startTime = 0, endTime, onComplete }: PracticeAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(startTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (isOpen && audioRef.current) {
      // Force reset to start time whenever startTime changes or player opens
      // We check if difference is significant to avoid stutter on small updates
      if (Math.abs(audioRef.current.currentTime - startTime) > 0.1) {
          audioRef.current.currentTime = startTime;
          setProgress(startTime);
      }
      
      if (autoPlay) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  }, [isOpen, autoPlay, audioUrl, startTime]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // If we reached the end, restart from startTime
        if (endTime && audioRef.current.currentTime >= endTime) {
             audioRef.current.currentTime = startTime;
        }
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      setProgress(current);
      setDuration(audioRef.current.duration || 0);

      // Check for segment end
      if (endTime && current >= endTime) {
        audioRef.current.pause();
        setIsPlaying(false);
        audioRef.current.currentTime = startTime; // Reset for replay
        if (onComplete) onComplete();
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeSpeed = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackRate(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6 shadow-2xl rounded-t-2xl"
        >
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />

          <div className="max-w-md mx-auto space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-blue-500 transition-all duration-100 ease-linear"
                    style={{ 
                      width: endTime 
                        ? `${Math.max(0, Math.min(100, ((progress - startTime) / (endTime - startTime)) * 100))}%` 
                        : `${(progress / (duration || 1)) * 100}%` 
                    }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{formatTime(endTime ? Math.max(0, progress - startTime) : progress)}</span>
                <span>{formatTime(endTime ? endTime - startTime : duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={changeSpeed} className="text-slate-500 font-bold text-xs w-10 h-10 border-2 rounded-xl">
                {playbackRate}x
              </Button>

              <Button 
                size="icon" 
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 text-2xl"
              >
                {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current ml-1" />}
              </Button>

              <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" onClick={toggleMute} className="text-slate-500">
                    {isMuted ? <VolumeX /> : <Volume2 />}
                 </Button>
              </div>
            </div>
            
            {/* Close Button (Optional if managed by parent) */}
            <div className="w-full flex justify-center pt-2">
                 <button onClick={onClose} className="text-slate-400 text-sm hover:text-slate-600">Close Player</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
