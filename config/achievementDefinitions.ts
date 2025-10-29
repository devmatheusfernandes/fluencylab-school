// services/achievementDefinitions.ts

import { AchievementDefinition } from "@/types/users/achievements";

// Definições de conquistas
export const achievementDefinitions: AchievementDefinition[] = [
  // Conquistas de aulas concluídas
  {
    id: "primeira_aula_concluida",
    name: "Primeira Aula Concluída!",
    description: "Parabéns por concluir sua primeira aula.",
    icon: "🎓",
    languages: ["Ingles", "Espanhol", "Libras", "Portugues", "english", "spanish", "libras", "portuguese"],
    criteria: (user) => {
      // This would check if the user has completed their first class
      return false;
    },
  },
  {
    id: "cinco_aulas_concluidas",
    name: "Cinco Aulas na Conta!",
    description: "Você já concluiu 5 aulas. Continue assim!",
    icon: "🌟",
    languages: ["Ingles", "Espanhol", "Libras", "Portugues", "english", "spanish", "libras", "portuguese"],
    criteria: (user) => {
      // This would check if the user has completed 5 classes
      return false;
    },
  },
  {
    id: "dez_aulas_concluidas",
    name: "Maratona de 10 Aulas!",
    description: "Incrível! 10 aulas concluídas.",
    icon: "🚀",
    languages: ["Ingles", "Espanhol", "Libras", "Portugues", "english", "spanish", "libras", "portuguese"],
    criteria: (user) => {
      // This would check if the user has completed 10 classes
      return false;
    },
  },
  {
    id: "frequencia_perfeita_mes",
    name: "Frequência Perfeita (Mês)",
    description: "Você não perdeu nenhuma aula este mês.",
    icon: "📅",
    languages: ["Ingles", "Espanhol", "Libras", "Portugues", "english", "spanish", "libras", "portuguese"],
    criteria: (user) => {
      // This would check if the user has attended all scheduled classes this month
      return false;
    },
  },
  {
    id: "explorador_de_idiomas",
    name: "Explorador de Idiomas",
    description: "Você está aprendendo mais de um idioma!",
    icon: "🌍",
    languages: ["Ingles", "Espanhol", "Libras", "Portugues", "english", "spanish", "libras", "portuguese"],
    criteria: (user) => {
      // This would check if the user is studying more than one language
      return user?.languages?.length > 1;
    },
  },
  {
    id: "fotogenico",
    name: "Fotogênico",
    description: "Você personalizou seu perfil com uma foto!",
    icon: "📸",
    languages: ["Ingles", "Espanhol", "Libras", "Portugues", "english", "spanish", "libras", "portuguese"],
    criteria: (user) => {
      // This would check if the user has set a profile picture
      return !!user?.avatarUrl && user.avatarUrl.length > 0;
    },
  },
  {
    id: "nao_para_nem_no_fim_de_semana",
    name: "Não Para Nem no Fim de Semana",
    description: "Você estudou durante um fim de semana. Dedicação total!",
    icon: "🏆",
    languages: ["Ingles", "Espanhol", "Libras", "Portugues", "english", "spanish", "libras", "portuguese"],
    criteria: (user) => {
      // This would check if the user had classes on weekends
      return false;
    },
  },
  {
    id: "corujao_da_fluency",
    name: "Corujão da Fluency",
    description: "Você estudou durante a madrugada. Conhecimento não tem hora!",
    icon: "🦉",
    languages: ["Ingles", "Espanhol", "Libras", "Portugues", "english", "spanish", "libras", "portuguese"],
    criteria: (user) => {
      // This would check if the user had classes in the early morning hours
      return false;
    },
  },
  {
    id: "quiz_iniciante",
    name: "Quiz Iniciante",
    description: "Você completou seu primeiro quiz!",
    icon: "❓",
    languages: ["Ingles", "Espanhol", "Libras", "Portugues", "english", "spanish", "libras", "portuguese"],
    criteria: (user) => {
      // This would check if the user has completed their first quiz
      return false;
    },
  },
  {
    id: "quiz_aprendiz",
    name: "Quiz Aprendiz",
    description: "Você já completou 5 quizzes!",
    icon: "❔",
    languages: ["Ingles", "Espanhol", "Libras", "Portugues", "english", "spanish", "libras", "portuguese"],
    criteria: (user) => {
      // This would check if the user has completed 5 quizzes
      return false;
    },
  },
  {
    id: "quiz_mestre",
    name: "Quiz Mestre",
    description: "Você já completou 10 quizzes. Impressionante!",
    icon: "🧩",
    languages: ["Ingles", "Espanhol", "Libras", "Portugues", "english", "spanish", "libras", "portuguese"],
    criteria: (user) => {
      // This would check if the user has completed 10 quizzes
      return false;
    },
  },
];

// Função para obter uma definição de conquista específica por ID
export const getAchievementDefinition = (
  id: string
): AchievementDefinition | undefined => {
  return achievementDefinitions.find((def) => def.id === id);
};