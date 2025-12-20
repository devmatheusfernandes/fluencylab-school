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
  transcriptions?: Transcription[];
}

export interface Transcription {
  id?: string;
  date: any;
  content: string;
  summary?: string;
  callId?: string;
  status?: 'pending' | 'available' | 'failed';
  updatedAt?: any;
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
