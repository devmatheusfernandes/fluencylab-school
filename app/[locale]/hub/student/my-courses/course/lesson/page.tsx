"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, List } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import {
  Enrollment,
  Lesson,
  QuizResult,
  Section,
  VideoContentBlock,
} from "@/types/quiz/types";
import { VideoPlayer } from "@/components/course/lesson/VideoPlayer";
import { LessonSidebar } from "@/components/course/lesson/LessonSidebar";
import { MobileLessonList } from "@/components/course/lesson/MobileLessonList";
import { LessonContent } from "@/components/course/lesson/LessonContent";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

// --- MOTION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function LessonPageContent() {
  const t = useTranslations("LessonPage");
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");

  // --- STATES ---
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseSections, setCourseSections] = useState<Section[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [savedQuizData, setSavedQuizData] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // --- USE EFFECTS ---
  useEffect(() => {
    if (!courseId || !lessonId) {
      toast.error(t("invalidIds"));
      router.push("/student-dashboard/cursos");
      return;
    }

    const fetchData = async () => {
      if (!session?.user?.id) return;
      setIsLoading(true);
      setNextLessonId(null);

      try {
        const res = await fetch(`/api/student/courses/${courseId}`);
        if (!res.ok) throw new Error(t("loadCourseError"));

        const { sections, enrollment: currentEnrollment } = await res.json();
        setCourseSections(sections as Section[]);

        if (!currentEnrollment) {
          toast.error(t("notEnrolled"));
          router.push(`/hub/student/my-courses/course?id=${courseId}`);
          return;
        }
        setEnrollment(currentEnrollment as Enrollment);
        setIsCompleted(!!currentEnrollment.progress?.[lessonId]);

        let lessonData: Lesson | null = null;
        let currentSection: Section | null = null;

        for (const sectionData of sections as Section[]) {
          const foundLesson = (sectionData.lessons || []).find(
            (l: Lesson) => l.id === lessonId,
          );
          if (foundLesson) {
            lessonData = { ...foundLesson, sectionId: sectionData.id };
            currentSection = sectionData;
            break;
          }
        }

        if (!lessonData || !currentSection) {
          toast.error(t("lessonNotFound"));
          router.push(`/hub/student/my-courses/course?id=${courseId}`);
          return;
        }
        setLesson(lessonData);

        // Calculate Next Lesson Logic
        const currentLessonIndex = (currentSection.lessons || []).findIndex(
          (l: Lesson) => l.id === lessonId,
        );
        const sectionsArr = sections as Section[];
        const currentSectionIndex = sectionsArr.findIndex(
          (s) => s.id === currentSection?.id,
        );

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
        router.push(`/hub/student/my-courses/course?id=${courseId}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchData();
    }
  }, [session, router, courseId, lessonId, t]);

  useEffect(() => {
    const fetchSavedQuizData = async () => {
      if (!session?.user?.id || !courseId || !lessonId) return;
      try {
        const res = await fetch(
          `/api/student/quiz-results/${courseId}/${lessonId}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data) setSavedQuizData(data as QuizResult);
        }
      } catch (error) {
        console.error("Erro ao buscar dados salvos do quiz:", error);
      }
    };
    fetchSavedQuizData();
  }, [session?.user?.id, courseId, lessonId]);

  // --- HANDLERS ---
  const handleMarkComplete = async (specificLessonId?: string) => {
    const targetLessonId = specificLessonId || lessonId;
    if (!courseId || !targetLessonId || !session?.user?.id || !enrollment)
      return;

    // If marking the current lesson, check specific loading/completed states
    if (targetLessonId === lessonId) {
      if (markingComplete || isCompleted) return;
      setMarkingComplete(true);
    } else {
      // Check if already completed in enrollment data to avoid duplicate requests
      if (enrollment.progress?.[targetLessonId]) return;
    }

    const toastId = toast.loading(t("markingComplete"));

    try {
      const res = await fetch(`/api/student/courses/${courseId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: targetLessonId }),
      });

      if (!res.ok) throw new Error(t("markCompleteError"));

      const newProgress = {
        ...(enrollment.progress || {}),
        [targetLessonId]: true,
      };
      setEnrollment((prev) =>
        prev ? { ...prev, progress: newProgress } : null,
      );

      // Only update local isCompleted state if we modified the current lesson
      if (targetLessonId === lessonId) {
        setIsCompleted(true);
      }

      toast.success(t("markCompleteSuccess"), { id: toastId });

      const json = await res.json();
      if (json?.courseCompleted) {
        toast.success(t("courseCompletedSuccess"));
      }
    } catch (error) {
      console.error("Erro ao marcar como concluída: ", error);
      toast.error(t("markCompleteError"), { id: toastId });
    } finally {
      if (targetLessonId === lessonId) {
        setMarkingComplete(false);
      }
    }
  };

  const handleQuizSubmission = async (quizResults: {
    answers: Record<string, string>;
    score: number;
    totalQuestions: number;
    correct: boolean;
  }) => {
    if (!session?.user?.id || !courseId || !lessonId) return;
    try {
      const quizData = {
        answers: quizResults.answers,
        score: quizResults.score,
        totalQuestions: quizResults.totalQuestions,
        correct: quizResults.correct,
        lessonTitle: lesson?.title || "",
      };

      const res = await fetch(
        `/api/student/quiz-results/${courseId}/${lessonId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quizData),
        },
      );

      if (!res.ok) throw new Error("Erro ao salvar resultados do quiz.");

      if (!isCompleted) handleMarkComplete();
    } catch (error) {
      console.error("Error saving quiz results:", error);
      toast.error("Erro ao salvar resultados do quiz.");
    }
  };

  // --- SKELETON LOADER (Matching Layout) ---
  if (isLoading || !lesson) {
    return (
      <div className="min-h-screen p-4 md:p-8 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between max-w-[1400px] mx-auto w-full mb-8">
          <div className="flex gap-4 items-center">
            <Skeleton className="h-8 w-8 rounded-full  " />
            <Skeleton className="h-6 w-32  " />
          </div>
          <Skeleton className="h-9 w-24 rounded-full  " />
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 max-w-[1400px] mx-auto w-full">
          {/* Left Column Skeleton */}
          <div className="space-y-6">
            <Skeleton className="w-full aspect-video rounded-2xl  /50" />{" "}
            {/* Video */}
            <div className="flex items-center justify-between p-4 rounded-xl   border border-border">
              <div className="flex gap-4 items-center">
                <Skeleton className="h-10 w-10 rounded-full  " />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32  " />
                  <Skeleton className="h-3 w-20  /70" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md  " />
                <Skeleton className="h-8 w-8 rounded-md  " />
              </div>
            </div>
            <div className="space-y-3 pt-4">
              <Skeleton className="h-6 w-1/3  " />
              <Skeleton className="h-4 w-full  /70" />
              <Skeleton className="h-4 w-full  /70" />
              <Skeleton className="h-4 w-2/3  /70" />
            </div>
          </div>

          {/* Right Column Skeleton (Sidebar) */}
          <div className="hidden lg:flex flex-col gap-6">
            <Skeleton className="h-40 w-full rounded-xl   border border-border" />{" "}
            {/* Progress Widget */}
            <div className="space-y-3">
              <Skeleton className="h-8 w-2/3   rounded-md mb-2" />
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton
                  key={i}
                  className="h-16 w-full rounded-xl   border border-border"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- DATA PREPARATION ---
  const firstVideoBlock = lesson.contentBlocks.find(
    (b) => b.type === "video",
  ) as VideoContentBlock | undefined;
  const videoUrl = firstVideoBlock?.url;
  const completedLessonIds = enrollment?.progress
    ? Object.keys(enrollment.progress)
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* HEADER */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={`/hub/student/my-courses/course?id=${courseId}`}
            className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline">{t("backToCourse")}</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Mobile Drawer Trigger */}
            <ThemeSwitcher />

            {isCompleted && (
              <Badge
                variant="outline"
                className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500 gap-1.5 py-1 px-3"
              >
                <CheckCircle className="w-3.5 h-3.5" /> {t("completed")}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsDrawerOpen(true)}
            >
              <List className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <main className="flex-1 container-padding lg:p-8 max-w-[1400px] mx-auto w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 xl:gap-8 items-start"
        >
          {/* --- LEFT COLUMN: VIDEO & DETAILS --- */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-6 min-w-0"
          >
            {/* Video Player Container */}
            <div className="relative group rounded-2xl overflow-hidden border border-border">
              <VideoPlayer videoUrl={videoUrl} title={lesson.title} />
            </div>

            <LessonContent
              lesson={lesson}
              onQuizSubmit={handleQuizSubmission}
              savedQuizData={savedQuizData}
            />
          </motion.div>

          {/* --- RIGHT COLUMN: SIDEBAR (Desktop Only) --- */}
          <motion.div
            variants={itemVariants}
            className="hidden lg:block lg:sticky lg:top-24 h-fit space-y-6"
          >
            <LessonSidebar
              courseId={courseId!}
              sections={courseSections}
              currentLessonId={lessonId!}
              completedLessonIds={completedLessonIds}
              onMarkComplete={handleMarkComplete}
            />
          </motion.div>
        </motion.div>
      </main>

      {/* MOBILE DRAWER */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="h-[80vh]">
          <DrawerHeader className="hidden">
            <DrawerTitle>Conteúdo do Curso</DrawerTitle>
          </DrawerHeader>
          <MobileLessonList
            courseId={courseId!}
            sections={courseSections}
            currentLessonId={lessonId!}
            completedLessonIds={completedLessonIds}
            onMarkComplete={handleMarkComplete}
            onLessonClick={() => setIsDrawerOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
