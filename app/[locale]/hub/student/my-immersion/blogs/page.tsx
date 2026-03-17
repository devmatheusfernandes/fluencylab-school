import { BlogPageContent } from "@/components/immersion/BlogList";
import { Header } from "@/components/ui/header";
import BreadcrumbActions from "@/components/shared/Breadcrum/BreadcrumbActions";
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyDescription,
} from "@/components/ui/empty";
import { immersionService } from "@/services/learning/immersionService";
import { ArrowLeft, Newspaper } from "lucide-react";
import Link from "next/link";

export default async function StudentBlogsPage() {
  const [blogs, popularBlogs] = await Promise.all([
    immersionService.getAllBlogs(),
    immersionService.getPopularBlogs(),
  ]);

  return (
    <div className="container-padding space-y-6">
      <Header
        heading="Immersion Blog"
        subheading="Explore articles and tutorials to enhance your skills."
        backHref="/hub/student/my-immersion"
      />
      <BreadcrumbActions placement="start">
        <Link
          href="/hub/student/my-immersion"
          className="inline-flex items-center justify-center rounded-md p-2.5 h-10 w-10 text-foreground transition-opacity active:opacity-70 focus:outline-none"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </BreadcrumbActions>

      {blogs.length > 0 ? (
        <BlogPageContent blogs={blogs} popularBlogs={popularBlogs} />
      ) : (
        <Empty className="py-24">
          <EmptyMedia>
            <Newspaper size={48} className="text-primary" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyDescription>No new posts found.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
