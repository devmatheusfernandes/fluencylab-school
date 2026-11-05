import type { Student } from "@/lib/demo-data";

export type Brand = { name: string; color: string; slug: string };

export type TeacherCtx = {
  students: Student[];
  markPaid: (id: string) => void;
  autoBlock: boolean;
  setAutoBlock: (value: boolean) => void;
  brand: Brand;
  setBrand: (brand: Brand) => void;
  notify: (message: string) => void;
  /** Abre a página de detalhes do aluno. */
  openStudent: (studentId: string) => void;
  /** Abre a sala de aula (caderno colaborativo + vídeo). */
  openClassroom: (studentName: string, notebookTitle?: string) => void;
};
