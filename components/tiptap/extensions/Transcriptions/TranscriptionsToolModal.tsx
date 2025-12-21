import React, { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Transcription } from "@/types/notebooks/notebooks";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Loader2, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  Clock
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TranscriptionsToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
  studentID?: string;
  notebookId?: string;
}

export function TranscriptionsToolModal({
  isOpen,
  onClose,
  studentID,
  notebookId,
}: TranscriptionsToolModalProps) {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && studentID && notebookId) {
      fetchTranscriptions(false);
    }
  }, [isOpen, studentID, notebookId]);

  const fetchTranscriptions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const docRef = doc(db, `users/${studentID}/Notebooks/${notebookId}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.transcriptions && Array.isArray(data.transcriptions)) {
          const sorted = [...data.transcriptions].sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
          });
          setTranscriptions(sorted);
        } else {
            setTranscriptions([]);
        }
      }
    } catch (error) {
      console.error("Error fetching transcriptions:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCheckTranscription = async (callId: string, transcriptionId?: string) => {
    if (!callId) return;
    setProcessingId(callId);
    try {
        const res = await fetch('/api/transcriptions/manage', {
            method: 'POST',
            body: JSON.stringify({ action: 'check', callId, studentId: studentID, notebookId, transcriptionId })
        });
        const data = await res.json();
        
        if (data.status === 'available') {
            await fetchTranscriptions(true); 
        }
    } catch (e) {
        console.error("Error checking transcription:", e);
    } finally {
        setProcessingId(null);
    }
  };

  const handleGenerateSummary = async (callId: string, text: string, transcriptionId?: string) => {
      if (!callId) return;
      setProcessingId(callId);
      try {
          const res = await fetch('/api/transcriptions/manage', {
              method: 'POST',
              body: JSON.stringify({ action: 'summarize', callId, studentId: studentID, notebookId, text, transcriptionId })
          });
          const data = await res.json();
          if (data.summary) {
              await fetchTranscriptions(true);
          }
      } catch (e) {
          console.error("Error generating summary:", e);
      } finally {
          setProcessingId(null);
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full h-full sm:h-[85vh] sm:max-w-2xl p-0 gap-0 overflow-hidden bg-background flex flex-col rounded-xl border-border/50 shadow-2xl">
        
        <DialogHeader className="px-6 py-4 border-b bg-muted/10 shrink-0">
          <DialogTitle className="text-xl font-semibold tracking-tight">Histórico de Aulas</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Transcrições e resumos gerados por IA.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          {loading && transcriptions.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 gap-3 text-muted-foreground animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Carregando histórico...</p>
            </div>
          ) : transcriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Nenhuma gravação encontrada neste caderno.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {transcriptions.map((item, index) => {
                const date = item.date?.toDate ? item.date.toDate() : new Date(item.date);
                const isPending = !item.content || item.status === 'pending';
                const isProcessing = processingId === item.callId;
                const hasSummary = !!item.summary;

                return (
                  <div 
                    key={index} 
                    className={cn(
                        "group flex flex-col p-5 border-b last:border-0 hover:bg-muted/5 transition-colors duration-200",
                        isProcessing && "opacity-80 pointer-events-none"
                    )}
                  >
                    {/* Linha de Cabeçalho do Item */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground text-base capitalize">
                                {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{format(date, "HH:mm", { locale: ptBR })}</span>
                            </div>
                        </div>

                        {/* Status Minimalista */}
                        <div className="flex items-center gap-2">
                             {isPending ? (
                                <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 px-2 py-1 rounded-full text-[10px] font-medium border border-amber-500/20">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Pendente</span>
                                </div>
                             ) : (
                                <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full text-[10px] font-medium border border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Pronto</span>
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Conteúdo Principal */}
                    <div className="space-y-3">
                      {isPending ? (
                         <div className="bg-muted/30 rounded-lg p-4 flex flex-col items-center justify-center gap-3 text-center border border-dashed border-muted-foreground/20">
                             <span className="text-xs text-muted-foreground">Processamento de áudio em andamento ou pendente.</span>
                             <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs gap-2 rounded-full w-full sm:w-auto"
                                onClick={() => item.callId && handleCheckTranscription(item.callId, item.id)}
                                disabled={isProcessing}
                            >
                                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                {isProcessing ? "Verificando..." : "Verificar Disponibilidade"}
                            </Button>
                         </div>
                      ) : (
                        <>
                            {/* AÇÃO DE GERAR RESUMO (SE NÃO TIVER) */}
                            {!hasSummary && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20 p-3 rounded-lg border border-transparent">
                                    <span className="text-xs text-muted-foreground">Resumo IA não gerado.</span>
                                    <Button 
                                        size="sm" 
                                        variant="secondary"
                                        className="h-7 text-xs gap-2 rounded-full w-full sm:w-auto shadow-sm bg-white dark:bg-secondary hover:bg-slate-50"
                                        onClick={() => item.callId && handleGenerateSummary(item.callId, item.content, item.id)}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
                                        Gerar Resumo
                                    </Button>
                                </div>
                            )}

                            {/* ACCORDION GROUP: RESUMO + TRANSCRIÇÃO */}
                            <Accordion type="multiple" className="w-full">
                                
                                {/* 1. RESUMO (APARECE SÓ SE TIVER) */}
                                {hasSummary && (
                                    <AccordionItem value="summary" className="border-b border-border/40">
                                        <AccordionTrigger className="py-2 text-sm hover:no-underline hover:bg-muted/30 px-2 rounded-md transition-colors group/summary">
                                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
                                                <Sparkles className="w-4 h-4" />
                                                <span>Ver Resumo da Aula</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-2 pt-2 pb-3">
                                            <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground bg-indigo-50/50 dark:bg-indigo-950/10 p-3 rounded-md border border-indigo-100 dark:border-indigo-900/20">
                                                {item.summary}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                )}

                                {/* 2. TRANSCRIÇÃO (SEMPRE DISPONÍVEL SE NÃO ESTIVER PENDENTE) */}
                                <AccordionItem value="transcript" className="border-none">
                                    <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:text-foreground hover:no-underline justify-start gap-1 group/transcript px-2 rounded-md hover:bg-muted/30">
                                       <div className="flex items-center gap-2 w-full">
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>Ver transcrição original</span>
                                       </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-2 pb-2">
                                        <div className="mt-1 p-3 bg-muted/40 rounded-md border text-xs text-muted-foreground font-mono leading-relaxed max-h-60 overflow-y-auto select-text">
                                            {item.content}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                            </Accordion>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}