"use client";
import React, { useEffect, useState, useRef, JSX } from "react";
import {
  CallingState,
  StreamTheme,
  useCallStateHooks,
  ScreenShareButton,
  Avatar,
  TranscriptionSettingsRequestModeEnum,
} from "@stream-io/video-react-sdk";
import { useCall } from "@stream-io/video-react-bindings";
import { Button } from "@/components/ui/button";
import { useCallContext } from "@/context/CallContext";
import { useSession } from "next-auth/react";
import { useSearchParams, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { ParticipantsGrid } from "./ParticipantsGrid";
import { ParticipantsGridPiP } from "./ParticipantsGridPiP";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import {
  Camera,
  CameraOff,
  LogOut,
  Mic,
  MicOff,
  Minimize2,
  Maximize2,
  PhoneOff,
  Loader2,
  MoreVertical,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- HOOK PARA DETECTAR MOBILE/STANDALONE ---
const useStandalone = () => {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isMobileWidth = window.innerWidth < 768;
      const isPWA = window.matchMedia("(display-mode: standalone)").matches;
      setIsStandalone(isMobileWidth || isPWA);
    };

    checkStandalone();
    window.addEventListener("resize", checkStandalone);
    return () => window.removeEventListener("resize", checkStandalone);
  }, []);

  return isStandalone;
};

// --- ESTILOS COMPARTILHADOS ---
// Ajustado para ser mais responsivo (largura total no mobile, parcial no desktop)
const getGlassContainerClasses = (isMobile: boolean) => `
  fixed z-[9999]
  rounded-3xl overflow-hidden flex flex-col
  bg-white/80 dark:bg-black/60
  backdrop-blur-xl saturate-150
  border border-white/20 dark:border-white/10
  text-slate-800 dark:text-slate-100
  shadow-2xl shadow-black/10
  transition-all duration-300
  ${
    isMobile
      ? "bottom-4 left-2 right-2 w-[calc(100vw-1rem)] max-h-[80vh]" // Mobile: Quase tela cheia na largura, margem embaixo
      : "top-30 right-4 bottom-4 w-full max-w-[25vw] max-h-[75vh]" // Desktop: Mantém layout original
  }
`;

const controlButtonClasses = `
  p-3 rounded-full transition-all duration-200 ease-in-out
  flex items-center justify-center shrink-0
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900
`;

// --- TOASTS HELPERS ---
const toastStyleBase = {
  borderRadius: "12px",
  color: "#fff",
  textAlign: "center" as const,
  padding: "12px",
  fontSize: "0.95rem",
  fontWeight: 600,
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  border: "1px solid rgba(255,255,255,0.1)",
};

export const showCanceledCallToast = () =>
  toast("Chamada Cancelada", {
    position: "bottom-center",
    style: { ...toastStyleBase, background: "#EAB308" },
  });
export const showJoinedCallToast = () =>
  toast("Sala Criada!", {
    position: "bottom-center",
    style: { ...toastStyleBase, background: "#22C55E" },
  });
export const showLeftCallToast = () =>
  toast("Você saiu da chamada", {
    position: "bottom-center",
    style: { ...toastStyleBase, background: "#6366F1" },
  });
export const showEndedCallToast = () =>
  toast("Chamada Encerrada", {
    position: "bottom-center",
    style: { ...toastStyleBase, background: "#EF4444" },
  });

// --- COMPONENTE DE BOTÃO ---
const ControlButton = ({
  onClick,
  isEnabled = true,
  enabledIcon: EnabledIcon,
  disabledIcon: DisabledIcon,
  variant = "default",
  className,
}: any) => {
  const isDestructive = variant === "destructive";

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        controlButtonClasses,
        isDestructive
          ? "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 shadow-lg shadow-red-500/20"
          : isEnabled
            ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700"
            : "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 shadow-md shadow-red-500/20",
        className,
      )}
    >
      {isEnabled ? <EnabledIcon size={20} /> : <DisabledIcon size={20} />}
    </motion.button>
  );
};

// --- JOIN UI ---
interface JoinUIProps {
  role: "teacher" | "student";
  onJoin: () => Promise<void>;
  joinLabel: string;
  notebookId?: string | null;
  callData?: any;
}

export const JoinUI: React.FC<JoinUIProps> = ({
  role,
  onJoin,
  joinLabel,
  notebookId,
  callData,
}) => {
  const { useCallSession } = useCallStateHooks();
  const sessionCall = useCallSession();
  const call = useCall();
  const { setCallData } = useCallContext();
  const { data: session } = useSession();
  const isMobile = useStandalone();

  const uniqueParticipants =
    sessionCall?.participants.filter(
      (participant, index, self) =>
        index === self.findIndex((p) => p.user.id === participant.user.id),
    ) || [];

  const handleCancel = async () => {
    try {
      await call?.endCall();
    } catch (error) {
    } finally {
      try {
        const parts = String(call?.id || "").split("-");
        const other = parts.find((p) => p !== session?.user?.id);
        if (other) {
          await fetch("/api/calls/end", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: other,
              notebookId: notebookId,
              callId: call?.id || callData?.callId,
            }),
          });
        }
      } catch {}
      setCallData(null);
      showCanceledCallToast();
    }
  };

  return (
    <StreamTheme>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(event, info) => {
          if (info.offset.x > 100) handleCancel();
        }}
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={getGlassContainerClasses(isMobile)}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-16 bg-slate-300 dark:bg-slate-700 rounded-full opacity-50" />
        <div className="flex flex-col items-center justify-center h-full p-6 space-y-8 relative">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              {role === "teacher" ? "Sala de Aula" : "Pronto?"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {role === "teacher"
                ? "Prepare-se para ensinar"
                : `Olá, ${session?.user.name?.split(" ")[0]}`}
            </p>
          </div>
          <div className="flex -space-x-4 items-center justify-center py-4">
            {uniqueParticipants.length > 0 ? (
              uniqueParticipants.map((p) => (
                <div
                  key={p.user.id}
                  className="relative z-10 border-4 border-white dark:border-slate-900 rounded-full shadow-lg"
                >
                  <Avatar
                    name={p.user.name}
                    imageSrc={session?.user.avatarUrl || p.user.image}
                    style={{ width: 64, height: 64, borderRadius: "100%" }}
                  />
                </div>
              ))
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center animate-pulse">
                <span className="text-2xl">👋</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 w-full max-w-[200px]">
            <Button
              onClick={onJoin}
              className="border-none w-full rounded-full h-12 text-md font-semibold bg-primary text-white transition-all"
            >
              {joinLabel}
            </Button>
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="border-none  w-full rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </motion.div>
    </StreamTheme>
  );
};

// --- MAIN LAYOUT ---

export const MyUILayout: React.FC = (): JSX.Element => {
  const { data: session } = useSession();
  const [id, setId] = useState<string | null>(null);
  const [notebookId, setNotebookId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const params = useParams();
  const isMobile = useStandalone();

  // NOVO ESTADO: Controla se estamos no processo de encerrar a chamada
  const [isEnding, setIsEnding] = useState(false);
  // Estado para menu mobile
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showPiPControls, setShowPiPControls] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sId = searchParams.get("student");
      if (sId) setId(sId);
      else if (session?.user.role === "student") {
        setId(session.user.id);
      }

      let nId = searchParams.get("notebookId");
      if (!nId && params?.notebookId) {
        nId = params.notebookId as string;
      }
      if (nId) setNotebookId(nId);
    }
  }, [params, searchParams, session]);

  const call = useCall();
  const { callData, setCallData } = useCallContext();

  const {
    useCallCallingState,
    useLocalParticipant,
    useRemoteParticipants,
    useMicrophoneState,
    useCameraState,
    useCallSettings,
    useIsCallTranscribingInProgress,
  } = useCallStateHooks();

  const callingState = useCallCallingState();
  const { status: micStatus, isSpeakingWhileMuted } = useMicrophoneState();
  const { status: camStatus } = useCameraState();
  const { transcription } = useCallSettings() || {};
  const isTranscribing = useIsCallTranscribingInProgress();

  const isMicEnabled = micStatus === "enabled";
  const isCamEnabled = camStatus === "enabled";

  // FAILSAFE: Força a transcrição se não estiver ativa
  useEffect(() => {
    if (
      callingState === CallingState.JOINED &&
      !isTranscribing &&
      call &&
      !isEnding
    ) {
      call.startTranscription().catch((err) => {
        console.log("Tentativa de auto-start da transcrição:", err);
      });
    }
  }, [callingState, isTranscribing, call, isEnding]);

  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const [isPiP, setIsPiP] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const isJoiningRef = useRef(false);

  // Chrome background throttling handling
  useEffect(() => {
    if (
      call &&
      callData?.callId &&
      hasJoined &&
      callingState === CallingState.IDLE &&
      !isJoiningRef.current &&
      !isEnding
    ) {
      console.log("Auto-rejoining call...");
      isJoiningRef.current = true;
      call
        .join()
        .catch(console.error)
        .finally(() => {
          isJoiningRef.current = false;
        });
    }

    const onVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        call &&
        callData?.callId &&
        hasJoined &&
        !isEnding
      ) {
        if (
          callingState !== CallingState.JOINED &&
          callingState !== CallingState.JOINING &&
          callingState !== CallingState.RECONNECTING &&
          !isJoiningRef.current
        ) {
          isJoiningRef.current = true;
          call
            .join()
            .catch(console.error)
            .finally(() => {
              isJoiningRef.current = false;
            });
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [call, callData?.callId, callingState, hasJoined, isEnding]);

  const resolveStudentId = () => {
    if (id) return id;
    if (callData?.callId && session?.user?.id) {
      const parts = String(callData.callId).split("-");
      return parts.find((p) => p !== session.user.id) || null;
    }
    return null;
  };

  const handleEndCall = async () => {
    if (call) {
      try {
        setIsEnding(true); // Ativa o estado de encerramento

        await call.endCall();
        const studentId = resolveStudentId();
        if (studentId) {
          await fetch("/api/calls/end", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId,
              notebookId: notebookId,
              callId: call.id || callData?.callId,
            }),
          });
        }
        setCallData(null);
        setHasJoined(false);
        showEndedCallToast();
      } catch (error) {
        console.error(error);
      } finally {
        setIsEnding(false);
      }
    }
  };

  const handleStudentLeaveCall = async () => {
    if (call) {
      try {
        setIsEnding(true); // Ativa o estado de encerramento
        await call.leave();
        setCallData(null);
        setHasJoined(false);
        if (session?.user?.id) {
          try {
            await updateDoc(doc(db, "users", session.user.id), {
              callId: null,
            });
          } catch (err) {}
        }
        showLeftCallToast();
      } catch (error) {
        console.error(error);
      } finally {
        setIsEnding(false);
      }
    }
  };

  const handleTeacherJoinCall = async () => {
    if (
      callingState === CallingState.JOINED ||
      callingState === CallingState.JOINING ||
      isJoiningRef.current
    )
      return;
    if (call) {
      try {
        isJoiningRef.current = true;
        setHasJoined(true);
        await call.join({
          data: {
            settings_override: {
              limits: { max_duration_seconds: 3600 },
              transcription: { mode: "auto-on" },
            },
            custom: {
              studentId: id,
              notebookId: notebookId,
            },
          },
        });
        if (call?.id) setCallData({ callId: call.id });
        if (id)
          await updateDoc(doc(db, "users", id), {
            callId: callData?.callId || call.id,
          });
        showJoinedCallToast();
      } catch (error) {
        console.error(error);
        setHasJoined(false);
      } finally {
        isJoiningRef.current = false;
      }
    }
  };

  const handleStudentJoinCall = async () => {
    if (
      callingState === CallingState.JOINED ||
      callingState === CallingState.JOINING ||
      isJoiningRef.current
    )
      return;
    if (call) {
      try {
        isJoiningRef.current = true;
        setHasJoined(true);
        await call.join({
          data: {
            settings_override: {
              limits: { max_duration_seconds: 3600 },
              transcription: { mode: "auto-on" },
            },
            custom: {
              studentId: id,
              notebookId: notebookId,
            },
          },
        });
        if (call?.id) setCallData({ callId: call.id });
        showJoinedCallToast();
      } catch (error) {
        console.error(error);
        setHasJoined(false);
      } finally {
        isJoiningRef.current = false;
      }
    }
  };

  const handleToggleAudio = async () => {
    try {
      await call?.microphone.toggle();
    } catch (e) {
      console.error(e);
    }
  };
  const handleToggleVideo = async () => {
    try {
      await call?.camera.toggle();
    } catch (e) {
      console.error(e);
    }
  };
  const togglePiP = () => {
    setIsPiP((prev) => !prev);
    setShowMobileMenu(false);
  };

  const TalkingWhileMutedToast = () => (
    <AnimatePresence>
      {isSpeakingWhileMuted && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/80 text-white px-4 py-2 rounded-full backdrop-blur border border-white/10 shadow-lg pointer-events-none whitespace-nowrap"
        >
          <MicOff className="text-yellow-400 animate-pulse" size={18} />
          <span className="text-xs font-semibold">
            Você está falando no mudo
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // --- BOTÕES DE AÇÃO DO USUÁRIO ---
  const LeaveButton = () => {
    if (session?.user.role === "student") {
      return (
        <ControlButton
          onClick={handleStudentLeaveCall}
          isEnabled={true}
          enabledIcon={LogOut}
          disabledIcon={LogOut}
          variant="destructive"
        />
      );
    }
    return (
      <ControlButton
        onClick={handleEndCall}
        isEnabled={true}
        enabledIcon={PhoneOff}
        disabledIcon={PhoneOff}
        variant="destructive"
      />
    );
  };

  // --- MENU DE OVERFLOW MOBILE ---
  const MobileOverflowMenu = () => (
    <AnimatePresence>
      {showMobileMenu && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute bottom-16 right-4 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col gap-3 min-w-[140px] z-50"
        >
          <div className="text-xs font-semibold text-muted-foreground px-2 uppercase tracking-wider">
            Opções
          </div>
          <button
            onClick={togglePiP}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full text-left"
          >
            <div className="bg-slate-200 dark:bg-slate-800 p-1.5 rounded-full">
              <Minimize2 size={16} />
            </div>
            <span className="text-sm font-medium">Minimizar</span>
          </button>

          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full text-left relative overflow-hidden">
            <div className="bg-slate-200 dark:bg-slate-800 p-1.5 rounded-full z-10">
              <ScreenShareButton />
            </div>
            <span className="text-sm font-medium">Compartilhar</span>
            {/* Hack para cobrir o botão original do stream sdk que pode ser pequeno */}
            <div className="absolute inset-0 z-0 opacity-0">
              <ScreenShareButton />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const callComponent = (
    <StreamTheme>
      <motion.div
        drag={!isMobile ? "x" : false} // Desativa drag horizontal no mobile para evitar conflito com swipe
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_event, info) => {
          if (info.offset.x > 100)
            callingState === CallingState.JOINED
              ? togglePiP()
              : setCallData(null);
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={getGlassContainerClasses(isMobile)}
      >
        {/* OVERLAY DE STATUS: CONECTANDO OU ENCERRANDO */}
        {(callingState !== CallingState.JOINED || isEnding) && (
          <div className="absolute inset-0 z-[100] bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm text-white rounded-3xl">
            <Loader2 className="animate-spin mb-2" size={32} />
            <span className="text-sm font-medium">
              {isEnding
                ? "Encerrando..."
                : callingState === CallingState.JOINING
                  ? "Entrando..."
                  : "Conectando..."}
            </span>
          </div>
        )}

        {/* Alça de drag apenas no desktop */}
        {!isMobile && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 h-12 w-1.5 bg-gray-300 dark:bg-gray-600 rounded-full opacity-40 cursor-grab active:cursor-grabbing" />
        )}

        <div className="flex flex-col h-full relative">
          <div className="flex-1 overflow-hidden p-2 rounded-t-3xl">
            <ParticipantsGrid
              remoteParticipants={remoteParticipants}
              localParticipant={localParticipant}
            />
          </div>

          <TalkingWhileMutedToast />

          {/* BARRA DE CONTROLES */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center z-50 pointer-events-none">
            <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-white/20 dark:border-white/10 flex items-center gap-2 pointer-events-auto max-w-full overflow-visible">
              {/* Controles Principais: Sempre visíveis */}
              <ControlButton
                onClick={handleToggleAudio}
                isEnabled={isMicEnabled}
                enabledIcon={Mic}
                disabledIcon={MicOff}
              />

              <ControlButton
                onClick={handleToggleVideo}
                isEnabled={isCamEnabled}
                enabledIcon={Camera}
                disabledIcon={CameraOff}
              />

              {/* Indicador de Transcrição */}
              {transcription?.mode !==
                TranscriptionSettingsRequestModeEnum.DISABLED && (
                <div
                  className={cn(
                    "h-10 flex items-center justify-center gap-2 px-3 rounded-full border transition-all select-none",
                    isTranscribing
                      ? "bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400"
                      : "bg-slate-100 dark:bg-slate-800 border-transparent text-muted-foreground",
                    isMobile && "hidden sm:flex", // Oculta no mobile se pouco espaço
                  )}
                >
                  {isTranscribing ? (
                    <>
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                      <span className="text-[10px] font-bold hidden sm:inline">
                        REC
                      </span>
                    </>
                  ) : (
                    <Loader2 className="animate-spin w-4 h-4 opacity-50" />
                  )}
                </div>
              )}

              {/* Divisor */}
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1" />

              {isMobile ? (
                // VERSÃO MOBILE: Menu "Mais"
                <>
                  <div className="relative">
                    <ControlButton
                      onClick={() => setShowMobileMenu(!showMobileMenu)}
                      isEnabled={true}
                      enabledIcon={showMobileMenu ? X : MoreVertical}
                      disabledIcon={MoreVertical}
                    />
                    <MobileOverflowMenu />
                  </div>
                  <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1" />
                  <LeaveButton />
                </>
              ) : (
                // VERSÃO DESKTOP: Tudo visível
                <>
                  <div className="rounded-full overflow-hidden hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    <ScreenShareButton />
                  </div>

                  <ControlButton
                    onClick={togglePiP}
                    isEnabled={true}
                    enabledIcon={Minimize2}
                    disabledIcon={Minimize2}
                  />

                  <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1" />
                  <LeaveButton />
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </StreamTheme>
  );

  const pipComponent = (
    <StreamTheme>
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-[9999]"
      >
        <motion.div
          drag
          dragMomentum={false}
          dragConstraints={constraintsRef}
          onClick={() => setShowPiPControls((prev) => !prev)}
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(
            "pointer-events-auto fixed shadow-2xl rounded-2xl overflow-hidden bg-black border border-white/10 flex flex-col",
            isMobile
              ? "top-4 right-4 h-[13vh] aspect-video" // Mobile: Topo direito, retrato/pequeno
              : "bottom-8 right-8 w-80 aspect-video", // Desktop: Embaixo, widescreen
          )}
        >
          <AnimatePresence>
            {showPiPControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-end p-2 pointer-events-none"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Impede que o clique esconda os controles
                    togglePiP();
                  }}
                  className="text-white hover:text-indigo-400 bg-black/50 rounded-full p-1 pointer-events-auto transition-colors"
                >
                  <Maximize2 size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isSpeakingWhileMuted && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-black/60 p-2 rounded-full animate-pulse border border-yellow-500/50">
                <MicOff className="text-yellow-500" size={24} />
              </div>
            )}
          </AnimatePresence>

          {/* Container do vídeo com object-cover para preencher sem barras pretas excessivas */}
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 [&_video]:object-cover [&_video]:w-full [&_video]:h-full">
              <ParticipantsGridPiP
                remoteParticipants={remoteParticipants}
                // ALTERAÇÃO AQUI:
                // Lógica: Se houver alguém remoto, passa 'undefined' para o local (escondendo você).
                // Se você estiver sozinho, mostra sua câmera para não ficar uma tela preta vazia.
                localParticipant={
                  remoteParticipants.length > 0 ? undefined : localParticipant
                }
              />
            </div>
          </div>

          {/* Controles simplificados no PiP */}
          <AnimatePresence>
            {showPiPControls && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                // Adicionado 'absolute bottom-0' e 'onClick stopPropagation'
                className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur border-t border-white/10 p-2 flex justify-center items-center gap-2 z-30"
                onClick={(e) => e.stopPropagation()} // Impede que cliques na barra fechem ela mesma
              >
                <button
                  onClick={handleToggleAudio}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    isMicEnabled
                      ? "bg-slate-800 text-white hover:bg-slate-700"
                      : "bg-red-500 text-white hover:bg-red-600",
                  )}
                >
                  {isMicEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                </button>

                <button
                  onClick={handleToggleVideo}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    isCamEnabled
                      ? "bg-slate-800 text-white hover:bg-slate-700"
                      : "bg-red-500 text-white hover:bg-red-600",
                  )}
                >
                  {isCamEnabled ? (
                    <Camera size={14} />
                  ) : (
                    <CameraOff size={14} />
                  )}
                </button>

                <button
                  onClick={
                    session?.user.role === "teacher"
                      ? handleEndCall
                      : handleStudentLeaveCall
                  }
                  className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  {session?.user.role === "teacher" ? (
                    <PhoneOff size={14} />
                  ) : (
                    <LogOut size={14} />
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </StreamTheme>
  );

  if (!call?.id) return <>Sem chamada ativa</>;

  const showCall =
    hasJoined ||
    callingState === CallingState.JOINED ||
    callingState === CallingState.JOINING ||
    callingState === CallingState.RECONNECTING ||
    isEnding;

  return (
    <>
      <AnimatePresence mode="wait">
        {!showCall ? (
          <JoinUI
            key="join-ui"
            role={session?.user.role === "teacher" ? "teacher" : "student"}
            onJoin={
              session?.user.role === "teacher"
                ? handleTeacherJoinCall
                : handleStudentJoinCall
            }
            joinLabel={
              session?.user.role === "teacher"
                ? "Iniciar Aula"
                : "Entrar na Sala"
            }
            notebookId={notebookId}
            callData={callData}
          />
        ) : isPiP ? (
          pipComponent
        ) : (
          callComponent
        )}
      </AnimatePresence>
    </>
  );
};
