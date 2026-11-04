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
};
