'use client';
import React, { useEffect, useState, useRef, JSX } from 'react';
import {
  CallingState,
  StreamTheme,
  useCallStateHooks,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  ScreenShareButton,
  Avatar
} from "@stream-io/video-react-sdk";
import { useCall } from '@stream-io/video-react-bindings';
import { Button } from '@/components/ui/button';
import { useCallContext } from '@/context/CallContext';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { ParticipantsGrid } from './ParticipantsGrid';
import { ParticipantsGridPiP } from './ParticipantsGridPiP';
import { toast } from 'sonner';
import { db } from '@/lib/firebase/config';
import { Camera, CameraOff, LucideAlignHorizontalJustifyEnd, LucideClipboardPlus, Mic, MicOff, PictureInPicture, TurntableIcon } from 'lucide-react';

// Common container and notch classes for responsiveness
const containerClasses = `
  fixed top-0 right-0 bottom-0 w-full max-w-sm z-[9999]
  rounded-l-2xl overflow-y-auto
  bg-white/20 dark:bg-black/20
  backdrop-blur-lg
  border border-white/30 dark:border-white/10
  text-fluency-gray-800 dark:text-fluency-gray-100
  hover:bg-white/30 hover:dark:bg-black/30
  hover:border-white/50 dark:hover:border-white/20
  focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent
  transition-all duration-300
  shadow-[0_4px_12px_rgba(0,0,0,0.05)]
  p-4
`;
const notchClasses =
  "absolute left-2 top-1/2 transform -translate-y-1/2 w-[5px] h-12 bg-gray-400 dark:bg-gray-200 rounded-full mx-auto mb-4 cursor-grab";

interface JoinUIProps {
  role: "teacher" | "student";
  onJoin: () => Promise<void>;
  joinLabel: string;
}

  export const showCanceledCallToast = (): void => {
    toast("Cancelada", {
      position: "bottom-center",
      style: {
        borderRadius: "10px",
        background: "#DEBE16",
        color: "#fff",
        textAlign: "center",
        padding: "10px",
        fontSize: "1rem",
        fontWeight: 'bold'
      },
    });
  };

  export const showJoinedCallToast = (): void => {
    toast("Sala criada!", {
      position: "bottom-center",
      style: {
        borderRadius: "10px",
        background: "#1fc84f",
        color: "#fff",
        textAlign: "center",
        padding: "10px",
        fontSize: "1rem",
        fontWeight: 'bold'
      },
    });
  };

  export const showLeftCallToast = (): void => {
    toast("Até mais!", {
      position: "bottom-center",
      style: {
        borderRadius: "10px",
        background: "#3F51B5",
        color: "#fff",
        textAlign: "center",
        padding: "10px",
        fontSize: "1rem",
        fontWeight: 'bold'
      },
    });
  };

  export const showEndedCallToast = (): void => {
    toast("Chamada encerrada", {
      position: "bottom-center",
      style: {
        borderRadius: "10px",
        background: "#FA3D2E",
        color: "#fff",
        textAlign: "center",
        padding: "10px",
        fontSize: "1rem",
        fontWeight: 'bold'
      },
    });
  };

// A reusable join UI component wrapped in a motion.div
export const JoinUI: React.FC<JoinUIProps> = ({ role, onJoin, joinLabel }) => {
    const { useCallSession } = useCallStateHooks();
    const sessionCall = useCallSession();
    const call = useCall();
    const { setCallData } = useCallContext();
    const { data: session } = useSession();
    // Cria um array de participantes únicos
    const uniqueParticipants = sessionCall?.participants.filter(
      (participant, index, self) =>
        index === self.findIndex(p => p.user.id === participant.user.id)
    ) || [];

    return (
    <StreamTheme>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(event, info) => {
          if (info.offset.x > 100) {
            call?.leave();
            setCallData(null);
            showCanceledCallToast();
          }
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        className={containerClasses}
      >
        <div className={notchClasses} />
        <div className="flex flex-col items-center justify-center gap-6 rounded-lg p-4 h-[85%]">
          <p className="text-lg font-semibold">
            Bem-vindo, {role === "teacher" ? "Professor" : (session?.user.name)}!
          </p>
          {role === "student" && 
          (<div className="flex flex-row items-center justify-center gap-2">
            Participantes:
          </div>)}
          <div className="flex flex-wrap justify-center gap-2">
            {uniqueParticipants.map((participant, index) => {
              const key = participant.user.id ? `user-${participant.user.id}` : `index-${index}`;
              return (
                <div key={key} className="flex flex-row items-center justify-center gap-2">
                  <Avatar
                    name={participant.user.name}
                    imageSrc={participant.user.image}
                    style={{ borderRadius: "100%" }}
                  />
                  {participant.user.name && (
                    <div className="font-bold text-sm">
                      {participant.user.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 w-full">
            <Button onClick={onJoin}>
              {joinLabel}
            </Button>
            <Button 
                onClick={async () => {
                    try {
                      await call?.endCall();
                    } catch (error: any) {
                      if (error.message && error.message.includes("already been left")) {
                        console.warn("Call was already left.");
                      } else {
                        console.error("Error leaving call:", error);
                      }
                    } finally {
                      try {
                        const parts = String(call?.id || '').split('-');
                        const other = parts.find((p) => p !== session?.user?.id);
                        if (other) {
                          await fetch('/api/calls/end', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ studentId: other })
                          });
                        }
                      } catch {}
                      setCallData(null);
                      showCanceledCallToast();
                    }
                }}
                >
                Cancelar
            </Button>
          </div>
        </div>
      </motion.div>
    </StreamTheme>
    );
  };

export const MyUILayout: React.FC = (): JSX.Element => {
  const { data: session } = useSession();
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setId(params.get("student"));
    }
  }, []);
  
  const call = useCall();
  const { callData, setCallData } = useCallContext();
  const {
    useCallCallingState,
    useLocalParticipant,
    useRemoteParticipants,
    useMicrophoneState,
  } = useCallStateHooks();
  const callingState = useCallCallingState();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const isSpeakingWhileMuted = useMicrophoneState(); 
  const [isPiP, setIsPiP] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  const resolveStudentId = (): string | null => {
    if (id) return id;
    if (callData?.callId && session?.user?.id) {
      const parts = String(callData.callId).split('-');
      const other = parts.find((p) => p !== session.user.id) || null;
      return other;
    }
    return null;
  };

  const handleEndCall = async (): Promise<void> => {
    if (call) {
      try {
        await call.endCall();
        setCallData(null);
        const studentId = resolveStudentId();
        if (studentId) {
          await fetch('/api/calls/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId })
          });
        }
        showEndedCallToast();
      } catch (error) {
        console.error("Error ending the call:", error);
      }
    }
  };

  const handleStudentLeaveCall = async (): Promise<void> => {
    if (call) {
      try {
        await call.leave();
        setCallData(null);
        if (session?.user?.id) {
          const userRef = doc(db, "users", session.user.id);
          try {
            await updateDoc(userRef, { callId: null });
          } catch (err) {
            console.error("Erro ao limpar callId do aluno:", err);
          }
        }
        showLeftCallToast();
      } catch (error) {
        console.error("Error leaving the call:", error);
      }
    }
  };

  const handleTeacherJoinCall = async (): Promise<void> => {
    // Prevent duplicate join attempts.
    if (callingState === CallingState.JOINED) {
      console.warn("User is already in the call.");
      return;
    }
    if (call) {
      try {
        await call.join({
          data: {
            settings_override: {
              limits: {
                max_duration_seconds: 3600,
              },
            },
          },
        })
        if (id) {
          const studentRef = doc(db, "users", id);
          try {
            await updateDoc(studentRef, { callId: callData?.callId });
            console.log("Campo callId atualizado com sucesso.");
          } catch (error) {
            console.error("Erro ao atualizar o campo callId:", error);
          }
        }
        showJoinedCallToast();
      } catch (error) {
        console.error("Error joining the call:", error);
      }
    }
  };
  
  const handleStudentJoinCall = async (): Promise<void> => {
    // Prevent duplicate join attempts.
    if (callingState === CallingState.JOINED) {
      console.warn("User is already in the call.");
      return;
    }
    if (call) {
      try {
        await call.join();
        showJoinedCallToast();
      } catch (error) {
        console.error("Error joining the call:", error);
      }
    }
  };

  const togglePiP = () => {
    setIsPiP((prev) => !prev);
  };

  // Full call UI wrapped in a draggable motion.div
  const callComponent = (
    <StreamTheme>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_event, info) => {
          if (info.offset.x > 100) {
            if (callingState === CallingState.JOINED) {
              togglePiP();
            } else {
              setCallData(null);
              showCanceledCallToast();
            }
          }
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        className={containerClasses}
      >
        <div className={notchClasses} />
          <div className="flex flex-col items-center justify-center gap-6 rounded-lg p-4">

            <div className="w-full flex flex-col items-center justify-center gap-4">
              <ParticipantsGrid remoteParticipants={remoteParticipants} localParticipant={localParticipant} />
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-2 w-full absolute bottom-3">
              
              <ToggleAudioPublishingButton />
              <ToggleVideoPublishingButton />
              <ScreenShareButton />
                <button className='p-3 rounded-full bg-fluency-gray-600 dark:bg-fluency-gray-600 hover:bg-fluency-gray-700 hover:dark:bg-fluency-gray-700 duration-300 ease-in-out transition-all' onClick={togglePiP}>
                  <PictureInPicture className='text-indigo-600'/>
              </button>
              {session?.user.role === "student" && (
                  <button className='p-3 rounded-full bg-fluency-gray-200 dark:bg-fluency-gray-600 hover:bg-fluency-gray-700 hover:dark:bg-fluency-gray-700 duration-300 ease-in-out transition-all' onClick={handleStudentLeaveCall}>
                      <LucideClipboardPlus className='text-fluency-red-600' />
                  </button>
                )}
              {session?.user.role === "teacher" && (
                <button className='p-3 rounded-full bg-fluency-gray-600 dark:bg-fluency-gray-600 hover:bg-fluency-gray-700 hover:dark:bg-fluency-gray-700 duration-300 ease-in-out transition-all' onClick={handleEndCall}>
                  <TurntableIcon className='text-fluency-red-600'/>
                </button>
              )}
            </div>
          </div>
      </motion.div>
    </StreamTheme>
  );

  // Custom toggle functions
const handleToggleAudio = async (): Promise<void> => {
  if (call) {
    try {
      await call.microphone.toggle();
    } catch (error) {
      console.error("Error toggling audio:", error);
    }
  }
};

const handleToggleVideo = async (): Promise<void> => {
  if (call) {
    try {
      await call.camera.toggle();
    } catch (error) {
      console.error("Error toggling video:", error);
    }
  }
};
  // PiP UI: A smaller, draggable popup constrained to the screen.
  const pipComponent = (
    <StreamTheme>
        <div ref={constraintsRef} className='fixed inset-0 pointer-events-none z-[9999]'>
          <motion.div
            ref={constraintsRef}
            drag
            dragMomentum={false}
            dragConstraints={constraintsRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="pointer-events-auto fixed bottom-20 right-20 w-min z-[9999] p-3 rounded-xl bg-fluency-gray-200 dark:bg-fluency-gray-900"
          >
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-full flex flex-col items-center justify-center gap-4">
              <ParticipantsGridPiP remoteParticipants={remoteParticipants} localParticipant={localParticipant} />
            </div>

            <div className="flex flex-wrap items-center justify-center w-full gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="p-3 rounded-full bg-fluency-gray-200 dark:bg-fluency-gray-600 
                         hover:bg-fluency-gray-300 hover:dark:bg-fluency-gray-700 
                         duration-300 ease-in-out transition-all"
              onClick={handleToggleAudio}
            >
              {localParticipant?.audioStream ? (
                <Mic className="text-indigo-600" />
              ) : (
                <MicOff className="text-red-600" />
              )}
            </motion.button>

            {/* Custom Toggle Video Button with animation */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="p-3 rounded-full bg-fluency-gray-200 dark:bg-fluency-gray-600 
                         hover:bg-fluency-gray-300 hover:dark:bg-fluency-gray-700 
                         duration-300 ease-in-out transition-all"
              onClick={handleToggleVideo}
            >
              {localParticipant?.videoStream ? (
                <Camera className="text-indigo-600" />
              ) : (
                <CameraOff className="text-red-600" />
              )}
            </motion.button>

              <button className='p-3 rounded-full bg-fluency-gray-200 dark:bg-fluency-gray-600 hover:bg-fluency-gray-300 hover:dark:bg-fluency-gray-700 duration-300 ease-in-out transition-all' onClick={togglePiP}>
                <PictureInPicture className='text-indigo-600'/>
              </button>
              {session?.user.role === "student" && (
                <button className='p-3 rounded-full bg-fluency-gray-200 dark:bg-fluency-gray-600 hover:bg-fluency-gray-300 hover:dark:bg-fluency-gray-700 duration-300 ease-in-out transition-all' onClick={handleStudentLeaveCall}>
                    <LucideAlignHorizontalJustifyEnd className='text-fluency-red-600' />
                </button>
              )}
              {session?.user.role === "teacher" && (
                <button className='p-3 rounded-full bg-fluency-gray-200 dark:bg-fluency-gray-600 hover:bg-fluency-gray-300 hover:dark:bg-fluency-gray-700 duration-300 ease-in-out transition-all' onClick={handleEndCall}>
                  <LucideAlignHorizontalJustifyEnd className='text-fluency-red-600'/>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </StreamTheme>
  );

  if (!call?.id) return <>Sem chamada ativa</>;

  return (
    <>
      {callingState !== CallingState.JOINED ? (
        session?.user.role === "teacher" ? (
          <JoinUI
            role="teacher"
            onJoin={handleTeacherJoinCall}
            joinLabel="Iniciar Aula"
          />
        ) : (
          <JoinUI
            role="student"
            onJoin={handleStudentJoinCall}
            joinLabel="Entrar na Aula"
          />
        )
      ) : isPiP ? (
        pipComponent
      ) : (
        callComponent
      )}
    </>
  );
};
