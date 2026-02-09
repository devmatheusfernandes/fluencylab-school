import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { immersionService } from "@/services/learning/immersionService";
import Link from "next/link";
import { Plus, Edit, Container } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default async function BlogsPage() {
  const blogs = await immersionService.getAllBlogs();

  return (
    <div className="container-padding">
      <Header
        heading="Blogs"
        subheading="Manage your blogs here."
        icon={
          <Link href="/hub/material-manager/immersion/blogs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Blog
            </Button>
          </Link>
        }
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No blogs found.
                </TableCell>
              </TableRow>
            ) : (
              blogs.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell>
                    <img
                      src={blog.coverImageUrl}
                      alt={blog.title}
                      className="h-10 w-16 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{blog.title}</TableCell>
                  <TableCell>
                    {format(blog.createdAt as Date, "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/hub/material-manager/immersion/blogs/${blog.id}`}
                    >
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
