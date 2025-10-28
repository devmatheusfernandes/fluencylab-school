// types/notebooks/notebooks.ts

export interface Notebook {
  id: string;
  title: string;
  description: string;
  content: any;
  student: string;
  studentName?: string;
  createdAt: Date;
  updatedAt: Date;
}