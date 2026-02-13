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
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Database,
  BrainCircuit,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

  const handleExtract = async () => {
    try {
      setIsExtracting(true);
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
      let completed = false;
      let safetyCounter = 0;

      while (!completed && safetyCounter < 20) {
        const result = await processLessonBatch(lesson.id);
        if (result.completed) {
          completed = true;
          toast.success("Processamento finalizado!");
        }
        safetyCounter++;
      }

      if (completed) {
        router.refresh();
      } else {
        toast.warning("Lote processado. Clique novamente para continuar.");
        router.refresh();
      }
    } catch (error) {
      toast.error("Erro no processamento em lote.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Processamento de Conteúdo
          </h2>
          <p className="text-muted-foreground">
            Transforme o texto bruto em itens de aprendizado estruturados.
          </p>
        </div>
        {isQueueEmpty && isExtractionDone && (
          <Button onClick={onComplete} className="gap-2 shadow-sm" size="lg">
            Continuar para Componentes <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative">
        {/* Connector Icon for Desktop */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-background p-2 rounded-full border shadow-sm text-muted-foreground">
          <ArrowRight className="w-4 h-4" />
        </div>

        {/* 1. Extraction Card */}
        <Card
          className={cn(
            "relative overflow-hidden transition-all duration-300 border-2",
            isExtractionDone
              ? "border-primary/20 bg-primary/5"
              : "border-muted",
          )}
        >
          {isExtractionDone && (
            <div className="absolute top-0 right-0 p-3">
              <Badge
                variant="outline"
                className="bg-background text-primary border-primary gap-1"
              >
                <CheckCircle2 className="w-3 h-3" /> Concluído
              </Badge>
            </div>
          )}

          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl">1. Extração Inteligente</CardTitle>
            <CardDescription className="text-base">
              O Gemini lerá sua aula para identificar e isolar vocabulário e
              estruturas gramaticais relevantes.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-card rounded-lg border p-4 flex items-center justify-between shadow-sm">
              <span className="text-sm font-medium text-muted-foreground">
                Itens na Fila de Processamento
              </span>
              <span className="text-2xl font-bold">{totalQueue}</span>
            </div>

            <Button
              onClick={handleExtract}
              disabled={isExtracting || totalQueue > 0}
              className="w-full h-12 text-base"
              variant={totalQueue > 0 ? "outline" : "glass"}
            >
              {isExtracting ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : totalQueue > 0 ? (
                <CheckCircle2 className="w-5 h-5 mr-2" />
              ) : (
                <BrainCircuit className="w-5 h-5 mr-2" />
              )}
              {totalQueue > 0
                ? "Extração Realizada"
                : "Iniciar Extração com IA"}
            </Button>

            {totalQueue > 0 && (
              <p className="text-xs text-center text-muted-foreground bg-muted/50 py-2 rounded">
                Processe a fila ao lado para extrair mais itens se necessário.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 2. Database Processing Card */}
        <Card
          className={cn(
            "relative overflow-hidden transition-all duration-300 border-2",
            isQueueEmpty && isExtractionDone
              ? "border-green-200 bg-green-50/50 dark:bg-green-900/10"
              : "border-muted",
          )}
        >
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl">2. Persistência em Lote</CardTitle>
            <CardDescription className="text-base">
              Processa a fila extraída, salvando os itens no banco de dados e
              criando os relacionamentos.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Status da Fila</span>
                <span>
                  {totalQueue > 0 ? "Aguardando Processamento" : "Fila Vazia"}
                </span>
              </div>
              <Progress
                value={totalQueue === 0 ? 100 : 0}
                className={cn(
                  "h-3",
                  totalQueue === 0 ? "bg-muted" : "bg-muted",
                )}
                // Note: Ideally we'd style the indicator inside Progress, but shadcn standard is fine.
                // If totalQueue > 0, we show small progress to indicate work needed.
              />
            </div>

            <Button
              onClick={handleProcessBatch}
              disabled={isProcessing || totalQueue === 0}
              className={cn(
                "w-full h-12 text-base transition-all",
                totalQueue > 0 ? "shadow-md hover:scale-[1.02]" : "opacity-80",
              )}
              variant={totalQueue > 0 ? "glass" : "secondary"}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Database className="w-5 h-5 mr-2" />
              )}
              {totalQueue > 0
                ? `Processar ${totalQueue} Itens`
                : "Nenhum Item na Fila"}
            </Button>
          </CardContent>

          {isQueueEmpty && isExtractionDone && (
            <CardFooter className="bg-green-100/50 dark:bg-green-900/20 py-3 justify-center rounded-md mt-4 cursor-pointer">
              <p
                onClick={onComplete}
                className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Tudo pronto para prosseguir
              </p>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
