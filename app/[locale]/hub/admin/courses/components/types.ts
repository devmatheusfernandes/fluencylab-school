// --- Interfaces
export interface QuizQuestion {
  id: string; 
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizResult {
  userId: string;
  courseId: string;
  lessonId: string;
  answers: Record<string, string>;
  score: number;
  totalQuestions: number;
  percentage: number;
  correct: boolean;
  submittedAt: any;
  lessonTitle: string;
}

export interface Attachment {
  id: string; 
  name: string; 
  url: string; 
  type: string; 
  size: number; 
}

export interface TextContentBlock {
  type: 'text';
  id: string; 
  content: string; 
}

export interface VideoContentBlock {
  type: 'video';
  id: string; 
  url: string; 
}

export type LessonContentBlock = TextContentBlock | VideoContentBlock; 

export interface Lesson {
  sectionId: string;
  id: string;
  title: string;
  order: number;
  contentBlocks: LessonContentBlock[];
  quiz?: QuizQuestion[];
  attachments?: Attachment[];
}

export interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  language: string;
  description: string;
  imageUrl: string;
  duration: string;
  role: string;
  sections?: Section[];
  totalLessons?: number;
  lessons?: any[];
  completed?: boolean;
  lessonCount?: number; // Total number of lessons in the course
  sectionCount?: number; // Total number of sections in the course
}

export interface Enrollment {
    courseId: string;
    userId: string;
    enrolledAt: any;
    progress?: { [lessonId: string]: boolean }; // Map lessonId to completion status
    completed?: boolean;
    lastAccessed?: any;
}