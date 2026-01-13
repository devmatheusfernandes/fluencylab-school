"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
// Firestore removido do cliente; dados agora vêm de APIs
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, ArrowLeft, ArrowRight, Check, Loader, PlayCircle, BookOpen } from "lucide-react";
import { Toaster, toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";

import { Enrollment, Lesson, QuizResult, Section } from "@/types/quiz/types";
// Firestore removido do cliente
import LessonDisplay from "@/components/course/LessonDisplay";
import QuizComponent from "@/components/course/QuizComponent";

export default function LessonPageContent() {
  const t = useTranslations("LessonPage");
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");

  // --- STATES (Lógica Original Mantida) ---
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [savedQuizData, setSavedQuizData] = useState<QuizResult | null>(null);

  // --- USE EFFECTS (Lógica Original Mantida) ---
  useEffect(() => {
    if (!courseId || !lessonId) {
      toast.error(t("invalidIds"));
      router.push("/student-dashboard/cursos");
      return;
    }

    const fetchData = async () => {
      if (!session?.user?.id) return;
      setNextLessonId(null);
      try {
        const res = await fetch(`/api/student/courses/${courseId}`);
        if (!res.ok) {
          throw new Error(t("loadCourseError"));
        }
        const { sections, enrollment: currentEnrollment } = await res.json();
        if (!currentEnrollment) {
          toast.error(t("notEnrolled"));
          router.push(`/student-dashboard/cursos/curso?id=${courseId}`);
          return;
        }
        setEnrollment(currentEnrollment as Enrollment);
        setIsCompleted(!!currentEnrollment.progress?.[lessonId]);

        let lessonData: Lesson | null = null;
        let currentSection: Section | null = null;

        for (const sectionData of sections as Section[]) {
          const foundLesson = (sectionData.lessons || []).find((l) => l.id === lessonId);
          if (foundLesson) {
            lessonData = { ...foundLesson, sectionId: sectionData.id };
            currentSection = sectionData;
            break;
          }
        }

        if (!lessonData || !currentSection) {
          toast.error(t("lessonNotFound"));
          router.push(`cursos/curso?id=${courseId}`);
          return;
        }
        setLesson(lessonData);

        const currentLessonIndex = (currentSection.lessons || []).findIndex((l) => l.id === lessonId);
        const sectionsArr = sections as Section[];
        const currentSectionIndex = sectionsArr.findIndex((s) => s.id === currentSection?.id);

        if (currentLessonIndex < (currentSection.lessons || []).length - 1) {
          setNextLessonId(currentSection.lessons![currentLessonIndex + 1].id);
        } else if (currentSectionIndex < sectionsArr.length - 1) {
          const nextSection = sectionsArr[currentSectionIndex + 1];
          if (nextSection && (nextSection.lessons || []).length > 0) {
            setNextLessonId(nextSection.lessons![0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching lesson data: ", error);
        toast.error(t("loadLessonError"));
        router.push(`/student-dashboard/cursos/curso?id=${courseId}`);
      }
    };

    if (session?.user?.id) {
      fetchData();
    }
  }, [session, router, courseId, lessonId]);

  useEffect(() => {
    const fetchSavedQuizData = async () => {
      if (!session?.user?.id || !courseId || !lessonId) return;
      try {
        const res = await fetch(`/api/student/quiz-results/${courseId}/${lessonId}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setSavedQuizData(data as QuizResult);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados salvos do quiz:", error);
      }
    };
    fetchSavedQuizData();
  }, [session?.user?.id, courseId, lessonId]);


  // --- HANDLERS (Lógica Original Mantida) ---
  const handleMarkComplete = async () => {
    if (!courseId || !lessonId || !session?.user?.id || markingComplete || isCompleted || !enrollment) return;
    setMarkingComplete(true);
    const toastId = toast.loading(t("markingComplete"));

    try {
      const res = await fetch(`/api/student/courses/${courseId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      if (!res.ok) {
        throw new Error(t("markCompleteError"));
      }
      const newProgress = { ...(enrollment.progress || {}), [lessonId]: true };
      setEnrollment((prev) => (prev ? { ...prev, progress: newProgress } : null));
      setIsCompleted(true);
      toast.success(t("markCompleteSuccess"), { id: toastId });
      const json = await res.json();
      if (json?.courseCompleted) {
        toast.success(t("courseCompletedSuccess"));
      }
    } catch (error) {
      console.error("Erro ao marcar como concluída: ", error);
      toast.error(t("markCompleteError"), { id: toastId });
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleNavigateNext = () => {
    if (nextLessonId) {
      router.push(`licao?courseId=${courseId}&lessonId=${nextLessonId}`);
    } else {
      router.push(`/student-dashboard/cursos/curso?id=${courseId}`);
    }
  };

  const handleQuizSubmission = async (
    quizResults: {
      answers: Record<string, string>;
      score: number;
      totalQuestions: number;
      correct: boolean;
    }
  ) => {
    if (!session?.user?.id || !courseId || !lessonId) return;
    try {
      const quizData = {
        answers: quizResults.answers,
        score: quizResults.score,
        totalQuestions: quizResults.totalQuestions,
        correct: quizResults.correct,
        lessonTitle: lesson?.title || "",
      };
      const res = await fetch(`/api/student/quiz-results/${courseId}/${lessonId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData),
      });
      if (!res.ok) throw new Error("Erro ao salvar resultados do quiz.");
    } catch (error) {
      console.error("Error saving quiz results:", error);
      toast.error("Erro ao salvar resultados do quiz.");
    }
  };

  // --- LOADING STATE ---
  if (!lesson) {
    return (
      <Container className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
         <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-6 rounded-full" />
         </div>
         <Skeleton className="h-10 w-3/4" />
         <Skeleton className="h-[500px] w-full rounded-xl" />
      </Container>
    );
  }

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header Fixo/Sticky para Desktop */}
      <div className="sticky top-0 z-30 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
         <div className="container max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
             <Link 
                href={`/student-dashboard/cursos/curso?id=${courseId}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
             >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t("backToCourse")}</span>
             </Link>
             
             {isCompleted && (
                 <Badge variant="success" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 hover:bg-emerald-100 border-none gap-1">
                    <CheckCircle className="w-3 h-3" /> {t("completed")}
                 </Badge>
             )}
         </div>
      </div>

      <Container className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full pb-24 md:pb-16">
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.3 }}
           className="space-y-6"
        >
            <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {lesson.title}
                </h1>
                {/* Aqui poderíamos colocar subtítulo se houver */}
            </div>

            {/* Conteúdo Principal */}
            <Card className="border-none shadow-none sm:border sm:shadow-sm bg-transparent sm:bg-card">
                <CardContent className="p-0 sm:p-6">
                     <LessonDisplay lesson={lesson} />
                </CardContent>
            </Card>

            {/* Quiz Section */}
            {lesson.quiz && lesson.quiz.length > 0 && (
                <div className="mt-8">
                    <Separator className="my-6" />
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold">{t("fixationQuiz")}</h2>
                    </div>
                    <QuizComponent 
                        quiz={lesson.quiz} 
                        onQuizSubmit={handleQuizSubmission}
                        savedQuizData={savedQuizData}
                    />
                </div>
            )}
        </motion.div>
      </Container>

      {/* Action Bar (Sticky Bottom para Mobile, Fixo para Desktop) */}
      <div className="fixed bottom-0 left-0 w-full border-t bg-background p-4 z-40">
        <div className="container max-w-4xl mx-auto flex items-center justify-between gap-4">
            
            <Button
                variant={isCompleted ? "outline" : "primary"}
                onClick={handleMarkComplete}
                disabled={isCompleted || markingComplete}
                className={`flex-1 sm:flex-initial transition-all ${
                    isCompleted 
                    ? "border-emerald-500 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950" 
                    : ""
                }`}
            >
                {markingComplete ? (
                    <Loader className="animate-spin mr-2 w-4 h-4" />
                ) : isCompleted ? (
                    <CheckCircle className="mr-2 w-4 h-4" />
                ) : (
                    <Check className="mr-2 w-4 h-4" />
                )}
                {isCompleted ? t("completed") : t("markAsComplete")}
            </Button>

            <Button
                onClick={handleNavigateNext}
                disabled={!isCompleted}
                variant={isCompleted ? "primary" : "secondary"}
                className="flex-1 sm:flex-initial"
            >
                {nextLessonId ? t("nextLesson") : isCompleted ? t("finishCourse") : t("next")}
                <ArrowRight className="ml-2 w-4 h-4" />
            </Button>

        </div>
      </div>
    </div>
  );
}
