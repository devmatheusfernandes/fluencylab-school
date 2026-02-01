import { adminDb } from "@/lib/firebase/admin";
import { LearningItem, LearningStructure } from "@/types/learning/lesson";
import LessonComponentsManager from "@/components/lessons/LessonComponentsManager";
import { Header } from "@/components/ui/header";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Componentes Globais | FluencyLab",
};

export default async function Page() {
  const tPage = await getTranslations("LessonComponentsPage");

  let vocabulary: LearningItem[] = [];
  let structures: LearningStructure[] = [];

  try {
    const vocabSnapshot = await adminDb
      .collection("learningItems")
      .orderBy("metadata.createdAt", "desc")
      .limit(200)
      .get();

    vocabulary = vocabSnapshot.docs.map((doc) => {
      const data = doc.data() as any;
      const meta = data.metadata || {};
      return {
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
      } as LearningItem;
    });

    const structSnapshot = await adminDb
      .collection("learningStructures")
      .orderBy("metadata.createdAt", "desc")
      .limit(200)
      .get();

    structures = structSnapshot.docs.map((doc) => {
      const data = doc.data() as any;
      const meta = data.metadata || {};
      return {
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
      } as LearningStructure;
    });

    vocabulary = JSON.parse(JSON.stringify(vocabulary));
    structures = JSON.parse(JSON.stringify(structures));
  } catch (error) {
    console.error("Error fetching components:", error);
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w7xl">
      <Header
        heading={tPage("globalHeading")}
        subheading={tPage("globalSubheading")}
      />

      <LessonComponentsManager vocabulary={vocabulary} structures={structures} />
    </div>
  );
}
