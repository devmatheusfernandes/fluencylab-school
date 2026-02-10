"use server";

import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Lesson, CEFRLevel } from "@/types/learning/lesson";

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
);

const AUDIT_CRITERIA = `
1. Objetivo (2-3 min): Conexão com a realidade e "porquê" do aprendizado.
2. Vocabulário e Gramática (15-20 min): Contextualização, exemplos práticos e contraste linguístico.
3. Contextualização (5-10 min): Uso de mini textos ou diálogos.
4. Prática Guiada (20-30 min): Exercícios com andaime (scaffolding).
5. Conversação Livre (15-20 min): Produção oral autônoma.
6. Consolidação (5 min): Revisão técnica e checklist.
`;

export async function analyzeLessonQuality(lessonId: string) {
  try {
    const lessonRef = adminDb.collection("lessons").doc(lessonId);
    const snap = await lessonRef.get();

    if (!snap.exists) throw new Error("Lesson not found");
    const lesson = snap.data() as Lesson;

    // Remove HTML tags for analysis
    const contentText = lesson.content.replace(/<[^>]*>?/gm, "");

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Atue como um Especialista em Design Instrucional e Mentor de Professores de Idiomas.
      Analise o roteiro de aula abaixo com base na Matriz de Auditoria Pedagógica.

      CRITÉRIOS DE ANÁLISE (MATRIZ):
      ${AUDIT_CRITERIA}

      INSTRUÇÕES:
      1. Analise se cada um dos 6 pilares está presente, parcial ou ausente.
      2. Estime o Nível CEFR (A1-C2) real da aula com base no vocabulário e gramática usados.
      3. Identifique o Idioma Alvo (Target) e o Idioma Base (Base/Instrução).
      4. Verifique a carga horária estimada (se cabe em 45-60min).
      5. Forneça um feedback geral profissional e direto.

      FORMATO JSON OBRIGATÓRIO:
      {
        "isCompliant": boolean, // true se a maioria dos pilares estiver Presente e carga horária ok
        "score": number, // 0 a 100
        "suggestedLevel": "B1", // A1, A2, B1, B2, C1, C2
        "targetLanguage": "Inglês",
        "baseLanguage": "Português",
        "sections": {
          "objective": { "status": "pass|partial|fail", "feedback": "..." },
          "vocabulary": { "status": "pass|partial|fail", "feedback": "..." },
          "contextualization": { "status": "pass|partial|fail", "feedback": "..." },
          "guidedPractice": { "status": "pass|partial|fail", "feedback": "..." },
          "freeConversation": { "status": "pass|partial|fail", "feedback": "..." },
          "consolidation": { "status": "pass|partial|fail", "feedback": "..." }
        },
        "generalFeedback": "Resumo da análise..."
      }

      CONTEÚDO DA AULA:
      """
      ${contentText.slice(0, 30000)}
      """
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const jsonString = result.response.text();
    const analysis = JSON.parse(jsonString);

    // Save to Firestore
    await lessonRef.update({
      qualityAnalysis: {
        ...analysis,
        analyzedAt: new Date().toISOString(),
      },
      // If user hasn't set level/language, suggest them (optional, maybe UI handles this)
      // We don't overwrite user settings automatically unless they are empty
      "metadata.updatedAt": FieldValue.serverTimestamp(),
    });

    return { success: true, analysis };
  } catch (error) {
    console.error("Error analyzing lesson quality:", error);
    return { success: false, error: String(error) };
  }
}

export async function updateLessonAnalysisParams(
  lessonId: string,
  data: {
    suggestedLevel: CEFRLevel;
    targetLanguage: string;
    baseLanguage: string;
    languageCode?: string; // To update the root lesson.language
  },
) {
  try {
    const lessonRef = adminDb.collection("lessons").doc(lessonId);

    const updates: any = {
      "qualityAnalysis.suggestedLevel": data.suggestedLevel,
      "qualityAnalysis.targetLanguage": data.targetLanguage,
      "qualityAnalysis.baseLanguage": data.baseLanguage,
      // Update root level as well
      level: data.suggestedLevel,
      "metadata.updatedAt": FieldValue.serverTimestamp(),
    };

    if (data.languageCode) {
      updates.language = data.languageCode;
    }

    await lessonRef.update(updates);
    return { success: true };
  } catch (error) {
    console.error("Error updating lesson analysis params:", error);
    return { success: false, error: String(error) };
  }
}
