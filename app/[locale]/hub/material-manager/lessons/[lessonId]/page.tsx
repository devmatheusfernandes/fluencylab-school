"use client";

import { useEffect, useState, use } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Lesson } from "@/types/lesson";
import LessonOperations from "@/components/lessons/LessonOperations";
import LessonEditor from "@/components/lessons/LessonEditor";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LessonDetailPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "lessons", lessonId), (docSnap) => {
      if (docSnap.exists()) {
        setLesson({ id: docSnap.id, ...docSnap.data() } as Lesson);
      } else {
        setLesson(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching lesson:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [lessonId]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner /></div>;
  if (!lesson) return <div className="p-8">Lição não encontrada.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
       {/* Top Bar */}
       <div className="h-14 border-b bg-white flex items-center px-4 gap-4 shrink-0">
         <Button variant="ghost" size="sm" onClick={() => router.back()}>
           <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
         </Button>
         <div className="flex flex-col">
            <h1 className="font-medium text-lg truncate leading-tight">{lesson.title}</h1>
            <span className="text-xs text-gray-400">ID: {lesson.id}</span>
         </div>
       </div>

       {/* Main Content */}
       <div className="flex-1 grid grid-cols-12 bg-gray-50 overflow-hidden">
         {/* Left: Operations (Scrollable) */}
         <div className="col-span-4 border-r bg-white overflow-y-auto custom-scrollbar">
           <LessonOperations lesson={lesson} />
         </div>

         {/* Right: Editor (Full height) */}
         <div className="col-span-8 p-4 h-full overflow-hidden flex flex-col">
           <LessonEditor lessonId={lesson.id} initialContent={lesson.content} />
         </div>
       </div>
    </div>
  );
}
