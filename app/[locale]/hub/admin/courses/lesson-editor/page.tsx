"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Layout, ListChecks } from "lucide-react";
import { Header } from "@/components/ui/header";
import LessonForm from "@/components/course/LessonForm";
import QuizForm from "@/components/course/QuizForm";
import { Course, Section, Lesson, QuizQuestion } from "@/types/quiz/types";
import { SpinnerLoading } from "@/components/transitions/spinner-loading";

// Tipos auxiliares para gerenciar a view
type EditorView = "content" | "quiz";

export default function LessonEditorPage() {
  const t = useTranslations("AdminCourses.edit");
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const courseId = searchParams.get("courseId");
  const sectionId = searchParams.get("sectionId");
  const lessonId = searchParams.get("lessonId");

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [activeView, setActiveView] = useState<EditorView>("content");

  const fetchData = useCallback(async () => {
    if (!courseId || !sectionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`);
      if (!res.ok) throw new Error("Course not found");
      const data = await res.json();
      setCourse(data.course);
      const sections = data.sections as Section[];
      const section = sections.find((s) => s.id === sectionId);

      if (lessonId) {
        const lesson = section?.lessons.find((l) => l.id === lessonId);
        if (lesson) setCurrentLesson(lesson);
      } else {
        setCurrentLesson({
          id: "",
          sectionId: sectionId,
          title: "",
          order: 0,
          contentBlocks: [],
          quiz: [],
          attachments: [],
        } as unknown as Lesson);
      }
    } catch (error) {
      console.error(error);
      toast.error(t("toasts.loadError"));
      router.push(`/hub/admin/courses/edit?id=${courseId}`);
    } finally {
      setLoading(false);
    }
  }, [courseId, sectionId, lessonId, router, t]);

  useEffect(() => {
    if (status === "authenticated" && session.user.role === "admin") {
      fetchData();
    } else if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, session, fetchData, router]);

  const handleSaveLesson = async (lessonData: Omit<Lesson, "id" | "order">) => {
    if (!courseId || !sectionId) return;
    const toastId = toast.loading(t("toasts.savingLesson"));

    try {
      // Limpeza de dados vazios
      const cleanedData = {
        ...lessonData,
        contentBlocks: lessonData.contentBlocks.map((block) => {
          if (block.type === "text")
            return { ...block, content: block.content?.trim() || null };
          if (block.type === "video")
            return { ...block, url: block.url?.trim() || null };
          return block;
        }),
      };

      let res;
      if (lessonId && currentLesson?.id) {
        // Update
        res = await fetch(
          `/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cleanedData),
          },
        );
      } else {
        // Create
        res = await fetch(
          `/api/admin/courses/${courseId}/sections/${sectionId}/lessons`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...cleanedData, order: 9999 }),
          },
        );
      }

      if (!res.ok) throw new Error("Failed to save");

      const json = await res.json();

      // Se criou uma nova, atualiza a URL sem recarregar tudo necessariamente
      if (!lessonId && json.id) {
        const params = new URLSearchParams(searchParams);
        params.set("lessonId", json.id);
        router.replace(`?${params.toString()}`);
        // Atualiza estado local
        setCurrentLesson(
          (prev) => ({ ...prev!, id: json.id, ...lessonData }) as Lesson,
        );
      } else {
        // Atualiza estado local
        setCurrentLesson((prev) => ({ ...prev!, ...lessonData }) as Lesson);
      }

      toast.success(
        lessonId ? t("toasts.lessonUpdated") : t("toasts.lessonCreated"),
        { id: toastId },
      );
    } catch (error) {
      console.error(error);
      toast.error(t("toasts.lessonError"), { id: toastId });
    }
  };

  const handleAttachmentsUpdated = (updatedLesson: Lesson) => {
    setCurrentLesson(updatedLesson);
  };

  const updateLessonQuiz = async (updatedQuiz: QuizQuestion[]) => {
    if (!courseId || !sectionId || !currentLesson?.id) return;

    const res = await fetch(
      `/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${currentLesson.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz: updatedQuiz }),
      },
    );
    if (!res.ok) throw new Error("API Error");

    setCurrentLesson((prev) => (prev ? { ...prev, quiz: updatedQuiz } : null));
  };

  if (loading || !course || !currentLesson) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SpinnerLoading />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header Minimalista */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Header
          heading={lessonId ? "Editar Conteúdo" : "Nova Lição"}
          subheading={course.title}
          backHref={`/hub/admin/courses/edit?id=${courseId}`}
          className="p-0"
        />

        {/* View Switcher (Tabs) */}
        {currentLesson.id && (
          <div className="flex items-center self-start md:self-auto">
            <button
              onClick={() => setActiveView("content")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeView === "content"
                  ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <Layout className="w-4 h-4" />
              Conteúdo
            </button>
            <button
              onClick={() => setActiveView("quiz")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeView === "quiz"
                  ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <ListChecks className="w-4 h-4" />
              Quiz ({currentLesson.quiz?.length || 0})
            </button>
          </div>
        )}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeView === "content" ? (
          <div>
            <LessonForm
              initialData={currentLesson}
              sectionId={sectionId!}
              onSave={handleSaveLesson}
              onCancel={() => router.back()}
              courseId={courseId!}
              lessonId={lessonId || null}
              onAttachmentsUpdated={handleAttachmentsUpdated}
              onSwitchToQuiz={() => setActiveView("quiz")}
            />
          </div>
        ) : (
          <div>
            <QuizForm
              lesson={currentLesson}
              onUpdateQuiz={updateLessonQuiz}
              onBack={() => setActiveView("content")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
