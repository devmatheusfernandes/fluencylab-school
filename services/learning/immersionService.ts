import { ImmersionRepository } from "@/repositories/learning/immersionRepository";
import {
  Podcast,
  Blog,
  UserPodcastProgress,
  CreatePodcastDTO,
  UpdatePodcastDTO,
  CreateBlogDTO,
  UpdateBlogDTO,
} from "@/types/learning/immersion";

const immersionRepository = new ImmersionRepository();

export class ImmersionService {
  // --- Podcasts ---

  async createPodcast(podcast: CreatePodcastDTO): Promise<Podcast> {
    return await immersionRepository.createPodcast(podcast);
  }

  async updatePodcast(id: string, data: UpdatePodcastDTO): Promise<void> {
    await immersionRepository.updatePodcast(id, data);
  }

  async deletePodcast(id: string): Promise<void> {
    await immersionRepository.deletePodcast(id);
  }

  async getPodcastById(id: string): Promise<Podcast | null> {
    return await immersionRepository.findPodcastById(id);
  }

  async getAllPodcasts(): Promise<Podcast[]> {
    return await immersionRepository.findAllPodcasts();
  }

  // --- Blogs ---

  async createBlog(blog: CreateBlogDTO): Promise<Blog> {
    return await immersionRepository.createBlog(blog);
  }

  async updateBlog(id: string, data: UpdateBlogDTO): Promise<void> {
    await immersionRepository.updateBlog(id, data);
  }

  async deleteBlog(id: string): Promise<void> {
    await immersionRepository.deleteBlog(id);
  }

  async getBlogById(id: string): Promise<Blog | null> {
    return await immersionRepository.findBlogById(id);
  }

  async getAllBlogs(): Promise<Blog[]> {
    return await immersionRepository.findAllBlogs();
  }

  async incrementBlogViews(id: string): Promise<void> {
    await immersionRepository.incrementBlogViews(id);
  }

  async getPopularBlogs(limit: number = 3): Promise<Blog[]> {
    return await immersionRepository.findPopularBlogs(limit);
  }

  // --- Progress ---

  async savePodcastProgress(
    userId: string,
    podcastId: string,
    lastPosition: number,
    isCompleted: boolean
  ): Promise<void> {
    await immersionRepository.savePodcastProgress(
      userId,
      podcastId,
      lastPosition,
      isCompleted
    );
  }

  async getPodcastProgress(
    userId: string,
    podcastId: string
  ): Promise<UserPodcastProgress | null> {
    return await immersionRepository.getPodcastProgress(userId, podcastId);
  }

  async getAllUserPodcastProgress(
    userId: string
  ): Promise<UserPodcastProgress[]> {
    return await immersionRepository.getAllUserPodcastProgress(userId);
  }
}

export const immersionService = new ImmersionService();
