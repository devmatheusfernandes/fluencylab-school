import { adminDb } from "@/lib/firebase/admin";
import {
  Lesson,
  LearningItem,
  LearningStructure,
} from "@/types/learning/lesson";
import { FieldPath } from "firebase-admin/firestore";
import { Header } from "@/components/ui/header";
import ErrorAlert from "@/components/ui/error-alert";
import { getTranslations } from "next-intl/server";
import { LessonCreationFlow } from "@/components/lessons/creation/LessonCreationFlow";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const t = await getTranslations("MaterialManager");

  const lessonRef = adminDb.collection("lessons").doc(lessonId);
  const lessonSnap = await lessonRef.get();

  if (!lessonSnap.exists) {
    return (
      <div className="p-4 md:p-8">
        <ErrorAlert message={t("lessonNotFound")} />
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
        : (rawLesson.metadata?.createdAt ?? null),
      updatedAt: rawLesson.metadata?.updatedAt?.toMillis
        ? rawLesson.metadata.updatedAt.toMillis()
        : (rawLesson.metadata?.updatedAt ?? null),
    },
  };

  // Fetch Vocabulary
  let vocabulary: LearningItem[] = [];
  if (
    lesson.relatedLearningItemIds &&
    lesson.relatedLearningItemIds.length > 0
  ) {
    const chunks = [];
    const ids = lesson.relatedLearningItemIds;
    const chunkSize = 30;

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
              : (meta.createdAt ?? null),
            updatedAt: meta.updatedAt?.toMillis
              ? meta.updatedAt.toMillis()
              : (meta.updatedAt ?? null),
          },
        } as LearningItem);
      });
    }
  }

  // Fetch Structures
  let structures: LearningStructure[] = [];
  if (
    lesson.relatedLearningStructureIds &&
    lesson.relatedLearningStructureIds.length > 0
  ) {
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
              : (meta.createdAt ?? null),
            updatedAt: meta.updatedAt?.toMillis
              ? meta.updatedAt.toMillis()
              : (meta.updatedAt ?? null),
          },
        } as LearningStructure);
      });
    }
  }

  return (
    <div className="container-padding overflow-hidden">
      <Header
        heading={lesson.title}
        subheading={t("description")}
        backHref="/hub/material-manager/lessons"
      />
      <div>
        <LessonCreationFlow
          lesson={lesson}
          vocabulary={vocabulary}
          structures={structures}
        />
      </div>
    </div>
  );
}
