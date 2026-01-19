import { adminDb } from "@/lib/firebase/admin";
import { Lesson } from "@/types/lesson";
import { LessonQuizEditor } from "@/components/lessons/LessonQuizEditor";
import { Header } from "@/components/ui/header";
import ErrorAlert from "@/components/ui/error-alert";
import { getTranslations } from "next-intl/server";

export default async function Page({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const tMaterial = await getTranslations("MaterialManager");
  const tPage = await getTranslations("LessonQuizPage");

  const lessonRef = adminDb.collection("lessons").doc(lessonId);
  const lessonSnap = await lessonRef.get();
  
  if (!lessonSnap.exists) {
    return (
      <div className="p-4 md:p-8">
        <ErrorAlert message={tMaterial("lessonNotFound")} />
      </div>
    );
  }

  const rawLesson = lessonSnap.data() as any;
  const lesson: Lesson = {
    id: lessonSnap.id,
    ...rawLesson,
    metadata: {
      createdAt: rawLesson.metadata?.createdAt?.toMillis
        ? rawLesson.metadata.createdAt.toMillis()
        : rawLesson.metadata?.createdAt ?? null,
      updatedAt: rawLesson.metadata?.updatedAt?.toMillis
        ? rawLesson.metadata.updatedAt.toMillis()
        : rawLesson.metadata?.updatedAt ?? null,
    },
  };

  return (
    <div className="p-4 space-y-6">
      <Header
        heading={lesson.title}
        subheading={tPage("subheading")}
        backHref={`/hub/material-manager/lessons/${lessonId}`}
      />

      <LessonQuizEditor lesson={lesson} />
    </div>
  );
}
