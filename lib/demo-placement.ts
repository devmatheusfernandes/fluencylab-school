/**
 * Nivelamento adaptativo (versão de demonstração).
 * Segue a ideia do motor real: habilidades alternadas (gramática, vocabulário, leitura, listening),
 * pontuação Elo que sobe no acerto e desce no erro, e a próxima pergunta escolhida pela dificuldade
 * mais próxima do Elo atual. No fim, o Elo vira um nível CEFR.
 */
import { LESSONS } from "@/lib/demo-library";

export type Skill = "grammar" | "vocabulary" | "reading" | "listening";
export type Cefr = "A1" | "A2" | "B1" | "B2";

export const SKILL_LABEL: Record<Skill, string> = {
  grammar: "Gramática",
  vocabulary: "Vocabulário",
  reading: "Leitura",
  listening: "Compreensão auditiva",
};

export const SKILL_ORDER: Skill[] = ["grammar", "vocabulary", "reading", "listening"];

const ELO: Record<Cefr, number> = { A1: 600, A2: 800, B1: 1000, B2: 1200 };

export type PlacementQuestion = {
  id: string;
  skill: Skill;
  cefr: Cefr;
  elo: number;
  context?: string;
  audio?: string;
  prompt: string;
  options: string[];
  answer: number;
};

function q(id: string, skill: Skill, cefr: Cefr, prompt: string, options: string[], answer: number, extra?: { context?: string; audio?: string }): PlacementQuestion {
  return { id, skill, cefr, elo: ELO[cefr], prompt, options, answer, ...extra };
}

export const QUESTIONS: PlacementQuestion[] = [
  q("g1", "grammar", "A1", "She ___ a teacher.", ["is", "are", "am"], 0),
  q("g2", "grammar", "A2", "Yesterday we ___ to the beach.", ["go", "went", "goed"], 1),
  q("g3", "grammar", "B1", "If it rains tomorrow, I ___ at home.", ["stayed", "would stay", "will stay"], 2),
  q("g4", "grammar", "B2", "I wish I ___ more time to study.", ["have", "had", "will have"], 1),
  q("v1", "vocabulary", "A1", "You use a ___ to write.", ["plate", "pen", "shoe"], 1),
  q("v2", "vocabulary", "A2", "A person who looks after sick people in a hospital is a ___.", ["farmer", "driver", "nurse"], 2),
  q("v3", "vocabulary", "B1", "The opposite of “expensive” is ___.", ["cheap", "heavy", "narrow"], 0),
  q("v4", "vocabulary", "B2", "To ___ a deadline means to fail to finish by the agreed date.", ["reach", "miss", "draw"], 1),
  q("r1", "reading", "A1", "What color is the dog?", ["Black", "White", "Brown"], 2, { context: "Tom has a dog. The dog is brown." }),
  q("r2", "reading", "A2", "When can you NOT visit the museum?", ["On Sundays", "On Mondays", "In the morning"], 0, {
    context: "The museum opens at 9 a.m. and closes at 5 p.m. on weekdays. It is closed on Sundays.",
  }),
  q("r3", "reading", "B1", "Why did Maria walk today?", ["She likes walking", "There was a bus strike", "Her bus was late"], 1, {
    context: "Maria usually takes the bus to work, but today she walked because the buses were on strike.",
  }),
  q("r4", "reading", "B2", "What happened with the policy?", ["It saved money", "It was cancelled", "It had the opposite effect"], 2, {
    context: "Although the new policy was meant to reduce costs, it ended up increasing them in the long run.",
  }),
  q("a1", "listening", "A1", "Where is Anna from?", ["Spain", "Italy", "Brazil"], 2, { audio: "My name is Anna. I am from Brazil." }),
  q("a2", "listening", "A2", "What time does the train leave?", ["7:15", "7:30", "8:30"], 1, { audio: "The train to Rio leaves at half past seven." }),
  q("a3", "listening", "B1", "Why didn't the speaker call?", ["The phone battery died", "They forgot the number", "They were busy"], 0, {
    audio: "I was going to call you, but my phone ran out of battery.",
  }),
  q("a4", "listening", "B2", "What does the speaker mean?", ["They left early", "They didn't know about the traffic", "They love traffic"], 1, {
    audio: "Had I known about the traffic, I would have left earlier.",
  }),
];

export const TEST_LENGTH = 8;
export const START_ELO = 600;

/** Escolhe a próxima pergunta: habilidade da vez, dificuldade mais próxima do Elo. */
export function pickNext(elo: number, answeredIds: string[]): PlacementQuestion | null {
  const skill = SKILL_ORDER[answeredIds.length % SKILL_ORDER.length];
  const pool = QUESTIONS.filter((item) => item.skill === skill && !answeredIds.includes(item.id));
  const source = pool.length ? pool : QUESTIONS.filter((item) => !answeredIds.includes(item.id));
  if (!source.length) return null;
  return source.reduce((best, item) => (Math.abs(item.elo - elo) < Math.abs(best.elo - elo) ? item : best));
}

export function updateElo(elo: number, item: PlacementQuestion, correct: boolean): number {
  const expected = 1 / (1 + 10 ** ((item.elo - elo) / 400));
  return Math.round(elo + 160 * ((correct ? 1 : 0) - expected));
}

export function levelFromElo(elo: number): string {
  if (elo < 700) return "A1";
  if (elo < 900) return "A2";
  if (elo < 1100) return "B1";
  if (elo < 1300) return "B2";
  return "C1";
}

export type PlacementResult = {
  elo: number;
  level: string;
  skills: Record<Skill, { right: number; total: number }>;
};

export function emptySkills(): PlacementResult["skills"] {
  return {
    grammar: { right: 0, total: 0 },
    vocabulary: { right: 0, total: 0 },
    reading: { right: 0, total: 0 },
    listening: { right: 0, total: 0 },
  };
}

/** Perfil gerado a partir do resultado: pontos fortes e a habilidade que mais precisa de atenção. */
export function profileFrom(result: PlacementResult) {
  const ranked = SKILL_ORDER.map((skill) => {
    const { right, total } = result.skills[skill];
    return { skill, score: total ? right / total : 0.5 };
  }).sort((a, b) => b.score - a.score);
  const strongest = ranked[0].skill;
  const weakest = ranked[ranked.length - 1].skill;
  return { strongest, weakest, ranked };
}

export type PlanWeek = { n: number; theme: string; focus: Skill; lessons: string[]; daily: string };

const THEMES: Record<string, string[]> = {
  A1: ["Apresentações e rotina", "Comida e compras", "Lugares e direções", "Presente simples na prática"],
  A2: ["Passado simples", "Viagens e transporte", "Falar de planos", "Descrever pessoas e lugares"],
  B1: ["Condicionais e futuro", "Saúde e situações do dia a dia", "Phrasal verbs essenciais", "Contar experiências"],
  B2: ["Opiniões e debates", "Linguagem formal", "Estruturas avançadas", "Entender nativos"],
  C1: ["Nuance e sutileza", "Debate de temas atuais", "Escrita sofisticada", "Compreensão de sotaques"],
};

/** Plano de 4 semanas: lições da biblioteca no nível do aluno, reforçando a habilidade mais fraca. */
export function buildPlan(level: string, weakest: Skill): PlanWeek[] {
  const themes = THEMES[level] ?? THEMES.B1;
  const own = LESSONS.filter((l) => l.level === level);
  const pool = own.length ? own : LESSONS.filter((l) => l.level === "B1");
  const order: Skill[] = [weakest, ...SKILL_ORDER.filter((s) => s !== weakest)];
  return themes.map((theme, index) => ({
    n: index + 1,
    theme,
    focus: order[index % order.length],
    lessons: [pool[index % pool.length].title, pool[(index + 1) % pool.length].title],
    daily: index % 2 === 0 ? "Revisão espaçada (10 min) + 1 jogo de imersão" : "Revisão espaçada (10 min) + exercício do caderno",
  }));
}
