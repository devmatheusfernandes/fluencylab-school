"use client";

import { useState } from "react";
import { Lesson } from "@/types/learning/lesson";
import {
  analyzeLessonContent,
  processLessonBatch,
} from "@/actions/lessonProcessing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Database,
  BrainCircuit,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface StepProcessingProps {
  lesson: Lesson;
  onComplete: () => void;
}

export function StepProcessing({ lesson, onComplete }: StepProcessingProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const vocabQueueCount = lesson.learningItensQueue?.length || 0;
  const structQueueCount = lesson.learningStructuresQueue?.length || 0;
  const totalQueue = vocabQueueCount + structQueueCount;

  // Status check
  const isExtractionDone =
    totalQueue > 0 || lesson.relatedLearningItemIds?.length > 0;
  const isQueueEmpty = totalQueue === 0;

  // If we have extracted items but queue is empty, it means they are processed.
  // Or if we haven't extracted yet.
  // We can use the 'status' field or just the queue counts.

  const handleExtract = async () => {
    try {
      setIsExtracting(true);
      // Clean content for analysis (remove HTML tags if needed, but the action handles it?
      // Actually analyzeLessonContent takes contentText.
      const contentText = lesson.content.replace(/<[^>]*>?/gm, "");

      const result = await analyzeLessonContent(lesson.id, contentText);

      if (result.success) {
        toast.success(
          `Extração concluída: ${result.vocabCount} itens, ${result.structCount} estruturas.`,
        );
        router.refresh();
      } else {
        toast.error("Erro na extração: " + result.error);
      }
    } catch (error) {
      toast.error("Erro desconhecido na extração.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleProcessBatch = async () => {
    try {
      setIsProcessing(true);
      // Process until done? The action processes one batch.
      // We might need a loop here or let the user click multiple times.
      // The user prompt says "o usuário vai precisar fazer o processamento para ir salvando".
      // Let's call it once and see if it returns 'completed'.

      let completed = false;
      let safetyCounter = 0;

      // Loop for convenience, but show progress
      while (!completed && safetyCounter < 20) {
        const result = await processLessonBatch(lesson.id);
        if (result.completed) {
          completed = true;
          toast.success("Processamento finalizado!");
        } else {
          // Toast partial progress?
          // toast.info(`Processados ${result.processed} itens...`);
        }
        safetyCounter++;
      }

      if (completed) {
        onComplete(); // Auto advance or let user click? Let's refresh first.
        router.refresh();
      } else {
        toast.warning(
          "Lote processado. Clique novamente para continuar se houver mais itens.",
        );
        router.refresh();
      }
    } catch (error) {
      toast.error("Erro no processamento em lote.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Processamento de Conteúdo</h2>
        {isQueueEmpty && isExtractionDone && (
          <Button onClick={onComplete} className="gap-2">
            Continuar <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Extraction Card */}
        <Card
          className={isExtractionDone ? "border-green-200 bg-green-50/30" : ""}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5" />
              1. Extração (IA)
            </CardTitle>
            <CardDescription>
              O Gemini irá ler sua aula e identificar vocabulário e estruturas
              gramaticais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Itens na Fila:</span>
                <span className="font-bold">{totalQueue}</span>
              </div>

              <Button
                onClick={handleExtract}
                disabled={isExtracting || totalQueue > 0} // Disable if queue has items (must process first)
                className="w-full"
                variant={totalQueue > 0 ? "outline" : "glass"}
              >
                {isExtracting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : totalQueue > 0 ? (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                ) : (
                  <BrainCircuit className="w-4 h-4 mr-2" />
                )}
                {totalQueue > 0 ? "Extração Realizada" : "Iniciar Extração"}
              </Button>
              {totalQueue > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Processe a fila para extrair mais (se necessário).
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Processing Card */}
        <Card
          className={
            totalQueue === 0 && isExtractionDone
              ? "border-green-200 bg-green-50/30"
              : ""
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              2. Salvamento (Batch)
            </CardTitle>
            <CardDescription>
              Salva os itens extraídos no banco de dados e cria as relações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Progresso da Fila</span>
                  <span>{totalQueue} restantes</span>
                </div>
                <Progress value={totalQueue === 0 ? 100 : 10} />
                {/* Progress bar is tricky without total initial count, visual approximation */}
              </div>

              <Button
                onClick={handleProcessBatch}
                disabled={isProcessing || totalQueue === 0}
                className="w-full"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                Processar Fila
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
