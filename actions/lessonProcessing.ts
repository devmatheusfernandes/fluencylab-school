"use server";

import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { FieldValue, FieldPath } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateSpeech, VOICE_IDS } from "@/services/elevenLabsService";
import {
  Lesson,
  LearningItem,
  LearningStructure,
  CEFRLevel,
  TranscriptSegment,
  Quiz,
  LearningStructureType,
} from "@/types/learning/lesson";

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
);

// Interface para o retorno do JSON do Gemini
interface AnalysisResult {
  level: CEFRLevel;
  vocabulary: Array<Omit<LearningItem, "id" | "metadata" | "language">>;
  structures: Array<Omit<LearningStructure, "id" | "metadata" | "language">>;
}

/**
 * 1. CRIAÇÃO DA LIÇÃO
 */
export async function createLesson(
  title: string,
  language: string,
  contentHtml: string = "",
  audioUrl?: string,
) {
  try {
    const docRef = adminDb.collection("lessons").doc();

    const lesson: Lesson = {
      id: docRef.id,
      title,
      language, // Idioma alvo (ex: 'en')
      content: contentHtml,
      status: "draft",
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
    console.error("Error creating lesson:", error);
    return { success: false, error };
  }
}

/**
 * 7. PODCAST GENERATION (BETA)
 * Gera um diálogo entre Teacher e Student via Gemini, converte para áudio via ElevenLabs
 * e salva no Storage.
 */
export async function generateLessonPodcast(lessonId: string) {
  try {
    const lessonRef = adminDb.collection("lessons").doc(lessonId);
    const snap = await lessonRef.get();

    if (!snap.exists) throw new Error("Lesson not found");
    const data = snap.data() as Lesson;
    const level = data.level || "B1";
    const language = data.language || "en";
    const contentText = data.content.replace(/<[^>]*>?/gm, "");

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // 1. Generate Dialogue Script
    const prompt = `
      Crie um roteiro de podcast educacional curto (max 2 min) sobre o conteúdo da aula abaixo.
      
      PERSONAGENS:
      - Teacher (Sarah): Especialista, paciente, tom de voz acolhedor e calmo.
      - Student (Leo): Curioso, energético, faz perguntas comuns de alunos.

      DIRETRIZES DE ÁUDIO E EXPRESSIVIDADE (CRÍTICO PARA ELEVENLABS V3):
      1. Use TAGS DE EMOÇÃO entre colchetes para sons não verbais onde fizer sentido: [laugh], [sigh], [clears throat], [breath].
      2. Use RETICÊNCIAS (...) para indicar pausas naturais, hesitação ou pensamento (ex: "Deixe-me ver... ah, sim!").
      3. Use LETRAS MAIÚSCULAS para enfatizar palavras importantes (ex: "Isso é MUITO importante").
      4. Ritmo:
         - Teacher: Fala pausada e articulada. Use vírgulas para controlar o ritmo.
         - Student: Mais dinâmico, pode usar hesitações como "hum..." ou "er..." antes de perguntar.

      DIRETRIZES DE IDIOMA:
      - Nível da Aula: ${level}.
      - Idioma Alvo: ${language}.
      - Se Nível A1/A2: Teacher explica em Português, usa exemplos no idioma alvo. Student pergunta em PT.
      - Se Nível B1/B2: Misto. Explicações simples no idioma alvo, dúvidas mais complexas em PT.
      - Se Nível C1/C2: Quase 100% no idioma alvo.

      FORMATO JSON OBRIGATÓRIO (Array):
      [
        { "speaker": "Teacher", "text": "Olá Leo! [breath] Hoje vamos aprender sobre algo FASCINANTE..." },
        { "speaker": "Student", "text": "Oi Sarah! [laugh] Estou animado. O que é isso?" }
      ]

      CONTEÚDO DA AULA:
      """ ${contentText.slice(0, 5000)} """
    `;

    const result = await model.generateContent(prompt);
    const jsonString = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let dialogue: Array<{ speaker: "Teacher" | "Student"; text: string }> = [];
    try {
      dialogue = JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON Parse Error (Podcast):", jsonString);
      throw new Error("Falha ao gerar roteiro do podcast.");
    }

    // 2. Generate Audio Segments
    const audioBuffers: Buffer[] = [];

    for (const turn of dialogue) {
      const voiceId =
        turn.speaker === "Teacher" ? VOICE_IDS.TEACHER : VOICE_IDS.STUDENT;
      const buffer = await generateSpeech(turn.text, voiceId);
      audioBuffers.push(buffer);
      // Optional: Add a small silence buffer between turns if needed
    }

    // 3. Concatenate Audio
    const finalBuffer = Buffer.concat(audioBuffers);

    // 4. Upload to Firebase Storage
    const bucket = adminStorage.bucket(
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    );
    const fileName = `lessons/${lessonId}/podcast_${Date.now()}.mp3`;
    const file = bucket.file(fileName);

    await file.save(finalBuffer, {
      metadata: { contentType: "audio/mpeg" },
    });

    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // 5. Update Lesson
    await lessonRef.update({
      audioUrl: publicUrl,
      "metadata.updatedAt": FieldValue.serverTimestamp(),
    });

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Error generating podcast:", error);
    return { success: false, error };
  }
}

/**
 * 2. ANÁLISE (GERA CANDIDATOS PARA AS FILAS)
 */
export async function analyzeLessonContent(
  lessonId: string,
  contentText: string,
) {
  try {
    // 1. Atualize o status
    const lessonRef = adminDb.collection("lessons").doc(lessonId);
    await lessonRef.update({ status: "analyzing" });

    const lessonSnap = await lessonRef.get();
    const lessonData = lessonSnap.data() as Lesson | undefined;
    const targetLanguage = lessonData?.language || "en"; // O idioma que está sendo ensinado

    // Recupera slugs existentes
    const currentVocabQueue = lessonData?.learningItensQueue || [];
    const existingSlugs = new Set<string>();
    currentVocabQueue.forEach((item: any) => existingSlugs.add(item.slug));

    if (lessonData?.relatedLearningItemIds?.length) {
      const recentIds = lessonData.relatedLearningItemIds.slice(-50);
      const itemsSnap = await adminDb
        .collection("learningItems")
        .where(FieldPath.documentId(), "in", recentIds)
        .get();
      itemsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.slug) existingSlugs.add(data.slug);
      });
    }

    // 2. Configura Prompt Baseado no Idioma
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Detectando contexto: Assumimos que se a aula é de EN, a base é PT (ou vice-versa para este sistema)
    // Se o sistema for expandir, essa lógica pode vir do user profile.
    const isTargetEnglish = targetLanguage === "en";

    const baseLanguageName = isTargetEnglish
      ? "Português Brasileiro"
      : "Inglês";
    const targetLanguageName = isTargetEnglish
      ? "Inglês"
      : "Português Brasileiro";

    // Lista de estruturas permitidas
    const allowedStructures: LearningStructureType[] = [
      "s-v",
      "s-v-o",
      "s-v-p-o",
      "s-av",
      "s-v-adv",
      "s-v-do-io",
      "s-v-o-o",
      "s-av-v-o",
      "s-v-inf",
      "s-v-ing",
      "s-v-o-adv",
      "s-v-o-p-o",
      "s-v-that-s-v-o",
      "s-v-wh",
      "passive-s-v-o",
      "s-modal-v-o",
      "s-v-o-to-v",
      "s-v-o-ing",
      "conditional-zero",
      "conditional-first",
      "conditional-second",
      "conditional-third",
      "relative-clause-def",
      "relative-clause-nondef",
      "s-v-o-which-s-v",
      "mixed-conditional",
      "passive-perfect",
      "cleft-sentence",
      "inversion-negative",
      "s-v-o-participle",
    ];

    const structureTypesList = allowedStructures.join(", ");

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
         - "slug": SE a palavra corresponder a um dos itens de VOCABULÁRIO extraídos (mesmo lemma/raiz), inclua o "slug" correspondente. Isso é CRUCIAL para criar links.
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
                "words": "I am a doctor",
                "order": [
                  { "word": "I", "order": 0, "role": "subject", "slug": "i_pronoun" },
                  { "word": "am", "order": 1, "role": "verb", "slug": "be_verb" },
                  { "word": "a", "order": 2, "role": "article" },
                  { "word": "doctor", "order": 3, "role": "object", "slug": "doctor_noun" }
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
    const cleanedText = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let analysis: AnalysisResult;
    try {
      analysis = JSON.parse(cleanedText);
    } catch (e) {
      console.error("JSON Parse Error", cleanedText);
      throw new Error("Falha ao processar resposta da IA");
    }

    // 5. Filtragem e Salvamento
    const newVocab = analysis.vocabulary.filter(
      (item) => !existingSlugs.has(item.slug),
    );

    await lessonRef.update({
      level: analysis.level,
      learningItensQueue: [...currentVocabQueue, ...newVocab],
      learningStructuresQueue: [
        ...(lessonData?.learningStructuresQueue || []),
        ...analysis.structures,
      ],
      status: "processing_items",
    });

    return {
      success: true,
      vocabCount: newVocab.length,
      structCount: analysis.structures.length,
      level: analysis.level,
    };
  } catch (error) {
    console.error("Error analyzing lesson:", error);
    await adminDb
      .collection("lessons")
      .doc(lessonId)
      .update({ status: "error" });
    return { success: false, error };
  }
}

/**
 * 3. PROCESSAMENTO DE LOTE (BATCH)
 */
export async function processLessonBatch(lessonId: string) {
  try {
    const lessonRef = adminDb.collection("lessons").doc(lessonId);
    const lessonDoc = await lessonRef.get();

    if (!lessonDoc.exists) throw new Error("Lesson not found");
    const data = lessonDoc.data() as Lesson;
    const language = data.language || "en";

    // Filas
    const vocabQueue = data.learningItensQueue || [];
    const structQueue = data.learningStructuresQueue || [];

    if (vocabQueue.length === 0 && structQueue.length === 0) {
      await linkTranscriptToItems(lessonId);
      await lessonRef.update({ status: "reviewing" });
      return { completed: true };
    }

    const batch = adminDb.batch();
    const batchSize = 10;

    let typeProcessed = "";
    let itemsProcessedCount = 0;

    if (vocabQueue.length > 0) {
      // --- Processando Vocabulário ---
      typeProcessed = "vocabulary";
      const itemsToProcess = vocabQueue.slice(0, batchSize);
      const remainingItems = vocabQueue.slice(batchSize);

      const slugs = itemsToProcess.map((i: any) => i.slug);

      // Verifica duplicatas globais
      const existingQuery = await adminDb
        .collection("learningItems")
        .where("slug", "in", slugs)
        .get();

      const existingMap = new Map<string, string>();
      existingQuery.docs.forEach((d) => existingMap.set(d.data().slug, d.id));

      const newIds: string[] = [];

      for (const item of itemsToProcess) {
        if (existingMap.has(item.slug)) {
          newIds.push(existingMap.get(item.slug)!);
        } else {
          const newRef = adminDb.collection("learningItems").doc();
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
        relatedLearningItemIds: FieldValue.arrayUnion(...newIds),
      };

      if (isVocabFinished && isStructFinished) {
        updates.status = "reviewing";
      }

      batch.update(lessonRef, updates);
      itemsProcessedCount = itemsToProcess.length;
    } else {
      // --- Processando Estruturas ---
      typeProcessed = "structure";
      const itemsToProcess = structQueue.slice(0, batchSize);
      const remainingItems = structQueue.slice(batchSize);
      const newIds: string[] = [];

      // 1. Coletar slugs necessários para vincular Vocabulário -> Estrutura
      const neededSlugs = new Set<string>();
      itemsToProcess.forEach((struct: any) => {
        struct.sentences?.forEach((sent: any) => {
          sent.order?.forEach((wordObj: any) => {
            if (wordObj.slug) neededSlugs.add(wordObj.slug);
          });
        });
      });

      // 2. Buscar IDs correspondentes aos Slugs
      const slugToIdMap = new Map<string, string>();
      if (neededSlugs.size > 0) {
        const allSlugs = Array.from(neededSlugs);
        // Firestore 'in' suporta até 30 itens
        for (let i = 0; i < allSlugs.length; i += 30) {
          const chunk = allSlugs.slice(i, i + 30);
          const snap = await adminDb
            .collection("learningItems")
            .where("slug", "in", chunk)
            .select("slug")
            .get();
          snap.forEach((doc) => {
            const d = doc.data();
            if (d.slug) slugToIdMap.set(d.slug, doc.id);
          });
        }
      }

      for (const struct of itemsToProcess) {
        // 3. Enriquecer estrutura com IDs
        const enrichedSentences =
          struct.sentences?.map((sent: any) => {
            // Remove whole_sentence se ainda existir (limpeza)
            const { whole_sentence, ...rest } = sent;

            return {
              ...rest,
              order: sent.order?.map((wordObj: any) => {
                if (wordObj.slug && slugToIdMap.has(wordObj.slug)) {
                  return {
                    ...wordObj,
                    learningItemId: slugToIdMap.get(wordObj.slug),
                  };
                }
                return wordObj;
              }),
            };
          }) || [];

        const newRef = adminDb.collection("learningStructures").doc();
        const newStruct = {
          ...struct,
          sentences: enrichedSentences,
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
        relatedLearningStructureIds: FieldValue.arrayUnion(...newIds),
      };

      if (isStructFinished) {
        updates.status = "reviewing";
      }

      batch.update(lessonRef, updates);
      itemsProcessedCount = itemsToProcess.length;
    }

    await batch.commit();

    const remainingVocabCount =
      vocabQueue.length > 0 ? Math.max(0, vocabQueue.length - batchSize) : 0;
    const remainingStructCount =
      vocabQueue.length === 0
        ? Math.max(0, structQueue.length - batchSize)
        : structQueue.length;

    if (remainingVocabCount === 0 && remainingStructCount === 0) {
      await linkTranscriptToItems(lessonId);
    }

    return {
      completed: remainingVocabCount === 0 && remainingStructCount === 0,
      type: typeProcessed,
      processed: itemsProcessedCount,
      remainingVocab: remainingVocabCount,
      remainingStruct: remainingStructCount,
    };
  } catch (error) {
    console.error("Error processing batch:", error);
    await adminDb
      .collection("lessons")
      .doc(lessonId)
      .update({ status: "error" });
    throw error;
  }
}

/**
 * 4. GERAÇÃO DE QUIZ INTELIGENTE
 */
export async function generateLessonQuiz(lessonId: string) {
  try {
    const lessonRef = adminDb.collection("lessons").doc(lessonId);
    const snap = await lessonRef.get();

    if (!snap.exists) throw new Error("Lesson not found");
    const data = snap.data() as Lesson;
    const targetLang = data.language || "en";
    const level = data.level || "B1";

    // Determina contexto de texto e segmentos
    let textContext = "";
    let segmentsContext = "";

    if (data.transcriptSegments && data.transcriptSegments.length > 0) {
      textContext = data.transcriptSegments.map((s: any) => s.text).join(" ");
      segmentsContext = JSON.stringify(
        data.transcriptSegments.map((s: any) => ({
          start: s.start,
          end: s.end,
          text: s.text,
        })),
        null,
        2,
      );
    } else {
      textContext = data.content.replace(/<[^>]*>?/gm, ""); // Remove HTML
    }

    const hasAudio = !!data.audioUrl;
    const hasSegments =
      !!data.transcriptSegments && data.transcriptSegments.length > 0;
    const includeTimestamps = hasAudio && hasSegments;

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Lógica de Idioma da Pergunta (Suporte para A1/A2)
    const isBeginner = ["A1", "A2"].includes(level);
    const isTargetEnglish = targetLang === "en";

    // --- CONTEXTO DE APRENDIZADO (Vocabulário e Estruturas) ---
    let vocabContext = "";
    let structContext = "";

    if (
      data.relatedLearningItemIds?.length ||
      data.relatedLearningStructureIds?.length
    ) {
      const fetchSubset = async (ids: string[], col: string) => {
        if (!ids?.length) return [];
        const subset = ids.slice(-30); // Limit to 30 for Firestore 'in' query
        const s = await adminDb
          .collection(col)
          .where(FieldPath.documentId(), "in", subset)
          .get();
        return s.docs.map((d) => ({ id: d.id, ...d.data() }));
      };

      const items = await fetchSubset(
        data.relatedLearningItemIds,
        "learningItems",
      );
      const structs = await fetchSubset(
        data.relatedLearningStructureIds,
        "learningStructures",
      );

      vocabContext = items
        .map(
          (i: any) =>
            `- ID: ${i.id} | Termo: ${i.mainText} | Tradução: ${i.meanings?.[0]?.translation}`,
        )
        .join("\n");
      structContext = structs
        .map(
          (s: any) =>
            `- ID: ${s.id} | Exemplo: ${s.sentences?.[0]?.words} | Tipo: ${s.type}`,
        )
        .join("\n");
    }

    // Se for iniciante, instruções em Português. Se avançado, em Inglês.
    const instructionLang = isBeginner
      ? isTargetEnglish
        ? "Português"
        : "Inglês"
      : isTargetEnglish
        ? "Inglês"
        : "Português";

    const prompt = `
      Crie um Quiz educacional baseado no texto de aula fornecido e nos itens de aprendizado listados.
      
      CONFIGURAÇÃO:
      - Nível da Aula: ${level}
      - Idioma Alvo (Aprendizado): ${targetLang}
      - Contexto do Aluno: ${isBeginner ? "Iniciante" : "Intermediário/Avançado"}
      
      ITENS DE APRENDIZADO PRIORITÁRIOS:
      Sempre que possível, crie perguntas que testem estes itens específicos.
      
      VOCABULÁRIO:
      ${vocabContext}
      
      ESTRUTURAS:
      ${structContext}

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
                "explanation": "Explicação breve em ${instructionLang}.",
                "relatedLearningItemId": "ID_DO_ITEM (Opcional, se a pergunta for sobre um item da lista)",
                "relatedLearningStructureId": "ID_DA_ESTRUTURA (Opcional, se a pergunta for sobre uma estrutura)",
                "audioRange": { "start": 15.5, "end": 20.0 } // (Opcional) Apenas para perguntas de áudio/timestamp. Use SEGUNDOS (float).
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
       
       ${
         includeTimestamps
           ? ` 
       3. Seção de Timestamps (5-6 perguntas): 
          - Perguntas sobre o que foi dito em trechos específicos. 
          - Use os timestamps fornecidos abaixo. 
          - IMPORTANTE: Preencha "audioRange" com start/end em SEGUNDOS (ex: 1:30 = 90).
          - O texto da pergunta deve indicar o timestamp para contexto visual, ex: "No trecho 00:15 - 00:20..." 
          - 4 opções de resposta. 
       `
           : ""
       } 
       
       4. Seção de Contexto (5-6 perguntas): 
          - Frases ambíguas, formalidade, expressões idiomáticas. 
          - 4 opções de resposta. 
       
       5. Seção de Compreensão (3-6 perguntas): 
          - Ideias principais, inferência, relação entre conceitos. 
          - 4 opções de resposta.

      Texto da Aula: """ ${textContext.slice(0, 20000)} """

      ${
        includeTimestamps
          ? `
      TIMESTAMPS (Segments):
      """
      ${segmentsContext.slice(0, 15000)}
      """
      `
          : ""
      }
    `;

    const result = await model.generateContent(prompt);
    const jsonString = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const quizData = JSON.parse(jsonString) as Quiz;

    await lessonRef.update({
      quiz: quizData,
      "metadata.updatedAt": FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error generating quiz:", error);
    return { success: false, error };
  }
}

/**
 * 6. VINCULAR TRANSCRIÇÃO A ITENS (POST-PROCESSING)
 * Varre os segmentos de transcrição e adiciona IDs de itens/estruturas encontrados neles.
 */
export async function linkTranscriptToItems(lessonId: string) {
  try {
    const lessonRef = adminDb.collection("lessons").doc(lessonId);
    const lessonSnap = await lessonRef.get();
    if (!lessonSnap.exists) throw new Error("Lesson not found");
    const lesson = lessonSnap.data() as Lesson;

    if (!lesson.transcriptSegments || lesson.transcriptSegments.length === 0) {
      return { success: true, message: "No transcript segments to link" };
    }

    const itemIds = lesson.relatedLearningItemIds || [];
    const structIds = lesson.relatedLearningStructureIds || [];

    if (itemIds.length === 0 && structIds.length === 0) {
      return { success: true, message: "No items to link" };
    }

    // Helper to fetch docs in chunks (Firestore limit 30 for 'in')
    const fetchDocs = async (ids: string[], collection: string) => {
      const docs: any[] = [];
      // Process unique IDs only
      const uniqueIds = Array.from(new Set(ids));

      for (let i = 0; i < uniqueIds.length; i += 30) {
        const chunk = uniqueIds.slice(i, i + 30);
        if (chunk.length === 0) continue;

        const snap = await adminDb
          .collection(collection)
          .where(FieldPath.documentId(), "in", chunk)
          .get();
        docs.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
      return docs;
    };

    const items = await fetchDocs(itemIds, "learningItems");
    const structures = await fetchDocs(structIds, "learningStructures");

    let matchCount = 0;

    const updatedSegments = lesson.transcriptSegments.map((segment) => {
      const segText = segment.text.toLowerCase();
      const matchedItemIds: string[] = [];
      const matchedStructIds: string[] = [];

      // Match Vocabulary
      items.forEach((item) => {
        if (item.mainText && segText.includes(item.mainText.toLowerCase())) {
          matchedItemIds.push(item.id);
        }
      });

      // Match Structures
      structures.forEach((struct) => {
        // Verifica se alguma frase de exemplo da estrutura aparece no segmento
        const matched = struct.sentences?.some(
          (s: any) => s.words && segText.includes(s.words.toLowerCase()),
        );
        if (matched) matchedStructIds.push(struct.id);
      });

      if (matchedItemIds.length > 0 || matchedStructIds.length > 0) {
        matchCount++;
      }

      return {
        ...segment,
        learningItemIds: matchedItemIds.length > 0 ? matchedItemIds : undefined,
        learningStructureIds:
          matchedStructIds.length > 0 ? matchedStructIds : undefined,
      };
    });

    if (matchCount > 0) {
      await lessonRef.update({
        transcriptSegments: updatedSegments,
        "metadata.updatedAt": FieldValue.serverTimestamp(),
      });
    }

    return { success: true, matches: matchCount };
  } catch (error) {
    console.error("Error linking transcript:", error);
    return { success: false, error };
  }
}

/**
 * 5. GERAÇÃO DE TRANSCRIÇÃO (TIMESTAMPS)
 */
export async function generateLessonTranscript(lessonId: string) {
  try {
    const lessonRef = adminDb.collection("lessons").doc(lessonId);
    const snap = await lessonRef.get();
    const data = snap.data() as Lesson;

    if (!data?.audioUrl) throw new Error("No audio URL found");

    const audioResponse = await fetch(data.audioUrl);
    if (!audioResponse.ok) throw new Error("Failed to fetch audio");
    const arrayBuffer = await audioResponse.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" }); // Use o 1.5 Flash explicitamente se possível, é melhor em áudio

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
      4. Não use milissegundos, use segundos.
      5. Para levar em conta o erro, coloque o começo e fim de cada timestamp com uma margem de erro de 1 segundo. Assim, se o áudio começa em 0:04.15, o timestamp deve ser 0:03.15 - 0:05.15.  

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
      { inlineData: { mimeType: "audio/mp3", data: base64Audio } },
    ]);

    const jsonString = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Validar e fazer parse
    let segments: TranscriptSegment[] = [];
    try {
      segments = JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON Parse Error na transcrição:", jsonString);
      // Fallback: Tentar limpar caracteres estranhos se o parse falhar
      const fixedJson = jsonString.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
      segments = JSON.parse(fixedJson);
    }

    await lessonRef.update({
      transcriptSegments: segments,
      "metadata.updatedAt": FieldValue.serverTimestamp(),
    });

    // Link items automatically after generating transcript
    await linkTranscriptToItems(lessonId);

    return { success: true, count: segments.length };
  } catch (error) {
    console.error("Error timestamps:", error);
    return { success: false, error };
  }
}
