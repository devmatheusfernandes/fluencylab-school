import { adminDb } from '@/lib/firebase/admin';
import { Content } from '@/types/content';
import { QuizEditor } from '@/components/admin/QuizEditor';
import { notFound } from 'next/navigation';

interface QuizPageProps {
  params: Promise<{
    contentId: string;
  }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { contentId } = await params;
  const contentRef = adminDb.collection('contents').doc(contentId);
  const contentSnap = await contentRef.get();

  if (!contentSnap.exists) {
    notFound();
  }

  const contentData = { id: contentSnap.id, ...contentSnap.data() } as Content;

  // Ensure dates are serialized properly if they are Firestore Timestamps
  // This is a simple serialization for the client component
  const serializedContent = JSON.parse(JSON.stringify(contentData));

  return (
    <div className="container mx-auto py-8 px-4">
      <QuizEditor content={serializedContent} />
    </div>
  );
}
