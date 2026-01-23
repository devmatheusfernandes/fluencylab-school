import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useMessageInputContext } from 'stream-chat-react';
import { MediaRecordingState } from 'stream-chat-react';
import { Mic, Pause, Check, Trash2, Send, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export const CustomAudioRecorder = () => {
  const {
    recordingController: { completeRecording, recorder, recording, recordingState },
  } = useMessageInputContext();

  const isUploadingFile = recording?.localMetadata?.uploadState === 'uploading';
  
  // Refs e States para o Player de Preview
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const state = useMemo(
    () => ({
      paused: recordingState === MediaRecordingState.PAUSED,
      recording: recordingState === MediaRecordingState.RECORDING,
      stopped: recordingState === MediaRecordingState.STOPPED,
    }),
    [recordingState],
  );

  // Efeito para configurar o áudio quando a gravação para (estado STOPPED)
  useEffect(() => {
    if (state.stopped && recording?.asset_url) {
      const audio = new Audio(recording.asset_url);
      audioRef.current = audio;

      const updateProgress = () => setProgress(audio.currentTime);
      const setAudioDuration = () => setDuration(audio.duration || recording.duration || 0);
      const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
      };

      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('loadedmetadata', setAudioDuration);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.pause();
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('loadedmetadata', setAudioDuration);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [state.stopped, recording?.asset_url, recording?.duration]);

  // Controles do Player
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!recorder) return null;

  return (
    <div className={cn(
      "flex items-center gap-3 bg-destructive/5 border border-destructive/20",
      "rounded-[26px] shadow-sm w-full",
      "px-2 py-1.5 min-h-[54px]"
    )}>
      
      {/* Botão Cancelar (Lixeira) */}
      <button
        className="flex items-center justify-center w-9 h-9 rounded-full text-destructive hover:bg-destructive/20 transition-colors shrink-0"
        disabled={isUploadingFile}
        onClick={recorder.cancel} // O pai lidará com a animação de saída
        type="button"
      >
        <Trash2 size={20} />
      </button>

      {/* ÁREA CENTRAL */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        
        {/* MODO GRAVANDO / PAUSADO */}
        {(state.recording || state.paused) && (
          <div className="flex items-center gap-3 w-full justify-center">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              state.recording ? "bg-destructive animate-pulse" : "bg-muted-foreground"
            )} />
            <RecordingTimer isPaused={state.paused} />
            {state.paused && <span className="text-xs text-muted-foreground">(Pausado)</span>}
          </div>
        )}

        {/* MODO PREVIEW (PLAY/PAUSE) */}
        {state.stopped && recording?.asset_url && (
          <div className="flex items-center gap-2 w-full px-2 animate-in fade-in zoom-in duration-300">
            {/* Botão Play/Pause do Preview */}
            <button 
              onClick={togglePlay}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5"/>}
            </button>

            {/* Barra de Progresso */}
            <div className="flex-1 flex flex-col justify-center gap-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={progress}
                onChange={handleSeek}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-foreground/10 accent-primary"
              />
              <div className="flex justify-between w-full text-[10px] text-muted-foreground px-0.5">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTÕES DE AÇÃO (DIREITA) */}
      <div className="flex items-center gap-2 shrink-0">
        
        {/* Pausar/Retomar Gravação */}
        {state.recording && (
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-foreground"
            onClick={recorder.pause}
            type="button"
          >
            <Pause size={18} fill="currentColor" />
          </button>
        )}

        {state.paused && (
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full bg-destructive text-destructive-foreground hover:brightness-110 transition-all"
            onClick={recorder.resume}
            type="button"
          >
            <Mic size={18} />
          </button>
        )}

        {/* Enviar / Parar */}
        {state.stopped ? (
          <button
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground hover:brightness-110 shadow-sm transition-all",
              isUploadingFile && "opacity-50 cursor-not-allowed"
            )}
            disabled={isUploadingFile}
            onClick={completeRecording}
            type="button"
          >
            {isUploadingFile ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        ) : (
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 shadow-sm transition-all"
            onClick={recorder.stop}
            type="button"
          >
            <Check size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

// Componente Timer
const RecordingTimer = ({ isPaused }: { isPaused: boolean }) => {
  const [seconds, setSeconds] = React.useState(0);
  
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (!isPaused) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPaused]);

  return (
    <span className="text-sm font-mono font-medium text-foreground min-w-[3ch]">
      {formatDuration(seconds)}
    </span>
  );
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};