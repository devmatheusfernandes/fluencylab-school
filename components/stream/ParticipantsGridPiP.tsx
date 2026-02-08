import React, { useEffect, useState, useRef } from "react";
import {
  ParticipantView,
  StreamVideoParticipant,
} from "@stream-io/video-react-sdk";

interface ParticipantsGridProps {
  remoteParticipants: StreamVideoParticipant[];
  localParticipant?: StreamVideoParticipant;
}

// Componente que renderiza a view do participante compartilhando tela com um botão para fullscreen.
const ScreenShareWithFullscreenButton: React.FC<{
  participant: StreamVideoParticipant;
}> = ({ participant }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement === containerRef.current) {
        setIsFullscreen(true);
      } else {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      containerRef.current
        .requestFullscreen()
        .catch((err) => console.error("Erro ao entrar em fullscreen:", err));
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <ParticipantView participant={participant} trackType="screenShareTrack" />
      <button
        onClick={toggleFullscreen}
        style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}
        className="px-4 py-2 bg-blue-600 text-white rounded text-xs"
      >
        {isFullscreen ? "Sair" : "Expandir"}
      </button>
    </div>
  );
};

export const ParticipantsGridPiP: React.FC<ParticipantsGridProps> = ({
  remoteParticipants,
  // localParticipant, // Ignoramos propositalmente o localParticipant aqui
}) => {
  // CORREÇÃO: Usamos apenas os remotos.
  // Isso garante que o professor (local) NUNCA apareça no PiP, apenas o aluno.
  const uniqueParticipants = remoteParticipants;

  if (uniqueParticipants.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500 text-xs">
        Aguardando...
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {uniqueParticipants.map((participant) => {
        const isScreenSharing =
          participant.publishedTracks?.includes(3) ?? false;

        // Se for um participante remoto compartilhando tela
        if (isScreenSharing) {
          return (
            <div key={participant.sessionId} className="flex-1 w-full h-full">
              <ScreenShareWithFullscreenButton participant={participant} />
            </div>
          );
        }

        // Caso contrário, renderiza o vídeo normalmente ocupando todo o espaço
        return (
          <div key={participant.sessionId} className="flex-1 w-full h-full">
            <ParticipantView participant={participant} trackType="videoTrack" />
          </div>
        );
      })}
    </div>
  );
};
