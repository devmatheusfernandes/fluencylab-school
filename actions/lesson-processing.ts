'use server';

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue, FieldPath } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  Lesson, 
  LearningItem, 
  LearningStructure, 
  CEFRLevel, 
  TranscriptSegment, 
  Quiz,
  LearningStructureType 
} from '@/types/lesson';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Interface para o retorno do JSON do Gemini
interface AnalysisResult {
  level: CEFRLevel;
  vocabulary: Array<Omit<LearningItem, 'id' | 'metadata' | 'language'>>;
  structures: Array<Omit<LearningStructure, 'id' | 'metadata' | 'language'>>;
}

/**
 * 1. CRIAÇÃO DA LIÇÃO
 */
export async function createLesson(title: string, language: string, contentHtml: string = '', audioUrl?: string) {
  try {
    const docRef = adminDb.collection('lessons').doc();
    
    const lesson: Lesson = {
      id: docRef.id,
      title,
      language, // Idioma alvo (ex: 'en')
      content: contentHtml, 
      status: 'draft',
      relatedLearningItemIds: [],
      relatedLearningStructureIds: [],
      learningItensQueue: [],
      learningStructuresQueue: [],
      metadata: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    };

    if (audioUrl) {
      lesson.audioUrl = audioUrl;
    }

    await docRef.set(lesson);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating lesson:', error);
    return { success: false, error };
  }
}

/**
 * 2. ANÁLISE (GERA CANDIDATOS PARA AS FILAS)
 */
export async function analyzeLessonContent(lessonId: string, contentText: string) {
  try {
    // 1. Atualize o status
    const lessonRef = adminDb.collection('lessons').doc(lessonId);
    await lessonRef.update({ status: 'analyzing' });

    const lessonSnap = await lessonRef.get();
    const lessonData = lessonSnap.data() as Lesson | undefined;
    const targetLanguage = lessonData?.language || 'en'; // O idioma que está sendo ensinado

    // Recupera slugs existentes
    const currentVocabQueue = lessonData?.learningItensQueue || [];
    const existingSlugs = new Set<string>();
    currentVocabQueue.forEach((item: any) => existingSlugs.add(item.slug));

    if (lessonData?.relatedLearningItemIds?.length) {
       const recentIds = lessonData.relatedLearningItemIds.slice(-50);
       const itemsSnap = await adminDb.collection('learningItems')
        .where(FieldPath.documentId(), 'in', recentIds)
        .get();
       itemsSnap.forEach(doc => {
         const data = doc.data();
         if (data.slug) existingSlugs.add(data.slug);
       });
    }

    // 2. Configura Prompt Baseado no Idioma
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    
    // Detectando contexto: Assumimos que se a aula é de EN, a base é PT (ou vice-versa para este sistema)
    // Se o sistema for expandir, essa lógica pode vir do user profile.
    const isTargetEnglish = targetLanguage === 'en';
    
    const baseLanguageName = isTargetEnglish ? "Português Brasileiro" : "Inglês";
    const targetLanguageName = isTargetEnglish ? "Inglês" : "Português Brasileiro";

    // Lista de estruturas permitidas
    const allowedStructures: LearningStructureType[] = [
      's-v', 's-v-o', 's-v-p-o', 's-av', 's-v-adv', 
      's-v-do-io', 's-v-o-o', 's-av-v-o', 's-v-inf', 's-v-ing',
      's-v-o-adv', 's-v-o-p-o', 's-v-that-s-v-o', 's-v-wh',
      'passive-s-v-o', 's-modal-v-o', 's-v-o-to-v', 's-v-o-ing',
      'conditional-zero', 'conditional-first', 'conditional-second', 'conditional-third',
      'relative-clause-def', 'relative-clause-nondef', 's-v-o-which-s-v',
      'mixed-conditional', 'passive-perfect', 'cleft-sentence', 'inversion-negative', 's-v-o-participle'
    ];

    const structureTypesList = allowedStructures.join(', ');

    // 3. Prompt Refinado para Conteúdo Misto (Aula)
    const prompt = `
      Atue como um Especialista em Educação de Idiomas.
      
      CONTEXTO:
      Você está analisando o texto de uma AULA de idiomas.
      - Idioma Alvo (O que está sendo ensinado): ${targetLanguageName}
      - Idioma de Instrução (Explicações): ${baseLanguageName}
      
      TAREFA:
      Analise o texto fornecido e extraia dados estruturados.
      
      1. NÍVEL CEFR: Determine o nível do conteúdo ensinado (A1-C2).
      
      2. VOCABULÁRIO (Extração Inteligente):
         - IGNORE palavras que fazem parte apenas da explicação em ${baseLanguageName}.
         - Extraia palavras/expressões chaves do idioma ${targetLanguageName} que são o foco da aula.
         - Se o texto explica "O verbo to be significa ser/estar", o item é "to be" (target), a tradução é "ser/estar" (base).
         - Use as explicações do texto para preencher o campo "context" e "definition" (no idioma alvo).
         - Slug: formatação snake_case do termo + tipo (ex: to_be_verb).

      3. ESTRUTURAS GRAMATICAIS:
         - Identifique padrões gramaticais do idioma ${targetLanguageName} presentes nos EXEMPLOS da aula.
         - Tipos permitidos: ${structureTypesList}.
         - "words": A frase no idioma alvo.
         - "order": Mapeamento da posição de cada palavra.
         - "role": Classifique a função gramatical de CADA palavra no contexto.
           - Use ESTRITAMENTE um destes valores: subject, verb, object, indirect_object, adjective, adverb, preposition, auxiliary, modal, connector, article, other.

      FORMATO JSON OBRIGATÓRIO:
      {
        "level": "A1",
        "vocabulary": [
          {
            "slug": "unique_id",
            "mainText": "termo no idioma alvo",
            "type": "verb", // ou noun, adjective, etc.
            "level": "A1",
            "phonetic": "/.../",
            "meanings": [
              { 
                "context": "Contexto extraído da explicação da aula", 
                "definition": "Definição no idioma alvo", 
                "translation": "Tradução no idioma base", 
                "example": "Frase de exemplo citada na aula", 
                "exampleTranslation": "Tradução do exemplo" 
              }
            ],
            "forms": { "base": "...", "past": "..." }
          }
        ],
        "structures": [
          {
            "level": "A1",
            "type": "s-v-o",
            "sentences": [
              {
                "whole_sentence": "I am a doctor",
                "words": "I am a doctor",
                "order": [
                  { "word": "I", "order": 0, "role": "subject" },
                  { "word": "am", "order": 1, "role": "verb" },
                  { "word": "a", "order": 2, "role": "article" },
                  { "word": "doctor", "order": 3, "role": "object" }
                ]
              }
            ]
          }
        ]
      }

      CONTEÚDO DA AULA:
      """ ${contentText} """
    `;

    // 4. Chamada AI
    const result = await model.generateContent(prompt);
    const cleanedText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    let analysis: AnalysisResult;
    try {
        analysis = JSON.parse(cleanedText);
    } catch (e) {
        console.error("JSON Parse Error", cleanedText);
        throw new Error("Falha ao processar resposta da IA");
    }

    // 5. Filtragem e Salvamento
    const newVocab = analysis.vocabulary.filter(item => !existingSlugs.has(item.slug));

    await lessonRef.update({
      level: analysis.level,
      learningItensQueue: [...currentVocabQueue, ...newVocab],
      learningStructuresQueue: [...(lessonData?.learningStructuresQueue || []), ...analysis.structures],
      status: 'processing_items',
    });

    return { 
      success: true, 
      vocabCount: newVocab.length, 
      structCount: analysis.structures.length, 
      level: analysis.level 
    };

  } catch (error) {
    console.error('Error analyzing lesson:', error);
    await adminDb.collection('lessons').doc(lessonId).update({ status: 'error' });
    return { success: false, error };
  }
}

/**
 * 3. PROCESSAMENTO DE LOTE (BATCH)
 */
export async function processLessonBatch(lessonId: string) {
  try {
    const lessonRef = adminDb.collection('lessons').doc(lessonId);
    const lessonDoc = await lessonRef.get();
    
    if (!lessonDoc.exists) throw new Error('Lesson not found');
    const data = lessonDoc.data() as Lesson;
    const language = data.language || 'en';

    // Filas
    const vocabQueue = data.learningItensQueue || [];
    const structQueue = data.learningStructuresQueue || [];

    if (vocabQueue.length === 0 && structQueue.length === 0) {
      await lessonRef.update({ status: 'reviewing' });
      return { completed: true };
    }

    const batch = adminDb.batch();
    const batchSize = 10;
    
    let typeProcessed = '';
    let itemsProcessedCount = 0;

    if (vocabQueue.length > 0) {
      // --- Processando Vocabulário ---
      typeProcessed = 'vocabulary';
      const itemsToProcess = vocabQueue.slice(0, batchSize);
      const remainingItems = vocabQueue.slice(batchSize);
      
      const slugs = itemsToProcess.map((i: any) => i.slug);
      
      // Verifica duplicatas globais
      const existingQuery = await adminDb.collection('learningItems')
        .where('slug', 'in', slugs).get();
      
      const existingMap = new Map<string, string>();
      existingQuery.docs.forEach(d => existingMap.set(d.data().slug, d.id));

      const newIds: string[] = [];

      for (const item of itemsToProcess) {
        if (existingMap.has(item.slug)) {
          newIds.push(existingMap.get(item.slug)!);
        } else {
          const newRef = adminDb.collection('learningItems').doc();
          const newItem = {
            ...item,
            id: newRef.id,
            language,
            metadata: {
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
          };
          batch.set(newRef, newItem);
          newIds.push(newRef.id);
        }
      }

      const isVocabFinished = remainingItems.length === 0;
      const isStructFinished = structQueue.length === 0;

      const updates: any = {
        learningItensQueue: remainingItems,
        relatedLearningItemIds: FieldValue.arrayUnion(...newIds)
      };

      if (isVocabFinished && isStructFinished) {
        updates.status = 'reviewing';
      }

      batch.update(lessonRef, updates);
      itemsProcessedCount = itemsToProcess.length;

    } else {
      // --- Processando Estruturas ---
      typeProcessed = 'structure';
      const itemsToProcess = structQueue.slice(0, batchSize);
      const remainingItems = structQueue.slice(batchSize);
      const newIds: string[] = [];

      for (const struct of itemsToProcess) {
        const newRef = adminDb.collection('learningStructures').doc();
        const newStruct = {
          ...struct,
          id: newRef.id,
          language,
          metadata: {
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
        };
        batch.set(newRef, newStruct);
        newIds.push(newRef.id);
      }

      const isStructFinished = remainingItems.length === 0;
      const updates: any = {
        learningStructuresQueue: remainingItems,
        relatedLearningStructureIds: FieldValue.arrayUnion(...newIds)
      };

      if (isStructFinished) {
        updates.status = 'reviewing';
      }

      batch.update(lessonRef, updates);
      itemsProcessedCount = itemsToProcess.length;
    }

    await batch.commit();

    const remainingVocabCount = vocabQueue.length > 0 ? Math.max(0, vocabQueue.length - batchSize) : 0;
    const remainingStructCount = vocabQueue.length === 0 ? Math.max(0, structQueue.length - batchSize) : structQueue.length;

    return { 
      completed: remainingVocabCount === 0 && remainingStructCount === 0, 
      type: typeProcessed,
      processed: itemsProcessedCount,
      remainingVocab: remainingVocabCount,
      remainingStruct: remainingStructCount
    };

  } catch (error) {
    console.error('Error processing batch:', error);
    await adminDb.collection('lessons').doc(lessonId).update({ status: 'error' });
    throw error;
  }
}

/**
 * 4. GERAÇÃO DE QUIZ INTELIGENTE
 */
export async function generateLessonQuiz(lessonId: string) {
  try {
    const lessonRef = adminDb.collection('lessons').doc(lessonId);
    const snap = await lessonRef.get();
    
    if (!snap.exists) throw new Error('Lesson not found');
    const data = snap.data() as Lesson;
    const targetLang = data.language || 'en';
    const level = data.level || 'B1';
    
    // Determina contexto de texto e segmentos
    let textContext = '';
    let segmentsContext = '';

    if (data.transcriptSegments && data.transcriptSegments.length > 0) {
      textContext = data.transcriptSegments.map((s: any) => s.text).join(' ');
      segmentsContext = JSON.stringify(data.transcriptSegments.map((s: any) => ({
        start: s.start,
        end: s.end,
        text: s.text
      })), null, 2);
    } else {
      textContext = data.content.replace(/<[^>]*>?/gm, ''); // Remove HTML
    }

    const hasAudio = !!data.audioUrl;
    const hasSegments = !!data.transcriptSegments && data.transcriptSegments.length > 0;
    const includeTimestamps = hasAudio && hasSegments;

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    // Lógica de Idioma da Pergunta (Suporte para A1/A2)
    const isBeginner = ['A1', 'A2'].includes(level);
    const isTargetEnglish = targetLang === 'en';
    
    // Se for iniciante, instruções em Português. Se avançado, em Inglês.
    const instructionLang = isBeginner 
      ? (isTargetEnglish ? 'Português' : 'Inglês') 
      : (isTargetEnglish ? 'Inglês' : 'Português');

    const prompt = `
      Crie um Quiz educacional baseado no texto de aula fornecido.
      
      CONFIGURAÇÃO:
      - Nível da Aula: ${level}
      - Idioma Alvo (Aprendizado): ${targetLang}
      - Contexto do Aluno: ${isBeginner ? 'Iniciante' : 'Intermediário/Avançado'}
      
      REGRA IMPORTANTE DE IDIOMA:
      - Como o nível é ${level}, o ENUNCIADO das perguntas e a EXPLICAÇÃO devem estar em ${instructionLang}.
      - As OPÇÕES de resposta devem estar no Idioma Alvo (${targetLang}) para testar o conhecimento.
      - Exemplo para A1: "Qual a forma correta do verbo?" (PT) -> Opções: "Am", "Is", "Are" (EN).
      
      ESTRUTURA JSON:
      {
        "quiz_metadata": { 
            "title": "Quiz da Aula", 
            "level": "${level}", 
            "dateGenerated": "${new Date().toISOString()}" 
        },
        "quiz_sections": [
          {
            "type": "vocabulary", // ou grammar, comprehension
            "questions": [
              {
                "text": "Enunciado da pergunta aqui (${instructionLang})", 
                "options": ["Opção 1 (Alvo)", "Opção 2 (Alvo)", "Opção 3 (Alvo)", "Opção 4 (Alvo)"], 
                "correctIndex": 0, 
                "explanation": "Explicação breve em ${instructionLang}."
              }
            ]
          }
        ]
      }
      
      Estrutura do Quiz (Gere estritamente este JSON): 
       
       1. Seção de Vocabulário (5-6 perguntas): 
          - Tradução de palavras individuais e frases completas. 
          - 4 opções de resposta. 
       
       2. Seção de Gramática (5-6 perguntas): 
          - Tempos verbais, concordância, artigos, preposições. 
          - 4 opções de resposta. 
       
       ${includeTimestamps ? ` 
       3. Seção de Timestamps (5-6 perguntas): 
          - Perguntas sobre o que foi dito em trechos específicos. 
          - Use os timestamps fornecidos abaixo. 
          - O texto da pergunta deve indicar o timestamp, ex: "No trecho 00:15 - 00:20..." 
          - 4 opções de resposta. 
       ` : ''} 
       
       4. Seção de Contexto (5-6 perguntas): 
          - Frases ambíguas, formalidade, expressões idiomáticas. 
          - 4 opções de resposta. 
       
       5. Seção de Compreensão (3-6 perguntas): 
          - Ideias principais, inferência, relação entre conceitos. 
          - 4 opções de resposta.

      Texto da Aula: """ ${textContext.slice(0, 20000)} """

      ${includeTimestamps ? `
      TIMESTAMPS (Segments):
      """
      ${segmentsContext.slice(0, 15000)}
      """
      ` : ''}
    `;

    const result = await model.generateContent(prompt);
    const jsonString = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const quizData = JSON.parse(jsonString) as Quiz;
    
    await lessonRef.update({
      quiz: quizData,
      'metadata.updatedAt': FieldValue.serverTimestamp(),
    });

    return { success: true };

  } catch (error) {
    console.error('Error generating quiz:', error);
    return { success: false, error };
  }
}

/**
 * 5. GERAÇÃO DE TRANSCRIÇÃO (TIMESTAMPS)
 */
export async function generateLessonTranscript(lessonId: string) {
  try {
    const lessonRef = adminDb.collection('lessons').doc(lessonId);
    const snap = await lessonRef.get();
    const data = snap.data() as Lesson;

    if (!data?.audioUrl) throw new Error('No audio URL found');

    const audioResponse = await fetch(data.audioUrl);
    if (!audioResponse.ok) throw new Error('Failed to fetch audio');
    const arrayBuffer = await audioResponse.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Use o 1.5 Flash explicitamente se possível, é melhor em áudio

    const prompt = `
      Atue como um transcritor de áudio profissional.
      O áudio é uma aula de idiomas ou diálogo.
      
      TAREFAS:
      1. Transcreva o áudio com precisão, respeitando o idioma falado em cada momento (pode haver mistura de idiomas).
      2. **Identificação de Falantes (Diarização):** Identifique se há mais de uma pessoa falando. 
         - Se possível identificar pelo contexto, use rótulos como "Professor" e "Aluno".
         - Se não, use "Speaker 1", "Speaker 2".
         - Se for apenas uma pessoa (monólogo), use "Speaker".
      3. Gere Timestamps precisos.

      FORMATO JSON OBRIGATÓRIO (Array de objetos):
      [
        { 
          "start": 0.0, 
          "end": 2.5, 
          "speaker": "Professor", 
          "text": "Hello everyone, welcome to the class." 
        },
        { 
          "start": 2.6, 
          "end": 4.0, 
          "speaker": "Aluno", 
          "text": "Hi teacher! How are you?" 
        }
      ]
      
      Retorne APENAS o JSON, sem markdown.
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: 'audio/mp3', data: base64Audio } }
    ]);

    const jsonString = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Validar e fazer parse
    let segments: TranscriptSegment[] = [];
    try {
      segments = JSON.parse(jsonString);
    } catch (e) {
      console.error('JSON Parse Error na transcrição:', jsonString);
      // Fallback: Tentar limpar caracteres estranhos se o parse falhar
      const fixedJson = jsonString.replace(/[\x00-\x1F\x7F-\x9F]/g, ""); 
      segments = JSON.parse(fixedJson);
    }

    await lessonRef.update({
      transcriptSegments: segments,
      'metadata.updatedAt': FieldValue.serverTimestamp(),
    });

    return { success: true, count: segments.length };

  } catch (error) {
    console.error('Error timestamps:', error);
    return { success: false, error };
  }
}
