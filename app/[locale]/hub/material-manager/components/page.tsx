import { adminDb } from "@/lib/firebase/admin";
import { LearningItem, LearningStructure } from "@/types/lesson";
import LessonComponentsManager from "@/components/lessons/LessonComponentsManager";

export const metadata = {
  title: "Componentes Globais | FluencyLab",
};

export default async function Page() {
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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Componentes Globais</h1>
        <p className="text-gray-500">
          Todos os itens de vocabulário e estruturas com possibilidade de edição.
        </p>
      </div>

      <LessonComponentsManager vocabulary={vocabulary} structures={structures} />
    </div>
  );
}
