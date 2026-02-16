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
  CardFooter,
} from "@/components/ui/card";
import {
  Loader2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";

// Existing Components
import LessonEditor from "@/components/lessons/LessonEditor";
import LessonComponentsManager from "@/components/lessons/LessonComponentsManager";
import { LessonTranscriptEditor } from "@/components/lessons/LessonTranscriptEditor";
import { LessonQuizEditor } from "@/components/lessons/LessonQuizEditor";
import LessonOperations from "@/components/lessons/LessonOperations";
import { Separator } from "@/components/ui/separator";

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
  const [currentStep, setCurrentStep] = useState(lesson.creationStep || 1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (lesson.creationStep && lesson.creationStep !== currentStep) {
      setCurrentStep(lesson.creationStep);
    }
  }, [lesson.creationStep]);

  const handleStepChange = async (step: number) => {
    setCurrentStep(step);
    await updateLessonStep(lesson.id, step);
    router.refresh();
  };

  const handleNext = () => handleStepChange(currentStep + 1);

  // --- Step Wrappers ---

  const StepHeader = ({
    title,
    action,
  }: {
    title: string;
    action?: React.ReactNode;
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  );

  const renderStep1_Editor = () => (
    <div className="flex flex-col h-full">
      <StepHeader
        title="Conteúdo da Aula"
        action={
          <Button onClick={handleNext}>
            Concluir e Analisar <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        }
      />
      <div className="flex-1 rounded-md overflow-hidden">
        <LessonEditor lessonId={lesson.id} initialContent={lesson.content} />
      </div>
    </div>
  );

  const renderStep4_Components = () => (
    <div className="space-y-6">
      <StepHeader
        title="Revisão de Componentes"
        action={
          <Button onClick={handleNext}>
            Marcar como Revisado <CheckCircle2 className="w-4 h-4 ml-2" />
          </Button>
        }
      />
      <Card className="bg-muted/30 border-dashed">
        <CardContent>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Verifique o vocabulário e estruturas extraídos. Você pode editar,
            remover ou adicionar imagens.
          </p>
        </CardContent>
      </Card>

      <LessonComponentsManager
        vocabulary={vocabulary}
        structures={structures}
        lessonId={lesson.id}
      />
    </div>
  );

  const renderStep5_Audio = () => (
    <div className="space-y-6">
      <StepAudio lesson={lesson} onComplete={handleNext} />
    </div>
  );

  const renderStep6_TranscriptReview = () => (
    <div className="space-y-6">
      <StepHeader
        title="Revisão da Transcrição"
        action={
          <Button onClick={handleNext} className="gap-2 shadow-sm">
            Confirmar Transcrição <CheckCircle2 className="w-4 h-4" />
          </Button>
        }
      />
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <LessonTranscriptEditor lesson={lesson} />
      </div>
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
      <div className="space-y-6 max-w-3xl mx-auto pt-10">
        <StepHeader title="Geração de Quiz" />
        <Card className="border-2 border-primary/10 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Quiz Automático com IA</CardTitle>
            <CardDescription className="text-base max-w-md mx-auto mt-2">
              O sistema analisará todo o conteúdo e transcrição para criar
              perguntas de vocabulário, gramática e compreensão.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Button
              onClick={handleGenQuiz}
              disabled={isLoading}
              size="lg"
              className="w-full max-w-sm h-12 text-base shadow-md transition-all hover:scale-105"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 mr-2" />
              )}
              Gerar Quiz Agora
            </Button>
          </CardContent>
          <CardFooter className="bg-muted/30 py-4 justify-center">
            <p className="text-xs text-muted-foreground">
              Isso pode levar alguns segundos.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  };

  const renderStep8_QuizReview = () => (
    <div className="space-y-6">
      <StepHeader
        title="Revisão do Quiz"
        action={
          <Button onClick={handleNext} className="gap-2 shadow-sm">
            Confirmar Quiz <CheckCircle2 className="w-4 h-4" />
          </Button>
        }
      />
      <div className="rounded-xl border bg-card shadow-sm">
        <LessonQuizEditor lesson={lesson} />
      </div>
    </div>
  );

  const renderStep9_Publish = () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      <StepHeader title="Publicação" />
      <div className="border rounded-xl overflow-hidden bg-card p-8 shadow-sm">
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
        return (
          <div className="max-w-4xl mx-auto">
            <StepAnalysis lesson={lesson} onComplete={handleNext} />
          </div>
        );
      case 3:
        return (
          <div className="max-w-4xl mx-auto">
            <StepProcessing lesson={lesson} onComplete={handleNext} />
          </div>
        );
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
    <div className="container mx-auto px-4 py-6 max-w-[1600px]">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 min-h-[calc(100vh-8rem)]">
        {/* Sidebar - Fixed on Desktop */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="lg:sticky lg:top-8">
            <LessonCreationSidebar
              currentStep={currentStep}
              onStepClick={(step) => {
                if (step <= (lesson.creationStep || 1)) {
                  handleStepChange(step);
                }
              }}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full min-w-0">
          <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            {renderCurrentStep()}
          </div>
        </main>
      </div>
    </div>
  );
}
