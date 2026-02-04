import { adminDb } from "@/lib/firebase/admin";
import {
  Podcast,
  Blog,
  UserPodcastProgress,
  CreatePodcastDTO,
  UpdatePodcastDTO,
  CreateBlogDTO,
  UpdateBlogDTO,
} from "@/types/learning/immersion";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

const podcastsCollection = adminDb.collection("podcasts");
const blogsCollection = adminDb.collection("blogs");
const progressCollection = adminDb.collection("userPodcastProgress");

export class ImmersionRepository {
  // --- Podcasts ---

  async createPodcast(podcast: CreatePodcastDTO): Promise<Podcast> {
    try {
      const newPodcast: Podcast = {
        ...podcast,
        id: podcastsCollection.doc().id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Clean up undefined values
      const cleanedPodcast = JSON.parse(
        JSON.stringify(newPodcast, (key, value) => {
          if (value === undefined) return null;
          return value;
        })
      );

      await podcastsCollection.doc(cleanedPodcast.id).set(cleanedPodcast);
      return newPodcast;
    } catch (error) {
      console.error("Error creating podcast in repository:", error);
      throw error;
    }
  }

  async updatePodcast(id: string, data: UpdatePodcastDTO): Promise<void> {
    try {
      await podcastsCollection.doc(id).update({
        ...data,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error(`Error updating podcast ${id} in repository:`, error);
      throw error;
    }
  }

  async deletePodcast(id: string): Promise<void> {
    try {
      await podcastsCollection.doc(id).delete();
    } catch (error) {
      console.error(`Error deleting podcast ${id} in repository:`, error);
      throw error;
    }
  }

  async findPodcastById(id: string): Promise<Podcast | null> {
    try {
      const doc = await podcastsCollection.doc(id).get();
      if (!doc.exists) return null;
      const data = doc.data()!;
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : data.createdAt,
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate()
            : data.updatedAt,
      } as Podcast;
    } catch (error) {
      console.error(`Error fetching podcast ${id} in repository:`, error);
      throw error;
    }
  }

  async findAllPodcasts(): Promise<Podcast[]> {
    try {
      const snapshot = await podcastsCollection
        .orderBy("createdAt", "desc")
        .get();
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : data.createdAt,
          updatedAt:
            data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate()
              : data.updatedAt,
        } as Podcast;
      });
    } catch (error) {
      console.error("Error fetching all podcasts in repository:", error);
      throw error;
    }
  }

  // --- Blogs ---

  async createBlog(blog: CreateBlogDTO): Promise<Blog> {
    try {
      const newBlog: Blog = {
        ...blog,
        views: 0,
        id: blogsCollection.doc().id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const cleanedBlog = JSON.parse(
        JSON.stringify(newBlog, (key, value) => {
          if (value === undefined) return null;
          return value;
        })
      );

      await blogsCollection.doc(cleanedBlog.id).set(cleanedBlog);
      return newBlog;
    } catch (error) {
      console.error("Error creating blog in repository:", error);
      throw error;
    }
  }

  async updateBlog(id: string, data: UpdateBlogDTO): Promise<void> {
    try {
      await blogsCollection.doc(id).update({
        ...data,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error(`Error updating blog ${id} in repository:`, error);
      throw error;
    }
  }

  async deleteBlog(id: string): Promise<void> {
    try {
      await blogsCollection.doc(id).delete();
    } catch (error) {
      console.error(`Error deleting blog ${id} in repository:`, error);
      throw error;
    }
  }

  async findBlogById(id: string): Promise<Blog | null> {
    try {
      const doc = await blogsCollection.doc(id).get();
      if (!doc.exists) return null;
      const data = doc.data()!;
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : data.createdAt,
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate()
            : data.updatedAt,
      } as Blog;
    } catch (error) {
      console.error(`Error fetching blog ${id} in repository:`, error);
      throw error;
    }
  }

  async findAllBlogs(): Promise<Blog[]> {
    try {
      const snapshot = await blogsCollection.orderBy("createdAt", "desc").get();
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : data.createdAt,
          updatedAt:
            data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate()
              : data.updatedAt,
        } as Blog;
      });
    } catch (error) {
      console.error("Error fetching all blogs in repository:", error);
      throw error;
    }
  }

  async incrementBlogViews(id: string): Promise<void> {
    try {
      await blogsCollection.doc(id).update({
        views: FieldValue.increment(1),
      });
    } catch (error) {
      console.error(`Error incrementing views for blog ${id}:`, error);
    }
  }

  async findPopularBlogs(limit: number = 3): Promise<Blog[]> {
    try {
      const snapshot = await blogsCollection
        .orderBy("views", "desc")
        .limit(limit)
        .get();
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : data.createdAt,
          updatedAt:
            data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate()
              : data.updatedAt,
        } as Blog;
      });
    } catch (error) {
      console.error("Error fetching popular blogs in repository:", error);
      throw error;
    }
  }

  // --- Progress ---

  async savePodcastProgress(
    userId: string,
    podcastId: string,
    lastPosition: number,
    isCompleted: boolean
  ): Promise<void> {
    try {
      const id = `${userId}_${podcastId}`;
      const progressData: UserPodcastProgress = {
        userId,
        podcastId,
        lastPosition,
        isCompleted,
        updatedAt: new Date(),
      };
      
      // Use set with merge: true to create or update
      await progressCollection.doc(id).set(progressData, { merge: true });
    } catch (error) {
      console.error(
        `Error saving progress for user ${userId} podcast ${podcastId}:`,
        error
      );
      throw error;
    }
  }

  async getPodcastProgress(
    userId: string,
    podcastId: string
  ): Promise<UserPodcastProgress | null> {
    try {
      const id = `${userId}_${podcastId}`;
      const doc = await progressCollection.doc(id).get();
      if (!doc.exists) return null;
      const data = doc.data()!;
      return {
        ...data,
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate()
            : data.updatedAt,
      } as UserPodcastProgress;
    } catch (error) {
      console.error(
        `Error fetching progress for user ${userId} podcast ${podcastId}:`,
        error
      );
      throw error;
    }
  }

  async getAllUserPodcastProgress(
    userId: string
  ): Promise<UserPodcastProgress[]> {
    try {
      const snapshot = await progressCollection
        .where("userId", "==", userId)
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          updatedAt:
            data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate()
              : data.updatedAt,
        } as UserPodcastProgress;
      });
    } catch (error) {
      console.error(
        `Error fetching all podcast progress for user ${userId}:`,
        error
      );
      throw error;
    }
  }
}
