'use client';
import React, { useEffect, useState, useRef, JSX } from 'react';
import {
  CallingState,
  StreamTheme,
  useCallStateHooks,
  ScreenShareButton,
  Avatar,
} from "@stream-io/video-react-sdk";
import { useCall } from '@stream-io/video-react-bindings';
import { Button } from '@/components/ui/button';
import { useCallContext } from '@/context/CallContext';
import { useSession } from 'next-auth/react';
import { useSearchParams, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { ParticipantsGrid } from './ParticipantsGrid';
import { ParticipantsGridPiP } from './ParticipantsGridPiP';
import { toast } from 'sonner';
import { db } from '@/lib/firebase/config';
import { 
  Camera, 
  CameraOff, 
  LogOut, 
  Mic, 
  MicOff, 
  Minimize2, 
  Maximize2, 
  PhoneOff, 
  Sparkles,
  FileText,
  Loader2,
  Disc
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

// --- ESTILOS COMPARTILHADOS ---
const glassContainerClasses = `
  fixed top-4 right-4 bottom-4 w-full max-w-sm z-[9999]
  rounded-3xl overflow-hidden flex flex-col
  bg-white/80 dark:bg-black/60
  backdrop-blur-xl saturate-150
  border border-white/20 dark:border-white/10
  text-slate-800 dark:text-slate-100
  shadow-2xl shadow-black/10
  transition-all duration-300
`;

const controlButtonClasses = `
  p-3 rounded-full transition-all duration-200 ease-in-out
  flex items-center justify-center
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
  border: "1px solid rgba(255,255,255,0.1)"
};

export const showCanceledCallToast = () => toast("Chamada Cancelada", { position: "bottom-center", style: { ...toastStyleBase, background: "#EAB308" } });
export const showJoinedCallToast = () => toast("Sala Criada!", { position: "bottom-center", style: { ...toastStyleBase, background: "#22C55E" } });
export const showLeftCallToast = () => toast("Você saiu da chamada", { position: "bottom-center", style: { ...toastStyleBase, background: "#6366F1" } });
export const showEndedCallToast = () => toast("Chamada Encerrada", { position: "bottom-center", style: { ...toastStyleBase, background: "#EF4444" } });

// --- COMPONENTE DE BOTÃO ---
const ControlButton = ({ 
  onClick, 
  isEnabled = true, 
  enabledIcon: EnabledIcon, 
  disabledIcon: DisabledIcon, 
  variant = "default" 
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
            : "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 shadow-md shadow-red-500/20"
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

export const JoinUI: React.FC<JoinUIProps> = ({ role, onJoin, joinLabel, notebookId, callData }) => {
    const { useCallSession } = useCallStateHooks();
    const sessionCall = useCallSession();
    const call = useCall();
    const { setCallData } = useCallContext();
    const { data: session } = useSession();

    const uniqueParticipants = sessionCall?.participants.filter(
      (participant, index, self) =>
        index === self.findIndex(p => p.user.id === participant.user.id)
    ) || [];

    const handleCancel = async () => {
       try { await call?.endCall(); } catch (error) {} 
       finally {
          try {
            const parts = String(call?.id || '').split('-');
            const other = parts.find((p) => p !== session?.user?.id);
            if (other) {
              await fetch('/api/calls/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  studentId: other,
                  notebookId: notebookId,
                  callId: call?.id || callData?.callId
                })
              });
            }
          } catch {}
          setCallData(null);
          showCanceledCallToast();
       }
    }

    return (
    <StreamTheme>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(event, info) => { if (info.offset.x > 100) handleCancel(); }}
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={glassContainerClasses}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-16 w-1 bg-slate-300 dark:bg-slate-700 rounded-full opacity-50" />
        <div className="flex flex-col items-center justify-center h-full p-6 space-y-8 relative">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              {role === "teacher" ? "Sala de Aula" : "Pronto?"}
            </h2>
            <p className="text-sm text-muted-foreground">
               {role === "teacher" ? "Prepare-se para ensinar" : `Olá, ${session?.user.name?.split(' ')[0]}`}
            </p>
          </div>
          <div className="flex -space-x-4 items-center justify-center py-4">
             {uniqueParticipants.length > 0 ? uniqueParticipants.map((p) => (
               <div key={p.user.id} className="relative z-10 border-4 border-white dark:border-slate-900 rounded-full shadow-lg">
                 <Avatar name={p.user.name} imageSrc={p.user.image} style={{ width: 64, height: 64, borderRadius: '100%' }} />
               </div>
             )) : (
               <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center animate-pulse">
                 <span className="text-2xl">👋</span>
               </div>
             )}
          </div>
          <div className="flex flex-col gap-3 w-full max-w-[200px]">
            <Button onClick={onJoin} className="w-full rounded-full h-12 text-md font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-500/20">{joinLabel}</Button>
            <Button variant="ghost" onClick={handleCancel} className="w-full rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">Cancelar</Button>
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Get student ID from searchParams or window
      const sId = searchParams.get("student");
      if (sId) setId(sId);
      else if (session?.user.role === 'student') {
        setId(session.user.id);
      }

      // Get notebook ID
      let nId = searchParams.get("notebookId");
      if (!nId && params?.notebookId) {
        nId = params.notebookId as string;
      }
      if (nId) setNotebookId(nId);
    }
  }, [params, searchParams, session]);
  
  const call = useCall();
  const { callData, setCallData } = useCallContext();
  
  // 1. Extrair os Hooks do `useCallStateHooks`
  const {
    useCallCallingState,
    useLocalParticipant,
    useRemoteParticipants,
    useMicrophoneState,
    useCameraState,
    useIsCallRecordingInProgress
  } = useCallStateHooks();

  // 2. Chamar os hooks para pegar o estado real
  const { status: micStatus, isSpeakingWhileMuted } = useMicrophoneState();
  const { status: camStatus } = useCameraState();
  const isRecordingInProgress = useIsCallRecordingInProgress();
  
  // 3. Transformando status em booleans
  const isMicEnabled = micStatus === 'enabled';
  const isCamEnabled = camStatus === 'enabled';

  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);


  const handleToggleRecording = async () => {
    if (!call) return;
    try {
      if (isRecordingInProgress) {
        await call.stopRecording();
        try { await call.stopTranscription(); } catch (e) {}
        toast.success("Gravação parada");
      } else {
        await call.startRecording();
          try {
            await call.startTranscription({ language: 'pt' });
          } catch (e) {
            console.log("Transcrição automática pode já estar ativa ou falhou:", e);
          }
        toast.success("Gravação iniciada");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao alterar gravação");
    }
  };

  const handleGenerateSummary = async () => {
    if (!callData?.callId) return;
    setIsSummaryOpen(true);
    if (summary) return;

    setIsGeneratingSummary(true);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        body: JSON.stringify({ 
          callId: callData.callId,
          studentId: id,
          notebookId: notebookId
        })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        setSummary("Não foi possível gerar o resumo. Verifique se a gravação e transcrição estavam ativas.");
      } else {
        setSummary(data.summary);
      }
    } catch (e) {
      toast.error("Erro ao gerar resumo");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const callingState = useCallCallingState();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  
  const [isPiP, setIsPiP] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [hasJoined, setHasJoined] = useState(false); // New local state to track intent
  const isJoiningRef = useRef(false);

  // Chrome background throttling handling
  useEffect(() => {
    // Se temos dados da chamada e o usuário JÁ ENTROU (hasJoined), mas estamos IDLE, tentar reconectar
    if (call && callData?.callId && hasJoined && callingState === CallingState.IDLE && !isJoiningRef.current) {
      console.log("Auto-rejoining call...");
      isJoiningRef.current = true;
      call.join()
        .catch(console.error)
        .finally(() => { isJoiningRef.current = false; });
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && call && callData?.callId && hasJoined) {
        // Se voltamos e não estamos conectados, tentar reconectar
        if (callingState !== CallingState.JOINED && callingState !== CallingState.JOINING && callingState !== CallingState.RECONNECTING && !isJoiningRef.current) {
           isJoiningRef.current = true;
           call.join()
             .catch(console.error)
             .finally(() => { isJoiningRef.current = false; });
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [call, callData?.callId, callingState, hasJoined]);

  const resolveStudentId = () => {
    if (id) return id;
    if (callData?.callId && session?.user?.id) {
      const parts = String(callData.callId).split('-');
      return parts.find((p) => p !== session.user.id) || null;
    }
    return null;
  };

  const handleEndCall = async () => {
    if (call) {
      try {
        toast.info("Encerrando chamada e gerando resumo...");
        await call.endCall();
        const studentId = resolveStudentId();
        if (studentId) {
          await fetch('/api/calls/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              studentId,
              notebookId: notebookId,
              callId: call.id || callData?.callId
            })
          });
        }
        setCallData(null);
        setHasJoined(false);
        showEndedCallToast();
      } catch (error) { console.error(error); }
    }
  };

  const handleStudentLeaveCall = async () => {
    if (call) {
      try {
        await call.leave();
        setCallData(null);
        setHasJoined(false);
        if (session?.user?.id) {
          try { await updateDoc(doc(db, "users", session.user.id), { callId: null }); } catch (err) {}
        }
        showLeftCallToast();
      } catch (error) { console.error(error); }
    }
  };

  const handleTeacherJoinCall = async () => {
    if (callingState === CallingState.JOINED || callingState === CallingState.JOINING || isJoiningRef.current) return;
    if (call) {
      try {
        isJoiningRef.current = true;
        setHasJoined(true);
        await call.join({ 
          data: { 
            settings_override: { 
              limits: { max_duration_seconds: 3600 },
              transcription: { mode: 'auto-on' }
            },
            custom: {
                studentId: id,
                notebookId: notebookId
            }
          } 
        });
        if (call?.id) setCallData({ callId: call.id });
        if (id) await updateDoc(doc(db, "users", id), { callId: callData?.callId || call.id });
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
    if (callingState === CallingState.JOINED || callingState === CallingState.JOINING || isJoiningRef.current) return;
    if (call) {
      try { 
        isJoiningRef.current = true;
        setHasJoined(true);
        await call.join({ 
          data: { 
            settings_override: { 
              limits: { max_duration_seconds: 3600 },
              transcription: { mode: 'auto-on' }
            },
            custom: {
                studentId: id,
                notebookId: notebookId
            }
          } 
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

  const handleToggleAudio = async () => { try { await call?.microphone.toggle(); } catch (e) { console.error(e) }};
  const handleToggleVideo = async () => { try { await call?.camera.toggle(); } catch (e) { console.error(e) }};
  const togglePiP = () => setIsPiP((prev) => !prev);

  // --- COMPONENTE DO AVISO DE FALA NO MUDO ---
  const TalkingWhileMutedToast = () => (
    <AnimatePresence>
      {isSpeakingWhileMuted && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/80 text-white px-4 py-2 rounded-full backdrop-blur border border-white/10 shadow-lg pointer-events-none whitespace-nowrap"
        >
          <MicOff className="text-yellow-400 animate-pulse" size={18} />
          <span className="text-xs font-semibold">Você está falando no mudo</span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const callComponent = (
    <StreamTheme>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_event, info) => {
          if (info.offset.x > 100) callingState === CallingState.JOINED ? togglePiP() : setCallData(null);
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={glassContainerClasses}
      >
        {callingState !== CallingState.JOINED && (
           <div className="absolute inset-0 z-[100] bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm text-white rounded-3xl">
              <Loader2 className="animate-spin mb-2" size={32} />
              <span className="text-sm font-medium">
                {callingState === CallingState.JOINING ? "Entrando..." : "Conectando..."}
              </span>
           </div>
        )}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-12 w-1.5 bg-gray-300 dark:bg-gray-600 rounded-full opacity-40 cursor-grab active:cursor-grabbing" />
        <div className="flex flex-col h-full relative">
          
          <div className="flex-1 overflow-hidden p-2 rounded-t-3xl">
             <ParticipantsGrid remoteParticipants={remoteParticipants} localParticipant={localParticipant} />
          </div>
          
          <TalkingWhileMutedToast />

          <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center z-50 pointer-events-none">
             <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-white/20 dark:border-white/10 flex items-center gap-2 pointer-events-auto">
                
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

                <div className="rounded-full overflow-hidden hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                  <ScreenShareButton />
                </div>

                <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1" />

                <ControlButton 
                  onClick={togglePiP} 
                  isEnabled={true} 
                  enabledIcon={Minimize2} 
                  disabledIcon={Minimize2} 
                />

                {session?.user.role === "student" ? (
                  <ControlButton 
                    onClick={handleStudentLeaveCall} 
                    isEnabled={true} 
                    enabledIcon={LogOut} 
                    disabledIcon={LogOut}
                    variant="destructive"
                  />
                ) : (
                   <ControlButton 
                    onClick={handleEndCall} 
                    isEnabled={true} 
                    enabledIcon={PhoneOff} 
                    disabledIcon={PhoneOff}
                    variant="destructive"
                  />
                )}
             </div>
          </div>
        </div>
      </motion.div>
    </StreamTheme>
  );

  const pipComponent = (
    <StreamTheme>
        <div ref={constraintsRef} className='fixed inset-0 pointer-events-none z-[9999]'>
          <motion.div
            drag
            dragMomentum={false}
            dragConstraints={constraintsRef}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="pointer-events-auto fixed bottom-8 right-8 w-64 shadow-2xl rounded-2xl overflow-hidden bg-black border border-white/10"
          >
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-end p-2 opacity-0 hover:opacity-100 transition-opacity">
               <button onClick={togglePiP} className="text-white hover:text-indigo-400">
                  <Maximize2 size={16} />
               </button>
            </div>
            
            <AnimatePresence>
                {isSpeakingWhileMuted && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-black/60 p-2 rounded-full animate-pulse border border-yellow-500/50">
                        <MicOff className="text-yellow-500" size={24}/>
                    </div>
                )}
            </AnimatePresence>

            <div className="aspect-video bg-slate-900">
               <ParticipantsGridPiP remoteParticipants={remoteParticipants} localParticipant={localParticipant} />
            </div>

            <div className="bg-slate-900/90 backdrop-blur border-t border-white/10 p-3 flex justify-around items-center gap-2">
                <button 
                  onClick={handleToggleAudio} 
                  className={cn("p-2 rounded-full transition-colors", isMicEnabled ? "bg-slate-800 text-white" : "bg-red-500 text-white")}
                >
                  {isMicEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                </button>

                <button 
                  onClick={handleToggleVideo} 
                  className={cn("p-2 rounded-full transition-colors", isCamEnabled ? "bg-slate-800 text-white" : "bg-red-500 text-white")}
                >
                  {isCamEnabled ? <Camera size={16} /> : <CameraOff size={16} />}
                </button>

                {session?.user.role === "teacher" ? (
                   <button onClick={handleEndCall} className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700">
                      <PhoneOff size={16} />
                   </button>
                ) : (
                  <button onClick={handleStudentLeaveCall} className="p-2 rounded-full bg-slate-800 text-red-400 hover:bg-slate-700">
                      <LogOut size={16} />
                   </button>
                )}
            </div>
          </motion.div>
        </div>
    </StreamTheme>
  );

  if (!call?.id) return <>Sem chamada ativa</>;

  const showCall = hasJoined || callingState === CallingState.JOINED || callingState === CallingState.JOINING || callingState === CallingState.RECONNECTING;

  return (
    <>
      <AnimatePresence mode="wait">
        {!showCall ? (
          <JoinUI
              key="join-ui"
              role={session?.user.role === "teacher" ? "teacher" : "student"}
              onJoin={session?.user.role === "teacher" ? handleTeacherJoinCall : handleStudentJoinCall}
              joinLabel={session?.user.role === "teacher" ? "Iniciar Aula" : "Entrar na Sala"}
              notebookId={notebookId}
              callData={callData}
          />
        ) : isPiP ? (
          pipComponent
        ) : (
          callComponent
        )}
      </AnimatePresence>

      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="text-indigo-500" />
              Resumo da Reunião
            </DialogTitle>
            <DialogDescription>
              Resumo gerado por IA com base na transcrição da chamada.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {isGeneratingSummary ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Gerando resumo...</p>
              </div>
            ) : summary ? (
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{summary}</div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Nenhum resumo disponível.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};