export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOption: string;
  level: Level;
  topics: string[];
  audioUrl?: string;
}

export interface DiagnosticResult {
  [topic: string]: number;
}

export interface HistoryItem {
  id: string;
  assignedLevel: string;
  totalScore: number;
  language: "en" | "pt";
  completedAt: any; // Firestore Timestamp
  diagnostics: DiagnosticResult;
  averageTimePerQuestion?: number;
}

export interface AdaptiveState {
  currentQuestionId: string | null;
  usedQuestionIds: string[];
  answers: Record<string, string>;
  currentLevel: Level;
  questionCount: number;
  history: Array<{
    questionId: string;
    isCorrect: boolean;
    level: Level;
    timeTaken: number;
    skipped: boolean;
  }>;
}
