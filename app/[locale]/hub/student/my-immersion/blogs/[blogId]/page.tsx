import { Container } from "@/components/ui/container";
import { Header } from "@/components/ui/header";
import { immersionService } from "@/services/learning/immersionService";
import { notFound } from "next/navigation";
import { SimpleEditor } from "@/components/immersion/SimpleEditor";
import { format } from "date-fns";

interface BlogPageProps {
  params: Promise<{
    blogId: string;
  }>;
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { blogId } = await params;
  const blog = await immersionService.getBlogById(blogId);

  if (!blog) {
    notFound();
  }

  return (
    <Container>
      <Header
        heading={blog.title}
        subheading={`Published on ${format(
          blog.createdAt as Date,
          "MMMM dd, yyyy",
        )}`}
        backHref="/hub/student/my-immersion/blogs"
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="rounded-lg overflow-hidden border shadow-sm">
          <img
            src={blog.coverImageUrl}
            alt={blog.title}
            className="w-full h-auto max-h-[400px] object-cover"
          />
        </div>

        <div className="bg-card rounded-lg p-6 border shadow-sm">
          {/* We use a Client Component wrapper for the editor if needed, 
              but SimpleEditor is "use client" so it works here as a leaf. 
              However, passing data to it is fine. 
          */}
          <SimpleEditor content={blog.content} editable={false} />
        </div>
      </div>
    </Container>
  );
}
