// types/users/achievements.ts

// Define a estrutura para o status de uma conquista para um aluno específico
export interface StudentAchievement {
  achievementId: string; // ID da definição da conquista
  unlocked: boolean; // Se o aluno desbloqueou esta conquista
  unlockedAt?: number; // Timestamp de quando foi desbloqueada (opcional)
  progress?: number; // Progresso atual para conquistas com etapas (opcional)
  progressMax?: number; // Valor máximo do progresso (opcional)
  language?: string; // Idioma específico ao qual esta conquista se aplica (opcional)
}

// Define a estrutura para uma definição de conquista
export interface AchievementDefinition {
  id: string; // Identificador único (ex: 'primeira_aula', 'dez_aulas')
  name: string; // Nome da conquista (ex: "Primeira Aula Concluída")
  description: string; // Descrição do que é necessário para desbloquear
  icon: string; // Nome ou caminho para um ícone (pode ser um componente React ou URL)
  languages: string[]; // Idiomas aos quais esta conquista se aplica
  criteria: (user: any) => boolean | Promise<boolean>; // Critério pode ser síncrono ou assíncrono
  teacherManaged?: boolean; // Indica se esta conquista é gerenciada pelo professor
}