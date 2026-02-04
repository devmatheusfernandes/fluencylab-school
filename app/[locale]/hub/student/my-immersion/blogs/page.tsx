import { BlogPageContent, BlogSkeleton } from "@/components/immersion/BlogList";
import { Header } from "@/components/ui/header";
import { immersionService } from "@/services/learning/immersionService";
import { Suspense } from "react";

export default async function StudentBlogsPage() {
  // Buscando dados reais
  const [blogs, popularBlogs] = await Promise.all([
    immersionService.getAllBlogs(),
    immersionService.getPopularBlogs(),
  ]);

  return (
    <div className="container mx-auto max-w-7xl p-6 md:p-10 space-y-10">
      <Header
        heading="Immersion Blog"
        subheading="Explore articles and tutorials to enhance your skills."
        backHref="/hub/student/my-immersion"
      />

      <Suspense fallback={<BlogSkeleton />}>
        {blogs.length > 0 ? (
          <BlogPageContent blogs={blogs} popularBlogs={popularBlogs} />
        ) : (
          <p className="text-center text-muted-foreground py-20">
            No new posts found.
          </p>
        )}
      </Suspense>
    </div>
  );
}
