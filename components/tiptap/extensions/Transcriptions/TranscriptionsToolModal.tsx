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
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, FileText, Calendar, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TranscriptionsToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
  studentID?: string;
  notebookId?: string;
}

interface Transcription {
  date: any;
  content: string;
  summary?: string;
  callId?: string;
  status?: 'pending' | 'available' | 'failed';
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
      fetchTranscriptions();
    }
  }, [isOpen, studentID, notebookId]);

  const fetchTranscriptions = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, `users/${studentID}/Notebooks/${notebookId}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.transcriptions && Array.isArray(data.transcriptions)) {
          // Sort by date descending
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
      setLoading(false);
    }
  };

  const handleCheckTranscription = async (callId: string) => {
    if (!callId) return;
    setProcessingId(callId);
    try {
        const res = await fetch('/api/transcriptions/manage', {
            method: 'POST',
            body: JSON.stringify({ action: 'check', callId, studentId: studentID, notebookId })
        });
        const data = await res.json();
        if (data.status === 'available') {
            await fetchTranscriptions();
        } else {
            // Optional: Show toast "Ainda não disponível"
        }
    } catch (e) {
        console.error("Error checking transcription:", e);
    } finally {
        setProcessingId(null);
    }
  };

  const handleGenerateSummary = async (callId: string, text: string) => {
      if (!callId) return;
      setProcessingId(callId);
      try {
          const res = await fetch('/api/transcriptions/manage', {
              method: 'POST',
              body: JSON.stringify({ action: 'summarize', callId, studentId: studentID, notebookId, text })
          });
          const data = await res.json();
          if (data.summary) {
              await fetchTranscriptions();
          }
      } catch (e) {
          console.error("Error generating summary:", e);
      } finally {
          setProcessingId(null);
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Transcrições e Resumos</DialogTitle>
          <DialogDescription>
            Histórico de aulas gravadas e seus resumos gerados por IA.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {loading && transcriptions.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : transcriptions.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              Nenhuma transcrição encontrada neste caderno.
            </div>
          ) : (
            <div className="space-y-4">
              {transcriptions.map((item, index) => {
                const date = item.date?.toDate ? item.date.toDate() : new Date(item.date);
                const isPending = !item.content || item.status === 'pending';
                const isProcessing = processingId === item.callId;
                const hasSummary = !!item.summary;

                return (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="pb-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(date, "d 'de' MMMM 'de' yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                          
                          {isPending ? (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                  Transcrição não disponível
                              </Badge>
                          ) : (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Transcrição disponível
                              </Badge>
                          )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      {isPending ? (
                          <div className="flex flex-col items-center justify-center p-4 gap-3 text-center">
                              <p className="text-sm text-muted-foreground">
                                  A transcrição ainda não foi processada ou a aula acabou de terminar.
                              </p>
                              <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => item.callId && handleCheckTranscription(item.callId)}
                                  disabled={isProcessing}
                              >
                                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                  Verificar Disponibilidade
                              </Button>
                          </div>
                      ) : (
                          <>
                              {hasSummary ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-medium text-lg text-primary">
                                        <Sparkles className="w-5 h-5" />
                                        Resumo da Aula
                                    </div>
                                    <div className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                                      {item.summary}
                                    </div>
                                </div>
                              ) : (
                                  <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg">
                                      <div className="text-sm text-muted-foreground">
                                          O resumo desta aula ainda não foi gerado.
                                      </div>
                                      <Button 
                                          size="sm" 
                                          onClick={() => item.callId && handleGenerateSummary(item.callId, item.content)}
                                          disabled={isProcessing}
                                      >
                                          {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                          Gerar Resumo com IA
                                      </Button>
                                  </div>
                              )}
                              
                              <Accordion type="single" collapsible>
                                <AccordionItem value="transcript" className="border-none">
                                  <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:no-underline">
                                     <div className="flex items-center gap-2">
                                       <FileText className="w-4 h-4" />
                                       Ver transcrição completa
                                     </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                     <div className="text-xs text-muted-foreground whitespace-pre-wrap mt-2 p-3 bg-muted/30 border rounded-md max-h-60 overflow-y-auto font-mono">
                                       {item.content}
                                     </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                          </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
