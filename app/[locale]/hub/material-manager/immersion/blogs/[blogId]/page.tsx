import { BlogForm } from "@/components/immersion/BlogForm";
import { immersionService } from "@/services/learning/immersionService";
import { notFound } from "next/navigation";

interface EditBlogPageProps {
  params: Promise<{
    blogId: string;
  }>;
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { blogId } = await params;
  const blog = await immersionService.getBlogById(blogId);

  if (!blog) {
    notFound();
  }

  return (
    <div className="container-padding">
      <BlogForm initialData={blog} />
    </div>
  );
}
