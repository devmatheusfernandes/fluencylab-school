import { Level, Question } from "../types/placement/types";

export const MAX_QUESTIONS = 20;
export const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const SKILL_PAGE_SIZE = 5;

export const LEVEL_SCORES: Record<Level, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

export const getMacroSkill = (topic: string) => {
  const t = topic.toLowerCase();
  if (t.includes("listening")) return "Listening";
  if (
    t.includes("vocabulary") ||
    t.includes("word-formation") ||
    t.includes("collocations") ||
    t.includes("idioms") ||
    t.includes("lexis")
  )
    return "Vocabulário";
  if (t.includes("pronunciation") || t.includes("phonology"))
    return "Pronúncia";
  if (t.includes("reading") || t.includes("comprehension")) return "Leitura";
  if (t.includes("writing")) return "Escrita";
  if (t.includes("speaking") || t.includes("conversation") || t.includes("oral"))
    return "Speaking";
  return "Gramática";
};

export const getNextLevel = (
  currentLevel: Level,
  isLastAnswerCorrect: boolean
): Level => {
  const currentIndex = LEVELS.indexOf(currentLevel);
  if (isLastAnswerCorrect) {
    return LEVELS[Math.min(LEVELS.length - 1, currentIndex + 1)];
  } else {
    return LEVELS[Math.max(0, currentIndex - 1)];
  }
};

export const selectNextQuestion = (
  targetLevel: Level,
  usedIds: string[],
  questionPool: Record<Level, Question[]>
): Question | null => {
  const targetIndex = LEVELS.indexOf(targetLevel);
  const sortedLevels = [...LEVELS].sort((a, b) => {
    const distA = Math.abs(LEVELS.indexOf(a) - targetIndex);
    const distB = Math.abs(LEVELS.indexOf(b) - targetIndex);
    return distA - distB;
  });

  for (const level of sortedLevels) {
    const availableQuestions = questionPool[level].filter(
      (q) => !usedIds.includes(q.id)
    );
    if (availableQuestions.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * availableQuestions.length
      );
      return availableQuestions[randomIndex];
    }
  }
  return null;
};
