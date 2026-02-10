"use client";

import { useState } from "react";
import { Lesson } from "@/types/learning/lesson";
import {
  generateLessonPodcast,
  generateLessonTranscript,
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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Mic,
  FileText,
  Wand2,
  ArrowRight,
  Upload,
  Play,
  Trash2,
  Headphones,
  Music,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { cn } from "@/lib/utils";

interface StepAudioProps {
  lesson: Lesson;
  onComplete: () => void;
}

export function StepAudio({ lesson, onComplete }: StepAudioProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const router = useRouter();

  // --- Handlers (Lógica Original) ---

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingType("upload");
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("lessonId", lesson.id);

    try {
      const res = await fetch("/api/lesson/upload-audio", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        await updateDoc(doc(db, "lessons", lesson.id), {
          audioUrl: data.url,
        });
        toast.success("Áudio enviado com sucesso!");
        router.refresh();
      } else {
        toast.error(data.error || "Erro ao enviar áudio");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro na comunicação com o servidor");
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleGeneratePodcast = async () => {
    try {
      setLoadingType("podcast");
      setIsLoading(true);
      const res = await generateLessonPodcast(lesson.id);
      if (res.success) {
        toast.success("Podcast gerado com sucesso!");
        router.refresh();
      } else {
        toast.error("Erro ao gerar podcast");
      }
    } catch (e) {
      toast.error("Erro desconhecido");
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleGenerateTranscript = async () => {
    try {
      setLoadingType("transcript");
      setIsLoading(true);
      const res = await generateLessonTranscript(lesson.id);
      if (res.success) {
        toast.success("Transcrição gerada com sucesso!");
        onComplete();
      } else {
        toast.error("Erro ao gerar transcrição");
      }
    } catch (e) {
      toast.error("Erro desconhecido");
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleDeleteAudio = async () => {
    if (!confirm("Tem certeza que deseja remover o áudio atual?")) return;

    setLoadingType("delete");
    setIsLoading(true);
    try {
      await updateDoc(doc(db, "lessons", lesson.id), {
        audioUrl: null,
        transcriptSegments: null,
      });
      toast.success("Áudio removido.");
      router.refresh();
    } catch (e) {
      toast.error("Erro ao remover áudio.");
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const hasTranscript =
    lesson.transcriptSegments && lesson.transcriptSegments.length > 0;

  // --- Render ---

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Áudio & Mídia</h2>
          <p className="text-muted-foreground">
            Adicione um áudio para prática de Listening e gere a transcrição.
          </p>
        </div>
        {hasTranscript && lesson.audioUrl && (
          <Button onClick={onComplete} className="gap-2 shadow-sm">
            Próximo Passo <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {!lesson.audioUrl ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Option 1: AI Podcast */}
          <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 shadow-sm relative overflow-hidden transition-all hover:shadow-md hover:border-indigo-200">
            <div className="absolute top-0 right-0 p-3">
              <Badge
                variant="secondary"
                className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
              >
                Beta
              </Badge>
            </div>

            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center mb-2">
                <Wand2 className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl text-indigo-950 dark:text-indigo-100">
                Gerar Podcast com IA
              </CardTitle>
              <CardDescription>
                Crie automaticamente um diálogo envolvente entre professor e
                aluno baseado no conteúdo da sua aula.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Vozes
                  naturais e fluídas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Focado no
                  nível do aluno
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Pronto em
                  segundos
                </li>
              </ul>

              <Button
                onClick={handleGeneratePodcast}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md h-11"
              >
                {loadingType === "podcast" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mic className="w-4 h-4 mr-2" />
                )}
                Gerar Podcast Agora
              </Button>
            </CardContent>
          </Card>

          {/* Option 2: Upload */}
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors bg-muted/10">
            <CardHeader>
              <div className="w-12 h-12 bg-muted text-muted-foreground rounded-lg flex items-center justify-center mb-2">
                <Upload className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">Upload de Arquivo</CardTitle>
              <CardDescription>
                Já possui o áudio? Faça o upload de arquivos MP3, WAV ou M4A
                (máx 10MB).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <label
                htmlFor="audio-upload"
                className={cn(
                  "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors gap-2 text-muted-foreground hover:text-foreground",
                  isLoading && "opacity-50 cursor-not-allowed",
                )}
              >
                {loadingType === "upload" ? (
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                ) : (
                  <Music className="w-8 h-8 text-muted-foreground/50" />
                )}
                <span className="text-sm font-medium">
                  Clique para selecionar o arquivo
                </span>
              </label>
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                disabled={isLoading}
                className="hidden"
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <Card className="overflow-hidden border-primary/20 shadow-md">
            {/* Audio Player Header */}
            <div className="bg-muted/30 p-6 flex flex-col sm:flex-row items-center gap-6 border-b">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Headphones className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 w-full space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">Áudio da Aula</h3>
                    <p className="text-sm text-muted-foreground">
                      Pronto para reprodução e transcrição
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteAudio}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Remover
                  </Button>
                </div>
                <audio
                  controls
                  src={lesson.audioUrl}
                  className="w-full h-10 accent-primary"
                />
              </div>
            </div>

            {/* Transcript Action Area */}
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                    hasTranscript
                      ? "bg-green-100 text-green-600"
                      : "bg-orange-100 text-orange-600",
                  )}
                >
                  <FileText className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold">
                    {hasTranscript
                      ? "Transcrição Sincronizada"
                      : "Transcrição Pendente"}
                  </h4>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {hasTranscript
                      ? "A transcrição foi gerada com sucesso. Você pode revisá-la na próxima etapa."
                      : "Para finalizar a criação da aula, precisamos gerar a transcrição automática do áudio acima."}
                  </p>
                </div>

                {!hasTranscript ? (
                  <Button
                    onClick={handleGenerateTranscript}
                    disabled={isLoading}
                    size="lg"
                    className="mt-4 min-w-[200px]"
                  >
                    {loadingType === "transcript" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    Gerar Transcrição (IA)
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 px-4 py-2 rounded-full mt-2">
                    <CheckCircle2 className="w-4 h-4" /> Processo Concluído
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
