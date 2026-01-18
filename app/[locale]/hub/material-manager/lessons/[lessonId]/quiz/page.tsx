import { adminDb } from "@/lib/firebase/admin";
import { Lesson } from "@/types/lesson";
import { LessonQuizEditor } from "@/components/lessons/LessonQuizEditor";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Page({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  
  const lessonRef = adminDb.collection("lessons").doc(lessonId);
  const lessonSnap = await lessonRef.get();
  
  if (!lessonSnap.exists) {
    return <div>Lição não encontrada</div>;
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
    <div className="p-8 max-w-5xl mx-auto">
       <div className="mb-8">
        <Link href={`/hub/material-manager/lessons/${lessonId}`}>
          <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Aula
          </Button>
        </Link>
      </div>
      
      <LessonQuizEditor lesson={lesson} />
    </div>
  );
}
