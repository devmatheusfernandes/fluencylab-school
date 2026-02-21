import { CEFRLevel } from "./lesson";

export interface SRSData {
  interval: number;
  repetition: number;
  easeFactor: number;
  dueDate: Date | string;
}

export interface PracticeResult {
  itemId: string;
  grade: ReviewGrade;
  type: "item" | "structure";
  timestamp?: Date | string;
}

export type ReviewGrade = 0 | 1 | 2 | 3 | 4 | 5;
// 0-2: Fail (Again)
// 3: Hard
// 4: Good
// 5: Easy

export type PlanStatus = "draft" | "active" | "completed" | "archived";
export type PlanType = "template" | "student";

export type SRSStatus = "new" | "learning" | "learned" | "mastered";

export interface PlanSRSState extends SRSData {
  type: "item" | "structure";
  lastReviewedAt?: Date | string;
  status: SRSStatus;
}

//Estrutura do plano de aulas
export interface Plan {
  id: string; // ID do Firestore

  // Contexto do Plano
  type: PlanType; // Define se é um modelo (template) ou um plano atribuído a um aluno
  status: PlanStatus; // Ciclo de vida do plano
  studentId?: string; // ID do aluno (Obrigatório se type === 'student')

  // Conteúdo Base
  name: string; // Nome do Plano
  goal?: string; // Objetivo do Plano
  level: CEFRLevel; // Nível de Aula

  lessons: Array<{
    id: string; // ID da Lesson import { Lesson } from "./lesson";
    title: string; // Título da Lesson (Denormalizado para UI rápida)
    order: number; // Ordem na Sequência do Plano

    // Conexão com a Agenda
    scheduledClassId?: string; // ID da aula agendada (StudentClass) vinculada a esta lição
    scheduledDate?: Date | string; // Data agendada (redundância útil para UI)

    completedPracticeDays?: number;

    learningItemsIds: Array<{
      id: string;
    }>;
    learningStructureIds: Array<{
      id: string;
    }>;
  }>;

  srsMap: Record<string, PlanSRSState>;

  //Outros campos importantes
  createdAt: any; // Usando any para suportar tanto Timestamp (Read) quanto FieldValue (Write)
  updatedAt: any; // Usando any para suportar tanto Timestamp (Read) quanto FieldValue (Write)
  updatedBy: string; // ID do usuário que fez a última atualização
}
