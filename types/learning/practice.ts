import { SRSData, PracticeResult } from "../financial/plan";
import { LearningItem, TranscriptSegment } from "./lesson";

export type PracticeMode =
  | "flashcard_visual" // Dia 1: Anki com Imagem
  | "gap_fill_listening" // Dia 2: Ouvir e Escrever (Input)
  | "sentence_unscramble" // Dia 3: Gramática/Estrutura (Drag & Drop)
  | "flashcard_recall" // Dia 4: Anki sem Imagem (Puro texto)
  | "quiz_comprehensive" // Dia 5: Quiz Múltipla Escolha
  | "listening_choice" // Dia 6: Ouvir e Selecionar (Select)
  | "review_standard"; // Para itens antigos (Review Queue)

export interface DailyPracticeSession {
  mode: PracticeMode;
  dayIndex: number; // 1 a 6
  items: PracticeItem[];
  error?: string;
}

export interface PracticeItem {
  id: string; // ID do LearningItem ou Structure
  type: "item" | "structure";
  renderMode: PracticeMode; // O item sabe como deve ser renderizado

  // Dados comuns
  mainText: string;
  context?: string;

  // Dados específicos por modo
  flashcard?: {
    front: string;
    back: string;
    imageUrl?: string | null;
    audioUrl?: string | null;
  };

  gapFill?: {
    sentenceWithGap: string; // "I ____ to the park"
    correctAnswer: string; // "ran"
    audioSegment?: { start: number; end: number; url: string };
  };

  unscramble?: {
    scrambledWords: string[]; // ["park", "to", "I", "ran"]
    correctOrder: string[]; // ["I", "ran", "to", "park"]
  };

  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
    sectionType?: string;
    audioSegment?: { start: number; end: number; url: string };
  };

  interactiveListening?: {
    audioUrl: string;
    transcriptSegments: TranscriptSegment[];
    learningItems: LearningItem[];
  };

  srsData?: SRSData; // Para debug ou mostrar progresso
}

export interface PracticeSessionState {
  planId: string;
  currentDay: number;
  mode: PracticeMode;
  currentIndex: number;
  results: PracticeResult[];
  items: PracticeItem[];
  lastUpdated: any; // Timestamp
}
