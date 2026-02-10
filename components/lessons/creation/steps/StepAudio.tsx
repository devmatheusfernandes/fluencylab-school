"use client";

import { useState } from "react";
import { Lesson } from "@/types/learning/lesson";
import { generateLessonPodcast, generateLessonTranscript } from "@/actions/lessonProcessing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Mic, FileText, Wand2, ArrowRight, Upload, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface StepAudioProps {
  lesson: Lesson;
  onComplete: () => void;
}

export function StepAudio({ lesson, onComplete }: StepAudioProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const router = useRouter();

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
        // Opcional: Auto-generate transcript?
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
        // Assume API or direct update
        await updateDoc(doc(db, "lessons", lesson.id), {
          audioUrl: null,
          transcriptSegments: null
        });
        toast.success("Áudio removido.");
        router.refresh();
    } catch(e) {
        toast.error("Erro ao remover áudio.");
    } finally {
        setIsLoading(false);
        setLoadingType(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Áudio e Transcrição</h2>
        {lesson.audioUrl && lesson.transcriptSegments && lesson.transcriptSegments.length > 0 && (
          <Button onClick={onComplete} variant="outline" className="gap-2">
            Próximo Passo <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {!lesson.audioUrl ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option 1: Generate Podcast */}
          <Card className="border-indigo-100 bg-indigo-50/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-indigo-600" /> Podcast IA
              </CardTitle>
              <CardDescription>
                Gere um diálogo automático entre professor e aluno sobre o tema da aula.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleGeneratePodcast} 
                disabled={isLoading} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loadingType === "podcast" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-2" />
                )}
                Gerar Podcast (Beta)
              </Button>
            </CardContent>
          </Card>

          {/* Option 2: Upload Audio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" /> Upload de Áudio
              </CardTitle>
              <CardDescription>
                Faça upload de um arquivo MP3 existente se você já gravou a aula.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <label 
                  htmlFor="audio-upload" 
                  className={`flex items-center justify-center w-full h-10 px-4 py-2 text-sm font-medium transition-colors border rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loadingType === "upload" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Upload className="w-4 h-4 mr-2" />
                    )}
                    Selecionar Arquivo
                </label>
                <input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    disabled={isLoading}
                    className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Play className="w-5 h-5" /> Áudio da Aula
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleDeleteAudio} disabled={isLoading} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4 mr-2"/> Remover
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <audio controls src={lesson.audioUrl} className="w-full" />
                    
                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4"/> Transcrição
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                            Para avançar, você precisa gerar a transcrição deste áudio.
                        </p>
                        <Button 
                            onClick={handleGenerateTranscript} 
                            disabled={isLoading} 
                            variant="secondary" 
                            className="w-full sm:w-auto"
                        >
                            {loadingType === "transcript" ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <FileText className="w-4 h-4 mr-2" />
                            )}
                            Gerar Transcrição e Continuar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
