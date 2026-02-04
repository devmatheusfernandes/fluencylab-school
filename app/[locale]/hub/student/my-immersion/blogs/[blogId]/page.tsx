import { immersionService } from "@/services/learning/immersionService";
import { notFound } from "next/navigation";
import { BlogArticleViewer } from "@/components/immersion/BlogArticleViewer"; // Importe o componente criado acima

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

  return <BlogArticleViewer blog={blog} />;
}
