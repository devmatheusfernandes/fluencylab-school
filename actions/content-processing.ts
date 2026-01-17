'use server';

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue, FieldPath } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Content, LearningItem, CEFRLevel, TranscriptSegment, Quiz } from '@/types/content';
import { quizSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

interface AnalysisResult {
  level: CEFRLevel;
  items: Array<Omit<LearningItem, 'id' | 'metadata' | 'language'>>;
}

export async function generateCandidates(contentId: string, transcript: string) {
  try {
    // 1. Atualize o status do content para 'analyzing'
    const contentRef = adminDb.collection('contents').doc(contentId);
    await contentRef.update({
      status: 'analyzing',
    });

    const contentSnap = await contentRef.get();
    const contentData = contentSnap.data() as Content | undefined;
    const contentLanguage = contentData?.language || 'en';

    const currentQueue = contentData?.candidatesQueue || [];
    const relatedItemIds = contentData?.relatedItemIds || [];
    const existingSlugs = new Set<string>();

    currentQueue.forEach((item: any) => existingSlugs.add(item.slug));

    if (relatedItemIds.length > 0) {
      const recentIds = relatedItemIds.slice(-100);
      const itemsSnap = await adminDb.collection('learningItems')
        .where(FieldPath.documentId(), 'in', recentIds)
        .get();
      
      itemsSnap.forEach(doc => {
        const data = doc.data();
        if (data.slug) existingSlugs.add(data.slug);
      });
    }

    const ignoredList = Array.from(existingSlugs).join(', ');

    // 2. Instancie o modelo Gemini Flash
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const isPortugueseBaseLanguage = contentLanguage === 'pt';

    const intro = isPortugueseBaseLanguage
      ? `Você é um linguista especialista em ensino de idiomas (Português para falantes de Inglês). Sua tarefa é extrair vocabulário estruturado de textos em Português e determinar o nível CEFR geral. As traduções devem ser para o Inglês.`
      : `Você é um linguista especialista em ensino de idiomas (Inglês para falantes de Português). Sua tarefa é extrair vocabulário estruturado de textos em Inglês e determinar o nível CEFR geral. As traduções devem ser para o Português do Brasil.`;

    const translationInstruction = isPortugueseBaseLanguage
      ? `Tradução: Inglês (EN).`
      : `Tradução: Português do Brasil (PT-BR).`;

    const exampleBlock = isPortugueseBaseLanguage
      ? `{
  "level": "B1",
  "items": [
    {
      "slug": "de_ferias_expression",
      "mainText": "de férias",
      "type": "expression",
      "level": "A2",
      "phonetic": "/dʒi ˈfeɾias/",
      "meanings": [
        {
          "context": "lazer/viagem",
          "definition": "período em que alguém está descansando do trabalho ou dos estudos",
          "translation": "on vacation",
          "example": "Ele está de férias este mês.",
          "exampleTranslation": "He is on vacation this month."
        }
      ],
      "forms": { "base": "de férias" }
    }
  ]
}`
      : `{
  "level": "B1",
  "items": [
    {
      "slug": "run_verb",
      "mainText": "run",
      "type": "verb",
      "level": "A1",
      "phonetic": "/rʌn/",
      "meanings": [
        {
          "context": "physical activity",
          "definition": "move fast by foot",
          "translation": "correr",
          "example": "I run fast",
          "exampleTranslation": "Eu corro rápido"
        },
        {
          "context": "management",
          "definition": "to manage or operate something",
          "translation": "administrar",
          "example": "She runs a big company",
          "exampleTranslation": "Ela administra uma grande empresa"
        }
      ],
      "forms": { "base": "run", "past": "ran", "participle": "run" }
    }
  ]
}`;

    // 3. Prompt de extração
    const prompt = `
${intro}

User Prompt:

Analise a transcrição abaixo. 
1. Determine o nível CEFR geral do texto (A1, A2, B1, B2, C1, ou C2).
2. Extraia os itens de aprendizado mais relevantes.

Regras de Extração:

Slug: Gere um ID único para cada termo no formato maintext_type (tudo minúsculo, espaços viram underline). Ex: run_verb, give_up_phrasal_verb, blue_adjective.

Types: Use estritamente: noun, verb, adjective, adverb, preposition, pronoun, phrasal_verb, idiom, expression, slang, connector.

Contexto (IMPORTANTE): 
- Se uma palavra tiver múltiplos significados RELEVANTES no contexto geral ou comum, adicione múltiplos objetos no array "meanings".
- Tente fornecer pelo menos 1 significado principal, mas sinta-se à vontade para adicionar outros se forem úteis para um aluno desse nível.
- Definições e exemplos devem ser claros.

${translationInstruction}

Verbos: Se for verbo, preencha o campo forms. Se for Noun preencha também, mas apenas com o plural dele.

Saída Obrigatória: Retorne APENAS um JSON Object válido (sem markdown), com a seguinte estrutura:

${exampleBlock}

Transcrição: """ ${transcript} """
    `;

    // 4. Pedir o JSON
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. Faça o parse da resposta
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(cleanedText) as AnalysisResult;

    const trulyNewItems = analysis.items.filter(item => !existingSlugs.has(item.slug));

    const latestSnap = await contentRef.get();
    const latestQueue = latestSnap.data()?.candidatesQueue || [];
    const latestSlugs = new Set(latestQueue.map((i: any) => i.slug));

    const finalNewItems = trulyNewItems.filter(item => !latestSlugs.has(item.slug));

    // 6. Salve o array resultante no campo candidatesQueue e o nível detectado
    // 7. Mude o status para 'processing_items'
    await contentRef.update({
      level: analysis.level,
      candidatesQueue: [...latestQueue, ...finalNewItems],
      status: 'processing_items',
    });

    return { success: true, count: finalNewItems.length, level: analysis.level };

  } catch (error) {
    console.error('Error generating candidates:', error);
    await adminDb.collection('contents').doc(contentId).update({
      status: 'error',
    });
    return { success: false, count: 0, error };
  }
}

export async function processBatch(contentId: string) {
  try {
    const contentRef = adminDb.collection('contents').doc(contentId);
    
    // 1. Busque o doc do content
    const contentDoc = await contentRef.get();
    if (!contentDoc.exists) {
      throw new Error('Content not found');
    }

    const contentData = contentDoc.data() as Content;
    const language = contentData.language || 'en';
    const candidatesQueue = contentData.candidatesQueue || [];

    // 2. Verifique o array candidatesQueue
    if (candidatesQueue.length === 0) {
      await contentRef.update({
        status: 'ready',
      });
      return { completed: true };
    }

    // 3. Processamento (Lote de 10)
    const batchSize = 10;
    const itemsToProcess = candidatesQueue.slice(0, batchSize);
    const remainingItems = candidatesQueue.slice(batchSize);

    const slugs = itemsToProcess.map(item => item.slug);

    // 4. Deduplicação
    const existingItemsQuery = await adminDb.collection('learningItems')
      .where('slug', 'in', slugs)
      .get();

    const existingItemsMap = new Map<string, string>(); // slug -> id
    existingItemsQuery.docs.forEach(doc => {
      const data = doc.data();
      existingItemsMap.set(data.slug, doc.id);
    });

    // 5. Batch Write
    const batch = adminDb.batch();
    const newRelatedItemIds: string[] = [];

    for (const item of itemsToProcess) {
      if (existingItemsMap.has(item.slug)) {
        // Se o slug já existe, usamos o ID existente
        const existingId = existingItemsMap.get(item.slug)!;
        newRelatedItemIds.push(existingId);
        
        // Opcional: Poderíamos atualizar o item existente com novos contextos (meanings) se não existirem
        // Mas por simplicidade, vamos apenas vincular por enquanto.
      } else {
        // Se o slug não existe, criamos novo
        const newItemRef = adminDb.collection('learningItems').doc();
        const newItem: LearningItem = {
          ...item,
          id: newItemRef.id,
          language,
          metadata: {
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
        } as any; 

        batch.set(newItemRef, newItem);
        newRelatedItemIds.push(newItemRef.id);
      }
    }

    batch.update(contentRef, {
      candidatesQueue: remainingItems,
      relatedItemIds: FieldValue.arrayUnion(...newRelatedItemIds),
    });

    await batch.commit();

    return { 
      completed: false, 
      itemsProcessed: itemsToProcess.length, 
      itemsLeft: remainingItems.length 
    };

  } catch (error) {
    console.error('Error processing batch:', error);
    await adminDb.collection('contents').doc(contentId).update({
      status: 'error',
    });
    throw error;
  }
}

export async function createContent(title: string, transcript: string, language: string, audioUrl?: string) {
  try {
    const docRef = adminDb.collection('contents').doc();
    const content: Content = {
      id: docRef.id,
      title,
      transcript,
      language,
      status: 'draft',
      relatedItemIds: [],
      candidatesQueue: [],
      metadata: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    };

    if (audioUrl) {
      content.audioUrl = audioUrl;
    }

    await docRef.set(content);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating content:', error);
    return { success: false, error };
  }
}

// Zod Schemas for Quiz Validation
const QuizQuestionSchema = z.object({
  text: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().min(0).max(3),
  explanation: z.string().optional(),
});

const QuizSectionSchema = z.object({
  type: z.enum(['vocabulary', 'grammar', 'timestamps', 'context', 'comprehension']),
  questions: z.array(QuizQuestionSchema),
});

const QuizSchema = z.object({
  quiz_metadata: z.object({
    title: z.string(),
    level: z.string(),
    dateGenerated: z.string(),
  }),
  quiz_sections: z.array(QuizSectionSchema),
});

export async function generateQuiz(contentId: string) {
  try {
    const contentRef = adminDb.collection('contents').doc(contentId);
    const contentSnap = await contentRef.get();
    
    if (!contentSnap.exists) {
      throw new Error('Content not found');
    }

    const contentData = contentSnap.data() as Content;
    const level = contentData.level || 'B1'; // Default to B1 if not set
    
    const hasAudio = !!contentData.audioUrl;
    const hasSegments = !!contentData.transcriptSegments && contentData.transcriptSegments.length > 0;
    const includeTimestamps = hasAudio && hasSegments;

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
      Você é um especialista em criação de material didático de idiomas.
      Crie um Quiz estruturado baseado no texto fornecido.
      
      Nível Alvo: ${level} (CEFR)
      Idioma do Texto: ${contentData.language || 'en'}
      
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
      
      Formato de Saída JSON:
      {
        "quiz_metadata": {
          "title": "Quiz: ${contentData.title}",
          "level": "${level}",
          "dateGenerated": "${new Date().toISOString()}"
        },
        "quiz_sections": [
          {
            "type": "vocabulary", // ou grammar, timestamps, context, comprehension
            "questions": [
              {
                "text": "Pergunta aqui",
                "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
                "correctIndex": 0, // Índice da resposta correta (0-3)
                "explanation": "Explicação breve (opcional)"
              }
            ]
          }
        ]
      }
      
      Conteúdo do Texto:
      """
      ${contentData.transcript}
      """
      
      ${includeTimestamps ? `
      Segmentos de Timestamp disponíveis:
      ${JSON.stringify(contentData.transcriptSegments?.slice(0, 50))} // Limitando para não estourar contexto se for muito grande
      ` : ''}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const quizData = JSON.parse(jsonString);
    
    // Validate with Zod
    const validatedQuiz = QuizSchema.parse(quizData);

    // Save to Firestore
    await contentRef.update({
      quiz: validatedQuiz,
      'metadata.updatedAt': FieldValue.serverTimestamp(),
    });

    return { success: true, quiz: validatedQuiz };

  } catch (error) {
    console.error('Error generating quiz:', error);
    return { success: false, error };
  }
}

export async function updateQuiz(contentId: string, quiz: Quiz) {
  try {
    const contentRef = adminDb.collection('contents').doc(contentId);
    
    // Validate with Zod before saving
    const validatedQuiz = quizSchema.parse(quiz);

    await contentRef.update({
      quiz: validatedQuiz,
      'metadata.updatedAt': FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating quiz:', error);
    return { success: false, error };
  }
}

export async function generateTranscriptWithTimestamps(contentId: string) {
  try {
    const contentRef = adminDb.collection('contents').doc(contentId);
    const contentSnap = await contentRef.get();
    const contentData = contentSnap.data() as Content | undefined;
    const contentLanguage = contentData?.language || 'en';

    if (!contentData?.audioUrl) {
      throw new Error('No audio URL found');
    }

    // Fetch audio
    const audioResponse = await fetch(contentData.audioUrl);
    if (!audioResponse.ok) throw new Error('Failed to fetch audio');
    const arrayBuffer = await audioResponse.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
You are a speech transcription assistant.

The content metadata language is "${contentLanguage}".
The audio may be in English or Portuguese.

Requirements:
- Detect automatically whether the audio is in English or Portuguese.
- Transcribe in the SAME language as the audio. Do NOT translate.
- Split the transcript into segments with precise timestamps.

Output format:
- Return ONLY a valid JSON array (no markdown, no explanations), for example:
[
  {
    "start": 0.0,
    "end": 2.5,
    "text": "Olá, bem-vindo à aula de hoje."
  }
]

Rules:
- "start" and "end" must be numbers in seconds (not strings).
- Segments must be ordered by time and non-overlapping.
- "text" must contain only what is spoken in that time range, in the original language.
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'audio/mp3', 
          data: base64Audio
        }
      }
    ]);

    const responseText = result.response.text();
    // Clean markdown code blocks if any
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let segments: TranscriptSegment[] = [];
    try {
        segments = JSON.parse(jsonString);
    } catch (e) {
        console.error('Failed to parse JSON from Gemini:', jsonString);
        throw new Error('Invalid JSON response from Gemini');
    }

    await contentRef.update({
      transcriptSegments: segments,
      'metadata.updatedAt': FieldValue.serverTimestamp(),
    });

    return { success: true, count: segments.length };

  } catch (error) {
    console.error('Error generating timestamps:', error);
    return { success: false, error };
  }
}
