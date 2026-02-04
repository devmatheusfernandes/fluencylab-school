"use server";

import { adminDb } from "@/lib/firebase/admin";
import { StudentProfile } from "@/types/students/studentProfile";
import { User } from "@/types/users/users";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function generatePromptPlanAction(profileId: string) {
  try {
    // 1. Fetch Student Profile
    const profileDoc = await adminDb.collection("student-profiles").doc(profileId).get();
    if (!profileDoc.exists) {
      return { success: false, error: "Perfil não encontrado." };
    }
    const profile = profileDoc.data() as StudentProfile;

    // 2. Validate Student Association
    if (!profile.studentId) {
      return { success: false, error: "Este perfil não está associado a um aluno (usuário)." };
    }

    // 3. Fetch User (for Contract)
    const userDoc = await adminDb.collection("users").doc(profile.studentId).get();
    if (!userDoc.exists) {
      return { success: false, error: "Usuário associado não encontrado." };
    }
    const user = userDoc.data() as User;

    // 4. Validate Contract
    if (!user.contractStartDate) {
      return { success: false, error: "Aluno sem contrato assinado/válido." };
    }

    // 5. Fetch Placement Result
    const placementQuery = await adminDb
      .collection("placement_results")
      .where("userId", "==", profile.studentId)
      .orderBy("completedAt", "desc")
      .limit(1)
      .get();

    if (placementQuery.empty) {
      return { success: false, error: "Nivelamento não encontrado para este aluno." };
    }
    const placement = placementQuery.docs[0].data();

    // 6. Validate Profile Fields
    const missingFields: string[] = [];
    if (!profile.languageOfInterest) missingFields.push("Idioma de Interesse");
    if (!profile.mainGoals || profile.mainGoals.length === 0) missingFields.push("Objetivo Principal");
    if (!profile.classFrequency) missingFields.push("Frequência de Aulas");
    // professionalArea is optional if user is not employed, check logic if strict validation needed
    // Assuming strict based on request, but maybe conditional? Let's check 'employmentStatus'
    if (profile.employmentStatus === 'employed' && !profile.professionalArea) missingFields.push("Área Profissional");
    
    if (!profile.hobbies || profile.hobbies.length === 0) missingFields.push("Interesses/Hobbies");
    if (!profile.contentConsumption) missingFields.push("Consumo de Conteúdo");
    if (!profile.difficulties || profile.difficulties.length === 0) missingFields.push("Dificuldades");
    if (!profile.activityPreferences) missingFields.push("Preferências de Atividades");

    if (missingFields.length > 0) {
      return { 
        success: false, 
        error: `Faltam informações no perfil: ${missingFields.join(", ")}` 
      };
    }

    // 7. Prepare Data for AI
    const studentData = {
      profile: {
        name: profile.name,
        age: profile.age,
        level: placement.assignedLevel || profile.level || "Unknown",
        languageOfInterest: profile.languageOfInterest,
        mainGoals: profile.mainGoals,
        contractTerm: user.contractLengthMonths ? `${user.contractLengthMonths} meses` : "Indefinido",
        classFrequency: profile.classFrequency,
        employmentStatus: profile.employmentStatus,
        professionalArea: profile.professionalArea,
        professionalSector: profile.professionalSector,
        technicalVocabulary: profile.technicalVocabulary,
        hobbies: profile.hobbies,
        hobbiesDetails: profile.hobbiesDetails,
        contentConsumption: profile.contentConsumption,
        contentTypes: profile.contentTypes,
        contentDetails: profile.contentDetails,
        difficulties: profile.difficulties,
        activityPreferences: profile.activityPreferences,
        learningMethods: profile.learningMethods,
        speakingAnxiety: profile.speakingAnxiety
      }
    };

    // 8. Construct Prompt
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Você é um Especialista em Engenharia de Prompt e Pedagogia Avançada.
      Sua tarefa NÃO é criar o plano de aula.
      Sua tarefa é analisar as respostas de um questionário de aluno e ESCREVER UM PROMPT OTIMIZADO (System Instruction) que será usado por outra IA para gerar o plano final.

      ### SEUS OBJETIVOS
      1. **Analisar o Perfil:** Extraia os dados cruciais do questionário (Nível, Profissão, Interesses Reais, Dificuldades).
      2. **Aplicar a Lógica da Skill:** Baseado na profissão do aluno, defina quais áreas de vocabulário técnico devem ser priorizadas. Baseado nos hobbies, defina as metodologias.
      3. **Gerar o "Mega-Prompt":** Escreva um comando estruturado que garanta que a próxima IA não tenha dúvidas do que fazer.

      ---

      ### BASE DE CONHECIMENTO (Regras da Metodologia)

      **1. Vocabulário por Área (Prioridade Alta):**
      - TI: debugging, agile, code reviews, system architecture.
      - Business: negotiations, cold calls, quarterly reports.
      - Saúde: patient care, medical terminology, clinical trials.
      - (Se a profissão for outra, infira o vocabulário técnico mais relevante).

      **2. Estrutura CEFR:**
      - A1/A2: Sobrevivência, frases curtas, input compreensível.
      - B1/B2: Fluência, phrasal verbs, situações de trabalho complexas.
      - C1/C2: Nuances, cultura, refinamento acadêmico/profissional.

      **3. Personalização:**
      - Visual: Vídeos, flashcards, infográficos.
      - Auditivo: Podcasts, músicas, repetição.
      - Tímido/Ansioso: Foco inicial em writing/reading, role-plays controlados.
      - Comunicativo: Foco total em speaking/debates.

      ---

      ### ENTRADA DE DADOS (O Questionário Preenchido)
      
      ${JSON.stringify(studentData, null, 2)}

      ---

      ### FORMATO DE SAÍDA ESPERADO (O Prompt Gerado)
      
      Gere APENAS o texto do prompt abaixo, substituindo os campos variáveis pelos dados analisados. O texto deve começar com "Você é o Gerador de Planos de Aula Sênior..."

      Exemplo de Saída:
      
      Você é o Gerador de Planos de Aula Sênior. Siga estritamente esta estratégia pedagógica para o aluno **[NOME]**:

      1. **Perfil do Aluno:**
         - **Nível:** [NÍVEL] -> Meta: [PRÓXIMO NÍVEL].
         - **Profissão:** [PROFISSÃO].
         - **Vocabulário Obrigatório:** Você DEVE incluir nas aulas termos como: *[LISTA DE TERMOS TÉCNICOS ESPECÍFICOS]*.
         - **Interesses Chave:** [INTERESSES].

      2. **Diretrizes de Personalização:**
         - **Metodologia:** [METODOLOGIA INFERIDA]. [EXEMPLO PRÁTICO].
         - **O que EVITAR:** [O QUE EVITAR BASEADO NO PERFIL].
         - **Conteúdo Real:** [SUGESTÃO DE CONTEÚDO].

      3. **Estrutura do Curso:**
         - **Duração:** [DURAÇÃO CONTRATO].
         - **Frequência:** [FREQUÊNCIA].

      4. **Comando de Execução:**
         Gere um JSON válido onde cada objeto \`lesson\` contenha uma \`activity\` conectando o tema gramatical com um conceito de [ÁREA DE INTERESSE] ou [PROFISSÃO].
    `;

    // 9. Call AI
    const result = await model.generateContent(prompt);
    const generatedText = result.response.text();

    // 10. Save to Profile
    const currentHistory = profile.promptHistory || [];
    
    // If there is an existing prompt but no history yet, we should add it first
    if (profile.generatedPromptPlan && currentHistory.length === 0) {
      currentHistory.push({
        content: profile.generatedPromptPlan,
        createdAt: profile.updatedAt ? new Date(profile.updatedAt).toISOString() : new Date().toISOString()
      });
    }

    // Add the new prompt to history
    const newEntry = {
      content: generatedText,
      createdAt: new Date().toISOString()
    };
    
    // Create new array with all history + new entry
    const updatedHistory = [...currentHistory, newEntry];

    await adminDb.collection("student-profiles").doc(profileId).update({
      generatedPromptPlan: generatedText,
      promptHistory: updatedHistory,
      updatedAt: new Date()
    });

    revalidatePath("/hub/manager/student-profiles");
    return { success: true, prompt: generatedText };

  } catch (error: any) {
    console.error("Error generating prompt plan:", error);
    return { success: false, error: error.message || "Erro interno ao gerar plano." };
  }
}
