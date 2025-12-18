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
import { Loader2, FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
}

export function TranscriptionsToolModal({
  isOpen,
  onClose,
  studentID,
  notebookId,
}: TranscriptionsToolModalProps) {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(false);

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
          {loading ? (
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
                return (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(date, "d 'de' MMMM 'de' yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      {item.summary && (
                         <div className="font-medium text-lg">Resumo da Aula</div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {item.summary && (
                        <div className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed">
                          {item.summary}
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
