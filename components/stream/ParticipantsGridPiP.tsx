import React, { useEffect, useState, useRef } from 'react';
import { ParticipantView, StreamVideoParticipant } from "@stream-io/video-react-sdk";

interface ParticipantsGridProps {
  remoteParticipants: StreamVideoParticipant[];
  localParticipant?: StreamVideoParticipant;
}

// Componente que renderiza a view do participante compartilhando tela com um botão para fullscreen.
const ScreenShareWithFullscreenButton: React.FC<{ participant: StreamVideoParticipant }> = ({ participant }) => {
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
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch(err =>
        console.error("Erro ao entrar em fullscreen:", err)
      );
    }
  };

  return (
    <div ref={containerRef} className="relative w-60 h-auto">
      <ParticipantView 
        participant={participant} 
        trackType="screenShareTrack" 
      />
      <button 
        onClick={toggleFullscreen}
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {isFullscreen ? "Sair do Fullscreen" : "Entrar em Fullscreen"}
      </button>
    </div>
  );
};

export const ParticipantsGridPiP: React.FC<ParticipantsGridProps> = ({ remoteParticipants, localParticipant }) => {
  // Combina o participante local com os remotos.
  const mergedParticipants = localParticipant ? [localParticipant, ...remoteParticipants] : remoteParticipants;
  
  // Filtra participantes únicos, usando 'participant.userId' ou 'participant.sessionId'
  const uniqueParticipants = mergedParticipants.filter((participant, index, self) => {
    const id = participant.userId || participant.sessionId;
    return index === self.findIndex(p => (p.userId || p.sessionId) === id);
  });

  return (
    <div className="w-full flex flex-col gap-4">
      {uniqueParticipants.map((participant) => {
        const isScreenSharing = participant.publishedTracks?.includes(3) ?? false;
        // Verifica se é o participante local
        const isLocal = localParticipant && (participant.sessionId === localParticipant.sessionId);

        // Se for um participante remoto compartilhando tela, renderiza com botão para fullscreen.
        if (!isLocal && isScreenSharing) {
          return (
            <ScreenShareWithFullscreenButton key={participant.sessionId} participant={participant} />
          );
        }

        // Caso contrário, renderiza normalmente.
        return (
          <div key={participant.sessionId} className="w-60 h-auto">
            <ParticipantView 
              participant={participant} 
              trackType={isScreenSharing ? "screenShareTrack" : "videoTrack"} 
            />
          </div>
        );
      })}
    </div>
  );
};
