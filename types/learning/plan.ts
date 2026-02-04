import { CEFRLevel } from "./lesson";

export interface SRSData {
  interval: number; // Days until next review
  repetition: number; // Consecutive successful reviews
  easeFactor: number; // Difficulty multiplier (starts at 2.5)
  dueDate: Date | string; // Next review date
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

    // Controle de Progresso
    completedPracticeDays?: number; // Quantos dias de prática foram concluídos para esta lição (0-6)

    //Vou tratar os LearningItens e LearningStructure como Components, para ser mais fácil se referir aos dois de uma vez.
    //Acho que não vou precisar de um campo type, já que cada um deles tem um type específico. É mais para facilitar as explicaçoes nesse contexto
    //Preciso criar algum critério para marcar se algo foi aprendido ainda ou não

    //Esses dois aqui marcam o estado de cada componente para depois enviar para as listas certas: learnedComponentsIds e reviewLearnedComponentsIds
    learningItemsIds: Array<{
      id: string;
      srsData?: SRSData;
      /*Optional, initializes if missing*/ updatedAt: any;
      lastReviewedAt?: Date | string;
    }>; // IDs dos Learning Items (Vocabulário) associados à Lesson. No final de cada semana, esse item precisa estar vazio porque os componentes foram enviados para a lista correta dependento do estado (aprendido ou revisar)
    learningStructureIds: Array<{
      id: string;
      srsData?: SRSData;
      /*Optional, initializes if missing*/ updatedAt: any;
      lastReviewedAt?: Date | string;
    }>; // IDs dos Learning Structures (Gramática) associados à Lesson. No final de cada semana, esse item precisa estar vazio porque os componentes foram enviados para a lista correta dependento do estado (aprendido ou revisar)
  }>;

  //Esses dois arrays vão servir para funcionalidades futuras, o primeiro marca o que o aluno já aprendeu, os itens vão sair de learningItensIds e learningStrucutreIds para essa lista quando forem marcados como aprendidos
  learnedComponentsIds: Array<{
    id: string;
    srsData?: SRSData;
    /*Optional, initializes if missing*/ updatedAt: any;
    lastReviewedAt?: Date | string;
  }>; // IDs dos Learned Components (Itens and Structures) associados à Lesson (vamos criar uma função para isso, para definir quando algo foi aprendido)
  //Já esse aqui abaixo vai receber ids de learnedComponentsIds e vai marcar os itens que foram aprendidos e que precisam ser revisados depois de um tempo
  reviewLearnedComponentsIds: Array<{
    id: string;
    srsData?: SRSData;
    /*Optional, initializes if missing*/ updatedAt: any;
    lastReviewedAt?: Date | string;
  }>; // IDs dos Learned Components (Itens and Structures) associados à Lesson que serão revisados depois de um tempo aprendidos

  //Outros campos importantes
  createdAt: any; // Usando any para suportar tanto Timestamp (Read) quanto FieldValue (Write)
  updatedAt: any; // Usando any para suportar tanto Timestamp (Read) quanto FieldValue (Write)
  updatedBy: string; // ID do usuário que fez a última atualização
}
