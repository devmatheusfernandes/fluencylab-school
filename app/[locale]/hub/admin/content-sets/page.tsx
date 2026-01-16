import { adminDb } from '@/lib/firebase/admin';
import { ContentSet } from '@/types/content';
import { ContentSetsList } from '@/components/admin/ContentSetsList';

export const metadata = {
  title: 'Content Sets | FluencyLab Admin',
};

export default async function ContentSetsPage() {
  let sets: ContentSet[] = [];

  try {
    const snapshot = await adminDb
      .collection('contentSets')
      .orderBy('metadata.createdAt', 'desc')
      .get();

    sets = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        metadata: {
          createdAt: (data.metadata?.createdAt as any)?.toDate?.() || new Date(),
          updatedAt: (data.metadata?.updatedAt as any)?.toDate?.() || new Date(),
        },
      } as unknown as ContentSet;
    });
    
    // Serialization hack
    sets = JSON.parse(JSON.stringify(sets));
  } catch (error) {
    console.error('Error fetching content sets:', error);
  }

  return (
    <div className="w-full mx-auto">
      <ContentSetsList sets={sets} />
    </div>
  );
}
