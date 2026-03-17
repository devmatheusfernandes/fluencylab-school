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
  completedAt: any;
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

export interface PlacementTest {
  id: string;
  date: string;
  completed: boolean;
  totalScore: number;
  abilitiesCompleted: Record<string, boolean>;
  abilitiesScore: Record<string, number>;
  createdAt: Date;
}

export interface PlacementTestResult {
  date: string;
  completed: boolean;
  totalScore: number;
  abilitiesCompleted: Record<string, boolean>;
  id: string;
  createdAt: number;
}
