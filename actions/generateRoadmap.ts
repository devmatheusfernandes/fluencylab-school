"use server";

import { adminDb } from "@/lib/firebase/admin";
import { StudentProfile, Roadmap } from "@/types/students/studentProfile";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
);

export async function generateRoadmapAction(profileId: string) {
  try {
    const profileDoc = await adminDb
      .collection("student-profiles")
      .doc(profileId)
      .get();
    if (!profileDoc.exists) {
      return { success: false, error: "Perfil não encontrado." };
    }
    const profile = profileDoc.data() as StudentProfile;

    if (!profile.generatedPromptPlan) {
      return {
        success: false,
        error: "Prompt de plano não encontrado. Gere o prompt primeiro.",
      };
    }

    // Use Gemini 1.5 Pro for large context
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const systemPrompt = `
      Você é um Especialista em Currículo Pedagógico de Idiomas e IA Educacional.
      Sua tarefa é criar um ROADMAP DE PLANO DE AULAS COMPLETO (6 a 12 meses) para um aluno, baseando-se estritamente no perfil fornecido.
      
      Você receberá um "Prompt de Estratégia" (System Instruction) que descreve o aluno.
      
      SAÍDA OBRIGATÓRIA:
      Você deve retornar APENAS um JSON válido seguindo exatamente esta estrutura:
      
      {
        "profileSummary": "Resumo conciso do perfil pedagógico",
        "objectives": {
          "main": "Objetivo principal",
          "deadline": "X meses/semanas",
          "frequency": "X aulas por semana",
          "startLevel": "CEFR",
          "targetLevel": "CEFR"
        },
        "structure": {
          "totalLessons": number, // Entre 24 e 48
          "estimatedHours": "X horas"
        },
        "lessons": [
          {
            "id": "1",
            "title": "Título da Aula",
            "subject": "Assunto específico",
            "description": "Descrição detalhada do que será trabalhado",
            "lessonObjective": "O que o aluno conseguirá fazer ao final",
            "grammarPoint": "Estrutura gramatical principal (opcional)",
            "vocabulary": ["palavra 1", "palavra 2"], // 10-15 palavras/expressões
            "activities": ["atividade 1", "atividade 2"]
          }
          // ... gere entre 24 e 48 lições conforme a duração
        ],
        "methodology": {
          "progression": ["ponto 1", "ponto 2"],
          "personalization": ["ponto 1", "ponto 2"],
          "skillsBalance": ["ponto 1", "ponto 2"],
          "thematicVocabulary": ["ponto 1", "ponto 2"],
          "grammarContext": ["ponto 1", "ponto 2"]
        },
        "cefrAdaptation": [
          { "level": "A1", "description": "..." },
          // ... incluir níveis relevantes
        ],
        "activityTypes": [
          { "style": "Para alunos visuais", "activities": ["..."] }
          // ... baseados no perfil
        ]
      }
    `;

    const userPrompt = `
      Aqui está a Estratégia Pedagógica do Aluno (Prompt Gerado Anteriormente):
      
      ${profile.generatedPromptPlan}
      
      Com base nisso, gere o ROADMAP JSON completo.
      O plano deve ter entre 24 e 48 lições (aprox. 6-12 meses, 1 aula/semana).
      Seja muito específico e criativo nas aulas, conectando com a profissão e hobbies do aluno.
      Certifique-se de que o JSON esteja bem formatado e completo.
    `;

    const result = await model.generateContent([systemPrompt, userPrompt]);
    const responseText = result.response.text();

    // Clean markdown if present (though responseMimeType should handle it)
    const jsonString = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    let roadmapData;

    try {
      roadmapData = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse JSON:", jsonString);
      return {
        success: false,
        error: "Erro ao processar resposta da IA (JSON inválido).",
      };
    }

    // Add timestamps
    const roadmap: Roadmap = {
      ...roadmapData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Ensure lesson IDs are strings and exist
    if (roadmap.lessons && Array.isArray(roadmap.lessons)) {
      roadmap.lessons = roadmap.lessons.map((l: any, i: number) => ({
        ...l,
        id: l.id || String(i + 1),
      }));
    }

    await adminDb.collection("student-profiles").doc(profileId).update({
      roadmap: roadmap,
      "onboardingStatus.roadmapCreated": true,
      updatedAt: new Date(),
    });

    revalidatePath("/hub/manager/student-profiles");
    revalidatePath(`/hub/manager/student-profiles/${profileId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error generating roadmap:", error);
    return {
      success: false,
      error: error.message || "Erro interno ao gerar roadmap.",
    };
  }
}
