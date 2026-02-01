import { adminDb } from "@/lib/firebase/admin";
import { Lesson, LearningItem, LearningStructure } from "@/types/learning/lesson";
import { FieldPath } from "firebase-admin/firestore";
import LessonComponentsManager from "@/components/lessons/LessonComponentsManager";
import { Header } from "@/components/ui/header";
import ErrorAlert from "@/components/ui/error-alert";
import { getTranslations } from "next-intl/server";

export default async function Page({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const tMaterial = await getTranslations("MaterialManager");
  const tPage = await getTranslations("LessonComponentsPage");
  
  // 1. Fetch Lesson
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

  // 2. Fetch Vocabulary
  let vocabulary: LearningItem[] = [];
  if (lesson.relatedLearningItemIds && lesson.relatedLearningItemIds.length > 0) {
    // Firestore 'in' query limit is 10 or 30 depending on field.
    // For large arrays, we need to batch. For simplicity here, assuming < 30.
    // Ideally we chunk this.
    const chunks = [];
    const ids = lesson.relatedLearningItemIds;
    const chunkSize = 30; // Firestore IN limit is 30 for documentId? No, 10 for inequality, 30 for IN. Actually 30.
    
    for (let i = 0; i < ids.length; i += chunkSize) {
        chunks.push(ids.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      const snap = await adminDb
        .collection("learningItems")
        .where(FieldPath.documentId(), "in", chunk)
        .get();

      snap.forEach((doc) => {
        const data = doc.data() as any;
        const meta = data.metadata || {};
        vocabulary.push({
          id: doc.id,
          ...data,
          metadata: {
            createdAt: meta.createdAt?.toMillis
              ? meta.createdAt.toMillis()
              : meta.createdAt ?? null,
            updatedAt: meta.updatedAt?.toMillis
              ? meta.updatedAt.toMillis()
              : meta.updatedAt ?? null,
          },
        } as LearningItem);
      });
    }
  }

  // 3. Fetch Structures
  let structures: LearningStructure[] = [];
  if (lesson.relatedLearningStructureIds && lesson.relatedLearningStructureIds.length > 0) {
    const chunks = [];
    const ids = lesson.relatedLearningStructureIds;
    const chunkSize = 30;
    
    for (let i = 0; i < ids.length; i += chunkSize) {
        chunks.push(ids.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      const snap = await adminDb
        .collection("learningStructures")
        .where(FieldPath.documentId(), "in", chunk)
        .get();

      snap.forEach((doc) => {
        const data = doc.data() as any;
        const meta = data.metadata || {};
        structures.push({
          id: doc.id,
          ...data,
          metadata: {
            createdAt: meta.createdAt?.toMillis
              ? meta.createdAt.toMillis()
              : meta.createdAt ?? null,
            updatedAt: meta.updatedAt?.toMillis
              ? meta.updatedAt.toMillis()
              : meta.updatedAt ?? null,
          },
        } as LearningStructure);
      });
    }
  }

  return (
    <div className="p-4 space-y-6">
      <Header
        heading={tPage("lessonHeading")}
        subheading={tPage("lessonSubheading", { title: lesson.title })}
        backHref={`/hub/material-manager/lessons/${lessonId}`}
      />

      <LessonComponentsManager vocabulary={vocabulary} structures={structures} />
    </div>
  );
}
