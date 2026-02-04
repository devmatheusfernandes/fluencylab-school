import { Container } from "@/components/ui/container";
import { BlogForm } from "@/components/immersion/BlogForm";
import { immersionService } from "@/services/learning/immersionService";
import { notFound } from "next/navigation";

interface EditBlogPageProps {
  params: {
    blogId: string;
  };
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const blog = await immersionService.getBlogById(params.blogId);

  if (!blog) {
    notFound();
  }

  return (
    <Container>
      <BlogForm initialData={blog} />
    </Container>
  );
}
