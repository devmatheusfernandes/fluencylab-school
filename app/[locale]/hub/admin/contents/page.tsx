import { adminDb } from '@/lib/firebase/admin';
import { Content } from '@/types/content';
import { ContentProcessor } from '@/components/admin/ContentProcessor';
import { CreateContentForm } from '@/components/admin/CreateContentForm';
import { Header } from '@/components/ui/header';

export default async function ContentsPage() {
  let contents: Content[] = [];

  try {
    const snapshot = await adminDb.collection('contents').orderBy('metadata.createdAt', 'desc').get();
    
    contents = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        metadata: {
          createdAt: (data.metadata?.createdAt as any)?.toDate?.() || new Date(),
          updatedAt: (data.metadata?.updatedAt as any)?.toDate?.() || new Date(),
        }
      } as unknown as Content;
    });
    
    // Serialization hack
    contents = JSON.parse(JSON.stringify(contents));

  } catch (error) {
    console.error("Error fetching contents:", error);
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <Header
        heading="Content & Vocabulary Extraction"
        subheading="Manage source contents and vocabulary extraction queue."
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <CreateContentForm />
        </div>
        
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {contents.length === 0 ? (
              <div className="text-center p-8 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">No content found. Create one to get started.</p>
              </div>
            ) : (
              contents.map(content => (
                <ContentProcessor key={content.id} content={content} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
