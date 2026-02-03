import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AttachmentProps,
  useMessageContext,
  Attachment as DefaultAttachment,
} from "stream-chat-react";
import { Attachment } from "stream-chat";
import { createPortal } from "react-dom";

// ============================================================================
// 1. MODAL DE VISUALIZAÇÃO DE IMAGEM (FULLSCREEN)
// ============================================================================
const ImageModal = ({ src, onClose }: { src: string; onClose: () => void }) => {
  // Fecha com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Renderiza no body (Portal) para ficar por cima de tudo
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Botão Fechar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50"
      >
        <X size={24} />
      </button>

      {/* Imagem em Alta Resolução */}
      <img
        src={src}
        alt="Preview"
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-md shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Clicar na imagem não fecha
      />
    </div>,
    document.body,
  );
};

// ============================================================================
// 2. COMPONENTE DE MINIATURA DA IMAGEM
// ============================================================================
const CustomImageAttachment = ({ attachment }: { attachment: Attachment }) => {
  const [isOpen, setIsOpen] = useState(false);
  const imageUrl =
    attachment.image_url || attachment.thumb_url || attachment.asset_url;

  if (!imageUrl) return null;

  return (
    <>
      <div
        className="group relative overflow-hidden cursor-zoom-in max-w-[300px] border border-border shadow-sm"
        onClick={() => setIsOpen(true)}
      >
        <img
          src={imageUrl}
          alt={attachment.fallback || "Image attachment"}
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Overlay de Hover com Ícone */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-black/50 p-2 rounded-full text-white backdrop-blur-sm">
            <ZoomIn size={16} />
          </div>
        </div>
      </div>

      {isOpen && <ImageModal src={imageUrl} onClose={() => setIsOpen(false)} />}
    </>
  );
};

// ============================================================================
// 3. PLAYER DE ÁUDIO (CÓDIGO ANTERIOR)
// ============================================================================
const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const ModernAudioPlayer = ({ src }: { src: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isMyMessage } = useMessageContext();

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const setAudioData = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const updateProgress = () => {
      setProgress(audio.currentTime);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 pr-4 rounded-xl min-w-[240px] max-w-[300px] select-none transition-colors",
        isMyMessage() ? "bg-primary/20" : "bg-secondary",
      )}
    >
      <button
        onClick={togglePlay}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full transition-all shrink-0",
          isMyMessage()
            ? "bg-primary text-primary-foreground hover:brightness-110"
            : "bg-foreground text-background hover:bg-foreground/90",
        )}
      >
        {isPlaying ? (
          <Pause size={14} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <div className="flex flex-col flex-1 gap-1 min-w-0">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={progress}
          onChange={handleSeek}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-foreground/10"
          style={{
            background: `linear-gradient(to right, ${isMyMessage() ? "var(--accent)" : "currentColor"} ${(progress / (duration || 1)) * 100}%, rgba(0,0,0,0.1) 0)`,
          }}
        />
        <div className="flex justify-between text-[10px] font-medium opacity-70">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. COMPONENTE PRINCIPAL (ROTEADOR DE ANEXOS)
// ============================================================================
export const CustomAttachment = (props: AttachmentProps) => {
  const { attachments } = props;
  const attachment = attachments[0] as Attachment; // Simplificação para pegar o primeiro

  if (!attachment) return null;

  // 1. ÁUDIO
  if (attachment.type === "audio" || attachment.type === "voiceRecording") {
    if (attachment.asset_url) {
      return <ModernAudioPlayer src={attachment.asset_url} />;
    }
  }

  // 2. IMAGEM
  if (attachment.type === "image") {
    return <CustomImageAttachment attachment={attachment} />;
  }

  // 3. FALLBACK (Vídeos, Arquivos, Giphy, etc.)
  return <DefaultAttachment {...props} />;
};
