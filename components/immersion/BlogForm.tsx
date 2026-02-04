"use client";

import { useState } from "react";
import { Blog } from "@/types/learning/immersion";
import { useImmersionMutations } from "@/hooks/learning/useImmersion";
import { Loader2, Trash } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SimpleEditor } from "./SimpleEditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const CATEGORIES = [
  "Productivity",
  "Development",
  "UI/UX",
  "Tutorials",
];

interface BlogFormProps {
  initialData?: Blog;
}

export function BlogForm({ initialData }: BlogFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [categories, setCategories] = useState<string[]>(
    initialData?.categories || []
  );

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(
    initialData?.coverImageUrl || null,
  );
  const [isUploading, setIsUploading] = useState(false);

  const { createBlog, updateBlog, deleteBlog, isPending } =
    useImmersionMutations();
  const router = useRouter();

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setCoverFile(file);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/uploads/immersion/blog-cover", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setCoverUrl(data.url);
      toast.success("Cover uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload cover");
      setCoverFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }
    if (!coverUrl) {
      toast.error("Please upload a cover image");
      return;
    }

    try {
      const data = {
        title,
        content,
        coverImageUrl: coverUrl,
        categories,
      };

      if (initialData) {
        await updateBlog(initialData.id, data);
      } else {
        await createBlog(data);
      }
    } catch (error) {
      // Error handled in hook
    }
  };

  const onDelete = async () => {
    if (initialData) {
      if (confirm("Are you sure you want to delete this blog?")) {
        await deleteBlog(initialData.id);
        router.push("/hub/material-manager/immersion/blogs");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {initialData ? "Edit Blog" : "Create Blog"}
        </h2>
        {initialData && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isPending}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            disabled={isPending}
            placeholder="Blog title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cover">Cover Image</Label>
          <div className="flex items-center gap-4">
            <Input
              id="cover"
              type="file"
              accept="image/*"
              disabled={isPending || isUploading}
              onChange={onUpload}
            />
            {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          {coverUrl && (
            <div className="mt-2 relative aspect-video w-64 rounded-lg overflow-hidden border">
              <img
                src={coverUrl}
                alt="Cover preview"
                className="object-cover w-full h-full"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Categories</Label>
          <div className="flex flex-wrap gap-4 pt-2">
            {CATEGORIES.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`cat-${category}`}
                  checked={categories.includes(category)}
                  onCheckedChange={(checked) => {
                    setCategories((prev) =>
                      checked
                        ? [...prev, category]
                        : prev.filter((c) => c !== category)
                    );
                  }}
                />
                <Label
                  htmlFor={`cat-${category}`}
                  className="font-normal cursor-pointer"
                >
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Content</Label>
          <SimpleEditor
            content={content}
            onChange={setContent}
            editable={!isPending}
          />
        </div>

        <Button type="submit" disabled={isPending || isUploading}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Save Changes" : "Create Blog"}
        </Button>
      </form>
    </div>
  );
}
