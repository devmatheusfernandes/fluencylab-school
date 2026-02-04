import { Timestamp } from 'firebase-admin/firestore';

export interface Podcast {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  transcription?: string | null;
  duration: number; // in seconds
  coverImageUrl?: string | null;
  language: string;
  level?: string | null;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface Blog {
  id: string;
  title: string;
  coverImageUrl: string;
  content: string; // HTML string from TipTap
  categories: string[];
  views: number;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface UserPodcastProgress {
  userId: string;
  podcastId: string;
  lastPosition: number; // in seconds
  isCompleted: boolean;
  updatedAt: Timestamp | Date;
}

export type CreatePodcastDTO = Omit<Podcast, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePodcastDTO = Partial<Omit<Podcast, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateBlogDTO = Omit<Blog, 'id' | 'createdAt' | 'updatedAt' | 'views'>;
export type UpdateBlogDTO = Partial<Omit<Blog, 'id' | 'createdAt' | 'updatedAt' | 'views'>>;
