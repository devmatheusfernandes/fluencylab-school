
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

  // Tipos permitidos para categorização de estrutura
  export type LearningStructureType = 
  //A1
  |'s-v'        // Subject + Verb → "I run."
  |'s-v-o'      // Subject + Verb + Object → "She eats apples."
  |'s-v-p-o'    // Subject + Verb + Preposition + Object → "He listens to music."
  |'s-av'       // Subject + Adjective + Verb → "She is happy."
  |'s-v-adv'    // Subject + Verb + Adverb → "They speak well."

  //A2
  |'s-v-do-io'  // Subject + Verb + Direct Object + Indirect Object → "She gave me a gift."
  |'s-v-o-o'    // Subject + Verb + Object + Object → "He taught us English."
  |'s-av-v-o'   // Subject + Adjective + Verb + Object → "She is ready to start."
  |'s-v-inf'    // Subject + Verb + Infinitive → "I want to eat."
  |'s-v-ing'    // Subject + Verb + Gerund → "She enjoys reading."

  //B1
  |'s-v-o-adv'  // Subject + Verb + Object + Adverb → "She reads books carefully."
  |'s-v-o-p-o'  // Subject + Verb + Object + Prep + Object → "He put the book on the table."
  |'s-v-that-s-v-o' // "I think that she likes coffee."
  |'s-v-wh'     // Pergunta indireta → "I know where he lives."

  //B2
  |'passive-s-v-o'     // Passive voice → "The book was written by her."
  |'s-modal-v-o'      // Modal verbs → "She can solve the problem."
  |'s-v-o-to-v'       // "She asked me to help."
  |'s-v-o-ing'        // "I saw him running."

  //C1
  |'conditional-zero'     // If you heat ice, it melts.
  |'conditional-first'    // If it rains, I will stay home.
  |'conditional-second'   // If I were rich, I would travel.
  |'conditional-third'    // If I had studied, I would have passed.
  |'relative-clause-def'  // The man who lives here...
  |'relative-clause-nondef' // My brother, who lives in Canada...
  |'s-v-o-which-s-v'     // "I bought a car which was very expensive."

  //C2
  |'mixed-conditional'     // If I had listened, I would be better now.
  |'passive-perfect'      // The project has been completed.
  |'cleft-sentence'       // What I need is a break.
  |'inversion-negative'   // Never have I seen such a thing.
  |'s-v-o-participle';     // The man seen yesterday...


export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// 1. O Item de Aprendizado, geralmente uma palavra ou expressão (Salvo na collection 'learningItems')
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

export type GrammaticalRole = 
  | 'subject' 
  | 'verb' 
  | 'object' 
  | 'indirect_object' 
  | 'adjective' 
  | 'adverb' 
  | 'preposition' 
  | 'auxiliary' // para 'do', 'have', 'will' 
  | 'modal'     // para 'can', 'should' 
  | 'connector' 
  | 'article'   // 'a', 'the' 
  | 'other';

// 2. O Item de Aprendizado, geralmente uma palavra ou expressão (Salvo na collection 'learningItems')
export interface LearningStructure {
  id: string;          // ID do Firestore
  language: string;    // "en"
  level: CEFRLevel;
  type: LearningStructureType;
  
  sentences: Array<{ //Serão criadas com base no type (podemos escolher mais de um)
    words: string;    // "I eat a lot" The whole sentence
    order: Array<{ //Assim conseguimos fazer o usuário praticar a ordem das palavras corretamente
      word: string; // "I" | "eat" | "a" | "lot"
      learningItemId?: string; // ID do LearningItem (opcional)
      slug?: string; // Slug temporário para vínculo durante criação
      order: number; // 0 | 1 | 2 | 3
      role: GrammaticalRole;
    }>
  }>;

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
  speaker?: string;
  learningItemIds?: string[];
  learningStructureIds?: string[];
}

// 4. Quiz Types
export interface QuizQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  relatedLearningItemId?: string;
  relatedLearningStructureId?: string;
  audioRange?: {
    start: number;
    end: number;
  };
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


// 3. A Aula com a Fila de Processamento (Salvo na collection 'lessons')
export interface Lesson {
  id: string;
  title: string;
  language: string;
  level?: CEFRLevel;
  content: string; // conteúdo da aula em html
  
  //Caso a aula tenha um áudio ou podcast, os segmentos de transcrição serão aqui
  transcriptSegments?: TranscriptSegment[];
  audioUrl?: string;

  // Controle do Fluxo de Criação
  status: "draft" | "analyzing" | "processing_items" | "reviewing" | "ready" | "error";

  // IDs dos LearningItems já criados/vinculados
  relatedLearningItemIds: string[]; 
  // IDs dos LearningStructures já criados/vinculados
  relatedLearningStructureIds: string[]; 

  // A FILA: O Gemini deposita aqui, o Batch processa e remove daqui
  learningItensQueue: Array<Omit<LearningItem, 'id' | 'metadata' | 'language'>>;
  // A FILA: O Gemini deposita aqui, o Batch processa e remove daqui
  learningStructuresQueue: Array<Omit<LearningStructure, 'id' | 'metadata' | 'language'>>

  quiz?: Quiz;

  metadata: {
    createdAt: any;
    updatedAt: any;
  };
}

