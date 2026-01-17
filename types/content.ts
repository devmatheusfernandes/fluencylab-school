
// Tipos permitidos para categorização gramatical
export type LearningItemType = 
  | 'noun' 
  | 'verb' 
  | 'adjective' 
  | 'adverb' 
  | 'preposition' 
  | 'pronoun' 
  | 'phrasal_verb' 
  | 'idiom' 
  | 'expression' 
  | 'slang' 
  | 'connector';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// 1. O Item de Aprendizado Final (Salvo na collection learningItems)
export interface LearningItem {
  id: string;          // ID do Firestore
  slug: string;        // ID Lógico: "run_verb" (para busca)
  language: string;    // "en"
  level: CEFRLevel;
  type: LearningItemType;
  
  mainText: string;    // "run"
  phonetic?: string;   // "/rʌn/"
  imageUrl?: string | null; // URL da imagem ilustrativa

  meanings: Array<{
    context: string;       // "Physical activity"
    definition: string;    // "To move fast..."
    translation: string;   // "Correr"
    example: string;       // "I run every day."
    exampleTranslation: string; // "Eu corro todo dia."
  }>;

  forms?: {
    base?: string;
    past?: string;
    participle?: string;
    plural?: string;
  };

  metadata: {
    // Usando any para suportar tanto Timestamp (Read) quanto FieldValue (Write)
    // e evitar conflitos entre firebase-admin e firebase client sdk
    createdAt: any; 
    updatedAt: any;
  };
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

// 2. O Conteúdo (antigo Podcast) com a Fila de Processamento (Salvo na collection contents)
export interface Content {
  id: string;
  title: string;
  transcript: string;
  transcriptSegments?: TranscriptSegment[];
  audioUrl?: string;
  language?: string;
  level?: CEFRLevel;
  
  // Controle do Fluxo de Criação
  status: "draft" | "analyzing" | "processing_items" | "ready" | "error";

  // IDs dos LearningItems já criados/vinculados
  relatedItemIds: string[]; 

  // A FILA: O Gemini deposita aqui, o Batch processa e remove daqui
  candidatesQueue: Array<Omit<LearningItem, 'id' | 'metadata' | 'language'>>;

  quiz?: Quiz;

  metadata: {
    createdAt: any;
    updatedAt: any;
  };
}

// 3. Conjunto de Itens (ContentSet) - Agrupamento manual ou automático de LearningItems
export interface ContentSet {
  id: string;
  title: string;
  description?: string;
  slug: string;
  language: string;
  level: CEFRLevel;
  tags?: string[];
  imageUrl?: string;
  
  // Lista de IDs dos LearningItems incluídos neste set
  itemIds: string[];
  
  // Contagem para exibição rápida sem ler o array
  itemsCount: number;

  metadata: {
    createdAt: any;
    updatedAt: any;
  };
}

// 4. Quiz Types
export interface QuizQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface QuizSection {
  type: 'vocabulary' | 'grammar' | 'timestamps' | 'context' | 'comprehension';
  questions: QuizQuestion[];
}

export interface Quiz {
  quiz_metadata: {
    title: string;
    level: string;
    dateGenerated: string;
  };
  quiz_sections: QuizSection[];
}
