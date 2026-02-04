import { useState, useTransition } from "react";
import {
  createPodcastAction,
  updatePodcastAction,
  deletePodcastAction,
  createBlogAction,
  updateBlogAction,
  deleteBlogAction,
} from "@/actions/learning/immersionActions";
import {
  CreatePodcastDTO,
  UpdatePodcastDTO,
  CreateBlogDTO,
  UpdateBlogDTO,
} from "@/types/learning/immersion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useImmersionMutations() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // --- Podcasts ---

  const createPodcast = async (data: CreatePodcastDTO) => {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const result = await createPodcastAction(data);
          toast.success("Podcast created successfully");
          router.push("/hub/material-manager/immersion/podcasts");
          resolve(result);
        } catch (error: any) {
          toast.error(error.message || "Failed to create podcast");
          reject(error);
        }
      });
    });
  };

  const updatePodcast = async (id: string, data: UpdatePodcastDTO) => {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          await updatePodcastAction(id, data);
          toast.success("Podcast updated successfully");
          router.push("/hub/material-manager/immersion/podcasts");
          resolve(true);
        } catch (error: any) {
          toast.error(error.message || "Failed to update podcast");
          reject(error);
        }
      });
    });
  };

  const deletePodcast = async (id: string) => {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          await deletePodcastAction(id);
          toast.success("Podcast deleted successfully");
          resolve(true);
        } catch (error: any) {
          toast.error(error.message || "Failed to delete podcast");
          reject(error);
        }
      });
    });
  };

  // --- Blogs ---

  const createBlog = async (data: CreateBlogDTO) => {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const result = await createBlogAction(data);
          toast.success("Blog created successfully");
          router.push("/hub/material-manager/immersion/blogs");
          resolve(result);
        } catch (error: any) {
          toast.error(error.message || "Failed to create blog");
          reject(error);
        }
      });
    });
  };

  const updateBlog = async (id: string, data: UpdateBlogDTO) => {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          await updateBlogAction(id, data);
          toast.success("Blog updated successfully");
          router.push("/hub/material-manager/immersion/blogs");
          resolve(true);
        } catch (error: any) {
          toast.error(error.message || "Failed to update blog");
          reject(error);
        }
      });
    });
  };

  const deleteBlog = async (id: string) => {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          await deleteBlogAction(id);
          toast.success("Blog deleted successfully");
          resolve(true);
        } catch (error: any) {
          toast.error(error.message || "Failed to delete blog");
          reject(error);
        }
      });
    });
  };

  return {
    isPending,
    createPodcast,
    updatePodcast,
    deletePodcast,
    createBlog,
    updateBlog,
    deleteBlog,
  };
}
