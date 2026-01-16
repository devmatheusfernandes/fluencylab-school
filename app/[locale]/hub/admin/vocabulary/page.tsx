import { adminDb } from "@/lib/firebase/admin";
import { LearningItem } from "@/types/content";
import { LearningItemsList } from "@/components/admin/LearningItemsList";

export const metadata = {
  title: "Vocabulary Management | FluencyLab Admin",
};

export default async function VocabularyPage() {
  let items: LearningItem[] = [];

  try {
    const snapshot = await adminDb
      .collection("learningItems")
      .orderBy("metadata.createdAt", "desc")
      .limit(200) // Limit to 200 items for now to avoid massive initial load
      .get();

    items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        metadata: {
          createdAt:
            (data.metadata?.createdAt as any)?.toDate?.() || new Date(),
          updatedAt:
            (data.metadata?.updatedAt as any)?.toDate?.() || new Date(),
        },
      } as unknown as LearningItem;
    });

    // Serialization hack
    items = JSON.parse(JSON.stringify(items));
  } catch (error) {
    console.error("Error fetching learning items:", error);
  }

  return <LearningItemsList items={items} />;
}
