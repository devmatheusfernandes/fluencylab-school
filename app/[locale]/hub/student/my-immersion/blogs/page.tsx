import { Container } from "@/components/ui/container";
import { Header } from "@/components/ui/header";
import { immersionService } from "@/services/learning/immersionService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";

export default async function StudentBlogsPage() {
  const blogs = await immersionService.getAllBlogs();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Header
        heading="Blogs"
        subheading="Read and expand your vocabulary."
        backHref="/hub/student/my-immersion"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground">
            No blogs available yet.
          </p>
        ) : (
          blogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/hub/student/my-immersion/blogs/${blog.id}`}
            >
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full overflow-hidden p-0!">
                <div className="h-48 w-full overflow-hidden">
                  <Image
                    width={400}
                    height={250}
                    src={blog.coverImageUrl}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform hover:scale-101 duration-300 ease-in-out"
                  />
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="line-clamp-2">{blog.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    Published on{" "}
                    {format(blog.createdAt as Date, "MMM dd, yyyy")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
