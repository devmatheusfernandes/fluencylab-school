"use server";

import { immersionService } from "@/services/learning/immersionService";
import {
  CreatePodcastDTO,
  UpdatePodcastDTO,
  CreateBlogDTO,
  UpdateBlogDTO,
} from "@/types/learning/immersion";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { getUserById_Admin } from "@/repositories/admin/userAdminRepository";
import { UserRoles } from "@/types/users/userRoles";

// --- Podcasts ---

export async function createPodcastAction(data: CreatePodcastDTO) {
  const user = await requireAuth();
  const userDb = await getUserById_Admin(user.id);
  
  if (!userDb || (userDb.role !== UserRoles.MATERIAL_MANAGER && userDb.role !== UserRoles.ADMIN)) {
    throw new Error("Unauthorized");
  }

  const result = await immersionService.createPodcast(data);
  revalidatePath("/hub/material-manager/immersion/podcasts");
  revalidatePath("/hub/student/my-immersion/podcasts");
  return result;
}

export async function updatePodcastAction(id: string, data: UpdatePodcastDTO) {
  const user = await requireAuth();
  const userDb = await getUserById_Admin(user.id);
  
  if (!userDb || (userDb.role !== UserRoles.MATERIAL_MANAGER && userDb.role !== UserRoles.ADMIN)) {
    throw new Error("Unauthorized");
  }

  await immersionService.updatePodcast(id, data);
  revalidatePath("/hub/material-manager/immersion/podcasts");
  revalidatePath("/hub/student/my-immersion/podcasts");
}

export async function deletePodcastAction(id: string) {
  const user = await requireAuth();
  const userDb = await getUserById_Admin(user.id);
  
  if (!userDb || (userDb.role !== UserRoles.MATERIAL_MANAGER && userDb.role !== UserRoles.ADMIN)) {
    throw new Error("Unauthorized");
  }

  await immersionService.deletePodcast(id);
  revalidatePath("/hub/material-manager/immersion/podcasts");
  revalidatePath("/hub/student/my-immersion/podcasts");
}

// --- Blogs ---

export async function createBlogAction(data: CreateBlogDTO) {
  const user = await requireAuth();
  const userDb = await getUserById_Admin(user.id);
  
  if (!userDb || (userDb.role !== UserRoles.MATERIAL_MANAGER && userDb.role !== UserRoles.ADMIN)) {
    throw new Error("Unauthorized");
  }

  const result = await immersionService.createBlog(data);
  revalidatePath("/hub/material-manager/immersion/blogs");
  revalidatePath("/hub/student/my-immersion/blogs");
  return result;
}

export async function updateBlogAction(id: string, data: UpdateBlogDTO) {
  const user = await requireAuth();
  const userDb = await getUserById_Admin(user.id);
  
  if (!userDb || (userDb.role !== UserRoles.MATERIAL_MANAGER && userDb.role !== UserRoles.ADMIN)) {
    throw new Error("Unauthorized");
  }

  await immersionService.updateBlog(id, data);
  revalidatePath("/hub/material-manager/immersion/blogs");
  revalidatePath("/hub/student/my-immersion/blogs");
}

export async function deleteBlogAction(id: string) {
  const user = await requireAuth();
  const userDb = await getUserById_Admin(user.id);
  
  if (!userDb || (userDb.role !== UserRoles.MATERIAL_MANAGER && userDb.role !== UserRoles.ADMIN)) {
    throw new Error("Unauthorized");
  }

  await immersionService.deleteBlog(id);
  revalidatePath("/hub/material-manager/immersion/blogs");
  revalidatePath("/hub/student/my-immersion/blogs");
}

// --- Progress ---

export async function savePodcastProgressAction(
  podcastId: string,
  lastPosition: number,
  isCompleted: boolean
) {
  try {
    const user = await requireAuth();
    
    // Validate inputs
    if (!podcastId) return;
    if (typeof lastPosition !== 'number' || isNaN(lastPosition)) return;

    await immersionService.savePodcastProgress(
      user.id,
      podcastId,
      lastPosition,
      isCompleted
    );

    // Revalidate path - wrapped in try/catch to prevent action failure if path is not found
    try {
      revalidatePath(`/hub/student/my-immersion/podcasts/${podcastId}`);
    } catch (error) {
      console.warn("Failed to revalidate podcast page:", error);
    }
  } catch (error) {
    console.error("Error saving podcast progress:", error);
    throw new Error("Failed to save progress");
  }
}
