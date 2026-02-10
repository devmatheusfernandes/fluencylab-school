"use client";

import { useState, useEffect } from "react";
import {
  Lesson,
  LearningItem,
  LearningStructure,
} from "@/types/learning/lesson";
import { LessonCreationSidebar } from "./LessonCreationSidebar";
import { StepAnalysis } from "./steps/StepAnalysis";
import { StepProcessing } from "./steps/StepProcessing";
import { StepAudio } from "./steps/StepAudio";
import { updateLessonStep } from "@/actions/lessonStepUpdates";
import { generateLessonQuiz } from "@/actions/lessonProcessing";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Loader2,
  ArrowRight,
  Mic,
  FileText,
  Wand2,
  CheckCircle2,
} from "lucide-react";

// Existing Components
import LessonEditor from "@/components/lessons/LessonEditor";
import LessonComponentsManager from "@/components/lessons/LessonComponentsManager";
import { LessonTranscriptEditor } from "@/components/lessons/LessonTranscriptEditor";
import { LessonQuizEditor } from "@/components/lessons/LessonQuizEditor";
import LessonOperations from "@/components/lessons/LessonOperations";

interface LessonCreationFlowProps {
  lesson: Lesson;
  vocabulary: LearningItem[];
  structures: LearningStructure[];
}

export function LessonCreationFlow({
  lesson,
  vocabulary,
  structures,
}: LessonCreationFlowProps) {
  const router = useRouter();
  // Initialize step from lesson or default to 1
  const [currentStep, setCurrentStep] = useState(lesson.creationStep || 1);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state if lesson updates externally
  useEffect(() => {
    if (lesson.creationStep && lesson.creationStep !== currentStep) {
      setCurrentStep(lesson.creationStep);
    }
  }, [lesson.creationStep]);

  const handleStepChange = async (step: number) => {
    // Optimistic update
    setCurrentStep(step);
    // Persist
    await updateLessonStep(lesson.id, step);
    router.refresh();
  };

  const handleNext = () => handleStepChange(currentStep + 1);

  // --- Step Wrappers ---

  const renderStep1_Editor = () => (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Conteúdo da Aula</h2>
        <Button onClick={handleNext} className="gap-2">
          Concluir e Analisar <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 border rounded-xl overflow-hidden bg-card">
        <LessonEditor lessonId={lesson.id} initialContent={lesson.content} />
      </div>
    </div>
  );

  const renderStep4_Components = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Revisão de Componentes</h2>
        <Button onClick={handleNext} className="gap-2">
          Marcar como Revisado <CheckCircle2 className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-muted-foreground">
        Verifique o vocabulário e estruturas extraídos. Você pode editar,
        remover ou adicionar imagens.
      </p>
      <LessonComponentsManager
        vocabulary={vocabulary}
        structures={structures}
        lessonId={lesson.id}
      />
    </div>
  );

  const renderStep5_Audio = () => (
    <StepAudio lesson={lesson} onComplete={handleNext} />
  );

  const renderStep6_TranscriptReview = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Revisão da Transcrição</h2>
        <Button onClick={handleNext} className="gap-2">
          Confirmar Transcrição <CheckCircle2 className="w-4 h-4" />
        </Button>
      </div>
      <LessonTranscriptEditor lesson={lesson} />
    </div>
  );

  const renderStep7_QuizGen = () => {
    const handleGenQuiz = async () => {
      try {
        setIsLoading(true);
        const res = await generateLessonQuiz(lesson.id);
        if (res.success) {
          toast.success("Quiz gerado com sucesso!");
          handleNext();
        } else {
          toast.error("Erro ao gerar quiz");
        }
      } catch (e) {
        toast.error("Erro desconhecido");
      } finally {
        setIsLoading(false);
        router.refresh();
      }
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Geração de Quiz</h2>
        <Card>
          <CardHeader>
            <CardTitle>Quiz Automático</CardTitle>
            <CardDescription>
              O sistema irá gerar perguntas de vocabulário, gramática e
              compreensão baseadas no conteúdo e transcrição.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenQuiz} disabled={isLoading} size="lg">
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Gerar Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStep8_QuizReview = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Revisão do Quiz</h2>
        <Button onClick={handleNext} className="gap-2">
          Confirmar Quiz <CheckCircle2 className="w-4 h-4" />
        </Button>
      </div>
      <LessonQuizEditor lesson={lesson} />
    </div>
  );

  const renderStep9_Publish = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Publicação</h2>
      <div className="border rounded-xl overflow-hidden bg-card p-6">
        <LessonOperations lesson={lesson} />
      </div>
    </div>
  );

  // --- Main Render ---

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1_Editor();
      case 2:
        return <StepAnalysis lesson={lesson} onComplete={handleNext} />;
      case 3:
        return <StepProcessing lesson={lesson} onComplete={handleNext} />;
      case 4:
        return renderStep4_Components();
      case 5:
        return renderStep5_Audio();
      case 6:
        return renderStep6_TranscriptReview();
      case 7:
        return renderStep7_QuizGen();
      case 8:
        return renderStep8_QuizReview();
      case 9:
        return renderStep9_Publish();
      default:
        return <div>Passo não encontrado</div>;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-8rem)]">
      {/* Sidebar - 1/4 */}
      <div className="w-full lg:w-1/4 lg:sticky lg:top-8 h-fit">
        <LessonCreationSidebar
          currentStep={currentStep}
          onStepClick={(step) => {
            // Only allow clicking previous steps or current step
            if (step <= (lesson.creationStep || 1)) {
              handleStepChange(step);
            }
          }}
        />
      </div>

      {/* Main Content - 3/4 */}
      <div className="w-full lg:w-3/4">{renderCurrentStep()}</div>
    </div>
  );
}
