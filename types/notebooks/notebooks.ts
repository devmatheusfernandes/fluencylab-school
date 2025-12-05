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

  language?: string;
  unit?: string;
  workbook?: string;
  docID?: string;
}

export interface Workbook {
  id: string;
  title: string;
  level:
    | "Primeiros Passos"
    | "Essencial"
    | "Mergulho"
    | "Avançado"
    | "Específicos";
  coverURL: string;
  guidelines?: string;
}

export type OrganizedNotebooks = {
  [language: string]: {
    [workbook: string]: Notebook[];
  };
};
